# Changelog

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
