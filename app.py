import http.server
import socketserver
import json
import random
import os

PORT = 8000
DB_FILE = "players_db.json"

def load_players():
    if not os.path.exists(DB_FILE):
        return []
    with open(DB_FILE, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def save_players(players):
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(players, f, indent=4)

class GameServerHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/leaderboard':
            self._send_json({"players": load_players()})
        else:
            super().do_GET()

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else "{}"
        data = json.loads(body)

        if self.path == '/api/claim':
            username = data.get("username", "").strip()
            players = load_players()
            if not any(p["username"].lower() == username.lower() for p in players):
                players.append({"username": username, "score": 0})
                save_players(players)
            self._send_json({"players": players})

        elif self.path == '/api/score':
            username = data.get("username", "").strip()
            new_score = int(data.get("score", 0))
            players = load_players()
            for p in players:
                if p["username"].lower() == username.lower() and new_score > p["score"]:
                    p["score"] = new_score
                    break
            save_players(players)
            self._send_json({"players": players})

        else:
            self.send_error(404, "Endpoint not found")

    def _send_json(self, payload, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode('utf-8'))

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), GameServerHandler) as httpd:
        print(f"Stickman Force 100 Server running at http://localhost:{PORT}")
        httpd.serve_forever()
