#!/bin/bash

# Google Chat Webhook Test Script
# Usage: ./post-to-gchat.sh <webhook_url> <form_url>
#
# Example:
#   ./post-to-gchat.sh "https://chat.googleapis.com/v1/spaces/XXX/messages?key=YYY&token=ZZZ" "https://your-form-url.vercel.app"

WEBHOOK_URL="$1"
FORM_URL="${2:-https://example.com/form}"

if [ -z "$WEBHOOK_URL" ]; then
  echo "Usage: ./post-to-gchat.sh <webhook_url> [form_url]"
  echo ""
  echo "Get the webhook URL from Google Chat:"
  echo "  1. Open the chat space in browser"
  echo "  2. Click space name → Apps & integrations → Add webhooks"
  echo "  3. Name it, copy the URL"
  exit 1
fi

echo "Posting test card to Google Chat..."
echo "Form URL: $FORM_URL"
echo ""

# Post card with button
curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json; charset=UTF-8" \
  -d '{
    "cardsV2": [{
      "cardId": "test-card-1",
      "card": {
        "header": {
          "title": "🎵 Round 5: Guilty Pleasures",
          "subtitle": "Voting is open! Can you guess who picked what?"
        },
        "sections": [{
          "widgets": [{
            "textParagraph": {
              "text": "3 quick questions. Takes 30 seconds. No login needed."
            }
          }, {
            "buttonList": {
              "buttons": [{
                "text": "🎮 Play Now",
                "onClick": {
                  "openLink": {
                    "url": "'"$FORM_URL"'"
                  }
                }
              }]
            }
          }]
        }]
      }
    }]
  }'

echo ""
echo ""
echo "Done! Check your Google Chat space."
