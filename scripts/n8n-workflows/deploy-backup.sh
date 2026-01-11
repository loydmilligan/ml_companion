#!/bin/bash

# Deploy ML Companion Backup Database to Orange Pi 5
# Usage: ./deploy-backup.sh [--restart]
#
# This script syncs the backup infrastructure to the Orange Pi and
# optionally restarts the container if --restart is passed.

set -e

# Configuration
BACKUP_HOST="ubuntu@192.168.5.255"
REMOTE_DIR="/home/ubuntu/ml-companion-backup"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== ML Companion Backup Deployment ==="
echo "Target: $BACKUP_HOST:$REMOTE_DIR"
echo ""

# Create remote directory
echo "Creating remote directory..."
ssh "$BACKUP_HOST" "mkdir -p $REMOTE_DIR"

# Sync files
echo "Syncing files..."
rsync -avz --delete \
    "$SCRIPT_DIR/docker-compose.backup.yml" \
    "$SCRIPT_DIR/init-backup-db.sql" \
    "$SCRIPT_DIR/.env" \
    "$BACKUP_HOST:$REMOTE_DIR/"

echo "Files synced successfully."

# Handle restart flag
if [[ "$1" == "--restart" ]]; then
    echo ""
    echo "Restarting backup database..."
    ssh "$BACKUP_HOST" "cd $REMOTE_DIR && docker compose -f docker-compose.backup.yml down && docker compose -f docker-compose.backup.yml up -d"
    echo ""
    echo "Waiting for container to be healthy..."
    sleep 5
    ssh "$BACKUP_HOST" "docker ps --filter 'name=ml-companion-backup-db' --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
fi

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "To start/restart manually:"
echo "  ssh $BACKUP_HOST"
echo "  cd $REMOTE_DIR"
echo "  docker compose -f docker-compose.backup.yml up -d"
echo ""
echo "Connection details for n8n:"
echo "  Host: 192.168.5.255"
echo "  Port: 5434"
echo "  Database: ml_companion_backup"
echo "  User: backup_user"
echo "  Password: (see .env file)"
