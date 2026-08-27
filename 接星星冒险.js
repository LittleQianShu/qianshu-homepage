const QUEST_LEVELS = [
    { name: "星星谷", need: 6, speed: 3, rocks: 0, mark: "⭐" },
    { name: "小花坡", need: 8, speed: 3.5, rocks: 1, mark: "🌸" },
    { name: "风之路", need: 10, speed: 4.5, rocks: 1, mark: "💨" },
    { name: "石头林", need: 12, speed: 5, rocks: 2, mark: "🪨" },
    { name: "森林尽头", need: 16, speed: 6, rocks: 2, mark: "🌲" }
];

let questOpenLv = 1;
let questLv = 0;
let questMode = "map";
let questX = 180;
let questGot = 0;
let questLife = 3;
let questBits = [];
let questTick = null;
let questHurtAt = 0;

function questPlaying() {
    return document.body.classList.contains("play") &&
        document.body.classList.contains("now-quest");
}

function loadQuestOpen() {
    const n = Number(localStorage.getItem("qs-home-quest-open") || "1");
    questOpenLv = n >= 1 && n <= 5 ? n : 1;
}

function saveQuestOpen() {
    localStorage.setItem("qs-home-quest-open", String(questOpenLv));
}

function stopQuestPlay() {
    if (questTick) {
        clearInterval(questTick);
        questTick = null;
    }
}

function showQuestTip(text) {
    const tip = document.getElementById("questInfo");
    if (tip) {
        tip.textContent = text;
    }
}

function paintQuestMap() {
    const map = document.getElementById("questMap");
    const play = document.getElementById("questPlay");
    if (map) {
        map.hidden = false;
        map.innerHTML = "";
        for (let i = 0; i < QUEST_LEVELS.length; i++) {
            const lv = QUEST_LEVELS[i];
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "quest-island";
            if (i + 1 > questOpenLv) {
                btn.classList.add("lock");
            }
            if (i + 1 < questOpenLv) {
                btn.classList.add("done");
            }
            btn.setAttribute("data-quest-lv", String(i));
            btn.innerHTML = "<b>" + lv.mark + "</b><span>" + (i + 1) + ". " + lv.name + "</span>";
            map.appendChild(btn);
        }
    }
    if (play) {
        play.hidden = true;
    }
    showQuestTip("点一座开着的岛出发。过一关，下一座才会亮。生命 " + questLife);
}

function paintQuestPlay() {
    const arena = document.getElementById("questArena");
    if (!arena) {
        return;
    }
    arena.innerHTML = "";
    const you = document.createElement("div");
    you.className = "quest-you";
    you.style.left = questX + "px";
    you.textContent = "🌲";
    arena.appendChild(you);
    for (let i = 0; i < questBits.length; i++) {
        const bit = questBits[i];
        const el = document.createElement("div");
        el.className = "quest-bit " + bit.kind;
        el.style.left = bit.x + "px";
        el.style.top = bit.y + "px";
        el.textContent = bit.kind === "star" ? "⭐" : "🪨";
        arena.appendChild(el);
    }
}

function spawnQuestBit(kind) {
    const arena = document.getElementById("questArena");
    const w = arena ? arena.clientWidth - 36 : 420;
    questBits.push({
        kind: kind,
        x: 10 + Math.random() * w,
        y: -20
    });
}

function hitQuestBox(a, b, pad) {
    return Math.abs(a.x - b.x) < pad && Math.abs(a.y - b.y) < pad;
}

function tickQuest() {
    if (!questPlaying() || questMode !== "play") {
        stopQuestPlay();
        return;
    }
    const lv = QUEST_LEVELS[questLv];
    const arena = document.getElementById("questArena");
    const h = arena ? arena.clientHeight : 280;
    const you = { x: questX, y: h - 50 };
    const fall = lv.speed * (typeof pickByLevel === "function" ? pickByLevel("quest", [0.7, 1, 1.35, 1.7]) : 1);
    const keep = [];
    for (let i = 0; i < questBits.length; i++) {
        const bit = questBits[i];
        bit.y += fall;
        if (hitQuestBox(bit, you, 28)) {
            if (bit.kind === "star") {
                questGot += 1;
                if (typeof playTone === "function") {
                    playTone(720, 0.08);
                }
                if (typeof popNice === "function") {
                    popNice(questGot + " / " + lv.need);
                }
            } else if (Date.now() - questHurtAt > 700) {
                questLife -= 1;
                questHurtAt = Date.now();
                if (typeof playTone === "function") {
                    playTone(180, 0.16);
                }
            }
        } else if (bit.y < h) {
            keep.push(bit);
        }
    }
    questBits = keep;
    if (Math.random() < 0.08) {
        spawnQuestBit("star");
    }
    if (lv.rocks && Math.random() < 0.025 * lv.rocks) {
        spawnQuestBit("rock");
    }
    showQuestTip(lv.mark + " " + lv.name + " · 接到 " + questGot + " / " + lv.need + " · 生命 " + questLife);
    paintQuestPlay();
    if (questGot >= lv.need) {
        stopQuestPlay();
        questMode = "map";
        if (questLv + 2 > questOpenLv) {
            questOpenLv = Math.min(5, questLv + 2);
            saveQuestOpen();
        }
        if (typeof celebrateWin === "function") {
            celebrateWin(lv.name + "过关！");
        }
        if (typeof giveBadge === "function") {
            giveBadge("quest-first");
            if (questOpenLv >= 5 && questLv === 4) {
                giveBadge("quest-end");
            }
        }
        if (typeof noteGameBest === "function") {
            noteGameBest("quest", questLv + 1, " 关");
        }
        paintQuestMap();
        return;
    }
    if (questLife <= 0) {
        stopQuestPlay();
        questMode = "map";
        questLife = 3;
        if (typeof popNice === "function") {
            popNice("生命用完了");
        }
        paintQuestMap();
        showQuestTip("这一关没过。生命回满了，再点岛试试");
    }
}

function startQuestLevel(index) {
    if (index + 1 > questOpenLv) {
        return;
    }
    const map = document.getElementById("questMap");
    const play = document.getElementById("questPlay");
    questLv = index;
    questMode = "play";
    questX = 180;
    questGot = 0;
    questBits = [];
    questHurtAt = 0;
    if (map) {
        map.hidden = true;
    }
    if (play) {
        play.hidden = false;
    }
    paintQuestPlay();
    stopQuestPlay();
    questTick = setInterval(tickQuest, 30);
    showQuestTip(QUEST_LEVELS[index].name + "开始！左右移动去接星星，躲开石头");
}

function moveQuest(dx) {
    if (!questPlaying() || questMode !== "play") {
        return;
    }
    const arena = document.getElementById("questArena");
    const w = arena ? arena.clientWidth - 40 : 420;
    questX = Math.max(0, Math.min(w, questX + dx));
    paintQuestPlay();
}

function startQuest() {
    stopQuestPlay();
    loadQuestOpen();
    questMode = "map";
    questLife = 3;
    paintQuestMap();
}

function connectQuest() {
    const map = document.getElementById("questMap");
    const again = document.getElementById("questRestart");
    const pad = document.getElementById("questPad");
    if (map) {
        map.onclick = function (event) {
            const btn = event.target.closest("[data-quest-lv]");
            if (!btn || btn.classList.contains("lock")) {
                return;
            }
            startQuestLevel(Number(btn.getAttribute("data-quest-lv")));
        };
    }
    if (again) {
        again.onclick = startQuest;
    }
    if (pad) {
        pad.onclick = function (event) {
            const btn = event.target.closest("[data-quest-dir]");
            if (!btn) {
                return;
            }
            moveQuest(btn.getAttribute("data-quest-dir") === "left" ? -28 : 28);
        };
    }
    document.addEventListener("keydown", function (event) {
        if (event.key === "ArrowLeft") {
            moveQuest(-28);
        }
        if (event.key === "ArrowRight") {
            moveQuest(28);
        }
    });
}

connectQuest();
