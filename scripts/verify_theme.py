#!/usr/bin/env python3
"""Confirm Home Assistant has loaded engineering_theme as a dark theme.

Runs ON the Home Assistant host (SSH add-on), where $SUPERVISOR_TOKEN is set.
Uses only the standard library: a minimal websocket client calling
frontend/get_themes.

    ssh root@homeassistant.local python3 - < scripts/verify_theme.py
"""
import base64
import json
import os
import socket
import struct
import sys

THEME = "engineering_theme"


def main():
    token = os.environ.get("SUPERVISOR_TOKEN")
    if not token:
        sys.exit("SUPERVISOR_TOKEN not set; run this on the HA host via the SSH add-on")

    sock = socket.create_connection(("supervisor", 80))
    key = base64.b64encode(os.urandom(16)).decode()
    sock.send(
        (
            "GET /core/websocket HTTP/1.1\r\nHost: supervisor\r\n"
            "Upgrade: websocket\r\nConnection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n"
        ).encode()
    )
    header = b""
    while b"\r\n\r\n" not in header:
        header += sock.recv(1)

    def read(n):
        data = b""
        while len(data) < n:
            data += sock.recv(n - len(data))
        return data

    def send(obj):
        payload = json.dumps(obj).encode()
        mask = os.urandom(4)
        frame = bytes([0x81])
        if len(payload) < 126:
            frame += bytes([0x80 | len(payload)])
        else:
            frame += bytes([0x80 | 126]) + struct.pack(">H", len(payload))
        sock.send(frame + mask + bytes(b ^ mask[i % 4] for i, b in enumerate(payload)))

    def recv():
        head = read(2)
        length = head[1] & 127
        if length == 126:
            length = struct.unpack(">H", read(2))[0]
        elif length == 127:
            length = struct.unpack(">Q", read(8))[0]
        return json.loads(read(length))

    recv()
    send({"type": "auth", "access_token": token})
    if recv().get("type") != "auth_ok":
        sys.exit("Websocket auth failed")

    send({"id": 1, "type": "frontend/get_themes"})
    themes = recv()["result"]["themes"]
    if THEME not in themes:
        sys.exit(f"{THEME} not loaded. Loaded themes: {', '.join(themes)}")

    modes = themes[THEME].get("modes", {})
    if "dark" not in modes:
        sys.exit(f"{THEME} has no modes.dark block; HA will render it as a light theme")
    print(f"OK: {THEME} loaded, dark mode with {len(modes['dark'])} colour variables"
          f"{', light mode present' if 'light' in modes else ', dark-only'}")


if __name__ == "__main__":
    main()
