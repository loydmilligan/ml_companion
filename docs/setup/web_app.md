# Web App Setup (React + Supabase)

## 1) Install Dependencies
From the repo root:

```bash
cd web
npm install
```

## 2) Configure Environment Variables
- Copy `web/.env.example` to `web/.env`.
- Fill in your Supabase URL and anon key.
- Set `VITE_PUBLIC_BASE_URL` to your public URL (e.g., `https://talking.mattmariani.com`).

```bash
cp .env.example .env
```

## 3) Start the Dev Server
```bash
npm run dev
```

## 4) App Flow Overview
- `/` shows the Login / Sign Up screen.
- `/onboarding` prompts the Family Lead to create a group.
- `/app` is the main dashboard.
- Profile and Settings live in the standard menu.

## 5) UX and Visual Guidance
- Use the dashboard as the single, primary entry point to the core flow.
- Do not duplicate feature entry points across multiple menus.
- Use layered cards, color-coded status pills, and the coral/mint palette for guidance.

## 6) Season 1 Visuals
- CSV data is served from `web/public/data` for the Season 1 recap cards.
- Source files live in `docs/season_1_results` and are copied to the public folder for the web app.
