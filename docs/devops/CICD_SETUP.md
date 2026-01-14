# CI/CD Pipeline Setup Guide

This document outlines the CI/CD architecture for Talking Music League (TML).

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                           GitHub Repository                           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   feature/xyz ──PR──▶ develop ──PR+Release──▶ main                   │
│        │                  │                      │                    │
│        │           Auto-deploy              Auto-deploy               │
│        │                  │                      │                    │
│        ▼                  ▼                      ▼                    │
│   Local Dev          Dev Pi                  Prod Pi                  │
│   (your laptop)      192.168.x.x:3081       192.168.4.158:3080       │
│                      dev.tml.local           talking.mattmariani.com  │
│                           │                      │                    │
│                           ▼                      ▼                    │
│                    Supabase Dev             Supabase Prod             │
│                    (new project)            (existing)                │
│                                                                        │
└──────────────────────────────────────────────────────────────────────┘
```

## Branching Strategy

### Branches

| Branch | Purpose | Deploys To | Trigger |
|--------|---------|------------|---------|
| `main` | Production code | Prod Pi | On merge (with release tag) |
| `develop` | Integration/staging | Dev Pi | On push/merge |
| `feature/*` | New features | Local only | Manual |
| `bugfix/*` | Bug fixes | Local only | Manual |
| `hotfix/*` | Urgent prod fixes | Both (via fast-track) | Manual |

### Workflow

1. **Start new work**: Create branch from `develop`
   ```bash
   git checkout develop
   git pull
   git checkout -b feature/my-new-feature
   ```

2. **Develop locally**: Make changes, test on localhost

3. **Push for review**: Push branch and create PR to `develop`
   ```bash
   git push -u origin feature/my-new-feature
   # Create PR on GitHub
   ```

4. **Auto-deploy to dev**: When PR is merged to `develop`, GitHub Actions:
   - Builds the app
   - SSHs to Dev Pi
   - Deploys new version
   - You can test at dev.tml.local (or dev Pi's IP)

5. **Promote to production**: When ready, create PR from `develop` to `main`
   - Create a GitHub Release with version tag (e.g., v1.2.0)
   - GitHub Actions deploys to Prod Pi

## Environment Configuration

### Environment Variables

| Variable | Dev Value | Prod Value |
|----------|-----------|------------|
| `VITE_SUPABASE_URL` | https://xxx-dev.supabase.co | https://xxx-prod.supabase.co |
| `VITE_SUPABASE_ANON_KEY` | dev-anon-key | prod-anon-key |
| `VITE_APP_ENV` | development | production |

### GitHub Secrets (Repository Settings → Secrets)

```
# Dev Environment
DEV_PI_HOST=192.168.4.252
DEV_PI_USER=dietpi
DEV_PI_SSH_KEY=<private key>
DEV_SUPABASE_URL=https://xxx-dev.supabase.co
DEV_SUPABASE_ANON_KEY=xxx

# Prod Environment
PROD_PI_HOST=192.168.4.158
PROD_PI_USER=pi
PROD_PI_SSH_KEY=<private key>
PROD_SUPABASE_URL=https://xxx-prod.supabase.co
PROD_SUPABASE_ANON_KEY=xxx
```

## Hardware Setup

### Dev Raspberry Pi Requirements

- Raspberry Pi 4 (2GB+ RAM recommended) or Pi 5
- microSD card (32GB+)
- Power supply
- Ethernet or WiFi connection
- Same network as your laptop

### Initial Dev Pi Setup

```bash
# 1. Flash Raspberry Pi OS Lite (64-bit) to SD card
# 2. Enable SSH (create empty 'ssh' file in boot partition)
# 3. Connect to network and find IP

# 4. SSH to Pi and install Docker
ssh pi@<dev-pi-ip>
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker pi

# 5. Clone repository
git clone https://github.com/loydmilligan/ml_companion.git
cd ml_companion

# 6. Create environment file
cat > web/.env.local << 'EOF'
VITE_SUPABASE_URL=https://xxx-dev.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_APP_ENV=development
EOF
```

## GitHub Actions Workflows

### File: `.github/workflows/deploy-dev.yml`

Triggers on push to `develop` branch.

```yaml
name: Deploy to Dev

on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Dev Pi
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.DEV_PI_HOST }}
          username: ${{ secrets.DEV_PI_USER }}
          key: ${{ secrets.DEV_PI_SSH_KEY }}
          script: |
            cd ~/ml_companion
            git fetch origin
            git checkout develop
            git pull origin develop

            # Create env file with dev config
            cat > web/.env.local << 'EOF'
            VITE_SUPABASE_URL=${{ secrets.DEV_SUPABASE_URL }}
            VITE_SUPABASE_ANON_KEY=${{ secrets.DEV_SUPABASE_ANON_KEY }}
            VITE_APP_ENV=development
            EOF

            docker compose down
            docker compose build --no-cache
            docker compose up -d

      - name: Health check
        run: |
          sleep 30
          curl -f http://${{ secrets.DEV_PI_HOST }}:3080 || exit 1
```

### File: `.github/workflows/deploy-prod.yml`

Triggers on release published.

```yaml
name: Deploy to Production

on:
  release:
    types: [published]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production  # Requires approval if configured

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Prod Pi
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.PROD_PI_HOST }}
          username: ${{ secrets.PROD_PI_USER }}
          key: ${{ secrets.PROD_PI_SSH_KEY }}
          script: |
            cd ~/ml_companion
            git fetch origin
            git checkout main
            git pull origin main

            docker compose down
            docker compose build --no-cache
            docker compose up -d

      - name: Health check
        run: |
          sleep 30
          curl -f https://talking.mattmariani.com || exit 1

      - name: Notify success
        run: echo "Deployed ${{ github.event.release.tag_name }} to production"
```

## Creating a Release (Production Deploy)

1. **Ensure `develop` is tested and ready**

2. **Create PR from `develop` to `main`**
   ```bash
   # On GitHub, create PR: develop → main
   # Review changes, approve, merge
   ```

3. **Create GitHub Release**
   - Go to Releases → Draft a new release
   - Tag: `v1.2.0` (semantic versioning)
   - Target: `main`
   - Title: `v1.2.0 - Feature Name`
   - Description: Changelog/what's new
   - Publish release

4. **Automatic deployment** triggers on release publish

## Semantic Versioning

Use `MAJOR.MINOR.PATCH` format:

- **MAJOR** (v2.0.0): Breaking changes, major rewrites
- **MINOR** (v1.2.0): New features, backwards compatible
- **PATCH** (v1.2.1): Bug fixes, small improvements

## Rollback Procedure

### Quick Rollback (Prod)
```bash
ssh pi@192.168.4.158
cd ml_companion
git checkout v1.1.0  # Previous version tag
docker compose down && docker compose build && docker compose up -d
```

### Via GitHub Actions
Create a new release pointing to the previous tag, or re-run the deploy workflow for the previous release.

## Database Migrations

### Dev Database
- Run migrations freely for testing
- Can reset/recreate as needed

### Prod Database
- Always test migrations on dev first
- Use Supabase migration system
- Never run destructive migrations without backup

### Syncing Schema (Dev ↔ Prod)

**Via Supabase Dashboard (Recommended):**

1. **Export from Prod:**
   - Go to https://supabase.com/dashboard/project/wksntdtsqtxtsruewmuy
   - Navigate to **Settings** → **Database** → **Database Settings**
   - Use **pg_dump** with the connection string, or:
   - Go to **SQL Editor** and run: `SELECT * FROM pg_dump_script()`

2. **Import to Dev:**
   - Go to https://supabase.com/dashboard/project/rqtimlhqasmeymxhmkiz
   - Navigate to **SQL Editor**
   - Paste and run the schema DDL statements

**Alternative - Via Supabase CLI (if auth works):**
```bash
# Link to prod and dump schema
supabase link --project-ref wksntdtsqtxtsruewmuy
supabase db dump -s public -f prod-schema.sql

# Link to dev and push
supabase link --project-ref rqtimlhqasmeymxhmkiz
psql "postgres://..." -f prod-schema.sql
```

**Note:** The CLI method may have authentication issues with Supabase's connection pooler.
For now, use the Dashboard SQL Editor method.

## Monitoring & Alerts

### Basic Health Checks
- GitHub Actions verifies deploy success
- Add uptime monitoring (UptimeRobot free tier)

### Logs
```bash
# View logs on either Pi
ssh pi@<ip>
docker compose logs -f web
```

## Cost Summary

| Item | Cost |
|------|------|
| GitHub Actions (public repo) | Free |
| Supabase Dev Project | Free (2nd of 2 allowed) |
| Raspberry Pi (one-time) | $50-80 |
| Domain (optional dev subdomain) | Already have |
| **Total ongoing** | **$0/month** |

## Project References

| Environment | Supabase Project | Reference ID |
|-------------|-----------------|--------------|
| Production | Talking-Music-League | `wksntdtsqtxtsruewmuy` |
| Development | talking-music-league-dev | `rqtimlhqasmeymxhmkiz` |

## Next Steps

### Completed
- [x] Create Supabase dev project (`rqtimlhqasmeymxhmkiz`)
- [x] Create GitHub Actions workflow files

### Remaining
1. [ ] **Sync dev database schema** (via Supabase Dashboard SQL Editor)
   - Export tables, RLS policies, and functions from prod
   - Import into dev project

2. [ ] **Set up Dev Pi with Docker**
   ```bash
   # On Dev Pi:
   git clone https://github.com/loydmilligan/ml_companion.git
   cd ml_companion
   # Create env file (see GitHub Secrets section for values)
   ```

3. [ ] **Add GitHub Secrets** (Repository Settings → Secrets and variables → Actions)
   ```
   # Dev Environment
   DEV_PI_HOST=192.168.4.252
   DEV_PI_USER=dietpi
   DEV_PI_SSH_KEY=<contents of ~/.ssh/id_rsa>
   DEV_SUPABASE_URL=https://rqtimlhqasmeymxhmkiz.supabase.co
   DEV_SUPABASE_ANON_KEY=<from dev project settings>

   # Prod Environment
   PROD_PI_HOST=192.168.4.158
   PROD_PI_USER=pi
   PROD_PI_SSH_KEY=<contents of ~/.ssh/id_rsa>
   ```

4. [ ] **Create `develop` branch** and push workflow files
   ```bash
   git checkout -b develop
   git add .github/workflows/
   git commit -m "Add CI/CD workflows for dev and prod deployments"
   git push -u origin develop
   ```

5. [ ] **Test dev deployment** - merge a PR to develop
6. [ ] **Test prod deployment** - create a GitHub Release
