#!/usr/bin/env bash

set -euo pipefail

SITE_URL="${SITE_URL:-https://lengmiaomiao.win}"
ROOM_ID="${ROOM_ID:-K5KNY6}"

echo "==> Checking robots.txt"
curl -fsSL "$SITE_URL/robots.txt"
printf '\n\n'

echo "==> Checking sitemap.xml"
curl -fsSL "$SITE_URL/sitemap.xml"
printf '\n\n'

echo "==> Checking homepage robots meta"
curl -fsSL "$SITE_URL" | grep -i 'meta name="robots"'
printf '\n\n'

echo "==> Checking room page X-Robots-Tag"
curl -fsSI "$SITE_URL/?room=$ROOM_ID" | grep -i 'x-robots-tag'
printf '\n\n'

echo "==> Checking API health"
curl -fsSL "$SITE_URL/health"
printf '\n'
