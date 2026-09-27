# Changelog

All notable changes to Engineering Theme and its console card. Newest first.

## 0.4.1 (2026-09-27)

- README: live-demo badge and link above the screenshot.
- Demo hosted on Vercel (`vercel.json`, `.vercelignore`): https://engeneering-home-assistant-theme.vercel.app/
- **Standalone demo** in `demo/`: runs the real console card on simulated floors, areas, lights and sensors (temperature, humidity, CO₂), with light/dark switching and live-feeling sensor drift. No Home Assistant needed; generic example data only.

## 0.4.0 (2026-09-27)

- **Mobile layout fixed.** On phones the console was wider than the screen, so tabs, scenes, the LCD and toggles were cut off on the right. The card now adapts to its own width (container queries instead of screen-size media queries), and nothing can force it wider than the screen.
- Narrow screens: floor tabs in two rows, all five scenes on one row, three knobs per row, compact area scene keys, and a smaller LCD matrix.

## 0.3.x (2026-09-26 – 27): console refinements

**Layout**
- Floor tabs in their own full-width bar; a slim, full-width **Scenes** strip under the title bar. Scene selection used to be a large card.
- First row: **ALL** (full-height LCD with larger dots) and **Temperature and Humidity**; light panels follow, then SYSTEM-01.
- Area order is configurable (`area_order`, with `"..."` for "the rest").
- Fainter grid lines, no corner crosshairs.

**LCD and status**
- Blinkenlights dot-matrix animation every 30 s and on every scene change.
- LCD line reads `STATUS: NOMINAL // LINK OK · n ON`. SYSTEM-01 keeps the real fault count.
- Optional `hide_unavailable`: SYSTEM-01 shows online counts instead of listing each N/A item.

**Sensors**
- Temperature and Humidity panel: each sensor shows temperature and humidity (from the same device, or via `humidity_map`, e.g. a weather entity for outdoors). Options: `temperature_exclude`, `temperature_order`.
- CO₂ block under the LCD. It appears automatically once CO₂ sensors exist.

**Scenes and controls**
- Default scenes ON (100 %, 3500 K), READ, EVENING, NIGHT, OFF, on the strip and as small keys in every area.
- Keyboard: Enter/Space toggle a light. Arrow-key dimming was removed at the owner's request.
- Area toggles redrawn: centred knob, light knob in dark mode.

**Naming**
- Console title comes from a zone name (`zone`, default `zone.home`).
- Renamed entities show up without a reload. The area prefix is only stripped from light names as a whole word (fixed "S LED").

**Reference instance** (not repo code): dashboard moved to `/dashboard-lights/0`; lights and sensors renamed to Latvian room names; Koridors' six ceiling lights grouped as `light.griesti`. See docs/HANDOVER.md.

## 0.3.0 (2026-09-26)

- New `custom:engineering-console-card`: an industrial lighting console that finds every light automatically, groups lights by area with floor tabs, and has brightness knobs, area toggles, an LCD summary, a fault list and scenes. Light and dark variants. Original code, visually inspired by the Workshop Console demo.
- Install scripts: `install_dashboard.sh` and `ha_ws.py`.

## 0.2.0 (2026-09-26)

- Redesign as an industrial control panel: graphite and light-grey panels, safety-orange accent, flat square geometry, dark and light modes.
- teenage.engineering-inspired type with free, self-hosted fonts: Hanken Grotesk, Syncopate, IBM Plex Mono.
- WCAG 2.2 AA contrast gate for both modes (`scripts/contrast_check.py`).

## 0.1.0 (2026-09-26)

- Forked from Iconic Theme 1.1.0 and renamed to `engineering_theme`. GPL-3.0, with the upstream MIT notices in `NOTICE`.

---

Earlier history (inherited from Iconic Theme):

- **Iconic 1.1.0:** Apple SF fonts everywhere via a font bridge; code-editor colours and form backgrounds fixed for contrast.
- **Iconic 1.0.0:** fork of `luxury_dashboard` (ruudmens/home-assistant-dashboard) with a proper dark mode and WCAG AA fixes.
