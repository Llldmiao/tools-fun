#!/usr/bin/env bash

set -euo pipefail

APP_DIR="${APP_DIR:-/home/tools-fun}"
BRANCH="${BRANCH:-main}"
SERVICE_NAME="${SERVICE_NAME:-clipboard-api}"
DATA_DIR="${DATA_DIR:-$APP_DIR/apps/clipboard-api/data}"

echo "==> Deploying clipboard app from $APP_DIR on branch $BRANCH"
cd "$APP_DIR"

echo "==> Syncing source"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "==> Installing dependencies"
pnpm install

echo "==> Building workspace"
pnpm build

echo "==> Ensuring data directory"
mkdir -p "$DATA_DIR"

echo "==> Restarting API service"
systemctl restart "$SERVICE_NAME"

echo "==> Reloading nginx"
systemctl reload nginx

echo "==> Deployment complete"
git rev-parse --short HEAD
