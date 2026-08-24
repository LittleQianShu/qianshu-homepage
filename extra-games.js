const MEMORY_FACES = ["🌲", "🌸", "⭐", "🫧", "🍬", "💜", "🐱", "🐰"];

let memoryLock = false;
let memoryFirst = -1;
let memoryCards = [];
let tapTimer = null;
let tapLeft = 0;
let tapScore = 0;

function shuffleList(list) {
    const next = list.slice();
    for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const hold = next[i];
        next[i] = next[j];
        next[j] = hold;
    }
    return next;
}

function startMemory() {
    const board = document.getElementById("memoryBoard");
    const tip = document.getElementById("memoryTip");
    if (!board) {
        return;
    }
    memoryLock = false;
    memoryFirst = -1;
    memoryCards = shuffleList(MEMORY_FACES.concat(MEMORY_FACES)).map(function (face) {
        return { face: face, open: false, done: false };
    });
    if (tip) {
        tip.textContent = "翻开两张，一样就留下";
    }
    paintMemory();
}

function paintMemory() {
    const board = document.getElementById("memoryBoard");
    if (!board) {
        return;
    }
    board.innerHTML = "";
    for (let i = 0; i < memoryCards.length; i++) {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "memory-card";
        if (memoryCards[i].open || memoryCards[i].done) {
            card.classList.add(memoryCards[i].done ? "done" : "open");
            card.textContent = memoryCards[i].face;
        } else {
            card.textContent = "?";
        }
        card.setAttribute("data-i", String(i));
        board.appendChild(card);
    }
}

function clickMemory(index) {
    if (memoryLock || memoryCards[index].open || memoryCards[index].done) {
        return;
    }
    memoryCards[index].open = true;
    paintMemory();
    if (memoryFirst < 0) {
        memoryFirst = index;
        return;
    }
    const a = memoryFirst;
    const b = index;
    memoryFirst = -1;
    if (memoryCards[a].face === memoryCards[b].face) {
        memoryCards[a].done = true;
        memoryCards[b].done = true;
        paintMemory();
        const left = memoryCards.filter(function (card) {
            return !card.done;
        }).length;
        const tip = document.getElementById("memoryTip");
        if (tip) {
            tip.textContent = left === 0 ? "全找到啦！" : "对上一对！还剩 " + left + " 张";
        }
        return;
    }
    memoryLock = true;
    setTimeout(function () {
        memoryCards[a].open = false;
        memoryCards[b].open = false;
        memoryLock = false;
        paintMemory();
    }, 700);
}

function moveTapDot() {
    const arena = document.getElementById("tapArena");
    const dot = document.getElementById("tapDot");
    if (!arena || !dot) {
        return;
    }
    const x = Math.floor(Math.random() * (arena.clientWidth - 56));
    const y = Math.floor(Math.random() * (arena.clientHeight - 56));
    dot.style.left = x + "px";
    dot.style.top = y + "px";
}

function showTapInfo() {
    const info = document.getElementById("tapInfo");
    if (info) {
        info.textContent = tapLeft > 0
            ? "还剩 " + tapLeft + " 秒 · " + tapScore + " 分"
            : "点粉色圆圆，20 秒里越多越好";
    }
}

function startTap() {
    const info = document.getElementById("tapInfo");
    if (tapTimer) {
        clearInterval(tapTimer);
        tapTimer = null;
    }
    tapLeft = 20;
    tapScore = 0;
    showTapInfo();
    moveTapDot();
    tapTimer = setInterval(function () {
        tapLeft = tapLeft - 1;
        if (tapLeft <= 0) {
            clearInterval(tapTimer);
            tapTimer = null;
            if (info) {
                info.textContent = "时间到！你点到了 " + tapScore + " 次";
            }
            return;
        }
        showTapInfo();
    }, 1000);
}

function playRps(mine) {
    const all = ["剪刀", "石头", "布"];
    const computer = all[Math.floor(Math.random() * 3)];
    const result = document.getElementById("rpsResult");
    if (!result) {
        return;
    }
    let text = "平手";
    if (
        (mine === "剪刀" && computer === "布") ||
        (mine === "石头" && computer === "剪刀") ||
        (mine === "布" && computer === "石头")
    ) {
        text = "你赢了";
    } else if (mine !== computer) {
        text = "电脑赢了";
    }
    result.textContent = "你出 " + mine + "，电脑出 " + computer + "。" + text + "！";
}

function startMiniGame(name) {
    if (name === "memory") {
        startMemory();
    }
    if (name === "tap") {
        startTap();
    }
}

function connectExtraGames() {
    const board = document.getElementById("memoryBoard");
    const memoryAgain = document.getElementById("memoryRestart");
    const tapDot = document.getElementById("tapDot");
    const tapAgain = document.getElementById("tapRestart");
    const rpsBtns = document.querySelectorAll("[data-rps]");
    if (board) {
        board.onclick = function (event) {
            const btn = event.target.closest(".memory-card");
            if (!btn) {
                return;
            }
            clickMemory(Number(btn.getAttribute("data-i")));
        };
    }
    if (memoryAgain) {
        memoryAgain.onclick = startMemory;
    }
    if (tapDot) {
        tapDot.onclick = function () {
            if (tapLeft <= 0) {
                startTap();
            }
            tapScore = tapScore + 1;
            showTapInfo();
            moveTapDot();
        };
    }
    if (tapAgain) {
        tapAgain.onclick = startTap;
    }
    for (let i = 0; i < rpsBtns.length; i++) {
        rpsBtns[i].onclick = function () {
            playRps(rpsBtns[i].getAttribute("data-rps"));
        };
    }
}

connectExtraGames();
