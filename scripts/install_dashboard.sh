#!/usr/bin/env bash
# Install the Engineering Console card and a dashboard config into HA.
#
# 1. Registers /local/engineering-theme/engineering-console-card.js as a
#    Lovelace module resource (updates the ?v= cache-buster if it exists).
# 2. Backs up the target dashboard's current config on the host.
# 3. Saves dashboards/<name>.json as that dashboard's config.
#
# Run scripts/deploy.sh first so the card file is on the host.
#
#   ./scripts/install_dashboard.sh dashboard-lights dashboards/lights.json
set -euo pipefail

URL_PATH="${1:?usage: install_dashboard.sh <dashboard url_path> <config.json>}"
CONFIG="${2:?usage: install_dashboard.sh <dashboard url_path> <config.json>}"
HA_HOST="${HA_HOST:-root@homeassistant.local}"
HA_PORT="${HA_PORT:-22}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CARD_URL="/local/engineering-theme/engineering-console-card.js"
VERSION="$(grep -oE 'const VERSION = "[^"]+"' "$ROOT/www/engineering-console-card.js" | cut -d'"' -f2)-$(date +%s)"

ws() {
  ssh -p "$HA_PORT" "$HA_HOST" "python3 - $(printf %q "$1")" < "$ROOT/scripts/ha_ws.py"
}

echo "==> Registering card resource ($CARD_URL?v=$VERSION)"
existing="$(ws '[{"type":"lovelace/resources"}]' | python3 -c "
import json,sys
for r in json.loads(sys.stdin.readline())['result']:
    if r['url'].split('?')[0] == '$CARD_URL': print(r['id'])
")"
if [ -n "$existing" ]; then
  ws "[{\"type\":\"lovelace/resources/update\",\"resource_id\":\"$existing\",\"res_type\":\"module\",\"url\":\"$CARD_URL?v=$VERSION\"}]" >/dev/null
else
  ws "[{\"type\":\"lovelace/resources/create\",\"res_type\":\"module\",\"url\":\"$CARD_URL?v=$VERSION\"}]" >/dev/null
fi

echo "==> Backing up current $URL_PATH config"
ws "[{\"type\":\"lovelace/config\",\"url_path\":\"$URL_PATH\"}]" |
  ssh -p "$HA_PORT" "$HA_HOST" "mkdir -p /config/backups_manual && cat > /config/backups_manual/lovelace.$URL_PATH.$(date +%Y%m%d-%H%M%S).json"

echo "==> Saving $CONFIG to $URL_PATH"
payload="$(python3 -c "
import json,sys
print(json.dumps([{'type':'lovelace/config/save','url_path':'$URL_PATH','config':json.load(open('$CONFIG'))}]))
")"
ws "$payload" | python3 -c "
import json,sys
r=json.loads(sys.stdin.readline())
sys.exit(0 if r['success'] else print('Save failed:', r['error']) or 1)
"
echo "Done. Reload the dashboard (Cmd+Shift+R)."
