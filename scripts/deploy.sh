#!/usr/bin/env bash
# Deploy Engineering Theme to a Home Assistant instance over SSH.
#
# Requires the "Terminal & SSH" or "Advanced SSH & Web Terminal" add-on with
# a network port and your public key in authorized_keys.
#
#   HA_HOST=root@homeassistant.local ./scripts/deploy.sh
set -euo pipefail

HA_HOST="${HA_HOST:-root@homeassistant.local}"
HA_PORT="${HA_PORT:-22}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SSH=(ssh -p "$HA_PORT" "$HA_HOST")

echo "==> Contrast check"
python3 "$ROOT/scripts/contrast_check.py" >/dev/null || {
  python3 "$ROOT/scripts/contrast_check.py" | grep FAIL
  echo "Contrast check failed, not deploying." >&2
  exit 1
}

echo "==> Backing up current theme on $HA_HOST"
"${SSH[@]}" 'mkdir -p /config/themes /config/backups_manual && \
  [ ! -f /config/themes/engineering_theme.yaml ] || \
  cp /config/themes/engineering_theme.yaml /config/backups_manual/engineering_theme.yaml.$(date +%Y%m%d-%H%M%S)'

echo "==> Copying theme and font bridge"
scp -q -P "$HA_PORT" "$ROOT/themes/engineering_theme.yaml" "$HA_HOST:/config/themes/engineering_theme.yaml"
"${SSH[@]}" 'mkdir -p /config/www/engineering-theme'
scp -q -P "$HA_PORT" "$ROOT/www/theme-fonts.js" "$HA_HOST:/config/www/engineering-theme/theme-fonts.js"
"${SSH[@]}" 'grep -q "/local/engineering-theme/theme-fonts.js" /config/configuration.yaml' || {
  echo "WARNING: configuration.yaml does not load the font bridge. Add under frontend:" >&2
  echo "  extra_module_url:" >&2
  echo "    - /local/engineering-theme/theme-fonts.js" >&2
  echo "then restart Home Assistant Core." >&2
}

echo "==> Checking configuration and reloading themes"
"${SSH[@]}" 'ha core check >/dev/null && \
  curl -sf -X POST -H "Authorization: Bearer $SUPERVISOR_TOKEN" \
    http://supervisor/core/api/services/frontend/reload_themes >/dev/null'

echo "==> Verifying theme is loaded"
"${SSH[@]}" python3 - < "$ROOT/scripts/verify_theme.py"

echo "Done. Hard-refresh the browser (Cmd+Shift+R) to see changes."
