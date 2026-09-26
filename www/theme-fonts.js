// Engineering Theme font bridge.
//
// Theme variables cannot reach a few places where the HA frontend hardcodes
// Roboto. This module (loaded via frontend.extra_module_url) points them at
// the active theme's --ha-font-family-body instead:
//   - index.html base font (sidebar and anything inheriting from <body>)
//   - code editor search field and autocomplete details
//   - code editor text (CodeMirror's generic monospace -> --ha-font-family-code)
//   - input chips (--md-input-chip-label-text-font)
//   - chart labels (ECharts draws on canvas with a fixed font string)
// It also loads the self-hosted fonts and applies an optional
// --theme-label-font-family to page, section and dialog titles.
// With a theme that doesn't set a font, --ha-font-family-body is HA's own
// Roboto stack, so this module changes nothing.

const FONT_VAR = "var(--ha-font-family-body)";

// Self-hosted theme fonts (Hanken Grotesk, Syncopate, IBM Plex Mono).
// @font-face only downloads a file when text actually uses that family, so
// this costs nothing while another theme is active.
if (!document.getElementById("engineering-theme-fonts")) {
  const link = document.createElement("link");
  link.id = "engineering-theme-fonts";
  link.rel = "stylesheet";
  link.href = new URL("fonts/fonts.css", import.meta.url).href;
  document.head.appendChild(link);
}

// Document level: beats the <style> block in index.html (adopted sheets come
// later in the cascade).
const documentSheet = new CSSStyleSheet();
documentSheet.replaceSync(`html, body { font-family: ${FONT_VAR}; }`);
document.adoptedStyleSheets = [...document.adoptedStyleSheets, documentSheet];

// Shadow roots: appended after each component's own styles.
const shadowSheet = new CSSStyleSheet();
shadowSheet.replaceSync(`
  :host { --md-input-chip-label-text-font: ${FONT_VAR}; }
  .cm-textfield, .cm-completionDetail { font-family: ${FONT_VAR} !important; }
  .cm-scroller, .cm-tooltip-autocomplete > ul {
    font-family: var(--ha-font-family-code) !important;
  }
  /* Label font for titles that HA renders in the body font. These elements
     only inherit a font, so the "inherit" fallback keeps other themes as-is. */
  :host(hui-root) .main-title,
  :host(hass-subpage) .main-title,
  :host(hass-tabs-subpage) .main-title,
  :host(ha-top-app-bar-fixed) .title,
  :host(hui-heading-card) p,
  :host(ha-dialog-header) .header-title {
    font-family: var(--theme-label-font-family, inherit);
  }
`);

const withBridge = (sheets) =>
  sheets.includes(shadowSheet) ? sheets : [...sheets, shadowSheet];

// Lit assigns adoptedStyleSheets right after attachShadow, which would drop a
// sheet added earlier, so wrap the setter to keep ours last.
const descriptor = Object.getOwnPropertyDescriptor(
  ShadowRoot.prototype,
  "adoptedStyleSheets"
);
Object.defineProperty(ShadowRoot.prototype, "adoptedStyleSheets", {
  configurable: true,
  enumerable: descriptor.enumerable,
  get() {
    return descriptor.get.call(this);
  },
  set(sheets) {
    descriptor.set.call(this, withBridge(sheets));
  },
});

// Charts: ECharts renders to canvas, so CSS can't reach its text. Wrap each
// chart instance's setOption to inject the theme font.
const themeFont = () =>
  getComputedStyle(document.documentElement)
    .getPropertyValue("--ha-font-family-body")
    .trim() || "sans-serif";

const patchChart = (chart) => {
  if (!chart || chart.__themeFonts) return;
  chart.__themeFonts = true;
  const setOption = chart.setOption.bind(chart);
  chart.setOption = (option, ...rest) =>
    setOption(
      { ...option, textStyle: { ...option?.textStyle, fontFamily: themeFont() } },
      ...rest
    );
  chart.setOption({});
};

const chartHosts = new Set();
const watchChart = (host) => {
  if (chartHosts.has(host)) return;
  chartHosts.add(host);
  patchChart(host.chart);
};

// HA re-creates charts (theme change, resize, data reload), so re-check
// connected chart hosts periodically; cheap, only touches known hosts.
setInterval(() => {
  for (const host of chartHosts) {
    if (!host.isConnected) chartHosts.delete(host);
    else patchChart(host.chart);
  }
}, 1000);

// Catch shadow roots created from now on.
const attachShadow = Element.prototype.attachShadow;
Element.prototype.attachShadow = function (init) {
  const root = attachShadow.call(this, init);
  root.adoptedStyleSheets = root.adoptedStyleSheets;
  if (this.localName === "ha-chart-base") watchChart(this);
  return root;
};

// And the ones that existed before this module loaded.
const sweep = (root) => {
  for (const el of root.querySelectorAll("*")) {
    if (!el.shadowRoot) continue;
    el.shadowRoot.adoptedStyleSheets = el.shadowRoot.adoptedStyleSheets;
    if (el.localName === "ha-chart-base") watchChart(el);
    sweep(el.shadowRoot);
  }
};
sweep(document);
