#!/usr/bin/env python3
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

REPO_URL = "https://github.com/frekcore/CVLNAgentfactory.git"
BRANCH = "CVLN-AGENT-FACTORY"
ROOT = Path(__file__).resolve().parent
CACHE = ROOT / "cache" / "CVLNAgentfactory"
API_URL = os.environ.get("CVLN_AGENT_FACTORY_URL", "").rstrip("/")
API_TOKEN = os.environ.get("CVLN_AGENT_FACTORY_TOKEN", "")


def ensure_repo():
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    if not (CACHE / ".git").exists():
        subprocess.run([
            "git", "clone", "--depth", "1", "--branch", BRANCH, REPO_URL, str(CACHE)
        ], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    else:
        subprocess.run(["git", "-C", str(CACHE), "fetch", "origin", BRANCH, "--depth", "1"], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        subprocess.run(["git", "-C", str(CACHE), "checkout", BRANCH], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        subprocess.run(["git", "-C", str(CACHE), "reset", "--hard", f"origin/{BRANCH}"], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)


def source_status():
    ensure_repo()
    sha = subprocess.check_output(["git", "-C", str(CACHE), "rev-parse", "HEAD"], text=True).strip()
    return {"repository": REPO_URL, "branch": BRANCH, "commit": sha, "path": str(CACHE)}


def source_search(query: str, max_results: int = 20):
    ensure_repo()
    proc = subprocess.run(
        ["git", "-C", str(CACHE), "grep", "-n", "-I", "-e", query],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    lines = [line for line in proc.stdout.splitlines() if line.strip()]
    return {"query": query, "results": lines[:max_results], "count": len(lines)}


def api_request(method: str, path: str, body=None):
    if not API_URL:
        return {"error": "CVLN_AGENT_FACTORY_URL is not configured", "configured": False}
    url = API_URL + (path if path.startswith("/") else "/" + path)
    headers = {"Accept": "application/json"}
    if API_TOKEN:
        headers["Authorization"] = f"Bearer {API_TOKEN}"
    data = None
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method.upper())
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            raw = resp.read().decode("utf-8")
            try:
                payload = json.loads(raw)
            except json.JSONDecodeError:
                payload = raw
            return {"status": resp.status, "data": payload}
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        return {"status": exc.code, "error": raw}
    except Exception as exc:
        return {"error": str(exc)}


TOOLS = [
    {
        "name": "cvln_agent_factory_source_status",
        "description": "Clone/update the official CVLN Agent Factory branch and report the exact installed source commit.",
        "inputSchema": {"type": "object", "properties": {}, "additionalProperties": False},
    },
    {
        "name": "cvln_agent_factory_source_search",
        "description": "Search the installed CVLN Agent Factory source code with git grep.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string"},
                "max_results": {"type": "integer", "minimum": 1, "maximum": 100},
            },
            "required": ["query"],
            "additionalProperties": False,
        },
    },
    {
        "name": "cvln_agent_factory_api",
        "description": "Call a running CVLN Agent Factory FastAPI endpoint. Requires CVLN_AGENT_FACTORY_URL; optionally uses CVLN_AGENT_FACTORY_TOKEN.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "method": {"type": "string", "enum": ["GET", "POST", "PUT", "PATCH", "DELETE"]},
                "path": {"type": "string"},
                "body": {},
            },
            "required": ["method", "path"],
            "additionalProperties": False,
        },
    },
]


def response(req_id, result=None, error=None):
    msg = {"jsonrpc": "2.0", "id": req_id}
    if error is not None:
        msg["error"] = error
    else:
        msg["result"] = result
    sys.stdout.write(json.dumps(msg) + "\n")
    sys.stdout.flush()


def text_result(payload):
    return {"content": [{"type": "text", "text": json.dumps(payload, ensure_ascii=False, indent=2)}], "isError": bool(isinstance(payload, dict) and payload.get("error"))}


def main():
    for line in sys.stdin:
        try:
            req = json.loads(line)
            method = req.get("method")
            req_id = req.get("id")
            if method == "initialize":
                response(req_id, {
                    "protocolVersion": req.get("params", {}).get("protocolVersion", "2025-06-18"),
                    "capabilities": {"tools": {}},
                    "serverInfo": {"name": "cvln-agent-factory", "version": "1.0.0"},
                })
            elif method == "notifications/initialized":
                continue
            elif method == "tools/list":
                response(req_id, {"tools": TOOLS})
            elif method == "tools/call":
                params = req.get("params", {})
                name = params.get("name")
                args = params.get("arguments") or {}
                try:
                    if name == "cvln_agent_factory_source_status":
                        out = source_status()
                    elif name == "cvln_agent_factory_source_search":
                        out = source_search(args["query"], int(args.get("max_results", 20)))
                    elif name == "cvln_agent_factory_api":
                        out = api_request(args["method"], args["path"], args.get("body"))
                    else:
                        raise ValueError(f"Unknown tool: {name}")
                    response(req_id, text_result(out))
                except Exception as exc:
                    response(req_id, text_result({"error": str(exc)}))
            elif req_id is not None:
                response(req_id, error={"code": -32601, "message": f"Method not found: {method}"})
        except Exception as exc:
            if isinstance(locals().get("req"), dict) and req.get("id") is not None:
                response(req.get("id"), error={"code": -32603, "message": str(exc)})


if __name__ == "__main__":
    main()
