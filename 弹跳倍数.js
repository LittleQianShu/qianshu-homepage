let gateBalls = [];
let gateFlashes = [];
let gateLanes = [2, 8, 4, 8, 2];
let gateLaneGot = [0, 0, 0, 0, 0];
let gateScore = 0;
let gateToolLv = [31, 4, 46, 24, 37, 8, 23];
let gateLeft = 0;
let gateTick = null;
let gateSpawn = 0;
let gateId = 1;
let gateBoost = 1;
let gateSplit = 0;
let gateSlow = 0;
let gateCenter = 16;

const GATE_TOOLS = [
    { id: "line", mark: "···", name: "分线", mul: 2 },
    { id: "ball2", mark: "×2", name: "球加倍", mul: 2 },
    { id: "one", mark: "∷", name: "再丢一颗", mul: 1 },
    { id: "spread", mark: "⫸", name: "散开三颗", mul: 3 },
    { id: "shield", mark: "⛨", name: "减速盾", mul: 1 },
    { id: "door2", mark: "×2", name: "门加倍", mul: 2 },
    { id: "meteor", mark: "☄", name: "流星球", mul: 8 }
];

const GATE_HUES = [
    { bg: "#7CFF3A", glow: "#7CFF3A", ink: "#063010" },
    { bg: "#FF8A1A", glow: "#FF8A1A", ink: "#3A1400" },
    { bg: "#C56BFF", glow: "#C56BFF", ink: "#2A0840" },
    { bg: "#3DFFF2", glow: "#3DFFF2", ink: "#042828" },
    { bg: "#FFE14A", glow: "#FFE14A", ink: "#3A2A00" }
];

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
    tip.textContent = "还剩 " + gateLeft + " 秒 · 收到 " + shortNum(gateScore) + " · 小小的球来回弹";
}

function laneCount() {
    return gateLanes.length;
}

function ballRadius(ball) {
    return 7;
}

function addFlash(ball) {
    gateFlashes.push({
        x: ball.x,
        y: ball.y,
        n: ball.n,
        color: ball.color,
        parts: ball.parts.slice(),
        life: 22
    });
}

function paintOrb(x, y, size, hue, inner, extraClass) {
    return '<div class="gate-orb' + extraClass + '" style="left:' + (x - size / 2) +
        "px;top:" + (y - size / 2) + "px;width:" + size + "px;height:" + size +
        "px;--hue:" + hue.bg + ";--ink:" + hue.ink + '">' + inner + "</div>";
}

function paintGate() {
    const arena = document.getElementById("gateArena");
    if (!arena) {
        return;
    }
    const w = arena.clientWidth || 640;
    const h = arena.clientHeight || 520;
    const n = laneCount();
    const slabW = Math.min(86, (w - 36) / n - 6);
    const rowY = h * 0.48;
    let html = '<div class="gate-hex"></div><div class="gate-mist"></div>';
    html += '<div class="gate-core"><b>×' + gateCenter + "</b><i>" + gateBalls.length + "</i></div>";
    for (let i = 0; i < n; i++) {
        const left = 18 + i * (w - 36) / n + ((w - 36) / n - slabW) / 2;
        html += '<button type="button" class="gate-slab" data-gate-lane="' + i + '" style="left:' +
            left + "px;top:" + rowY + "px;width:" + slabW + 'px"><em>' +
            shortNum(gateLaneGot[i]) + "</em><b>×" + gateLanes[i] + "</b></button>";
    }
    for (let i = 0; i < gateBalls.length; i++) {
        const ball = gateBalls[i];
        const hue = GATE_HUES[ball.color % GATE_HUES.length];
        const size = 14;
        html += paintOrb(ball.x, ball.y, size, hue, "<strong>" + shortNum(ball.n) + "</strong>", " tail tiny");
    }
    html += '<div class="gate-tools">';
    for (let i = 0; i < GATE_TOOLS.length; i++) {
        html += '<button type="button" class="gate-tool" data-gate-tool="' + GATE_TOOLS[i].id +
            '" title="' + GATE_TOOLS[i].name + '"><small>' + gateToolLv[i] + "</small><span>" +
            GATE_TOOLS[i].mark + "</span></button>";
    }
    html += "</div>";
    arena.innerHTML = html;
}

function dropGateBall(opt) {
    const arena = document.getElementById("gateArena");
    const w = arena ? arena.clientWidth || 640 : 640;
    const h = arena ? arena.clientHeight || 520 : 520;
    const n = laneCount();
    const lane = opt && opt.lane != null ? opt.lane : Math.floor(Math.random() * n);
    const laneW = (w - 40) / n;
    const x = opt && opt.x != null ? opt.x : (20 + lane * laneW + laneW / 2);
    const startN = (opt && opt.n) || pickByLevel("gate", [2, 4, 8, 16]);
    const n0 = startN * gateBoost;
    gateBoost = 1;
    const go = pickByLevel("gate", [2.2, 2.8, 3.4, 4.2]);
    const dir = Math.random() < 0.5 ? -1 : 1;
    gateBalls.push({
        id: gateId,
        lane: lane,
        x: x,
        y: opt && opt.y != null ? opt.y : 70,
        vx: dir * go,
        vy: go * (0.7 + Math.random() * 0.6),
        n: n0,
        cool: 0,
        slabCool: 0,
        burst: 0,
        color: lane + gateId,
        parts: [
            1 + (gateId % 9),
            100 + ((gateId * 17) % 800),
            200 + ((gateId * 31) % 700)
        ]
    });
    gateId += 1;
    if (gateSplit > 0 && !(opt && opt.noSplit)) {
        gateSplit -= 1;
        dropGateBall({ lane: (lane + 1) % n, n: startN, noSplit: true, y: 80 });
    }
}

function bumpGate(lane) {
    if (!gateOpen() || gateLeft <= 0) {
        return;
    }
    const next = { 2: 4, 4: 8, 8: 16, 16: 32, 32: 2 };
    gateLanes[lane] = next[gateLanes[lane]] || 2;
    if (typeof playTone === "function") {
        playTone(400 + gateLanes[lane] * 20, 0.1);
    }
    paintGate();
}

function hitSkill(ball, slot) {
    const tool = GATE_TOOLS[slot];
    if (!tool) {
        return;
    }
    gateToolLv[slot] += 1;
    ball.n *= tool.mul;
    ball.parts[0] = 1 + (ball.id % 9);
    ball.parts[1] = 100 + Math.floor(ball.n % 900);
    ball.parts[2] = 200 + Math.floor((ball.n / 3) % 800);
    ball.burst = 18;
    addFlash(ball);
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
    if (tool.id === "line") {
        gateSplit += 1;
        dropGateBall({ x: ball.x, y: ball.y - 20, n: Math.max(2, Math.floor(ball.n / 4)), noSplit: true });
    } else if (tool.id === "one" || tool.id === "spread") {
        const times = tool.id === "spread" ? 3 : 1;
        for (let i = 0; i < times; i++) {
            dropGateBall({ x: ball.x + (i - 1) * 24, y: ball.y - 16, n: Math.max(2, Math.floor(ball.n / 8)), noSplit: true });
        }
    } else if (tool.id === "shield") {
        gateSlow = 40;
    } else if (tool.id === "door2") {
        for (let i = 0; i < gateLanes.length; i++) {
            const next = { 2: 4, 4: 8, 8: 16, 16: 32, 32: 2 };
            gateLanes[i] = next[gateLanes[i]] || 2;
        }
    }
    if (typeof playTone === "function") {
        playTone(700, 0.1);
    }
}

function useGateTool(id) {
    if (!gateOpen() || gateLeft <= 0) {
        return;
    }
    let slot = 0;
    for (let i = 0; i < GATE_TOOLS.length; i++) {
        if (GATE_TOOLS[i].id === id) {
            slot = i;
        }
    }
    if (gateBalls[0]) {
        hitSkill(gateBalls[0], slot);
        gateBalls[0].vy = -Math.abs(gateBalls[0].vy);
        gateBalls[0].cool = 16;
    }
    paintGate();
}

function tickGate() {
    if (!gateOpen()) {
        stopGate();
        return;
    }
    const arena = document.getElementById("gateArena");
    const w = arena ? arena.clientWidth || 640 : 640;
    const h = arena ? arena.clientHeight || 520 : 520;
    const n = laneCount();
    const slabTop = h * 0.48;
    const slabH = 58;
    const toolTop = h - 70;
    const slow = gateSlow > 0 ? 0.4 : 1;
    if (gateSlow > 0) {
        gateSlow -= 1;
    }
    const nextFlashes = [];
    for (let i = 0; i < gateFlashes.length; i++) {
        gateFlashes[i].life -= 1;
        if (gateFlashes[i].life > 0) {
            nextFlashes.push(gateFlashes[i]);
        }
    }
    gateFlashes = nextFlashes;
    for (let i = 0; i < gateBalls.length; i++) {
        const ball = gateBalls[i];
        const r = ballRadius(ball);
        if (ball.cool > 0) {
            ball.cool -= 1;
        }
        if (ball.slabCool > 0) {
            ball.slabCool -= 1;
        }
        if (ball.burst > 0) {
            ball.burst -= 1;
        }
        ball.x += ball.vx * slow;
        ball.y += ball.vy * slow;
        if (ball.x < r) {
            ball.x = r;
            ball.vx = Math.abs(ball.vx);
        }
        if (ball.x > w - r) {
            ball.x = w - r;
            ball.vx = -Math.abs(ball.vx);
        }
        if (ball.y < r + 8) {
            ball.y = r + 8;
            ball.vy = Math.abs(ball.vy);
        }
        if (ball.y + r > toolTop) {
            ball.y = toolTop - r;
            ball.vy = -Math.abs(ball.vy);
            if (ball.cool <= 0) {
                const slot = Math.max(0, Math.min(GATE_TOOLS.length - 1, Math.floor(ball.x / w * GATE_TOOLS.length)));
                hitSkill(ball, slot);
                ball.cool = 18;
            }
        }
        if (ball.slabCool <= 0 && ball.y + r > slabTop && ball.y - r < slabTop + slabH) {
            const laneW = (w - 36) / n;
            const lane = Math.max(0, Math.min(n - 1, Math.floor((ball.x - 18) / laneW)));
            const slabW = Math.min(86, laneW - 6);
            const left = 18 + lane * laneW + (laneW - slabW) / 2;
            if (ball.x > left && ball.x < left + slabW) {
                ball.n *= gateLanes[lane];
                gateLaneGot[lane] += ball.n;
                ball.vy = -Math.abs(ball.vy);
                ball.y = slabTop - r;
                ball.slabCool = 14;
                if (typeof playTone === "function") {
                    playTone(520 + lane * 40, 0.08);
                }
            }
        }
    }
    gateSpawn += 1;
    const every = pickByLevel("gate", [28, 22, 16, 12]);
    if (gateLeft > 0 && gateSpawn % every === 0 && gateBalls.length < 10) {
        dropGateBall();
    }
    showGateInfo();
    paintGate();
}

function startGate() {
    stopGate();
    gateBalls = [];
    gateFlashes = [];
    gateLanes = pickByLevel("gate", [
        [2, 2, 4, 2, 2],
        [2, 8, 4, 8, 2],
        [4, 8, 16, 8, 4],
        [8, 16, 32, 16, 8]
    ]).slice();
    gateLaneGot = [0, 0, 0, 0, 0];
    gateToolLv = [31, 4, 46, 24, 37, 8, 23];
    gateScore = 0;
    gateLeft = pickByLevel("gate", [45, 35, 28, 22]);
    gateSpawn = 0;
    gateId = 1;
    gateBoost = 1;
    gateSplit = 0;
    gateSlow = 0;
    gateCenter = pickByLevel("gate", [8, 16, 16, 32]);
    dropGateBall();
    dropGateBall();
    dropGateBall();
    showGateInfo();
    paintGate();
    let acc = 0;
    gateTick = setInterval(function () {
        acc += 50;
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
        if (gateLeft <= 0) {
            stopGate();
            showGateInfo();
        }
    }, 50);
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
                return;
            }
            const tool = event.target.closest("[data-gate-tool]");
            if (tool) {
                useGateTool(tool.getAttribute("data-gate-tool"));
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
