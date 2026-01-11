# ML Companion Backup System

Automated backup workflows using n8n for the Music League Companion app.

## Overview

Two backup strategies:
1. **Daily JSON Backup** - Exports all tables to JSON files at 3am
2. **Weekly Postgres Sync** - Full database sync to self-hosted Postgres at 4am Sunday

Both workflows exclude test data (Test League ID: `00000000-0000-0000-0002-000000000002`, Test Group ID: `00000000-0000-0000-0001-000000000001`).

## Infrastructure

- **Backup Database**: Orange Pi 5 at `192.168.5.255:5434`
- **n8n Instance**: `https://n8n2.mattmariani.com`

## Quick Start

### 1. Deploy backup database to Orange Pi 5

```bash
cd /home/mmariani/Projects/ml_companion/scripts/n8n-workflows

# Deploy and start (use --restart to restart the container)
./deploy-backup.sh --restart
```

### 2. Import workflows into n8n

1. Open https://n8n2.mattmariani.com
2. Import `daily_json_backup_and_ntfy.json`
3. Import `weekly-postgres-backup.json`

### 3. n8n Credentials (Already Configured)

The workflows use these pre-configured credentials:

**TML_Supabase_direct** (id: `r9ljWY9Y2iDVxROv`)
- Host: `aws-0-us-west-2.pooler.supabase.com` (connection pooler)
- Port: `5432`
- Database: `postgres`
- User: `postgres.wksntdtsqtxtsruewmuy`
- SSL: Allow with "Ignore SSL Issues" enabled

**TML_backup_DB** (id: `tVzVbHvI6KffimfO`)
- Host: `192.168.5.255` (Orange Pi 5)
- Port: `5434`
- Database: `ml_companion_backup`
- User: `backup_user`

### 4. Notification Configuration

Both workflows send ntfy notifications to `https://ntfy.mattmariani.com`:
- Topic: `tml-backup`
- Auth: Bearer token `tk_yufbb6v1kter9go6tfhwm028gp3qg`
- Success: Green checkmark, priority 3
- Failure: Red X, priority 5 (high)

### 5. Import Workflows

After importing workflows to n8n:
1. Credentials should auto-link if IDs match
2. If not, manually select the credentials on each Postgres node
3. Test the workflow manually before activating
4. Activate both workflows

## File Structure

```
scripts/n8n-workflows/
├── README.md                           # This file
├── deploy-backup.sh                    # Deploy script for Orange Pi 5
├── docker-compose.backup.yml           # Docker services config
├── init-backup-db.sql                  # Backup DB schema
├── .env                                # Credentials (not committed)
├── daily_json_backup_and_ntfy.json     # n8n workflow: Daily JSON backup with ntfy
├── weekly-postgres-backup.json         # n8n workflow: Weekly Postgres sync with ntfy
├── archive/                            # Old/experimental workflow versions
└── backups/                            # JSON backup output directory
```

## Updating the Backup Infrastructure

When you make changes to the backup configuration:

```bash
# Edit files locally, then deploy:
./deploy-backup.sh           # Sync files only
./deploy-backup.sh --restart # Sync and restart container
```

## Workflow Details

### Daily JSON Backup
- **Schedule:** 3:00 AM daily
- **Output:** `/backups/ml-companion-backup-YYYY-MM-DD.json`
- **Tables:** 16 tables (all except test data)
- **Retention:** Manual cleanup required

### Weekly Postgres Sync
- **Schedule:** 4:00 AM every Sunday
- **Method:** Truncate + Insert (full sync)
- **Tables:** 16 tables synced sequentially
- **Logging:** Backup status logged to `backup_log` table

## Getting Your Supabase Database Password

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** > **Database**
4. Find the **Connection string** section
5. Click **Reveal** to see the password

Alternatively, reset the password if you've lost it.

## Restore from Backup

### From JSON Backup

```bash
# Parse JSON and restore (requires custom script or n8n workflow)
# The JSON contains all table data that can be inserted back
```

### From Postgres Backup

```bash
# Connect to backup database
psql -h localhost -p 5433 -U backup_user -d ml_companion_backup

# Export specific table
pg_dump -h localhost -p 5433 -U backup_user -d ml_companion_backup -t profiles > profiles_backup.sql

# Full database dump
pg_dump -h localhost -p 5433 -U backup_user ml_companion_backup > full_backup.sql
```

## Monitoring

### Check backup logs
```sql
-- Connect to backup database
SELECT * FROM backup_log ORDER BY started_at DESC LIMIT 10;
```

### Check n8n execution history
- Go to n8n UI > Executions
- Filter by workflow name

## Troubleshooting

### n8n can't connect to Supabase
- Verify SSL is enabled in the credential
- Check your Supabase project is active
- Confirm the database password is correct

### Backup database connection refused
- Ensure Docker containers are running: `docker compose ps`
- Check container logs: `docker logs ml-companion-backup-db`

### Workflow execution fails
- Check n8n execution logs for specific error
- Verify all credential IDs are updated in workflow nodes
- Test individual nodes manually

## Security Notes

- Store `.env` file securely (it's gitignored)
- Use strong passwords for both backup DB and n8n
- The Supabase direct connection bypasses RLS - keep credentials secure
- Consider encrypting backup files for sensitive data
