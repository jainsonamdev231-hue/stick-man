const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ================= RACES & RARITY SYSTEM =================
const RACES = [
    { name: "Human", rarity: "Common", chance: 45, hpMult: 1.0, dmgMult: 1.0, spdMult: 1.0, rangeBonus: 0, bulletMult: 1.0, multiShot: 1, regen: 0, lifesteal: 0, color: "#3498db", aura: null },
    { name: "Beastkin", rarity: "Uncommon", chance: 25, hpMult: 1.25, dmgMult: 1.2, spdMult: 1.35, rangeBonus: 5, bulletMult: 1.15, multiShot: 1, regen: 0, lifesteal: 0, color: "#e67e22", aura: "#2ecc71" },
    { name: "Frost Elf", rarity: "Rare", chance: 15, hpMult: 1.35, dmgMult: 1.5, spdMult: 1.25, rangeBonus: 20, bulletMult: 1.3, multiShot: 1, regen: 0.03, lifesteal: 0, color: "#00cec9", aura: "#3498db" },
    { name: "Shadow Demon", rarity: "Epic", chance: 9, hpMult: 1.6, dmgMult: 1.85, spdMult: 1.3, rangeBonus: 12, bulletMult: 1.35, multiShot: 1, regen: 0, lifesteal: 0.15, color: "#8e44ad", aura: "#9b59b6" },
    { name: "Celestial", rarity: "Legendary", chance: 5, hpMult: 2.2, dmgMult: 2.3, spdMult: 1.4, rangeBonus: 22, bulletMult: 1.45, multiShot: 2, regen: 0.15, lifesteal: 0.05, color: "#f1c40f", aura: "#f39c12" },
    { name: "Void Monarch", rarity: "Mythic", chance: 1, hpMult: 3.2, dmgMult: 3.5, spdMult: 1.6, rangeBonus: 35, bulletMult: 1.6, multiShot: 3, regen: 0.2, lifesteal: 0.2, color: "#e74c3c", aura: "#ff0055" }
];

const CLASSES = {
    "Arcane Gunner": { hpAdd: 0, dmgMult: 1.1, spdMult: 1.05, fireRateMult: 0.75 },
    "Master Forger": { hpAdd: 20, dmgMult: 1.3, spdMult: 1.0, fireRateMult: 0.9 },
    "Vanguard": { hpAdd: 50, dmgMult: 1.05, spdMult: 0.95, fireRateMult: 1.0 },
    "Shadow Assassin": { hpAdd: 0, dmgMult: 1.15, spdMult: 1.3, fireRateMult: 0.85 }
};

// ================= PLAYER STATE =================
const player = {
    username: "Guest",
    x: 150, y: 250, radius: 18,
    baseHp: 120, maxHp: 120, hp: 120,
    baseDmg: 18, dmg: 28,
    baseSpd: 3.5, spd: 3.5,
    attackRange: 55,
    race: RACES[0], // Starter locked to Human
    heroClass: "Arcane Gunner",
    attackStyle: "gun", // "gun" or "melee"
    weapon: { name: "Pulse Pistol", type: "gun", bonusDmg: 10, color: "#00d2ff", mod: "Rapid", cooldown: 14 },
    spins: 0,
    coins: 0,
    bossCores: 0,
    unlockedBossMotion: false,
    bossMotionActive: false,
    score: 0,
    attackCooldown: 0,
    attackVisualTimer: 0,
    facingAngle: 0,
    walkAnim: 0
};

// ================= STORY, ZONES & ARENA STATE =================
let activeMode = "STORY"; // "STORY" or "ARENA"
let storyStep = 0;
let currentZone = 0;
let questKills = 0;
let activeDialogue = null;
let isSpinning = false;

// 5-Round Series State
let arenaTeamSize = 1;
let allyRoundWins = 0;
let enemyRoundWins = 0;

const ZONES = [
    {
        name: "Starter Village",
        bg: "#1b2a1e", grid: "#233627",
        npcs: [{ name: "Elder Kael", x: 420, y: 220, color: "#f1c40f", role: "elder" }],
        portals: [{ x: 790, y: 250, targetZone: 1, spawnX: 80, spawnY: 250, reqStep: 1, label: "Whispering Woods ->" }]
    },
    {
        name: "Whispering Woods",
        bg: "#16202a", grid: "#1e2c3a",
        npcs: [{ name: "Scout Aria", x: 160, y: 110, color: "#00cec9", role: "scout" }],
        portals: [
            { x: 30, y: 250, targetZone: 0, spawnX: 720, spawnY: 250, reqStep: 0, label: "<- Village" },
            { x: 790, y: 250, targetZone: 2, spawnX: 80, spawnY: 250, reqStep: 4, label: "Cursed Citadel ->" }
        ]
    },
    {
        name: "Cursed Citadel",
        bg: "#231426", grid: "#311c36",
        npcs: [{ name: "Grand Warden", x: 150, y: 110, color: "#e056fd", role: "warden" }],
        portals: [{ x: 30, y: 250, targetZone: 1, spawnX: 720, spawnY: 250, reqStep: 0, label: "<- Woods" }]
    }
];

let enemies = [];
let allies = [];
let bullets = [];
let floatingTexts = [];
const keys = {};

// ================= ONE-TIME UNIQUE USERNAME & LEADERBOARD =================
async function claimUniqueName() {
    const input = document.getElementById('username-input').value.trim();
    const errEl = document.getElementById('login-error');
    if (input.length < 3) {
        errEl.innerText = "Hero Name must be at least 3 characters!";
        return;
    }

    try {
        const res = await fetch('/api/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: input })
        });
        const data = await res.json();
        if (!res.ok) {
            errEl.innerText = data.error || "Username already claimed!";
            return;
        }
        renderLeaderboard(data.players);
    } catch {
        const local = JSON.parse(localStorage.getItem('rpg_unique_heroes') || '[]');
        if (local.some(p => p.username.toLowerCase() === input.toLowerCase())) {
            errEl.innerText = "That Hero Name is already claimed forever! Pick another.";
            return;
        }
        local.push({ username: input, score: 0 });
        localStorage.setItem('rpg_unique_heroes', JSON.stringify(local));
        renderLeaderboard(local);
    }

    player.username = input;
    document.getElementById('ui-hero').innerText = input;
    document.getElementById('login-modal').style.display = 'none';
    showToast(`Welcome, ${input}! Speak with Elder Kael [E].`);
}

async function syncScore() {
    if (player.username === "Guest") return;
    try {
        const res = await fetch('/api/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: player.username, score: player.score })
        });
        if (res.ok) {
            const data = await res.json();
            renderLeaderboard(data.players);
            return;
        }
    } catch {}

    const local = JSON.parse(localStorage.getItem('rpg_unique_heroes') || '[]');
    const entry = local.find(p => p.username === player.username);
    if (entry && player.score > entry.score) {
        entry.score = player.score;
        localStorage.setItem('rpg_unique_heroes', JSON.stringify(local));
    }
    renderLeaderboard(local);
}

function renderLeaderboard(players) {
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = "";
    if (!players || players.length === 0) {
        list.innerHTML = "<li>No heroes registered yet...</li>";
        return;
    }
    players.sort((a, b) => b.score - a.score).slice(0, 12).forEach((p, idx) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>#${idx + 1} <b>${p.username}</b></span><span style="color:#ffd700;">${p.score} pts</span>`;
        list.appendChild(li);
    });
}

// ================= INPUT LISTENERS =================
window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    keys[k] = true;
    if (e.key === ' ') { e.preventDefault(); performAttack(); }
    if (k === 'e') interactNPC();
    if (k === 'q') toggleAttackStyle();
    if (k === 'm') toggleBossMotion();
});
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
canvas.addEventListener('mousedown', () => performAttack());
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    player.facingAngle = Math.atan2(((e.clientY - rect.top) * scaleY) - player.y, ((e.clientX - rect.left) * scaleX) - player.x);
});

// Mobile Touch Controls
function bindHold(id, key) {
    const btn = document.getElementById(id);
    const s = e => { e.preventDefault(); keys[key] = true; };
    const end = e => { e.preventDefault(); keys[key] = false; };
    btn.addEventListener('touchstart', s, { passive: false });
    btn.addEventListener('touchend', end, { passive: false });
    btn.addEventListener('mousedown', s);
    btn.addEventListener('mouseup', end);
}
bindHold('t-up', 'w');
bindHold('t-down', 's');
bindHold('t-left', 'a');
bindHold('t-right', 'd');

document.getElementById('t-atk').addEventListener('touchstart', e => { e.preventDefault(); aimNearestEnemy(); performAttack(); });
document.getElementById('t-atk').addEventListener('mousedown', () => { aimNearestEnemy(); performAttack(); });
document.getElementById('t-talk').addEventListener('click', interactNPC);

function aimNearestEnemy() {
    if (enemies.length === 0) return;
    let nearest = enemies[0];
    let bestD = Math.hypot(nearest.x - player.x, nearest.y - player.y);
    for (const e of enemies) {
        const d = Math.hypot(e.x - player.x, e.y - player.y);
        if (d < bestD) { bestD = d; nearest = e; }
    }
    player.facingAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
}

// ================= UI & STATS HELPERS =================
function showToast(msg) {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.style.display = 'block';
    clearTimeout(t.timer);
    t.timer = setTimeout(() => t.style.display = 'none', 3200);
}

function applyRaceStats() {
    const r = player.race;
    const c = CLASSES[player.heroClass];
    const modDmg = player.weapon.mod === "Heavy" ? 15 : (player.weapon.mod === "Crimson" ? 8 : 0);
    const motionMult = player.bossMotionActive ? 1.35 : 1.0;

    player.maxHp = Math.round((player.baseHp + c.hpAdd) * r.hpMult);
    player.hp = Math.min(player.hp, player.maxHp);
    player.dmg = Math.round((player.baseDmg + player.weapon.bonusDmg + modDmg) * r.dmgMult * c.dmgMult * motionMult);
    player.spd = player.baseSpd * r.spdMult * c.spdMult * (player.bossMotionActive ? 1.25 : 1.0);
    player.attackRange = 55 + (r.rangeBonus || 0);
    updateHUD();
}

function updateHUD() {
    document.getElementById('ui-zone').innerText = activeMode === "ARENA" ? `Arena (${arenaTeamSize}v${arenaTeamSize})` : ZONES[currentZone].name;
    const raceEl = document.getElementById('ui-race');
    raceEl.innerText = `${player.race.name} (${player.race.rarity})`;
    raceEl.className = `rarity-${player.race.rarity}`;
    document.getElementById('ui-class').innerText = player.heroClass;
    document.getElementById('ui-hp').innerText = `${Math.max(0, Math.ceil(player.hp))} / ${player.maxHp}`;
    document.getElementById('ui-dmg').innerText = player.dmg;
    document.getElementById('ui-coins').innerText = player.coins;
    document.getElementById('ui-cores').innerText = player.bossCores;
    document.getElementById('ui-spins').innerText = player.spins;
    document.getElementById('ui-atk-mode').innerText = player.attackStyle === "gun" ? "GUN SHOOTER" : "MELEE SLASH";
    document.getElementById('ui-weapon').innerText = player.weapon.name;
    document.getElementById('ui-motion').innerText = player.unlockedBossMotion ? (player.bossMotionActive ? "ON [M]" : "READY [M]") : "Locked (10% Boss)";
}

function toggleAttackStyle() {
    player.attackStyle = player.attackStyle === "gun" ? "melee" : "gun";
    updateHUD();
    showToast(`Switched to ${player.attackStyle.toUpperCase()} Mode!`);
}

function toggleBossMotion() {
    if (!player.unlockedBossMotion) {
        showToast("10% Boss Motion Locked! Defeat Story Bosses (10% Drop Chance).");
        return;
    }
    player.bossMotionActive = !player.bossMotionActive;
    applyRaceStats();
    showToast(player.bossMotionActive ? "10% Shadow Core Motion ACTIVATED!" : "Shadow Core Motion Stowed.");
}

function updateQuestTracker() {
    const title = document.getElementById('quest-title');
    const desc = document.getElementById('quest-desc');

    if (storyStep === 0) {
        title.innerText = "Chapter 1: Awakening";
        desc.innerText = "Speak with Elder Kael in the Starter Village [Press E near him].";
    } else if (storyStep === 1) {
        title.innerText = "Chapter 1: Forest Purge";
        desc.innerText = `Enter the Whispering Woods portal on the right. Defeat Corruption Slimes (${questKills}/3).`;
    } else if (storyStep === 2) {
        title.innerText = "BOSS: Slime King";
        desc.innerText = "Defeat the Giant Slime King! (65% Race Spin Drop + 10% Boss Motion/Core Drop)";
    } else if (storyStep === 3) {
        title.innerText = "Chapter 2: Report Back";
        desc.innerText = "Speak to Scout Aria in the Whispering Woods to unlock the Cursed Citadel.";
    } else if (storyStep === 4) {
        title.innerText = "Chapter 2: Citadel Breach";
        desc.innerText = `Enter the Cursed Citadel portal. Defeat Dark Knights (${questKills}/4).`;
    } else if (storyStep >= 5) {
        title.innerText = "ENDGAME BOSS: Overlord";
        desc.innerText = "Defeat the Abyssal Overlord & Slime King repeatedly to farm Race Spins & 10% Boss Cores!";
    }
}

// ================= ZONE & ENEMY SPAWNING =================
function returnToStoryMode() {
    closeAllModals();
    activeMode = "STORY";
    document.getElementById('quest-tracker').classList.remove('hidden');
    document.getElementById('series-banner').classList.add('hidden');
    loadZone(currentZone, 150, 250);
}

function loadZone(zoneIndex, spawnX, spawnY) {
    currentZone = zoneIndex;
    player.x = spawnX;
    player.y = spawnY;
    player.hp = player.maxHp;
    enemies = [];
    allies = [];
    bullets = [];

    if (zoneIndex === 1) {
        for (let i = 0; i < 3; i++) spawnEnemy("Slime", 420 + i * 110, 140 + i * 100);
        if (storyStep >= 2) spawnBoss("Slime King", 600, 260, 260, 16, "#2ecc71", 0.65);
    } else if (zoneIndex === 2) {
        for (let i = 0; i < 4; i++) spawnEnemy("Dark Knight", 380 + (i % 2) * 160, 130 + Math.floor(i / 2) * 200);
        if (storyStep >= 5) spawnBoss("Abyssal Overlord", 650, 250, 620, 28, "#e74c3c", 0.85);
    }
    updateHUD();
}

function spawnEnemy(type, x, y) {
    if (type === "Slime") {
        enemies.push({ name: "Corruption Slime", x, y, radius: 16, hp: 65, maxHp: 65, dmg: 8, spd: 1.5, color: "#27ae60", isBoss: false, isArena: false, dropChance: 0.15, shootTimer: 80, walkAnim: 0 });
    } else if (type === "Dark Knight") {
        enemies.push({ name: "Dark Knight", x, y, radius: 19, hp: 160, maxHp: 160, dmg: 16, spd: 2.0, color: "#8e44ad", isBoss: false, isArena: false, dropChance: 0.25, shootTimer: 65, walkAnim: 0 });
    }
}

function spawnBoss(name, x, y, hp, dmg, color, dropChance) {
    enemies.push({ name, x, y, radius: 34, hp, maxHp: hp, dmg, spd: 1.7, color, isBoss: true, isArena: false, dropChance, shootTimer: 45, walkAnim: 0 });
}

// ================= 1v1 TO 5v5 ARENA SERIES (FIRST TO 5 WINS) =================
function openArenaModal() {
    closeAllModals();
    document.getElementById('arena-modal').style.display = 'flex';
}

function startArenaSeries(size) {
    closeAllModals();
    activeMode = "ARENA";
    arenaTeamSize = size;
    allyRoundWins = 0;
    enemyRoundWins = 0;
    document.getElementById('quest-tracker').classList.add('hidden');
    document.getElementById('series-banner').classList.remove('hidden');
    startArenaRound();
}

function startArenaRound() {
    player.x = 110;
    player.y = 250;
    player.hp = player.maxHp;
    enemies = [];
    allies = [];
    bullets = [];

    document.getElementById('score-ally').innerText = allyRoundWins;
    document.getElementById('score-enemy').innerText = enemyRoundWins;
    updateHUD();

    for (let i = 1; i < arenaTeamSize; i++) {
        allies.push({
            name: `Ally #${i}`,
            x: 100, y: 80 + i * 75,
            radius: 17, hp: 125, maxHp: 125, dmg: 15, spd: 2.2,
            color: "#00d2ff", shootTimer: 45 + i * 10, walkAnim: 0
        });
    }

    for (let i = 0; i < arenaTeamSize; i++) {
        enemies.push({
            name: `Arena Fighter #${i + 1}`,
            x: 730, y: 75 + i * 75,
            radius: 18, hp: 135, maxHp: 135, dmg: 15, spd: 2.2,
            color: "#e74c3c", isBoss: false, isArena: true,
            coinReward: 10 + arenaTeamSize * 5,
            shootTimer: 50 + i * 10, walkAnim: 0
        });
    }
    showToast(`Arena Round (${allyRoundWins} - ${enemyRoundWins})! First to 5 Wins!`);
}

// ================= NPC DIALOGUE =================
function interactNPC() {
    if (activeDialogue) {
        acceptDialogue();
        return;
    }
    if (activeMode !== "STORY") return;
    const zone = ZONES[currentZone];
    for (const npc of zone.npcs) {
        if (Math.hypot(player.x - npc.x, player.y - npc.y) < 65) {
            openDialogue(npc);
            break;
        }
    }
}

function openDialogue(npc) {
    const modal = document.getElementById('dialogue-modal');
    document.getElementById('dialogue-speaker').innerText = npc.name;
    const text = document.getElementById('dialogue-text');

    if (npc.role === "elder") {
        if (storyStep === 0) {
            text.innerText = "You have awakened as a Human. Dark monsters have invaded the Whispering Woods to the East. Step through the portal, defeat 3 Corruption Slimes, and draw out their Boss! Bosses drop Race Reroll Spins and have a 10% chance to drop Boss Cores for The Forge.";
            activeDialogue = () => {
                storyStep = 1;
                questKills = 0;
                updateQuestTracker();
                showToast("Quest Accepted! Portal to Whispering Woods Unlocked.");
            };
        } else {
            text.innerText = "Keep pushing forward! Defeat Bosses for Race Spins & 10% Boss Cores, or enter the 1v1-5v5 Arena to earn Forge Coins.";
            activeDialogue = () => {};
        }
    } else if (npc.role === "scout") {
        if (storyStep < 2) {
            text.innerText = `Clear out the remaining Corruption Slimes (${questKills}/3) so we can lure out the Slime King!`;
            activeDialogue = () => {};
        } else if (storyStep === 2) {
            text.innerText = "Watch out! The Slime King has appeared! Defeat it for a 65% Race Spin drop and 10% Boss Motion/Core drop!";
            activeDialogue = () => {};
        } else if (storyStep === 3) {
            text.innerText = "Incredible work! You defeated the Slime King. I have unlocked the eastern portal to the Cursed Citadel. Defeat 4 Dark Knights there to summon the Abyssal Overlord!";
            activeDialogue = () => {
                storyStep = 4;
                questKills = 0;
                updateQuestTracker();
                showToast("Cursed Citadel Portal Unlocked!");
            };
        } else {
            text.innerText = "Talk to me anytime to respawn the Slime King if you want to farm more Race Spins and the 10% Boss Core!";
            activeDialogue = () => {
                if (!enemies.some(e => e.isBoss)) {
                    spawnBoss("Slime King", 600, 260, 260, 16, "#2ecc71", 0.65);
                    showToast("Slime King Respawned!");
                }
            };
        }
    } else if (npc.role === "warden") {
        if (storyStep === 4) {
            text.innerText = `Destroy the Dark Knights guarding this citadel (${questKills}/4) to force the Abyssal Overlord out of hiding!`;
            activeDialogue = () => {};
        } else {
            text.innerText = "I can summon the Abyssal Overlord whenever you are ready. He has an 85% chance to drop a Race Spin and 10% chance for a Boss Core!";
            activeDialogue = () => {
                if (!enemies.some(e => e.isBoss)) {
                    spawnBoss("Abyssal Overlord", 650, 250, 620, 28, "#e74c3c", 0.85);
                    showToast("Abyssal Overlord Summoned!");
                }
            };
        }
    }
    modal.style.display = 'block';
}

function acceptDialogue() {
    if (activeDialogue) activeDialogue();
    activeDialogue = null;
    document.getElementById('dialogue-modal').style.display = 'none';
}

// ================= SHOOTING, MELEE & PYTHON API SPIN DROPS =================
function performAttack() {
    if (player.attackCooldown > 0 || activeDialogue || isModalOpen()) return;

    const c = CLASSES[player.heroClass];
    const modRate = player.weapon.mod === "Rapid" ? 0.75 : 1.0;
    player.attackCooldown = Math.max(5, Math.round(player.weapon.cooldown * c.fireRateMult * modRate));

    if (player.attackStyle === "gun") {
        const shots = player.race.multiShot || 1;
        const spread = 0.14;
        for (let i = 0; i < shots; i++) {
            const angle = player.facingAngle + (i - (shots - 1) / 2) * spread;
            const speed = 9.5 * (player.race.bulletMult || 1.0);
            bullets.push({
                x: player.x + Math.cos(angle) * 22,
                y: player.y + Math.sin(angle) * 22,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                dmg: player.dmg,
                color: player.weapon.color,
                fromAlly: true,
                radius: 5
            });
        }
    } else {
        player.attackVisualTimer = 10;
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            const dist = Math.hypot(e.x - player.x, e.y - player.y);
            if (dist <= player.attackRange + e.radius) {
                applyDamageToEnemy(e, i, player.dmg);
            }
        }
    }
    updateHUD();
}

function applyDamageToEnemy(e, index, dmgAmount) {
    e.hp -= dmgAmount;

    const totalLifesteal = (player.race.lifesteal || 0) + (player.weapon.mod === "Crimson" ? 0.08 : 0);
    if (totalLifesteal > 0) {
        player.hp = Math.min(player.maxHp, player.hp + Math.round(dmgAmount * totalLifesteal));
    }

    const angle = Math.atan2(e.y - player.y, e.x - player.x);
    e.x += Math.cos(angle) * 10;
    e.y += Math.sin(angle) * 10;

    floatingTexts.push({ x: e.x, y: e.y - 15, text: `-${dmgAmount}`, color: "#ff5555", timer: 35 });

    if (e.hp <= 0) handleEnemyDeath(e, index);
}

async function handleEnemyDeath(e, index) {
    enemies.splice(index, 1);
    player.score += e.isBoss ? 500 : 100;
    syncScore();

    // Arena Kills Grant Forge Coins
    if (e.isArena) {
        player.coins += e.coinReward;
        floatingTexts.push({ x: e.x, y: e.y - 30, text: `+${e.coinReward} COINS!`, color: "#2ecc71", timer: 60 });
        updateHUD();
        return;
    }

    // Ask Python Server if Spin Dropped + 10% Boss Core/Motion Drop (with local fallback)
    let dropped = false;
    let bossCoreDropped = false;
    try {
        const res = await fetch('/api/boss-drop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dropChance: e.dropChance, isBoss: e.isBoss })
        });
        const data = await res.json();
        dropped = data.dropped;
        bossCoreDropped = data.bossCoreDropped;
    } catch {
        dropped = Math.random() <= e.dropChance;
        bossCoreDropped = e.isBoss && (Math.random() < 0.10);
    }

    if (dropped) {
        player.spins++;
        floatingTexts.push({ x: e.x, y: e.y - 30, text: "+1 RACE SPIN!", color: "#f1c40f", timer: 70 });
        showToast(`Lucky Drop! You got +1 Race Reroll Spin from ${e.name}!`);
    } else if (e.isBoss) {
        floatingTexts.push({ x: e.x, y: e.y - 30, text: "Unlucky! No Spin Drop", color: "#aaa", timer: 60 });
    }

    if (bossCoreDropped) {
        player.bossCores++;
        player.unlockedBossMotion = true;
        player.bossMotionActive = true;
        applyRaceStats();
        floatingTexts.push({ x: e.x, y: e.y - 50, text: "10% BOSS CORE & MOTION!", color: "#e056fd", timer: 90 });
        showToast("10% JACKPOT! Unlocked Shadow Core Motion [M] & +1 Boss Core for Guns!");
    }

    if (storyStep === 1 && e.name === "Corruption Slime") {
        questKills++;
        if (questKills >= 3) {
            storyStep = 2;
            spawnBoss("Slime King", 600, 260, 260, 16, "#2ecc71", 0.65);
            showToast("WARNING: The Slime King Boss has appeared!");
        }
    } else if (storyStep === 2 && e.name === "Slime King") {
        storyStep = 3;
        showToast("Slime King Defeated! Speak to Scout Aria.");
    } else if (storyStep === 4 && e.name === "Dark Knight") {
        questKills++;
        if (questKills >= 4) {
            storyStep = 5;
            spawnBoss("Abyssal Overlord", 650, 250, 620, 28, "#e74c3c", 0.85);
            showToast("WARNING: The Abyssal Overlord Boss has awakened!");
        }
    }

    if (!e.isBoss && activeMode === "STORY") {
        const savedZone = currentZone;
        const type = e.name === "Corruption Slime" ? "Slime" : "Dark Knight";
        setTimeout(() => {
            if (activeMode === "STORY" && currentZone === savedZone && enemies.length < 4) {
                spawnEnemy(type, 400 + Math.random() * 280, 120 + Math.random() * 260);
            }
        }, 4000);
    }

    updateQuestTracker();
    updateHUD();
}

// ================= MODALS: REROLL, FORGE, CLASSES =================
function closeAllModals() {
    if (isSpinning) return;
    document.getElementById('reroll-modal').style.display = 'none';
    document.getElementById('forge-modal').style.display = 'none';
    document.getElementById('arena-modal').style.display = 'none';
    document.getElementById('class-modal').style.display = 'none';
}

function isModalOpen() {
    return ['login-modal', 'reroll-modal', 'forge-modal', 'arena-modal', 'class-modal'].some(
        id => document.getElementById(id).style.display === 'flex'
    );
}

function openRerollModal() {
    closeAllModals();
    document.getElementById('reroll-modal').style.display = 'flex';
    updateSpinModalDisplay(player.race);
}

function openForgeModal() {
    closeAllModals();
    document.getElementById('forge-status').innerText = "";
    document.getElementById('forge-modal').style.display = 'flex';
}

function openClassModal() {
    closeAllModals();
    document.getElementById('class-modal').style.display = 'flex';
}

function setHeroClass(cName) {
    player.heroClass = cName;
    applyRaceStats();
    closeAllModals();
    showToast(`Switched Class to ${cName}!`);
}

function craftWeapon(name, type, bonusDmg, coinCost, coreCost, cooldown) {
    const status = document.getElementById('forge-status');
    if (player.coins < coinCost) {
        status.style.color = "#e74c3c";
        status.innerText = `Need ${coinCost} Coins! Defeat opponents in Arena (1v1-5v5) to earn Coins.`;
        return;
    }
    if (player.bossCores < coreCost) {
        status.style.color = "#e74c3c";
        status.innerText = `Need ${coreCost} Boss Core(s)! (10% Drop from Story Bosses).`;
        return;
    }

    player.coins -= coinCost;
    player.bossCores -= coreCost;

    const col = document.getElementById('custom-color').value;
    const mod = document.getElementById('custom-mod').value;

    player.weapon = { name: `${mod} ${name}`, type, bonusDmg, color: col, mod, cooldown };
    player.attackStyle = type;
    applyRaceStats();

    status.style.color = "#2ecc71";
    status.innerText = `Forged & Equipped: ${player.weapon.name}!`;
}

function updateSpinModalDisplay(r) {
    const nameEl = document.getElementById('spin-race-name');
    const buffEl = document.getElementById('spin-buffs');
    nameEl.innerText = `${r.name} (${r.rarity})`;
    nameEl.className = `rarity-${r.rarity}`;

    let passives = [];
    if (r.regen > 0) passives.push("HP Regen");
    if (r.lifesteal > 0) passives.push(`${Math.round(r.lifesteal * 100)}% Lifesteal`);
    if (r.rangeBonus > 0) passives.push(`+${r.rangeBonus} Attack Reach`);
    if (r.multiShot > 1) passives.push(`${r.multiShot}x Multi-Shot`);

    buffEl.innerText = `HP: ${r.hpMult}x | DMG: ${r.dmgMult}x | SPD: ${r.spdMult}x` + (passives.length ? ` | ${passives.join(", ")}` : "");
}

function pickLocalFallbackRace() {
    const total = RACES.reduce((acc, r) => acc + r.chance, 0);
    let rand = Math.random() * total;
    for (const r of RACES) {
        if (rand < r.chance) return r;
        rand -= r.chance;
    }
    return RACES[0];
}

async function triggerRaceSpin() {
    if (isSpinning) return;
    if (player.spins <= 0) {
        showToast("No Spins left! Defeat Bosses in Story Mode to earn Spins.");
        return;
    }

    player.spins--;
    updateHUD();
    isSpinning = true;

    let serverChosenRace = null;
    try {
        const res = await fetch('/api/reroll', { method: 'POST' });
        const data = await res.json();
        serverChosenRace = RACES.find(r => r.name === data.race.name) || data.race;
    } catch {
        serverChosenRace = pickLocalFallbackRace();
    }

    let ticks = 0;
    const maxTicks = 22;
    const interval = setInterval(() => {
        const randomPreview = RACES[Math.floor(Math.random() * RACES.length)];
        updateSpinModalDisplay(randomPreview);
        ticks++;

        if (ticks >= maxTicks) {
            clearInterval(interval);
            player.race = serverChosenRace;
            applyRaceStats();
            updateSpinModalDisplay(serverChosenRace);
            isSpinning = false;
            showToast(`Awakened Race: ${serverChosenRace.name} [${serverChosenRace.rarity}]!`);
        }
    }, 85);
}

// ================= MAIN GAME LOOP =================
function update() {
    if (activeDialogue || isModalOpen()) return;

    if (player.race.regen > 0 && player.hp < player.maxHp) {
        player.hp = Math.min(player.maxHp, player.hp + player.race.regen);
        updateHUD();
    }

    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy);
        player.x += (dx / len) * player.spd;
        player.y += (dy / len) * player.spd;
        player.walkAnim += 0.25;
    }

    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

    if (player.attackCooldown > 0) player.attackCooldown--;
    if (player.attackVisualTimer > 0) player.attackVisualTimer--;

    if (activeMode === "STORY") {
        const zone = ZONES[currentZone];
        for (const p of zone.portals) {
            if (Math.hypot(player.x - p.x, player.y - p.y) < 36) {
                if (storyStep >= p.reqStep) {
                    loadZone(p.targetZone, p.spawnX, p.spawnY);
                    showToast(`Entered ${ZONES[currentZone].name}`);
                    return;
                } else {
                    floatingTexts.push({ x: p.x - 40, y: p.y - 30, text: "Complete Current Quest First!", color: "#f39c12", timer: 20 });
                    player.x -= (dx * 10);
                }
            }
        }
    }

    // Update Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
            bullets.splice(i, 1);
            continue;
        }
        if (b.fromAlly) {
            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                if (Math.hypot(b.x - e.x, b.y - e.y) < e.radius + b.radius) {
                    applyDamageToEnemy(e, j, b.dmg);
                    bullets.splice(i, 1);
                    break;
                }
            }
        } else {
            if (Math.hypot(b.x - player.x, b.y - player.y) < player.radius + b.radius) {
                player.hp -= b.dmg;
                updateHUD();
                bullets.splice(i, 1);
                if (player.hp <= 0) { handlePlayerDeath(); return; }
                continue;
            }
            for (let a = allies.length - 1; a >= 0; a--) {
                const al = allies[a];
                if (Math.hypot(b.x - al.x, b.y - al.y) < al.radius + b.radius) {
                    al.hp -= b.dmg;
                    if (al.hp <= 0) allies.splice(a, 1);
                    bullets.splice(i, 1);
                    break;
                }
            }
        }
    }

    // Update Allies in Arena
    for (const al of allies) {
        if (enemies.length === 0) break;
        const target = enemies[0];
        const dist = Math.hypot(target.x - al.x, target.y - al.y);
        const angle = Math.atan2(target.y - al.y, target.x - al.x);
        if (dist > 130) {
            al.x += Math.cos(angle) * al.spd;
            al.y += Math.sin(angle) * al.spd;
            al.walkAnim += 0.2;
        }
        al.shootTimer--;
        if (al.shootTimer <= 0) {
            al.shootTimer = 50;
            bullets.push({ x: al.x, y: al.y, vx: Math.cos(angle) * 7.5, vy: Math.sin(angle) * 7.5, dmg: al.dmg, color: "#00d2ff", fromAlly: true, radius: 4 });
        }
    }

    // Update Enemies
    for (const e of enemies) {
        let target = player;
        let dist = Math.hypot(player.x - e.x, player.y - e.y);
        for (const al of allies) {
            const d = Math.hypot(al.x - e.x, al.y - e.y);
            if (d < dist) { dist = d; target = al; }
        }

        const angle = Math.atan2(target.y - e.y, target.x - e.x);
        const stopRange = e.isArena ? 140 : 20;
        if (dist < 380 && dist > stopRange) {
            e.x += Math.cos(angle) * e.spd;
            e.y += Math.sin(angle) * e.spd;
            e.walkAnim += 0.2;
        }

        if (e.isBoss || e.isArena || e.name === "Dark Knight") {
            e.shootTimer--;
            if (e.shootTimer <= 0 && dist < 360) {
                e.shootTimer = e.isBoss ? 42 : 65;
                bullets.push({
                    x: e.x, y: e.y,
                    vx: Math.cos(angle) * 6,
                    vy: Math.sin(angle) * 6,
                    dmg: Math.round(e.dmg * 0.6),
                    color: "#ff5555",
                    fromAlly: false,
                    radius: e.isBoss ? 7 : 4
                });
            }
        }

        if (dist < target.radius + e.radius) {
            target.hp -= e.dmg * 0.035;
            if (target === player) {
                updateHUD();
                if (player.hp <= 0) {
                    handlePlayerDeath();
                    return;
                }
            }
        }
    }

    // Check Arena 5-Round Series Win
    if (activeMode === "ARENA" && enemies.length === 0) {
        allyRoundWins++;
        if (allyRoundWins >= 5) {
            player.coins += 50;
            player.score += 350;
            syncScore();
            showToast("VICTORY! Won all 5 Arena Rounds! (+50 Bonus Coins)");
            returnToStoryMode();
        } else {
            startArenaRound();
        }
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        floatingTexts[i].y -= 0.7;
        floatingTexts[i].timer--;
        if (floatingTexts[i].timer <= 0) floatingTexts.splice(i, 1);
    }
}

function handlePlayerDeath() {
    if (activeMode === "ARENA") {
        enemyRoundWins++;
        if (enemyRoundWins >= 5) {
            showToast(`Opponents Won the 5-Round Series (${allyRoundWins} - ${enemyRoundWins})!`);
            returnToStoryMode();
        } else {
            startArenaRound();
        }
    } else {
        showToast("You were defeated! Respawned in Starter Village.");
        loadZone(0, 150, 250);
    }
}

// ================= STICKMAN & WORLD RENDERING =================
function drawStickmanUnit(x, y, color, aimAngle, walkAnim, scale, aura, hasGun, wpnColor, bossMotion) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    if (bossMotion) {
        ctx.beginPath();
        ctx.arc(0, -4, 26 + Math.sin(Date.now() * 0.015) * 4, 0, Math.PI * 2);
        ctx.strokeStyle = "#e056fd";
        ctx.lineWidth = 3;
        ctx.stroke();
    } else if (aura) {
        ctx.beginPath();
        ctx.arc(0, -4, 24, 0, Math.PI * 2);
        ctx.strokeStyle = aura;
        ctx.lineWidth = 2.5;
        ctx.stroke();
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 3.2;
    ctx.lineCap = "round";

    // Stickman Head
    ctx.beginPath();
    ctx.arc(0, -16, 7, 0, Math.PI * 2);
    ctx.fillStyle = "#111";
    ctx.fill();
    ctx.stroke();

    // Spine
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(0, 6);
    ctx.stroke();

    // Legs
    const swing = Math.sin(walkAnim) * 7;
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.lineTo(-6 + swing, 18);
    ctx.moveTo(0, 6);
    ctx.lineTo(6 - swing, 18);
    ctx.stroke();

    // Arms & Gun / Blade
    const cos = Math.cos(aimAngle);
    const sin = Math.sin(aimAngle);
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(cos * 11, -5 + sin * 11);
    ctx.stroke();

    if (hasGun) {
        ctx.strokeStyle = wpnColor || "#00d2ff";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cos * 9, -5 + sin * 9);
        ctx.lineTo(cos * 21, -5 + sin * 21);
        ctx.stroke();
    } else {
        ctx.strokeStyle = wpnColor || "#fff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cos * 10, -5 + sin * 10);
        ctx.lineTo(cos * 24, -5 + sin * 24 - 8);
        ctx.stroke();
    }

    ctx.restore();
}

function draw() {
    const zone = ZONES[currentZone];
    ctx.fillStyle = activeMode === "ARENA" ? "#141824" : zone.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = activeMode === "ARENA" ? "#1f2638" : zone.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    if (activeMode === "STORY") {
        for (const p of zone.portals) {
            const unlocked = storyStep >= p.reqStep;
            ctx.save();
            ctx.beginPath();
            ctx.arc(p.x, p.y, 28, 0, Math.PI * 2);
            ctx.fillStyle = unlocked ? "rgba(0, 210, 255, 0.35)" : "rgba(150, 50, 50, 0.35)";
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = unlocked ? "#00d2ff" : "#e74c3c";
            ctx.stroke();

            ctx.fillStyle = "#fff";
            ctx.font = "bold 12px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(p.label, p.x, p.y - 36);
            if (!unlocked) ctx.fillText("(Locked)", p.x, p.y + 4);
            ctx.restore();
        }

        for (const npc of zone.npcs) {
            drawStickmanUnit(npc.x, npc.y, npc.color, 0, 0, 1.05, null, false, "#ffd700", false);
            ctx.save();
            ctx.fillStyle = "#ffd700";
            ctx.font = "bold 18px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("!", npc.x, npc.y - 30);

            ctx.fillStyle = "#fff";
            ctx.font = "bold 13px sans-serif";
            ctx.fillText(npc.name, npc.x, npc.y + 34);

            if (Math.hypot(player.x - npc.x, player.y - npc.y) < 65) {
                ctx.fillStyle = "#f39c12";
                ctx.font = "12px sans-serif";
                ctx.fillText("[Press E to Talk]", npc.x, npc.y + 50);
            }
            ctx.restore();
        }
    }

    for (const al of allies) {
        drawStickmanUnit(al.x, al.y, al.color, 0, al.walkAnim, 0.95, null, true, "#00d2ff", false);
        ctx.fillStyle = "#00d2ff";
        ctx.font = "11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(al.name, al.x, al.y - 26);
    }

    for (const e of enemies) {
        const angle = Math.atan2(player.y - e.y, player.x - e.x);
        const scale = e.isBoss ? 1.55 : 1.0;
        drawStickmanUnit(e.x, e.y, e.color, angle, e.walkAnim || 0, scale, e.isBoss ? "#f1c40f" : null, e.isArena || e.isBoss, "#ff5555", false);

        ctx.save();
        ctx.fillStyle = "#fff";
        ctx.font = e.isBoss ? "bold 14px sans-serif" : "12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(e.name, e.x, e.y - e.radius - 18);

        const barW = e.isBoss ? 90 : 50;
        ctx.fillStyle = "#333";
        ctx.fillRect(e.x - barW / 2, e.y - e.radius - 13, barW, 6);
        ctx.fillStyle = "#e74c3c";
        ctx.fillRect(e.x - barW / 2, e.y - e.radius - 13, barW * (e.hp / e.maxHp), 6);
        ctx.restore();
    }

    if (player.attackVisualTimer > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.attackRange, player.facingAngle - 0.8, player.facingAngle + 0.8);
        ctx.strokeStyle = player.race.aura || player.weapon.color;
        ctx.lineWidth = 6;
        ctx.stroke();
        ctx.restore();
    }

    drawStickmanUnit(
        player.x, player.y,
        player.race.color,
        player.facingAngle,
        player.walkAnim,
        1.05,
        player.race.aura,
        player.attackStyle === "gun",
        player.weapon.color,
        player.bossMotionActive
    );

    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${player.username} [${player.race.name}]`, player.x, player.y - 28);

    for (const b of bullets) {
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    for (const ft of floatingTexts) {
        ctx.save();
        ctx.fillStyle = ft.color;
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

applyRaceStats();
updateQuestTracker();
fetch('/api/leaderboard').then(r => r.json()).then(d => renderLeaderboard(d.players)).catch(() => {
    renderLeaderboard(JSON.parse(localStorage.getItem('rpg_unique_heroes') || '[]'));
});
gameLoop();
