// Engineering Console card: an industrial control-panel lighting console.
//
// Finds every light automatically, groups them by area and floor, and gives
// each a brightness knob. Also shows an LCD summary, area toggles, scene tags
// and a fault list. Part of Engineering Theme; original implementation, no
// dependencies.
//
//   type: custom:engineering-console-card
//   title: ESSENTIAL                 # optional
//   exclude: [light.some_light]      # optional
//   scenes:                          # optional, replaces the defaults;
//                                    # shown as big tags (current floor) and
//                                    # as small keys in every area module
//     - { name: ALL ON, color: cream, brightness: 100 }
//     - { name: EVENING, color: orange, brightness: 45, kelvin: 2700 }
//     - { name: "OFF", color: dark, brightness: 0 }
//   Scene colours: cream, yellow, orange, brown, dark.

const VERSION = "0.2.0";

const DEFAULT_SCENES = [
  { name: "ALL ON", color: "cream", brightness: 100, kelvin: 4000 },
  { name: "READ", color: "yellow", brightness: 90, kelvin: 3500 },
  { name: "EVENING", color: "orange", brightness: 45, kelvin: 2700 },
  { name: "NIGHT", color: "brown", brightness: 8, kelvin: 2200 },
  { name: "OFF", color: "dark", brightness: 0 },
];

const SWEEP = 270; // knob travel in degrees
const TICKS = 27;
const SEND_INTERVAL = 300; // ms between service calls while dragging

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const storage = {
  get(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
  },
};

const STYLE = `
  :host {
    --paper: #e3e1dc; --paper-hi: #eeece8; --face: #f2f0eb; --face-lo: #d9d6cf;
    --rule: #1f1f1d; --ink: #1d1d1b; --soft: #55534e; --tick-off: #6f6c65;
    --orange: #ff5a1c; --pointer: #c73f0c; --pill-on: #e2480e;
    --lcd: #1c1b19; --lcd-hi: #ff6b2b; --lcd-soft: #e0a070; --lcd-dim: #3a2a20;
    --ok: #3f7a33; --bad: #c42b2b; --tab-dark: #2c2e33;
    --tag-cream: #e9e6de; --tag-yellow: #ecc14a; --tag-orange: #ff5a1c;
    --tag-brown: #9a4f17; --tag-dark: #2c2e33;
    --fc: "Barlow Condensed", "Arial Narrow", "Roboto Condensed", sans-serif;
    --fm: "Share Tech Mono", "IBM Plex Mono", ui-monospace, Menlo, monospace;
    display: block;
    color: var(--ink);
  }
  :host([dark]) {
    --paper: #1f2226; --paper-hi: #262a2f; --face: #2a2e33; --face-lo: #1a1d20;
    --rule: #4a5057; --ink: #eceff2; --soft: #a9b0b8; --tick-off: #6b737b;
    --orange: #ff7a1a; --pointer: #ff7a1a; --pill-on: #ff7a1a;
    --lcd: #0f1113; --lcd-hi: #ff7a1a; --lcd-soft: #e8a36b; --lcd-dim: #2e2014;
    --ok: #3ecf6e; --bad: #ff6b6b; --tab-dark: #0f1113;
    --tag-cream: #d9d6cf;
  }
  * { box-sizing: border-box; }
  button { font: inherit; color: inherit; }
  :focus-visible { outline: 3px solid var(--pointer); outline-offset: 2px; }

  .wrap { position: relative; padding: 14px; background: var(--paper); min-height: 100%; }
  .cross { position: absolute; width: 24px; height: 24px; pointer-events: none; }
  .cross::before, .cross::after { content: ""; position: absolute; background: var(--rule); }
  .cross::before { left: 11px; top: 0; width: 1.5px; height: 24px; }
  .cross::after { top: 11px; left: 0; height: 1.5px; width: 24px; }
  .c-tl { left: 2px; top: 2px; } .c-tr { right: 2px; top: 2px; }
  .c-bl { left: 2px; bottom: 2px; } .c-br { right: 2px; bottom: 2px; }

  .console { border: 1.5px solid var(--rule); background: var(--rule); display: grid; gap: 1.5px; }

  /* Top bar */
  .topbar {
    background: var(--paper); display: flex; align-items: center; gap: 16px;
    padding: 10px 16px; flex-wrap: wrap;
  }
  .brand { font: 700 26px/1 var(--fc); letter-spacing: .02em; text-transform: uppercase; margin-right: auto; }
  .tabs { display: flex; gap: 6px; flex-wrap: wrap; }
  .key {
    display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
    border: 1.5px solid var(--rule); border-radius: 3px; padding: 6px 12px;
    background: var(--paper-hi); box-shadow: 0 3px 0 var(--rule);
    font: 600 16px/1 var(--fc); text-transform: uppercase; letter-spacing: .03em;
    transition: transform .05s, box-shadow .05s;
  }
  .key:active { transform: translateY(2px); box-shadow: 0 1px 0 var(--rule); }
  .key .num { font: 12px var(--fm); color: var(--soft); }
  .key[aria-selected="true"] { background: var(--tab-dark); color: #fff; }
  .key[aria-selected="true"] .num { color: #c9c6bf; }
  .led { width: 9px; height: 9px; border-radius: 50%; background: var(--tick-off); flex: none;
    box-shadow: inset 0 1px 1px rgba(0,0,0,.35); }
  .led.on { background: var(--orange); box-shadow: 0 0 6px var(--orange); }
  .led.ok { background: var(--ok); }
  .led.bad { background: var(--bad); box-shadow: 0 0 6px var(--bad); }
  .status { text-align: right; }
  .clock { font: 600 20px/1.1 var(--fc); letter-spacing: .04em; }
  .link { font: 12px var(--fm); color: var(--soft); display: flex; gap: 6px; align-items: center; justify-content: flex-end; }

  /* Module grid */
  .grid { display: grid; gap: 1.5px; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); background: var(--rule); }
  .module { background: var(--paper); padding: 16px 18px 18px; position: relative; min-width: 0; }
  .module::before { content: ""; position: absolute; left: 5px; top: 5px; width: 7px; height: 7px; background: var(--ink); }
  .mhead { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
  .mtitle { font: 600 19px/1.1 var(--fc); text-transform: uppercase; letter-spacing: .03em; margin: 0; }
  .mmeta { font: 12px var(--fm); color: var(--soft); margin-left: auto; text-transform: uppercase; }
  .wide { grid-column: 1 / -1; }
  @media (min-width: 700px) { .summary { grid-column: span 2; } }

  /* LCD */
  .lcd {
    background: var(--lcd); border-radius: 8px; padding: 16px 18px;
    border: 3px solid #2c2e33; box-shadow: inset 0 0 0 2px #000, inset 0 6px 16px rgba(0,0,0,.6);
    display: flex; gap: 18px; align-items: center; justify-content: space-between;
    color: var(--lcd-soft); font: 18px/1.5 var(--fm); letter-spacing: .04em; min-height: 128px;
  }
  .lcd .l1 { color: var(--lcd-hi); font-size: 22px; }
  .dots { display: grid; grid-template-columns: repeat(var(--cols, 8), 11px); gap: 5px; flex: none; }
  .dot { width: 11px; height: 11px; border-radius: 50%; background: var(--lcd-dim); }
  .dot.on { background: var(--lcd-hi); box-shadow: 0 0 5px var(--lcd-hi); }
  .dot.na { background: transparent; box-shadow: inset 0 0 0 1.5px #7a3b2a; }

  /* Knobs */
  .knobs { display: flex; flex-wrap: wrap; gap: 14px 10px; }
  .kn { width: 112px; display: flex; flex-direction: column; align-items: center; text-align: center; }
  .dial { width: 104px; height: 104px; touch-action: none; cursor: grab; border-radius: 50%; }
  .dial:active { cursor: grabbing; }
  .dial svg { display: block; width: 100%; height: 100%; overflow: visible; }
  .tick { stroke: var(--tick-off); stroke-width: 2; }
  .tick.lit { stroke: var(--ink); }
  .tick.major { stroke-width: 2.6; }
  .face { fill: var(--face); stroke: var(--ink); stroke-width: 2.5; }
  .shadow { fill: var(--face-lo); }
  .ptr { stroke: var(--pointer); stroke-width: 4; stroke-linecap: round; }
  .kn.off .ptr { stroke: var(--tick-off); }
  .val { font: 700 22px/1 var(--fc); margin-top: 4px; }
  .name { font: 11px/1.25 var(--fm); color: var(--soft); text-transform: uppercase; letter-spacing: .06em;
    margin-top: 3px; max-width: 108px; overflow-wrap: anywhere; }
  .kn.na .dial { cursor: not-allowed; opacity: .55; }
  .kn.na .face { fill: url(#hatch); }
  .onoff { width: 64px; height: 64px; border-radius: 6px; margin: 20px 0 16px; }

  /* Pill switch */
  .pill { position: relative; width: 74px; height: 38px; border-radius: 19px; cursor: pointer; flex: none;
    border: 2px solid var(--ink); background: var(--face-lo); padding: 0; }
  .pill::after { content: ""; position: absolute; top: 3px; left: 3px; width: 28px; height: 28px; border-radius: 50%;
    background: var(--face); border: 2px solid var(--ink); transition: left .15s; }
  .pill[aria-checked="true"] { background: var(--pill-on); }
  .pill[aria-checked="true"]::after { left: 37px; }
  .pill:disabled { opacity: .5; cursor: not-allowed; }

  /* Scene tags */
  .tags { display: flex; flex-wrap: wrap; gap: 12px; }
  .tag { position: relative; width: 112px; height: 132px; border-radius: 9px; border: 2px solid var(--rule);
    box-shadow: 0 5px 0 var(--rule); cursor: pointer; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 4px; padding: 0 6px;
    transition: transform .05s, box-shadow .05s; }
  .tag:active { transform: translateY(3px); box-shadow: 0 2px 0 var(--rule); }
  .tag::before { content: ""; position: absolute; top: 12px; width: 12px; height: 12px; border-radius: 50%;
    background: rgba(0,0,0,.28); box-shadow: inset 0 1px 2px rgba(0,0,0,.4); }
  .tag b { font: 700 24px/1 var(--fc); text-transform: uppercase; }
  .tag span { font: 11px var(--fm); letter-spacing: .08em; }
  .t-cream { background: linear-gradient(#f4f2ec, var(--tag-cream)); color: #1d1d1b; }
  .t-yellow { background: linear-gradient(#f3cf66, var(--tag-yellow)); color: #1d1d1b; }
  .t-orange { background: linear-gradient(#ff6e36, var(--tag-orange)); color: #1d1d1b; }
  .t-brown { background: linear-gradient(#b0611f, var(--tag-brown)); color: #fff; }
  .t-dark { background: linear-gradient(#3a3d44, var(--tag-dark)); color: #fff; }

  /* Per-area scene keys */
  .module.area { display: flex; flex-direction: column; }
  .minitags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: auto; padding-top: 14px; align-items: center; }
  .minitags .lbl { font: 11px var(--fm); color: var(--soft); text-transform: uppercase; letter-spacing: .08em; margin-right: 2px; }
  .mtag { border: 1.5px solid var(--rule); border-radius: 5px; box-shadow: 0 3px 0 var(--rule); cursor: pointer;
    font: 600 14px/1 var(--fc); text-transform: uppercase; letter-spacing: .03em; padding: 6px 9px 5px;
    transition: transform .05s, box-shadow .05s; }
  .mtag:active { transform: translateY(2px); box-shadow: 0 1px 0 var(--rule); }
  .mtag:disabled { opacity: .45; cursor: not-allowed; transform: none; box-shadow: 0 3px 0 var(--rule); }

  /* System */
  .leds { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); font: 13px var(--fm); text-transform: uppercase; }
  .leds li { display: flex; align-items: center; gap: 10px; }
  .verdict { font: 700 22px/1 var(--fc); text-transform: uppercase; text-align: right; margin-top: 18px; }
  .hint { font: 11px var(--fm); color: var(--soft); text-align: right; margin-top: 10px; text-transform: uppercase; }

  @media (max-width: 600px) {
    .wrap { padding: 8px; }
    .grid { grid-template-columns: 1fr; }
    .kn { width: 96px; } .dial { width: 88px; height: 88px; }
    .tag { width: 96px; height: 112px; }
  }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
`;

class EngineeringConsoleCard extends HTMLElement {
  setConfig(config) {
    this._config = {
      title: "CONSOLE",
      exclude: [],
      scenes: DEFAULT_SCENES,
      ...config,
    };
    this._structure = null;
    this._pending = new Map(); // entity_id -> local brightness while dragging
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this._tab = storage.get(`ecc-tab-${this._config.title}`) || "all";
  }

  set hass(hass) {
    this._hass = hass;
    this.toggleAttribute("dark", !!hass.themes?.darkMode);
    const model = this._model();
    const key = JSON.stringify([this._tab, model.tabs.map((t) => t.id), model.areas.map((a) => [a.id, a.lights.map((l) => l.id + l.kind)])]);
    if (key !== this._structure) {
      this._structure = key;
      this._render(model);
    }
    this._update(model);
  }

  connectedCallback() {
    this._timer = setInterval(() => this._tick(), 1000 * 15);
  }

  disconnectedCallback() {
    clearInterval(this._timer);
  }

  getCardSize() {
    return 12;
  }

  // ----- data -------------------------------------------------------------

  _model() {
    const h = this._hass;
    const exclude = new Set(this._config.exclude);
    const areaOf = (id) => {
      const ent = h.entities?.[id];
      return ent?.area_id || h.devices?.[ent?.device_id]?.area_id || null;
    };
    const lights = Object.keys(h.states)
      .filter((id) => id.startsWith("light.") && !exclude.has(id))
      .filter((id) => !h.entities?.[id]?.hidden && !h.entities?.[id]?.entity_category)
      .map((id) => {
        const st = h.states[id];
        const modes = st.attributes.supported_color_modes || [];
        const dimmable = modes.some((m) => m !== "onoff");
        return {
          id,
          name: this._shortName(st.attributes.friendly_name || id, areaOf(id)),
          area: areaOf(id),
          kind: dimmable ? "dim" : "onoff",
          modes,
        };
      });

    const floors = Object.values(h.floors || {}).sort(
      (a, b) => (a.level ?? 99) - (b.level ?? 99) || a.name.localeCompare(b.name)
    );
    const areaList = [];
    const byArea = new Map();
    for (const l of lights) {
      if (!byArea.has(l.area)) byArea.set(l.area, []);
      byArea.get(l.area).push(l);
    }
    for (const [areaId, ls] of byArea) {
      const area = h.areas?.[areaId];
      areaList.push({
        id: areaId || "none",
        name: area?.name || "Unassigned",
        floor: area?.floor_id || null,
        lights: ls.sort((a, b) => a.name.localeCompare(b.name)),
      });
    }
    const floorIndex = (f) => floors.findIndex((x) => x.floor_id === f);
    areaList.sort((a, b) => {
      const fa = floorIndex(a.floor), fb = floorIndex(b.floor);
      return (fa < 0 ? 99 : fa) - (fb < 0 ? 99 : fb) || a.name.localeCompare(b.name);
    });

    const tabs = [{ id: "all", name: "All" }];
    for (const f of floors) {
      if (areaList.some((a) => a.floor === f.floor_id)) tabs.push({ id: f.floor_id, name: f.name });
    }
    if (areaList.some((a) => !a.floor) && tabs.length > 1) tabs.push({ id: "other", name: "Other" });
    if (!tabs.some((t) => t.id === this._tab)) this._tab = "all";

    const areas = areaList.filter((a) =>
      this._tab === "all" ? true : this._tab === "other" ? !a.floor : a.floor === this._tab
    );
    return { tabs, areas, all: lights };
  }

  _shortName(name, areaId) {
    // Drop a leading "<area> / " style prefix; the module already names the area.
    const area = this._hass.areas?.[areaId]?.name;
    let n = name;
    if (area && n.toLowerCase().startsWith(area.toLowerCase())) n = n.slice(area.length);
    n = n.replace(/^[\s/:\-–]+/, "").trim();
    return n || name;
  }

  _state(id) {
    const st = this._hass.states[id];
    if (!st || st.state === "unavailable" || st.state === "unknown") return { na: true, on: false, pct: 0 };
    const on = st.state === "on";
    const pct = this._pending.has(id)
      ? this._pending.get(id)
      : on ? Math.max(1, Math.round(((st.attributes.brightness ?? 255) / 255) * 100)) : 0;
    return { na: false, on, pct };
  }

  // ----- render -----------------------------------------------------------

  _render(model) {
    const c = this._config;
    const scope = model.tabs.find((t) => t.id === this._tab)?.name || "All";
    this.shadowRoot.innerHTML = `
      <style>${STYLE}</style>
      <svg width="0" height="0" style="position:absolute" aria-hidden="true">
        <defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" fill="var(--face)"/><line x1="0" y1="0" x2="0" y2="6" stroke="var(--tick-off)" stroke-width="2"/>
        </pattern></defs>
      </svg>
      <div class="wrap">
        <div class="cross c-tl"></div><div class="cross c-tr"></div><div class="cross c-bl"></div><div class="cross c-br"></div>
        <div class="console">
          <div class="topbar">
            <div class="brand">${esc(c.title)}</div>
            <div class="tabs" role="tablist" aria-label="Floors">
              ${model.tabs.map((t, i) => `
                <button class="key" role="tab" data-tab="${esc(t.id)}" aria-selected="${t.id === this._tab}">
                  <span class="led ${t.id === this._tab ? "on" : ""}"></span>
                  <span class="num">${String(i + 1).padStart(2, "0")}</span>${esc(t.name)}
                </button>`).join("")}
            </div>
            <div class="status">
              <div class="clock" data-clock></div>
              <div class="link"><span class="led" data-linkled></span><span data-linktext></span></div>
            </div>
          </div>
          <div class="grid">
            <section class="module summary" aria-label="Summary">
              <div class="mhead"><h2 class="mtitle">${esc(scope)}</h2><span class="mmeta">Lights</span></div>
              <div class="lcd" role="img" data-lcdlabel>
                <div><div class="l1" data-l1></div><div data-l2></div><div data-l3></div></div>
                <div class="dots" data-dots aria-hidden="true"></div>
              </div>
            </section>
            <section class="module" aria-label="System">
              <div class="mhead"><h2 class="mtitle">System-01</h2></div>
              <ul class="leds" data-faults></ul>
              <div class="verdict" data-verdict></div>
            </section>
            ${model.areas.map((a) => this._areaHtml(a)).join("")}
            <section class="module wide" aria-label="Scenes">
              <div class="mhead"><h2 class="mtitle">Scene selection</h2><span class="mmeta">Applies to: ${esc(scope)}</span></div>
              <div class="tags">
                ${c.scenes.map((s, i) => `
                  <button class="tag t-${esc(s.color || "cream")}" data-scene="${i}">
                    <b>${esc(s.name)}</b><span>[${s.brightness ? `${s.brightness}%` : "OFF"}]</span>
                  </button>`).join("")}
              </div>
              <div class="hint">Drag or scroll a knob to dim · tap to toggle · arrow keys adjust</div>
            </section>
          </div>
        </div>
      </div>`;
    this._bind();
    this._tick();
  }

  _areaHtml(area) {
    return `
      <section class="module area" aria-label="${esc(area.name)}">
        <div class="mhead">
          <h2 class="mtitle">${esc(area.name)}</h2>
          <span class="mmeta" data-areameta="${esc(area.id)}"></span>
          <button class="pill" role="switch" aria-checked="false" aria-label="All lights in ${esc(area.name)}"
            data-area="${esc(area.id)}"></button>
        </div>
        <div class="knobs">${area.lights.map((l) => (l.kind === "dim" ? this._knobHtml(l) : this._onoffHtml(l))).join("")}</div>
        <div class="minitags" role="group" aria-label="Scenes for ${esc(area.name)}">
          <span class="lbl" aria-hidden="true">Scene</span>
          ${this._config.scenes.map((sc, i) => `
            <button class="mtag t-${esc(sc.color || "cream")}" data-ascene="${i}" data-sarea="${esc(area.id)}"
              aria-label="${esc(sc.name)}, ${esc(area.name)}" title="${esc(sc.name)} · ${sc.brightness ? `${sc.brightness}%` : "off"}">${esc(sc.name)}</button>`).join("")}
        </div>
      </section>`;
  }

  _knobHtml(l) {
    const ticks = [];
    for (let i = 0; i < TICKS; i++) {
      const a = (-SWEEP / 2 + (SWEEP * i) / (TICKS - 1)) * (Math.PI / 180);
      const major = i % 13 === 0;
      const r1 = major ? 41 : 43, r2 = 49;
      ticks.push(`<line class="tick${major ? " major" : ""}" data-i="${i}"
        x1="${(50 + r1 * Math.sin(a)).toFixed(2)}" y1="${(50 - r1 * Math.cos(a)).toFixed(2)}"
        x2="${(50 + r2 * Math.sin(a)).toFixed(2)}" y2="${(50 - r2 * Math.cos(a)).toFixed(2)}"/>`);
    }
    return `
      <div class="kn" data-light="${esc(l.id)}">
        <div class="dial" role="slider" tabindex="0" aria-label="${esc(l.name)} brightness"
          aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="Off">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            ${ticks.join("")}
            <circle class="shadow" cx="47" cy="53" r="33"/>
            <circle class="face" cx="50" cy="50" r="33"/>
            <line class="ptr" x1="50" y1="50" x2="50" y2="24"/>
          </svg>
        </div>
        <div class="val" aria-hidden="true">—</div>
        <div class="name">${esc(l.name)}</div>
      </div>`;
  }

  _onoffHtml(l) {
    return `
      <div class="kn" data-light="${esc(l.id)}" data-onoff>
        <button class="key onoff" role="switch" aria-checked="false" aria-label="${esc(l.name)}">
          <span class="led"></span>
        </button>
        <div class="val" aria-hidden="true">—</div>
        <div class="name">${esc(l.name)}</div>
      </div>`;
  }

  // ----- update -----------------------------------------------------------

  _update(model) {
    const root = this.shadowRoot;
    for (const kn of root.querySelectorAll(".kn")) this._paintLight(kn);

    for (const area of model.areas) {
      const sts = area.lights.map((l) => this._state(l.id));
      const live = sts.filter((s) => !s.na);
      const on = live.filter((s) => s.on).length;
      const pill = root.querySelector(`.pill[data-area="${CSS.escape(area.id)}"]`);
      if (pill) {
        pill.setAttribute("aria-checked", String(on > 0));
        pill.disabled = live.length === 0;
      }
      root.querySelectorAll(`[data-sarea="${CSS.escape(area.id)}"]`).forEach((b) => (b.disabled = live.length === 0));
      const meta = root.querySelector(`[data-areameta="${CSS.escape(area.id)}"]`);
      if (meta) meta.textContent = `${on}/${area.lights.length} on`;
    }

    // LCD over the lights in scope
    const scoped = model.areas.flatMap((a) => a.lights);
    const sts = scoped.map((l) => this._state(l.id));
    const on = sts.filter((s) => s.on);
    const na = sts.filter((s) => s.na).length;
    const avg = on.length ? Math.round(on.reduce((t, s) => t + s.pct, 0) / on.length) : 0;
    this._lcd = { on: on.length, off: sts.length - on.length - na, na, avg };
    const set = (sel, text) => { const el = root.querySelector(sel); if (el) el.textContent = text; };
    set("[data-l2]", `ON ${String(on.length).padStart(2, "0")}   OFF ${String(this._lcd.off).padStart(2, "0")}`);
    set("[data-l3]", `N/A ${String(na).padStart(2, "0")}   AVG ${String(avg).padStart(3, " ")}%`);
    const lcd = root.querySelector("[data-lcdlabel]");
    if (lcd) lcd.setAttribute("aria-label", `${on.length} on, ${this._lcd.off} off, ${na} unavailable, average brightness ${avg}%`);
    const dots = root.querySelector("[data-dots]");
    if (dots) {
      dots.style.setProperty("--cols", String(Math.min(8, Math.max(4, Math.ceil(Math.sqrt(sts.length * 2))))));
      dots.innerHTML = sts.map((s) => `<i class="dot${s.na ? " na" : s.on ? " on" : ""}"></i>`).join("");
    }

    // System: faults across ALL lights, not just the tab
    const faults = model.all.filter((l) => this._state(l.id).na);
    const list = root.querySelector("[data-faults]");
    if (list) {
      list.innerHTML = faults.length
        ? faults.map((l) => `<li><span class="led bad"></span>${esc(l.name)} · N/A</li>`).join("")
        : `<li><span class="led ok"></span>All lights online</li>`;
    }
    set("[data-verdict]", faults.length ? `Status: ${faults.length} fault${faults.length > 1 ? "s" : ""}` : "Status: nominal");
    const allOn = model.all.filter((l) => this._state(l.id).on).length;
    set("[data-linktext]", `LINK OK · ${allOn} ON`);
    root.querySelector("[data-linkled]")?.classList.add("ok");
    this._tick();
  }

  _paintLight(kn) {
    const id = kn.dataset.light;
    const s = this._state(id);
    kn.classList.toggle("na", s.na);
    kn.classList.toggle("off", !s.on);
    const val = kn.querySelector(".val");
    val.textContent = s.na ? "N/A" : s.on ? `${s.pct}%` : "OFF";

    if (kn.hasAttribute("data-onoff")) {
      const btn = kn.querySelector("button");
      btn.setAttribute("aria-checked", String(s.on));
      btn.disabled = s.na;
      btn.querySelector(".led").classList.toggle("on", s.on);
      return;
    }
    const dial = kn.querySelector(".dial");
    dial.setAttribute("aria-valuenow", String(s.pct));
    dial.setAttribute("aria-valuetext", s.na ? "Unavailable" : s.on ? `${s.pct}%` : "Off");
    dial.setAttribute("aria-disabled", String(s.na));
    dial.tabIndex = s.na ? -1 : 0;
    const angle = -SWEEP / 2 + (SWEEP * s.pct) / 100;
    kn.querySelector(".ptr").setAttribute("transform", `rotate(${angle} 50 50)`);
    const lit = Math.round((s.pct / 100) * (TICKS - 1));
    kn.querySelectorAll(".tick").forEach((t) => t.classList.toggle("lit", s.on && +t.dataset.i <= lit));
  }

  _tick() {
    const el = this.shadowRoot?.querySelector("[data-clock]");
    if (!el) return;
    const now = new Date();
    const lang = this._hass?.locale?.language || undefined;
    const date = now.toLocaleDateString(lang, { weekday: "short", day: "numeric", month: "short" });
    const time = now.toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" });
    el.textContent = `${date} · ${time}`.toUpperCase();
    const l1 = this.shadowRoot.querySelector("[data-l1]");
    if (l1) l1.textContent = `${String(this._config.title).toUpperCase()} // ${time}`;
  }

  // ----- interaction ------------------------------------------------------

  _bind() {
    const root = this.shadowRoot;
    root.querySelectorAll("[data-tab]").forEach((b) =>
      b.addEventListener("click", () => {
        this._tab = b.dataset.tab;
        storage.set(`ecc-tab-${this._config.title}`, this._tab);
        this._structure = null;
        this.hass = this._hass;
      })
    );
    root.querySelector(".tabs")?.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const tabs = [...root.querySelectorAll("[data-tab]")];
      const i = tabs.indexOf(root.activeElement);
      if (i < 0) return;
      tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length].focus();
    });
    root.querySelectorAll(".pill[data-area]").forEach((p) =>
      p.addEventListener("click", () => this._toggleArea(p.dataset.area, p.getAttribute("aria-checked") === "true"))
    );
    root.querySelectorAll("[data-scene]").forEach((b) =>
      b.addEventListener("click", () => this._applyScene(this._config.scenes[+b.dataset.scene]))
    );
    root.querySelectorAll("[data-ascene]").forEach((b) =>
      b.addEventListener("click", () => this._applyScene(this._config.scenes[+b.dataset.ascene], b.dataset.sarea))
    );
    root.querySelectorAll("[data-onoff] button").forEach((b) =>
      b.addEventListener("click", () => this._call("toggle", b.closest(".kn").dataset.light))
    );
    root.querySelectorAll(".dial").forEach((d) => this._bindDial(d));
  }

  _bindDial(dial) {
    const id = dial.closest(".kn").dataset.light;
    let start = null;

    const setPct = (pct, final) => {
      pct = Math.max(0, Math.min(100, Math.round(pct)));
      this._pending.set(id, pct);
      this._paintLight(dial.closest(".kn"));
      const now = Date.now();
      if (final || !this._lastSend || now - this._lastSend > SEND_INTERVAL) {
        this._lastSend = now;
        this._setBrightness(id, pct);
      }
      if (final) setTimeout(() => this._pending.delete(id), 1500);
    };

    dial.addEventListener("pointerdown", (e) => {
      if (this._state(id).na) return;
      try { dial.setPointerCapture(e.pointerId); } catch { /* synthetic or lost pointer */ }
      start = { y: e.clientY, x: e.clientX, pct: this._state(id).pct, moved: false };
    });
    dial.addEventListener("pointermove", (e) => {
      if (!start) return;
      const dy = start.y - e.clientY + (e.clientX - start.x) * 0.5;
      if (Math.abs(dy) > 3) start.moved = true;
      if (start.moved) setPct(start.pct + dy / 2, false);
    });
    const end = (e) => {
      if (!start) return;
      if (start.moved) setPct(this._pending.get(id) ?? start.pct, true);
      else if (e.type === "pointerup") this._call("toggle", id);
      start = null;
    };
    dial.addEventListener("pointerup", end);
    dial.addEventListener("pointercancel", end);
    dial.addEventListener("wheel", (e) => {
      if (this._state(id).na) return;
      e.preventDefault();
      clearTimeout(this._wheelTimer);
      const next = this._state(id).pct + (e.deltaY < 0 ? 4 : -4);
      setPct(next, false);
      this._wheelTimer = setTimeout(() => setPct(this._pending.get(id) ?? next, true), 250);
    }, { passive: false });
    dial.addEventListener("keydown", (e) => {
      if (this._state(id).na) return;
      const cur = this._state(id).pct;
      const step = { ArrowUp: 5, ArrowRight: 5, ArrowDown: -5, ArrowLeft: -5, PageUp: 20, PageDown: -20 }[e.key];
      if (step !== undefined) setPct(cur + step, true);
      else if (e.key === "Home") setPct(0, true);
      else if (e.key === "End") setPct(100, true);
      else if (e.key === "Enter" || e.key === " ") this._call("toggle", id);
      else return;
      e.preventDefault();
    });
  }

  _setBrightness(id, pct) {
    if (pct <= 0) this._call("turn_off", id);
    else this._call("turn_on", id, { brightness_pct: pct });
  }

  _toggleArea(areaId, anyOn) {
    const model = this._model();
    const area = model.areas.find((a) => a.id === areaId);
    if (!area) return;
    const ids = area.lights.map((l) => l.id).filter((id) => !this._state(id).na);
    if (ids.length) this._call(anyOn ? "turn_off" : "turn_on", ids);
  }

  _applyScene(scene, areaId = null) {
    const lights = this._model().areas
      .filter((a) => !areaId || a.id === areaId)
      .flatMap((a) => a.lights)
      .filter((l) => !this._state(l.id).na);
    if (!lights.length) return;
    if (!scene.brightness) {
      this._call("turn_off", lights.map((l) => l.id));
      return;
    }
    const warm = lights.filter((l) => scene.kelvin && l.modes.some((m) => ["color_temp", "hs", "xy", "rgb", "rgbw", "rgbww"].includes(m)));
    const plain = lights.filter((l) => !warm.includes(l));
    if (warm.length) this._call("turn_on", warm.map((l) => l.id), { brightness_pct: scene.brightness, color_temp_kelvin: scene.kelvin });
    if (plain.length) {
      const dim = plain.filter((l) => l.kind === "dim").map((l) => l.id);
      const onoff = plain.filter((l) => l.kind !== "dim").map((l) => l.id);
      if (dim.length) this._call("turn_on", dim, { brightness_pct: scene.brightness });
      if (onoff.length) this._call("turn_on", onoff);
    }
  }

  _call(service, entityId, data = {}) {
    this._hass
      .callService("light", service, { entity_id: entityId, ...data })
      .catch((err) => console.error("[engineering-console-card]", service, entityId, err));
  }
}

customElements.define("engineering-console-card", EngineeringConsoleCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "engineering-console-card",
  name: "Engineering Console",
  description: "Industrial control-panel lighting console: every light, grouped by area and floor.",
});
console.info(`%c ENGINEERING-CONSOLE-CARD %c ${VERSION} `, "background:#ff5a1c;color:#1d1d1b;font-weight:700", "background:#1d1d1b;color:#e3e1dc");
