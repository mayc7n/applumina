#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.production}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
COMPOSE_FILE="$ROOT_DIR/compose.production.yml"

if [ ! -f "$ENV_FILE" ]; then
  echo "Arquivo ausente: $ENV_FILE"
  exit 1
fi

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

mkdir -p "$BACKUP_DIR"
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
output="$BACKUP_DIR/lumina-$timestamp.sql.gz.enc"

if [ -z "${BACKUP_ENCRYPTION_PASSPHRASE:-}" ]; then
  echo "Defina BACKUP_ENCRYPTION_PASSPHRASE para criptografar o backup."
  exit 1
fi

cd "$ROOT_DIR"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
  pg_dump --clean --if-exists --no-owner --no-privileges \
  -U "${DB_MIGRATION_USERNAME:-lumina_owner}" "${DB_NAME:-lumina}" |
  gzip -9 |
  openssl enc -aes-256-cbc -salt -pbkdf2 -pass env:BACKUP_ENCRYPTION_PASSPHRASE > "$output"

find "$BACKUP_DIR" -type f -name 'lumina-*.sql.gz.enc' -mtime +14 -delete
echo "Backup criado: $output"
