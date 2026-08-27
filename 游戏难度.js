const GAME_LEVEL_KEYS = ["easy", "normal", "hard", "super"];
const GAME_LEVEL_LABELS = { easy: "简单", normal: "普通", hard: "困难", super: "超难" };

function getGameLevel(name) {
    const raw = localStorage.getItem("qs-home-level-" + name) || "normal";
    return GAME_LEVEL_KEYS.indexOf(raw) >= 0 ? raw : "normal";
}

function setGameLevel(name, level) {
    if (GAME_LEVEL_KEYS.indexOf(level) < 0) {
        return;
    }
    localStorage.setItem("qs-home-level-" + name, level);
}

function pickByLevel(name, values) {
    const i = GAME_LEVEL_KEYS.indexOf(getGameLevel(name));
    return values[i < 0 ? 1 : i];
}

function paintLevelBar(bar, name) {
    if (!bar) {
        return;
    }
    const now = getGameLevel(name);
    const btns = bar.querySelectorAll("[data-game-lv]");
    for (let i = 0; i < btns.length; i++) {
        btns[i].classList.toggle("on", btns[i].getAttribute("data-game-lv") === now);
    }
}

function restartByLevel(name) {
    const run = {
        memory: window.startMemory,
        tap: window.startTap,
        snake: window.startSnake,
        mole: window.startMole,
        bubble: window.startBubble,
        star: window.startStar,
        rps: window.startRps,
        trust: window.startTrust,
        piano: window.startPiano,
        maze: window.startMaze,
        simon: window.startSimon,
        paint: window.startPaint,
        diff: window.startDiff,
        fruit: window.startFruit,
        calc: window.startCalc,
        order: window.startOrder,
        dress: window.startDress,
        race: window.startRace,
        stack: window.startStack,
        count: window.startCount,
        color: window.startColor,
        jump: window.startJump,
        gate: window.startGate,
        duel: window.startDuel,
        quest: window.startQuest,
        guess: window.applyGuessLevel
    }[name];
    if (typeof run === "function") {
        run();
    }
}

function putLevelBar(roomClass, name) {
    const room = document.querySelector("." + roomClass);
    if (!room || room.querySelector("[data-game-level='" + name + "']")) {
        return;
    }
    const bar = document.createElement("div");
    bar.className = "chess-bar game-level-bar";
    bar.setAttribute("data-game-level", name);
    for (let i = 0; i < GAME_LEVEL_KEYS.length; i++) {
        const key = GAME_LEVEL_KEYS[i];
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "chess-level-btn";
        btn.setAttribute("data-game-lv", key);
        btn.textContent = GAME_LEVEL_LABELS[key];
        bar.appendChild(btn);
    }
    const title = room.querySelector("h2") || room.querySelector(".works-title");
    if (title) {
        title.insertAdjacentElement("afterend", bar);
    } else {
        room.insertBefore(bar, room.firstChild);
    }
    paintLevelBar(bar, name);
    bar.onclick = function (event) {
        const btn = event.target.closest("[data-game-lv]");
        if (!btn) {
            return;
        }
        setGameLevel(name, btn.getAttribute("data-game-lv"));
        paintLevelBar(bar, name);
        restartByLevel(name);
    };
}

function bootGameLevels() {
    const rooms = [
        ["memory-room", "memory"],
        ["tap-room", "tap"],
        ["snake-room", "snake"],
        ["mole-room", "mole"],
        ["bubble-room", "bubble"],
        ["star-room", "star"],
        ["rps-room", "rps"],
        ["trust-room", "trust"],
        ["piano-room", "piano"],
        ["maze-room", "maze"],
        ["simon-room", "simon"],
        ["paint-room", "paint"],
        ["diff-room", "diff"],
        ["fruit-room", "fruit"],
        ["calc-room", "calc"],
        ["order-room", "order"],
        ["dress-room", "dress"],
        ["race-room", "race"],
        ["stack-room", "stack"],
        ["count-room", "count"],
        ["color-room", "color"],
        ["jump-room", "jump"],
        ["gate-room", "gate"],
        ["duel-room", "duel"],
        ["quest-room", "quest"],
        ["guess-room", "guess"]
    ];
    for (let i = 0; i < rooms.length; i++) {
        putLevelBar(rooms[i][0], rooms[i][1]);
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootGameLevels);
} else {
    bootGameLevels();
}
