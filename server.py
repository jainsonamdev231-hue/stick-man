import http.server
import socketserver
import json
import random
import os

PORT = 8000
DB_FILE = "players_db.json"

# Authoritative Race Rarity & Buff Table
RACES = [
    {"name": "Human", "rarity": "Common", "chance": 45, "hpMult": 1.0, "dmgMult": 1.0, "spdMult": 1.0, "rangeBonus": 0, "bulletMult": 1.0, "multiShot": 1, "regen": 0, "lifesteal": 0, "color": "#3498db", "aura": None},
    {"name": "Beastkin", "rarity": "Uncommon", "chance": 25, "hpMult": 1.25, "dmgMult": 1.2, "spdMult": 1.35, "rangeBonus": 5, "bulletMult": 1.15, "multiShot": 1, "regen": 0, "lifesteal": 0, "color": "#e67e22", "aura": "#2ecc71"},
    {"name": "Frost Elf", "rarity": "Rare", "chance": 15, "hpMult": 1.35, "dmgMult": 1.5, "spdMult": 1.25, "rangeBonus": 20, "bulletMult": 1.3, "multiShot": 1, "regen": 0.03, "lifesteal": 0, "color": "#00cec9", "aura": "#3498db"},
    {"name": "Shadow Demon", "rarity": "Epic", "chance": 9, "hpMult": 1.6, "dmgMult": 1.85, "spdMult": 1.3, "rangeBonus": 12, "bulletMult": 1.35, "multiShot": 1, "regen": 0, "lifesteal": 0.15, "color": "#8e44ad", "aura": "#9b59b6"},
    {"name": "Celestial", "rarity": "Legendary", "chance": 5, "hpMult": 2.2, "dmgMult": 2.3, "spdMult": 1.4, "rangeBonus": 22, "bulletMult": 1.45, "multiShot": 2, "regen": 0.15, "lifesteal": 0.05, "color": "#f1c40f", "aura": "#f39c12"},
    {"name": "Void Monarch", "rarity": "Mythic", "chance": 1, "hpMult": 3.2, "dmgMult": 3.5, "spdMult": 1.6, "rangeBonus": 35, "bulletMult": 1.6, "multiShot": 3, "regen": 0.2, "lifesteal": 0.2, "color": "#e74c3c", "aura": "#ff0055"}
]

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
    def __init__(self, *args, **kwargs):
        # Works if files are in "static/" OR directly in the current folder (for GitHub Pages)
        serve_dir = "static" if os.path.exists("static/index.html") else "."
        super().__init__(*args, directory=serve_dir, **kwargs)

    def do_GET(self):
        if self.path == '/api/leaderboard':
            self._send_json({"players": load_players()})
        else:
            super().do_GET()

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else "{}"
        data = json.loads(body)

        # Endpoint 1: Roll for a Race Reroll Spin
        if self.path == '/api/reroll':
            weights = [r["chance"] for r in RACES]
            chosen_race = random.choices(RACES, weights=weights, k=1)[0]
            self._send_json({"race": chosen_race})

        # Endpoint 2: Roll Boss / Enemy Spin Drop + 10% Boss Core & Motion Drop
        elif self.path == '/api/boss-drop':
            drop_chance = float(data.get("dropChance", 0.15))
            is_boss = bool(data.get("isBoss", False))
            dropped_spin = random.random() <= drop_chance
            # Strict 10% chance on Bosses for Shadow Core Motion & Gun Core
            dropped_core = is_boss and (random.random() < 0.10)
            self._send_json({
                "dropped": dropped_spin,
                "bossCoreDropped": dropped_core
            })

        # Endpoint 3: Claim One-Time Unique Username
        elif self.path == '/api/claim':
            username = data.get("username", "").strip()
            players = load_players()
            if any(p["username"].lower() == username.lower() for p in players):
                self._send_json({"error": f"Hero Name '{username}' is already claimed forever!"}, status=409)
                return
            players.append({"username": username, "score": 0})
            save_players(players)
            self._send_json({"players": players})

        # Endpoint 4: Sync High Score
        elif self.path == '/api/score':
            username = data.get("username", "").strip()
            new_score = int(data.get("score", 0))
            players = load_players()
            for p in players:
                if p["username"] == username and new_score > p["score"]:
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
        print(f"RPG Story, Shooter & Race Awakening Server running at http://localhost:{PORT}")
        httpd.serve_forever()
