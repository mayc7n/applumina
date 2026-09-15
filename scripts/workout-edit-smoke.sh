#!/usr/bin/env bash
set -euo pipefail

api_base="${LUMINA_API_BASE:-http://127.0.0.1:8080/api}"
suffix="$(date +%s%N)"
email="codex-workout-${suffix}@example.com"
username="codex${suffix:0:16}"
password="Lumina!${suffix}"
token=""
workout_id=""
temp_dir="$(mktemp -d)"

cleanup() {
  if [[ -n "$token" ]]; then
    curl -sS -o /dev/null -X DELETE "${api_base}/users/me" \
      -H "Authorization: Bearer ${token}" \
      -H 'Content-Type: application/json' \
      --data "{\"confirmation\":\"${email}\",\"password\":\"${password}\"}" || true
  fi
  rmdir "$temp_dir" 2>/dev/null || true
}
trap cleanup EXIT

assert_status() {
  local expected="$1"
  local actual="$2"
  local response_file="$3"
  if [[ "$actual" != "$expected" ]]; then
    printf 'Esperado HTTP %s, recebido HTTP %s\n' "$expected" "$actual" >&2
    jq -c . "$response_file" >&2 2>/dev/null || sed -n '1,20p' "$response_file" >&2
    exit 1
  fi
}

status="$(curl -sS -o "$temp_dir/register.json" -w '%{http_code}' \
  -X POST "${api_base}/auth/mobile/register" \
  -H 'Content-Type: application/json' \
  --data "{\"email\":\"${email}\",\"username\":\"${username}\",\"displayName\":\"Teste Treino\",\"password\":\"${password}\"}")"
assert_status 201 "$status" "$temp_dir/register.json"
token="$(jq -r '.data.accessToken' "$temp_dir/register.json")"
[[ -n "$token" && "$token" != null ]]

status="$(curl -sS -o "$temp_dir/create.json" -w '%{http_code}' \
  -X POST "${api_base}/workouts" \
  -H "Authorization: Bearer ${token}" \
  -H 'Content-Type: application/json' \
  --data '{"type":"RUNNING","activityDate":"2026-09-14","durationMins":30,"notes":"antes"}')"
assert_status 201 "$status" "$temp_dir/create.json"
workout_id="$(jq -r '.data.id' "$temp_dir/create.json")"
[[ -n "$workout_id" && "$workout_id" != null ]]

status="$(curl -sS -o "$temp_dir/get.json" -w '%{http_code}' \
  "${api_base}/workouts/${workout_id}" \
  -H "Authorization: Bearer ${token}")"
assert_status 200 "$status" "$temp_dir/get.json"
[[ "$(jq -r '.data.id' "$temp_dir/get.json")" == "$workout_id" ]]

status="$(curl -sS -o "$temp_dir/update.json" -w '%{http_code}' \
  -X PUT "${api_base}/workouts/${workout_id}" \
  -H "Authorization: Bearer ${token}" \
  -H 'Content-Type: application/json' \
  --data '{"type":"CUSTOM","customActivity":"Escalada indoor","activityDate":"2026-09-13","durationMins":60,"notes":"depois"}')"
assert_status 200 "$status" "$temp_dir/update.json"
[[ "$(jq -r '.data.id' "$temp_dir/update.json")" == "$workout_id" ]]
[[ "$(jq -r '.data.privacy' "$temp_dir/update.json")" == PRIVATE ]]

status="$(curl -sS -o "$temp_dir/list.json" -w '%{http_code}' \
  "${api_base}/workouts" \
  -H "Authorization: Bearer ${token}")"
assert_status 200 "$status" "$temp_dir/list.json"
[[ "$(jq --arg id "$workout_id" '[.data[] | select(.id == $id)] | length' "$temp_dir/list.json")" == 1 ]]

status="$(curl -sS -o "$temp_dir/calendar.json" -w '%{http_code}' \
  "${api_base}/workouts/calendar?from=2026-09-01&to=2026-09-30" \
  -H "Authorization: Bearer ${token}")"
assert_status 200 "$status" "$temp_dir/calendar.json"
[[ "$(jq -r --arg id "$workout_id" '[.data[] | .workouts[] | select(.id == $id)] | length' "$temp_dir/calendar.json")" == 1 ]]
[[ "$(jq -r '[.data[] | select(.date == "2026-09-13")][0].totalMinutes' "$temp_dir/calendar.json")" == 60 ]]

status="$(curl -sS -o "$temp_dir/delete.json" -w '%{http_code}' \
  -X DELETE "${api_base}/workouts/${workout_id}" \
  -H "Authorization: Bearer ${token}")"
assert_status 204 "$status" "$temp_dir/delete.json"

printf 'Fluxo de edição/calendário aprovado: criar 201, detalhe 200, atualizar 200, calendário 200, lista sem duplicação, excluir 204.\n'
