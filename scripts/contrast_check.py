#!/usr/bin/env python3
"""WCAG 2.2 contrast check for Engineering Theme, dark AND light mode.

Reads colours straight from themes/engineering_theme.yaml (no dependencies),
merges the top-level keys with each `modes:` block, and checks every
foreground/background pair the HA frontend actually renders. Where the theme
does not override a semantic token, the check uses the token HA maps it to in
that mode (from HA frontend 20260826.7). Exits non-zero on any failure.

    python3 scripts/contrast_check.py
"""
import re
import sys
from pathlib import Path

THEME = Path(__file__).resolve().parent.parent / "themes" / "engineering_theme.yaml"

TEXT = 4.5  # WCAG 1.4.3 normal text
UI = 3.0  # WCAG 1.4.11 non-text (inputs, tracks, focus rings, icons)

# HA's own semantic mapping onto the primary ramp, per mode
HA_DEFAULTS = {
    "dark": {
        "ha-color-text-link": "ha-color-primary-60",
        "ha-color-fill-primary-normal-resting": "ha-color-primary-10",
        "ha-color-on-primary-normal": "ha-color-primary-60",
        "ha-color-fill-primary-quiet-resting": "ha-color-primary-05",
        "ha-color-on-primary-quiet": "ha-color-primary-70",
        "ha-color-border-neutral-normal": "ha-color-neutral-50",
        "ha-color-on-neutral-normal": "ha-color-neutral-60",
    },
    "light": {
        "ha-color-text-link": "ha-color-primary-40",
        "ha-color-fill-primary-normal-resting": "ha-color-primary-90",
        "ha-color-on-primary-normal": "ha-color-primary-40",
        "ha-color-fill-primary-quiet-resting": "ha-color-primary-95",
        "ha-color-on-primary-quiet": "ha-color-primary-50",
        "ha-color-border-neutral-normal": "ha-color-neutral-60",
        "ha-color-on-neutral-normal": "ha-color-neutral-40",
    },
}

COLOUR = re.compile(r'^(\s*)([a-z0-9-]+):\s*"(#[0-9a-fA-F]{6}|rgba\([^)]*\))"')


def load_theme(path):
    """Return {mode: {key: colour}} with top-level keys merged into each mode."""
    base, modes, current = {}, {}, None
    for line in path.read_text().splitlines():
        header = re.match(r"^    (dark|light):\s*$", line)
        if header:
            current = modes.setdefault(header.group(1), {})
            continue
        m = COLOUR.match(line)
        if not m:
            continue
        indent, key, value = len(m.group(1)), m.group(2), m.group(3)
        if indent == 2:
            base[key] = value
        elif indent == 6 and current is not None:
            current[key] = value
    return {mode: {**base, **values} for mode, values in modes.items()}


def rgb(value):
    value = value.lstrip("#")
    return [int(value[i:i + 2], 16) for i in (0, 2, 4)]


def blend(rgba, background):
    """Flatten an rgba() colour onto an opaque hex background."""
    r, g, b, a = [float(x) for x in re.findall(r"[\d.]+", rgba)]
    bg = rgb(background)
    return "#" + "".join("%02x" % round(f * a + k * (1 - a)) for f, k in zip((r, g, b), bg))


def luminance(hex_colour):
    channels = [v / 255 for v in rgb(hex_colour)]
    channels = [v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4 for v in channels]
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]


def ratio(a, b):
    hi, lo = sorted([luminance(a), luminance(b)], reverse=True)
    return (hi + 0.05) / (lo + 0.05)


def checks_for(mode, c):
    for key, source in HA_DEFAULTS[mode].items():
        c.setdefault(key, c[source])
    card, page = c["card-background-color"], c["primary-background-color"]
    sec = rgb(c["secondary-text-color"])
    active_line = blend(f"rgba({sec[0]},{sec[1]},{sec[2]},0.1)", card)

    checks = [
        ("Primary text on page", c["primary-text-color"], page, TEXT),
        ("Primary text on card", c["primary-text-color"], card, TEXT),
        ("Primary text on secondary background", c["primary-text-color"], c["secondary-background-color"], TEXT),
        ("Secondary text on page", c["secondary-text-color"], page, TEXT),
        ("Secondary text on card", c["secondary-text-color"], card, TEXT),
        ("Secondary text on secondary background", c["secondary-text-color"], c["secondary-background-color"], TEXT),
        ("Input text on input", c["input-ink-color"], c["input-fill-color"], TEXT),
        ("Input label on input", c["input-label-ink-color"], c["input-fill-color"], TEXT),
        ("Input outline vs input", c["input-outlined-idle-border-color"], c["input-fill-color"], UI),
        ("Input outline vs card", c["input-outlined-idle-border-color"], card, UI),
        ("Input underline vs input", c["input-idle-line-color"], c["input-fill-color"], UI),
        ("Dropdown icon on input", c["input-dropdown-icon-color"], c["input-fill-color"], UI),
        ("Picker label on form background", c["secondary-text-color"], c["ha-color-form-background"], TEXT),
        ("Picker label on form background (hover)", c["secondary-text-color"], c["ha-color-form-background-hover"], TEXT),
        ("Picker value on form background (hover)", c["primary-text-color"], c["ha-color-form-background-hover"], TEXT),
        ("primary-color as text on card (tabs, links)", c["primary-color"], card, TEXT),
        ("primary-color as text on page", c["primary-color"], page, TEXT),
        ("Text on primary-color fill", c["text-primary-color"], c["primary-color"], TEXT),
        ("Text on accent fill", c["text-accent-color"], c["accent-color"], TEXT),
        ("Text on light primary fill", c["text-light-primary-color"], c["light-primary-color"], TEXT),
        ("Loud button text (resting)", c["ha-color-on-primary-loud"], c["ha-color-fill-primary-loud-resting"], TEXT),
        ("Loud button text (hover)", c["ha-color-on-primary-loud"], c["ha-color-fill-primary-loud-hover"], TEXT),
        ("Loud button vs card", c["ha-color-fill-primary-loud-resting"], card, UI),
        ("Normal button text", c["ha-color-on-primary-normal"], c["ha-color-fill-primary-normal-resting"], TEXT),
        ("Quiet button text on quiet fill", c["ha-color-on-primary-quiet"], c["ha-color-fill-primary-quiet-resting"], TEXT),
        ("Plain button text on card", c["ha-color-on-primary-quiet"], card, TEXT),
        ("Link on card", c["ha-color-text-link"], card, TEXT),
        ("Link on page", c["ha-color-text-link"], page, TEXT),
        ("Switch border (on) vs card", c["ha-color-border-primary-loud"], card, UI),
        ("Switch border (off) vs card", c["ha-color-border-neutral-normal"], card, UI),
        ("Switch thumb (off) vs card", c["ha-color-on-neutral-normal"], card, UI),
        ("Focus ring vs card", c["ha-color-focus"], card, UI),
        ("Focus ring vs page", c["ha-color-focus"], page, UI),
        ("Slider track vs card", c["ha-slider-track-color"], card, UI),
        ("Slider indicator vs card", c["ha-slider-indicator-color"], card, UI),
        ("Off-state icon vs card", c["state-icon-color"], card, UI),
        ("On-state icon vs card", c["state-icon-active-color"], card, UI),
        ("Success text on card", c["success-color"], card, TEXT),
        ("Warning text on card", c["warning-color"], card, TEXT),
        ("Error text on card", c["error-color"], card, TEXT),
        ("Info text on card", c["info-color"], card, TEXT),
        ("Sidebar text", c["sidebar-text-color"], c["sidebar-background-color"], TEXT),
        ("Sidebar icon", c["sidebar-icon-color"], c["sidebar-background-color"], UI),
        ("Sidebar selected text", c["sidebar-selected-text-color"], c["sidebar-selected-background-color"], TEXT),
        ("Header text", c["app-header-text-color"], c["app-header-background-color"], TEXT),
        ("Disabled text (exempt, informational)", c["disabled-text-color"], card, 0),
        ("Card edge (decorative, informational)", c["ha-card-border-color"], card, 0),
    ]
    for key in sorted(k for k in c if k.startswith("codemirror-")):
        token = key.removeprefix("codemirror-")
        checks.append((f"Code {token} on editor", c[key], card, TEXT))
        checks.append((f"Code {token} on active line", c[key], active_line, TEXT))
    return checks


def main():
    modes = load_theme(THEME)
    if set(modes) != {"dark", "light"}:
        print(f"Expected dark and light modes, found: {sorted(modes)}")
        return 1
    total = failures = 0
    for mode in ("dark", "light"):
        print(f"== {mode} mode")
        for name, fg, bg, minimum in checks_for(mode, dict(modes[mode])):
            r = ratio(fg, bg)
            ok = r >= minimum
            total += 1
            failures += not ok
            print(f"{'PASS' if ok else 'FAIL'}  {r:5.2f}:1  (min {minimum})  {name}")
        print()
    print(f"{total - failures}/{total} checks passed")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
