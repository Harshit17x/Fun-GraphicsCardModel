#!/usr/bin/env python3
"""Fast JSON-RPC client for BlenderMCP socket server on localhost:9876."""

import json
import socket
import sys


def run_blender(cmd_type: str, params: dict, port: int = 9876, timeout: float = 60.0) -> dict:
    payload = json.dumps({"type": cmd_type, "params": params}).encode("utf-8")
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(timeout)
        sock.connect(("127.0.0.1", port))
        sock.sendall(payload)
        buf = bytearray()
        while True:
            chunk = sock.recv(65536)
            if not chunk:
                break
            buf.extend(chunk)
            try:
                return json.loads(buf.decode("utf-8"))
            except json.JSONDecodeError:
                continue
    return json.loads(buf.decode("utf-8"))


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: blender_rpc.py <python_file_or_code>")
        sys.exit(1)

    arg = sys.argv[1]
    if arg.endswith(".py"):
        with open(arg, "r", encoding="utf-8") as f:
            code = f.read()
    else:
        code = arg

    res = run_blender("execute_code", {"code": code})
    print(json.dumps(res, indent=2))
    if res.get("status") != "success":
        sys.exit(1)
