# Changelog

## 0.3.25 (2026-09-27)

- Console card 0.17.1: area toggle fixes.
  - The knob is centred in both states (3 px from each end; the on-state was 5 px from the right).
  - Dark mode uses a light knob (`#e6e8eb`) with a dark edge instead of a dark knob with a bright ring, and a softer grey outline (`#6b737b`, 3.32:1 against the panel).
  - New per-mode variables: `--pill-edge`, `--knob`, `--knob-edge`.

## 0.3.24 (2026-09-27)

- Console card 0.17.0: Scene selection is now a slim, full-width **Scenes** strip under the title bar (68 px tall). All five scenes are compact, equal-width key caps in one row, showing the name and brightness (no brightness label for OFF). This frees a grid cell, so the first grid row is ALL and Temperature and Humidity and light panels move up the page. The drag/tap hint text was removed. On narrow screens the strip wraps and hides the percentages.

## 0.3.23 (2026-09-26)

- Console card 0.16.1: the LCD line is fixed text, `STATUS: NOMINAL // LINK OK · n ON` (no fault count; SYSTEM-01 keeps its own verdict), at 13 px on a single line (281 of 320 px used, room for two-digit counts).

## 0.3.22 (2026-09-26)

- Console card 0.16.0: the LCD title line is now `STATUS: … // LINK OK · n ON`, with no LED and no time. The status is the same verdict as SYSTEM-01 ("NOMINAL" when all lights are online, otherwise the fault count). The line wraps when it's too long.

## 0.3.21 (2026-09-26)

- Console card 0.15.0: the LCD title line is now the time plus the link status (LED, "LINK OK · n ON"), moved there from the title bar. The zone name was removed from the LCD and stays in the title bar.

## 0.3.20 (2026-09-26)

- Console card 0.14.0: the floor tabs moved out of the title bar into their own full-width bar as the first row of the console; the tabs share the width equally. The title bar keeps the zone name, clock and link status.

## 0.3.19 (2026-09-26)

- Console card 0.13.2: Temperature and Humidity now comes before Scene selection (order: ALL → Temperature and Humidity → Scene selection → areas → System-01).

## 0.3.18 (2026-09-26)

- Console card 0.13.1: the LCD fills the ALL module's full height (the module matches its row), with the title on top and the dot matrix centred below. Dots are 18 px (were 11 px), with a 9 px gap and a slightly stronger glow. Animation logic unchanged.

## 0.3.17 (2026-09-26)

- Console card 0.13.0:
  - Humidity moved out of the ALL module into a unified **Temperature and Humidity** panel. Each row shows the temperature and the humidity from the same device's humidity sensor; a new `humidity_map` option pairs a temperature with any humidity sensor or a `weather.*` entity (its `humidity` attribute). `humidity: false` hides the column.
  - Module meta labels no longer wrap.
- Lights dashboard: "Temperatūra ārā" is paired with `weather.forecast_home` (met.no); the `humidity_exclude` entry was removed.

## 0.3.16 (2026-09-26)

- Console card 0.12.0:
  - **Humidity readings** under the LCD, next to CO₂. The CO₂ block was refactored into a shared `READINGS` table (CO₂ and humidity) with one render, update and click path. Humidity rows borrow the name and order of the temperature sensor on the same device; new options `humidity` and `humidity_exclude`.
  - Removed the corner crosshair marks, and the grid lines between modules are now a faint `--grid` colour (light `#c9c6bf`, dark `#2c3035`), 1 px. Keycap and tag outlines keep `--rule`.
- Lights dashboard: `humidity_exclude` mirrors the temperature choice for the ALPSTUGA air-quality monitor.

## 0.3.15 (2026-09-26)

- Console card 0.11.0: CO₂ block under the LCD in the ALL module. It auto-discovers `device_class: carbon_dioxide` sensors, colours the LED by level (green < 800, amber 800–1200, red > 1200 ppm), shows a bar and the value, and opens more-info on click. New options `co2` and `co2_exclude`; `hide_unavailable` also applies. New mode-aware `--warn` colour (3.62:1 light, 10.12:1 dark). Verified with simulated sensors in the browser.
- Reference instance: **no CO₂ entities exist yet.** The IKEA ALPSTUGA monitors are bridged over HomeKit (DIRIGERA), which exposes only temperature, humidity, AQI and PM2.5. Adding the hub through HA's Matter integration should expose CO₂, and the block will then appear automatically.

## 0.3.14 (2026-09-26)

- Console card 0.10.3: the LCD shows only "<ZONE> // <time>" and the animated dot matrix. The ON/OFF and N/A/AVG text lines were removed; the counts remain in the LCD's accessible label for screen readers.

## 0.3.13 (2026-09-26)

- Console card 0.10.2: the ALL (LCD summary) module no longer spans two columns; it's a regular grid cell like the other modules. Inside the LCD, the dot matrix wraps below the text lines, aligned right. The blinkenlights animation is unchanged.

## 0.3.12 (2026-09-26)

- Console card 0.10.1: fix — the card now re-renders when an entity, area or floor is renamed. Before this, renamed lights and sensors kept their old names until the list of entities changed.
- Lights dashboard: `sensor.alpstuga_air_quality_moni_temperature_sensor` excluded from the Temperature panel. On the reference instance, the ALPSTUGA 2 sensor was renamed "Master guļamistaba".

## 0.3.11 (2026-09-26)

- Console card 0.10.0: new `temperature_order` option (entity ids or names, with the `"..."` placeholder, like `area_order`); unlisted sensors are sorted by name.
- Lights dashboard: explicit temperature order, with "Tado dzīvojamā istaba" right after "Dzīvojamā istaba".

## 0.3.10 (2026-09-26)

- Lights dashboard config: `temperature_exclude: [sensor.smart_kettle_55b1_temperature]`.
- Reference instance: five temperature sensors renamed to Latvian room names in the HA entity registry (see HANDOVER §7).

## 0.3.9 (2026-09-26)

- Console card 0.9.0: new `hide_unavailable` option. The Temperature panel lists only sensors with a numeric reading, and SYSTEM-01 replaces the per-item N/A list with "Lights online x/y" and "Temp sensors online x/y"; the verdict still counts faults. It's enabled on the Lights dashboard. Nothing is deleted from HA, and hidden items reappear when they come back online.

## 0.3.8 (2026-09-26)

- Console card 0.8.0:
  - **Temperature panel**, placed after Scene selection. It auto-discovers every temperature sensor and shows an LED, a trimmed name, the value and a gauge bar per sensor, plus an online count; rows open the more-info dialog. New options `temperatures` and `temperature_exclude`.
  - `area_order` accepts a `"..."` placeholder: areas listed after it are placed last.
- Lights dashboard: Ieeja moved to the last slot before System-01. The view title is synced to the live "Main".
- Verified in the browser: module order, all 10 sensors (7 online), and that more-info opens for the clicked sensor.

## 0.3.7 (2026-09-26)

- Console card 0.7.0: new `area_order` option. The listed areas (by id or name) are shown first in the given order, and the rest keep the floor-then-name order; this applies on every floor tab.
- `dashboards/lights.json`: `area_order: [ieeja, koridors, maira_birojs, dzivojama_zona, virtuve, trepes]`.

## 0.3.6 (2026-09-26)

- Console card 0.6.0: removed keyboard brightness adjustment (arrow keys, PageUp/PageDown, Home/End) and the "arrow keys adjust" hint. Knobs are now exposed as ARIA switches (Enter/Space toggle), with the brightness in the accessible name. Drag and scroll dimming are unchanged.
- Accessibility trade-off: keyboard-only users can switch lights on and off but can no longer dim them. Floor tabs keep arrow-key navigation, since that only moves focus.

## 0.3.5 (2026-09-26)

- Console card 0.5.0:
  - the default "ALL ON" scene is renamed "ON", on the big tags and the area keys;
  - Scene selection is now a regular grid module (same size as System-01 and the area modules, with tags in an auto-fit grid) placed right after the LCD summary;
  - System-01 moves to the end of the grid.

## 0.3.4 (2026-09-26)

- Console card 0.4.0: "blinkenlights" animation on the LCD dot matrix. It has three phases: a column-and-row sweep with a fading trail, random front-panel flicker, then each dot settles to its real state in reading order (about 3 s). It runs every 30 s, on every scene change (big tags and area keys) and once after the card first renders. State updates arriving mid-animation are held and painted when it ends. It's skipped in hidden tabs and when `prefers-reduced-motion` is set. The frame sequence was verified in the browser, and the final frame matched the live light states.

## 0.3.3 (2026-09-26)

- Console card 0.3.0: the title comes from a zone. The new `zone` option defaults to `zone.home`; its friendly name is shown in the header and on the LCD, `title` still overrides it, and HA's `location_name` is the fallback. It updates live when the zone is renamed. The remembered floor tab is now stored per zone.
- `dashboards/lights.json` synced with the live dashboard (view title "Lights", view theme `engineering_theme`) and no longer hardcodes a title. On the reference instance it shows "Mājas".

## 0.3.2 (2026-09-26)

- Reference instance: the console dashboard moved from `/dashboard-essential/0` to `/dashboard-lights/0`. HA has no URL rename, so it was recreated, its config copied, and the old one deleted after a backup. The example config was renamed to `dashboards/lights.json`.

## 0.3.1 (2026-09-26)

- Console card 0.2.0: every area module now has a row of small scene keys (the configured scenes, defaulting to ALL ON / READ / EVENING / NIGHT / OFF) that apply to that area only. The keys are disabled when none of the area's lights are available. Verified with intercepted service calls: each key targets only its own area's available lights.

## 0.3.0 (2026-09-26)

### Console dashboard
- New `custom:engineering-console-card`: an industrial lighting console controlling every light, inspired by the Workshop Console demo's look (original code).
  - Lights are discovered automatically and grouped by area, with a tab per floor.
  - Brightness knobs work by drag, wheel and keyboard (ARIA sliders); there are on/off toggles per area.
  - An LCD summary with a dot matrix, a SYSTEM fault list, and scene tags scoped to the current floor.
  - Light and dark variants.
- `dashboards/essential.json`, and `scripts/install_dashboard.sh` + `scripts/ha_ws.py` to register the resource and save the dashboard over the websocket API (with a backup).
- Self-hosted Barlow Condensed and Share Tech Mono (OFL).
- Verified in the browser on the reference instance: 25 lights in 14 areas and 4 floor tabs rendered; zero contrast failures across 111 text elements in each mode. Keyboard, wheel, drag, tap, area toggle, scene and floor-scoping behaviour were checked with service calls intercepted, so no real lights changed.

## 0.2.0 (2026-09-26)

The Engineering redesign: an industrial control-panel theme with dark and light modes and teenage.engineering-inspired type.

### Design
- New palette: graphite (dark) and light-grey (light) panels, safety-orange accent (`#ff7a1a` / `#df600c` fills, `#a34405` for text in light mode), explicit success, warning, error and info colours in each mode.
- A full safety-orange `ha-color-primary-*` ramp and a graphite `ha-color-neutral-*` scale, so switches, menus and dialogs match the panels.
- Flat geometry: 1px card edges, 2–6px corners (Home Assistant's defaults go up to 36px), no shadows, square-ish buttons.
- Complete code-editor syntax palettes for both modes. HA's light defaults, such as `#F90` and `#8DA6CE`, fail on light backgrounds.

### Typography
- Chosen by comparing candidates side by side with TE's own webfonts:
  - **Hanken Grotesk** for UI text (Univers Next lookalike);
  - **Syncopate** for titles (TechnoType lookalike, wide caps);
  - **IBM Plex Mono** for code.
- Fonts are self-hosted in `www/fonts/` (Latin and Latin Extended, so Latvian is covered), with their OFL and Apache licences.
- The font bridge now loads `fonts/fonts.css`, and applies an optional `--theme-label-font-family` to page titles, dashboard section headings and dialog titles. Those elements only inherit a font, so other themes are unaffected. Card headers use HA's native `ha-card-header-font-family`.

### Accessibility
- `contrast_check.py` now checks both modes, using HA's own per-mode token mapping wherever the theme doesn't override a token: 166 checks, all passing.
- Light-mode traps found and fixed:
  - `primary-color` is used as a text colour (tabs, links), so it's the dark orange;
  - HA's plain/quiet buttons default to `primary-50`, which is only 3.28:1, so they're pinned to `#a34405`;
  - the off-state switch outline from HA's grey scale was 2.62:1, and is now 3.83:1 via the graphite scale;
  - the slider track was 2.93:1 and is now 3.83:1.
- Browser scan in both modes (overview, profile, history chart) found zero failures. The template editor had zero failures in light mode; in dark mode it was checked visually only (see HANDOVER).

### Tooling
- `deploy.sh` copies `www/` recursively and warns if a second font bridge is loaded.
- `verify_theme.py` requires both modes.

## 0.1.0 (2026-09-26)

Forked from [Iconic Theme](https://github.com/mairisskuja/iconic-home-assistant-theme) 1.1.0 (itself forked from `luxury_dashboard` in [ruudmens/home-assistant-dashboard](https://github.com/ruudmens/home-assistant-dashboard)). Developed in an AI-accelerated style with Claude Code.

- Renamed the theme to `engineering_theme` and the font bridge to `www/theme-fonts.js` (served from `/local/engineering-theme/`), so it installs side by side with Iconic Theme.
- Licensed under GPL-3.0, with the upstream MIT notices kept in `NOTICE`.
- The visual design is unchanged from Iconic 1.1.0 for now; the new Engineering design is next.

---

The entries below are inherited from Iconic Theme.

## 1.1.0 (2026-09-26)

Verified in a live browser against Home Assistant 2026.9.3. Pages checked: automation editor (dialog, form fields, open dropdown), overview dashboard, lights, profile, template editor, history chart, devices table and automation list. The scan now reports zero contrast failures and zero Roboto text on those pages.

### Typography
- SF is now used everywhere. Before this release, 20 of 69 text elements on the profile page, including the whole sidebar and the picker labels, still rendered in Roboto.
- Added `mdc-typography-font-family`, `md-ref-typeface-plain/brand` and `wa-font-family-body/heading/longform/code` to the theme.
- New `www/iconic-fonts.js` font bridge (`frontend.extra_module_url`), which points HA's hardcoded Roboto at the theme's font variables:
  - the base page font in `index.html` (sidebar);
  - ECharts canvas labels (history and energy charts);
  - code editor text (was generic `monospace`, now SF Mono);
  - code editor search field and autocomplete details;
  - input chips.

### Accessibility
| Issue found in browser | Fix | Result |
|---|---|---|
| Code comments `#545454` (HA default) | `#aca59e` | 1.53:1 → 4.77:1 on the active line |
| Code variables and string-2 `#f07178` | `#f58a90` | 4.06:1 → 4.93:1 on the active line |
| Code numbers and tags `#ff5370` | `#ff8a9c` | 3.72:1 → 5.18:1 on the active line |
| Dropdown and picker fields used HA's cool grey `#363636` | `ha-color-form-background*` in warm `#363233` / `#403b3c` | Label 6.65:1, hover 5.79:1 |

### Tooling
- `contrast_check.py` covers every `codemirror-*` token on the editor and on the active line, plus picker fields: 69 checks.
- `deploy.sh` installs the font bridge and warns if `configuration.yaml` doesn't load it.

## 1.0.0 (2026-09-26)

First release of Iconic Theme, forked from `luxury_dashboard` in [ruudmens/home-assistant-dashboard](https://github.com/ruudmens/home-assistant-dashboard). Developed in an AI-accelerated style with Claude Code.

### Typography
- Replaced Poppins with Apple's SF family through the system font stack: SF Pro Text for body text, SF Pro Display for headings and titles, SF Mono for code (previously Poppins).
- Added the current `ha-font-family-body`, `-heading`, `-longform` and `-code` variables alongside the legacy `paper-font-*` ones.
- Removed the Google Fonts `@import` from `card-mod-root`, so the theme makes no external requests.

### Accessibility (WCAG 2.2 AA)
| Issue in upstream theme | Fix | Result |
|---|---|---|
| Colours at the top level, so HA rendered the theme as **light** and kept light form, dropdown, menu and dialog surfaces under white text (invisible labels and pull-downs) | Moved all colours under `modes: dark:` (dark-only theme) | Text up to 14.41:1 |
| `text-primary-color: #ffffff` on gold fills | Dark `#211f1f` text on gold | 1.65:1 → 9.96:1 |
| `switch-*` variables no longer read by the frontend; switches, buttons, links and focus used HA blue | Full gold `ha-color-primary-*` ramp, loud fills in gold with dark text | Links 6.81:1, focus 6.81:1 |
| `paper-slider-*` no longer read; slider track `#444` | `ha-slider-thumb/indicator/track-color` | Track 1.48:1 → 3.82:1 |
| Off-state and on-state icons both gold | Off `#c2bbb3`, on `#eac578` | Off 7.58:1, on 8.75:1 |
| Secondary text gold, the same as links and active states | Warm grey `#c2bbb3` | 7.58:1 |
| Input fill identical to card | `#363233` fill | Label 6.65:1 |
| Selected sidebar item barely distinguishable | `#3a3536` background, gold text | 7.32:1 |

### Tooling
- `scripts/contrast_check.py`: 30 WCAG checks read from the theme file; non-zero exit on failure.
- `scripts/deploy.sh`: contrast gate, backup, copy, config check, theme reload and load verification over SSH.
- `scripts/verify_theme.py`: websocket check on the HA host that the theme loaded with dark mode.
- `hacs.json` for installation as a HACS custom repository.
