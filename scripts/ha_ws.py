#!/usr/bin/env python3
"""Run Home Assistant websocket commands on the HA host (SSH add-on).

Takes a JSON list of commands (each a websocket message without "id") as the
first argument and prints each result as JSON. Standard library only; needs
$SUPERVISOR_TOKEN, which the SSH add-on provides.

    ssh root@homeassistant.local python3 - '[{"type":"lovelace/resources"}]' < scripts/ha_ws.py
"""
import base64
import json
import os
import socket
import struct
import sys


class Client:
    def __init__(self):
        token = os.environ.get("SUPERVISOR_TOKEN")
        if not token:
            sys.exit("SUPERVISOR_TOKEN not set; run this on the HA host via the SSH add-on")
        self.sock = socket.create_connection(("supervisor", 80))
        key = base64.b64encode(os.urandom(16)).decode()
        self.sock.send(
            (
                "GET /core/websocket HTTP/1.1\r\nHost: supervisor\r\n"
                "Upgrade: websocket\r\nConnection: Upgrade\r\n"
                f"Sec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n"
            ).encode()
        )
        header = b""
        while b"\r\n\r\n" not in header:
            header += self.sock.recv(1)
        self.recv()
        self.send({"type": "auth", "access_token": token})
        if self.recv().get("type") != "auth_ok":
            sys.exit("Websocket auth failed")
        self.next_id = 1

    def read(self, n):
        data = b""
        while len(data) < n:
            chunk = self.sock.recv(n - len(data))
            if not chunk:
                raise ConnectionError("websocket closed")
            data += chunk
        return data

    def send(self, obj):
        payload = json.dumps(obj).encode()
        mask = os.urandom(4)
        frame = bytes([0x81])
        if len(payload) < 126:
            frame += bytes([0x80 | len(payload)])
        elif len(payload) < 65536:
            frame += bytes([0x80 | 126]) + struct.pack(">H", len(payload))
        else:
            frame += bytes([0x80 | 127]) + struct.pack(">Q", len(payload))
        self.sock.send(frame + mask + bytes(b ^ mask[i % 4] for i, b in enumerate(payload)))

    def recv(self):
        message = b""
        while True:
            head = self.read(2)
            length = head[1] & 127
            if length == 126:
                length = struct.unpack(">H", self.read(2))[0]
            elif length == 127:
                length = struct.unpack(">Q", self.read(8))[0]
            message += self.read(length)
            if head[0] & 0x80:  # FIN
                return json.loads(message)

    def call(self, command):
        msg = {**command, "id": self.next_id}
        self.next_id += 1
        self.send(msg)
        while True:
            reply = self.recv()
            if reply.get("id") == msg["id"] and reply.get("type") == "result":
                return reply


def main():
    commands = json.loads(sys.argv[1])
    client = Client()
    failed = False
    for command in commands:
        reply = client.call(command)
        failed |= not reply.get("success")
        print(json.dumps({"type": command["type"], "success": reply.get("success"),
                          "result": reply.get("result"), "error": reply.get("error")}))
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
