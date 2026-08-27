const GO_BLACK = "b";
const GO_WHITE = "w";

let goSize = 9;
let goMode = "human";

function goOther(color) {
    return color === GO_BLACK ? GO_WHITE : GO_BLACK;
}

function goName(color) {
    return color === GO_BLACK ? "黑子" : "白子";
}

function goEmpty(n) {
    const board = [];
    for (let i = 0; i < n * n; i++) {
        board.push("");
    }
    return board;
}

function goNear(i, n) {
    const r = Math.floor(i / n);
    const c = i % n;
    const out = [];
    if (r > 0) {
        out.push(i - n);
    }
    if (r < n - 1) {
        out.push(i + n);
    }
    if (c > 0) {
        out.push(i - 1);
    }
    if (c < n - 1) {
        out.push(i + 1);
    }
    return out;
}

function goGroup(board, start, n) {
    const color = board[start];
    const seen = {};
    const list = [];
    const stack = [start];
    seen[start] = true;
    while (stack.length) {
        const i = stack.pop();
        list.push(i);
        const near = goNear(i, n);
        for (let k = 0; k < near.length; k++) {
            const j = near[k];
            if (!seen[j] && board[j] === color) {
                seen[j] = true;
                stack.push(j);
            }
        }
    }
    return list;
}

function goLibs(board, group, n) {
    const air = {};
    for (let i = 0; i < group.length; i++) {
        const near = goNear(group[i], n);
        for (let k = 0; k < near.length; k++) {
            if (board[near[k]] === "") {
                air[near[k]] = true;
            }
        }
    }
    return Object.keys(air).length;
}

function goKey(board) {
    return board.join("");
}

function goTry(board, index, color, n, koKey) {
    if (index < 0 || index >= board.length || board[index] !== "") {
        return { ok: false };
    }
    const next = board.slice();
    next[index] = color;
    const foe = goOther(color);
    let took = 0;
    const seen = {};
    const near = goNear(index, n);
    for (let i = 0; i < near.length; i++) {
        const j = near[i];
        if (next[j] !== foe || seen[j]) {
            continue;
        }
        const pack = goGroup(next, j, n);
        for (let p = 0; p < pack.length; p++) {
            seen[pack[p]] = true;
        }
        if (goLibs(next, pack, n) === 0) {
            for (let p = 0; p < pack.length; p++) {
                next[pack[p]] = "";
                took += 1;
            }
        }
    }
    const mine = goGroup(next, index, n);
    if (goLibs(next, mine, n) === 0) {
        return { ok: false };
    }
    if (koKey && took === 1 && goKey(next) === koKey) {
        return { ok: false };
    }
    return { ok: true, board: next, took: took };
}

function goLegalList(board, color, n, koKey) {
    const list = [];
    for (let i = 0; i < board.length; i++) {
        if (goTry(board, i, color, n, koKey).ok) {
            list.push(i);
        }
    }
    return list;
}

function goScore(board, n) {
    const owner = [];
    for (let i = 0; i < board.length; i++) {
        owner[i] = board[i];
    }
    const seen = {};
    for (let i = 0; i < board.length; i++) {
        if (board[i] !== "" || seen[i]) {
            continue;
        }
        const stack = [i];
        const space = [];
        const touch = {};
        seen[i] = true;
        while (stack.length) {
            const cur = stack.pop();
            space.push(cur);
            const near = goNear(cur, n);
            for (let k = 0; k < near.length; k++) {
                const j = near[k];
                if (board[j] === "") {
                    if (!seen[j]) {
                        seen[j] = true;
                        stack.push(j);
                    }
                } else {
                    touch[board[j]] = true;
                }
            }
        }
        const colors = Object.keys(touch);
        if (colors.length === 1) {
            for (let s = 0; s < space.length; s++) {
                owner[space[s]] = colors[0];
            }
        }
    }
    let black = 0;
    let white = 0;
    for (let i = 0; i < owner.length; i++) {
        if (owner[i] === GO_BLACK) {
            black += 1;
        } else if (owner[i] === GO_WHITE) {
            white += 1;
        }
    }
    return { black: black, white: white + 6.5 };
}

function goPick(board, color, n, koKey) {
    const list = goLegalList(board, color, n, koKey);
    if (!list.length) {
        return -1;
    }
    let best = list[0];
    let bestScore = -1;
    for (let i = 0; i < list.length; i++) {
        const move = goTry(board, list[i], color, n, koKey);
        let s = move.took * 20;
        const r = Math.floor(list[i] / n);
        const c = list[i] % n;
        if (r > 1 && r < n - 2 && c > 1 && c < n - 2) {
            s += 2;
        }
        s += Math.random();
        if (s > bestScore) {
            bestScore = s;
            best = list[i];
        }
    }
    return best;
}

function connectGo() {
    const boardEl = document.getElementById("goBoard");
    const turnEl = document.getElementById("goTurn");
    const resultEl = document.getElementById("goResult");
    if (!boardEl || !turnEl) {
        return;
    }

    let board = goEmpty(goSize);
    let current = GO_BLACK;
    let over = false;
    let passes = 0;
    let prevKey = "";
    let koKey = "";
    let think = null;

    function paintTurn() {
        if (over) {
            return;
        }
        turnEl.textContent = "轮到：" + goName(current) + (goMode === "computer" && current === GO_WHITE ? "（电脑）" : "");
    }

    function paintBoard() {
        boardEl.style.setProperty("--go-n", String(goSize));
        const cells = boardEl.querySelectorAll(".go-point");
        for (let i = 0; i < cells.length; i++) {
            const v = board[i] || "";
            cells[i].className = "go-point" + (v === GO_BLACK ? " is-black" : v === GO_WHITE ? " is-white" : "");
        }
    }

    function makePoints() {
        boardEl.innerHTML = "";
        for (let i = 0; i < goSize * goSize; i++) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "go-point";
            btn.setAttribute("data-go", String(i));
            boardEl.appendChild(btn);
        }
        paintBoard();
    }

    function finish() {
        over = true;
        const sc = goScore(board, goSize);
        let text = "黑 " + sc.black + "　白 " + sc.white + "（白贴 6.5 目）　";
        if (sc.black > sc.white) {
            text += "黑胜";
        } else if (sc.white > sc.black) {
            text += "白胜";
        } else {
            text += "平了";
        }
        if (resultEl) {
            resultEl.textContent = text;
        }
        turnEl.textContent = "下完了";
        if (typeof playTone === "function") {
            playTone(620, 0.16);
        }
        if (typeof giveBadge === "function") {
            giveBadge("go-first");
        }
    }

    function afterMove(took) {
        koKey = took === 1 ? prevKey : "";
        prevKey = goKey(board);
        passes = 0;
        current = goOther(current);
        paintBoard();
        paintTurn();
        if (goMode === "computer" && current === GO_WHITE && !over) {
            think = setTimeout(computerMove, 380);
        }
    }

    function computerMove() {
        if (over) {
            return;
        }
        const i = goPick(board, GO_WHITE, goSize, koKey);
        if (i < 0) {
            doPass();
            return;
        }
        const move = goTry(board, i, GO_WHITE, goSize, koKey);
        board = move.board;
        afterMove(move.took);
        if (typeof playTone === "function") {
            playTone(480, 0.08);
        }
    }

    function doPass() {
        if (over) {
            return;
        }
        passes += 1;
        current = goOther(current);
        paintTurn();
        if (passes >= 2) {
            finish();
            return;
        }
        if (goMode === "computer" && current === GO_WHITE && !over) {
            think = setTimeout(computerMove, 280);
        }
    }

    function restart() {
        if (think) {
            clearTimeout(think);
            think = null;
        }
        board = goEmpty(goSize);
        current = GO_BLACK;
        over = false;
        passes = 0;
        prevKey = "";
        koKey = "";
        if (resultEl) {
            resultEl.textContent = "";
        }
        makePoints();
        paintTurn();
    }

    boardEl.onclick = function (event) {
        const btn = event.target.closest("[data-go]");
        if (!btn || over) {
            return;
        }
        if (goMode === "computer" && current === GO_WHITE) {
            return;
        }
        const i = Number(btn.getAttribute("data-go"));
        const move = goTry(board, i, current, goSize, koKey);
        if (!move.ok) {
            if (typeof playTone === "function") {
                playTone(220, 0.08);
            }
            return;
        }
        board = move.board;
        afterMove(move.took);
        if (typeof playTone === "function") {
            playTone(current === GO_WHITE ? 520 : 400, 0.08);
        }
    };

    const sizes = document.getElementById("goSizes");
    if (sizes) {
        sizes.onclick = function (event) {
            const btn = event.target.closest("[data-go-size]");
            if (!btn) {
                return;
            }
            goSize = Number(btn.getAttribute("data-go-size"));
            const all = sizes.querySelectorAll("[data-go-size]");
            for (let i = 0; i < all.length; i++) {
                all[i].classList.toggle("on", all[i] === btn);
            }
            restart();
        };
    }

    const modes = document.getElementById("goModes");
    if (modes) {
        modes.onclick = function (event) {
            const btn = event.target.closest("[data-go-mode]");
            if (!btn) {
                return;
            }
            goMode = btn.getAttribute("data-go-mode");
            const all = modes.querySelectorAll("[data-go-mode]");
            for (let i = 0; i < all.length; i++) {
                all[i].classList.toggle("on", all[i] === btn);
            }
            restart();
        };
    }

    const passBtn = document.getElementById("goPass");
    if (passBtn) {
        passBtn.onclick = doPass;
    }
    const again = document.getElementById("goRestart");
    if (again) {
        again.onclick = restart;
    }

    window.startGo = restart;
    restart();
}

connectGo();
