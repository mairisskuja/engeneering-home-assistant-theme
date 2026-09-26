# Handover: Engineering Theme

State of the project as of **2026-09-26**, for whoever picks it up next.

## 1. What this is

Engineering Theme is a Home Assistant frontend theme forked from [Iconic Theme](https://github.com/mairisskuja/iconic-home-assistant-theme) 1.1.0, which is itself a fork of `luxury_dashboard` in [ruudmens/home-assistant-dashboard](https://github.com/ruudmens/home-assistant-dashboard). It inherits Iconic's engineering: a dark-mode colour model, SF typography with a font bridge, a WCAG 2.2 AA contrast gate, and the deploy and verification scripts. It is meant to grow into a completely different visual design. Until that redesign lands it looks identical to Iconic Theme; only the identifiers differ, so both can be installed side by side.

Development was AI-accelerated with Claude Code: source research against the HA frontend, contrast maths, the deploy and verification scripts, and these docs.

## 2. Current status

| Item | Status |
|---|---|
| Theme file | Forked from Iconic 1.1.0; `themes/engineering_theme.yaml` (identical look for now) |
| Contrast gate | 69/69 WCAG AA checks pass (`scripts/contrast_check.py`) |
| Font bridge | `www/theme-fonts.js`, served at `/local/engineering-theme/theme-fonts.js` |
| Deployed to the reference HA instance | **Not yet** |
| New visual design | **Not started**; direction to be decided (see open items) |
| HACS | `hacs.json` present; installable as a custom repository |

Reference environment: Home Assistant OS, Core **2026.9.3**, frontend **20260826.7**.

## 3. How the theme works (read before editing)

These are the non-obvious facts, verified in the HA frontend source (`src/state/themes-mixin.ts`, `src/common/dom/apply_themes_on_element.ts`, `src/resources/theme/**`):

1. **Dark vs light is decided by `modes`.** A theme without `modes.dark` is always rendered as **light**, whatever the user or OS prefers. HA then keeps its light base (`--input-fill-color`, menu and dialog surfaces, `--ha-color-*` semantic tokens) and only overlays your variables. That was the cause of the invisible labels and pull-downs. With only `modes.dark` present, HA forces dark mode and applies its full dark base underneath.
2. **Top-level keys apply in every mode, and `modes.dark` keys win.** Fonts and radii live at the top level; every colour lives under `modes.dark`.
3. **Custom themes do not get a generated primary palette.** HA only derives the `ha-color-primary-05…95` ramp from `primary-color` for its *default* theme. Switches, filled buttons, links and focus rings read that ramp, so the theme must define all eleven steps itself.
4. **Dead variables.** `switch-checked-color`, `switch-unchecked-*` and `paper-slider-*` are no longer read by any component in 2026.9, so they were removed. Sliders use `ha-slider-thumb-color`, `ha-slider-indicator-color` and `ha-slider-track-color`.
5. **Filled (loud) buttons** use `ha-color-fill-primary-loud-*` with text in `ha-color-on-primary-loud`. HA's default is white text on primary-40; the theme uses gold primary-70 with dark text, which passes both text and boundary contrast.
6. **Hardcoded Roboto.** A few places ignore every theme variable: the `<body>` style in `index.html` (so the sidebar inherits Roboto), ECharts' canvas `textStyle`, CodeMirror's `.cm-textfield` and `.cm-completionDetail`, CodeMirror's generic `monospace`, and `ha-input-chip`. `www/theme-fonts.js` bridges them to `--ha-font-family-body` and `--ha-font-family-code`. It works by adopting a stylesheet into the document and every shadow root, wrapping the `ShadowRoot.adoptedStyleSheets` setter because Lit replaces the array, and wrapping each chart's `setOption`. It depends on frontend internals, so re-check it after each HA frontend upgrade (see section 5).
7. **Code editor colours.** HA's dark `codemirror-*` defaults were designed for `#1c1c1c`. On the warmer `#2c292a` card, and on the active line (10% secondary text over the card), comments, variables, numbers and tags failed. All 18 tokens are now defined in the theme.

## 4. Design decisions

| Decision | Why |
|---|---|
| Dark-only (no `modes.light`) | The brand is dark. A light mode would double the palette and testing surface for no current need. |
| System font stack instead of shipping SF | Apple's SF licence forbids web self-hosting. The stack gives real SF on Apple devices and native fonts elsewhere. |
| Secondary text and off-state icons in warm grey `#c2bbb3` instead of gold | In the upstream theme gold meant everything: secondary text, links, on and off. Now gold only means *active, link or selected*. |
| Gold fills with dark text | White on `#eac578` is 1.65:1; `#211f1f` on gold is 9.96:1. |
| Slider track `#8a827c` | The lowest warm grey that clears 3:1 (3.82:1) without competing with the gold indicator. |

## 5. Working on it

```bash
# 1. Edit colours under modes.dark in themes/engineering_theme.yaml
# 2. Check contrast
python3 scripts/contrast_check.py
# 3. Deploy to a test instance (backs up, validates, reloads, verifies)
HA_HOST=root@homeassistant.local ./scripts/deploy.sh
# 4. Hard-refresh the browser and check: Settings → Automations → New automation
#    (text fields and dropdowns), a dialog, the sidebar, a toggle, a slider
```

When adding a colour pair the UI actually renders, add a line to `checks` in `scripts/contrast_check.py`.

**After every HA frontend upgrade**, open a few pages and check in the browser console that nothing renders in Roboto and that charts are patched:

```js
// every text node's font family, across shadow roots
const f={};(function w(r){for(const e of r.querySelectorAll('*')){if(e.shadowRoot)w(e.shadowRoot)}
 const t=document.createTreeWalker(r,4);let n;while(n=t.nextNode()){const p=n.parentNode;
 if(p?.nodeType===1&&n.textContent.trim()){const k=getComputedStyle(p).fontFamily.split(',')[0];f[k]=(f[k]||0)+1}}})(document);f
```

### SSH access to Home Assistant

`deploy.sh` needs the **Terminal & SSH** (or *Advanced SSH & Web Terminal*) add-on:

- **Configuration → Network**: set a host port (22). This section has its own Save button, and if it's left blank the add-on only works as the web terminal.
- **authorized_keys**: add your public key, then restart the add-on.
- If `homeassistant.local` resolves to several addresses, SSH to the IP directly.

Backups made by `deploy.sh` are stored on the host in `/config/backups_manual/engineering_theme.yaml.<timestamp>`. To roll back, copy one back to `/config/themes/engineering_theme.yaml` and run `frontend.reload_themes`.

## 6. Open items and next steps

0. **Define and build the new visual design.** This is the reason the fork exists. Every colour change must keep `scripts/contrast_check.py` green.
1. **Remaining visual QA.** Desktop Chrome is verified. Still to check:
   - a switch in the *on* state and a slider inside a more-info dialog (every light was unavailable during testing, and toggling a profile switch would have changed account settings);
   - Safari on iOS or iPadOS;
   - the wall tablet;
   - the energy dashboard.
2. **Unthemed neutral surfaces.** Menus, dialogs and the off-state switch (track `#202020`, border `#7a7a7a`, thumb `#989898`) use HA's cool `ha-color-neutral-*` ramp, while cards are warm `#2c292a`. This is accessible (off-switch border 3.36:1, thumb 5.65:1) but slightly off-brand; a warm neutral ramp would unify it.
3. **Multi-select checkmarks are white, not gold.** `ha-form-multi_select` draws the checkbox as an icon in the primary text colour. It's readable but not themeable without the font bridge's approach.
4. **Font on non-Apple devices.** Android wall tablets render Roboto. Consider self-hosting Inter as a fallback (instructions in the README).
5. **Upstream `luxury_dashboard` has the same accessibility bugs.** It could be fixed the same way and offered upstream as a PR.
6. **HACS default listing.** Submitting it needs a tagged GitHub release and screenshots in the README.
7. **Version floor.** Only tested on 2026.9.3. Establish the minimum supported HA version and add `"homeassistant"` to `hacs.json`.

## 7. Reference instance notes

These are unrelated to this repo, but they exist on the instance where the theme was developed. Don't be surprised by them:

- Iconic Theme and the upstream `luxury_dashboard` theme are also installed, together with its assets in `/config/www/assets/`.
- `configuration.yaml` loads two modules through `frontend: extra_module_url:`. `/local/iconic-theme/iconic-fonts.js` is Iconic's font bridge. Only one bridge is needed, since both follow the active theme's font variables. When deploying this fork, either keep Iconic's bridge or swap it for `/local/engineering-theme/theme-fonts.js`; don't load both. `/local/assets/css/load-fonts.js` is a Poppins loader for `luxury_dashboard`; neither Iconic nor Engineering needs it, and it can be removed if `luxury_dashboard` is uninstalled (Core restart required).
- Pre-change backups are in `/config/backups_manual/`.
