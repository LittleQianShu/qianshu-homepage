let duelTick = null;
let duelMe = null;
let duelFoe = null;
let duelDots = [];
let duelAim = 0;
let duelOver = "";
let duelSkillCool = {};
let duelUltCool = {};
let duelFoeUltCool = {};
let duelFoeThink = 0;
let duelFoeNextUlt = 0;
let duelPops = [];
let duelShake = 0;
let duelFlash = 0;
let duelHitBag = { me: 0, foe: 0 };

const DUEL_TICK_MS = 40;
const DUEL_ULTS = [
    { id: "flash", name: "闪光箭", mark: "⚡", wait: 5 },
    { id: "flood", name: "怒涛", mark: "🌊", wait: 7 },
    { id: "sky", name: "天降", mark: "☄️", wait: 9 },
    { id: "nova", name: "全屏爆", mark: "🔆", wait: 12 },
    { id: "final", name: "终焉", mark: "👑", wait: 15 }
];

const DUEL_SKILLS = [
    { id: "bow", name: "弓", mark: "🏹" },
    { id: "shot", name: "散弹", mark: "💥" },
    { id: "ring", name: "环喷", mark: "⭕" },
    { id: "rain", name: "雨点", mark: "🌧️" },
    { id: "sweep", name: "横扫", mark: "➡️" },
    { id: "spiral", name: "螺旋", mark: "🌀" },
    { id: "cross", name: "十字", mark: "✚" },
    { id: "burst", name: "星爆", mark: "✨" },
    { id: "wave", name: "波浪", mark: "🌊" },
    { id: "storm", name: "风暴", mark: "🌪️" },
    { id: "fan", name: "大扇", mark: "🪭" },
    { id: "shield", name: "护盾", mark: "🛡️" }
];

function duelOpen() {
    return document.body.classList.contains("play") &&
        document.body.classList.contains("now-duel");
}

function fitDuelArena() {
    const arena = document.getElementById("duelArena");
    const room = arena ? arena.closest(".duel-room") : null;
    if (!arena || !room) {
        return;
    }
    const dock = document.getElementById("gameDock");
    const dockH = dock && dock.offsetHeight ? dock.offsetHeight : 150;
    const padTop = parseFloat(window.getComputedStyle(room).paddingTop) || 76;
    let other = 0;
    for (let i = 0; i < room.children.length; i++) {
        const el = room.children[i];
        if (el === arena) {
            continue;
        }
        const st = window.getComputedStyle(el);
        other += el.offsetHeight + (parseFloat(st.marginTop) || 0) + (parseFloat(st.marginBottom) || 0);
    }
    const maxH = Math.max(150, room.clientHeight - padTop - dockH - 18 - other);
    const maxW = Math.max(220, room.clientWidth - 24);
    const s = Math.min(1, maxW / 720, maxH / 400);
    arena.style.width = Math.round(720 * s) + "px";
    arena.style.height = Math.round(400 * s) + "px";
}

function stopDuel() {
    if (duelTick) {
        clearInterval(duelTick);
        duelTick = null;
    }
}

function makeFighter(side, hue) {
    return {
        side: side,
        x: side === "me" ? 160 : 560,
        y: 200,
        r: 38,
        hue: hue,
        atk: side === "me" ? pickByLevel("duel", [18, 24, 30, 36]) : pickByLevel("duel", [20, 26, 32, 38]),
        def: side === "me" ? 1000 : 1500,
        shield: 0,
        hit: 0,
        alive: true,
        cool: 0
    };
}

function showDuelInfo() {
    const tip = document.getElementById("duelInfo");
    if (!tip || !duelMe || !duelFoe) {
        return;
    }
    if (duelOver) {
        tip.textContent = duelOver;
        return;
    }
    tip.textContent = "你有 1000 血，它有 1500 血。对手按人的速度出手：过一秒放技能，隔几秒放大招。血量到 0 再被打到，颜色就消失。";
}

function buildSkills() {
    const bar = document.getElementById("duelSkills");
    if (!bar || bar.getAttribute("data-ready") === "1") {
        return;
    }
    let html = "";
    for (let i = 0; i < DUEL_SKILLS.length; i++) {
        const sk = DUEL_SKILLS[i];
        html += '<button type="button" class="sound-btn duel-skill" data-duel-skill="' +
            sk.id + '">' + sk.mark + " " + sk.name + "</button>";
    }
    bar.innerHTML = html;
    bar.setAttribute("data-ready", "1");
}

function buildUlts() {
    const bar = document.getElementById("duelUlts");
    if (!bar || bar.getAttribute("data-ready") === "1") {
        return;
    }
    let html = "";
    for (let i = 0; i < DUEL_ULTS.length; i++) {
        const sk = DUEL_ULTS[i];
        html += '<button type="button" class="sound-btn duel-ult" data-duel-ult="' +
            sk.id + '">' + sk.mark + " " + sk.name + "<small>" + sk.wait + "秒</small></button>";
    }
    bar.innerHTML = html;
    bar.setAttribute("data-ready", "1");
}

function ultById(id) {
    for (let i = 0; i < DUEL_ULTS.length; i++) {
        if (DUEL_ULTS[i].id === id) {
            return DUEL_ULTS[i];
        }
    }
    return null;
}

function paintSkills() {
    const bar = document.getElementById("duelSkills");
    if (!bar) {
        return;
    }
    const btns = bar.querySelectorAll("[data-duel-skill]");
    for (let i = 0; i < btns.length; i++) {
        const id = btns[i].getAttribute("data-duel-skill");
        const wait = duelSkillCool[id] || 0;
        btns[i].classList.toggle("is-wait", wait > 0);
    }
    const ultBar = document.getElementById("duelUlts");
    if (!ultBar) {
        return;
    }
    const ults = ultBar.querySelectorAll("[data-duel-ult]");
    for (let i = 0; i < ults.length; i++) {
        const spec = ultById(ults[i].getAttribute("data-duel-ult"));
        const wait = spec ? (duelUltCool[spec.id] || 0) : 0;
        const sec = Math.ceil(wait * DUEL_TICK_MS / 1000);
        ults[i].classList.toggle("is-wait", wait > 0);
        const small = ults[i].querySelector("small");
        if (small && spec) {
            small.textContent = wait > 0 ? sec + "秒" : spec.wait + "秒";
        }
    }
}

function paintDuel() {
    const arena = document.getElementById("duelArena");
    if (!arena || !duelMe) {
        return;
    }
    fitDuelArena();
    const w = arena.clientWidth || 720;
    const h = arena.clientHeight || 400;
    const s = Math.min(w / 720, h / 400);
    duelMe.r = 38 * s;
    duelFoe.r = 38 * s;
    duelMe.x = 160 * s;
    duelFoe.x = w - 160 * s;
    duelMe.y = h / 2;
    duelFoe.y = h / 2;
    let html = "";
    function drawOne(who, aim) {
        if (!who.alive) {
            html += '<div class="duel-gone" style="left:' + (who.x - who.r) + "px;top:" +
                (who.y - who.r) + "px;width:" + (who.r * 2) + "px;height:" + (who.r * 2) + 'px"></div>';
            return;
        }
        const deg = aim * 180 / Math.PI;
        html += '<div class="duel-body' + ((who.hit || 0) > 0 ? " is-hit" : "") + '" style="left:' +
            (who.x - who.r) + "px;top:" + (who.y - who.r) + "px;width:" + (who.r * 2) +
            "px;height:" + (who.r * 2) + "px;font-size:" + (18 * s) + "px;--hue:" + who.hue + '">';
        html += '<i class="duel-nozzle" style="width:' + (28 * s) + "px;height:" + (10 * s) +
            "px;margin:" + (-5 * s) + "px 0 0 0;transform:rotate(" + deg + 'deg)"></i>';
        html += "<b>" + (who.side === "me" ? "我" : "它") + "</b>";
        html += "</div>";
    }
    function fillHud(id, who, mark) {
        const box = document.getElementById(id);
        if (!box || !who) {
            return;
        }
        box.textContent = mark + "　攻击 " + who.atk + "　血量 " + who.def + "　盾 " + who.shield;
        box.classList.toggle("is-hit", (who.hit || 0) > 0);
    }
    drawOne(duelMe, duelAim);
    drawOne(duelFoe, Math.PI);
    for (let i = 0; i < duelDots.length; i++) {
        const d = duelDots[i];
        const size = (d.huge ? 14 : d.big ? 10 : 7) * s;
        html += '<div class="duel-dot" style="left:' + (d.x - size / 2) + "px;top:" + (d.y - size / 2) +
            "px;width:" + size + "px;height:" + size + "px;background:" + d.hue + '"></div>';
    }
    const keepPop = [];
    for (let i = 0; i < duelPops.length; i++) {
        const p = duelPops[i];
        html += '<div class="duel-pop' + (p.big ? " big" : "") + '" style="left:' + p.x +
            "px;top:" + p.y + 'px">-' + p.n + "</div>";
        p.y -= 3;
        p.life -= 1;
        if (p.life > 0) {
            keepPop.push(p);
        }
    }
    duelPops = keepPop;
    if (duelFlash > 0) {
        html += '<div class="duel-flash"></div>';
        duelFlash -= 1;
    }
    arena.style.transform = duelShake > 0
        ? "translate(" + (Math.random() * 10 - 5) + "px," + (Math.random() * 8 - 4) + "px)"
        : "";
    if (duelShake > 0) {
        duelShake -= 1;
    }
    arena.innerHTML = html;
    fillHud("duelMeHud", duelMe, "我");
    fillHud("duelFoeHud", duelFoe, "它");
    paintSkills();
}

function punchOf(who) {
    return Math.max(2, Math.round((who && who.atk ? who.atk : 18) / 6));
}

function addPop(who, n, big) {
    if (!who || n <= 0) {
        return;
    }
    duelPops.push({
        x: who.x - 10,
        y: who.y - who.r - 18,
        n: n,
        life: big ? 22 : 14,
        big: Boolean(big)
    });
}

function flushHits() {
    if (duelHitBag.me > 0 && duelMe) {
        addPop(duelMe, duelHitBag.me, duelHitBag.me >= 8);
        duelMe.hit = 6;
    }
    if (duelHitBag.foe > 0 && duelFoe) {
        addPop(duelFoe, duelHitBag.foe, duelHitBag.foe >= 8);
        duelFoe.hit = 6;
    }
    duelHitBag = { me: 0, foe: 0 };
}

function hurt(who, n) {
    n = Math.max(1, n || 1);
    if (!who || !who.alive) {
        return;
    }
    let took = 0;
    for (let i = 0; i < n && who.alive; i++) {
        if (who.shield > 0) {
            who.shield -= 1;
            took += 1;
            continue;
        }
        if (who.def > 0) {
            who.def -= 1;
            took += 1;
            continue;
        }
        who.alive = false;
        if (typeof playTone === "function") {
            playTone(180, 0.2);
        }
        if (who.side === "me") {
            duelOver = "你的颜色消失了。再来一局？";
        } else {
            duelOver = "它的颜色消失了！你赢了。";
            if (typeof celebrateWin === "function") {
                celebrateWin("对决赢了！");
            }
            if (typeof giveBadge === "function") {
                giveBadge("duel-first");
            }
        }
    }
    if (took > 0) {
        duelHitBag[who.side] += took;
        who.hit = 6;
        if (typeof playTone === "function" && who.alive) {
            playTone(who.side === "me" ? 300 : 620, 0.05);
        }
    }
}

function smash(who, n) {
    hurt(who, n);
}

function boom(who, n, shake) {
    smash(who, n);
    duelShake = Math.max(duelShake, shake || 8);
    duelFlash = Math.max(duelFlash, 5);
}

function otherOf(who) {
    return who.side === "me" ? duelFoe : duelMe;
}

function addDot(who, x, y, vx, vy, big, huge) {
    if (duelDots.length > 560) {
        return;
    }
    duelDots.push({
        x: x,
        y: y,
        vx: vx,
        vy: vy,
        hue: who.hue,
        from: who.side,
        big: Boolean(big),
        huge: Boolean(huge),
        pow: punchOf(who)
    });
}

function sprayFan(who, aim, count, spread, speed) {
    for (let i = 0; i < count; i++) {
        const a = aim + (i - (count - 1) / 2) * spread;
        addDot(who, who.x + Math.cos(a) * (who.r + 8), who.y + Math.sin(a) * (who.r + 8),
            Math.cos(a) * speed, Math.sin(a) * speed, count > 14);
    }
}

function useDuelSkill(id, who, aim) {
    if (!who || !who.alive || duelOver) {
        return;
    }
    const box = document.getElementById("duelArena");
    const w = box ? box.clientWidth || 720 : 720;
    const h = box ? box.clientHeight || 400 : 400;
    if (id === "bow") {
        boom(otherOf(who), 4, 3);
        sprayFan(who, aim, 18, 0.1, 6.2);
    } else if (id === "shot") {
        sprayFan(who, aim, 26, 0.16, 5.6);
    } else if (id === "ring") {
        for (let i = 0; i < 24; i++) {
            const a = i / 24 * Math.PI * 2;
            addDot(who, who.x, who.y, Math.cos(a) * 5.4, Math.sin(a) * 5.4, true);
        }
    } else if (id === "rain") {
        for (let i = 0; i < 22; i++) {
            addDot(who, 20 + i * (w - 40) / 21, 16, 0, 4.2 + Math.random(), false);
        }
    } else if (id === "sweep") {
        for (let i = 0; i < 20; i++) {
            addDot(who, 16, 20 + i * (h - 40) / 19, who.side === "me" ? 6 : -6, 0, true);
        }
    } else if (id === "spiral") {
        for (let i = 0; i < 20; i++) {
            const a = aim + i * 0.42;
            addDot(who, who.x, who.y, Math.cos(a) * (3.2 + i * 0.12), Math.sin(a) * (3.2 + i * 0.12), false);
        }
    } else if (id === "cross") {
        const dirs = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
        for (let d = 0; d < dirs.length; d++) {
            sprayFan(who, dirs[d], 8, 0.08, 6);
        }
    } else if (id === "burst") {
        for (let i = 0; i < 16; i++) {
            const a = i / 16 * Math.PI * 2;
            addDot(who, who.x, who.y, Math.cos(a) * 7, Math.sin(a) * 7, true);
        }
    } else if (id === "wave") {
        for (let i = 0; i < 18; i++) {
            const a = aim + Math.sin(i / 2) * 0.7;
            addDot(who, who.x, who.y, Math.cos(a) * 5.8, Math.sin(a) * 5.8, false);
        }
    } else if (id === "storm") {
        for (let i = 0; i < 28; i++) {
            const a = Math.random() * Math.PI * 2;
            addDot(who, who.x + (Math.random() - 0.5) * 40, who.y + (Math.random() - 0.5) * 40,
                Math.cos(a) * 4.8, Math.sin(a) * 4.8, true);
        }
    } else if (id === "fan") {
        sprayFan(who, aim, 32, 0.09, 5.4);
    } else if (id === "shield") {
        who.shield += 20;
    } else if (id === "flash") {
        boom(otherOf(who), 16 + punchOf(who), 7);
        sprayFan(who, aim, 22, 0.05, 8.4);
        sprayFan(who, aim, 22, 0.09, 7.6);
        sprayFan(who, aim, 16, 0.03, 9.2);
    } else if (id === "flood") {
        boom(otherOf(who), 24 + punchOf(who), 9);
        sprayFan(who, aim, 40, 0.12, 7.2);
        const go = who.side === "me" ? 7.2 : -7.2;
        for (let row = 0; row < 3; row++) {
            for (let i = 0; i < 22; i++) {
                addDot(who, 12 + i * (w - 24) / 21, who.y - 36 + row * 36, go, 0, true, true);
            }
        }
    } else if (id === "sky") {
        boom(otherOf(who), 30 + punchOf(who), 10);
        for (let wave = 0; wave < 3; wave++) {
            for (let i = 0; i < 28; i++) {
                addDot(who, 8 + i * (w - 16) / 27, 8 + wave * 18, (Math.random() - 0.5) * 1.6, 6.4 + wave * 0.4, true, true);
            }
        }
    } else if (id === "nova") {
        boom(otherOf(who), 38 + punchOf(who), 12);
        for (let ring = 0; ring < 3; ring++) {
            for (let i = 0; i < 36; i++) {
                const a = i / 36 * Math.PI * 2;
                const spd = 6.2 + ring * 1.4;
                addDot(who, who.x, who.y, Math.cos(a) * spd, Math.sin(a) * spd, true, ring === 0);
            }
        }
        sprayFan(who, aim, 28, 0.08, 8);
    } else if (id === "final") {
        boom(otherOf(who), 52 + punchOf(who), 14);
        who.shield += 24;
        for (let i = 0; i < 56; i++) {
            const a = i / 56 * Math.PI * 2;
            addDot(who, who.x, who.y, Math.cos(a) * 8.6, Math.sin(a) * 8.6, true, true);
        }
        for (let i = 0; i < 28; i++) {
            addDot(who, 10 + i * (w - 20) / 27, 10, 0, 7.4, true, true);
            addDot(who, 10 + i * (w - 20) / 27, h - 10, 0, -7.4, true, true);
            addDot(who, 10, 10 + i * (h - 20) / 27, who.side === "me" ? 7.4 : -7.4, 0, true, true);
            addDot(who, w - 10, 10 + i * (h - 20) / 27, who.side === "me" ? 7.4 : -7.4, 0, true, true);
        }
        sprayFan(who, aim, 24, 0.07, 8.8);
    }
    if (typeof playTone === "function") {
        playTone(id === "shield" ? 400 : 880, 0.1);
    }
    flushHits();
}

function foeAim() {
    if (!duelMe || !duelFoe) {
        return Math.PI;
    }
    return Math.atan2(duelMe.y - duelFoe.y, duelMe.x - duelFoe.x);
}

function thinkFoe() {
    if (!duelFoe || !duelFoe.alive || duelOver) {
        return;
    }
    if (duelFoeNextUlt > 0) {
        duelFoeNextUlt -= 1;
    }
    if (duelFoeThink > 0) {
        duelFoeThink -= 1;
        return;
    }
    duelFoeThink = 32 + Math.floor(Math.random() * 16);
    const aim = foeAim();
    const readyUlt = [];
    for (let i = 0; i < DUEL_ULTS.length; i++) {
        const ult = DUEL_ULTS[i];
        if ((duelFoeUltCool[ult.id] || 0) <= 0) {
            readyUlt.push(ult);
        }
    }
    if (readyUlt.length > 0 && duelFoeNextUlt <= 0) {
        const ult = readyUlt[Math.floor(Math.random() * readyUlt.length)];
        duelFoeUltCool[ult.id] = Math.round(ult.wait * 1000 / DUEL_TICK_MS);
        duelFoeNextUlt = 160 + Math.floor(Math.random() * 40);
        useDuelSkill(ult.id, duelFoe, aim);
        return;
    }
    const pick = DUEL_SKILLS[Math.floor(Math.random() * DUEL_SKILLS.length)].id;
    useDuelSkill(pick, duelFoe, aim);
}

function tickDuel() {
    if (!duelOpen()) {
        stopDuel();
        return;
    }
    const ids = Object.keys(duelSkillCool);
    for (let i = 0; i < ids.length; i++) {
        if (duelSkillCool[ids[i]] > 0) {
            duelSkillCool[ids[i]] -= 1;
        }
    }
    const ultIds = Object.keys(duelUltCool);
    for (let i = 0; i < ultIds.length; i++) {
        if (duelUltCool[ultIds[i]] > 0) {
            duelUltCool[ultIds[i]] -= 1;
        }
    }
    const foeUltIds = Object.keys(duelFoeUltCool);
    for (let i = 0; i < foeUltIds.length; i++) {
        if (duelFoeUltCool[foeUltIds[i]] > 0) {
            duelFoeUltCool[foeUltIds[i]] -= 1;
        }
    }
    const box = document.getElementById("duelArena");
    const bw = box ? box.clientWidth || 720 : 720;
    const bh = box ? box.clientHeight || 400 : 400;
    if (duelOver) {
        paintDuel();
        showDuelInfo();
        return;
    }
    if (duelMe.cool > 0) {
        duelMe.cool -= 1;
    }
    if (duelFoe.cool > 0) {
        duelFoe.cool -= 1;
    }
    const meWait = Math.max(6, 30 - Math.floor(duelMe.atk / 2));
    const foeWait = Math.max(12, 28 - Math.floor(duelFoe.atk / 3));
    if (duelMe.alive && duelMe.cool <= 0) {
        sprayFan(duelMe, duelAim, 7, 0.11, 5.4);
        duelMe.cool = meWait;
    }
    if (duelFoe.alive && duelFoe.cool <= 0) {
        sprayFan(duelFoe, foeAim(), 7, 0.11, 5.4);
        duelFoe.cool = foeWait;
    }
    thinkFoe();
    const remain = [];
    for (let i = 0; i < duelDots.length; i++) {
        const d = duelDots[i];
        d.x += d.vx;
        d.y += d.vy;
        const target = d.from === "me" ? duelFoe : duelMe;
        const dx = d.x - target.x;
        const dy = d.y - target.y;
        if (target.alive && dx * dx + dy * dy < (target.r + 5) * (target.r + 5)) {
            hurt(target, d.pow || 2);
            continue;
        }
        if (d.x > 4 && d.x < bw - 4 && d.y > 4 && d.y < bh - 4) {
            remain.push(d);
        }
    }
    duelDots = remain;
    if (duelMe && duelMe.hit > 0) {
        duelMe.hit -= 1;
    }
    if (duelFoe && duelFoe.hit > 0) {
        duelFoe.hit -= 1;
    }
    flushHits();
    paintDuel();
    showDuelInfo();
}

function startDuel() {
    stopDuel();
    duelDots = [];
    duelPops = [];
    duelShake = 0;
    duelFlash = 0;
    duelHitBag = { me: 0, foe: 0 };
    duelOver = "";
    duelAim = 0;
    duelSkillCool = {};
    duelUltCool = {};
    duelFoeUltCool = {};
    duelFoeThink = 20;
    duelFoeNextUlt = 70;
    duelMe = makeFighter("me", "#7CFF3A");
    duelFoe = makeFighter("foe", "#C56BFF");
    buildSkills();
    buildUlts();
    showDuelInfo();
    paintDuel();
    duelTick = setInterval(tickDuel, 40);
}

function clickDuelSkill(id) {
    if (!duelOpen() || !duelMe || !duelMe.alive || duelOver) {
        return;
    }
    if ((duelSkillCool[id] || 0) > 0) {
        return;
    }
    duelSkillCool[id] = 12;
    useDuelSkill(id, duelMe, duelAim);
    paintDuel();
}

function clickDuelUlt(id) {
    if (!duelOpen() || !duelMe || !duelMe.alive || duelOver) {
        return;
    }
    const spec = ultById(id);
    if (!spec || (duelUltCool[id] || 0) > 0) {
        return;
    }
    duelUltCool[id] = Math.round(spec.wait * 1000 / DUEL_TICK_MS);
    useDuelSkill(id, duelMe, duelAim);
    paintDuel();
}

function connectDuel() {
    const arena = document.getElementById("duelArena");
    const again = document.getElementById("duelRestart");
    const bar = document.getElementById("duelSkills");
    const ults = document.getElementById("duelUlts");
    if (arena) {
        arena.onmousemove = function (event) {
            if (!duelMe) {
                return;
            }
            const box = arena.getBoundingClientRect();
            const x = (event.clientX - box.left) * (arena.clientWidth / box.width);
            const y = (event.clientY - box.top) * (arena.clientHeight / box.height);
            duelAim = Math.atan2(y - duelMe.y, x - duelMe.x);
        };
    }
    if (bar) {
        bar.onpointerdown = function (event) {
            const btn = event.target.closest("[data-duel-skill]");
            if (!btn) {
                return;
            }
            event.preventDefault();
            clickDuelSkill(btn.getAttribute("data-duel-skill"));
        };
    }
    if (ults) {
        ults.onpointerdown = function (event) {
            const btn = event.target.closest("[data-duel-ult]");
            if (!btn) {
                return;
            }
            event.preventDefault();
            clickDuelUlt(btn.getAttribute("data-duel-ult"));
        };
    }
    buildSkills();
    buildUlts();
    if (again) {
        again.onclick = startDuel;
    }
}

connectDuel();
