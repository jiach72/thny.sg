#!/bin/bash
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker/docker-compose.prod.yml}"
PROJECT_NAME="${PROJECT_NAME:-tonghai}"

if [ -z "${1:-}" ]; then
    echo "Usage: ./rollback.sh <image-tag-sha>"
    echo "Example: ./rollback.sh a1b2c3d"
    echo ""
    echo "Available tags:"
    docker images --format '{{.Tag}}' ghcr.io/tonghai/backend 2>/dev/null | head -10
    exit 1
fi

TAG="$1"
echo "=== Rolling back to tag: ${TAG} ==="

export BACKEND_IMAGE="ghcr.io/tonghai/backend:${TAG}"
export PORTAL_IMAGE="ghcr.io/tonghai/portal:${TAG}"
export MANAGEMENT_IMAGE="ghcr.io/tonghai/management:${TAG}"
export WEBSITE_IMAGE="ghcr.io/tonghai/website:${TAG}"

echo "Pulling images..."
docker compose -f "${COMPOSE_FILE}" -p "${PROJECT_NAME}" pull 2>/dev/null || true

echo "Stopping current services..."
docker compose -f "${COMPOSE_FILE}" -p "${PROJECT_NAME}" stop backend portal management website

echo "Starting services with tag ${TAG}..."
docker compose -f "${COMPOSE_FILE}" -p "${PROJECT_NAME}" up -d backend portal management website

echo "Waiting for health checks..."
sleep 10

echo "Checking service status..."
docker compose -f "${COMPOSE_FILE}" -p "${PROJECT_NAME}" ps

echo ""
echo "=== Rollback complete ==="
echo "If issues persist, restore database from backup:"
echo "  docker exec -i tonghai-postgres pg_restore -U crm_user -d crm_db < backup_file.dump"
