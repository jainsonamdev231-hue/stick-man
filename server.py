import http.server
import socketserver
import json
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

class StickmanGameServer(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/api/leaderboard":
            players = load_players()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"players": players}).encode("utf-8"))
        else:
            super().do_GET()

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8")
        data = json.loads(body) if body else {}

        if self.path == "/api/claim":
            username = data.get("username", "").strip()
            players = load_players()

            if any(p["username"].lower() == username.lower() for p in players):
                self.send_response(409)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "error": f"Hero Name '{username}' is already claimed forever!"
                }).encode("utf-8"))
                return

            players.append({"username": username, "score": 0})
            save_players(players)

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"players": players}).encode("utf-8"))

        elif self.path == "/api/score":
            username = data.get("username", "").strip()
            new_score = int(data.get("score", 0))
            players = load_players()

            for p in players:
                if p["username"] == username and new_score > p["score"]:
                    p["score"] = new_score
                    break

            save_players(players)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"players": players}).encode("utf-8"))

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), StickmanGameServer) as httpd:
        print(f"Stickman Rivals & Forge Server running at http://localhost:{PORT}")
        httpd.serve_forever()
