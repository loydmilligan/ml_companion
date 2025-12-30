#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${GROUP_ID:-}" ]]; then
  echo "GROUP_ID is required. Example: GROUP_ID=uuid scripts/reset_league.sh"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="$ROOT_DIR/web/public/data"
ARCHIVE_DIR="$DATA_DIR/archive"
LEAGUE_SLUG="${LEAGUE_SLUG:-$GROUP_ID}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$ARCHIVE_DIR/$LEAGUE_SLUG"

shopt -s nullglob
for file in "$DATA_DIR"/*.csv; do
  base="$(basename "$file" .csv)"
  mv "$file" "$ARCHIVE_DIR/$LEAGUE_SLUG/${base}.${TIMESTAMP}.csv"
done
shopt -u nullglob

SQL_TEMPLATE="$ROOT_DIR/supabase/reset_group_data.sql"
TMP_SQL="$(mktemp)"
sed "s/22163578-46a3-4efa-a8ed-c4323b92066b/${GROUP_ID}/g" "$SQL_TEMPLATE" > "$TMP_SQL"

if [[ -n "${SUPABASE_DB_URL:-}" ]]; then
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$TMP_SQL"
  rm -f "$TMP_SQL"
  echo "Reset complete. Archived CSVs to $ARCHIVE_DIR/$LEAGUE_SLUG."
  exit 0
fi

rm -f "$TMP_SQL"
echo "SUPABASE_DB_URL not set. Please export a Postgres connection string."
echo "Example: export SUPABASE_DB_URL=\"postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres\""
exit 1
