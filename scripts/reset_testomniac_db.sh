#!/usr/bin/env bash

set -euo pipefail

# Load DATABASE_URL from testomniac_api's .env if not already set
if [[ -z "${DATABASE_URL:-}" ]]; then
  API_ENV="$(dirname "$0")/../../testomniac_api/.env"
  if [[ -f "$API_ENV" ]]; then
    DATABASE_URL="$(grep -E '^DATABASE_URL=' "$API_ENV" | tail -1 | cut -d= -f2-)"
  fi
fi
DATABASE_URL="${DATABASE_URL:-postgresql://localhost:5432/testomniac}"
TARGET_SCHEMA="${TARGET_SCHEMA:-testomniac}"

stmt="$(
  psql "$DATABASE_URL" -At -c "
    select
      'TRUNCATE TABLE '
      || string_agg(
        format('%I.%I', schemaname, tablename),
        ', '
        order by schemaname, tablename
      )
      || ' RESTART IDENTITY CASCADE'
    from pg_tables
    where schemaname = '${TARGET_SCHEMA}';
  "
)"

if [[ -z "$stmt" ]]; then
  echo "No tables found to truncate in schema ${TARGET_SCHEMA} for ${DATABASE_URL}"
  exit 0
fi

psql "$DATABASE_URL" -c "$stmt"

echo "Reset complete for schema ${TARGET_SCHEMA} in ${DATABASE_URL}"
