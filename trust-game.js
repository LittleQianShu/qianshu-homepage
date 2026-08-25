const TRUST_RIVALS = [
    { name: "老实人", tip: "他好像从来都不骗人" },
    { name: "骗子", tip: "他看起来不太老实" },
    { name: "学样的", tip: "你上回合出什么，他就学什么" },
    { name: "记仇的", tip: "你骗过他一次，他就一直记着" },
    { name: "随缘的", tip: "他每次都在心里扔硬币" }
];

let trustRival = 0;
let trustRound = 0;
let trustMyTotal = 0;
let trustTheirRound = 0;
let trustMyLast = "coop";
let trustGrudge = false;
let trustBusy = false;

function trustPay(mine, theirs) {
    if (mine === "coop" && theirs === "coop") {
        return { me: 2, them: 2, cell: "cc" };
    }
    if (mine === "cheat" && theirs === "coop") {
        return { me: 3, them: -1, cell: "xc" };
    }
    if (mine === "coop" && theirs === "cheat") {
        return { me: -1, them: 3, cell: "cx" };
    }
    return { me: 0, them: 0, cell: "xx" };
}

function trustThink(mineLast) {
    const name = TRUST_RIVALS[trustRival].name;
    if (name === "老实人") {
        return "coop";
    }
    if (name === "骗子") {
        return "cheat";
    }
    if (name === "学样的") {
        return mineLast;
    }
    if (name === "记仇的") {
        return trustGrudge ? "cheat" : "coop";
    }
    return Math.random() < 0.5 ? "coop" : "cheat";
}

function trustFace(who, mine, theirs) {
    const el = document.getElementById(who === "me" ? "trustMe" : "trustThem");
    if (!el) {
        return;
    }
    el.classList.remove("is-happy", "is-smirk", "is-sad", "is-mad");
    if (who === "me") {
        if (mine === "cheat" && theirs === "coop") {
            el.classList.add("is-smirk");
        } else if (mine === "coop" && theirs === "cheat") {
            el.classList.add("is-sad");
        } else if (mine === "cheat" && theirs === "cheat") {
            el.classList.add("is-mad");
        } else {
            el.classList.add("is-happy");
        }
        return;
    }
    if (theirs === "cheat" && mine === "coop") {
        el.classList.add("is-smirk");
    } else if (theirs === "coop" && mine === "cheat") {
        el.classList.add("is-sad");
    } else if (mine === "cheat" && theirs === "cheat") {
        el.classList.add("is-mad");
    } else {
        el.classList.add("is-happy");
    }
}

function paintTrust() {
    const rival = TRUST_RIVALS[trustRival];
    const who = document.getElementById("trustWho");
    const total = document.getElementById("trustTotal");
    const myBox = document.getElementById("trustMyBox");
    const theirBox = document.getElementById("trustTheirBox");
    const tip = document.getElementById("trustTip");
    const again = document.getElementById("trustAgain");
    if (who) {
        who.textContent = "对手：" + (trustRival + 1) + " / 5　" + rival.name;
    }
    if (total) {
        total.textContent = "你的总分：" + trustMyTotal;
    }
    if (myBox) {
        myBox.textContent = String(trustMyTotal);
    }
    if (theirBox) {
        theirBox.textContent = String(trustTheirRound);
    }
    if (tip) {
        tip.textContent = "第 " + (trustRound + 1) + " 回合 · " + rival.tip;
    }
    if (again) {
        again.hidden = false;
    }
}

function markTrustCell(cell) {
    const cells = document.querySelectorAll(".trust-pay");
    for (let i = 0; i < cells.length; i++) {
        cells[i].classList.toggle("on", cells[i].getAttribute("data-cell") === cell);
    }
}

function startTrust() {
    trustRival = 0;
    trustRound = 0;
    trustMyTotal = 0;
    trustTheirRound = 0;
    trustMyLast = "coop";
    trustGrudge = false;
    trustBusy = false;
    markTrustCell("");
    const me = document.getElementById("trustMe");
    const them = document.getElementById("trustThem");
    if (me) {
        me.className = "trust-peep is-happy";
    }
    if (them) {
        them.className = "trust-peep is-happy";
    }
    const cheat = document.getElementById("trustCheat");
    const coop = document.getElementById("trustCoop");
    if (cheat) {
        cheat.disabled = false;
    }
    if (coop) {
        coop.disabled = false;
    }
    paintTrust();
}

function playTrust(mine) {
    if (trustBusy) {
        return;
    }
    const theirs = trustThink(trustMyLast);
    if (mine === "cheat") {
        trustGrudge = true;
    }
    const pay = trustPay(mine, theirs);
    trustMyTotal += pay.me;
    trustTheirRound += pay.them;
    trustMyLast = mine;
    trustFace("me", mine, theirs);
    trustFace("them", mine, theirs);
    markTrustCell(pay.cell);
    paintTrust();

    const tip = document.getElementById("trustTip");
    if (tip) {
        tip.textContent = (mine === "coop" ? "你合作" : "你骗人") +
            "，对方" + (theirs === "coop" ? "合作" : "骗人") +
            "。你 " + (pay.me >= 0 ? "+" : "") + pay.me +
            "，他 " + (pay.them >= 0 ? "+" : "") + pay.them;
    }

    trustBusy = true;
    setTimeout(function () {
        trustRound += 1;
        if (trustRound >= pickByLevel("trust", [3, 5, 6, 8])) {
            trustRival += 1;
            trustRound = 0;
            trustTheirRound = 0;
            trustMyLast = "coop";
            trustGrudge = false;
            markTrustCell("");
            const them = document.getElementById("trustThem");
            if (them) {
                them.className = "trust-peep is-happy";
            }
        }
        if (trustRival >= TRUST_RIVALS.length) {
            const tipEnd = document.getElementById("trustTip");
            const again = document.getElementById("trustAgain");
            const cheat = document.getElementById("trustCheat");
            const coop = document.getElementById("trustCoop");
            if (tipEnd) {
                tipEnd.textContent = "五位对手都打完了。你的总分是 " + trustMyTotal;
            }
            if (typeof giveBadge === "function") {
                giveBadge("trust-done");
            }
            if (typeof celebrateWin === "function") {
                celebrateWin("五位对手打完了！");
            }
            if (typeof noteGameBest === "function") {
                noteGameBest("trust", trustMyTotal, " 分");
            }
            if (again) {
                again.hidden = false;
            }
            if (cheat) {
                cheat.disabled = true;
            }
            if (coop) {
                coop.disabled = true;
            }
            trustBusy = false;
            return;
        }
        paintTrust();
        trustBusy = false;
    }, 900);
}

function connectTrustGame() {
    const cheat = document.getElementById("trustCheat");
    const coop = document.getElementById("trustCoop");
    const again = document.getElementById("trustAgain");
    if (!cheat || !coop) {
        return;
    }
    cheat.onclick = function () {
        playTrust("cheat");
    };
    coop.onclick = function () {
        playTrust("coop");
    };
    if (again) {
        again.onclick = startTrust;
    }
}

connectTrustGame();
