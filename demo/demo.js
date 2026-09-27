// Engineering Console demo: drives the real card with a simulated `hass`.
// Nothing is connected; service calls update the simulated state only.

await customElements.whenDefined("engineering-console-card");

const floors = {
  ground: { floor_id: "ground", name: "Ground floor", level: 0 },
  upstairs: { floor_id: "upstairs", name: "Upstairs", level: 1 },
  outdoor: { floor_id: "outdoor", name: "Outdoor", level: 2 },
};

const areas = {
  entrance: { area_id: "entrance", name: "Entrance", floor_id: "ground" },
  hallway: { area_id: "hallway", name: "Hallway", floor_id: "ground" },
  living: { area_id: "living", name: "Living room", floor_id: "ground" },
  kitchen: { area_id: "kitchen", name: "Kitchen", floor_id: "ground" },
  office: { area_id: "office", name: "Office", floor_id: "ground" },
  stairs: { area_id: "stairs", name: "Stairs", floor_id: "upstairs" },
  bedroom: { area_id: "bedroom", name: "Bedroom", floor_id: "upstairs" },
  kids: { area_id: "kids", name: "Kids room", floor_id: "upstairs" },
  terrace: { area_id: "terrace", name: "Terrace", floor_id: "outdoor" },
};

// [entity_id, name, area, state, brightness %, colour-temp capable]
const LIGHTS = [
  ["light.entrance", "Porch lamp", "entrance", "on", 80, true],
  ["light.hallway_ceiling", "Ceiling", "hallway", "on", 60, true],
  ["light.living_sofa", "Sofa lamp", "living", "on", 35, true],
  ["light.living_ceiling", "Ceiling", "living", "off", 0, true],
  ["light.living_floor", "Floor lamp", "living", "unavailable", 0, true],
  ["light.kitchen_ceiling", "Ceiling", "kitchen", "on", 100, true],
  ["light.kitchen_led", "LED strip", "kitchen", "on", 45, true],
  ["light.office_1", "Ceiling 1", "office", "on", 70, true],
  ["light.office_2", "Ceiling 2", "office", "on", 70, true],
  ["light.office_desk", "Desk", "office", "off", 0, true],
  ["light.stairs", "Stairs", "stairs", "on", 20, false],
  ["light.bedroom_ceiling", "Ceiling", "bedroom", "off", 0, true],
  ["light.bedroom_floor", "Floor lamp", "bedroom", "on", 15, true],
  ["light.kids_desk", "Desk", "kids", "on", 90, true],
  ["light.kids_ceiling", "Ceiling", "kids", "unavailable", 0, true],
  ["light.terrace_left", "Left", "terrace", "off", 0, true],
  ["light.terrace_right", "Right", "terrace", "off", 0, true],
];

// Sensors: one device per room sensor; humidity pairs by device.
const SENSORS = [
  ["outdoor", "Outside", "terrace", 12.8, null],
  ["living", "Living room", "living", 22.4, 58],
  ["office", "Office", "office", 23.6, 51],
  ["bedroom", "Bedroom", "bedroom", 20.1, 61],
];
const CO2 = [
  ["living", "Living room", 640],
  ["bedroom", "Bedroom", 980],
];

const states = {};
const entities = {};
const devices = {};

const set = (id, state, attributes, extra = {}) => {
  states[id] = { entity_id: id, state: String(state), attributes };
  entities[id] = { entity_id: id, ...extra };
};

for (const [id, name, area, state, pct, ct] of LIGHTS) {
  set(id, state, {
    friendly_name: name,
    supported_color_modes: ct ? ["color_temp"] : ["brightness"],
    brightness: state === "on" ? Math.round((pct / 100) * 255) : null,
    color_temp_kelvin: ct && state === "on" ? 3000 : null,
  }, { area_id: area });
}
for (const [key, name, area, temp, hum] of SENSORS) {
  const device = `dev_${key}`;
  devices[device] = { id: device, area_id: area };
  set(`sensor.${key}_temperature`, temp, { friendly_name: `${name} Temperature`, device_class: "temperature", unit_of_measurement: "°C" }, { device_id: device });
  if (hum !== null) {
    set(`sensor.${key}_humidity`, hum, { friendly_name: `${name} Humidity`, device_class: "humidity", unit_of_measurement: "%" }, { device_id: device });
  }
}
for (const [key, name, ppm] of CO2) {
  set(`sensor.${key}_co2`, ppm, { friendly_name: `${name} CO2`, device_class: "carbon_dioxide", unit_of_measurement: "ppm" }, { device_id: `dev_${key}` });
}
set("weather.home", "cloudy", { friendly_name: "Home", humidity: 84, temperature: 12.8 });
set("zone.home", "0", { friendly_name: "Demo home" });

let dark = false;
try { dark = localStorage.getItem("ecc-demo-mode") === "dark"; } catch { /* storage unavailable */ }

const card = document.getElementById("card");
card.setConfig({
  type: "custom:engineering-console-card",
  zone: "zone.home",
  humidity_map: { "sensor.outdoor_temperature": "weather.home" },
  temperature_order: ["sensor.outdoor_temperature", "..."],
});

const toast = (text) => {
  const el = document.getElementById("toast");
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2200);
};

const callService = async (domain, service, data) => {
  if (domain !== "light") return;
  const ids = [].concat(data.entity_id);
  for (const id of ids) {
    const st = states[id];
    if (!st || st.state === "unavailable") continue;
    const on = service === "toggle" ? st.state !== "on" : service === "turn_on";
    const attrs = { ...st.attributes };
    if (on) {
      const pct = data.brightness_pct ?? (st.state === "on" ? Math.round((attrs.brightness / 255) * 100) : 100);
      attrs.brightness = Math.round((pct / 100) * 255);
      if (data.color_temp_kelvin && attrs.supported_color_modes.includes("color_temp")) {
        attrs.color_temp_kelvin = data.color_temp_kelvin;
      }
    } else {
      attrs.brightness = null;
    }
    states[id] = { ...st, state: on ? "on" : "off", attributes: attrs };
  }
  toast(`light.${service} → ${ids.length} light${ids.length > 1 ? "s" : ""}`
    + (data.brightness_pct !== undefined ? ` · ${data.brightness_pct}%` : "")
    + (data.color_temp_kelvin ? ` · ${data.color_temp_kelvin} K` : ""));
  push();
};

// HA hands cards a new hass object on every change; do the same.
const push = () => {
  card.hass = {
    states: { ...states },
    entities, devices, areas, floors,
    themes: { darkMode: dark },
    locale: { language: "en" },
    config: { location_name: "Demo home" },
    callService,
  };
};

const applyMode = () => {
  document.documentElement.dataset.mode = dark ? "dark" : "light";
  for (const b of document.querySelectorAll(".mode button")) {
    b.setAttribute("aria-pressed", String((b.dataset.mode === "dark") === dark));
  }
  try { localStorage.setItem("ecc-demo-mode", dark ? "dark" : "light"); } catch { /* storage unavailable */ }
  push();
};
for (const b of document.querySelectorAll(".mode button")) {
  b.addEventListener("click", () => { dark = b.dataset.mode === "dark"; applyMode(); });
}

card.addEventListener("hass-more-info", (e) => toast(`more-info: ${e.detail.entityId}`));

// Gentle sensor drift so the panels feel live.
setInterval(() => {
  for (const [id, st] of Object.entries(states)) {
    const cls = st.attributes.device_class;
    if (!["temperature", "humidity", "carbon_dioxide"].includes(cls)) continue;
    const step = cls === "carbon_dioxide" ? 25 : cls === "humidity" ? 1 : 0.1;
    const v = parseFloat(st.state) + (Math.random() - 0.5) * 2 * step;
    states[id] = { ...st, state: cls === "temperature" ? v.toFixed(1) : String(Math.round(v)) };
  }
  push();
}, 8000);

applyMode();
