#!/usr/bin/env python3
"""おぱんちゅ早履きゲーム用の簡易サーバー
ranking.json の読み書きAPIを提供する

起動: python3 server.py
アクセス: http://localhost:8000
"""

import json
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 8000
RANKING_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ranking_web.json")


class GameHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/api/ranking":
            self.send_ranking()
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == "/api/ranking":
            self.save_ranking()
        else:
            self.send_error(404)

    def send_ranking(self):
        if os.path.exists(RANKING_FILE):
            with open(RANKING_FILE, "r", encoding="utf-8") as f:
                data = f.read()
        else:
            data = "[]"
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(data.encode("utf-8"))

    def save_ranking(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8")
        try:
            rankings = json.loads(body)
            with open(RANKING_FILE, "w", encoding="utf-8") as f:
                json.dump(rankings, f, ensure_ascii=False, indent=2)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"ok":true}')
        except Exception as e:
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))


if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    server = HTTPServer(("", PORT), GameHandler)
    print(f"サーバー起動: http://localhost:{PORT}")
    server.serve_forever()
