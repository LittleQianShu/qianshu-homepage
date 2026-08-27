const MATCH_ALL_KINDS = ["🌲", "🌸", "⭐", "🫧", "🍬", "💜"];
const MATCH_LEVELS = {
    easy: { name: "简单", kinds: 4, need: [6, 5], moves: 0 },
    normal: { name: "普通", kinds: 6, need: [10, 8], moves: 0 },
    hard: { name: "困难", kinds: 6, need: [14, 12], moves: 28 },
    super: { name: "超难", kinds: 6, need: [18, 15], moves: 20 }
};
const MATCH_SIZE = 8;
const MATCH_BOARD = 360;
const MATCH_GAP = 4;
const MATCH_CELL = (MATCH_BOARD - MATCH_GAP * (MATCH_SIZE - 1)) / MATCH_SIZE;
const MATCH_SWAP_MS = 240;
const MATCH_CLEAR_MS = 200;
const MATCH_FALL_MS = 260;

let matchPieces = [];
let matchNextId = 1;
let matchScore = 0;
let matchPick = -1;
let matchBusy = false;
let matchWon = false;
let matchDragFrom = -1;
let matchJustDragged = false;
let matchGoals = [];
let matchLevel = localStorage.getItem("qs-home-match-level") || "normal";
let matchMovesLeft = 0;

function matchSetting() {
    return MATCH_LEVELS[matchLevel] || MATCH_LEVELS.normal;
}

function matchIndex(row, col) {
    return row * MATCH_SIZE + col;
}

function matchKind() {
    const kinds = MATCH_ALL_KINDS.slice(0, matchSetting().kinds);
    return kinds[Math.floor(Math.random() * kinds.length)];
}

function matchWait(ms, then) {
    setTimeout(then, ms);
}

function matchPos(row, col) {
    const step = 100 / MATCH_SIZE;
    return {
        left: col * step,
        top: row * step,
        size: step
    };
}

function gridFromPieces() {
    const grid = [];
    for (let i = 0; i < MATCH_SIZE * MATCH_SIZE; i++) {
        grid.push("");
    }
    for (let i = 0; i < matchPieces.length; i++) {
        const p = matchPieces[i];
        if (!p.dead && p.row >= 0 && p.row < MATCH_SIZE) {
            grid[matchIndex(p.row, p.col)] = p.kind;
        }
    }
    return grid;
}

function pieceAt(row, col) {
    for (let i = 0; i < matchPieces.length; i++) {
        const p = matchPieces[i];
        if (!p.dead && p.row === row && p.col === col) {
            return p;
        }
    }
    return null;
}

function matchMarks(grid) {
    const mark = [];
    for (let i = 0; i < MATCH_SIZE * MATCH_SIZE; i++) {
        mark.push(false);
    }
    for (let row = 0; row < MATCH_SIZE; row++) {
        let run = 1;
        for (let col = 1; col <= MATCH_SIZE; col++) {
            const same = col < MATCH_SIZE && grid[matchIndex(row, col)] === grid[matchIndex(row, col - 1)] && grid[matchIndex(row, col - 1)] !== "";
            if (same) {
                run += 1;
            } else {
                if (run >= 3) {
                    for (let k = 0; k < run; k++) {
                        mark[matchIndex(row, col - 1 - k)] = true;
                    }
                }
                run = 1;
            }
        }
    }
    for (let col = 0; col < MATCH_SIZE; col++) {
        let run = 1;
        for (let row = 1; row <= MATCH_SIZE; row++) {
            const same = row < MATCH_SIZE && grid[matchIndex(row, col)] === grid[matchIndex(row - 1, col)] && grid[matchIndex(row - 1, col)] !== "";
            if (same) {
                run += 1;
            } else {
                if (run >= 3) {
                    for (let k = 0; k < run; k++) {
                        mark[matchIndex(row - 1 - k, col)] = true;
                    }
                }
                run = 1;
            }
        }
    }
    return mark;
}

function matchNear(a, b) {
    const ar = Math.floor(a / MATCH_SIZE);
    const ac = a % MATCH_SIZE;
    const br = Math.floor(b / MATCH_SIZE);
    const bc = b % MATCH_SIZE;
    return Math.abs(ar - br) + Math.abs(ac - bc) === 1;
}

function newMatchGoals() {
    const set = matchSetting();
    const bag = MATCH_ALL_KINDS.slice(0, set.kinds);
    const first = bag.splice(Math.floor(Math.random() * bag.length), 1)[0];
    const second = bag[Math.floor(Math.random() * bag.length)];
    matchGoals = [
        { kind: first, need: set.need[0], have: 0 },
        { kind: second, need: set.need[1], have: 0 }
    ];
    matchMovesLeft = set.moves;
}

function addMatchGoal(byKind) {
    const names = Object.keys(byKind);
    for (let i = 0; i < names.length; i++) {
        const kind = names[i];
        for (let g = 0; g < matchGoals.length; g++) {
            if (matchGoals[g].kind === kind) {
                matchGoals[g].have += byKind[kind];
                if (matchGoals[g].have > matchGoals[g].need) {
                    matchGoals[g].have = matchGoals[g].need;
                }
            }
        }
    }
}

function matchGoalsDone() {
    for (let i = 0; i < matchGoals.length; i++) {
        if (matchGoals[i].have < matchGoals[i].need) {
            return false;
        }
    }
    return matchGoals.length > 0;
}

function showMatchQuest() {
    const el = document.getElementById("matchQuest");
    const scoreEl = document.getElementById("matchScore");
    if (scoreEl) {
        scoreEl.textContent = "分数 " + matchScore;
    }
    if (!el) {
        return;
    }
    const parts = [];
    for (let i = 0; i < matchGoals.length; i++) {
        const g = matchGoals[i];
        parts.push(g.kind + " " + g.have + "/" + g.need);
    }
    const set = matchSetting();
    const moveText = set.moves > 0 ? "　剩余步数 " + matchMovesLeft : "　步数不限";
    el.textContent = "任务（" + set.name + "）：消掉 " + parts.join(" ， ") + moveText;
}

function hideMatchWin() {
    const overlay = document.getElementById("match-overlay");
    if (!overlay) {
        return;
    }
    overlay.hidden = true;
    overlay.classList.remove("is-open", "is-win", "is-draw");
}

function showMatchWin() {
    matchWon = true;
    matchBusy = true;
    const overlay = document.getElementById("match-overlay");
    const title = document.getElementById("match-overlay-title");
    const sub = document.getElementById("match-overlay-sub");
    if (!overlay || !title || !sub) {
        return;
    }
    title.textContent = "胜利！任务完成";
    sub.textContent = matchSetting().name + "　分数 " + matchScore;
    overlay.hidden = false;
    overlay.classList.add("is-open", "is-win");
    if (typeof playWinSound === "function") {
        playWinSound();
    }
    if (typeof celebrateWin === "function") {
        celebrateWin("胜利！");
    }
    if (typeof noteGameBest === "function") {
        noteGameBest("match", matchScore);
    }
}

function showMatchFail() {
    matchWon = true;
    matchBusy = true;
    const overlay = document.getElementById("match-overlay");
    const title = document.getElementById("match-overlay-title");
    const sub = document.getElementById("match-overlay-sub");
    if (!overlay || !title || !sub) {
        return;
    }
    title.textContent = "步数用完了";
    sub.textContent = "任务还没完成，再试一局吧";
    overlay.hidden = false;
    overlay.classList.add("is-open", "is-draw");
    if (typeof playDrawSound === "function") {
        playDrawSound();
    }
}

function markMatchLevelBtns() {
    const btns = document.querySelectorAll("[data-match-level]");
    for (let i = 0; i < btns.length; i++) {
        btns[i].classList.toggle("on", btns[i].getAttribute("data-match-level") === matchLevel);
    }
}

function paintMatch(soft) {
    const board = document.getElementById("matchBoard");
    if (!board) {
        return;
    }
    showMatchQuest();
    const seen = {};
    const kids = board.querySelectorAll(".match-cell");
    for (let i = 0; i < kids.length; i++) {
        seen[kids[i].getAttribute("data-id")] = kids[i];
    }
    const live = {};
    for (let i = 0; i < matchPieces.length; i++) {
        const p = matchPieces[i];
        live[String(p.id)] = true;
        let btn = seen[String(p.id)];
        if (!btn) {
            btn = document.createElement("button");
            btn.type = "button";
            btn.className = "match-cell";
            btn.setAttribute("data-id", String(p.id));
            board.appendChild(btn);
        }
        const spot = matchPos(p.row, p.col);
        if (!soft) {
            btn.style.transition = "none";
        } else {
            btn.style.transition = "";
        }
        btn.style.left = spot.left + "%";
        btn.style.top = spot.top + "%";
        btn.style.width = spot.size + "%";
        btn.style.height = spot.size + "%";
        btn.textContent = p.kind;
        btn.classList.toggle("on", matchIndex(p.row, p.col) === matchPick && !p.dead);
        btn.classList.toggle("out", !!p.dead);
        btn.setAttribute("data-i", String(matchIndex(p.row, p.col)));
    }
    for (let i = 0; i < kids.length; i++) {
        const id = kids[i].getAttribute("data-id");
        if (!live[id]) {
            kids[i].remove();
        }
    }
}

function piecesFromGrid(grid) {
    const list = [];
    for (let row = 0; row < MATCH_SIZE; row++) {
        for (let col = 0; col < MATCH_SIZE; col++) {
            list.push({
                id: matchNextId,
                kind: grid[matchIndex(row, col)],
                row: row,
                col: col,
                dead: false
            });
            matchNextId += 1;
        }
    }
    return list;
}

function makeCleanGrid() {
    const grid = [];
    for (let i = 0; i < MATCH_SIZE * MATCH_SIZE; i++) {
        grid.push(matchKind());
    }
    for (let safety = 0; safety < 20; safety++) {
        const mark = matchMarks(grid);
        let n = 0;
        for (let i = 0; i < mark.length; i++) {
            if (mark[i]) {
                grid[i] = matchKind();
                n += 1;
            }
        }
        if (n === 0) {
            break;
        }
    }
    return grid;
}

function startMatch() {
    hideMatchWin();
    matchNextId = 1;
    matchPieces = piecesFromGrid(makeCleanGrid());
    matchScore = 0;
    matchPick = -1;
    matchBusy = false;
    matchWon = false;
    matchDragFrom = -1;
    matchJustDragged = false;
    newMatchGoals();
    const tip = document.getElementById("matchTip");
    if (tip) {
        tip.textContent = "按住一颗轻轻滑到旁边，会慢慢换过去";
    }
    const board = document.getElementById("matchBoard");
    if (board) {
        board.innerHTML = "";
    }
    paintMatch(false);
}

function swapPieces(from, to) {
    const a = pieceAt(Math.floor(from / MATCH_SIZE), from % MATCH_SIZE);
    const b = pieceAt(Math.floor(to / MATCH_SIZE), to % MATCH_SIZE);
    if (!a || !b) {
        return false;
    }
    const ar = a.row;
    const ac = a.col;
    a.row = b.row;
    a.col = b.col;
    b.row = ar;
    b.col = ac;
    return true;
}

function runClearAndFall(then) {
    const mark = matchMarks(gridFromPieces());
    let cleared = 0;
    const byKind = {};
    for (let i = 0; i < matchPieces.length; i++) {
        const p = matchPieces[i];
        const idx = matchIndex(p.row, p.col);
        if (p.row >= 0 && mark[idx]) {
            p.dead = true;
            byKind[p.kind] = (byKind[p.kind] || 0) + 1;
            cleared += 1;
        }
    }
    if (cleared === 0) {
        then(0);
        return;
    }
    paintMatch(true);
    matchWait(MATCH_CLEAR_MS, function () {
        const keep = [];
        for (let i = 0; i < matchPieces.length; i++) {
            if (!matchPieces[i].dead) {
                keep.push(matchPieces[i]);
            }
        }
        matchPieces = keep;
        const born = [];
        for (let col = 0; col < MATCH_SIZE; col++) {
            const colPieces = [];
            for (let i = 0; i < matchPieces.length; i++) {
                if (matchPieces[i].col === col) {
                    colPieces.push(matchPieces[i]);
                }
            }
            colPieces.sort(function (a, b) {
                return a.row - b.row;
            });
            const hole = MATCH_SIZE - colPieces.length;
            for (let i = 0; i < colPieces.length; i++) {
                colPieces[i].row = hole + i;
            }
            for (let i = 0; i < hole; i++) {
                born.push({
                    id: matchNextId,
                    kind: matchKind(),
                    row: i - hole,
                    col: col,
                    dead: false,
                    fresh: true
                });
                matchNextId += 1;
            }
        }
        for (let i = 0; i < born.length; i++) {
            matchPieces.push(born[i]);
        }
        paintMatch(false);
        matchWait(20, function () {
            for (let col = 0; col < MATCH_SIZE; col++) {
                const hole = [];
                for (let i = 0; i < matchPieces.length; i++) {
                    if (matchPieces[i].col === col && matchPieces[i].fresh) {
                        hole.push(matchPieces[i]);
                    }
                }
                hole.sort(function (a, b) {
                    return a.row - b.row;
                });
                for (let i = 0; i < hole.length; i++) {
                    hole[i].row = i;
                    hole[i].fresh = false;
                }
            }
            paintMatch(true);
            addMatchGoal(byKind);
            matchScore += cleared * 10;
            showMatchQuest();
            matchWait(MATCH_FALL_MS, function () {
                then(cleared);
            });
        });
    });
}

function cascadeMatch(first, done) {
    runClearAndFall(function (cleared) {
        if (cleared === 0) {
            done(first);
            return;
        }
        cascadeMatch(first + cleared, done);
    });
}

function tryMatchSwap(from, to) {
    if (matchBusy || matchWon) {
        return;
    }
    if (from < 0 || to < 0 || from === to || !matchNear(from, to)) {
        return;
    }
    if (!swapPieces(from, to)) {
        return;
    }
    matchBusy = true;
    matchPick = -1;
    matchDragFrom = -1;
    paintMatch(true);
    matchWait(MATCH_SWAP_MS, function () {
        const mark = matchMarks(gridFromPieces());
        let any = false;
        for (let i = 0; i < mark.length; i++) {
            if (mark[i]) {
                any = true;
            }
        }
        if (!any) {
            swapPieces(from, to);
            paintMatch(true);
            const tip = document.getElementById("matchTip");
            if (tip) {
                tip.textContent = "这样滑消不掉，又滑回去了";
            }
            matchWait(MATCH_SWAP_MS, function () {
                matchBusy = false;
            });
            return;
        }
        cascadeMatch(0, function (total) {
            if (total > 0 && typeof giveBadge === "function") {
                giveBadge("match-first");
                if (matchScore >= 200) {
                    giveBadge("match-200");
                }
            }
            const tip = document.getElementById("matchTip");
            if (tip) {
                tip.textContent = "消掉 " + total + " 个，上面滑下来了";
            }
            paintMatch(true);
            if (matchSetting().moves > 0) {
                matchMovesLeft -= 1;
                showMatchQuest();
            }
            if (matchGoalsDone()) {
                showMatchWin();
            } else if (matchSetting().moves > 0 && matchMovesLeft <= 0) {
                showMatchFail();
            } else {
                matchBusy = false;
            }
        });
    });
}

function cellAtPoint(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el || !el.closest) {
        return -1;
    }
    const cell = el.closest(".match-cell");
    if (!cell || cell.classList.contains("out")) {
        return -1;
    }
    return Number(cell.getAttribute("data-i"));
}

function showPlayGame(name) {
    hideMatchWin();
    const games = ["chess", "go", "match", "memory", "tap", "rps", "trust", "bubble", "star", "snake", "mole"].concat(typeof NEW_PLAY_GAMES !== "undefined" ? NEW_PLAY_GAMES : []);
    for (let i = 0; i < games.length; i++) {
        document.body.classList.toggle("now-" + games[i], games[i] === name);
    }
    const dockBtns = document.querySelectorAll("[data-play]");
    for (let i = 0; i < dockBtns.length; i++) {
        dockBtns[i].classList.toggle("on", dockBtns[i].getAttribute("data-play") === name);
    }
    if (name === "match") {
        startMatch();
    }
    if (name === "chess" && typeof fitChessBoard === "function") {
        fitChessBoard();
    }
    if (typeof startMiniGame === "function") {
        startMiniGame(name);
    }
}

function connectMatch3() {
    const board = document.getElementById("matchBoard");
    const again = document.getElementById("matchRestart");
    const chessBtn = document.getElementById("dockChess");
    const matchBtn = document.getElementById("dockMatch");
    const overlayAgain = document.getElementById("match-overlay-restart");
    if (!board || !chessBtn || !matchBtn) {
        return;
    }
    board.onpointerdown = function (event) {
        const i = cellAtPoint(event.clientX, event.clientY);
        if (i < 0 || matchBusy) {
            return;
        }
        matchDragFrom = i;
        matchPick = i;
        if (board.setPointerCapture) {
            board.setPointerCapture(event.pointerId);
        }
        paintMatch(true);
        event.preventDefault();
    };
    board.onpointermove = function (event) {
        if (matchDragFrom < 0 || matchBusy) {
            return;
        }
        const to = cellAtPoint(event.clientX, event.clientY);
        if (to >= 0 && to !== matchDragFrom && matchNear(matchDragFrom, to)) {
            matchJustDragged = true;
            tryMatchSwap(matchDragFrom, to);
        }
    };
    board.onpointerup = function () {
        matchDragFrom = -1;
    };
    board.onclick = function (event) {
        if (matchJustDragged) {
            matchJustDragged = false;
            return;
        }
        const btn = event.target.closest(".match-cell");
        if (!btn || matchBusy) {
            return;
        }
        const index = Number(btn.getAttribute("data-i"));
        if (matchPick < 0 || matchPick === index || !matchNear(matchPick, index)) {
            matchPick = index;
            paintMatch(true);
            return;
        }
        tryMatchSwap(matchPick, index);
    };
    if (again) {
        again.onclick = startMatch;
    }
    if (overlayAgain) {
        overlayAgain.onclick = startMatch;
    }
    const levelBtns = document.querySelectorAll("[data-match-level]");
    for (let i = 0; i < levelBtns.length; i++) {
        levelBtns[i].onclick = function () {
            matchLevel = levelBtns[i].getAttribute("data-match-level");
            localStorage.setItem("qs-home-match-level", matchLevel);
            markMatchLevelBtns();
            startMatch();
        };
    }
    markMatchLevelBtns();
    const dockBtns = document.querySelectorAll("[data-play]");
    for (let i = 0; i < dockBtns.length; i++) {
        dockBtns[i].onclick = function () {
            showPlayGame(dockBtns[i].getAttribute("data-play"));
        };
    }
}

connectMatch3();
