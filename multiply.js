let gateBalls = [];
let gateLanes = [2, 2, 4];
let gateScore = 0;
let gateLeft = 0;
let gateTick = null;
let gateSpawn = 0;
let gateId = 1;

function gateOpen() {
    return document.body.classList.contains("play") &&
        document.body.classList.contains("now-gate");
}

function shortNum(n) {
    if (n >= 1000000) {
        return (n / 1000000).toFixed(1).replace(".0", "") + "M";
    }
    if (n >= 1000) {
        return (n / 1000).toFixed(1).replace(".0", "") + "K";
    }
    return String(Math.floor(n));
}

function stopGate() {
    if (gateTick) {
        clearInterval(gateTick);
        gateTick = null;
    }
}

function showGateInfo() {
    const tip = document.getElementById("gateInfo");
    if (!tip) {
        return;
    }
    if (gateLeft <= 0 && gateScore > 0) {
        tip.textContent = "时间到！这一局收到 " + shortNum(gateScore);
        return;
    }
    tip.textContent = "还剩 " + gateLeft + " 秒 · 收到 " + shortNum(gateScore) + " · 点门会变大倍数";
}

function paintGate() {
    const arena = document.getElementById("gateArena");
    if (!arena) {
        return;
    }
    arena.innerHTML = "";
    const w = arena.clientWidth || 480;
    const h = arena.clientHeight || 340;
    const laneW = w / 3;
    for (let i = 0; i < 3; i++) {
        const door = document.createElement("button");
        door.type = "button";
        door.className = "gate-door hue-" + gateLanes[i];
        door.style.left = i * laneW + laneW / 2 - 50 + "px";
        door.innerHTML =
            '<span class="gate-key" aria-hidden="true"></span>' +
            '<span class="gate-mul">×' + gateLanes[i] + "</span>";
        door.setAttribute("data-gate-lane", String(i));
        arena.appendChild(door);
    }
    for (let i = 0; i < gateBalls.length; i++) {
        const ball = gateBalls[i];
        const el = document.createElement("div");
        el.className = "gate-ball c" + (ball.lane % 3);
        el.style.left = ball.lane * laneW + laneW / 2 - 22 + "px";
        el.style.top = ball.y + "px";
        el.textContent = shortNum(ball.n);
        arena.appendChild(el);
    }
}

function dropGateBall() {
    gateBalls.push({
        id: gateId,
        lane: Math.floor(Math.random() * 3),
        y: 8,
        n: pickByLevel("gate", [1, 1, 2, 3]),
        hit: false
    });
    gateId += 1;
}

function bumpGate(lane) {
    if (!gateOpen() || gateLeft <= 0) {
        return;
    }
    const next = { 2: 4, 4: 8, 8: 16, 16: 32 };
    gateLanes[lane] = next[gateLanes[lane]] || 2;
    if (typeof playTone === "function") {
        playTone(400 + gateLanes[lane] * 20, 0.1);
    }
    paintGate();
}

function tickGate() {
    if (!gateOpen()) {
        stopGate();
        return;
    }
    const arena = document.getElementById("gateArena");
    const h = arena ? arena.clientHeight || 340 : 340;
    const doorY = h * 0.58;
    const speed = pickByLevel("gate", [3, 4.5, 6.5, 9]);
    const remain = [];
    for (let i = 0; i < gateBalls.length; i++) {
        const ball = gateBalls[i];
        ball.y += speed;
        if (!ball.hit && ball.y >= doorY) {
            ball.n *= gateLanes[ball.lane];
            ball.hit = true;
            if (typeof playTone === "function") {
                playTone(520 + ball.lane * 60, 0.08);
            }
        }
        if (ball.y > h - 8) {
            gateScore += ball.n;
            if (typeof noteGameBest === "function") {
                noteGameBest("gate", Math.floor(gateScore));
            }
            if (typeof giveBadge === "function") {
                giveBadge("gate-first");
                if (gateScore >= 1000000) {
                    giveBadge("gate-1m");
                }
            }
        } else {
            remain.push(ball);
        }
    }
    gateBalls = remain;
    gateSpawn += 1;
    const every = pickByLevel("gate", [18, 14, 10, 7]);
    if (gateLeft > 0 && gateSpawn % every === 0) {
        dropGateBall();
    }
    showGateInfo();
    paintGate();
}

function startGate() {
    stopGate();
    gateBalls = [];
    gateLanes = pickByLevel("gate", [[2, 2, 2], [2, 2, 4], [2, 4, 8], [4, 8, 16]]);
    gateScore = 0;
    gateLeft = pickByLevel("gate", [45, 35, 28, 22]);
    gateSpawn = 0;
    gateId = 1;
    dropGateBall();
    dropGateBall();
    showGateInfo();
    paintGate();
    let acc = 0;
    gateTick = setInterval(function () {
        acc += 80;
        if (acc >= 1000) {
            acc = 0;
            if (gateLeft > 0) {
                gateLeft -= 1;
                if (gateLeft === 0 && typeof celebrateWin === "function") {
                    celebrateWin("收到 " + shortNum(gateScore) + "！");
                }
            }
        }
        tickGate();
        if (gateLeft <= 0 && gateBalls.length === 0) {
            stopGate();
            showGateInfo();
        }
    }, 80);
}

function addGateBall() {
    if (!gateOpen() || gateLeft <= 0) {
        return;
    }
    dropGateBall();
    paintGate();
}

function connectGate() {
    const arena = document.getElementById("gateArena");
    const again = document.getElementById("gateRestart");
    const extra = document.getElementById("gateDrop");
    if (arena) {
        arena.onclick = function (event) {
            const door = event.target.closest("[data-gate-lane]");
            if (door) {
                bumpGate(Number(door.getAttribute("data-gate-lane")));
            }
        };
    }
    if (again) {
        again.onclick = startGate;
    }
    if (extra) {
        extra.onclick = addGateBall;
    }
}

connectGate();
