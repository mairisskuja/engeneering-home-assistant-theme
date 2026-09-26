# Engineering Theme for Home Assistant

A Home Assistant theme built on an accessibility-first foundation, with SF typography, a WCAG 2.2 AA contrast gate and scripted deploys. A completely new visual design is being built on top of it.

> [!IMPORTANT]
> **This theme is a fork of [Iconic Theme](https://github.com/mairisskuja/iconic-home-assistant-theme)**, which is itself **a fork of [ruudmens/home-assistant-dashboard](https://github.com/ruudmens/home-assistant-dashboard)** by Rudy Mens ([LazyAdmin.nl](https://lazyadmin.nl/smart-home/home-assistant-dashboard/)), specifically its `luxury_dashboard` theme.
>
> Both forks were built in an **AI-accelerated development style with [Claude Code](https://claude.com/claude-code)**, with a gazillion changes along the way. Many thanks to Rudy for the original design, which was in turn inspired by [Handj on Dribbble](https://dribbble.com/shots/20757344-Smart-Home-Concept-Design-originality).

> [!NOTE]
> **Status: freshly forked.** The theme currently looks the same as Iconic Theme 1.1.0 (charcoal and gold); only its identifiers differ, so both can be installed side by side. The new Engineering design will replace the palette below. See [docs/HANDOVER.md](docs/HANDOVER.md).

## Highlights

- **Apple SF typography everywhere**: SF Pro Text for body text, SF Pro Display for headings and SF Mono for code, via the system font stack. Nothing is downloaded. A small companion module (`www/theme-fonts.js`) also covers the places where Home Assistant hardcodes Roboto: the sidebar and page base font, chart labels, code editor and input chips.
- **Accessible by default**: every text and UI colour pair meets WCAG 2.2 AA, enforced by a contrast checker that runs before each deploy (69 checks, including every code-editor syntax colour), and verified in a live browser scan of the rendered UI.
- **A proper dark theme**: all colours sit under `modes: dark:`, so Home Assistant's own dark base styles every form, dropdown, menu and dialog. No more white-on-white labels.
- **Gold everywhere**: a full `ha-color-primary-*` ramp, so switches, buttons, links and focus rings follow the theme instead of falling back to Home Assistant blue.
- **Clear state colours**: off is warm grey, on is gold, so state never depends on icon position alone.

## Palette

| Role | Colour | Contrast |
|---|---|---|
| Page background | `#211f1f` | — |
| Cards, header surfaces | `#2c292a` | — |
| Inputs, dropdowns | `#363233` | — |
| Primary text | `#ffffff` | 14.41:1 on cards |
| Secondary text, off-state icons | `#c2bbb3` | 7.58:1 on cards |
| Accent / active / selected | `#eac578` | 8.75:1 on cards |
| Links, focus ring | `#d4ad5c` | 6.81:1 on cards |
| Text on gold fills | `#211f1f` | 9.96:1 on gold |

## Requirements

- Home Assistant **2026.9.x** (tested on Core 2026.9.3 with frontend 20260826.7). Older releases may not know the `ha-color-*` and `ha-slider-*` variables. The theme still loads there, but switches and buttons fall back to default colours.
- `frontend: themes: !include_dir_merge_named themes` in `configuration.yaml`.

## Installation

### Option A: HACS

1. In HACS, go to **⋮ → Custom repositories**, add `https://github.com/mairisskuja/engeneering-home-assistant-theme` and choose the **Theme** type.
2. Install **Engineering Theme**.
3. Run the `frontend.reload_themes` action, or restart Home Assistant.
4. HACS installs only the theme file. For SF in the sidebar, charts and code editor, also install the font bridge (steps 3 and 4 of Option B).

### Option B: manual

1. Copy `themes/engineering_theme.yaml` to `/config/themes/` on your Home Assistant instance.
2. Make sure `configuration.yaml` contains:
   ```yaml
   frontend:
     themes: !include_dir_merge_named themes
   ```
3. Copy `www/theme-fonts.js` to `/config/www/engineering-theme/theme-fonts.js` and load it on every page:
   ```yaml
   frontend:
     themes: !include_dir_merge_named themes
     extra_module_url:
       - /local/engineering-theme/theme-fonts.js
   ```
4. Restart Home Assistant Core. `extra_module_url` is only read at startup; later theme edits only need `frontend.reload_themes`.

### Option C: scripted over SSH

With the *Terminal & SSH* add-on running, a network port set and your key authorised:

```bash
HA_HOST=root@homeassistant.local ./scripts/deploy.sh
```

This runs the contrast check, backs up the current theme on the host, copies the theme and the font bridge, validates the config, reloads themes and confirms that Home Assistant loaded the theme in dark mode. It warns if `configuration.yaml` doesn't load the font bridge yet. Add the `extra_module_url` entry from Option B and restart Core once.

### Activate

Open your **Profile → Theme** and choose `engineering_theme`, then hard-refresh the browser (Cmd+Shift+R / Ctrl+Shift+R). To make it the default for everyone, add this action to an automation that runs at Home Assistant start:

```yaml
action: frontend.set_theme
data:
  name: engineering_theme
  mode: dark
```

## Fonts

Apple's licence does not allow SF fonts to be self-hosted on the web, so the theme uses whatever font is installed on the device:

| Device | Rendered font |
|---|---|
| macOS, iOS, iPadOS (Safari and Chrome) | SF Pro / SF Mono |
| Android, including most wall tablets | Roboto |
| Windows | Segoe UI / Consolas |
| Linux | `system-ui` default |

### Where the font is set

| Source | What it covers | How |
|---|---|---|
| Theme variables | Almost everything: `ha-font-family-*`, `wa-font-family-*`, `mdc-typography-font-family`, `md-ref-typeface-*`, legacy `paper-font-*` | `themes/engineering_theme.yaml` |
| Font bridge | Places Home Assistant hardcodes Roboto: base page font (sidebar), ECharts canvas labels, code editor text and search/autocomplete, input chips | `www/theme-fonts.js` |

The bridge doesn't hardcode SF. It points those places at the active theme's `--ha-font-family-body` and `--ha-font-family-code`, so other themes keep their own fonts.

If you need an identical look everywhere, self-host [Inter](https://rsms.me/inter/) (free, open licence, designed to closely resemble SF) and add `Inter` after `system-ui` in the four `ha-font-family-*` variables.

## Accessibility

Target: **WCAG 2.2 AA**. The requirements are 4.5:1 for text (1.4.3) and 3:1 for UI components such as tracks, borders, focus rings and state icons (1.4.11).

```bash
python3 scripts/contrast_check.py
```

It reads the colours straight from the theme file and exits non-zero on any failure. See [CHANGELOG.md](CHANGELOG.md) for the list of accessibility issues fixed relative to the upstream theme.

## Repository layout

```
themes/engineering_theme.yaml    The theme
www/theme-fonts.js         Font bridge for the spots HA hardcodes Roboto (extra_module_url)
scripts/contrast_check.py   WCAG contrast gate (local, no dependencies)
scripts/deploy.sh           SSH deploy: check, back up, copy, reload, verify
scripts/verify_theme.py     Runs on the HA host; confirms the theme loaded in dark mode
docs/HANDOVER.md            Project state, decisions and open items for the next maintainer
CHANGELOG.md                What changed relative to upstream
hacs.json                   HACS metadata
```

## Customising

- Change colours in `themes/engineering_theme.yaml` under `modes: dark:`, **not** at the top level. Top-level colours bypass dark mode and bring back the white-on-white bug.
- If you change the gold, regenerate the whole `ha-color-primary-05…95` ramp and keep `-60` at 4.5:1 or more against the card background.
- Run `scripts/contrast_check.py` after every colour change.

## Credits and licence

- Original theme and dashboard design: [Rudy Mens / LazyAdmin.nl](https://github.com/ruudmens/home-assistant-dashboard), MIT.
- Iconic Theme (SF typography, accessibility rework, tooling): [Mairis Skuja [Iconic FAB]](https://github.com/mairisskuja/iconic-home-assistant-theme), MIT.
- Engineering Theme: Mairis Skuja, built with [Claude Code](https://claude.com/claude-code).

This repository is released under the [GNU GPL v3.0](LICENSE). It incorporates MIT-licensed work from the projects above; their copyright and permission notices are kept in [NOTICE](NOTICE), as the MIT licence requires.
