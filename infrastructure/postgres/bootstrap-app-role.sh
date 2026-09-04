#!/usr/bin/env sh
set -eu

: "${DB_MIGRATION_USERNAME:?Defina DB_MIGRATION_USERNAME}"
: "${DB_MIGRATION_PASSWORD:?Defina DB_MIGRATION_PASSWORD}"
: "${DB_APP_USERNAME:?Defina DB_APP_USERNAME}"
: "${DB_APP_PASSWORD:?Defina DB_APP_PASSWORD}"
: "${DB_NAME:?Defina DB_NAME}"
DB_HOST=${DB_HOST:-postgres}

export PGPASSWORD=$DB_MIGRATION_PASSWORD

psql -v ON_ERROR_STOP=1 \
  --host "$DB_HOST" \
  --username "$DB_MIGRATION_USERNAME" \
  --dbname "$DB_NAME" \
  --set app_role="$DB_APP_USERNAME" \
  --set app_password="$DB_APP_PASSWORD" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT PASSWORD %L', :'app_role', :'app_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'app_role')
\gexec

SELECT format('ALTER ROLE %I WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT PASSWORD %L', :'app_role', :'app_password')
\gexec
SELECT format('GRANT CONNECT ON DATABASE %I TO %I', current_database(), :'app_role')
\gexec
SELECT format('GRANT USAGE ON SCHEMA public TO %I', :'app_role')
\gexec
SELECT format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO %I', :'app_role')
\gexec
SELECT format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO %I', :'app_role')
\gexec
SELECT format('GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO %I', :'app_role')
\gexec
SELECT format('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO %I', :'app_role')
\gexec
SELECT format('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO %I', :'app_role')
\gexec
SELECT format('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO %I', :'app_role')
\gexec
SQL
