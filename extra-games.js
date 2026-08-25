const MEMORY_FACES = ["🌲", "🌸", "⭐", "🫧", "🍬", "💜", "🐱", "🐰"];

let memoryLock = false;
let memoryFirst = -1;
let memoryCards = [];
let memoryMoves = 0;
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
    memoryMoves = 0;
    const pairN = pickByLevel("memory", [4, 6, 8, 8]);
    const faces = MEMORY_FACES.slice(0, pairN);
    memoryCards = shuffleList(faces.concat(faces)).map(function (face) {
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
    memoryMoves += 1;
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
        if (left === 0) {
            if (typeof celebrateWin === "function") {
                celebrateWin("全找到啦！");
            } else if (typeof popNice === "function") {
                popNice("全找到啦！");
            }
            if (typeof noteGameBestLow === "function") {
                noteGameBestLow("memory", memoryMoves, " 次翻牌");
            }
            if (typeof giveBadge === "function") {
                giveBadge("memory-first");
            }
        }
        return;
    }
    memoryLock = true;
    setTimeout(function () {
        memoryCards[a].open = false;
        memoryCards[b].open = false;
        memoryLock = false;
        paintMemory();
    }, pickByLevel("memory", [900, 700, 480, 320]));
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
    tapLeft = pickByLevel("tap", [25, 20, 15, 10]);
    const dot = document.getElementById("tapDot");
    if (dot) {
        const size = pickByLevel("tap", [72, 56, 42, 30]);
        dot.style.width = size + "px";
        dot.style.height = size + "px";
    }
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
            if (typeof noteGameBest === "function") {
                noteGameBest("tap", tapScore, " 次");
            }
            if (tapScore > 0 && typeof celebrateWin === "function") {
                celebrateWin(tapScore + " 次！");
            }
            return;
        }
        showTapInfo();
    }, 1000);
}

const RPS_FACES = { 剪刀: "✂️", 石头: "✊", 布: "🖐️" };
const RPS_BEATS = { 剪刀: "布", 石头: "剪刀", 布: "石头" };
const RPS_LOSES = { 剪刀: "石头", 石头: "布", 布: "剪刀" };

let rpsMine = 0;
let rpsCpu = 0;
let rpsRound = 1;
let rpsStreak = 0;
let rpsLastMine = "";
let rpsBusy = false;
let rpsOver = false;
let rpsTick = null;

function rpsSetHands(mine, cpu) {
    const myHand = document.getElementById("rpsMyHand");
    const cpuHand = document.getElementById("rpsCpuHand");
    if (myHand) {
        myHand.textContent = mine || "?";
        myHand.classList.remove("slam");
    }
    if (cpuHand) {
        cpuHand.textContent = cpu || "?";
        cpuHand.classList.remove("slam");
    }
}

function paintRps() {
    const myScore = document.getElementById("rpsMyScore");
    const cpuScore = document.getElementById("rpsCpuScore");
    const round = document.getElementById("rpsRound");
    if (myScore) {
        myScore.textContent = String(rpsMine);
    }
    if (cpuScore) {
        cpuScore.textContent = String(rpsCpu);
    }
    if (round) {
        round.textContent = rpsOver ? "终局" : "第 " + rpsRound + " 回合";
    }
}

function startRps() {
    rpsMine = 0;
    rpsCpu = 0;
    rpsRound = 1;
    rpsStreak = 0;
    rpsLastMine = "";
    rpsBusy = false;
    rpsOver = false;
    if (rpsTick) {
        clearInterval(rpsTick);
        rpsTick = null;
    }
    rpsSetHands("?", "?");
    const arena = document.getElementById("rpsArena");
    const result = document.getElementById("rpsResult");
    const streak = document.getElementById("rpsStreak");
    const vs = document.getElementById("rpsVs");
    if (arena) {
        arena.classList.remove("is-win", "is-lose", "is-draw");
    }
    const need = pickByLevel("rps", [2, 3, 4, 5]);
    const tip = document.getElementById("rpsTip");
    if (tip) {
        tip.textContent = "先到 " + need + " 分赢这一局。难度越高，对手越会克你。";
    }
    if (result) {
        result.textContent = "选一个出手";
    }
    if (streak) {
        streak.textContent = "";
    }
    if (vs) {
        vs.textContent = "VS";
    }
    paintRps();
}

function rpsPickCpu() {
    const all = ["剪刀", "石头", "布"];
    if (rpsLastMine && Math.random() < pickByLevel("rps", [0.2, 0.45, 0.7, 0.9])) {
        return RPS_LOSES[rpsLastMine];
    }
    return all[Math.floor(Math.random() * 3)];
}

function rpsJudge(mine, computer) {
    if (mine === computer) {
        return "draw";
    }
    if (RPS_BEATS[mine] === computer) {
        return "win";
    }
    return "lose";
}

function playRps(mine) {
    const result = document.getElementById("rpsResult");
    const vs = document.getElementById("rpsVs");
    const arena = document.getElementById("rpsArena");
    const streak = document.getElementById("rpsStreak");
    const myHand = document.getElementById("rpsMyHand");
    const cpuHand = document.getElementById("rpsCpuHand");
    if (!result || rpsBusy || rpsOver) {
        return;
    }
    rpsBusy = true;
    const computer = rpsPickCpu();
    let count = 3;
    rpsSetHands("?", "?");
    if (arena) {
        arena.classList.remove("is-win", "is-lose", "is-draw");
    }
    if (vs) {
        vs.textContent = String(count);
    }
    result.textContent = "出手！";
    rpsTick = setInterval(function () {
        count = count - 1;
        if (count > 0) {
            if (vs) {
                vs.textContent = String(count);
            }
            return;
        }
        clearInterval(rpsTick);
        rpsTick = null;
        if (vs) {
            vs.textContent = "VS";
        }
        if (myHand) {
            myHand.textContent = RPS_FACES[mine];
            myHand.classList.remove("slam");
            void myHand.offsetWidth;
            myHand.classList.add("slam");
        }
        if (cpuHand) {
            cpuHand.textContent = RPS_FACES[computer];
            cpuHand.classList.remove("slam");
            void cpuHand.offsetWidth;
            cpuHand.classList.add("slam");
        }
        const outcome = rpsJudge(mine, computer);
        if (arena) {
            arena.classList.add("is-" + outcome);
        }
        if (outcome === "win") {
            rpsMine += 1;
            rpsStreak += 1;
            result.textContent = mine + " 克 " + computer + "。你赢这一手！";
            if (typeof giveBadge === "function" && rpsStreak >= 3) {
                giveBadge("rps-streak");
            }
        } else if (outcome === "lose") {
            rpsCpu += 1;
            rpsStreak = 0;
            result.textContent = computer + " 克 " + mine + "。对手赢了。";
        } else {
            rpsStreak = 0;
            result.textContent = "都出 " + mine + "。撞平了。";
        }
        if (streak) {
            streak.textContent = rpsStreak >= 2 ? "连胜 ×" + rpsStreak : "";
        }
        rpsLastMine = mine;
        const need = pickByLevel("rps", [2, 3, 4, 5]);
        if (rpsMine >= need || rpsCpu >= need) {
            rpsOver = true;
            result.textContent = rpsMine >= need
                ? "你 " + need + " 分先到。这一局你赢了！"
                : "对手先到 " + need + " 分。再来一局？";
            if (typeof celebrateWin === "function") {
                celebrateWin(rpsMine >= need ? "赢啦！" : "再来！");
            } else if (typeof popNice === "function") {
                popNice(rpsMine >= need ? "赢啦！" : "再来！");
            }
            if (rpsMine >= need && typeof noteGameBest === "function") {
                const old = typeof gameBest === "function" ? gameBest("rps") : 0;
                noteGameBest("rps", old + 1, " 局");
            }
            if (rpsMine >= need && typeof giveBadge === "function") {
                giveBadge("rps-win");
            }
        } else {
            rpsRound += 1;
        }
        paintRps();
        rpsBusy = false;
    }, 280);
}

function startMiniGame(name) {
    if (typeof stopSnake === "function") {
        stopSnake();
    }
    if (typeof stopMole === "function") {
        stopMole();
    }
    if (name === "memory") {
        startMemory();
    }
    if (name === "tap") {
        startTap();
    }
    if (name === "snake" && typeof startSnake === "function") {
        startSnake();
    }
    if (name === "mole" && typeof startMole === "function") {
        startMole();
    }
    if (name === "trust" && typeof startTrust === "function") {
        startTrust();
    }
    if (name === "rps") {
        startRps();
    }
    if (name === "bubble" && typeof startBubble === "function") {
        startBubble();
    }
    if (name === "star" && typeof startStar === "function") {
        startStar();
    }
    if (typeof startNewMiniGame === "function") {
        startNewMiniGame(name);
    }
}

function connectExtraGames() {
    const board = document.getElementById("memoryBoard");
    const memoryAgain = document.getElementById("memoryRestart");
    const tapDot = document.getElementById("tapDot");
    const tapAgain = document.getElementById("tapRestart");
    const rpsBtns = document.querySelectorAll("[data-rps]");
    const rpsAgain = document.getElementById("rpsAgain");
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
            if (typeof popNice === "function") {
                popNice("+" + tapScore);
            }
            if (typeof giveBadge === "function") {
                if (tapScore >= 20) {
                    giveBadge("tap-20");
                }
                if (tapScore >= 40) {
                    giveBadge("tap-40");
                }
            }
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
    if (rpsAgain) {
        rpsAgain.onclick = startRps;
    }
}

connectExtraGames();
