const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// UI Elements
const loginModal = document.getElementById("loginModal");
const usernameInput = document.getElementById("usernameInput");
const loginError = document.getElementById("loginError");
const claimBtn = document.getElementById("claimBtn");

const playerBadge = document.getElementById("playerBadge");
const classBadge = document.getElementById("classBadge");
const modeDisplay = document.getElementById("modeDisplay");
const allyRoundScoreEl = document.getElementById("allyRoundScore");
const enemyRoundScoreEl = document.getElementById("enemyRoundScore");

const hpBar = document.getElementById("hpBar");
const manaBar = document.getElementById("manaBar");
const coinText = document.getElementById("coinText");
const coreText = document.getElementById("coreText");
const motionStatus = document.getElementById("motionStatus");
const leaderboardList = document.getElementById("leaderboardList");

const equippedWpnName = document.getElementById("equippedWpnName");
const equippedWpnType = document.getElementById("equippedWpnType");
const equippedWpnDmg = document.getElementById("equippedWpnDmg");

// Modals
const dialogueModal = document.getElementById("dialogueModal");
const speakerName = document.getElementById("speakerName");
const dialogueText = document.getElementById("dialogueText");
const nextDialogueBtn = document.getElementById("nextDialogueBtn");

const rivalsModal = document.getElementById("rivalsModal");
const forgeModal = document.getElementById("forgeModal");
const classModal = document.getElementById("classModal");
const endModal = document.getElementById("endModal");
const endTitle = document.getElementById("endTitle");
const endDesc = document.getElementById("endDesc");
const forgeStatusMsg = document.getElementById("forgeStatusMsg");

// Class Definitions (Strictly Combat & Forging — No Mining)
const HERO_CLASSES = {
    "Vanguard": { hpBonus: 40, speedMult: 1.0, forgeMult: 1.0, manaRegen: 0.2 },
    "Shadow Assassin": { hpBonus: 0, speedMult: 1.35, forgeMult: 1.0, manaRegen: 0.25 },
    "Master Forger": { hpBonus: 20, speedMult: 1.0, forgeMult: 1.25, manaRegen: 0.2 },
    "Arcane Gunner": { hpBonus: 0, speedMult: 1.1, forgeMult: 1.1, manaRegen: 0.45 }
};

// Story Chapters (Chapter 3 Boss has 10% Drop Chance for Shadow Core Motion & Boss Core)
const CHAPTERS = [
    {
        title: "Story Ch.1: Whispering Woods",
        bgSky: "#0b1528", bgGround: "#152a20",
        enemiesToSpawn: 5, boss: false,
        dialogues: [
            { speaker: "Elder Stick", text: "Welcome! Remember: Coins are ONLY earned by defeating Rivals in Arena Matches (1v1 to 5v5)." },
            { speaker: "Master Forger", text: "And if you defeat Lord Malakor in Chapter 3, you have a 10% chance to unlock the rare Shadow Core Motion and Boss Cores to forge Guns!" }
        ]
    },
    {
        title: "Story Ch.2: Crimson Citadel Approach",
        bgSky: "#240d14", bgGround: "#2e161d",
        enemiesToSpawn: 7, boss: false,
        dialogues: [
            { speaker: "Hero", text: "The Citadel gates are ahead. Time to test my class skills!" }
        ]
    },
    {
        title: "Story Ch.3: Boss Lair (10% Motion & Core Drop)",
        bgSky: "#120924", bgGround: "#1d1138",
        enemiesToSpawn: 3, boss: true,
        dialogues: [
            { speaker: "Lord Malakor (Boss)", text: "You want my Shadow Core Motion and Gun Cores? Only a 10% fate can tear them from me!" }
        ]
    }
];

// Global Game State
let currentUser = null;
let gameMode = "STORY"; // "STORY" or "RIVALS"
let gameState = "LOGIN"; // LOGIN, DIALOGUE, PLAY, MODAL, END
let currentChapter = 0;
let dialogueQueue = [];
let keys = {};
let bannerAlert = { text: "", timer: 0, color: "#3fb950" };

// Rivals 5-Match Series State
let rivalsTeamSize = 1; // 1v1, 2v2, 3v3, 4v4, 5v5
let allyRoundsWon = 0;
let enemyRoundsWon = 0;

// Player State
const player = {
    x: 120, y: 330, vx: 0, vy: 0,
    dir: 1,
    heroClass: "Vanguard",
    hp: 140, maxHp: 140,
    mana: 100, maxMana: 100,
    coins: 0,          // Earned ONLY in Rivals Arena kills
    bossCores: 0,      // 10% Drop from Story Boss
    unlockedBossMotion: false, // 10% Drop from Story Boss
    bossMotionActive: false,   // Toggled with [M]
    score: 0,
    weapon: {
        name: "Starter Blade",
        type: "melee", // "melee" or "gun"
        baseDmg: 25,
        color: "#58a6ff",
        mod: "Balanced"
    },
    attackTimer: 0,
    dashTimer: 0,
    animFrame: 0
};

let allies = [];
let enemies = [];
let projectiles = [];
let particles = [];
let enemiesRemainingToSpawn = 0;
let spawnCooldown = 0;

// ==========================================
// 1. UNIQUE ONE-TIME USERNAME REGISTRY
// ==========================================
async function fetchLeaderboard() {
    try {
        const res = await fetch("/api/leaderboard");
        if (res.ok) {
            const data = await res.json();
            renderLeaderboard(data.players);
            return;
        }
    } catch (e) {}
    const localData = JSON.parse(localStorage.getItem("stickman_unique_players") || "[]");
    renderLeaderboard(localData);
}

function renderLeaderboard(players) {
    leaderboardList.innerHTML = "";
    if (!players || players.length === 0) {
        leaderboardList.innerHTML = "<li>No heroes registered yet...</li>";
        return;
    }
    players.sort((a, b) => b.score - a.score).slice(0, 12).forEach((p, idx) => {
        const li = document.createElement("li");
        li.innerHTML = `<span>#${idx + 1} <b>${p.username}</b></span> <span>${p.score} pts</span>`;
        leaderboardList.appendChild(li);
    });
}

async function claimUniqueUsername(name) {
    const cleanName = name.trim();
    if (cleanName.length < 3) {
        loginError.textContent = "Hero Name must be at least 3 characters!";
        return false;
    }
    try {
        const res = await fetch("/api/claim", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: cleanName })
        });
        const data = await res.json();
        if (!res.ok) {
            loginError.textContent = data.error || "Username already claimed!";
            return false;
        }
        renderLeaderboard(data.players);
        return true;
    } catch (e) {
        const existing = JSON.parse(localStorage.getItem("stickman_unique_players") || "[]");
        if (existing.some(p => p.username.toLowerCase() === cleanName.toLowerCase())) {
            loginError.textContent = "That Hero Name is already claimed forever! Pick another.";
            return false;
        }
        existing.push({ username: cleanName, score: 0 });
        localStorage.setItem("stickman_unique_players", JSON.stringify(existing));
        renderLeaderboard(existing);
        return true;
    }
}

async function syncScore() {
    if (!currentUser) return;
    try {
        const res = await fetch("/api/score", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: currentUser, score: player.score })
        });
        if (res.ok) {
            const data = await res.json();
            renderLeaderboard(data.players);
            return;
        }
    } catch (e) {}
    const existing = JSON.parse(localStorage.getItem("stickman_unique_players") || "[]");
    const entry = existing.find(p => p.username === currentUser);
    if (entry && player.score > entry.score) {
        entry.score = player.score;
        localStorage.setItem("stickman_unique_players", JSON.stringify(existing));
    }
    renderLeaderboard(existing);
}

// Initial Class Selection in Login Modal
document.querySelectorAll("#initialClassGrid .class-option").forEach(opt => {
    opt.addEventListener("click", () => {
        document.querySelectorAll("#initialClassGrid .class-option").forEach(o => o.classList.remove("selected"));
        opt.classList.add("selected");
        applyHeroClass(opt.dataset.class);
    });
});

function applyHeroClass(className) {
    player.heroClass = className;
    const cfg = HERO_CLASSES[className];
    player.maxHp = 100 + cfg.hpBonus;
    player.hp = player.maxHp;
    classBadge.textContent = `Class: ${className}`;
    updateHUD();
}

claimBtn.addEventListener("click", async () => {
    const requested = usernameInput.value;
    const ok = await claimUniqueUsername(requested);
    if (ok) {
        currentUser = requested.trim();
        playerBadge.textContent = `Hero: ${currentUser}`;
        loginModal.classList.add("hidden");
        startStoryChapter(0);
    }
});

// ==========================================
// 2. STORY MODE & 10% BOSS DROP MECHANIC
// ==========================================
function startStoryChapter(index) {
    gameMode = "STORY";
    currentChapter = index;
    const chap = CHAPTERS[currentChapter];
    modeDisplay.textContent = chap.title;
    allyRoundScoreEl.textContent = "-";
    enemyRoundScoreEl.textContent = "-";

    resetPlayerPosition();
    allies = [];
    enemies = [];
    projectiles = [];
    enemiesRemainingToSpawn = chap.enemiesToSpawn;
    spawnCooldown = 45;

    dialogueQueue = [...chap.dialogues];
    showNextDialogue();
}

function showNextDialogue() {
    if (dialogueQueue.length === 0) {
        dialogueModal.classList.add("hidden");
        gameState = "PLAY";
        return;
    }
    gameState = "DIALOGUE";
    dialogueModal.classList.remove("hidden");
    const line = dialogueQueue.shift();
    speakerName.textContent = line.speaker;
    dialogueText.textContent = line.text;
}

nextDialogueBtn.addEventListener("click", showNextDialogue);

function rollBossDrop() {
    // Strict 10% Probability (Math.random() < 0.10)
    const roll = Math.random();
    if (roll < 0.10) {
        player.bossCores += 1;
        player.unlockedBossMotion = true;
        player.bossMotionActive = true;
        showBanner("10% JACKPOT! Boss dropped Shadow Core Motion [M] & +1 Boss Core!", "#d2a8ff");
    } else {
        showBanner(`Boss Defeated! (Roll: ${(roll * 100).toFixed(1)}% - Needed <10% for Boss Motion/Core. Replay to farm!)`, "#f0883e");
    }
    updateHUD();
}

// ==========================================
// 3. RIVALS ARENA MODE (1v1, 2v2, 3v3, 4v4, 5v5 - First to 5)
// ==========================================
function startRivalsSeries(teamSize) {
    gameMode = "RIVALS";
    rivalsTeamSize = teamSize;
    allyRoundsWon = 0;
    enemyRoundsWon = 0;
    rivalsModal.classList.add("hidden");
    startRivalsRound();
}

function startRivalsRound() {
    modeDisplay.textContent = `Rivals Arena (${rivalsTeamSize}v${rivalsTeamSize}) - First to 5`;
    allyRoundScoreEl.textContent = allyRoundsWon;
    enemyRoundScoreEl.textContent = enemyRoundsWon;

    resetPlayerPosition();
    allies = [];
    enemies = [];
    projectiles = [];
    enemiesRemainingToSpawn = 0;

    // Spawn AI Teammates (teamSize - 1)
    for (let i = 1; i < rivalsTeamSize; i++) {
        allies.push({
            x: 70 + i * 35,
            y: 330,
            dir: 1,
            hp: 110, maxHp: 110,
            dmg: 14,
            speed: 2.3 + Math.random() * 0.5,
            attackCooldown: 0,
            anim: 0,
            name: `Ally #${i}`
        });
    }

    // Spawn Rival Team (teamSize)
    for (let i = 0; i < rivalsTeamSize; i++) {
        enemies.push({
            x: 820 - i * 38,
            y: 330,
            dir: -1,
            hp: 115, maxHp: 115,
            dmg: 13,
            speed: 2.2 + Math.random() * 0.6,
            isBoss: false,
            isRival: true,
            coinReward: 10 + rivalsTeamSize * 5, // Coins ONLY from Rivals!
            attackCooldown: 0,
            anim: 0,
            name: `Rival #${i + 1}`
        });
    }

    gameState = "PLAY";
    showBanner(`Round Start! (${allyRoundsWon} - ${enemyRoundsWon}) Defeat Rivals for Forge Coins!`, "#58a6ff");
}

function resetPlayerPosition() {
    player.x = 110;
    player.y = 330;
    player.vx = 0;
    player.vy = 0;
    player.hp = player.maxHp;
    player.mana = player.maxMana;
}

function showBanner(text, color = "#3fb950") {
    bannerAlert = { text, timer: 210, color };
}

// ==========================================
// 4. THE FORGE & WEAPON/GUN CUSTOMIZER
// ==========================================
function getEffectiveDamage() {
    const classCfg = HERO_CLASSES[player.heroClass];
    let dmg = player.weapon.baseDmg * classCfg.forgeMult;
    if (player.weapon.mod === "Balanced") dmg += 5;
    if (player.weapon.mod === "Overclocked") dmg += 12;
    if (player.weapon.mod === "Vampiric") dmg += 8;
    if (player.bossMotionActive) dmg *= 1.35; // 10% Boss Motion Boost
    return Math.round(dmg);
}

document.querySelectorAll(".craft-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const wpnName = btn.dataset.wpn;
        const wpnType = btn.dataset.type;
        const baseDmg = parseInt(btn.dataset.dmg, 10);
        const coinCost = parseInt(btn.dataset.coins, 10);
        const coreCost = parseInt(btn.dataset.cores, 10);

        if (player.coins < coinCost) {
            forgeStatusMsg.style.color = "#f85149";
            forgeStatusMsg.textContent = `Not enough Arena Coins! Need ${coinCost} Coins (Earn in Rivals 1v1-5v5).`;
            return;
        }
        if (player.bossCores < coreCost) {
            forgeStatusMsg.style.color = "#f85149";
            forgeStatusMsg.textContent = `Need ${coreCost} Boss Core(s)! Defeat Chapter 3 Boss (10% Drop) to craft Guns.`;
            return;
        }

        player.coins -= coinCost;
        player.bossCores -= coreCost;

        const chosenColor = document.getElementById("weaponColorPicker").value;
        const chosenMod = document.getElementById("weaponModSelect").value;

        player.weapon = {
            name: `${chosenMod} ${wpnName}`,
            type: wpnType,
            baseDmg: baseDmg,
            color: chosenColor,
            mod: chosenMod
        };

        forgeStatusMsg.style.color = "#3fb950";
        forgeStatusMsg.textContent = `Forged & Equipped: ${player.weapon.name}!`;
        updateHUD();
    });
});

// ==========================================
// 5. STICKMAN & BOSS MOTION RENDERING
// ==========================================
function drawStickman(x, y, dir, bodyColor, wpnColor, isAttacking, anim, scale, label, hasBossMotion, wpnType) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // 10% Boss Drop "Shadow Core Motion" Floating Aura & Afterimage
    if (hasBossMotion) {
        const hoverOffset = Math.sin(Date.now() * 0.01) * 7;
        ctx.translate(0, hoverOffset - 5);

        ctx.strokeStyle = "rgba(210, 168, 255, 0.45)";
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.arc(0, -35, 32 + Math.sin(Date.now() * 0.02) * 4, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";

    // Head
    ctx.beginPath();
    ctx.arc(0, -50, 11, 0, Math.PI * 2);
    ctx.stroke();

    // Spine
    ctx.beginPath();
    ctx.moveTo(0, -39);
    ctx.lineTo(0, -10);
    ctx.stroke();

    // Legs
    const swing = Math.sin(anim * (hasBossMotion ? 0.45 : 0.25)) * 14;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(-10 + swing, 20);
    ctx.moveTo(0, -10);
    ctx.lineTo(10 - swing, 20);
    ctx.stroke();

    // Arm
    ctx.beginPath();
    ctx.moveTo(0, -30);
    const armX = dir * (isAttacking ? 24 : 15);
    const armY = isAttacking ? -33 : -20;
    ctx.lineTo(armX, armY);
    ctx.stroke();

    // Weapon Drawing (Gun vs Melee Sword/Hammer)
    ctx.strokeStyle = wpnColor;
    if (wpnType === "gun") {
        // Draw Custom Gun Barrel & Grip
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(armX, armY);
        ctx.lineTo(armX + dir * 22, armY);
        ctx.stroke();
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(armX + dir * 4, armY);
        ctx.lineTo(armX, armY + 9);
        ctx.stroke();
    } else {
        // Draw Custom Melee Blade
        ctx.lineWidth = isAttacking ? 6 : 3.5;
        ctx.beginPath();
        ctx.moveTo(armX, armY);
        ctx.lineTo(armX + dir * (isAttacking ? 36 : 19), armY - (isAttacking ? 4 : 24));
        ctx.stroke();
    }

    if (label) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(label, 0, -70);
    }

    ctx.restore();
}

// ==========================================
// 6. COMBAT ACTIONS & CONTROLS
// ==========================================
function performPrimaryAttack() {
    if (player.attackTimer > 0) return;
    const dmg = getEffectiveDamage();

    if (player.weapon.type === "gun") {
        player.attackTimer = player.bossMotionActive ? 10 : 16;
        const speedBonus = player.heroClass === "Arcane Gunner" ? 13 : 10.5;
        projectiles.push({
            x: player.x + player.dir * 28,
            y: player.y - 32,
            vx: player.dir * speedBonus,
            dmg: dmg,
            color: player.weapon.color,
            fromTeam: "ALLY"
        });
        createParticles(player.x + player.dir * 32, player.y - 32, player.weapon.color, 5);
    } else {
        player.attackTimer = player.bossMotionActive ? 11 : 17;
        enemies.forEach(en => {
            const dist = (en.x - player.x) * player.dir;
            if (dist > -15 && dist < 92 && Math.abs(en.y - player.y) < 55) {
                en.hp -= dmg;
                en.x += player.dir * 20;
                if (player.weapon.mod === "Vampiric") {
                    player.hp = Math.min(player.maxHp, player.hp + 5);
                }
                createParticles(en.x, en.y - 30, player.weapon.color, 9);
            }
        });
    }
}

function performSkillAttack() {
    if (player.mana < 30) return;
    player.mana -= 30;
    const dmg = Math.round(getEffectiveDamage() * 1.45);
    projectiles.push({
        x: player.x + player.dir * 24,
        y: player.y - 30,
        vx: player.dir * 9.5,
        dmg: dmg,
        color: "#d2a8ff",
        fromTeam: "ALLY"
    });
}

function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 6.5,
            vy: (Math.random() - 0.5) * 6.5,
            life: 24,
            color
        });
    }
}

window.addEventListener("keydown", e => {
    const k = e.key.toLowerCase();
    keys[k] = true;

    if (gameState === "DIALOGUE" && e.key === "Enter") {
        showNextDialogue();
    } else if (gameState === "PLAY") {
        if (k === "j") performPrimaryAttack();
        if (k === "k") performSkillAttack();
        if (k === "l" && player.dashTimer <= 0) {
            player.dashTimer = 30;
            player.x += player.dir * 95;
            createParticles(player.x, player.y - 25, player.weapon.color, 10);
        }
        if (k === "m") {
            if (player.unlockedBossMotion) {
                player.bossMotionActive = !player.bossMotionActive;
                showBanner(player.bossMotionActive ? "Shadow Core Motion ACTIVATED!" : "Shadow Core Motion Stowed", "#d2a8ff");
                updateHUD();
            } else {
                showBanner("Shadow Core Motion Locked! (10% Drop from Story Chapter 3 Boss)", "#f85149");
            }
        }
    }
});

window.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});

// Toolbar Navigation
document.getElementById("btnStoryMode").addEventListener("click", () => {
    closeAllModals();
    startStoryChapter(currentChapter);
});

document.getElementById("btnRivalsMenu").addEventListener("click", () => {
    closeAllModals();
    gameState = "MODAL";
    rivalsModal.classList.remove("hidden");
});

document.getElementById("btnForgeModal").addEventListener("click", () => {
    closeAllModals();
    gameState = "MODAL";
    forgeStatusMsg.textContent = "";
    forgeModal.classList.remove("hidden");
});

document.getElementById("btnClassModal").addEventListener("click", () => {
    closeAllModals();
    gameState = "MODAL";
    classModal.classList.remove("hidden");
});

document.querySelectorAll(".arena-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const size = parseInt(btn.dataset.size, 10);
        startRivalsSeries(size);
    });
});

document.querySelectorAll(".class-switch-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        applyHeroClass(btn.dataset.class);
        classModal.classList.add("hidden");
        gameState = "PLAY";
        showBanner(`Switched Class to ${btn.dataset.class}!`, "#58a6ff");
    });
});

document.getElementById("closeRivalsBtn").addEventListener("click", () => {
    rivalsModal.classList.add("hidden");
    gameState = "PLAY";
});
document.getElementById("closeForgeBtn").addEventListener("click", () => {
    forgeModal.classList.add("hidden");
    gameState = "PLAY";
});
document.getElementById("closeClassBtn").addEventListener("click", () => {
    classModal.classList.add("hidden");
    gameState = "PLAY";
});

document.getElementById("replayStoryBtn").addEventListener("click", () => {
    endModal.classList.add("hidden");
    startStoryChapter(2); // Jump straight to Chapter 3 Boss to farm 10% drop or replay
});

document.getElementById("openArenaFromEndBtn").addEventListener("click", () => {
    endModal.classList.add("hidden");
    rivalsModal.classList.remove("hidden");
});

function closeAllModals() {
    dialogueModal.classList.add("hidden");
    rivalsModal.classList.add("hidden");
    forgeModal.classList.add("hidden");
    classModal.classList.add("hidden");
    endModal.classList.add("hidden");
}

function updateHUD() {
    hpBar.style.width = `${Math.max(0, (player.hp / player.maxHp) * 100)}%`;
    manaBar.style.width = `${Math.max(0, (player.mana / player.maxMana) * 100)}%`;
    coinText.textContent = player.coins;
    coreText.textContent = player.bossCores;
    motionStatus.innerHTML = `10% Boss Motion: <b>${player.unlockedBossMotion ? (player.bossMotionActive ? "ON [M]" : "READY [M]") : "Locked"}</b>`;

    equippedWpnName.textContent = player.weapon.name;
    equippedWpnType.textContent = player.weapon.type.toUpperCase();
    equippedWpnDmg.textContent = getEffectiveDamage();
}

// ==========================================
// 7. MAIN GAME UPDATE & AI LOOP
// ==========================================
function spawnStoryEnemy(isBoss = false) {
    enemies.push({
        x: 830,
        y: 330,
        dir: -1,
        hp: isBoss ? 360 : 65 + currentChapter * 25,
        maxHp: isBoss ? 360 : 65 + currentChapter * 25,
        dmg: isBoss ? 19 : 9 + currentChapter * 3,
        speed: isBoss ? 1.65 : 2.0 + Math.random() * 0.7,
        isBoss: isBoss,
        isRival: false,
        coinReward: 0, // Story mode enemies do NOT drop Arena Coins
        attackCooldown: 0,
        anim: 0,
        name: isBoss ? "Lord Malakor (10% Drop)" : "Shadow Scout"
    });
}

function updateGame() {
    if (gameState !== "PLAY") return;

    const classCfg = HERO_CLASSES[player.heroClass];
    const moveSpeed = 4.3 * classCfg.speedMult * (player.bossMotionActive ? 1.25 : 1);

    player.vx = 0;
    if (keys["a"] || keys["arrowleft"]) { player.vx = -moveSpeed; player.dir = -1; player.animFrame++; }
    if (keys["d"] || keys["arrowright"]) { player.vx = moveSpeed; player.dir = 1; player.animFrame++; }
    if ((keys["w"] || keys[" "] || keys["arrowup"]) && player.y >= 330) {
        player.vy = -11.5;
    }

    player.x += player.vx;
    player.y += player.vy;
    player.vy += 0.55;
    if (player.y > 330) { player.y = 330; player.vy = 0; }
    player.x = Math.max(25, Math.min(875, player.x));

    if (player.attackTimer > 0) player.attackTimer--;
    if (player.dashTimer > 0) player.dashTimer--;
    if (player.mana < player.maxMana) player.mana = Math.min(player.maxMana, player.mana + classCfg.manaRegen);

    // Story Spawning
    if (gameMode === "STORY" && enemiesRemainingToSpawn > 0) {
        spawnCooldown--;
        if (spawnCooldown <= 0) {
            const chap = CHAPTERS[currentChapter];
            const isBossNow = chap.boss && enemiesRemainingToSpawn === 1;
            spawnStoryEnemy(isBossNow);
            enemiesRemainingToSpawn--;
            spawnCooldown = 90;
        }
    }

    // Projectiles
    projectiles.forEach((p, idx) => {
        p.x += p.vx;
        enemies.forEach(en => {
            if (Math.abs(p.x - en.x) < 26 && Math.abs(p.y - (en.y - 30)) < 42) {
                en.hp -= p.dmg;
                p.hit = true;
                createParticles(en.x, en.y - 30, p.color, 8);
            }
        });
        if (p.x < 0 || p.x > 900 || p.hit) projectiles.splice(idx, 1);
    });

    // Ally AI (for 2v2, 3v3, 4v4, 5v5)
    allies.forEach((al, idx) => {
        if (enemies.length > 0) {
            const target = enemies[0];
            const dx = target.x - al.x;
            al.dir = dx >= 0 ? 1 : -1;
            if (Math.abs(dx) > 35) {
                al.x += al.dir * al.speed;
                al.anim++;
            } else if (al.attackCooldown <= 0) {
                target.hp -= al.dmg;
                al.attackCooldown = 50;
                createParticles(target.x, target.y - 30, "#58a6ff", 5);
            }
        }
        if (al.attackCooldown > 0) al.attackCooldown--;
        if (al.hp <= 0) allies.splice(idx, 1);
    });

    // Enemy / Rival AI
    enemies.forEach((en, idx) => {
        // Pick closest target (Player or Ally)
        let target = player;
        let minDist = Math.abs(player.x - en.x);
        allies.forEach(al => {
            const d = Math.abs(al.x - en.x);
            if (d < minDist) { minDist = d; target = al; }
        });

        const dx = target.x - en.x;
        en.dir = dx >= 0 ? 1 : -1;
        if (Math.abs(dx) > 34) {
            en.x += en.dir * en.speed;
            en.anim++;
        } else if (en.attackCooldown <= 0) {
            target.hp -= en.dmg;
            en.attackCooldown = 55;
            createParticles(target.x, target.y - 30, "#f85149", 6);
        }
        if (en.attackCooldown > 0) en.attackCooldown--;

        // Handle Enemy Defeat
        if (en.hp <= 0) {
            if (en.isRival) {
                // Coins ONLY earned from Rivals Arena kills!
                player.coins += en.coinReward;
                player.score += 150;
                showBanner(`Defeated ${en.name}! +${en.coinReward} Arena Coins!`, "#e3b341");
            } else {
                player.score += en.isBoss ? 500 : 80;
                if (en.isBoss) rollBossDrop();
            }
            createParticles(en.x, en.y - 30, "#f0883e", 14);
            enemies.splice(idx, 1);
            syncScore();
        }
    });

    // Particles
    particles.forEach((pt, idx) => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life--;
        if (pt.life <= 0) particles.splice(idx, 1);
    });

    updateHUD();

    // Check Round / Chapter Outcomes
    if (gameMode === "STORY") {
        if (player.hp <= 0) {
            gameState = "END";
            endTitle.textContent = "Defeated in Story Mode";
            endDesc.textContent = "Train in Rivals Arena to earn Coins and forge stronger weapons!";
            endModal.classList.remove("hidden");
        } else if (enemiesRemainingToSpawn === 0 && enemies.length === 0) {
            if (currentChapter < CHAPTERS.length - 1) {
                startStoryChapter(currentChapter + 1);
            } else {
                gameState = "END";
                endTitle.textContent = "Story Chapter 3 Cleared!";
                endDesc.textContent = player.unlockedBossMotion
                    ? "You unlocked the 10% Boss Motion & Boss Core! Visit the Forge to craft a Gun or replay to farm more Cores!"
                    : "The 10% Boss Drop didn't trigger this run. Click Replay below to fight the Boss again!";
                endModal.classList.remove("hidden");
            }
        }
    } else if (gameMode === "RIVALS") {
        // 5-Point Series Logic
        if (player.hp <= 0) {
            enemyRoundsWon++;
            if (enemyRoundsWon >= 5) {
                gameState = "END";
                endTitle.textContent = `Rivals Won the Series (${allyRoundsWon} - ${enemyRoundsWon})`;
                endDesc.textContent = `You kept all ${player.coins} Arena Coins earned from kills! Forge a weapon and challenge them again.`;
                endModal.classList.remove("hidden");
            } else {
                startRivalsRound();
            }
        } else if (enemies.length === 0) {
            allyRoundsWon++;
            player.score += 250;
            syncScore();
            if (allyRoundsWon >= 5) {
                player.coins += 50; // Series victory bonus
                updateHUD();
                gameState = "END";
                endTitle.textContent = `VICTORY! You Won the 5-Match Series (${allyRoundsWon} - ${enemyRoundsWon})!`;
                endDesc.textContent = `Series Bonus: +50 Arena Coins! Open The Forge to craft or customize your weapons.`;
                endModal.classList.remove("hidden");
            } else {
                startRivalsRound();
            }
        }
    }
}

function drawScene() {
    const chap = CHAPTERS[currentChapter] || CHAPTERS[0];
    ctx.fillStyle = gameMode === "RIVALS" ? "#101827" : chap.bgSky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Arena / Temple Pillars
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    for (let i = 0; i < 6; i++) {
        ctx.fillRect(i * 165 + 35, 110, 65, 240);
    }

    // Floor
    ctx.fillStyle = gameMode === "RIVALS" ? "#1e293b" : chap.bgGround;
    ctx.fillRect(0, 350, canvas.width, 110);
    ctx.strokeStyle = "#30363d";
    ctx.beginPath();
    ctx.moveTo(0, 350);
    ctx.lineTo(canvas.width, 350);
    ctx.stroke();

    // Draw Allies
    allies.forEach(al => {
        drawStickman(al.x, al.y, al.dir, "#3fb950", "#58a6ff", al.attackCooldown > 35, al.anim, 0.95, `${al.name} (${al.hp})`, false, "melee");
    });

    // Draw Player Stickman
    drawStickman(
        player.x, player.y, player.dir,
        "#58a6ff", player.weapon.color,
        player.attackTimer > 6, player.animFrame,
        1, `${currentUser || "Hero"} [${player.heroClass}]`,
        player.bossMotionActive, player.weapon.type
    );

    // Draw Enemies / Rivals
    enemies.forEach(en => {
        const scale = en.isBoss ? 1.45 : 1;
        const color = en.isBoss ? "#d2a8ff" : "#f85149";
        drawStickman(en.x, en.y, en.dir, color, "#ff7b72", en.attackCooldown > 40, en.anim, scale, `${en.name} (${en.hp})`, en.isBoss, "melee");
    });

    // Draw Bullets & Energy Waves
    projectiles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw Particles
    particles.forEach(pt => {
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x, pt.y, 4, 4);
    });

    // Floating Banner Notification
    if (bannerAlert.timer > 0) {
        bannerAlert.timer--;
        ctx.fillStyle = "rgba(13, 17, 23, 0.85)";
        ctx.fillRect(150, 20, 600, 36);
        ctx.strokeStyle = bannerAlert.color;
        ctx.strokeRect(150, 20, 600, 36);
        ctx.fillStyle = bannerAlert.color;
        ctx.font = "bold 13px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(bannerAlert.text, 450, 43);
    }
}

function loop() {
    updateGame();
    drawScene();
    requestAnimationFrame(loop);
}

fetchLeaderboard();
updateHUD();
loop();
