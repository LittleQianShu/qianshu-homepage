const NEW_PLAY_GAMES = ["piano", "maze", "simon", "paint", "diff", "fruit", "calc", "order", "dress", "race", "stack", "count", "color", "jump", "gate", "duel", "quest"];

function newGameOpen(name) {
    return document.body.classList.contains("play") &&
        document.body.classList.contains("now-" + name);
}

function popNice(text) {
    const old = document.querySelector(".fun-pop");
    if (old) {
        old.remove();
    }
    const el = document.createElement("div");
    el.className = "fun-pop";
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(function () {
        el.remove();
    }, 720);
}

function playWinJingle() {
    const notes = [523, 659, 784, 1046];
    for (let i = 0; i < notes.length; i++) {
        setTimeout(function () {
            playTone(notes[i], 0.16);
        }, i * 120);
    }
}

function burstNice() {
    const marks = ["✨", "⭐", "🌸", "🫧"];
    for (let i = 0; i < 12; i++) {
        const s = document.createElement("div");
        s.className = "fun-spark";
        s.textContent = marks[i % marks.length];
        s.style.left = 30 + Math.random() * 40 + "vw";
        s.style.top = 28 + Math.random() * 30 + "vh";
        document.body.appendChild(s);
        setTimeout(function () {
            s.remove();
        }, 900);
    }
}

function celebrateWin(text) {
    popNice(text || "太棒了！");
    playWinJingle();
    burstNice();
}

function gameBest(name) {
    return Number(localStorage.getItem("qs-home-best-" + name) || "0");
}

function paintGameBest(name, isNew, extra) {
    const el = document.getElementById(name + "Best");
    if (!el) {
        return;
    }
    el.textContent = (isNew ? "新纪录 " : "最高 ") + gameBest(name) + (extra || "");
}

function noteGameBest(name, score, extra) {
    const n = Number(score) || 0;
    let isNew = false;
    if (n > gameBest(name)) {
        localStorage.setItem("qs-home-best-" + name, String(n));
        isNew = true;
    }
    paintGameBest(name, isNew, extra);
    return isNew;
}

function noteGameBestLow(name, score, extra) {
    const n = Number(score) || 0;
    const raw = localStorage.getItem("qs-home-best-" + name);
    const old = raw == null ? 0 : Number(raw);
    let isNew = false;
    if (n > 0 && (raw == null || old === 0 || n < old)) {
        localStorage.setItem("qs-home-best-" + name, String(n));
        isNew = true;
    }
    const el = document.getElementById(name + "Best");
    if (el) {
        const show = gameBest(name);
        el.textContent = (isNew ? "新纪录 " : "最少 ") + (show || "—") + (extra || "");
    }
    return isNew;
}

function ensureBestEl(name, afterId, extra) {
    if (document.getElementById(name + "Best") || !document.getElementById(afterId)) {
        return;
    }
    const p = document.createElement("p");
    p.className = "game-score";
    p.id = name + "Best";
    document.getElementById(afterId).insertAdjacentElement("afterend", p);
    paintGameBest(name, false, extra);
}

function playTone(freq, time) {
    const ctx = window.__qsTone || (window.__qsTone = new AudioContext());
    if (ctx.state === "suspended") {
        ctx.resume();
    }
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.28, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + time + 0.02);
}

const PIANO_NOTES = [
    { name: "C", freq: 261 },
    { name: "D", freq: 293 },
    { name: "E", freq: 329 },
    { name: "F", freq: 349 },
    { name: "G", freq: 392 },
    { name: "A", freq: 440 },
    { name: "B", freq: 493 },
    { name: "C", freq: 523 }
];

function playLittleStar() {
    const song = [261, 261, 392, 392, 440, 440, 392, 349, 349, 329, 329, 293, 293, 261];
    const gap = pickByLevel("piano", [400, 300, 200, 140]);
    for (let i = 0; i < song.length; i++) {
        setTimeout(function () {
            playTone(song[i], 0.28);
        }, i * gap);
    }
    const tip = document.getElementById("pianoInfo");
    if (tip) {
        tip.textContent = "小星星来了！";
    }
}

let pianoGoal = [];
let pianoStep = 0;

function makePianoKeys() {
    const box = document.getElementById("pianoKeys");
    if (!box || box.childNodes.length) {
        return;
    }
    for (let i = 0; i < PIANO_NOTES.length; i++) {
        const key = document.createElement("button");
        key.type = "button";
        key.className = "piano-key";
        key.textContent = PIANO_NOTES[i].name;
        key.setAttribute("data-freq", String(PIANO_NOTES[i].freq));
        box.appendChild(key);
    }
    box.onclick = function (event) {
        const key = event.target.closest(".piano-key");
        if (!key) {
            return;
        }
        const freq = Number(key.getAttribute("data-freq"));
        playTone(freq, 0.35);
        key.classList.add("on");
        setTimeout(function () {
            key.classList.remove("on");
        }, 160);
        if (typeof giveBadge === "function") {
            giveBadge("piano-first");
        }
        hitPiano(freq);
    };
}

function playPianoGoal() {
    const gap = pickByLevel("piano", [400, 340, 260, 180]);
    for (let i = 0; i < pianoGoal.length; i++) {
        setTimeout(function () {
            playTone(pianoGoal[i], 0.28);
        }, i * gap);
    }
}

function startPiano() {
    makePianoKeys();
    const tip = document.getElementById("pianoInfo");
    const len = pickByLevel("piano", [0, 2, 3, 5]);
    pianoStep = 0;
    if (len === 0) {
        pianoGoal = [];
        if (tip) {
            tip.textContent = "随便弹。再来一局听小星星";
        }
        playLittleStar();
        return;
    }
    pianoGoal = [];
    for (let i = 0; i < len; i++) {
        pianoGoal.push(PIANO_NOTES[Math.floor(Math.random() * PIANO_NOTES.length)].freq);
    }
    if (tip) {
        tip.textContent = "听 " + len + " 个音，再按同样的顺序";
    }
    setTimeout(playPianoGoal, 360);
}

function hitPiano(freq) {
    if (!pianoGoal.length) {
        return;
    }
    if (freq !== pianoGoal[pianoStep]) {
        pianoStep = 0;
        const tip = document.getElementById("pianoInfo");
        if (tip) {
            tip.textContent = "错了，再听一遍";
        }
        setTimeout(playPianoGoal, 400);
        return;
    }
    pianoStep += 1;
    if (pianoStep < pianoGoal.length) {
        return;
    }
    celebrateWin("跟上了！");
    noteGameBest("piano", pianoGoal.length, " 个音");
    setTimeout(startPiano, 900);
}

let mazeW = 11;
let mazeH = 9;
let mazeGrid = [];
let mazeX = 1;
let mazeY = 1;

function carveMaze() {
    mazeGrid = [];
    for (let y = 0; y < mazeH; y++) {
        mazeGrid[y] = [];
        for (let x = 0; x < mazeW; x++) {
            mazeGrid[y][x] = 1;
        }
    }
    function walk(x, y) {
        mazeGrid[y][x] = 0;
        const dirs = [[0, -2], [2, 0], [0, 2], [-2, 0]];
        for (let i = dirs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const hold = dirs[i];
            dirs[i] = dirs[j];
            dirs[j] = hold;
        }
        for (let i = 0; i < dirs.length; i++) {
            const nx = x + dirs[i][0];
            const ny = y + dirs[i][1];
            if (nx > 0 && ny > 0 && nx < mazeW - 1 && ny < mazeH - 1 && mazeGrid[ny][nx] === 1) {
                mazeGrid[y + dirs[i][1] / 2][x + dirs[i][0] / 2] = 0;
                walk(nx, ny);
            }
        }
    }
    walk(1, 1);
    mazeGrid[1][1] = 0;
    mazeGrid[mazeH - 2][mazeW - 2] = 0;
    mazeX = 1;
    mazeY = 1;
}

function paintMaze() {
    const board = document.getElementById("mazeBoard");
    const tip = document.getElementById("mazeInfo");
    if (!board) {
        return;
    }
    board.style.gridTemplateColumns = "repeat(" + mazeW + ", 28px)";
    board.innerHTML = "";
    for (let y = 0; y < mazeH; y++) {
        for (let x = 0; x < mazeW; x++) {
            const cell = document.createElement("div");
            cell.className = "maze-cell";
            if (x === mazeX && y === mazeY) {
                cell.classList.add("you");
                cell.textContent = "🌲";
            } else if (x === mazeW - 2 && y === mazeH - 2) {
                cell.classList.add("goal");
                cell.textContent = "🌸";
            } else if (mazeGrid[y][x] === 1) {
                cell.classList.add("wall");
            }
            board.appendChild(cell);
        }
    }
    if (tip) {
        tip.textContent = mazeX === mazeW - 2 && mazeY === mazeH - 2
            ? "走到小花啦！"
            : "方向键或下面按钮，走到小花";
    }
}

function stepMaze(dx, dy) {
    if (!newGameOpen("maze")) {
        return;
    }
    const nx = mazeX + dx;
    const ny = mazeY + dy;
    if (ny < 0 || nx < 0 || ny >= mazeH || nx >= mazeW || mazeGrid[ny][nx] === 1) {
        return;
    }
    mazeX = nx;
    mazeY = ny;
    paintMaze();
    if (mazeX === mazeW - 2 && mazeY === mazeH - 2) {
        celebrateWin("找到小花！");
        noteGameBest("maze", gameBest("maze") + 1, " 次到达");
        if (typeof giveBadge === "function") {
            giveBadge("maze-first");
        }
    }
}

function startMaze() {
    mazeW = pickByLevel("maze", [7, 11, 15, 19]);
    mazeH = pickByLevel("maze", [7, 9, 11, 13]);
    carveMaze();
    paintMaze();
}

let simonSeq = [];
let simonStep = 0;
let simonLock = false;

function simonLit(index, on) {
    const pads = document.querySelectorAll(".simon-pad");
    if (pads[index]) {
        pads[index].classList.toggle("lit", on);
    }
}

function playSimonFlash(list, done) {
    let i = 0;
    simonLock = true;
    function next() {
        if (i >= list.length) {
            simonLock = false;
            if (done) {
                done();
            }
            return;
        }
        const n = list[i];
        simonLit(n, true);
        playTone([329, 392, 440, 523][n], 0.22);
        setTimeout(function () {
            simonLit(n, false);
            i += 1;
            setTimeout(next, pickByLevel("simon", [240, 180, 120, 70]));
        }, pickByLevel("simon", [480, 360, 240, 160]));
    }
    next();
}

function showSimonInfo(text) {
    const tip = document.getElementById("simonInfo");
    if (tip) {
        tip.textContent = text;
    }
}

function startSimon() {
    const startLen = pickByLevel("simon", [1, 1, 2, 3]);
    simonSeq = [];
    for (let i = 0; i < startLen; i++) {
        simonSeq.push(Math.floor(Math.random() * 4));
    }
    simonStep = 0;
    showSimonInfo("看灯，再按同样的顺序");
    setTimeout(function () {
        playSimonFlash(simonSeq);
    }, 400);
}

function hitSimon(index) {
    if (simonLock || !newGameOpen("simon")) {
        return;
    }
    playTone([329, 392, 440, 523][index], 0.16);
    simonLit(index, true);
    setTimeout(function () {
        simonLit(index, false);
    }, 160);
    if (index !== simonSeq[simonStep]) {
        showSimonInfo("顺序错了，再来一局");
        simonLock = true;
        return;
    }
    simonStep += 1;
    if (simonStep < simonSeq.length) {
        return;
    }
    if (typeof giveBadge === "function") {
        giveBadge("simon-first");
        if (simonSeq.length >= 6) {
            giveBadge("simon-6");
        }
    }
    popNice("对了 ×" + simonSeq.length);
    noteGameBest("simon", simonSeq.length, " 步");
    if (simonSeq.length === 3 || simonSeq.length === 6 || simonSeq.length === 8) {
        celebrateWin("对了 ×" + simonSeq.length);
    }
    showSimonInfo("对了！下一轮 " + (simonSeq.length + 1) + " 步");
    simonSeq.push(Math.floor(Math.random() * 4));
    simonStep = 0;
    setTimeout(function () {
        playSimonFlash(simonSeq);
    }, 700);
}

const PAINT_COLORS = ["#ff8cc8", "#7ae0ff", "#ffe566", "#7cffb2", "#c9b6ff", "#ffffff"];
let paintColor = PAINT_COLORS[0];
let paintQuestBit = null;
let paintQuestColor = "";

function startPaint() {
    const pens = document.getElementById("paintPens");
    const svg = document.getElementById("paintCanvas");
    if (!pens || !svg) {
        return;
    }
    const bits = svg.querySelectorAll("[data-fill]");
    const home = ["#3d1b5c", "#5b2b8a", "#4a2a18", "#7ae0ff", "#ff8cc8", "#7cffb2"];
    for (let i = 0; i < bits.length; i++) {
        bits[i].setAttribute("fill", home[i] || "#5b2b8a");
        bits[i].classList.remove("paint-quest");
    }
    const extra = ["#ff9f43", "#ff5b7a", "#4cc4ff", "#b8fff0"];
    const allColors = PAINT_COLORS.concat(extra);
    const colorN = pickByLevel("paint", [4, 6, 8, 10]);
    const pensList = allColors.slice(0, colorN);
    paintColor = pensList[0];
    pens.innerHTML = "";
    for (let i = 0; i < pensList.length; i++) {
        const pen = document.createElement("button");
        pen.type = "button";
        pen.className = "paint-pen" + (i === 0 ? " on" : "");
        pen.style.background = pensList[i];
        pen.setAttribute("data-color", pensList[i]);
        pens.appendChild(pen);
    }
    pens.onclick = function (event) {
        const pen = event.target.closest(".paint-pen");
        if (!pen) {
            return;
        }
        paintColor = pen.getAttribute("data-color");
        const all = pens.querySelectorAll(".paint-pen");
        for (let i = 0; i < all.length; i++) {
            all[i].classList.toggle("on", all[i] === pen);
        }
    };
    const tip = document.getElementById("paintInfo");
    paintQuestBit = null;
    paintQuestColor = "";
    if (getGameLevel("paint") !== "easy" && bits.length) {
        paintQuestBit = bits[Math.floor(Math.random() * bits.length)];
        paintQuestColor = pensList[Math.floor(Math.random() * pensList.length)];
        paintQuestBit.classList.add("paint-quest");
        if (tip) {
            tip.textContent = "把发光的那块涂成选中的目标色";
        }
        paintColor = paintQuestColor;
        const allPens = pens.querySelectorAll(".paint-pen");
        for (let i = 0; i < allPens.length; i++) {
            allPens[i].classList.toggle("on", allPens[i].getAttribute("data-color") === paintQuestColor);
        }
    } else if (tip) {
        tip.textContent = "先选颜色，再点图形涂上";
    }
    svg.onclick = function (event) {
        const bit = event.target.closest("[data-fill]");
        if (!bit) {
            return;
        }
        bit.setAttribute("fill", paintColor);
        popNice("涂上了");
        if (typeof giveBadge === "function") {
            giveBadge("paint-first");
        }
        if (paintQuestBit && bit === paintQuestBit && paintColor === paintQuestColor) {
            celebrateWin("涂对了！");
            noteGameBest("paint", gameBest("paint") + 1, " 次");
            setTimeout(startPaint, 800);
        }
    };
}

const DIFF_FACES = ["🌲", "🌸", "⭐", "🫧", "🍬", "🐱", "🐰", "🌙", "☀️"];
let diffAnswer = 0;

function startDiff() {
    const left = document.getElementById("diffLeft");
    const right = document.getElementById("diffRight");
    const tip = document.getElementById("diffInfo");
    if (!left || !right) {
        return;
    }
    const side = pickByLevel("diff", [2, 3, 4, 5]);
    const total = side * side;
    const faces = [];
    for (let i = 0; i < total; i++) {
        faces.push(DIFF_FACES[Math.floor(Math.random() * DIFF_FACES.length)]);
    }
    diffAnswer = Math.floor(Math.random() * total);
    const others = DIFF_FACES.filter(function (face) {
        return face !== faces[diffAnswer];
    });
    const other = others[Math.floor(Math.random() * others.length)];
    left.innerHTML = "";
    right.innerHTML = "";
    left.style.gridTemplateColumns = "repeat(" + side + ", 1fr)";
    right.style.gridTemplateColumns = "repeat(" + side + ", 1fr)";
    for (let i = 0; i < total; i++) {
        const a = document.createElement("button");
        a.type = "button";
        a.className = "diff-cell";
        a.textContent = faces[i];
        left.appendChild(a);
        const b = document.createElement("button");
        b.type = "button";
        b.className = "diff-cell";
        b.textContent = i === diffAnswer ? other : faces[i];
        b.setAttribute("data-diff", String(i));
        right.appendChild(b);
    }
    if (tip) {
        tip.textContent = "右边有一格不一样，点出来";
    }
}

function hitDiff(index) {
    const tip = document.getElementById("diffInfo");
    const cells = document.querySelectorAll("#diffRight .diff-cell");
    if (index === diffAnswer) {
        if (tip) {
            tip.textContent = "找对了！";
        }
        popNice("火眼金睛！");
        noteGameBest("diff", gameBest("diff") + 1, " 次");
        if (gameBest("diff") % 3 === 0) {
            celebrateWin("火眼金睛！");
        }
        if (typeof giveBadge === "function") {
            giveBadge("diff-first");
        }
        setTimeout(startDiff, 700);
    } else if (cells[index]) {
        cells[index].classList.add("wrong");
        if (tip) {
            tip.textContent = "不是这格，再找找";
        }
    }
}

const FRUITS = ["🍎", "🍊", "🍇", "🍉", "🍓"];
let fruitScore = 0;
let fruitCombo = 0;
let fruitComboAt = 0;
let fruitTick = null;

function showFruitInfo() {
    const tip = document.getElementById("fruitInfo");
    if (tip) {
        tip.textContent = "接到 " + fruitScore + " 个果子，点掉落的水果";
    }
}

function stopFruit() {
    if (fruitTick) {
        clearInterval(fruitTick);
        fruitTick = null;
    }
}

function spawnFruit() {
    const arena = document.getElementById("fruitArena");
    if (!arena || !newGameOpen("fruit")) {
        return;
    }
    const bit = document.createElement("div");
    bit.className = "fruit-bit";
    bit.textContent = FRUITS[Math.floor(Math.random() * FRUITS.length)];
    bit.style.left = Math.floor(Math.random() * 500) + "px";
    let y = 0;
    bit.style.top = "0px";
    arena.appendChild(bit);
    const fall = setInterval(function () {
        y += pickByLevel("fruit", [3, 4, 6, 8]);
        bit.style.top = y + "px";
        if (y > 360 || !newGameOpen("fruit")) {
            clearInterval(fall);
            bit.remove();
        }
    }, 30);
    bit.onclick = function () {
        clearInterval(fall);
        bit.remove();
        fruitScore += 1;
        const now = Date.now();
        fruitCombo = now - fruitComboAt < 900 ? fruitCombo + 1 : 1;
        fruitComboAt = now;
        popNice(fruitCombo > 1 ? "连击 ×" + fruitCombo : "接住！");
        if (noteGameBest("fruit", fruitScore)) {
            celebrateWin("新纪录！");
        }
        showFruitInfo();
        playTone(660 + fruitCombo * 40, 0.12);
        if (typeof giveBadge === "function") {
            giveBadge("fruit-first");
            if (fruitScore >= 15) {
                giveBadge("fruit-15");
            }
        }
    };
}

function startFruit() {
    stopFruit();
    fruitScore = 0;
    fruitCombo = 0;
    const arena = document.getElementById("fruitArena");
    if (arena) {
        arena.innerHTML = "";
    }
    showFruitInfo();
    fruitTick = setInterval(function () {
        spawnFruit();
    }, pickByLevel("fruit", [1000, 720, 500, 340]));
}

let calcScore = 0;
let calcA = 0;
let calcB = 0;
let calcAns = 0;

function nextCalc() {
    const top = pickByLevel("calc", [5, 9, 20, 49]);
    calcA = 1 + Math.floor(Math.random() * top);
    calcB = 1 + Math.floor(Math.random() * top);
    calcAns = calcA + calcB;
    const quest = document.getElementById("calcQuest");
    const box = document.getElementById("calcChoices");
    const tip = document.getElementById("calcInfo");
    if (quest) {
        quest.textContent = calcA + " + " + calcB + " = ?";
    }
    if (tip) {
        tip.textContent = "算对 " + calcScore + " 题";
    }
    if (!box) {
        return;
    }
    const picks = [calcAns];
    while (picks.length < 3) {
        const n = 2 + Math.floor(Math.random() * (top * 2 + 4));
        if (picks.indexOf(n) < 0) {
            picks.push(n);
        }
    }
    picks.sort(function () {
        return Math.random() - 0.5;
    });
    box.innerHTML = "";
    for (let i = 0; i < picks.length; i++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "choice-btn";
        btn.textContent = String(picks[i]);
        btn.setAttribute("data-calc", String(picks[i]));
        box.appendChild(btn);
    }
}

function startCalc() {
    calcScore = 0;
    nextCalc();
}

function hitCalc(n) {
    if (n === calcAns) {
        calcScore += 1;
        popNice("+" + calcScore);
        noteGameBest("calc", calcScore, " 题");
        if (calcScore % 5 === 0) {
            celebrateWin(calcScore + " 题！");
        }
        playTone(620, 0.12);
        if (typeof giveBadge === "function") {
            giveBadge("calc-first");
            if (calcScore >= 8) {
                giveBadge("calc-8");
            }
        }
        nextCalc();
    } else {
        playTone(220, 0.16);
        const tip = document.getElementById("calcInfo");
        if (tip) {
            tip.textContent = "不对，再想想。算对 " + calcScore + " 题";
        }
    }
}

let orderNeed = 1;
let orderMax = 5;

function startOrder(keepLevel) {
    const board = document.getElementById("orderBoard");
    const tip = document.getElementById("orderInfo");
    if (!board) {
        return;
    }
    orderNeed = 1;
    if (!keepLevel) {
        orderMax = pickByLevel("order", [3, 5, 7, 9]);
    }
    const nums = [];
    for (let i = 1; i <= orderMax; i++) {
        nums.push(i);
    }
    nums.sort(function () {
        return Math.random() - 0.5;
    });
    board.innerHTML = "";
    for (let i = 0; i < nums.length; i++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "order-bit";
        btn.textContent = String(nums[i]);
        btn.setAttribute("data-order", String(nums[i]));
        board.appendChild(btn);
    }
    if (tip) {
        tip.textContent = "从小到大点，下一个是 1";
    }
}

function hitOrder(n, btn) {
    if (n !== orderNeed) {
        playTone(200, 0.14);
        return;
    }
    btn.classList.add("off");
    playTone(400 + n * 40, 0.12);
    orderNeed += 1;
    const tip = document.getElementById("orderInfo");
    if (orderNeed > orderMax) {
        if (tip) {
            tip.textContent = "排好了！下一关更长";
        }
        popNice("过关！");
        celebrateWin("过关！");
        noteGameBest("order", orderMax, " 个数");
        if (typeof giveBadge === "function") {
            giveBadge("order-first");
        }
        orderMax = Math.min(9, orderMax + 1);
        setTimeout(function () {
            startOrder(true);
        }, 700);
    } else if (tip) {
        tip.textContent = "下一个是 " + orderNeed;
    }
}

const DRESS_HATS = ["🎩", "🧢", "👑", "🎀", "🎓", "👒"];
const DRESS_SHIRTS = ["👕", "🧥", "🥋", "👗", "🦺", "🧣"];
let dressHat = 0;
let dressShirt = 0;
let dressGoalHat = 0;
let dressGoalShirt = 0;
let dressHasGoal = false;

function paintDress() {
    const hat = document.getElementById("dressHat");
    const shirt = document.getElementById("dressShirt");
    if (hat) {
        hat.textContent = DRESS_HATS[dressHat];
    }
    if (shirt) {
        shirt.textContent = DRESS_SHIRTS[dressShirt];
    }
}

function startDress() {
    dressHat = 0;
    dressShirt = 0;
    dressHasGoal = getGameLevel("dress") !== "easy";
    const info = document.getElementById("dressInfo");
    if (dressHasGoal) {
        dressGoalHat = Math.floor(Math.random() * DRESS_HATS.length);
        dressGoalShirt = Math.floor(Math.random() * DRESS_SHIRTS.length);
        if (info) {
            info.textContent = "穿成 " + DRESS_HATS[dressGoalHat] + DRESS_SHIRTS[dressGoalShirt];
        }
    } else if (info) {
        info.textContent = "点按钮换衣服和帽子";
    }
    paintDress();
}

function spinDress(part) {
    if (part === "hat") {
        dressHat = (dressHat + 1) % DRESS_HATS.length;
    } else {
        dressShirt = (dressShirt + 1) % DRESS_SHIRTS.length;
    }
    paintDress();
    const stage = document.getElementById("dressStage");
    if (stage) {
        stage.classList.remove("dress-stage-bounce");
        void stage.offsetWidth;
        stage.classList.add("dress-stage-bounce");
    }
    popNice("换好了");
    playTone(480, 0.1);
    if (typeof giveBadge === "function") {
        giveBadge("dress-first");
    }
    if (dressHasGoal && dressHat === dressGoalHat && dressShirt === dressGoalShirt) {
        celebrateWin("穿对了！");
        noteGameBest("dress", gameBest("dress") + 1, " 套");
        setTimeout(startDress, 800);
    }
}

let raceTimer = null;
let raceOver = false;

function stopRace() {
    if (raceTimer) {
        clearInterval(raceTimer);
        raceTimer = null;
    }
}

function startRace() {
    stopRace();
    raceOver = false;
    const tree = document.getElementById("raceTree");
    const flower = document.getElementById("raceFlower");
    const tip = document.getElementById("raceInfo");
    if (tree) {
        tree.style.left = "8px";
    }
    if (flower) {
        flower.style.left = "8px";
    }
    if (tip) {
        tip.textContent = "猛点冲！小花也在跑，比谁先到";
    }
    raceTimer = setInterval(function () {
        if (!newGameOpen("race") || raceOver) {
            stopRace();
            return;
        }
        const rival = document.getElementById("raceFlower");
        if (!rival) {
            return;
        }
        const now = parseFloat(rival.style.left) || 8;
        const next = Math.min(420, now + pickByLevel("race", [2, 3.2, 4.6, 6.2]));
        rival.style.left = next + "px";
        if (next >= 420) {
            raceOver = true;
            stopRace();
            const raceTip = document.getElementById("raceInfo");
            if (raceTip) {
                raceTip.textContent = "小花先到了，再来一局！";
            }
            popNice("差一点点");
        }
    }, 80);
}

function tapRace() {
    const tree = document.getElementById("raceTree");
    if (!tree || !newGameOpen("race") || raceOver) {
        return;
    }
    const now = parseFloat(tree.style.left) || 8;
    const next = Math.min(420, now + 18);
    tree.style.left = next + "px";
    playTone(300 + next, 0.06);
    if (next >= 420) {
        raceOver = true;
        stopRace();
        celebrateWin("冲线了！");
        noteGameBest("race", gameBest("race") + 1, " 次");
        if (typeof giveBadge === "function") {
            giveBadge("race-first");
        }
        const tip = document.getElementById("raceInfo");
        if (tip) {
            tip.textContent = "你赢了！小花还在后面";
        }
    }
}

let stackY = 230;
let stackCount = 0;

function startStack() {
    const tower = document.getElementById("stackTower");
    if (!tower) {
        return;
    }
    tower.innerHTML = "";
    stackY = 230;
    stackCount = 0;
    const tip = document.getElementById("stackInfo");
    if (tip) {
        tip.textContent = "点一下叠一块饼干";
    }
}

function dropStack() {
    const tower = document.getElementById("stackTower");
    if (!tower || !newGameOpen("stack") || stackY < 20) {
        return;
    }
    const row = document.createElement("div");
    row.className = "stack-row";
    const w = pickByLevel("stack", [90, 70, 52, 38]) + Math.floor(Math.random() * pickByLevel("stack", [50, 40, 28, 16]));
    row.style.width = w + "px";
    row.style.marginLeft = (-w / 2) + "px";
    row.style.top = stackY + "px";
    row.style.background = ["#ff8cc8", "#ffe566", "#7ae0ff", "#7cffb2"][stackCount % 4];
    tower.appendChild(row);
    stackY -= 24;
    stackCount += 1;
    playTone(360 + stackCount * 30, 0.1);
    const tip = document.getElementById("stackInfo");
    if (tip) {
        tip.textContent = "叠了 " + stackCount + " 块";
    }
    popNice("叠了 " + stackCount);
    if (noteGameBest("stack", stackCount, " 块") && stackCount >= 6) {
        celebrateWin("好高！");
    }
    if (typeof giveBadge === "function") {
        giveBadge("stack-first");
        if (stackCount >= 8) {
            giveBadge("stack-8");
        }
    }
}

let countAns = 0;

function startCount() {
    const sky = document.getElementById("countSky");
    const box = document.getElementById("countChoices");
    const tip = document.getElementById("countInfo");
    const lo = pickByLevel("count", [2, 3, 5, 8]);
    const span = pickByLevel("count", [3, 6, 8, 10]);
    countAns = lo + Math.floor(Math.random() * span);
    if (sky) {
        sky.textContent = Array(countAns + 1).join("⭐");
    }
    if (tip) {
        tip.textContent = "天上有几颗星？";
    }
    if (!box) {
        return;
    }
    const picks = [countAns];
    while (picks.length < 3) {
        const n = lo + Math.floor(Math.random() * span);
        if (picks.indexOf(n) < 0) {
            picks.push(n);
        }
    }
    picks.sort(function () {
        return Math.random() - 0.5;
    });
    box.innerHTML = "";
    for (let i = 0; i < picks.length; i++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "count-choice";
        btn.textContent = String(picks[i]);
        btn.setAttribute("data-count", String(picks[i]));
        box.appendChild(btn);
    }
}

function hitCount(n) {
    const tip = document.getElementById("countInfo");
    if (n === countAns) {
        if (tip) {
            tip.textContent = "数对了！";
        }
        popNice("数对了！");
        noteGameBest("count", gameBest("count") + 1, " 次");
        if (gameBest("count") % 4 === 0) {
            celebrateWin("数对了！");
        }
        playTone(700, 0.14);
        if (typeof giveBadge === "function") {
            giveBadge("count-first");
        }
        setTimeout(startCount, 700);
    } else if (tip) {
        tip.textContent = "再数一遍";
        playTone(220, 0.14);
    }
}

const COLOR_SET = [
    { name: "红", hex: "#ff5b7a" },
    { name: "蓝", hex: "#4cc4ff" },
    { name: "黄", hex: "#ffe566" },
    { name: "绿", hex: "#7cffb2" },
    { name: "紫", hex: "#c9b6ff" },
    { name: "橙", hex: "#ff9f43" },
    { name: "粉", hex: "#ff8cc8" },
    { name: "青", hex: "#5ef0d6" },
    { name: "白", hex: "#f4edff" },
    { name: "深", hex: "#5b2b8a" }
];
let colorAns = "";
let colorScore = 0;

function startColor() {
    colorScore = 0;
    nextColor();
}

function nextColor() {
    const tip = document.getElementById("colorInfo");
    const board = document.getElementById("colorBoard");
    const n = pickByLevel("color", [4, 6, 8, 10]);
    const list = COLOR_SET.slice(0, n).sort(function () {
        return Math.random() - 0.5;
    });
    const pick = list[Math.floor(Math.random() * list.length)];
    colorAns = pick.name;
    if (tip) {
        tip.textContent = "点出「" + colorAns + "」· 对了 " + colorScore + " 次";
    }
    if (!board) {
        return;
    }
    board.innerHTML = "";
    for (let i = 0; i < list.length; i++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "color-dot";
        btn.style.background = list[i].hex;
        btn.setAttribute("data-color-name", list[i].name);
        btn.setAttribute("aria-label", list[i].name);
        board.appendChild(btn);
    }
}

function hitColor(name) {
    const tip = document.getElementById("colorInfo");
    if (name === colorAns) {
        colorScore += 1;
        popNice("就是它");
        noteGameBest("color", colorScore, " 次");
        if (colorScore % 5 === 0) {
            celebrateWin(colorScore + " 次！");
        }
        playTone(640, 0.12);
        if (typeof giveBadge === "function") {
            giveBadge("color-first");
            if (colorScore >= 8) {
                giveBadge("color-8");
            }
        }
        nextColor();
    } else if (tip) {
        tip.textContent = "不是这个。要找「" + colorAns + "」";
        playTone(220, 0.14);
    }
}

let jumpTimer = null;
let jumpY = 0;
let jumpVy = 0;
let rockX = 460;
let jumpScore = 0;
let jumpAlive = true;

function stopJump() {
    if (jumpTimer) {
        clearInterval(jumpTimer);
        jumpTimer = null;
    }
}

function paintJump() {
    const tree = document.getElementById("jumpTree");
    const rock = document.getElementById("jumpRock");
    const tip = document.getElementById("jumpInfo");
    if (tree) {
        tree.style.bottom = 8 + jumpY + "px";
    }
    if (rock) {
        rock.style.left = rockX + "px";
    }
    if (tip) {
        tip.textContent = jumpAlive
            ? "已跳过 " + jumpScore + " 块 · 最高 " + gameBest("jump") + " 块"
            : "撞到了！本局 " + jumpScore + " 块 · 最高 " + gameBest("jump") + " 块。点跳或按空格再来";
    }
}

function startJump() {
    stopJump();
    jumpY = 0;
    jumpVy = 0;
    rockX = 460;
    jumpScore = 0;
    jumpAlive = true;
    paintGameBest("jump", false, " 块");
    paintJump();
    jumpTimer = setInterval(tickJump, 30);
}

function doJump() {
    if (!newGameOpen("jump")) {
        return;
    }
    if (!jumpAlive) {
        startJump();
        return;
    }
    if (jumpY === 0) {
        jumpVy = 13;
        playTone(520, 0.08);
    }
}

function tickJump() {
    if (!newGameOpen("jump")) {
        stopJump();
        return;
    }
    if (jumpAlive) {
        jumpY += jumpVy;
        if (jumpY > 0) {
            jumpVy -= 1;
        } else {
            jumpY = 0;
            jumpVy = 0;
        }
        rockX -= pickByLevel("jump", [4, 6, 8, 11]);
        if (rockX < -36) {
            rockX = 460;
            jumpScore += 1;
            popNice("跳过！");
            noteGameBest("jump", jumpScore, " 块");
            playTone(700, 0.08);
            if (typeof giveBadge === "function") {
                giveBadge("jump-first");
                if (jumpScore >= 5) {
                    giveBadge("jump-5");
                }
            }
        }
        if (rockX > 28 && rockX < 86 && jumpY < 30) {
            jumpAlive = false;
            playTone(180, 0.2);
            if (jumpScore > 0) {
                celebrateWin("跳过 " + jumpScore + " 块！");
            }
        }
    }
    paintJump();
}

function startNewMiniGame(name) {
    if (name !== "fruit") {
        stopFruit();
    }
    if (name !== "jump") {
        stopJump();
    }
    if (name !== "race") {
        stopRace();
    }
    if (name !== "gate" && typeof stopGate === "function") {
        stopGate();
    }
    if (name !== "duel" && typeof stopDuel === "function") {
        stopDuel();
    }
    if (name !== "quest" && typeof stopQuestPlay === "function") {
        stopQuestPlay();
    }
    if (name === "piano") {
        startPiano();
    }
    if (name === "maze") {
        startMaze();
    }
    if (name === "simon") {
        startSimon();
    }
    if (name === "paint") {
        startPaint();
    }
    if (name === "diff") {
        startDiff();
    }
    if (name === "fruit") {
        startFruit();
    }
    if (name === "calc") {
        startCalc();
    }
    if (name === "order") {
        startOrder();
    }
    if (name === "dress") {
        startDress();
    }
    if (name === "race") {
        startRace();
    }
    if (name === "stack") {
        startStack();
    }
    if (name === "count") {
        startCount();
    }
    if (name === "color") {
        startColor();
    }
    if (name === "jump") {
        startJump();
    }
    if (name === "gate" && typeof startGate === "function") {
        startGate();
    }
    if (name === "duel" && typeof startDuel === "function") {
        startDuel();
    }
    if (name === "quest" && typeof startQuest === "function") {
        startQuest();
    }
}

function connectNewGames() {
    const mazePad = document.getElementById("mazePad");
    if (mazePad) {
        mazePad.onclick = function (event) {
            const btn = event.target.closest("[data-maze]");
            if (!btn) {
                return;
            }
            const dir = btn.getAttribute("data-maze");
            const move = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[dir];
            if (move) {
                stepMaze(move[0], move[1]);
            }
        };
    }
    document.addEventListener("keydown", function (event) {
        const keys = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
        if (keys[event.key]) {
            stepMaze(keys[event.key][0], keys[event.key][1]);
        }
    });
    const mazeAgain = document.getElementById("mazeRestart");
    if (mazeAgain) {
        mazeAgain.onclick = startMaze;
    }
    const simonBox = document.getElementById("simonPads");
    if (simonBox) {
        simonBox.onclick = function (event) {
            const pad = event.target.closest(".simon-pad");
            if (pad) {
                hitSimon(Number(pad.getAttribute("data-simon")));
            }
        };
    }
    const simonAgain = document.getElementById("simonRestart");
    if (simonAgain) {
        simonAgain.onclick = startSimon;
    }
    const diffRight = document.getElementById("diffRight");
    if (diffRight) {
        diffRight.onclick = function (event) {
            const cell = event.target.closest("[data-diff]");
            if (cell) {
                hitDiff(Number(cell.getAttribute("data-diff")));
            }
        };
    }
    const fruitAgain = document.getElementById("fruitRestart");
    if (fruitAgain) {
        fruitAgain.onclick = startFruit;
    }
    const calcBox = document.getElementById("calcChoices");
    if (calcBox) {
        calcBox.onclick = function (event) {
            const btn = event.target.closest("[data-calc]");
            if (btn) {
                hitCalc(Number(btn.getAttribute("data-calc")));
            }
        };
    }
    const orderBoard = document.getElementById("orderBoard");
    if (orderBoard) {
        orderBoard.onclick = function (event) {
            const btn = event.target.closest("[data-order]");
            if (btn) {
                hitOrder(Number(btn.getAttribute("data-order")), btn);
            }
        };
    }
    const dressHatBtn = document.getElementById("dressHatBtn");
    const dressShirtBtn = document.getElementById("dressShirtBtn");
    if (dressHatBtn) {
        dressHatBtn.onclick = function () {
            spinDress("hat");
        };
    }
    if (dressShirtBtn) {
        dressShirtBtn.onclick = function () {
            spinDress("shirt");
        };
    }
    const raceGo = document.getElementById("raceGo");
    if (raceGo) {
        raceGo.onclick = tapRace;
    }
    const stackDrop = document.getElementById("stackDrop");
    if (stackDrop) {
        stackDrop.onclick = dropStack;
    }
    const countBox = document.getElementById("countChoices");
    if (countBox) {
        countBox.onclick = function (event) {
            const btn = event.target.closest("[data-count]");
            if (btn) {
                hitCount(Number(btn.getAttribute("data-count")));
            }
        };
    }
    const colorBoard = document.getElementById("colorBoard");
    if (colorBoard) {
        colorBoard.onclick = function (event) {
            const btn = event.target.closest("[data-color-name]");
            if (btn) {
                hitColor(btn.getAttribute("data-color-name"));
            }
        };
    }
    const jumpBtn = document.getElementById("jumpBtn");
    if (jumpBtn) {
        jumpBtn.onclick = doJump;
    }
    document.addEventListener("keydown", function (event) {
        if ((event.key === " " || event.key === "ArrowUp") && newGameOpen("jump")) {
            event.preventDefault();
            doJump();
        }
    });
    const againMap = [
        ["pianoRestart", startPiano],
        ["paintRestart", startPaint],
        ["diffRestart", startDiff],
        ["calcRestart", startCalc],
        ["orderRestart", startOrder],
        ["dressRestart", startDress],
        ["raceRestart", startRace],
        ["stackRestart", startStack],
        ["countRestart", startCount],
        ["colorRestart", startColor],
        ["jumpRestart", startJump]
    ];
    for (let i = 0; i < againMap.length; i++) {
        const btn = document.getElementById(againMap[i][0]);
        if (btn) {
            btn.onclick = againMap[i][1];
        }
    }
    ensureBestEl("match", "matchScore");
    ensureBestEl("tap", "tapInfo", " 次");
    ensureBestEl("memory", "memoryTip", " 次翻牌");
    ensureBestEl("rps", "rpsTip", " 局");
    ensureBestEl("trust", "trustTip", " 分");
    ensureBestEl("piano", "pianoInfo", " 个音");
    ensureBestEl("maze", "mazeInfo", " 次到达");
    ensureBestEl("simon", "simonInfo", " 步");
    ensureBestEl("paint", "paintInfo", " 次");
    ensureBestEl("diff", "diffInfo", " 次");
    ensureBestEl("fruit", "fruitInfo");
    ensureBestEl("calc", "calcInfo", " 题");
    ensureBestEl("order", "orderInfo", " 个数");
    ensureBestEl("dress", "dressInfo", " 套");
    ensureBestEl("race", "raceInfo", " 次");
    ensureBestEl("stack", "stackInfo", " 块");
    ensureBestEl("count", "countInfo", " 次");
    ensureBestEl("color", "colorInfo", " 次");
    ensureBestEl("jump", "jumpInfo", " 块");
    ensureBestEl("gate", "gateInfo");
    ensureBestEl("duel", "duelInfo");
    ensureBestEl("quest", "questInfo", " 关");
}

connectNewGames();
