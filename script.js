const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Safe Storage Helper
let memoryPlayers = [];
function getStoredPlayers() {
    try {
        const raw = localStorage.getItem('rpg_unique_heroes');
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return memoryPlayers;
    }
}
function setStoredPlayers(list) {
    memoryPlayers = list;
    try {
        localStorage.setItem('rpg_unique_heroes', JSON.stringify(list));
    } catch (e) {}
}

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
    x: 140, y: 250, radius: 18,
    baseHp: 120, maxHp: 120, hp: 120,
    baseDmg: 18, dmg: 28,
    baseSpd: 3.5, spd: 3.5,
    attackRange: 55,
    race: RACES[0],
    heroClass: "Arcane Gunner",
    attackStyle: "gun",
    weapon: { name: "Pulse Pistol", type: "gun", bonusDmg: 10, color: "#00d2ff", mod: "Rapid", cooldown: 14 },
    spins: 1,
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

// ================= FORCE RPG QUESTS (ACCEPT -> COMPLETE -> RETURN FOR REWARD) =================
/*
  Each Quest has 3 states:
  "AVAILABLE": Player must talk to the NPC to accept the quest.
  "ACTIVE": Player is out hunting enemies/bosses.
  "READY_TO_CLAIM": Objective reached! Player MUST walk back to the NPC and talk to claim their reward & unlock next level.
*/
const QUESTS = [
    {
        id: 0,
        npcName: "Commander Vance",
        zone: 0,
        title: "Mission 1: Outpost Defense",
        targetName: "Scout Drone",
        reqKills: 3,
        rewardCoins: 40,
        rewardSpins: 1,
        unlocksZone: 1,
        startText: "Welcome to Force Outpost! Rogue Scout Drones have breached the perimeter to the East. Defeat 3 Scout Drones, then return to me for your reward!",
        progressText: "You haven't destroyed all 3 Scout Drones yet! Keep fighting, then come back to me.",
        claimText: "Outstanding work, soldier! Here is your reward. I have also unlocked the Portal to Level 2: Whispering Woods!"
    },
    {
        id: 1,
        npcName: "Scout Aria",
        zone: 1,
        title: "Mission 2: Forest Purge",
        targetName: "Corruption Slime",
        reqKills: 3,
        rewardCoins: 60,
        rewardSpins: 1,
        unlocksZone: 1,
        startText: "The Whispering Woods are crawling with Corruption Slimes. Defeat 3 Corruption Slimes and return to me to receive your payment!",
        progressText: "Defeat 3 Corruption Slimes in this forest, then report back here to claim your reward!",
        claimText: "You cleared the path! Take these Coins and Spin. Be careful—your next mission will summon the Slime King Boss!"
    },
    {
        id: 2,
        npcName: "Scout Aria",
        zone: 1,
        title: "Mission 3: The Slime King (Boss)",
        targetName: "Slime King",
        reqKills: 1,
        rewardCoins: 100,
        rewardSpins: 2,
        unlocksZone: 2,
        spawnsBoss: { name: "Slime King", x: 640, y: 260, hp: 320, dmg: 18, color: "#2ecc71", dropChance: 0.65 },
        startText: "I've lured the Giant Slime King into the woods! Defeat him (he also has a 10% chance to drop a Boss Gun Core) and come back to me for a huge reward!",
        progressText: "The Slime King is still alive in the woods! Defeat him and return to me!",
        claimText: "Incredible! You slayed the Slime King! Here is your Boss Bounty, and I have unlocked the Portal to Level 3: Cursed Citadel!"
    },
    {
        id: 3,
        npcName: "Grand Warden",
        zone: 2,
        title: "Mission 4: Citadel Breach",
        targetName: "Dark Knight",
        reqKills: 4,
        rewardCoins: 90,
        rewardSpins: 1,
        unlocksZone: 2,
        startText: "Welcome to the Cursed Citadel. Four Dark Knights guard the inner sanctum. Defeat all 4 Dark Knights, then return to me for your reward!",
        progressText: "Eliminate all 4 Dark Knights in the Citadel, then return to me to claim your bounty!",
        claimText: "The Dark Knights have fallen! Take this reward. Speak to me again whenever you are ready to summon the Abyssal Overlord!"
    },
    {
        id: 4,
        npcName: "Grand Warden",
        zone: 2,
        title: "Mission 5: Abyssal Overlord (Repeatable Boss)",
        targetName: "Abyssal Overlord",
        reqKills: 1,
        rewardCoins: 150,
        rewardSpins: 2,
        unlocksZone: 2,
        repeatable: true,
        spawnsBoss: { name: "Abyssal Overlord", x: 660, y: 250, hp: 680, dmg: 28, color: "#e74c3c", dropChance: 0.85 },
        startText: "I have summoned the Abyssal Overlord! Defeat him for an 85% Spin drop, 10% Boss Motion/Core drop, and return to me for 150 Coins & +2 Spins!",
        progressText: "Defeat the Abyssal Overlord, then return to me to claim your 150 Coins & +2 Race Spins!",
        claimText: "Supreme Victory! Here are your 150 Coins and +2 Race Spins. Talk to me anytime to repeat this Boss quest!"
    }
];

let currentQuestIndex = 0;
let questState = "AVAILABLE"; // "AVAILABLE", "ACTIVE", "READY_TO_CLAIM"
let questKills = 0;
let highestUnlockedZone = 0;

let activeMode = "STORY"; // "STORY", "ARENA", "ONLINE_PVP"
let currentZone = 0;
let activeDialogue = null;
let isSpinning = false;

let arenaTeamSize = 1;
let allyRoundWins = 0;
let enemyRoundWins = 0;

const ZONES = [
    {
        name: "Lv.1 Starter Outpost",
        bg: "#1b2a1e", grid: "#233627",
        npcs: [{ name: "Commander Vance", x: 260, y: 130, color: "#f1c40f" }],
        portals: [{ x: 790, y: 250, targetZone: 1, spawnX: 80, spawnY: 250, reqZone: 1, label: "Lv.2 Woods ->" }]
    },
    {
        name: "Lv.2 Whispering Woods",
        bg: "#16202a", grid: "#1e2c3a",
        npcs: [{ name: "Scout Aria", x: 200, y: 110, color: "#00cec9" }],
        portals: [
            { x: 35, y: 250, targetZone: 0, spawnX: 720, spawnY: 250, reqZone: 0, label: "<- Outpost" },
            { x: 790, y: 250, targetZone: 2, spawnX: 80, spawnY: 250, reqZone: 2, label: "Lv.3 Citadel ->" }
        ]
    },
    {
        name: "Lv.3 Cursed Citadel",
        bg: "#231426", grid: "#311c36",
        npcs: [{ name: "Grand Warden", x: 200, y: 110, color: "#e056fd" }],
        portals: [{ x: 35, y: 250, targetZone: 1, spawnX: 720, spawnY: 250, reqZone: 0, label: "<- Woods" }]
    }
];

let enemies = [];
let allies = [];
let bullets = [];
let floatingTexts = [];
const keys = {};

// ================= LIVE INTERNET MULTIPLAYER (PEERJS WEBRTC) =================
let peer = null;
let conn = null;
const remotePlayer = {
    connected: false,
    username: "Rival",
    x: 700, y: 250, radius: 18,
    hp: 120, maxHp: 120,
    aimAngle: 0, walkAnim: 0,
    color: "#ff5555",
    aura: null,
    attackStyle: "gun",
    wpnColor: "#ff5555",
    bossMotion: false
};

function initOnlineMultiplayer(cleanUsername) {
    if (typeof Peer === "undefined") return;
    const roomCode = "stickforce-" + cleanUsername.toLowerCase().replace(/[^a-z0-9]/g, "");
    document.getElementById('my-room-code').innerText = cleanUsername;

    try {
        peer = new Peer(roomCode);
        peer.on('open', () => {
            document.getElementById('online-status').innerText = `Online! Tell your friend to enter code: ${cleanUsername}`;
        });
        peer.on('connection', incomingConn => {
            conn = incomingConn;
            setupConnectionHandlers();
        });
        peer.on('error', () => {
            // Fallback random suffix if code is already active in another tab
            peer = new Peer(roomCode + "-" + Math.floor(Math.random() * 99));
            peer.on('open', id => {
                const shortCode = id.replace("stickforce-", "");
                document.getElementById('my-room-code').innerText = shortCode;
            });
            peer.on('connection', incomingConn => {
                conn = incomingConn;
                setupConnectionHandlers();
            });
        });
    } catch (e) {}
}

function connectToFriend() {
    const rawCode = document.getElementById('friend-code-input').value.trim();
    if (!rawCode || !peer) {
        showToast("Enter your friend's Room Code first!");
        return;
    }
    const targetPeerId = "stickforce-" + rawCode.toLowerCase().replace(/[^a-z0-9\-]/g, "");
    document.getElementById('online-status').innerText = `Connecting to ${rawCode}...`;
    conn = peer.connect(targetPeerId);
    setupConnectionHandlers();
}

function setupConnectionHandlers() {
    if (!conn) return;
    conn.on('open', () => {
        remotePlayer.connected = true;
        document.getElementById('online-status').innerText = `Connected with Friend! You can Co-Op or start a PvP Duel!`;
        document.getElementById('ui-peer-status').innerText = `Connected (Live)`;
        showToast("Friend Connected over the Internet!");
    });

    conn.on('data', data => {
        if (data.type === "STATE") {
            remotePlayer.username = data.username;
            remotePlayer.x = data.x;
            remotePlayer.y = data.y;
            remotePlayer.hp = data.hp;
            remotePlayer.maxHp = data.maxHp;
            remotePlayer.aimAngle = data.aimAngle;
            remotePlayer.walkAnim = data.walkAnim;
            remotePlayer.color = data.color;
            remotePlayer.aura = data.aura;
            remotePlayer.attackStyle = data.attackStyle;
            remotePlayer.wpnColor = data.wpnColor;
            remotePlayer.bossMotion = data.bossMotion;
            document.getElementById('ui-peer-status').innerText = `Vs ${remotePlayer.username}`;
        } else if (data.type === "SHOOT") {
            bullets.push({
                x: data.x, y: data.y,
                vx: data.vx, vy: data.vy,
                dmg: data.dmg,
                color: "#ff5555",
                fromAlly: false,
                fromRemotePlayer: true,
                radius: 5
            });
        } else if (data.type === "HIT_ME") {
            player.hp -= data.dmg;
            floatingTexts.push({ x: player.x, y: player.y - 15, text: `-${data.dmg}`, color: "#ff5555", timer: 30 });
            updateHUD();
            if (player.hp <= 0) {
                if (conn && conn.open) conn.send({ type: "ROUND_WON" });
                handleOnlineRoundLoss();
            }
        } else if (data.type === "ROUND_WON") {
            allyRoundWins++;
            player.coins += 25;
            document.getElementById('score-ally').innerText = allyRoundWins;
            showToast(`You won the Round! (+25 Coins) [${allyRoundWins} - ${enemyRoundWins}]`);
            if (allyRoundWins >= 5) {
                player.coins += 60;
                showToast(`VICTORY! You defeated ${remotePlayer.username} 5-${enemyRoundWins}! (+60 Bonus Coins)`);
                allyRoundWins = 0;
                enemyRoundWins = 0;
            }
            player.x = 120; player.y = 250; player.hp = player.maxHp;
            updateHUD();
        } else if (data.type === "START_PVP") {
            startOnlinePvPMode(false);
        }
    });

    conn.on('close', () => {
        remotePlayer.connected = false;
        document.getElementById('ui-peer-status').innerText = "Disconnected";
        showToast("Friend disconnected.");
    });
}

function startOnlinePvPMode(notifyPeer = true) {
    closeAllModals();
    activeMode = "ONLINE_PVP";
    allyRoundWins = 0;
    enemyRoundWins = 0;
    enemies = [];
    allies = [];
    bullets = [];
    player.x = notifyPeer ? 120 : 720;
    player.y = 250;
    player.hp = player.maxHp;
    document.getElementById('quest-tracker').classList.add('hidden');
    document.getElementById('series-banner').classList.remove('hidden');
    document.getElementById('score-ally').innerText = "0";
    document.getElementById('score-enemy').innerText = "0";
    updateHUD();
    showToast("LIVE 1v1 ONLINE PVP STARTED! First to 5 Wins!");
    if (notifyPeer && conn && conn.open) {
        conn.send({ type: "START_PVP" });
    }
}

function handleOnlineRoundLoss() {
    enemyRoundWins++;
    document.getElementById('score-enemy').innerText = enemyRoundWins;
    showToast(`${remotePlayer.username} won the round! [${allyRoundWins} - ${enemyRoundWins}]`);
    if (enemyRoundWins >= 5) {
        showToast(`${remotePlayer.username} won the 5-Round Online Series!`);
        allyRoundWins = 0;
        enemyRoundWins = 0;
    }
    player.x = 720;
    player.y = 250;
    player.hp = player.maxHp;
    updateHUD();
}

// ================= INSTANT LOGIN =================
function claimUniqueName() {
    const inputEl = document.getElementById('username-input');
    const errEl = document.getElementById('login-error');
    const cleanName = (inputEl ? inputEl.value : "").trim();

    if (cleanName.length < 3) {
        errEl.innerText = "Hero Name must be at least 3 characters!";
        return;
    }

    const local = getStoredPlayers();
    local.push({ username: cleanName, score: 0 });
    setStoredPlayers(local);
    renderLeaderboard(local);

    player.username = cleanName;
    document.getElementById('ui-hero').innerText = cleanName;
    document.getElementById('login-modal').style.display = 'none';

    initOnlineMultiplayer(cleanName);
    loadZone(0, 140, 250);
    showToast(`Welcome, ${cleanName}! Walk to Commander Vance and press [E] or tap TALK.`);
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

// Bind Login & Multiplayer Buttons
document.getElementById('claim-btn').addEventListener('click', claimUniqueName);
document.getElementById('username-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); claimUniqueName(); }
});
document.getElementById('btn-online').addEventListener('click', () => {
    closeAllModals();
    document.getElementById('online-modal').style.display = 'flex';
});
document.getElementById('btn-connect-friend').addEventListener('click', connectToFriend);
document.getElementById('btn-start-online-duel').addEventListener('click', () => startOnlinePvPMode(true));

// ================= MENU & BUTTON LISTENERS =================
document.getElementById('btn-story').addEventListener('click', returnToStoryMode);
document.getElementById('btn-reroll').addEventListener('click', openRerollModal);
document.getElementById('btn-forge').addEventListener('click', openForgeModal);
document.getElementById('btn-arena').addEventListener('click', openArenaModal);
document.getElementById('btn-class').addEventListener('click', openClassModal);
document.getElementById('btn-mode').addEventListener('click', toggleAttackStyle);
document.getElementById('btn-dialogue-next').addEventListener('click', acceptDialogue);
document.getElementById('spin-btn').addEventListener('click', triggerRaceSpin);

document.querySelectorAll('.close-modal-btn').forEach(btn => btn.addEventListener('click', closeAllModals));

document.querySelectorAll('.craft-wpn-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        craftWeapon(
            btn.dataset.name,
            btn.dataset.type,
            parseInt(btn.dataset.dmg, 10),
            parseInt(btn.dataset.coins, 10),
            parseInt(btn.dataset.cores, 10),
            parseInt(btn.dataset.cd, 10)
        );
    });
});

document.querySelectorAll('.start-arena-btn').forEach(btn => {
    btn.addEventListener('click', () => startArenaSeries(parseInt(btn.dataset.size, 10)));
});

document.querySelectorAll('.pick-class-btn').forEach(btn => {
    btn.addEventListener('click', () => setHeroClass(btn.dataset.class));
});

// ================= INPUT LISTENERS =================
window.addEventListener('keydown', e => {
    if (document.activeElement && document.activeElement.tagName === "INPUT") return;
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

document.getElementById('t-atk').addEventListener('touchstart', e => { e.preventDefault(); aimNearestTarget(); performAttack(); });
document.getElementById('t-atk').addEventListener('mousedown', () => { aimNearestTarget(); performAttack(); });
document.getElementById('t-talk').addEventListener('click', interactNPC);
document.getElementById('t-mode').addEventListener('click', toggleAttackStyle);
document.getElementById('t-motion').addEventListener('click', toggleBossMotion);

function aimNearestTarget() {
    if (activeMode === "ONLINE_PVP" && remotePlayer.connected) {
        player.facingAngle = Math.atan2(remotePlayer.y - player.y, remotePlayer.x - player.x);
        return;
    }
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
    t.timer = setTimeout(() => t.style.display = 'none', 3400);
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
    const zoneLabel = activeMode === "ONLINE_PVP" ? "Online 1v1 Duel" : (activeMode === "ARENA" ? `Arena (${arenaTeamSize}v${arenaTeamSize})` : ZONES[currentZone].name);
    document.getElementById('ui-zone').innerText = zoneLabel;
    const raceEl = document.getElementById('ui-race');
    raceEl.innerText = `${player.race.name} (${player.race.rarity})`;
    raceEl.className = `rarity-${player.race.rarity}`;
    document.getElementById('ui-class').innerText = player.heroClass;
    document.getElementById('ui-hp').innerText = `${Math.max(0, Math.ceil(player.hp))} / ${player.maxHp}`;
    document.getElementById('ui-dmg').innerText = player.dmg;
    document.getElementById('ui-coins').innerText = player.coins;
    document.getElementById('ui-cores').innerText = player.bossCores;
    document.getElementById('ui-spins').innerText = player.spins;
    document.getElementById('ui-atk-mode').innerText = player.attackStyle === "gun" ? "GUN" : "BLADE";
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

// ================= QUEST TRACKER UI =================
function updateQuestTracker() {
    const tracker = document.getElementById('quest-tracker');
    const title = document.getElementById('quest-title');
    const desc = document.getElementById('quest-desc');
    const q = QUESTS[currentQuestIndex];

    tracker.classList.remove('ready-claim');

    if (questState === "AVAILABLE") {
        title.innerText = `${q.title} (Available)`;
        desc.innerText = `Go to ${ZONES[q.zone].name} and talk to ${q.npcName} [Press E or TALK] to accept your quest!`;
    } else if (questState === "ACTIVE") {
        title.innerText = `${q.title} (In Progress)`;
        desc.innerText = `Defeat ${q.targetName}: ${questKills} / ${q.reqKills}. Then return to ${q.npcName} for your reward!`;
    } else if (questState === "READY_TO_CLAIM") {
        tracker.classList.add('ready-claim');
        title.innerText = `✅ QUEST COMPLETE — CLAIM REWARD!`;
        desc.innerText = `Walk back to ${q.npcName} and press [E] or tap TALK to claim +${q.rewardCoins} Coins & +${q.rewardSpins} Spin(s)!`;
    }
}

// ================= ZONE & ENEMY SPAWNING =================
function returnToStoryMode() {
    closeAllModals();
    activeMode = "STORY";
    document.getElementById('quest-tracker').classList.remove('hidden');
    document.getElementById('series-banner').classList.add('hidden');
    loadZone(currentZone, 140, 250);
}

function loadZone(zoneIndex, spawnX, spawnY) {
    currentZone = zoneIndex;
    player.x = spawnX;
    player.y = spawnY;
    player.hp = player.maxHp;
    enemies = [];
    allies = [];
    bullets = [];

    if (zoneIndex === 0) {
        for (let i = 0; i < 3; i++) spawnEnemy("Drone", 480 + i * 95, 130 + i * 110);
    } else if (zoneIndex === 1) {
        for (let i = 0; i < 3; i++) spawnEnemy("Slime", 440 + i * 105, 130 + i * 110);
        if (currentQuestIndex === 2 && questState === "ACTIVE") {
            const b = QUESTS[2].spawnsBoss;
            spawnBoss(b.name, b.x, b.y, b.hp, b.dmg, b.color, b.dropChance);
        }
    } else if (zoneIndex === 2) {
        for (let i = 0; i < 4; i++) spawnEnemy("Dark Knight", 420 + (i % 2) * 150, 130 + Math.floor(i / 2) * 200);
        if (currentQuestIndex === 4 && questState === "ACTIVE") {
            const b = QUESTS[4].spawnsBoss;
            spawnBoss(b.name, b.x, b.y, b.hp, b.dmg, b.color, b.dropChance);
        }
    }
    updateQuestTracker();
    updateHUD();
}

function spawnEnemy(type, x, y) {
    if (type === "Drone") {
        enemies.push({ name: "Scout Drone", x, y, radius: 15, hp: 55, maxHp: 55, dmg: 7, spd: 1.45, color: "#e67e22", isBoss: false, isArena: false, dropChance: 0.1, shootTimer: 90, walkAnim: 0 });
    } else if (type === "Slime") {
        enemies.push({ name: "Corruption Slime", x, y, radius: 16, hp: 75, maxHp: 75, dmg: 10, spd: 1.55, color: "#27ae60", isBoss: false, isArena: false, dropChance: 0.15, shootTimer: 80, walkAnim: 0 });
    } else if (type === "Dark Knight") {
        enemies.push({ name: "Dark Knight", x, y, radius: 19, hp: 165, maxHp: 165, dmg: 16, spd: 2.0, color: "#8e44ad", isBoss: false, isArena: false, dropChance: 0.25, shootTimer: 65, walkAnim: 0 });
    }
}

function spawnBoss(name, x, y, hp, dmg, color, dropChance) {
    enemies.push({ name, x, y, radius: 34, hp, maxHp: hp, dmg, spd: 1.7, color, isBoss: true, isArena: false, dropChance, shootTimer: 45, walkAnim: 0 });
}

// ================= NPC QUEST INTERACTION & REWARD TURN-IN =================
function interactNPC() {
    if (activeDialogue) {
        acceptDialogue();
        return;
    }
    if (activeMode !== "STORY") return;
    const zone = ZONES[currentZone];
    for (const npc of zone.npcs) {
        if (Math.hypot(player.x - npc.x, player.y - npc.y) < 75) {
            openDialogue(npc);
            break;
        }
    }
}

function openDialogue(npc) {
    const modal = document.getElementById('dialogue-modal');
    const speaker = document.getElementById('dialogue-speaker');
    const text = document.getElementById('dialogue-text');
    const rewardBanner = document.getElementById('dialogue-reward');
    const btn = document.getElementById('btn-dialogue-next');

    speaker.innerText = npc.name;
    rewardBanner.classList.add('hidden');

    const q = QUESTS[currentQuestIndex];

    // If this NPC is the quest giver for our current quest
    if (npc.name === q.npcName) {
        if (questState === "AVAILABLE") {
            text.innerText = q.startText;
            rewardBanner.innerText = `Quest Reward upon Return: +${q.rewardCoins} Coins & +${q.rewardSpins} Race Spin(s)`;
            rewardBanner.classList.remove('hidden');
            btn.innerText = "Accept Quest [E]";
            activeDialogue = () => {
                questState = "ACTIVE";
                questKills = 0;
                if (q.spawnsBoss && !enemies.some(e => e.name === q.spawnsBoss.name)) {
                    const b = q.spawnsBoss;
                    spawnBoss(b.name, b.x, b.y, b.hp, b.dmg, b.color, b.dropChance);
                }
                updateQuestTracker();
                showToast(`Accepted: ${q.title}! Complete it and return to ${q.npcName}.`);
            };
        } else if (questState === "ACTIVE") {
            text.innerText = `${q.progressText} (Current Progress: ${questKills} / ${q.reqKills})`;
            btn.innerText = "Got It [E]";
            activeDialogue = () => {};
        } else if (questState === "READY_TO_CLAIM") {
            text.innerText = q.claimText;
            rewardBanner.innerText = `🎁 CLAIMED REWARD: +${q.rewardCoins} Forge Coins, +${q.rewardSpins} Race Spin(s) & Full Heal!`;
            rewardBanner.classList.remove('hidden');
            btn.innerText = "Claim Reward & Continue [E]";
            activeDialogue = () => {
                // Grant NPC Turn-In Rewards!
                player.coins += q.rewardCoins;
                player.spins += q.rewardSpins;
                player.hp = player.maxHp;
                player.score += 250;
                highestUnlockedZone = Math.max(highestUnlockedZone, q.unlocksZone);

                floatingTexts.push({ x: player.x, y: player.y - 35, text: `+${q.rewardCoins} COINS & +${q.rewardSpins} SPIN!`, color: "#2ecc71", timer: 80 });
                showToast(`Reward Claimed from ${npc.name}! (+${q.rewardCoins} Coins & +${q.rewardSpins} Spin)`);

                if (!q.repeatable && currentQuestIndex < QUESTS.length - 1) {
                    currentQuestIndex++;
                }
                questState = "AVAILABLE";
                questKills = 0;
                updateQuestTracker();
                updateHUD();
            };
        }
    } else {
        text.innerText = `Your current mission is with ${q.npcName} in ${ZONES[q.zone].name}. Speak with them to progress!`;
        btn.innerText = "Close [E]";
        activeDialogue = () => {};
    }

    modal.style.display = 'block';
}

function acceptDialogue() {
    if (activeDialogue) activeDialogue();
    activeDialogue = null;
    document.getElementById('dialogue-modal').style.display = 'none';
}

// ================= 1v1 TO 5v5 BOT ARENA SERIES =================
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

// ================= SHOOTING, MELEE & BOSS DROPS =================
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
            const bx = player.x + Math.cos(angle) * 22;
            const by = player.y + Math.sin(angle) * 22;
            const bvx = Math.cos(angle) * speed;
            const bvy = Math.sin(angle) * speed;

            bullets.push({
                x: bx, y: by,
                vx: bvx, vy: bvy,
                dmg: player.dmg,
                color: player.weapon.color,
                fromAlly: true,
                radius: 5
            });

            if (conn && conn.open) {
                conn.send({ type: "SHOOT", x: bx, y: by, vx: bvx, vy: bvy, dmg: player.dmg });
            }
        }
    } else {
        player.attackVisualTimer = 10;
        // Check hit on Online Friend in PvP
        if (remotePlayer.connected && Math.hypot(remotePlayer.x - player.x, remotePlayer.y - player.y) <= player.attackRange + remotePlayer.radius) {
            if (conn && conn.open) conn.send({ type: "HIT_ME", dmg: player.dmg });
            floatingTexts.push({ x: remotePlayer.x, y: remotePlayer.y - 15, text: `-${player.dmg}`, color: "#00d2ff", timer: 30 });
        }
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

function handleEnemyDeath(e, index) {
    enemies.splice(index, 1);
    player.score += e.isBoss ? 500 : 100;

    if (e.isArena) {
        player.coins += e.coinReward;
        floatingTexts.push({ x: e.x, y: e.y - 30, text: `+${e.coinReward} COINS!`, color: "#2ecc71", timer: 60 });
        updateHUD();
        return;
    }

    // Check Quest Objective Progress
    const q = QUESTS[currentQuestIndex];
    if (questState === "ACTIVE" && e.name === q.targetName) {
        questKills++;
        if (questKills >= q.reqKills) {
            questState = "READY_TO_CLAIM";
            showToast(`Objective Complete! Return to ${q.npcName} and press [E] to claim your reward!`);
        }
        updateQuestTracker();
    }

    // Direct Boss Drops (Spin + 10% Boss Core/Motion)
    if (Math.random() <= e.dropChance) {
        player.spins++;
        floatingTexts.push({ x: e.x, y: e.y - 30, text: "+1 BONUS SPIN!", color: "#f1c40f", timer: 70 });
    }

    if (e.isBoss && Math.random() < 0.10) {
        player.bossCores++;
        player.unlockedBossMotion = true;
        player.bossMotionActive = true;
        applyRaceStats();
        floatingTexts.push({ x: e.x, y: e.y - 50, text: "10% BOSS CORE & MOTION!", color: "#e056fd", timer: 90 });
        showToast("10% JACKPOT! Unlocked Shadow Core Motion [M] & +1 Boss Core for Guns!");
    }

    // Respawn normal zone enemies
    if (!e.isBoss && activeMode === "STORY") {
        const savedZone = currentZone;
        const type = e.name === "Scout Drone" ? "Drone" : (e.name === "Corruption Slime" ? "Slime" : "Dark Knight");
        setTimeout(() => {
            if (activeMode === "STORY" && currentZone === savedZone && enemies.filter(en => !en.isBoss).length < 3) {
                spawnEnemy(type, 440 + Math.random() * 260, 120 + Math.random() * 250);
            }
        }, 3500);
    }

    updateHUD();
}

// ================= MODALS: REROLL, FORGE, CLASSES =================
function closeAllModals() {
    if (isSpinning) return;
    document.getElementById('reroll-modal').style.display = 'none';
    document.getElementById('forge-modal').style.display = 'none';
    document.getElementById('arena-modal').style.display = 'none';
    document.getElementById('class-modal').style.display = 'none';
    document.getElementById('online-modal').style.display = 'none';
}

function isModalOpen() {
    return ['login-modal', 'reroll-modal', 'forge-modal', 'arena-modal', 'class-modal', 'online-modal'].some(
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
        status.innerText = `Need ${coinCost} Coins! Complete NPC Quests or Arena matches to earn Coins.`;
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

function pickWeightedRace() {
    const total = RACES.reduce((acc, r) => acc + r.chance, 0);
    let rand = Math.random() * total;
    for (const r of RACES) {
        if (rand < r.chance) return r;
        rand -= r.chance;
    }
    return RACES[0];
}

function triggerRaceSpin() {
    if (isSpinning) return;
    if (player.spins <= 0) {
        showToast("No Spins left! Complete NPC Quests or defeat Bosses to earn Spins.");
        return;
    }

    player.spins--;
    updateHUD();
    isSpinning = true;

    const chosenRace = pickWeightedRace();

    let ticks = 0;
    const maxTicks = 22;
    const interval = setInterval(() => {
        const randomPreview = RACES[Math.floor(Math.random() * RACES.length)];
        updateSpinModalDisplay(randomPreview);
        ticks++;

        if (ticks >= maxTicks) {
            clearInterval(interval);
            player.race = chosenRace;
            applyRaceStats();
            updateSpinModalDisplay(chosenRace);
            isSpinning = false;
            showToast(`Awakened Race: ${chosenRace.name} [${chosenRace.rarity}]!`);
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

    // Broadcast Live State to Connected Friend (2km+ Online Multiplayer)
    if (conn && conn.open) {
        conn.send({
            type: "STATE",
            username: player.username,
            x: player.x, y: player.y,
            hp: player.hp, maxHp: player.maxHp,
            aimAngle: player.facingAngle,
            walkAnim: player.walkAnim,
            color: player.race.color,
            aura: player.race.aura,
            attackStyle: player.attackStyle,
            wpnColor: player.weapon.color,
            bossMotion: player.bossMotionActive
        });
    }

    if (activeMode === "STORY") {
        const zone = ZONES[currentZone];
        for (const p of zone.portals) {
            if (Math.hypot(player.x - p.x, player.y - p.y) < 36) {
                if (highestUnlockedZone >= p.reqZone) {
                    loadZone(p.targetZone, p.spawnX, p.spawnY);
                    showToast(`Entered ${ZONES[currentZone].name}`);
                    return;
                } else {
                    floatingTexts.push({ x: p.x - 45, y: p.y - 30, text: "Complete & Claim NPC Quest First!", color: "#f39c12", timer: 20 });
                    player.x -= (dx * 10);
                }
            }
        }
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
            bullets.splice(i, 1);
            continue;
        }
        if (b.fromAlly) {
            // Check if our bullet hits our Online Friend in PvP
            if (remotePlayer.connected && Math.hypot(b.x - remotePlayer.x, b.y - remotePlayer.y) < remotePlayer.radius + b.radius) {
                if (conn && conn.open) conn.send({ type: "HIT_ME", dmg: b.dmg });
                floatingTexts.push({ x: remotePlayer.x, y: remotePlayer.y - 15, text: `-${b.dmg}`, color: "#00d2ff", timer: 30 });
                bullets.splice(i, 1);
                continue;
            }
            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                if (Math.hypot(b.x - e.x, b.y - e.y) < e.radius + b.radius) {
                    applyDamageToEnemy(e, j, b.dmg);
                    bullets.splice(i, 1);
                    break;
                }
            }
        } else if (!b.fromRemotePlayer) {
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
        } else {
            bullets.splice(i, 1);
        }
    }

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

    if (activeMode === "ARENA" && enemies.length === 0) {
        allyRoundWins++;
        if (allyRoundWins >= 5) {
            player.coins += 50;
            player.score += 350;
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
        showToast("You were defeated! Respawned at Outpost.");
        loadZone(0, 140, 250);
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

    ctx.beginPath();
    ctx.arc(0, -16, 7, 0, Math.PI * 2);
    ctx.fillStyle = "#111";
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(0, 6);
    ctx.stroke();

    const swing = Math.sin(walkAnim) * 7;
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.lineTo(-6 + swing, 18);
    ctx.moveTo(0, 6);
    ctx.lineTo(6 - swing, 18);
    ctx.stroke();

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
    ctx.fillStyle = (activeMode === "ARENA" || activeMode === "ONLINE_PVP") ? "#141824" : zone.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = (activeMode === "ARENA" || activeMode === "ONLINE_PVP") ? "#1f2638" : zone.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    if (activeMode === "STORY") {
        for (const p of zone.portals) {
            const unlocked = highestUnlockedZone >= p.reqZone;
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

        const q = QUESTS[currentQuestIndex];
        for (const npc of zone.npcs) {
            drawStickmanUnit(npc.x, npc.y, npc.color, 0, 0, 1.05, null, false, "#ffd700", false);
            ctx.save();
            // Dynamic Quest Icon above NPC: "!" (New Quest), "?" (Ready to Claim Reward), "..." (In Progress)
            const isQuestNpc = npc.name === q.npcName;
            ctx.fillStyle = questState === "READY_TO_CLAIM" && isQuestNpc ? "#2ecc71" : "#ffd700";
            ctx.font = "bold 19px sans-serif";
            ctx.textAlign = "center";
            const badgeSymbol = isQuestNpc ? (questState === "READY_TO_CLAIM" ? "🎁 ?" : (questState === "ACTIVE" ? "..." : "!")) : "!";
            ctx.fillText(badgeSymbol, npc.x, npc.y - 32);

            ctx.fillStyle = "#fff";
            ctx.font = "bold 13px sans-serif";
            ctx.fillText(npc.name, npc.x, npc.y + 34);

            if (Math.hypot(player.x - npc.x, player.y - npc.y) < 75) {
                ctx.fillStyle = questState === "READY_TO_CLAIM" ? "#2ecc71" : "#f39c12";
                ctx.font = "bold 12px sans-serif";
                ctx.fillText(questState === "READY_TO_CLAIM" ? "[Press E / TALK to Claim Reward!]" : "[Press E / Tap TALK]", npc.x, npc.y + 50);
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

    // Draw Live Connected Friend (2km+ Online Player)
    if (remotePlayer.connected) {
        drawStickmanUnit(
            remotePlayer.x, remotePlayer.y,
            remotePlayer.color,
            remotePlayer.aimAngle,
            remotePlayer.walkAnim,
            1.05,
            remotePlayer.aura,
            remotePlayer.attackStyle === "gun",
            remotePlayer.wpnColor,
            remotePlayer.bossMotion
        );
        ctx.fillStyle = "#00d2ff";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`🌐 ${remotePlayer.username} (${Math.max(0, Math.ceil(remotePlayer.hp))} HP)`, remotePlayer.x, remotePlayer.y - 28);
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
loadZone(0, 140, 250);
renderLeaderboard(getStoredPlayers());
gameLoop();
