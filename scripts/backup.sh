#!/bin/bash

# ML Companion Backup Script
# Backs up all live data from Supabase, excluding test data

SUPABASE_URL="https://wksntdtsqtxtsruewmuy.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indrc250ZHRzcXR4dHNydWV3bXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MjQ2ODgsImV4cCI6MjA4MjUwMDY4OH0.ERE_Q5G1QK8hwiYcutsX8Mq8NXKgah9PJvr9aaMqh-o"
BACKUP_DIR="${HOME}/Projects/ml_companion/backups"
BACKUP_FILE="${BACKUP_DIR}/ml-companion-backup-$(date +%Y-%m-%d_%H%M%S).json"

# Test IDs to exclude
TEST_LEAGUE="00000000-0000-0000-0002-000000000002"
TEST_GROUP="00000000-0000-0000-0001-000000000001"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting ML Companion backup..."
echo "Backup file: $BACKUP_FILE"

# Function to fetch table data
fetch() {
  local table=$1
  local filter=${2:-""}
  curl -s "${SUPABASE_URL}/rest/v1/${table}?select=*${filter}" \
    -H "apikey: ${ANON_KEY}" \
    -H "Authorization: Bearer ${ANON_KEY}"
}

# Build JSON backup
echo "{" > "$BACKUP_FILE"
echo "  \"backup_date\": \"$(date -Iseconds)\"," >> "$BACKUP_FILE"
echo "  \"backup_type\": \"live_data_only\"," >> "$BACKUP_FILE"

echo "  Fetching leagues..."
echo "  \"leagues\": $(fetch leagues "&id=neq.${TEST_LEAGUE}")," >> "$BACKUP_FILE"

echo "  Fetching rounds..."
echo "  \"rounds\": $(fetch rounds "&league_id=neq.${TEST_LEAGUE}")," >> "$BACKUP_FILE"

echo "  Fetching submissions..."
echo "  \"submissions\": $(fetch submissions)," >> "$BACKUP_FILE"

echo "  Fetching votes..."
echo "  \"votes\": $(fetch votes)," >> "$BACKUP_FILE"

echo "  Fetching profiles..."
echo "  \"profiles\": $(fetch profiles)," >> "$BACKUP_FILE"

echo "  Fetching family_groups..."
echo "  \"family_groups\": $(fetch family_groups "&id=neq.${TEST_GROUP}")," >> "$BACKUP_FILE"

echo "  Fetching group_members..."
echo "  \"group_members\": $(fetch group_members "&group_id=neq.${TEST_GROUP}")," >> "$BACKUP_FILE"

echo "  Fetching season_competitors..."
echo "  \"season_competitors\": $(fetch season_competitors "&group_id=neq.${TEST_GROUP}")," >> "$BACKUP_FILE"

echo "  Fetching group_settings..."
echo "  \"group_settings\": $(fetch group_settings "&group_id=neq.${TEST_GROUP}")," >> "$BACKUP_FILE"

echo "  Fetching round_awards..."
echo "  \"round_awards\": $(fetch round_awards)," >> "$BACKUP_FILE"

echo "  Fetching group_messages..."
echo "  \"group_messages\": $(fetch group_messages "&group_id=neq.${TEST_GROUP}")," >> "$BACKUP_FILE"

echo "  Fetching dm_threads..."
echo "  \"dm_threads\": $(fetch dm_threads)," >> "$BACKUP_FILE"

echo "  Fetching dm_messages..."
echo "  \"dm_messages\": $(fetch dm_messages)" >> "$BACKUP_FILE"

echo "}" >> "$BACKUP_FILE"

echo ""
echo "Backup complete!"
ls -lh "$BACKUP_FILE"
echo ""
echo "Recent backups:"
ls -lt "$BACKUP_DIR" | head -5
