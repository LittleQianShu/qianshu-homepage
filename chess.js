const TREE = "树";
const FLOWER = "花";
const COMPUTER = FLOWER;

let boardSize = 8;
let playMode = "human";
let difficulty = "normal";

function winNeed(size) {
    return Math.min(5, size);
}

function createBoard(size) {
    const n = size === undefined ? boardSize : size;
    const board = [];
    for (let i = 0; i < n * n; i++) {
        board.push("");
    }
    return board;
}

function place(board, index, side) {
    if (index < 0 || index >= board.length || board[index] !== "") {
        return { ok: false, board: board.slice() };
    }
    const next = board.slice();
    next[index] = side;
    return { ok: true, board: next };
}

function otherSide(side) {
    return side === TREE ? FLOWER : TREE;
}

function sideName(side) {
    return side === TREE ? "小树" : "小花";
}

let audioCtx = null;

function getAudio() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) {
        return null;
    }
    if (!audioCtx) {
        audioCtx = new Audio();
    }
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
    return audioCtx;
}

function playTone(freq, start, duration, wave) {
    const ctx = getAudio();
    if (!ctx) {
        return;
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave || "sine";
    osc.frequency.value = freq;
    const when = ctx.currentTime + start;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(0.18, when + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(when);
    osc.stop(when + duration + 0.03);
}

function playWinSound() {
    playTone(523, 0, 0.14);
    playTone(659, 0.13, 0.14);
    playTone(784, 0.26, 0.28);
}

function playDrawSound() {
    playTone(392, 0, 0.2, "triangle");
    playTone(330, 0.22, 0.32, "triangle");
}

function winner(board) {
    const size = Math.round(Math.sqrt(board.length));
    const need = winNeed(size);
    const directions = [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, -1]
    ];

    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            const start = board[row * size + col];
            if (start === "") {
                continue;
            }
            for (let d = 0; d < directions.length; d++) {
                const down = directions[d][0];
                const right = directions[d][1];
                let count = 1;
                for (let step = 1; step < need; step++) {
                    const nextRow = row + down * step;
                    const nextCol = col + right * step;
                    if (nextRow < 0 || nextRow >= size || nextCol < 0 || nextCol >= size) {
                        break;
                    }
                    if (board[nextRow * size + nextCol] !== start) {
                        break;
                    }
                    count += 1;
                }
                if (count >= need) {
                    return start;
                }
            }
        }
    }
    return "";
}

function canStillWin(board, side) {
    const size = Math.round(Math.sqrt(board.length));
    const need = winNeed(size);
    const foe = otherSide(side);
    const directions = [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, -1]
    ];

    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            for (let d = 0; d < directions.length; d++) {
                const down = directions[d][0];
                const right = directions[d][1];
                const endRow = row + down * (need - 1);
                const endCol = col + right * (need - 1);
                if (endRow < 0 || endRow >= size || endCol < 0 || endCol >= size) {
                    continue;
                }
                let blocked = false;
                for (let step = 0; step < need; step++) {
                    const cell = board[(row + down * step) * size + (col + right * step)];
                    if (cell === foe) {
                        blocked = true;
                        break;
                    }
                }
                if (!blocked) {
                    return true;
                }
            }
        }
    }
    return false;
}

function isDeadlock(board) {
    return !canStillWin(board, TREE) && !canStillWin(board, FLOWER);
}

function emptyIndexes(board) {
    const list = [];
    for (let i = 0; i < board.length; i++) {
        if (board[i] === "") {
            list.push(i);
        }
    }
    return list;
}

function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function findWinningMove(board, side) {
    const spots = emptyIndexes(board);
    for (let i = 0; i < spots.length; i++) {
        const next = place(board, spots[i], side);
        if (next.ok && winner(next.board) === side) {
            return spots[i];
        }
    }
    return -1;
}

function scoreIndex(board, index, side) {
    const size = Math.round(Math.sqrt(board.length));
    const need = winNeed(size);
    const row = Math.floor(index / size);
    const col = index % size;
    const foe = otherSide(side);
    const directions = [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, -1]
    ];
    const mid = (size - 1) / 2;
    let score = (size - Math.abs(row - mid) - Math.abs(col - mid)) * 2;

    for (let d = 0; d < directions.length; d++) {
        const down = directions[d][0];
        const right = directions[d][1];
        for (let offset = 0; offset < need; offset++) {
            const startRow = row - down * offset;
            const startCol = col - right * offset;
            const endRow = startRow + down * (need - 1);
            const endCol = startCol + right * (need - 1);
            if (
                startRow < 0 || startCol < 0 || endRow < 0 || endCol < 0 ||
                startRow >= size || startCol >= size || endRow >= size || endCol >= size
            ) {
                continue;
            }
            let mine = 0;
            let opp = 0;
            for (let step = 0; step < need; step++) {
                const cell = board[(startRow + down * step) * size + (startCol + right * step)];
                if (cell === side) {
                    mine += 1;
                } else if (cell === foe) {
                    opp += 1;
                }
            }
            if (opp === 0) {
                score += Math.pow(12, mine);
            }
            if (mine === 0) {
                score += Math.pow(10, opp);
            }
        }
    }
    return score;
}

function bestByScore(board, side, spots) {
    let best = spots[0];
    let bestScore = -1;
    for (let i = 0; i < spots.length; i++) {
        const score = scoreIndex(board, spots[i], side);
        if (score > bestScore) {
            bestScore = score;
            best = spots[i];
        }
    }
    return best;
}

function evaluateSide(board, side) {
    const spots = emptyIndexes(board);
    let total = 0;
    for (let i = 0; i < spots.length; i++) {
        total += scoreIndex(board, spots[i], side);
    }
    return total;
}

function pickComputerMove(board, side, level) {
    const spots = emptyIndexes(board);
    if (spots.length === 0) {
        return -1;
    }

    const winAt = findWinningMove(board, side);
    const blockAt = findWinningMove(board, otherSide(side));

    if (level === "easy") {
        if (winAt >= 0 && Math.random() < 0.28) {
            return winAt;
        }
        if (blockAt >= 0 && Math.random() < 0.18) {
            return blockAt;
        }
        return pickRandom(spots);
    }

    if (winAt >= 0) {
        return winAt;
    }
    if (blockAt >= 0) {
        return blockAt;
    }

    if (level === "normal") {
        if (Math.random() < 0.4) {
            return pickRandom(spots);
        }
        return bestByScore(board, side, spots);
    }

    if (level === "hard") {
        return bestByScore(board, side, spots);
    }

    const ranked = spots.slice();
    ranked.sort(function (a, b) {
        return scoreIndex(board, b, side) - scoreIndex(board, a, side);
    });
    const candidates = ranked.slice(0, Math.min(16, ranked.length));
    const foe = otherSide(side);
    let best = candidates[0];
    let bestValue = -Infinity;

    for (let i = 0; i < candidates.length; i++) {
        const after = place(board, candidates[i], side).board;
        let value = evaluateSide(after, side) - evaluateSide(after, foe);
        if (findWinningMove(after, foe) >= 0) {
            value -= 100000;
        }
        if (isDeadlock(after)) {
            value = 0;
        }
        if (value > bestValue) {
            bestValue = value;
            best = candidates[i];
        }
    }
    return best;
}

function paint(board, current, over, resultText) {
    const cells = document.querySelectorAll(".chess-cell");
    for (let i = 0; i < cells.length; i++) {
        cells[i].textContent = board[i];
        cells[i].classList.toggle("is-tree", board[i] === TREE);
        cells[i].classList.toggle("is-flower", board[i] === FLOWER);
    }
    document.getElementById("chess-turn").textContent = over
        ? "游戏结束"
        : playMode === "computer" && current === COMPUTER
            ? "轮到：电脑"
            : "轮到：" + sideName(current);
    document.getElementById("chess-result").textContent = resultText;
    const ruleText = boardSize + " × " + boardSize + "，连 " + winNeed(boardSize) + " 个赢";
    document.getElementById("chess-rule").textContent = ruleText;

    const overlay = document.getElementById("chess-overlay");
    const overlayTitle = document.getElementById("chess-overlay-title");
    const overlaySub = document.getElementById("chess-overlay-sub");
    if (over) {
        const isDraw = resultText === "平局";
        overlay.hidden = false;
        overlay.classList.add("is-open");
        overlay.classList.toggle("is-draw", isDraw);
        overlay.classList.toggle("is-win", !isDraw);
        overlayTitle.textContent = isDraw ? "平局了" : resultText;
        overlaySub.textContent = isDraw ? "谁也没连成线" : "游戏结束";
    } else {
        overlay.hidden = true;
        overlay.classList.remove("is-open", "is-draw", "is-win");
        overlayTitle.textContent = "";
        overlaySub.textContent = "";
    }
}

function makeCells(boardEl) {
    boardEl.innerHTML = "";
    boardEl.style.gridTemplateColumns = "repeat(" + boardSize + ", 1fr)";
    const fontSize = boardSize <= 4 ? "22px" : boardSize <= 7 ? "16px" : "13px";
    for (let i = 0; i < boardSize * boardSize; i++) {
        const cell = document.createElement("button");
        cell.className = "chess-cell";
        cell.type = "button";
        cell.setAttribute("data-index", String(i));
        cell.style.fontSize = fontSize;
        boardEl.appendChild(cell);
    }
}

function connectChess() {
    const boardEl = document.getElementById("chess-board");
    if (!boardEl) {
        return;
    }

    let board = createBoard();
    let starter = TREE;
    let current = starter;
    let over = false;
    let resultText = "";
    let thinkTimer = null;
    let thinking = false;

    function markMode() {
        const modeBtns = document.querySelectorAll(".chess-mode-btn");
        for (let i = 0; i < modeBtns.length; i++) {
            modeBtns[i].classList.toggle("on", modeBtns[i].getAttribute("data-mode") === playMode);
        }
        const levelBtns = document.querySelectorAll(".chess-level-btn");
        for (let i = 0; i < levelBtns.length; i++) {
            levelBtns[i].classList.toggle("on", levelBtns[i].getAttribute("data-level") === difficulty);
        }
        document.getElementById("chess-diff").hidden = playMode !== "computer";
    }

    function markCurrentSize() {
        const btns = document.querySelectorAll(".chess-size-btn");
        for (let i = 0; i < btns.length; i++) {
            btns[i].classList.toggle("on", Number(btns[i].getAttribute("data-size")) === boardSize);
        }
    }

    function stopThinking() {
        if (thinkTimer) {
            clearTimeout(thinkTimer);
            thinkTimer = null;
        }
        thinking = false;
    }

    function applyMove(index) {
        const result = place(board, index, current);
        if (!result.ok) {
            return false;
        }
        board = result.board;
        const won = winner(board);
        if (won) {
            over = true;
            resultText =
                playMode === "computer" && won === COMPUTER
                    ? "电脑赢了"
                    : sideName(won) + "赢了";
            playWinSound();
        } else if (isDeadlock(board)) {
            over = true;
            resultText = "平局";
            playDrawSound();
        } else {
            current = otherSide(current);
        }
        paint(board, current, over, resultText);
        if (!over) {
            maybeComputerTurn();
        }
        return true;
    }

    function maybeComputerTurn() {
        if (over || playMode !== "computer" || current !== COMPUTER) {
            return;
        }
        stopThinking();
        thinking = true;
        thinkTimer = setTimeout(function () {
            thinking = false;
            thinkTimer = null;
            if (over || playMode !== "computer" || current !== COMPUTER) {
                return;
            }
            const index = pickComputerMove(board, COMPUTER, difficulty);
            if (index >= 0) {
                applyMove(index);
            }
        }, 320);
    }

    function startFresh(keepStarter) {
        stopThinking();
        board = createBoard();
        if (!keepStarter) {
            starter = TREE;
        }
        current = starter;
        over = false;
        resultText = "";
        makeCells(boardEl);
        markCurrentSize();
        markMode();
        paint(board, current, over, resultText);
        maybeComputerTurn();
    }

    startFresh(true);

    function restartRound() {
        starter = otherSide(starter);
        startFresh(true);
    }

    document.getElementById("chess-restart").onclick = restartRound;
    document.getElementById("chess-overlay-restart").onclick = restartRound;

    document.getElementById("chess-sizes").onclick = function (event) {
        const btn = event.target.closest(".chess-size-btn");
        if (!btn) {
            return;
        }
        const nextSize = Number(btn.getAttribute("data-size"));
        if (nextSize === boardSize) {
            return;
        }
        boardSize = nextSize;
        startFresh(false);
    };

    document.getElementById("chess-modes").onclick = function (event) {
        const btn = event.target.closest(".chess-mode-btn");
        if (!btn) {
            return;
        }
        const nextMode = btn.getAttribute("data-mode");
        if (nextMode === playMode) {
            return;
        }
        playMode = nextMode;
        startFresh(false);
    };

    document.getElementById("chess-levels").onclick = function (event) {
        const btn = event.target.closest(".chess-level-btn");
        if (!btn) {
            return;
        }
        difficulty = btn.getAttribute("data-level");
        markMode();
    };

    boardEl.onclick = function (event) {
        const cell = event.target.closest(".chess-cell");
        if (!cell || over || thinking) {
            return;
        }
        if (playMode === "computer" && current === COMPUTER) {
            return;
        }
        applyMove(Number(cell.getAttribute("data-index")));
    };
}

connectChess();
