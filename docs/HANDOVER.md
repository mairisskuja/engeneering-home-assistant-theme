# Handover: Engineering Theme

State of the project as of **2026-09-26**, for whoever picks it up next.

## 1. What this is

Engineering Theme is a Home Assistant frontend theme in an **industrial control-panel** style, with dark and light modes and teenage.engineering-inspired typography. It was forked from [Iconic Theme](https://github.com/mairisskuja/iconic-home-assistant-theme) 1.1.0, which is itself a fork of `luxury_dashboard` in [ruudmens/home-assistant-dashboard](https://github.com/ruudmens/home-assistant-dashboard). From Iconic it inherits the dark-mode model, the font bridge, the contrast gate and the deploy and verification scripts. The visual design (palette, geometry, type) is new.

Development was AI-accelerated with Claude Code: HA frontend source research, font research and comparison, contrast maths for both modes, live browser verification and these docs.

## 2. Current status

| Item | Status |
|---|---|
| Theme | 0.2.0, `themes/engineering_theme.yaml`, with dark and light modes |
| Contrast gate | 166/166 WCAG AA checks pass across both modes (`scripts/contrast_check.py`) |
| Fonts | Self-hosted in `www/fonts/`, loaded by `www/theme-fonts.js` |
| Deployed to the reference HA instance | Yes. Both modes are loaded (78 dark / 79 light colour variables), and the font bridge is registered at `/local/engineering-theme/theme-fonts.js` |
| Browser QA (Chrome, macOS) | Overview, profile and history chart: zero contrast failures in both modes. Template editor: zero in light; dark checked visually only (see open item 1). Latvian glyphs confirmed in Syncopate. |
| HACS | `hacs.json` present; installable as a custom repository (the font bridge is a manual step) |
| Console dashboard | `custom:engineering-console-card` 0.1.0, installed on the reference instance as the **Essential** dashboard (`/dashboard-lights/0`) and registered as a Lovelace resource. All controls were verified with service calls intercepted; not yet exercised against real lights. |

Reference environment: Home Assistant OS, Core **2026.9.3**, frontend **20260826.7**.

## 3. How the theme works (read before editing)

These are the non-obvious facts, verified in the HA frontend source (`src/state/themes-mixin.ts`, `src/common/dom/apply_themes_on_element.ts`, `src/resources/theme/**`):

1. **`modes` decides dark vs light.** No `modes.dark` means always light; only `modes.dark` means always dark; both means HA follows the user or device preference (Auto / Light / Dark in the profile). HA applies its own dark or light base first, then the theme's top-level keys, then the matching mode block.
2. **Top-level keys apply in both modes.** Only mode-independent things live there: fonts, geometry and the graphite neutral scale. Everything else is inside each mode block.
3. **Custom themes don't get a generated primary palette.** Switches, filled buttons, links and focus rings read `ha-color-primary-05…95`, so each mode defines all eleven steps.
4. **HA maps the ramp differently per mode.** In dark mode, links use primary-60, the "normal" fill is primary-10 and quiet text is primary-70. In light mode, links use primary-40, the normal fill is primary-90 and quiet text is **primary-50**. That last one is too bright on a light card, so the light mode pins `ha-color-on-primary-quiet` to `#a34405`. `scripts/contrast_check.py` encodes this mapping (`HA_DEFAULTS`); update it if HA changes.
5. **In light mode, `primary-color` is a text colour.** Tabs, links and the selected sidebar item paint text in `--primary-color`, so light mode uses the dark orange there. Bright orange appears only in the `ha-color-fill-primary-loud-*` fills, with dark ink on top.
6. **The neutral scale drives off-state switches, menus and dialogs.** Dark mode draws the off-switch outline in `neutral-50` and light mode in `neutral-60`. HA's default greys gave 2.62:1 in light mode, and the graphite scale fixes that.
7. **Dead variables.** `switch-*` and `paper-slider-*` are ignored in 2026.9. Sliders use `ha-slider-*`.
8. **Font bridge (`www/theme-fonts.js`).** It:
   - loads `fonts/fonts.css`, found relative to the script itself;
   - points the spots HA hardcodes Roboto (the `<body>` base, so the sidebar; ECharts canvas labels; CodeMirror text, search and autocomplete; input chips) at `--ha-font-family-body` and `--ha-font-family-code`;
   - applies `--theme-label-font-family` to `hui-root`, `hass-subpage` and `hass-tabs-subpage` `.main-title`, `ha-top-app-bar-fixed .title`, `hui-heading-card p` and `ha-dialog-header .header-title`.

   Those title elements only inherit a font, so the `inherit` fallback leaves other themes unchanged. The script works by adopting a stylesheet into every shadow root (wrapping the `ShadowRoot.adoptedStyleSheets` setter, because Lit replaces the array) and by wrapping each chart's `setOption`. It depends on frontend internals, so re-check it after every HA frontend upgrade (section 5).
9. **Code editor.** HA's light fallbacks (`#F90`, `#8DA6CE`, `#cda869`, `#777`) fail on light backgrounds, and its dark ones were designed for `#1c1c1c`. All 18 tokens are defined in each mode and checked on both the editor background and the active line.

## 4. Design decisions

| Decision | Why |
|---|---|
| Industrial control-panel direction | Chosen by the owner from four options (blueprint, control panel, terminal, drafting paper). |
| Dark and light modes | Owner's choice; wall tablets can follow the device, and phones follow their OS setting. |
| Hanken Grotesk / Syncopate / IBM Plex Mono | TE uses licensed Univers Next and its own TechnoType. Candidates were rendered next to TE's webfonts: Hanken matched Univers's narrow numerals, single-storey `g`, spurred `G` and angled `t`; Syncopate matched TechnoType's thin, wide, all-caps geometry. All are free to redistribute. |
| Self-hosted fonts, Latin + Latin Extended only | Wall tablets must work offline, and the extended set covers Latvian (checked glyph by glyph). Other scripts fall back to system fonts. |
| Syncopate only for titles | Wide caps are hard to read in body text and long settings pages. |
| Body text at weight 400, not TE's thin 100/300 | Thin strokes fail readability at UI sizes. |
| Card edges below 3:1 | They're decorative. Input outlines, switch outlines and slider tracks all clear 3:1. |
| Safety orange `#ff7a1a` (dark) / `#df600c` fill + `#a34405` text (light) | In light mode, `#df600c` is the only band of that hue that clears both 4.5:1 for dark ink and 3:1 against the panel. |

## 5. Working on it

```bash
# 1. Edit themes/engineering_theme.yaml: colours in BOTH modes.dark and modes.light
# 2. Check contrast (both modes)
python3 scripts/contrast_check.py
# 3. Deploy to a test instance (backs up, copies www/, validates, reloads, verifies)
HA_HOST=root@homeassistant.local ./scripts/deploy.sh
# 4. Hard-refresh and check both modes (Profile → Theme → Light / Dark):
#    automation editor fields and dropdowns, a dialog, sidebar, toggle, slider,
#    template editor, history chart
```

When adding a colour pair the UI actually renders, add it to `checks_for()` in `scripts/contrast_check.py`.

**Testing the other mode without touching account settings.** In the browser console, `document.querySelector('home-assistant')._applyTheme(true)` switches the current tab to dark (use `false` for light) in memory. It's good for screenshots. Automated contrast scans after this in-memory switch can be unreliable on some pages: on the template editor, the computed colours of a few slotted elements didn't match what was rendered. For an authoritative scan, set the mode in Profile → Theme and reload.

**After every HA frontend upgrade**, open a few pages and check in the browser console that nothing renders in Roboto and that charts are patched:

```js
// every text node's font family, across shadow roots
const f={};(function w(r){for(const e of r.querySelectorAll('*')){if(e.shadowRoot)w(e.shadowRoot)}
 const t=document.createTreeWalker(r,4);let n;while(n=t.nextNode()){const p=n.parentNode;
 if(p?.nodeType===1&&n.textContent.trim()){const k=getComputedStyle(p).fontFamily.split(',')[0];f[k]=(f[k]||0)+1}}})(document);f
```

### Updating the fonts

The `.woff2` files come from the Google Fonts CSS2 API (Latin and Latin Extended subsets). If you change weights or add a family, regenerate `www/fonts/fonts.css` in the same format and add the font's licence file. Syncopate is **Apache 2.0**, not OFL.

### SSH access to Home Assistant

`deploy.sh` needs the **Terminal & SSH** (or *Advanced SSH & Web Terminal*) add-on:

- **Configuration → Network**: set a host port (22). This section has its own Save button, and if it's left blank the add-on only works as the web terminal.
- **authorized_keys**: add your public key, then restart the add-on.
- If `homeassistant.local` resolves to several addresses, SSH to the IP directly.

Backups made by `deploy.sh` are stored in `/config/backups_manual/engineering_theme.yaml.<timestamp>`. To roll back, copy one to `/config/themes/engineering_theme.yaml` and run `frontend.reload_themes`.

## 6. Open items and next steps

0. **CO₂ data:** the ALPSTUGA monitors only reach HA over HomeKit (no CO₂). Pair the IKEA DIRIGERA hub with HA's Matter integration; the console's CO₂ block will then populate itself.
0. **Console card, next steps:**
   - Exercise it against real lights; so far only intercepted calls have been verified.
   - Test on the wall tablet and on a phone. The layout switches to one column below 600px.
   - Consider real HA scenes, or per-area scenes, in the tags.
   - Consider showing colour and colour temperature on the knobs.
   - Note: the card finds lights on each state update. A new light appears automatically, but it goes under "Unassigned" until it's given an area.
   - Testing tip: HA suspends its connection in hidden tabs, so a background browser tab shows an empty card until it's brought forward.

1. **Authoritative dark-mode scan of the template editor.** Set Profile → Theme → Dark, reload, and run a contrast scan. It looked correct in a screenshot, but the automated scan was unreliable after the in-memory switch (section 5).
2. **Remaining visual QA in both modes:**
   - a slider inside a more-info dialog (every light was unavailable during testing);
   - the automation editor's dropdowns and dialogs;
   - the energy dashboard;
   - Safari on iOS or iPadOS;
   - the wall tablet.
3. **Syncopate in narrow headers.** Wide caps can truncate long page titles on phones. Consider a mobile media query in the bridge, or a smaller `ha-card-header-font-size`.
4. **Domain state colours** (lights amber, climate orange and so on) are HA defaults. A control panel might want a unified status system (for example, on = orange, fault = red).
5. **Multi-select checkmarks** use the primary text colour (a fixed HA choice). They're readable but not accent-coloured.
6. **HACS default listing.** Needs a tagged GitHub release and README screenshots of both modes.
7. **Version floor.** Only tested on 2026.9.3. Add `"homeassistant"` to `hacs.json` once a minimum version is known.

## 7. Reference instance notes

- The **Essential** dashboard lives at `dashboard-lights` (`/dashboard-lights/0`) and holds a single panel view with the console card. It was originally created as `dashboard-essential`. HA can't change a dashboard's URL, so on 2026-09-26 it was recreated under the new path, its config copied across, and the old dashboard deleted. Backups: `/config/backups_manual/lovelace.dashboard-essential.*.json` (the original "Key lights" heading, and the console config taken before the rename).
- Lovelace resource: `/local/engineering-theme/engineering-console-card.js?v=<version>-<timestamp>`. `install_dashboard.sh` updates the `v` parameter on every run.

These aren't part of this repo, but they exist on the instance where the theme was developed:

- Iconic Theme and the upstream `luxury_dashboard` theme are also installed; the latter's assets are in `/config/www/assets/`.
- `configuration.yaml` loads two modules through `frontend: extra_module_url:`:
  - `/local/engineering-theme/theme-fonts.js` is this repo's font bridge. It replaced Iconic's `iconic-fonts.js` on 2026-09-26 and serves both themes. The files remain in `/config/www/iconic-theme/`, unused.
  - `/local/assets/css/load-fonts.js` is a Poppins loader for `luxury_dashboard`.
- 2026-09-26 registry changes:
  - Temperature sensors renamed via the entity registry (entity ids unchanged):
    - `air_sensor_1_temperature_sensor` → "Maira Birojs"
    - `alpstuga_air_quality_moni_temperature_sensor` → "Master guļamistaba"
    - `main_room_main_room_temperature` → "Dzīvojamā istaba"
    - `iconic_home_ara_temperatura` → "Temperatūra ārā" (first renamed "Outside")
    - `tado_smart_thermostat_su0131611904_current_temperature` → "Tado dzīvojamā istaba"
    - `alpstuga_2_master_bedroo_temperature_sensor` → "Master guļamistaba"
  - Note: two entities are now named "Master guļamistaba" (the ALPSTUGA 2 sensor shown on the dashboard, and `alpstuga_air_quality_moni_temperature_sensor`, which is hidden there).
  - Koridors lights renamed via the entity registry (entity ids unchanged): `light.light_10`…`light_13` → "Griesti 1"…"Griesti 4", `light.light_8` → "Griesti 5", `light.light_9` → "Griesti 6".
  - Maira birojs lights renamed (entity ids unchanged): `light.light_16` → "Griesti 1", `light.light_15` → "Griesti 2", `light.light_14` → "Griesti 3" (the "Mairis Office" prefix was dropped; the numbers were kept).
  - The Lights dashboard excludes `sensor.smart_kettle_55b1_temperature` and `sensor.alpstuga_air_quality_moni_temperature_sensor` via `temperature_exclude`.
  - The legacy tado zone **Chillspot**: its 8 entities were removed from the entity registry. The device itself remains (disabled), because the tado integration doesn't support device removal. To remove it completely, delete the Chillspot zone in the tado app. If tado recreates the entities on reload, they'll be disabled and won't appear on dashboards.
  - Registry backups: `core.*_registry.pre-chillspot.<timestamp>`.
- Pre-change backups are in `/config/backups_manual/`, including `configuration.yaml.pre-engineering`.
