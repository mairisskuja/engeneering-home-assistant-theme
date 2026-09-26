#!/usr/bin/env python3
"""WCAG 2.2 contrast check for Engineering Theme.

Reads colours straight from themes/engineering_theme.yaml (no dependencies) and
checks every foreground/background pair the HA frontend actually renders.
Exits non-zero if any pair fails, so it can gate a deploy or CI run.

    python3 scripts/contrast_check.py
"""
import re
import sys
from pathlib import Path

THEME = Path(__file__).resolve().parent.parent / "themes" / "engineering_theme.yaml"

TEXT = 4.5  # WCAG 1.4.3 normal text
UI = 3.0  # WCAG 1.4.11 non-text (tracks, borders, focus rings, icons)


def load_colours(path):
    colours = {}
    for line in path.read_text().splitlines():
        m = re.match(r'\s*([a-z0-9-]+):\s*"(#[0-9a-fA-F]{6}|rgba\([^)]*\))"', line)
        if m:
            colours[m.group(1)] = m.group(2)
    return colours


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


def main():
    c = load_colours(THEME)
    card = c["card-background-color"]
    disabled = blend(c["disabled-text-color"], card)

    checks = [
        # (description, foreground, background, minimum)
        ("Primary text on page", c["primary-text-color"], c["primary-background-color"], TEXT),
        ("Primary text on card", c["primary-text-color"], card, TEXT),
        ("Primary text in input", c["input-ink-color"], c["input-fill-color"], TEXT),
        ("Secondary text on page", c["secondary-text-color"], c["primary-background-color"], TEXT),
        ("Secondary text on card", c["secondary-text-color"], card, TEXT),
        ("Input label on input", c["input-label-ink-color"], c["input-fill-color"], TEXT),
        ("Picker label on form background", c["secondary-text-color"], c["ha-color-form-background"], TEXT),
        ("Picker label on form background (hover)", c["secondary-text-color"], c["ha-color-form-background-hover"], TEXT),
        ("Picker value on form background (hover)", c["primary-text-color"], c["ha-color-form-background-hover"], TEXT),
        ("Dropdown icon on input", c["input-dropdown-icon-color"], c["input-fill-color"], UI),
        ("Primary (gold) text on card", c["primary-color"], card, TEXT),
        ("Text on primary fill", c["text-primary-color"], c["primary-color"], TEXT),
        ("Text on accent fill", c["text-accent-color"], c["accent-color"], TEXT),
        ("Text on light primary fill", c["text-light-primary-color"], c["light-primary-color"], TEXT),
        ("Loud button text (resting)", c["ha-color-on-primary-loud"], c["ha-color-fill-primary-loud-resting"], TEXT),
        ("Loud button text (hover)", c["ha-color-on-primary-loud"], c["ha-color-fill-primary-loud-hover"], TEXT),
        ("Loud button vs card", c["ha-color-fill-primary-loud-resting"], card, UI),
        ("Link (primary-60) on card", c["ha-color-primary-60"], card, TEXT),
        ("Link (primary-60) on page", c["ha-color-primary-60"], c["primary-background-color"], TEXT),
        ("Normal button text (primary-60 on primary-10)", c["ha-color-primary-60"], c["ha-color-primary-10"], TEXT),
        ("Quiet button text (primary-70 on primary-05)", c["ha-color-primary-70"], c["ha-color-primary-05"], TEXT),
        ("Switch border (on) vs card", c["ha-color-border-primary-loud"], card, UI),
        ("Focus ring vs card", c["ha-color-focus"], card, UI),
        ("Focus ring vs page", c["ha-color-focus"], c["primary-background-color"], UI),
        ("Slider track vs card", c["ha-slider-track-color"], card, UI),
        ("Slider indicator vs card", c["ha-slider-indicator-color"], card, UI),
        ("Off-state icon vs card", c["state-icon-color"], card, UI),
        ("On-state icon vs card", c["state-icon-active-color"], card, UI),
        ("Sidebar text", c["sidebar-text-color"], c["sidebar-background-color"], TEXT),
        ("Sidebar icon", c["sidebar-icon-color"], c["sidebar-background-color"], UI),
        ("Sidebar selected text", c["sidebar-selected-text-color"], c["sidebar-selected-background-color"], TEXT),
        ("Header text", c["app-header-text-color"], c["app-header-background-color"], TEXT),
        ("Disabled text (exempt, informational)", disabled, card, 0),
    ]

    # Code editor: every syntax colour on the editor and on the active line,
    # which HA paints as secondary-text-color at 10% over the card.
    sec = rgb(c["secondary-text-color"])
    active_line = blend(f"rgba({sec[0]},{sec[1]},{sec[2]},0.1)", card)
    for key in sorted(k for k in c if k.startswith("codemirror-")):
        token = key.removeprefix("codemirror-")
        checks.append((f"Code {token} on editor", c[key], card, TEXT))
        checks.append((f"Code {token} on active line", c[key], active_line, TEXT))

    failures = 0
    for name, fg, bg, minimum in checks:
        r = ratio(fg, bg)
        ok = r >= minimum
        failures += not ok
        print(f"{'PASS' if ok else 'FAIL'}  {r:5.2f}:1  (min {minimum})  {name}")
    print(f"\n{len(checks) - failures}/{len(checks)} checks passed")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
