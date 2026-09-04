#!/usr/bin/env sh
set -eu

if [ "$#" -ne 1 ]; then
  echo "Uso: $0 backups/lumina-AAAAMMDDTHHMMSSZ.sql.gz.enc"
  exit 1
fi

ROOT_DIR=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.production}"
COMPOSE_FILE="$ROOT_DIR/compose.production.yml"
BACKUP_FILE=$1

if [ ! -f "$ENV_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
  echo "Arquivo de ambiente ou backup não encontrado."
  exit 1
fi

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

if [ -z "${BACKUP_ENCRYPTION_PASSPHRASE:-}" ]; then
  echo "Defina BACKUP_ENCRYPTION_PASSPHRASE para descriptografar o backup."
  exit 1
fi

printf "Isto substituirá os dados atuais. Digite RESTAURAR para continuar: "
read -r confirmation
[ "$confirmation" = "RESTAURAR" ] || exit 1

cd "$ROOT_DIR"
openssl enc -d -aes-256-cbc -pbkdf2 -pass env:BACKUP_ENCRYPTION_PASSPHRASE -in "$BACKUP_FILE" |
  gzip -dc |
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
  psql -v ON_ERROR_STOP=1 -U "${DB_MIGRATION_USERNAME:-lumina_owner}" "${DB_NAME:-lumina}"

echo "Restauração concluída."
