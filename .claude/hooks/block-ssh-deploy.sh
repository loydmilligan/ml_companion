#!/bin/bash
# Claude Code PreToolUse hook to block direct SSH deployments
# All deployments must go through GitHub Actions
#
# This hook intercepts Bash commands before execution and blocks
# any that attempt to deploy directly via SSH to the Pi.

# Read JSON input from stdin
input=$(cat)

# Extract the command from tool_input
COMMAND=$(echo "$input" | jq -r '.tool_input.command // empty')

if [ -z "$COMMAND" ]; then
  exit 0  # No command, allow
fi

# Patterns that indicate a deployment attempt via SSH
# Block: ssh pi, ssh prod-pi, ssh 192.168.4.158
# Block: docker compose commands run via SSH
# Block: git pull && docker commands via SSH

BLOCKED_PATTERNS=(
  'ssh\s+pi\b'
  'ssh\s+prod-pi\b'
  'ssh\s+192\.168\.4\.158'
  'ssh\s+.*ml_companion.*docker'
  'ssh\s+.*docker\s+compose'
)

for pattern in "${BLOCKED_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qE "$pattern"; then
    # Output JSON to block the command
    cat << 'EOF'
{
  "permissionDecision": "deny",
  "message": "DEPLOYMENT BLOCKED: Direct SSH deployments are not allowed.\n\nUse GitHub Actions instead:\n   1. Commit and push changes\n   2. Merge to main branch\n   3. Create a release: gh release create v1.x.x --generate-notes\n   4. deploy-prod workflow triggers automatically\n\nSee CLAUDE.md for full deployment workflow."
}
EOF
    exit 0
  fi
done

# Allow command to proceed
exit 0
