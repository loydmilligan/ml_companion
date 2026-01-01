#!/bin/bash
# Simple deploy script for ML Companion

set -e

echo "==> Pulling latest code..."
git pull

echo "==> Building and starting container..."
docker-compose up --build -d

echo "==> Done! App running on port ${APP_PORT:-3080}"
echo "    Access at: http://$(hostname -I | awk '{print $1}'):${APP_PORT:-3080}"
