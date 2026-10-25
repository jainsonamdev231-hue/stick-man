const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ================= RACES & CLASSES GACHA TABLES (WITH WEIGHTED RARITIES) =================
const RACES = [
    { name: "Human", rarity: "Common", chance: 45, hpMult: 1.0, dmgMult: 1.0, spdMult: 1.0, rangeBonus: 0, bulletMult: 1.0, multiShot: 1, regen: 0, lifesteal: 0, color: "#3498db", aura: null },
    { name: "Beastkin", rarity: "Uncommon", chance: 25, hpMult: 1.3, dmgMult: 1.25, spdMult: 1.35, rangeBonus: 8, bulletMult: 1.15, multiShot: 1, regen: 0.02, lifesteal: 0, color: "#e67e22", aura: "#2ecc71" },
    { name: "Frost Elf", rarity: "Rare", chance: 15, hpMult: 1.5, dmgMult: 1.6, spdMult: 1.25, rangeBonus: 22, bulletMult: 1.35, multiShot: 1, regen: 0.05, lifesteal: 0, color: "#00cec9", aura: "#3498db" },
    { name: "Shadow Demon", rarity: "Epic", chance: 9, hpMult: 1.8, dmgMult: 2.0, spdMult: 1.35, rangeBonus: 16, bulletMult: 1.4, multiShot: 1, regen: 0, lifesteal: 0.15, color: "#9b59b6", aura: "#c56cf0" },
    { name: "Celestial", rarity: "Legendary", chance: 5, hpMult: 2.4, dmgMult: 2.5, spdMult: 1.45, rangeBonus: 26, bulletMult: 1.5, multiShot: 2, regen: 0.18, lifesteal: 0.08, color: "#f1c40f", aura: "#f39c12" },
    { name: "Void Monarch", rarity: "Mythic", chance: 1, hpMult: 3.5, dmgMult: 4.0, spdMult: 1.65, rangeBonus: 40, bulletMult: 1.75, multiShot: 3, regen: 0.25, lifesteal: 0.22, color: "#ff3838", aura: "#ff0055" }
];

const CLASSES = [
    { name: "Soldier", rarity: "Common", chance: 45, hpAdd: 0, dmgMult: 1.0, spdMult: 1.0, fireRateMult: 1.0, extraShots: 0 },
    { name: "Vanguard", rarity: "Uncommon", chance: 25, hpAdd: 80, dmgMult: 1.2, spdMult: 1.05, fireRateMult: 0.95, extraShots: 0 },
    { name: "Arcane Gunner", rarity: "Rare", chance: 15, hpAdd: 30, dmgMult: 1.45, spdMult: 1.15, fireRateMult: 0.72, extraShots: 0 },
    { name: "Master Forger", rarity: "Epic", chance: 9, hpAdd: 60, dmgMult: 1.75, spdMult: 1.15, fireRateMult: 0.82, extraShots: 0 },
    { name: "Chrono Blade", rarity: "Legendary", chance: 5, hpAdd: 120, dmgMult: 2.3, spdMult: 1.4, fireRateMult: 0.65, extraShots: 1 },
    { name: "Astral Emperor", rarity: "Mythic", chance: 1, hpAdd: 250, dmgMult: 3.5, spdMult: 1.6, fireRateMult: 0.55, extraShots: 2 }
];

// ================= ALL WEAPONS CATALOG (BUY ONCE -> OWN FOREVER!) =================
const WEAPON_CATALOG = [
    { id: "pistol", name: "Pulse Pistol", type: "gun", dmg: 12, coins: 0, cores: 0, cd: 14, desc: "Starter Energy Sidearm" },
    { id: "katana", name: "Shadow Katana", type: "melee", dmg: 28, coins: 30, cores: 0, cd: 16, desc: "High-Crit Ninja Blade" },
    { id: "hammer", name: "Titan War Hammer", type: "melee", dmg: 48, coins: 65, cores: 0, cd: 20, desc: "Crushing Shockwave Melee" },
    { id: "scythe", name: "Blood Reaper Scythe", type: "melee", dmg: 85, coins: 120, cores: 0, cd: 17, desc: "Wide Sweeping Lifesteal Blade" },
    { id: "dual_guns", name: "Dual Phantom Pistols", type: "gun", dmg: 45, coins: 50, cores: 1, cd: 9, desc: "Rapid Twin Suppressors" },
    { id: "plasma_rifle", name: "Void Assault Rifle", type: "gun", dmg: 75, coins: 95, cores: 1, cd: 7, desc: "Full-Auto Plasma Rifle" },
    { id: "sniper", name: "Celestial Longbow Gun", type: "gun", dmg: 130, coins: 150, cores: 2, cd: 13, desc: "High-Caliber Piercing Sniper" },
    { id: "railcannon", name: "Omega Railcannon", type: "gun", dmg: 220, coins: 250, cores: 3, cd: 11, desc: "Mythic Boss-Slaying Beam Cannon" }
];

// ================= 10 BIOMES FOR STAGES 1 TO 100 =================
const BIOMES = [
    { name: "Emerald Outpost", bgTop: "#0f2419", bgBot: "#1b3b2b", grid: "rgba(46, 204, 113, 0.08)", propColor: "#145a32", npc: "Commander Vance", mob: "Scout Drone", mobColor: "#e67e22", boss: "Mecha Warden" },
    { name: "Whispering Woods", bgTop: "#0d1b24", bgBot: "#162d3b", grid: "rgba(0, 206, 201, 0.08)", propColor: "#1b4f72", npc: "Scout Aria", mob: "Corruption Slime", mobColor: "#2ecc71", boss: "Giant Slime King" },
    { name: "Cursed Citadel", bgTop: "#1f1124", bgBot: "#321b3b", grid: "rgba(155, 89, 182, 0.08)", propColor: "#4a235a", npc: "Grand Warden", mob: "Dark Knight", mobColor: "#9b59b6", boss: "Abyssal Overlord" },
    { name: "Scorched Dunes", bgTop: "#2b1d0e", bgBot: "#473018", grid: "rgba(243, 156, 18, 0.08)", propColor: "#784212", npc: "Nomad Kael", mob: "Sand Stalker", mobColor: "#f39c12", boss: "Pharaoh Colossus" },
    { name: "Frozen Peaks", bgTop: "#0e232e", bgBot: "#1b3d4f", grid: "rgba(52, 152, 219, 0.1)", propColor: "#2874a6", npc: "Frost Sage", mob: "Glacier Wraith", mobColor: "#00d2ff", boss: "Cryo Behemoth" },
    { name: "Neon Cyber-City", bgTop: "#0c0e24", bgBot: "#191d42", grid: "rgba(0, 210, 255, 0.12)", propColor: "#1f618d", npc: "Cyber Hacker Zero", mob: "Chrome Assassin", mobColor: "#00cec9", boss: "Shogun Frame X" },
    { name: "Volcanic Core", bgTop: "#290c0c", bgBot: "#4a1515", grid: "rgba(231, 76, 60, 0.1)", propColor: "#78281f", npc: "Forge Master Ignis", mob: "Magma Brute", mobColor: "#e74c3c", boss: "Infernal Dragon" },
    { name: "Void Dimension", bgTop: "#090514", bgBot: "#160d2e", grid: "rgba(224, 86, 253, 0.1)", propColor: "#3b1e54", npc: "Void Seer", mob: "Null Phantom", mobColor: "#e056fd", boss: "Void Harbinger" },
    { name: "Celestial Sanctuary", bgTop: "#24200e", bgBot: "#3d3719", grid: "rgba(241, 196, 15, 0.12)", propColor: "#7d6608", npc: "Archangel Valkyrie", mob: "Fallen Seraph", mobColor: "#f1c40f", boss: "Solar Titan" },
    { name: "Omega Throne", bgTop: "#1a050d", bgBot: "#330819", grid: "rgba(255, 56, 56, 0.15)", propColor: "#641e16", npc: "Supreme Oracle", mob: "Omega Royal Guard", mobColor: "#ff3838", boss: "Emperor Malakor (Stage 100)" }
];

// ================= PLAYER STATE =================
const player = {
    username: "Guest",
    level: 1,
    xp: 0,
    maxXp: 100,
    x: 140, y: 250, radius: 18,
    baseHp: 150, maxHp: 150, hp: 150,
    baseDmg: 20, dmg: 32,
    baseSpd: 3.6, spd: 3.6,
    attackRange: 60,
    race: RACES[0],
    heroClass: CLASSES[0],
    attackStyle: "gun",
    equippedWeaponId: "pistol",
    ownedWeapons: ["pistol"], // Permanent inventory!
    weaponColor: "#00d2ff",
    weaponMod: "Rapid",
    raceSpins: 2,
    classSpins: 2,
    coins: 0,
    gems: 10,
    bossCores: 0,
    unlockedBossMotion: false,
    bossMotionActive: false,
    score: 0,
    attackCooldown: 0,
    attackVisualTimer: 0,
    facingAngle: 0,
    walkAnim: 0
};

let currentStage = 1; // 1 to 100
let maxUnlockedStage = 1;
let questState = "AVAILABLE"; // "AVAILABLE", "ACTIVE", "READY_TO_CLAIM"
let questKills = 0;

let activeMode = "STORY"; // "STORY", "ARENA", "ONLINE_PVP"
let activeDialogue = null;
let isSpinning = false;
let screenShake = 0;

let arenaTeamSize = 1;
let allyRoundWins = 0;
let enemyRoundWins = 0;

let enemies = [];
let allies = [];
let bullets = [];
let lootDrops = [];
let particles = [];
let stageProps = [];
let floatingTexts = [];
const keys = {};

// ================= PERMANENT AUTO-SAVE & AUTO-LOGIN =================
const SAVE_KEY = "stickman_force_100_save_v1";

function saveProgress() {
    if (player.username === "Guest") return;
    const data = {
        username: player.username,
        level: player.level,
        xp: player.xp,
        maxXp: player.maxXp,
        raceName: player.race.name,
        className: player.heroClass.name,
        equippedWeaponId: player.equippedWeaponId,
        ownedWeapons: player.ownedWeapons,
        weaponColor: player.weaponColor,
        weaponMod: player.weaponMod,
        raceSpins: player.raceSpins,
        classSpins: player.classSpins,
        coins: player.coins,
        gems: player.gems,
        bossCores: player.bossCores,
        unlockedBossMotion: player.unlockedBossMotion,
        bossMotionActive: player.bossMotionActive,
        score: player.score,
        currentStage: currentStage,
        maxUnlockedStage: maxUnlockedStage
    };
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {}
}

function loadSavedProgress() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return false;
        const d = JSON.parse(raw);
        if (!d || !d.username) return false;

        player.username = d.username;
        player.level = d.level || 1;
        player.xp = d.xp || 0;
        player.maxXp = d.maxXp || 100;
        player.race = RACES.find(r => r.name === d.raceName) || RACES[0];
        player.heroClass = CLASSES.find(c => c.name === d.className) || CLASSES[0];
        player.equippedWeaponId = d.equippedWeaponId || "pistol";
        player.ownedWeapons = Array.isArray(d.ownedWeapons) && d.ownedWeapons.length ? d.ownedWeapons : ["pistol"];
        player.weaponColor = d.weaponColor || "#00d2ff";
        player.weaponMod = d.weaponMod || "Rapid";
        player.raceSpins = d.raceSpins ?? 2;
        player.classSpins = d.classSpins ?? 2;
        player.coins = d.coins || 0;
        player.gems = d.gems || 10;
        player.bossCores = d.bossCores || 0;
        player.unlockedBossMotion = !!d.unlockedBossMotion;
        player.bossMotionActive = !!d.bossMotionActive;
        player.score = d.score || 0;
        currentStage = d.currentStage || 1;
        maxUnlockedStage = d.maxUnlockedStage || 1;
        return true;
    } catch (e) {
        return false;
    }
}

function getLeaderboardData() {
    try {
        const raw = localStorage.getItem('rpg_unique_heroes');
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function updateLeaderboardStorage() {
    if (player.username === "Guest") return;
    try {
        const list = getLeaderboardData();
        const existing = list.find(p => p.username.toLowerCase() === player.username.toLowerCase());
        if (existing) {
            existing.score = Math.max(existing.score, player.score);
        } else {
            list.push({ username: player.username, score: player.score });
        }
        localStorage.setItem('rpg_unique_heroes', JSON.stringify(list));
        renderLeaderboard(list);
    } catch (e) {}
}

function renderLeaderboard(players) {
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = "";
    if (!players || players.length === 0) {
        list.innerHTML = "<li>No heroes registered yet...</li>";
        return;
    }
    players.sort((a, b) => b.score - a.score).slice(0, 10).forEach((p, idx) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>#${idx + 1} <b>${p.username}</b></span><span style="color:#ffd700;">${p.score} pts</span>`;
        list.appendChild(li);
    });
}

// ================= STAGE 1 TO 100 GENERATOR =================
function getStageConfig(stageNum) {
    const s = Math.max(1, Math.min(100, stageNum));
    const biomeIndex = Math.min(9, Math.floor((s - 1) / 10));
    const biome = BIOMES[biomeIndex];
    const isBossStage = (s % 5 === 0);
    const reqKills = isBossStage ? 1 : (3 + (s % 3));
    const enemyHp = Math.round((isBossStage ? 260 : 60) * Math.pow(1.07, s - 1));
    const enemyDmg = Math.round((isBossStage ? 16 : 7) * Math.pow(1.05, s - 1));

    return {
        stage: s,
        biome,
        isBossStage,
        npcName: `${biome.npc} (St.${s})`,
        targetName: isBossStage ? `${biome.boss} [St.${s} Boss]` : `${biome.mob} Lv.${s}`,
        reqKills,
        enemyHp,
        enemyDmg,
        rewardCoins: 35 + s * 15 + (isBossStage ? 80 : 0),
        rewardXp: 50 + s * 25,
        rewardGems: isBossStage ? 15 : 5,
        rewardSpins: isBossStage ? 1 : 0
    };
}

function generateBiomeProps(stageNum) {
    stageProps = [];
    const cfg = getStageConfig(stageNum);
    for (let i = 0; i < 8; i++) {
        stageProps.push({
            x: 90 + (i * 105) % 720,
            y: 55 + ((i * 173 + stageNum * 31) % 390),
            size: 16 + (i % 3) * 6,
            color: cfg.biome.propColor
        });
    }
}

// ================= LEVEL & XP PROGRESSION =================
function gainXp(amount) {
    player.xp += amount;
    while (player.xp >= player.maxXp) {
        player.xp -= player.maxXp;
        player.level++;
        player.maxXp = Math.round(player.maxXp * 1.25);
        player.baseHp += 18;
        player.baseDmg += 4;
        player.raceSpins++;
        if (player.level % 2 === 0) player.classSpins++;
        applyStats();
        player.hp = player.maxHp;
        floatingTexts.push({ x: player.x, y: player.y - 45, text: `LEVEL UP! Lv.${player.level} (+1 Spin!)`, color: "#ffd700", timer: 90 });
        showToast(`LEVEL UP! You reached Level ${player.level}! (+1 Race Spin)`);
    }
    saveProgress();
    updateHUD();
}

// ================= STATS & PERMANENT WEAPON EQUIP =================
function getEquippedWeapon() {
    return WEAPON_CATALOG.find(w => w.id === player.equippedWeaponId) || WEAPON_CATALOG[0];
}

function applyStats() {
    const r = player.race;
    const c = player.heroClass;
    const wpn = getEquippedWeapon();
    const modDmg = player.weaponMod === "Heavy" ? 20 : (player.weaponMod === "Crimson" ? 12 : 0);
    const motionMult = player.bossMotionActive ? 1.4 : 1.0;

    player.maxHp = Math.round((player.baseHp + c.hpAdd) * r.hpMult);
    player.hp = Math.min(player.hp, player.maxHp);
    player.dmg = Math.round((player.baseDmg + wpn.dmg + modDmg) * r.dmgMult * c.dmgMult * motionMult);
    player.spd = player.baseSpd * r.spdMult * c.spdMult * (player.bossMotionActive ? 1.25 : 1.0);
    player.attackRange = 60 + (r.rangeBonus || 0);
    updateHUD();
}

function updateHUD() {
    const cfg = getStageConfig(currentStage);
    document.getElementById('ui-hero').innerText = player.username;
    document.getElementById('ui-level').innerText = player.level;
    document.getElementById('ui-xp').innerText = `${player.xp}/${player.maxXp}`;

    const raceEl = document.getElementById('ui-race');
    raceEl.innerText = `${player.race.name} (${player.race.rarity})`;
    raceEl.className = `rarity-${player.race.rarity}`;

    const classEl = document.getElementById('ui-class');
    classEl.innerText = `${player.heroClass.name} (${player.heroClass.rarity})`;
    classEl.className = `rarity-${player.heroClass.rarity}`;

    document.getElementById('ui-hp').innerText = `${Math.max(0, Math.ceil(player.hp))}/${player.maxHp}`;
    document.getElementById('ui-dmg').innerText = player.dmg;
    document.getElementById('ui-coins').innerText = player.coins;
    document.getElementById('ui-gems').innerText = player.gems;
    document.getElementById('ui-cores').innerText = player.bossCores;
    document.getElementById('ui-race-spins').innerText = player.raceSpins;
    document.getElementById('ui-class-spins').innerText = player.classSpins;

    document.getElementById('ui-stage-title').innerText = activeMode === "STORY"
        ? `STAGE ${currentStage} / 100 — ${cfg.biome.name} ${cfg.isBossStage ? "(🔥 BOSS)" : ""}`
        : (activeMode === "ONLINE_PVP" ? "🌐 ONLINE 1v1 DUEL" : `⚔️ RIVALS ARENA (${arenaTeamSize}v${arenaTeamSize})`);
    document.getElementById('ui-max-stage').innerText = maxUnlockedStage;

    const wpn = getEquippedWeapon();
    document.getElementById('ui-atk-mode').innerText = player.attackStyle.toUpperCase();
    document.getElementById('ui-weapon').innerText = `${player.weaponMod} ${wpn.name}`;
    document.getElementById('ui-owned-count').innerText = `${player.ownedWeapons.length} / ${WEAPON_CATALOG.length}`;
    document.getElementById('ui-motion').innerText = player.unlockedBossMotion ? (player.bossMotionActive ? "ACTIVE [M]" : "READY [M]") : "Locked (10% Boss)";
}

// ================= THE FORGE & PERMANENT INVENTORY UI =================
function renderForgeInventory() {
    const grid = document.getElementById('forge-weapons-grid');
    grid.innerHTML = "";

    WEAPON_CATALOG.forEach(wpn => {
        const isOwned = player.ownedWeapons.includes(wpn.id);
        const isEquipped = player.equippedWeaponId === wpn.id;

        const card = document.createElement('div');
        card.className = `forge-box ${isOwned ? "owned-card" : ""}`;

        let btnHtml = "";
        if (isEquipped) {
            btnHtml = `<button type="button" class="btn btn-equipped">✓ EQUIPPED</button>`;
        } else if (isOwned) {
            btnHtml = `<button type="button" class="btn btn-owned" data-id="${wpn.id}">EQUIP (OWNED)</button>`;
        } else {
            const costText = wpn.cores > 0 ? `${wpn.coins} Coins + ${wpn.cores} Core` : `${wpn.coins} Coins`;
            btnHtml = `<button type="button" class="btn btn-reroll" data-id="${wpn.id}">Buy (${costText})</button>`;
        }

        card.innerHTML = `
            <h4>${wpn.name} (${wpn.type.toUpperCase()})</h4>
            <p>${wpn.desc} | +${wpn.dmg} DMG</p>
            ${btnHtml}
        `;

        const btn = card.querySelector('button');
        if (!isEquipped) {
            btn.addEventListener('click', () => handleWeaponAction(wpn));
        }
        grid.appendChild(card);
    });
}

function handleWeaponAction(wpn) {
    const status = document.getElementById('forge-status');
    player.weaponColor = document.getElementById('custom-color').value;
    player.weaponMod = document.getElementById('custom-mod').value;

    // If already owned, equip immediately for FREE!
    if (player.ownedWeapons.includes(wpn.id)) {
        player.equippedWeaponId = wpn.id;
        player.attackStyle = wpn.type;
        applyStats();
        saveProgress();
        renderForgeInventory();
        status.style.color = "#2ecc71";
        status.innerText = `Equipped ${player.weaponMod} ${wpn.name}!`;
        return;
    }

    // Otherwise check currency to purchase once
    if (player.coins < wpn.coins) {
        status.style.color = "#e74c3c";
        status.innerText = `Need ${wpn.coins} Coins! Complete NPC Quests, open Loot Chests, or play Arena.`;
        return;
    }
    if (player.bossCores < wpn.cores) {
        status.style.color = "#e74c3c";
        status.innerText = `Need ${wpn.cores} Boss Core(s)! Defeat Bosses on Stage 5, 10, 15... (10% Drop).`;
        return;
    }

    player.coins -= wpn.coins;
    player.bossCores -= wpn.cores;
    player.ownedWeapons.push(wpn.id);
    player.equippedWeaponId = wpn.id;
    player.attackStyle = wpn.type;

    applyStats();
    saveProgress();
    renderForgeInventory();
    status.style.color = "#2ecc71";
    status.innerText = `Purchased & Permanently Unlocked: ${wpn.name}!`;
}

// ================= STAGE LOADING & NPC QUESTS (1 TO 100) =================
function loadStage(stageNum, spawnX = 130, spawnY = 250) {
    currentStage = Math.max(1, Math.min(maxUnlockedStage, stageNum));
    questState = "AVAILABLE";
    questKills = 0;
    player.x = spawnX;
    player.y = spawnY;
    player.hp = player.maxHp;
    enemies = [];
    allies = [];
    bullets = [];
    lootDrops = [];

    generateBiomeProps(currentStage);
    const cfg = getStageConfig(currentStage);

    // Spawn initial stage mobs
    const mobCount = cfg.isBossStage ? 2 : 4;
    for (let i = 0; i < mobCount; i++) {
        spawnStageMob(cfg, 430 + (i % 2) * 160, 120 + Math.floor(i / 2) * 200, false);
    }
    if (cfg.isBossStage) {
        spawnStageMob(cfg, 660, 250, true);
    }

    saveProgress();
    updateQuestTracker();
    updateHUD();
}

function spawnStageMob(cfg, x, y, isBoss) {
    enemies.push({
        name: isBoss ? cfg.targetName : `${cfg.biome.mob} Lv.${cfg.stage}`,
        x, y,
        radius: isBoss ? 34 : 17,
        hp: isBoss ? cfg.enemyHp * 2.2 : cfg.enemyHp,
        maxHp: isBoss ? cfg.enemyHp * 2.2 : cfg.enemyHp,
        dmg: isBoss ? Math.round(cfg.enemyDmg * 1.4) : cfg.enemyDmg,
        spd: isBoss ? 1.75 : 1.55 + Math.min(1.2, cfg.stage * 0.01),
        color: isBoss ? "#ff3838" : cfg.biome.mobColor,
        isBoss,
        isArena: false,
        dropChance: isBoss ? 0.75 : 0.18,
        shootTimer: isBoss ? 40 : 75,
        walkAnim: 0
    });
}

function updateQuestTracker() {
    const tracker = document.getElementById('quest-tracker');
    const title = document.getElementById('quest-title');
    const desc = document.getElementById('quest-desc');
    const cfg = getStageConfig(currentStage);

    tracker.classList.remove('ready-claim');

    if (questState === "AVAILABLE") {
        title.innerText = `Stage ${currentStage}: Mission Available`;
        desc.innerText = `Walk to ${cfg.npcName} [Press E or tap TALK] to accept the Stage ${currentStage} quest!`;
    } else if (questState === "ACTIVE") {
        title.innerText = `Stage ${currentStage}: Hunt in Progress`;
        desc.innerText = `Defeat ${questKills} / ${cfg.reqKills} enemies (${cfg.targetName}). Then return to ${cfg.npcName}!`;
    } else if (questState === "READY_TO_CLAIM") {
        tracker.classList.add('ready-claim');
        title.innerText = `✅ STAGE ${currentStage} CLEAR — CLAIM REWARD!`;
        desc.innerText = `Return to ${cfg.npcName} and press [E] or TALK to claim +${cfg.rewardCoins} Coins, +${cfg.rewardXp} XP & unlock Stage ${Math.min(100, currentStage + 1)}!`;
    }
}

function interactNPC() {
    if (activeDialogue) {
        acceptDialogue();
        return;
    }
    if (activeMode !== "STORY") return;
    const npcX = 220, npcY = 115;
    if (Math.hypot(player.x - npcX, player.y - npcY) < 80) {
        openStageDialogue();
    } else {
        showToast("Walk closer to the Stage NPC (Gold exclamation mark) to talk!");
    }
}

function openStageDialogue() {
    const modal = document.getElementById('dialogue-modal');
    const speaker = document.getElementById('dialogue-speaker');
    const text = document.getElementById('dialogue-text');
    const rewardBanner = document.getElementById('dialogue-reward');
    const btn = document.getElementById('btn-dialogue-next');
    const cfg = getStageConfig(currentStage);

    speaker.innerText = cfg.npcName;
    rewardBanner.classList.add('hidden');

    if (questState === "AVAILABLE") {
        text.innerText = `Welcome to Stage ${currentStage} (${cfg.biome.name})! Clear out ${cfg.reqKills} ${cfg.targetName} in this sector, then report back to me for your bounty and Stage ${Math.min(100, currentStage + 1)} clearance!`;
        rewardBanner.innerText = `Reward: +${cfg.rewardCoins} Coins, +${cfg.rewardXp} XP, +${cfg.rewardGems} Gems ${cfg.isBossStage ? "& +1 Race/Class Spin!" : ""}`;
        rewardBanner.classList.remove('hidden');
        btn.innerText = "Accept Mission [E]";
        activeDialogue = () => {
            questState = "ACTIVE";
            questKills = 0;
            if (cfg.isBossStage && !enemies.some(e => e.isBoss)) {
                spawnStageMob(cfg, 660, 250, true);
            }
            updateQuestTracker();
            showToast(`Stage ${currentStage} Mission Started!`);
        };
    } else if (questState === "ACTIVE") {
        text.innerText = `Keep fighting! You have defeated ${questKills} / ${cfg.reqKills} targets on Stage ${currentStage}. Return to me as soon as the objective is complete!`;
        btn.innerText = "Back to Combat [E]";
        activeDialogue = () => {};
    } else if (questState === "READY_TO_CLAIM") {
        text.innerText = `Phenomenal victory! Stage ${currentStage} is secure. Here is your reward, and I have unlocked the eastern portal to Stage ${Math.min(100, currentStage + 1)}!`;
        rewardBanner.innerText = `🎁 CLAIMED: +${cfg.rewardCoins} Coins, +${cfg.rewardXp} XP, +${cfg.rewardGems} Gems ${cfg.isBossStage ? "& +1 Class/Race Spin!" : ""}`;
        rewardBanner.classList.remove('hidden');
        btn.innerText = "Claim Bounty & Unlock Next Stage [E]";
        activeDialogue = () => {
            player.coins += cfg.rewardCoins;
            player.gems += cfg.rewardGems;
            if (cfg.isBossStage) {
                player.raceSpins++;
                player.classSpins++;
            }
            player.hp = player.maxHp;
            player.score += currentStage * 100;
            if (currentStage < 100 && maxUnlockedStage <= currentStage) {
                maxUnlockedStage = currentStage + 1;
            }
            gainXp(cfg.rewardXp);
            updateLeaderboardStorage();

            questState = "AVAILABLE";
            questKills = 0;
            updateQuestTracker();
            updateHUD();
            showToast(`Stage ${maxUnlockedStage} Unlocked! Walk into the right Portal or click Next Stage ▶!`);
        };
    }

    modal.style.display = 'block';
}

function acceptDialogue() {
    if (activeDialogue) activeDialogue();
    activeDialogue = null;
    document.getElementById('dialogue-modal').style.display = 'none';
}

// ================= RACE & CLASS GACHA SPINNERS =================
function pickWeightedItem(table) {
    const total = table.reduce((acc, item) => acc + item.chance, 0);
    let rand = Math.random() * total;
    for (const item of table) {
        if (rand < item.chance) return item;
        rand -= item.chance;
    }
    return table[0];
}

function triggerRaceSpin() {
    if (isSpinning) return;
    if (player.raceSpins <= 0) {
        if (player.gems >= 50) {
            player.gems -= 50;
        } else {
            showToast("Need 1 Race Spin (or 50 Gems)! Level up or beat Boss Stages.");
            return;
        }
    } else {
        player.raceSpins--;
    }
    updateHUD();
    document.getElementById('modal-race-spins').innerText = player.raceSpins;
    isSpinning = true;

    const finalRace = pickWeightedRaceWithLuck();
    let ticks = 0;
    const interval = setInterval(() => {
        const preview = RACES[Math.floor(Math.random() * RACES.length)];
        updateRaceModalText(preview);
        ticks++;
        if (ticks >= 20) {
            clearInterval(interval);
            player.race = finalRace;
            applyStats();
            saveProgress();
            updateRaceModalText(finalRace);
            isSpinning = false;
            showToast(`Awakened Race: ${finalRace.name} [${finalRace.rarity}]!`);
        }
    }, 80);
}

function pickWeightedRaceWithLuck() {
    return pickWeightedItem(RACES);
}

function updateRaceModalText(r) {
    const el = document.getElementById('spin-race-name');
    el.innerText = `${r.name} (${r.rarity})`;
    el.className = `rarity-${r.rarity}`;
    document.getElementById('spin-race-buffs').innerText = `HP: ${r.hpMult}x | DMG: ${r.dmgMult}x | SPD: ${r.spdMult}x | Shots: ${r.multiShot}x`;
}

function triggerClassSpin() {
    if (isSpinning) return;
    if (player.classSpins <= 0) {
        if (player.gems >= 50) {
            player.gems -= 50;
        } else {
            showToast("Need 1 Class Spin (or 50 Gems)! Clear Boss Stages or Level Up.");
            return;
        }
    } else {
        player.classSpins--;
    }
    updateHUD();
    document.getElementById('modal-class-spins').innerText = player.classSpins;
    isSpinning = true;

    const finalClass = pickWeightedItem(CLASSES);
    let ticks = 0;
    const interval = setInterval(() => {
        const preview = CLASSES[Math.floor(Math.random() * CLASSES.length)];
        updateClassModalText(preview);
        ticks++;
        if (ticks >= 20) {
            clearInterval(interval);
            player.heroClass = finalClass;
            applyStats();
            saveProgress();
            updateClassModalText(finalClass);
            isSpinning = false;
            showToast(`Awakened Class: ${finalClass.name} [${finalClass.rarity}]!`);
        }
    }, 80);
}

function updateClassModalText(c) {
    const el = document.getElementById('spin-class-name');
    el.innerText = `${c.name} (${c.rarity})`;
    el.className = `rarity-${c.rarity}`;
    document.getElementById('spin-class-buffs').innerText = `DMG: ${c.dmgMult}x | HP Bonus: +${c.hpAdd} | Extra Bullets: +${c.extraShots}`;
}

// ================= COMBAT, LOOT DROPS & BOSS 10% MOTION =================
function performAttack() {
    if (player.attackCooldown > 0 || activeDialogue || isModalOpen()) return;

    const c = player.heroClass;
    const wpn = getEquippedWeapon();
    const modRate = player.weaponMod === "Rapid" ? 0.75 : 1.0;
    player.attackCooldown = Math.max(4, Math.round(wpn.cd * c.fireRateMult * modRate));

    if (player.attackStyle === "gun") {
        const totalShots = (player.race.multiShot || 1) + (c.extraShots || 0);
        const spread = 0.13;
        for (let i = 0; i < totalShots; i++) {
            const angle = player.facingAngle + (i - (totalShots - 1) / 2) * spread;
            const speed = 10.5 * (player.race.bulletMult || 1.0);
            const bx = player.x + Math.cos(angle) * 22;
            const by = player.y + Math.sin(angle) * 22;
            const bvx = Math.cos(angle) * speed;
            const bvy = Math.sin(angle) * speed;

            bullets.push({
                x: bx, y: by,
                vx: bvx, vy: bvy,
                dmg: player.dmg,
                color: player.weaponColor,
                fromAlly: true,
                radius: 5
            });

            if (conn && conn.open) {
                conn.send({ type: "SHOOT", x: bx, y: by, vx: bvx, vy: bvy, dmg: player.dmg });
            }
        }
    } else {
        player.attackVisualTimer = 10;
        screenShake = 4;
        if (remotePlayer.connected && Math.hypot(remotePlayer.x - player.x, remotePlayer.y - player.y) <= player.attackRange + remotePlayer.radius) {
            if (conn && conn.open) conn.send({ type: "HIT_ME", dmg: player.dmg });
        }
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            if (Math.hypot(e.x - player.x, e.y - player.y) <= player.attackRange + e.radius) {
                applyDamageToEnemy(e, i, Math.round(player.dmg * 1.25));
            }
        }
    }
}

function applyDamageToEnemy(e, index, dmgAmount) {
    const isCrit = Math.random() < 0.2;
    const finalDmg = isCrit ? Math.round(dmgAmount * 1.5) : dmgAmount;
    e.hp -= finalDmg;
    if (isCrit) screenShake = 5;

    const steal = (player.race.lifesteal || 0) + (player.weaponMod === "Crimson" ? 0.08 : 0);
    if (steal > 0) {
        player.hp = Math.min(player.maxHp, player.hp + Math.round(finalDmg * steal));
    }

    for (let p = 0; p < 6; p++) {
        particles.push({
            x: e.x, y: e.y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            color: isCrit ? "#ffd700" : player.weaponColor,
            life: 18
        });
    }

    floatingTexts.push({
        x: e.x, y: e.y - 18,
        text: isCrit ? `CRIT -${finalDmg}!` : `-${finalDmg}`,
        color: isCrit ? "#ffd700" : "#ff5555",
        timer: 35
    });

    if (e.hp <= 0) handleEnemyDeath(e, index);
}

function handleEnemyDeath(e, index) {
    enemies.splice(index, 1);
    player.score += e.isBoss ? 500 : 100;
    gainXp(e.isBoss ? 80 + currentStage * 10 : 22 + currentStage * 4);

    // Spawn Physical Collectible Loot Drop on the Ground!
    lootDrops.push({
        x: e.x, y: e.y,
        type: e.isBoss ? "CHEST" : (Math.random() < 0.35 ? "GEM" : "COIN"),
        amount: e.isArena ? e.coinReward : (10 + currentStage * 3),
        timer: 600
    });

    if (e.isArena) {
        player.coins += e.coinReward;
        floatingTexts.push({ x: e.x, y: e.y - 30, text: `+${e.coinReward} COINS!`, color: "#2ecc71", timer: 55 });
        saveProgress();
        updateHUD();
        return;
    }

    // Quest Progress Check
    const cfg = getStageConfig(currentStage);
    if (questState === "ACTIVE") {
        questKills++;
        if (questKills >= cfg.reqKills) {
            questState = "READY_TO_CLAIM";
            showToast(`Stage ${currentStage} Objective Complete! Return to ${cfg.npcName} [E] for your reward!`);
        }
        updateQuestTracker();
    }

    // Spin Drop Roll
    if (Math.random() <= e.dropChance) {
        if (Math.random() < 0.5) {
            player.raceSpins++;
            floatingTexts.push({ x: e.x, y: e.y - 32, text: "+1 RACE SPIN!", color: "#f1c40f", timer: 70 });
        } else {
            player.classSpins++;
            floatingTexts.push({ x: e.x, y: e.y - 32, text: "+1 CLASS SPIN!", color: "#00d2ff", timer: 70 });
        }
    }

    // Strict 10% Boss Drop for Shadow Core Motion & Boss Core
    if (e.isBoss && Math.random() < 0.10) {
        player.bossCores++;
        player.unlockedBossMotion = true;
        player.bossMotionActive = true;
        applyStats();
        floatingTexts.push({ x: e.x, y: e.y - 52, text: "10% JACKPOT: BOSS CORE & MOTION!", color: "#e056fd", timer: 95 });
        showToast("10% JACKPOT! Unlocked Shadow Core Motion [M] & +1 Boss Core!");
    }

    if (!e.isBoss && activeMode === "STORY") {
        const savedStage = currentStage;
        setTimeout(() => {
            if (activeMode === "STORY" && currentStage === savedStage && enemies.filter(en => !en.isBoss).length < 4) {
                spawnStageMob(getStageConfig(savedStage), 420 + Math.random() * 320, 100 + Math.random() * 280, false);
            }
        }, 3200);
    }

    saveProgress();
    updateHUD();
}

// ================= LIVE INTERNET MULTIPLAYER (PEERJS) =================
let peer = null;
let conn = null;
const remotePlayer = {
    connected: false,
    username: "Rival",
    x: 700, y: 250, radius: 18,
    hp: 150, maxHp: 150,
    aimAngle: 0, walkAnim: 0,
    color: "#ff5555", aura: null,
    attackStyle: "gun", wpnColor: "#ff5555", bossMotion: false
};

function initOnlineMultiplayer(cleanUsername) {
    if (typeof Peer === "undefined") return;
    const roomCode = "stickforce100-" + cleanUsername.toLowerCase().replace(/[^a-z0-9]/g, "");
    document.getElementById('my-room-code').innerText = cleanUsername;

    try {
        peer = new Peer(roomCode);
        peer.on('open', () => {
            document.getElementById('online-status').innerText = `Online! Share Room Code: ${cleanUsername}`;
        });
        peer.on('connection', incoming => {
            conn = incoming;
            setupConnectionHandlers();
        });
    } catch (e) {}
}

function connectToFriend() {
    const rawCode = document.getElementById('friend-code-input').value.trim();
    if (!rawCode || !peer) return;
    const targetId = "stickforce100-" + rawCode.toLowerCase().replace(/[^a-z0-9\-]/g, "");
    conn = peer.connect(targetId);
    setupConnectionHandlers();
}

function setupConnectionHandlers() {
    if (!conn) return;
    conn.on('open', () => {
        remotePlayer.connected = true;
        document.getElementById('ui-peer-status').innerText = "Connected Live!";
        showToast("Friend Connected Live over the Internet!");
    });
    conn.on('data', data => {
        if (data.type === "STATE") {
            Object.assign(remotePlayer, data);
        } else if (data.type === "SHOOT") {
            bullets.push({ x: data.x, y: data.y, vx: data.vx, vy: data.vy, dmg: data.dmg, color: "#ff5555", fromAlly: false, radius: 5 });
        } else if (data.type === "HIT_ME") {
            player.hp -= data.dmg;
            updateHUD();
            if (player.hp <= 0) {
                if (conn && conn.open) conn.send({ type: "ROUND_WON" });
                player.hp = player.maxHp;
                player.x = 700;
            }
        } else if (data.type === "ROUND_WON") {
            allyRoundWins++;
            player.coins += 35;
            document.getElementById('score-ally').innerText = allyRoundWins;
            showToast(`Round Won vs ${remotePlayer.username}! (+35 Coins)`);
            saveProgress();
            updateHUD();
        }
    });
}

// ================= LOGIN & INITIALIZATION =================
function claimUniqueName() {
    const inputEl = document.getElementById('username-input');
    const cleanName = (inputEl ? inputEl.value : "").trim();
    if (cleanName.length < 3) {
        document.getElementById('login-error').innerText = "Hero Name must be at least 3 characters!";
        return;
    }
    player.username = cleanName;
    document.getElementById('login-modal').style.display = 'none';
    saveProgress();
    updateLeaderboardStorage();
    initOnlineMultiplayer(cleanName);
    loadStage(currentStage);
    showToast(`Welcome back forever, ${cleanName}! Your progress auto-saves.`);
}

// ================= BUTTON & INPUT LISTENERS =================
document.getElementById('claim-btn').addEventListener('click', claimUniqueName);
document.getElementById('btn-prev-stage').addEventListener('click', () => {
    if (currentStage > 1) {
        activeMode = "STORY";
        loadStage(currentStage - 1);
    }
});
document.getElementById('btn-next-stage').addEventListener('click', () => {
    if (currentStage < maxUnlockedStage) {
        activeMode = "STORY";
        loadStage(currentStage + 1);
    } else {
        showToast(`Complete & Claim Stage ${currentStage}'s NPC Quest to unlock Stage ${currentStage + 1}!`);
    }
});

document.getElementById('btn-story').addEventListener('click', () => {
    closeAllModals();
    activeMode = "STORY";
    document.getElementById('quest-tracker').classList.remove('hidden');
    document.getElementById('series-banner').classList.add('hidden');
    loadStage(currentStage);
});

document.getElementById('btn-race-spin').addEventListener('click', () => {
    closeAllModals();
    document.getElementById('modal-race-spins').innerText = player.raceSpins;
    updateRaceModalText(player.race);
    document.getElementById('reroll-modal').style.display = 'flex';
});

document.getElementById('btn-class-spin').addEventListener('click', () => {
    closeAllModals();
    document.getElementById('modal-class-spins').innerText = player.classSpins;
    updateClassModalText(player.heroClass);
    document.getElementById('class-modal').style.display = 'flex';
});

document.getElementById('btn-forge').addEventListener('click', () => {
    closeAllModals();
    renderForgeInventory();
    document.getElementById('forge-modal').style.display = 'flex';
});

document.getElementById('btn-arena').addEventListener('click', () => {
    closeAllModals();
    document.getElementById('arena-modal').style.display = 'flex';
});

document.getElementById('btn-online').addEventListener('click', () => {
    closeAllModals();
    document.getElementById('online-modal').style.display = 'flex';
});

document.getElementById('btn-mode').addEventListener('click', toggleAttackStyle);
document.getElementById('btn-dialogue-next').addEventListener('click', acceptDialogue);
document.getElementById('spin-race-btn').addEventListener('click', triggerRaceSpin);
document.getElementById('spin-class-btn').addEventListener('click', triggerClassSpin);
document.getElementById('btn-connect-friend').addEventListener('click', connectToFriend);
document.getElementById('btn-start-online-duel').addEventListener('click', () => {
    closeAllModals();
    activeMode = "ONLINE_PVP";
    enemies = [];
    document.getElementById('quest-tracker').classList.add('hidden');
    document.getElementById('series-banner').classList.remove('hidden');
    updateHUD();
});

document.querySelectorAll('.close-modal-btn').forEach(b => b.addEventListener('click', closeAllModals));
document.querySelectorAll('.start-arena-btn').forEach(b => {
    b.addEventListener('click', () => startArenaSeries(parseInt(b.dataset.size, 10)));
});

function closeAllModals() {
    if (isSpinning) return;
    ['reroll-modal', 'class-modal', 'forge-modal', 'arena-modal', 'online-modal'].forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
}

function isModalOpen() {
    return ['login-modal', 'reroll-modal', 'class-modal', 'forge-modal', 'arena-modal', 'online-modal'].some(
        id => document.getElementById(id).style.display === 'flex'
    );
}

function toggleAttackStyle() {
    player.attackStyle = player.attackStyle === "gun" ? "melee" : "gun";
    updateHUD();
    showToast(`Switched to ${player.attackStyle.toUpperCase()} Mode!`);
}

function toggleBossMotion() {
    if (!player.unlockedBossMotion) {
        showToast("10% Boss Motion Locked! Defeat any Boss Stage (Stage 5, 10, 15...) for a 10% Drop!");
        return;
    }
    player.bossMotionActive = !player.bossMotionActive;
    applyStats();
    saveProgress();
    showToast(player.bossMotionActive ? "10% Shadow Core Motion ACTIVATED!" : "Shadow Core Motion OFF.");
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
    player.x = 110; player.y = 250; player.hp = player.maxHp;
    enemies = []; allies = []; bullets = [];
    document.getElementById('score-ally').innerText = allyRoundWins;
    document.getElementById('score-enemy').innerText = enemyRoundWins;
    updateHUD();

    for (let i = 1; i < arenaTeamSize; i++) {
        allies.push({ name: `Ally #${i}`, x: 100, y: 80 + i * 75, radius: 17, hp: 140, maxHp: 140, dmg: 18, spd: 2.3, color: "#00d2ff", shootTimer: 45, walkAnim: 0 });
    }
    for (let i = 0; i < arenaTeamSize; i++) {
        enemies.push({ name: `Rival #${i + 1}`, x: 730, y: 75 + i * 75, radius: 18, hp: 150, maxHp: 150, dmg: 16, spd: 2.3, color: "#e74c3c", isBoss: false, isArena: true, coinReward: 15 + arenaTeamSize * 5, shootTimer: 50, walkAnim: 0 });
    }
}

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
    player.facingAngle = Math.atan2(((e.clientY - rect.top) * (canvas.height / rect.height)) - player.y, ((e.clientX - rect.left) * (canvas.width / rect.width)) - player.x);
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
bindHold('t-up', 'w'); bindHold('t-down', 's'); bindHold('t-left', 'a'); bindHold('t-right', 'd');
document.getElementById('t-atk').addEventListener('touchstart', e => { e.preventDefault(); performAttack(); });
document.getElementById('t-atk').addEventListener('mousedown', () => performAttack());
document.getElementById('t-talk').addEventListener('click', interactNPC);
document.getElementById('t-mode').addEventListener('click', toggleAttackStyle);
document.getElementById('t-motion').addEventListener('click', toggleBossMotion);

function showToast(msg) {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.style.display = 'block';
    clearTimeout(t.timer);
    t.timer = setTimeout(() => t.style.display = 'none', 3200);
}

// ================= MAIN GAME UPDATE LOOP =================
function update() {
    if (activeDialogue || isModalOpen()) return;

    if (screenShake > 0) screenShake *= 0.85;
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
        player.walkAnim += 0.28;
    }

    player.x = Math.max(20, Math.min(canvas.width - 20, player.x));
    player.y = Math.max(25, Math.min(canvas.height - 25, player.y));

    if (player.attackCooldown > 0) player.attackCooldown--;
    if (player.attackVisualTimer > 0) player.attackVisualTimer--;

    // Collect Physical Loot Drops (Coins, Gems, Boss Chests)
    for (let i = lootDrops.length - 1; i >= 0; i--) {
        const ld = lootDrops[i];
        ld.timer--;
        if (Math.hypot(player.x - ld.x, player.y - ld.y) < 34) {
            if (ld.type === "CHEST") {
                player.coins += ld.amount * 2;
                player.gems += 10;
                floatingTexts.push({ x: ld.x, y: ld.y - 20, text: `BOSS CHEST: +${ld.amount * 2} Coins & +10 Gems!`, color: "#ffd700", timer: 55 });
            } else if (ld.type === "GEM") {
                player.gems += 4;
                floatingTexts.push({ x: ld.x, y: ld.y - 20, text: `+4 GEMS!`, color: "#00d2ff", timer: 40 });
            } else {
                player.coins += ld.amount;
                floatingTexts.push({ x: ld.x, y: ld.y - 20, text: `+${ld.amount} Coins`, color: "#2ecc71", timer: 40 });
            }
            saveProgress();
            updateHUD();
            lootDrops.splice(i, 1);
            continue;
        }
        if (ld.timer <= 0) lootDrops.splice(i, 1);
    }

    // Stage Portals (Left = Prev Stage, Right = Next Stage up to 100)
    if (activeMode === "STORY") {
        if (Math.hypot(player.x - 795, player.y - 250) < 34) {
            if (currentStage < maxUnlockedStage) {
                loadStage(currentStage + 1, 80, 250);
                showToast(`Entered Stage ${currentStage}!`);
                return;
            } else {
                floatingTexts.push({ x: 740, y: 210, text: "Claim Stage NPC Quest First!", color: "#f39c12", timer: 25 });
                player.x -= 12;
            }
        }
        if (currentStage > 1 && Math.hypot(player.x - 45, player.y - 250) < 34) {
            loadStage(currentStage - 1, 720, 250);
            showToast(`Returned to Stage ${currentStage}`);
            return;
        }
    }

    // Bullets Update
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx; b.y += b.vy;
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
                if (player.hp <= 0) {
                    player.hp = player.maxHp;
                    player.x = 130; player.y = 250;
                    showToast("Respawned at Stage Outpost!");
                }
            }
        }
    }

    // Enemies AI
    for (const e of enemies) {
        const dist = Math.hypot(player.x - e.x, player.y - e.y);
        const angle = Math.atan2(player.y - e.y, player.x - e.x);
        if (dist > (e.isArena ? 130 : 22) && dist < 420) {
            e.x += Math.cos(angle) * e.spd;
            e.y += Math.sin(angle) * e.spd;
            e.walkAnim += 0.22;
        }
        if (e.isBoss || e.isArena || currentStage >= 3) {
            e.shootTimer--;
            if (e.shootTimer <= 0 && dist < 360) {
                e.shootTimer = e.isBoss ? 42 : 70;
                bullets.push({ x: e.x, y: e.y, vx: Math.cos(angle) * 5.8, vy: Math.sin(angle) * 5.8, dmg: Math.round(e.dmg * 0.6), color: "#ff3838", fromAlly: false, radius: e.isBoss ? 7 : 4 });
            }
        }
        if (dist < player.radius + e.radius) {
            player.hp -= e.dmg * 0.03;
            updateHUD();
            if (player.hp <= 0) {
                player.hp = player.maxHp;
                player.x = 130; player.y = 250;
                showToast("Respawned at Stage Outpost!");
            }
        }
    }

    if (activeMode === "ARENA" && enemies.length === 0) {
        allyRoundWins++;
        if (allyRoundWins >= 5) {
            player.coins += 75;
            player.gems += 10;
            saveProgress();
            showToast("VICTORY! Won 5-Round Rivals Series! (+75 Coins & +10 Gems)");
            activeMode = "STORY";
            loadStage(currentStage);
        } else {
            startArenaRound();
        }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].x += particles[i].vx;
        particles[i].y += particles[i].vy;
        particles[i].life--;
        if (particles[i].life <= 0) particles.splice(i, 1);
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        floatingTexts[i].y -= 0.7;
        floatingTexts[i].timer--;
        if (floatingTexts[i].timer <= 0) floatingTexts.splice(i, 1);
    }
}

// ================= REALISTIC 2.5D GRAPHICS & STICKMAN SHADER RENDERER =================
function drawRealisticStickman(x, y, color, aimAngle, walkAnim, scale, aura, hasGun, wpnColor, bossMotion) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // 1. Realistic Soft Ground Drop-Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.ellipse(0, 20, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Dynamic Aura / 10% Boss Overdrive Glow
    if (bossMotion || aura) {
        ctx.save();
        ctx.shadowColor = bossMotion ? "#e056fd" : aura;
        ctx.shadowBlur = 18;
        ctx.strokeStyle = bossMotion ? "#e056fd" : aura;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, -2, 24 + Math.sin(Date.now() * 0.012) * 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    // 3. Stickman Limbs with Metallic Shading
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.6;
    ctx.lineCap = "round";

    const swing = Math.sin(walkAnim) * 7.5;
    // Legs
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.lineTo(-6 + swing, 19);
    ctx.moveTo(0, 6);
    ctx.lineTo(6 - swing, 19);
    ctx.stroke();

    // Torso
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(0, 6);
    ctx.stroke();

    // 3D Shaded Head
    const headGrad = ctx.createRadialGradient(-2, -18, 1, 0, -16, 8);
    headGrad.addColorStop(0, "#ffffff");
    headGrad.addColorStop(0.35, color);
    headGrad.addColorStop(1, "#0a0a0f");
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.arc(0, -16, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Aiming Arm & Realistic Weapon
    const cos = Math.cos(aimAngle);
    const sin = Math.sin(aimAngle);
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(cos * 11, -5 + sin * 11);
    ctx.stroke();

    ctx.save();
    ctx.shadowColor = wpnColor;
    ctx.shadowBlur = 10;
    if (hasGun) {
        ctx.strokeStyle = "#dfe6e9";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(cos * 8, -5 + sin * 8);
        ctx.lineTo(cos * 22, -5 + sin * 22);
        ctx.stroke();
        // Glowing Energy Barrel
        ctx.strokeStyle = wpnColor;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(cos * 10, -5 + sin * 10);
        ctx.lineTo(cos * 23, -5 + sin * 23);
        ctx.stroke();
    } else {
        ctx.strokeStyle = wpnColor;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(cos * 10, -5 + sin * 10);
        ctx.lineTo(cos * 26, -5 + sin * 26 - 9);
        ctx.stroke();
    }
    ctx.restore();

    ctx.restore();
}

function draw() {
    ctx.save();
    if (screenShake > 0.5) {
        ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
    }

    const cfg = getStageConfig(currentStage);
    // 1. Realistic Gradient Biome Lighting
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, cfg.biome.bgTop);
    bgGrad.addColorStop(1, cfg.biome.bgBot);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Perspective Tactical Grid
    ctx.strokeStyle = cfg.biome.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // 3. Biome 2.5D Environment Pillars / Trees with Shadows
    for (const p of stageProps) {
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + p.size * 0.8, p.size * 0.9, p.size * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.stroke();
    }

    // 4. Portals & Stage NPC
    if (activeMode === "STORY") {
        // Next Stage Portal (Right)
        const nextUnlocked = currentStage < maxUnlockedStage;
        ctx.save();
        ctx.shadowColor = nextUnlocked ? "#00d2ff" : "#e74c3c";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(795, 250, 26, 0, Math.PI * 2);
        ctx.fillStyle = nextUnlocked ? "rgba(0, 210, 255, 0.35)" : "rgba(231, 76, 60, 0.25)";
        ctx.fill();
        ctx.strokeStyle = nextUnlocked ? "#00d2ff" : "#e74c3c";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 11.5px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`Stage ${Math.min(100, currentStage + 1)} ->`, 795, 214);

        // Prev Stage Portal (Left)
        if (currentStage > 1) {
            ctx.beginPath();
            ctx.arc(45, 250, 24, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(0, 210, 255, 0.3)";
            ctx.fill();
            ctx.strokeStyle = "#00d2ff";
            ctx.stroke();
            ctx.fillText(`<- St.${currentStage - 1}`, 45, 216);
        }

        // Stage Quest NPC
        const npcX = 220, npcY = 115;
        drawRealisticStickman(npcX, npcY, "#f1c40f", 0, 0, 1.08, "#f39c12", false, "#ffd700", false);
        ctx.fillStyle = questState === "READY_TO_CLAIM" ? "#2ecc71" : "#ffd700";
        ctx.font = "bold 18px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(questState === "READY_TO_CLAIM" ? "🎁 CLAIM!" : (questState === "ACTIVE" ? "..." : "! QUEST"), npcX, npcY - 34);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText(cfg.npcName, npcX, npcY + 34);
    }

    // 5. Collectible Loot Drops (Coins, Gems, Chests)
    for (const ld of lootDrops) {
        ctx.save();
        ctx.shadowColor = ld.type === "CHEST" ? "#ffd700" : (ld.type === "GEM" ? "#00d2ff" : "#2ecc71");
        ctx.shadowBlur = 10;
        ctx.fillStyle = ctx.shadowColor;
        ctx.beginPath();
        ctx.arc(ld.x, ld.y, ld.type === "CHEST" ? 10 : 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // 6. Enemies & Bosses
    for (const e of enemies) {
        const angle = Math.atan2(player.y - e.y, player.x - e.x);
        const scale = e.isBoss ? 1.6 : 1.0;
        drawRealisticStickman(e.x, e.y, e.color, angle, e.walkAnim, scale, e.isBoss ? "#ff3838" : null, true, "#ff3838", false);

        ctx.fillStyle = "#fff";
        ctx.font = e.isBoss ? "bold 13px sans-serif" : "11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(e.name, e.x, e.y - e.radius - 20);

        const barW = e.isBoss ? 95 : 50;
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(e.x - barW / 2, e.y - e.radius - 14, barW, 6);
        ctx.fillStyle = "#e74c3c";
        ctx.fillRect(e.x - barW / 2, e.y - e.radius - 14, barW * Math.max(0, e.hp / e.maxHp), 6);
    }

    // 7. Player Melee Slash Shader
    if (player.attackVisualTimer > 0) {
        ctx.save();
        ctx.shadowColor = player.weaponColor;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.attackRange, player.facingAngle - 0.85, player.facingAngle + 0.85);
        ctx.strokeStyle = player.weaponColor;
        ctx.lineWidth = 7;
        ctx.stroke();
        ctx.restore();
    }

    // 8. Player Stickman
    drawRealisticStickman(
        player.x, player.y,
        player.race.color,
        player.facingAngle,
        player.walkAnim,
        1.08,
        player.race.aura,
        player.attackStyle === "gun",
        player.weaponColor,
        player.bossMotionActive
    );

    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`Lv.${player.level} ${player.username} [${player.heroClass.name}]`, player.x, player.y - 30);

    // 9. Glowing Bullets & Particles
    for (const b of bullets) {
        ctx.save();
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    for (const pt of particles) {
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x, pt.y, 4, 4);
    }

    for (const ft of floatingTexts) {
        ctx.fillStyle = ft.color;
        ctx.font = "bold 13px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(ft.text, ft.x, ft.y);
    }

    ctx.restore();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// ================= STARTUP AUTO-LOGIN CHECK =================
const hadSave = loadSavedProgress();
applyStats();
renderLeaderboard(getLeaderboardData());

if (hadSave) {
    // Auto-Login! Never asks to log in again on reload!
    document.getElementById('login-modal').style.display = 'none';
    initOnlineMultiplayer(player.username);
    loadStage(currentStage);
    showToast(`Auto-Logged In as ${player.username} (Stage ${currentStage} / 100)!`);
} else {
    document.getElementById('login-modal').style.display = 'flex';
    loadStage(1);
}

gameLoop();
