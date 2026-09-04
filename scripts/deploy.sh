#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.production}"
COMPOSE_FILE="$ROOT_DIR/compose.production.yml"

if [ ! -f "$ENV_FILE" ]; then
  echo "Arquivo ausente: $ENV_FILE"
  echo "Crie com: cp deploy.env.example .env.production"
  exit 1
fi

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

required_vars="DOMAIN ACME_EMAIL DB_MIGRATION_PASSWORD DB_APP_PASSWORD REDIS_PASSWORD RABBITMQ_PASSWORD JWT_SECRET BACKUP_ENCRYPTION_PASSPHRASE"
for variable in $required_vars; do
  eval "value=\${$variable:-}"
  if [ -z "$value" ]; then
    echo "Variável obrigatória ausente: $variable"
    exit 1
  fi
done

case "$DB_MIGRATION_PASSWORD $DB_APP_PASSWORD $REDIS_PASSWORD $RABBITMQ_PASSWORD $JWT_SECRET $BACKUP_ENCRYPTION_PASSPHRASE" in
  *GERE_*|*CHANGE_ME*)
    echo "Substitua todos os segredos de exemplo antes do deploy."
    exit 1
    ;;
esac

if [ "${#JWT_SECRET}" -lt 43 ]; then
  printf '%s\n' "JWT_SECRET é curto. Gere com: openssl rand -base64 64 | tr -d '\n'"
  exit 1
fi

cd "$ROOT_DIR"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" config --quiet
if [ "${BUILD_LOCAL:-0}" = "1" ]; then
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --build --remove-orphans
else
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" pull
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --remove-orphans
fi
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps

echo "Deploy iniciado em https://$DOMAIN"
