const SNAKE_COLS = 16;
const SNAKE_ROWS = 12;
const SNAKE_STEP = 150;

let snakeBody = [];
let snakeDir = "right";
let snakeNext = "right";
let snakeFood = { x: 8, y: 4 };
let snakeTick = null;
let snakeScore = 0;
let snakeBest = 0;
let snakeOver = false;

function snakeOpen() {
    return document.body.classList.contains("play") &&
        document.body.classList.contains("now-snake");
}

function stopSnake() {
    if (snakeTick) {
        clearInterval(snakeTick);
        snakeTick = null;
    }
}

function snakeSame(a, b) {
    return a.x === b.x && a.y === b.y;
}

function snakeOnBody(x, y, skipTail) {
    const last = skipTail ? snakeBody.length - 1 : snakeBody.length;
    for (let i = 0; i < last; i++) {
        if (snakeBody[i].x === x && snakeBody[i].y === y) {
            return true;
        }
    }
    return false;
}

function placeSnakeFood() {
    const empty = [];
    for (let y = 0; y < SNAKE_ROWS; y++) {
        for (let x = 0; x < SNAKE_COLS; x++) {
            if (!snakeOnBody(x, y, false)) {
                empty.push({ x: x, y: y });
            }
        }
    }
    snakeFood = empty[Math.floor(Math.random() * empty.length)] || { x: 0, y: 0 };
}

function showSnakeInfo() {
    const info = document.getElementById("snakeInfo");
    const best = document.getElementById("snakeBest");
    if (info) {
        if (snakeOver) {
            info.textContent = "撞到了！吃到 " + snakeScore + " 颗星";
        } else {
            info.textContent = "吃到 " + snakeScore + " 颗星 · 方向键或下面按钮转弯";
        }
    }
    if (best) {
        best.textContent = "最高 " + snakeBest;
    }
}

function paintSnake() {
    const board = document.getElementById("snakeBoard");
    if (!board) {
        return;
    }
    board.innerHTML = "";
    for (let y = 0; y < SNAKE_ROWS; y++) {
        for (let x = 0; x < SNAKE_COLS; x++) {
            const cell = document.createElement("div");
            cell.className = "snake-cell";
            if (snakeSame(snakeFood, { x: x, y: y })) {
                cell.classList.add("food");
                cell.textContent = "⭐";
            }
            if (snakeOnBody(x, y, false)) {
                cell.classList.add(snakeSame(snakeBody[0], { x: x, y: y }) ? "head" : "body");
                if (snakeSame(snakeBody[0], { x: x, y: y })) {
                    cell.textContent = "🌳";
                }
            }
            board.appendChild(cell);
        }
    }
}

function stepSnake() {
    if (!snakeOpen() || snakeOver) {
        return;
    }
    snakeDir = snakeNext;
    const head = snakeBody[0];
    const move = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[snakeDir];
    const next = { x: head.x + move[0], y: head.y + move[1] };
    const hitWall = next.x < 0 || next.y < 0 || next.x >= SNAKE_COLS || next.y >= SNAKE_ROWS;
    if (hitWall || snakeOnBody(next.x, next.y, true)) {
        snakeOver = true;
        stopSnake();
        showSnakeInfo();
        if (typeof noteGameBest === "function") {
            noteGameBest("snake", snakeScore);
        }
        if (snakeScore > 0 && typeof celebrateWin === "function") {
            celebrateWin("吃到 " + snakeScore + " 颗！");
        }
        return;
    }
    snakeBody.unshift(next);
    if (snakeSame(next, snakeFood)) {
        snakeScore += 1;
        if (snakeScore > snakeBest) {
            snakeBest = snakeScore;
        }
        if (typeof giveBadge === "function") {
            if (snakeScore >= 5) {
                giveBadge("snake-5");
            }
            if (snakeScore >= 15) {
                giveBadge("snake-15");
            }
        }
        placeSnakeFood();
    } else {
        snakeBody.pop();
    }
    showSnakeInfo();
    paintSnake();
}

function turnSnake(dir) {
    const back = { left: "right", right: "left", up: "down", down: "up" };
    if (snakeOver || back[dir] === snakeDir) {
        return;
    }
    snakeNext = dir;
}

function startSnake() {
    stopSnake();
    snakeBody = [{ x: 4, y: 6 }, { x: 3, y: 6 }, { x: 2, y: 6 }];
    snakeDir = "right";
    snakeNext = "right";
    snakeScore = 0;
    snakeOver = false;
    placeSnakeFood();
    showSnakeInfo();
    paintSnake();
    snakeTick = setInterval(stepSnake, pickByLevel("snake", [220, 150, 110, 75]));
}

function connectSnake() {
    const again = document.getElementById("snakeRestart");
    const pad = document.getElementById("snakePad");
    if (again) {
        again.onclick = startSnake;
    }
    if (pad) {
        pad.onclick = function (event) {
            const btn = event.target.closest("[data-snake-dir]");
            if (!btn) {
                return;
            }
            turnSnake(btn.getAttribute("data-snake-dir"));
        };
    }
    document.addEventListener("keydown", function (event) {
        if (!snakeOpen()) {
            return;
        }
        const keys = {
            ArrowLeft: "left",
            ArrowRight: "right",
            ArrowUp: "up",
            ArrowDown: "down",
            a: "left",
            d: "right",
            w: "up",
            s: "down",
            A: "left",
            D: "right",
            W: "up",
            S: "down"
        };
        const dir = keys[event.key];
        if (!dir) {
            return;
        }
        event.preventDefault();
        turnSnake(dir);
    });
}

connectSnake();
