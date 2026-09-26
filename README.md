# Engineering Theme for Home Assistant

An industrial control-panel theme for Home Assistant: graphite or light-grey panels, square edges, a safety-orange accent and explicit status colours. Its typography is inspired by [teenage.engineering](https://teenage.engineering/). It has dark and light modes, both checked against WCAG 2.2 AA.

> [!IMPORTANT]
> **This theme is a fork of [Iconic Theme](https://github.com/mairisskuja/iconic-home-assistant-theme)**, which is itself **a fork of [ruudmens/home-assistant-dashboard](https://github.com/ruudmens/home-assistant-dashboard)** by Rudy Mens ([LazyAdmin.nl](https://lazyadmin.nl/smart-home/home-assistant-dashboard/)), specifically its `luxury_dashboard` theme.
>
> Both forks were built in an **AI-accelerated development style with [Claude Code](https://claude.com/claude-code)**, with a gazillion changes along the way. Many thanks to Rudy for the original design, which was in turn inspired by [Handj on Dribbble](https://dribbble.com/shots/20757344-Smart-Home-Concept-Design-originality).

## Highlights

- **Control-panel look**: flat panels with 1px edges and 2–4px corners, no drop shadows, and a graphite neutral scale shared by menus, dialogs and switches.
- **Dark and light modes**: the theme follows the device setting, or you can choose Auto, Light or Dark per user in the profile.
- **teenage.engineering-style type, with free fonts**, self-hosted so wall tablets need no internet:
  - Hanken Grotesk for UI text (stands in for TE's Univers Next);
  - Syncopate wide caps for page, section, card and dialog titles (stands in for TE's TechnoType);
  - IBM Plex Mono for code.
- **Accessible in both modes**: 166 WCAG 2.2 AA contrast checks run before every deploy, including every code-editor syntax colour. The live UI was also scanned in a browser.
- **Orange is used deliberately**: bright orange appears only as a fill with dark text on it. Anywhere orange is text in light mode, it's the dark `#a34405`.

## Console dashboard

`www/engineering-console-card.js` is a lighting console card in the same industrial style. It's an original implementation with no dependencies, visually inspired by the [Workshop Console](https://workshop-console-demo.vercel.app/) demo (a separate commercial product; none of its code or assets are used). It provides:

- **Every light, automatically**: all `light.*` entities, grouped into one module per area, with a tab per floor (sorted by floor level).
- **A knob per light**: drag, scroll or use the arrow keys to dim; tap, Enter or Space to toggle; Home/End for off/full. Lights without dimming get an on/off key. Unavailable lights are hatched and disabled.
- **An on/off toggle per area**, for all of that area's available lights.
- **A title from a zone**: the header and LCD show the name of `zone` (default `zone.home`, i.e. your home location's name), or a fixed `title` if set.
- **An LCD summary** for the current tab (on, off and unavailable counts, average brightness, one dot per light), plus a **SYSTEM** fault list across all lights.
- **Scene tags** (ALL ON, READ, EVENING, NIGHT, OFF) that apply to the current tab, plus a row of **small scene keys in every area module** that apply the same scenes to just that area. Both send colour temperature only to lights that support it, and an area's keys are disabled when none of its lights are available.
- **Accessibility and theming**: knobs are ARIA sliders, toggles are switches, and every text pair passes AA in both modes (checked in the browser). It follows the theme's dark mode.

```yaml
type: custom:engineering-console-card
zone: zone.home                # optional; the zone's name is the console title
title: My console              # optional; overrides the zone name
exclude: [light.some_light]    # optional
scenes:                        # optional; colours: cream, yellow, orange, brown, dark
  - { name: ALL ON, color: cream, brightness: 100, kelvin: 4000 }
  - { name: "OFF", color: dark, brightness: 0 }
```

Install it with `scripts/deploy.sh` (which copies `www/`), then `scripts/install_dashboard.sh <dashboard-url-path> dashboards/lights.json`. That registers the card as a Lovelace resource and saves a panel-view dashboard, backing up the old config first. Barlow Condensed and Share Tech Mono (OFL) are self-hosted with the other fonts.

## Palette

| Role | Dark | Light |
|---|---|---|
| Page | `#16181b` | `#e4e5e2` |
| Panels (cards) | `#1f2226` | `#f4f4f1` |
| Inputs and pickers | `#2a2e33` | `#ffffff` |
| Text | `#eceff2` (13.84:1) | `#16181b` (16.14:1) |
| Secondary text, off-state | `#a9b0b8` (7.29:1) | `#4b5157` (7.29:1) |
| Accent as text or link | `#ff7a1a` (6.12:1) | `#a34405` (5.63:1) |
| Accent fill (with `#16181b` text) | `#ff7a1a` (6.82:1) | `#df600c` (4.93:1) |
| Input outline | `#7d858e` | `#767c83` |
| Success / warning / error / info | `#3ecf6e` `#ffc53d` `#ff6b6b` `#4cc3ff` | `#1d7a3c` `#8a5a00` `#c42b2b` `#0b6aa2` |

Ratios are measured against the panel colour. Card edges (`#3a3f45` / `#c3c6c8`) are decorative, so WCAG doesn't require them to reach 3:1. Input outlines do reach it.

## Requirements

- Home Assistant **2026.9.x** (tested on Core 2026.9.3 with frontend 20260826.7).
- `frontend: themes: !include_dir_merge_named themes` in `configuration.yaml`.
- The font bridge (`www/`) for the custom fonts and title styling. Without it the theme still works, but it falls back to system fonts, and the page base font and titles stay Roboto.

## Installation

### Option A: HACS + font bridge

1. In HACS, go to **⋮ → Custom repositories**, add `https://github.com/mairisskuja/engeneering-home-assistant-theme` and choose the **Theme** type.
2. Install **Engineering Theme**. HACS only installs the theme file.
3. Copy the repository's `www/` folder to `/config/www/engineering-theme/`, then follow steps 3 and 4 of Option B.

### Option B: manual

1. Copy `themes/engineering_theme.yaml` to `/config/themes/`.
2. Copy the contents of `www/` (the file `theme-fonts.js` and the folder `fonts/`) to `/config/www/engineering-theme/`.
3. In `configuration.yaml`:
   ```yaml
   frontend:
     themes: !include_dir_merge_named themes
     extra_module_url:
       - /local/engineering-theme/theme-fonts.js
   ```
   Load only **one** font bridge. This one also covers Iconic Theme, so if you used Iconic's `iconic-fonts.js`, replace it with this one.
4. Restart Home Assistant Core. `extra_module_url` is only read at startup; later theme edits only need `frontend.reload_themes`.

### Option C: scripted over SSH

With the *Terminal & SSH* add-on running, a network port set and your key authorised:

```bash
HA_HOST=root@homeassistant.local ./scripts/deploy.sh
```

The script:
1. runs the contrast check;
2. backs up the current theme on the host;
3. copies the theme, font bridge and fonts;
4. validates the config and reloads themes;
5. confirms that Home Assistant loaded both modes.

It warns if the font bridge isn't registered, or if a second bridge is also loaded.

### Activate

Open your **Profile → Theme**, choose `engineering_theme` and pick **Auto**, **Light** or **Dark**. Then hard-refresh (Cmd+Shift+R / Ctrl+Shift+R). To set it for everyone, add this action to an automation that runs at Home Assistant start:

```yaml
action: frontend.set_theme
data:
  name: engineering_theme
```

## Fonts

teenage.engineering uses licensed Univers Next cuts and its own TechnoType, which can't be redistributed. This theme ships free lookalikes, chosen by comparing them side by side with TE's own webfonts:

| Role | TE original | Used here | Licence |
|---|---|---|---|
| UI text | Univers Next (`te-20` / `te-40`) | **Hanken Grotesk** 300–700 | SIL OFL 1.1 |
| Titles | TechnoType (wide caps) | **Syncopate** 400/700 | Apache 2.0 |
| Code | — | **IBM Plex Mono** 300–600 | SIL OFL 1.1 |

The fonts are self-hosted from `www/fonts/` and include the Latin and Latin Extended character sets, so Latvian and other European accented letters (ā, č, ē, ģ, ī, ķ, ļ, ņ, š, ū, ž) are covered. Each font's licence file is next to it.

### Where the fonts are applied

| Source | What it covers |
|---|---|
| Theme variables | Almost everything: `ha-font-family-*`, `wa-font-family-*`, `mdc-typography-font-family`, `md-ref-typeface-*`, `ha-card-header-font-family`, legacy `paper-font-*` |
| Font bridge `www/theme-fonts.js` | Loads `fonts/fonts.css`; points the places HA hardcodes Roboto at the theme fonts (page base font and sidebar, chart labels, code editor, input chips); and applies `--theme-label-font-family` to page titles, dashboard section headings and dialog titles |

The bridge doesn't hardcode any font. It follows the active theme's variables, so other themes keep their own fonts.

## Accessibility

Target: **WCAG 2.2 AA**, meaning 4.5:1 for text (1.4.3) and 3:1 for UI components such as input outlines, switch outlines and knobs, slider tracks, focus rings and state icons (1.4.11).

```bash
python3 scripts/contrast_check.py
```

It reads both mode blocks from the theme file. Where the theme doesn't override one of Home Assistant's colour tokens, it checks the colour HA actually uses for that token in each mode. It exits non-zero on any failure. See [CHANGELOG.md](CHANGELOG.md) for what was checked in the browser.

## Repository layout

```
themes/engineering_theme.yaml   The theme (dark + light)
www/theme-fonts.js              Font bridge (frontend.extra_module_url)
www/fonts/                      Self-hosted fonts, fonts.css and licences
www/engineering-console-card.js Lighting console card (custom:engineering-console-card)
dashboards/lights.json       Example dashboard config for the console
scripts/install_dashboard.sh    Registers the card and saves a dashboard config
scripts/ha_ws.py                Runs HA websocket commands on the host
scripts/contrast_check.py       WCAG gate for both modes (no dependencies)
scripts/deploy.sh               SSH deploy: check, back up, copy, reload, verify
scripts/verify_theme.py         Runs on the HA host; confirms both modes loaded
docs/HANDOVER.md                Project state, decisions and open items
CHANGELOG.md                    History, including inherited Iconic entries
NOTICE                          Upstream MIT notices
hacs.json                       HACS metadata
```

## Customising

- Put colours under `modes: dark:` **and** `modes: light:`. Top-level keys apply to both modes; use them only for fonts, geometry and the neutral grey scale.
- In light mode, keep `primary-color` dark enough to use as text. Home Assistant uses it as a text colour for tabs, links and the selected sidebar item.
- Run `scripts/contrast_check.py` after every colour change.

## Credits and licence

- Original theme and dashboard design: [Rudy Mens / LazyAdmin.nl](https://github.com/ruudmens/home-assistant-dashboard), MIT.
- Iconic Theme (accessibility rework, font bridge, tooling): [Mairis Skuja [Iconic FAB]](https://github.com/mairisskuja/iconic-home-assistant-theme), MIT.
- Engineering Theme: Mairis Skuja, built with [Claude Code](https://claude.com/claude-code).
- Fonts: Hanken Grotesk (© 2021 The Hanken Grotesk Project Authors, OFL), Syncopate (© 2010 Astigmatic, Apache 2.0), IBM Plex Mono (© 2017 IBM Corp., OFL), Barlow Condensed and Share Tech Mono (OFL).
- Console card look: inspired by [Workshop Console](https://workshop-console-demo.vercel.app/). This is an independent implementation, not affiliated with that product.
- Visual inspiration: [teenage.engineering](https://teenage.engineering/). This project isn't affiliated with or endorsed by teenage engineering, and it doesn't include any of their fonts or assets.

This repository is released under the [GNU GPL v3.0](LICENSE). It incorporates MIT-licensed work from the projects above; their notices are kept in [NOTICE](NOTICE). The font licences are in `www/fonts/`.
