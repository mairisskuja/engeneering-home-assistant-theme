# Changelog

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
