import http.server
import socketserver
import json
import random
import os

PORT = 8000

# Authoritative Race Rarity & Buff Table
RACES = [
    {"name": "Human", "rarity": "Common", "chance": 45, "hpMult": 1.0, "dmgMult": 1.0, "spdMult": 1.0, "rangeBonus": 0, "regen": 0, "lifesteal": 0, "color": "#3498db", "aura": None},
    {"name": "Beastkin", "rarity": "Uncommon", "chance": 25, "hpMult": 1.25, "dmgMult": 1.2, "spdMult": 1.35, "rangeBonus": 5, "regen": 0, "lifesteal": 0, "color": "#e67e22", "aura": "#2ecc71"},
    {"name": "Frost Elf", "rarity": "Rare", "chance": 15, "hpMult": 1.35, "dmgMult": 1.5, "spdMult": 1.25, "rangeBonus": 20, "regen": 0.03, "lifesteal": 0, "color": "#00cec9", "aura": "#3498db"},
    {"name": "Shadow Demon", "rarity": "Epic", "chance": 9, "hpMult": 1.6, "dmgMult": 1.85, "spdMult": 1.3, "rangeBonus": 12, "regen": 0, "lifesteal": 0.15, "color": "#8e44ad", "aura": "#9b59b6"},
    {"name": "Celestial", "rarity": "Legendary", "chance": 5, "hpMult": 2.2, "dmgMult": 2.3, "spdMult": 1.4, "rangeBonus": 22, "regen": 0.15, "lifesteal": 0.05, "color": "#f1c40f", "aura": "#f39c12"},
    {"name": "Void Monarch", "rarity": "Mythic", "chance": 1, "hpMult": 3.2, "dmgMult": 3.5, "spdMult": 1.6, "rangeBonus": 35, "regen": 0.2, "lifesteal": 0.2, "color": "#e74c3c", "aura": "#ff0055"}
]

class GameServerHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory="static", **kwargs)

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else "{}"
        data = json.loads(body)

        # Endpoint 1: Roll for a Race Reroll Spin
        if self.path == '/api/reroll':
            weights = [r["chance"] for r in RACES]
            chosen_race = random.choices(RACES, weights=weights, k=1)[0]
            self._send_json({"race": chosen_race})

        # Endpoint 2: Roll Boss / Enemy Spin Drop Chance
        elif self.path == '/api/boss-drop':
            drop_chance = float(data.get("dropChance", 0.15))
            dropped = random.random() <= drop_chance
            self._send_json({"dropped": dropped})

        else:
            self.send_error(404, "Endpoint not found")

    def _send_json(self, payload):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode('utf-8'))

if __name__ == "__main__":
    os.makedirs("static", exist_ok=True)
    with socketserver.TCPServer(("", PORT), GameServerHandler) as httpd:
        print(f"RPG Server running at http://localhost:{PORT}")
        httpd.serve_forever()
