#!/bin/bash
# Deploy script for ML Companion
# Commits, pushes, and deploys to Pi

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== ML Companion Deploy ===${NC}"

# Step 1: Commit changes
echo -e "${GREEN}[1/4] Committing changes...${NC}"
cd /home/mmariani/Projects/ml_companion

# Add all changes
git add -A

# Get commit message from argument or use default
COMMIT_MSG="${1:-Auto-deploy: $(date '+%Y-%m-%d %H:%M:%S')}"

# Commit (will fail gracefully if nothing to commit)
git commit -m "$COMMIT_MSG

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>" || echo "Nothing to commit"

# Step 2: Push to remote
echo -e "${GREEN}[2/4] Pushing to remote...${NC}"
git push origin HEAD

# Step 3: SSH to Pi and pull
echo -e "${GREEN}[3/4] Pulling on Pi...${NC}"
ssh pi "cd ml_companion && git pull"

# Step 4: Build on Pi
echo -e "${GREEN}[4/4] Building on Pi...${NC}"
ssh pi "cd ml_companion/web && npm run build"

echo -e "${GREEN}=== Deploy Complete ===${NC}"
echo "Visit: http://musicleague.local or your Pi's IP"
