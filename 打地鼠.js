let moleScore = 0;
let moleBest = 0;
let moleLeft = 0;
let moleTimer = null;
let molePop = null;
let moleUp = -1;

function moleOpen() {
    return document.body.classList.contains("play") &&
        document.body.classList.contains("now-mole");
}

function stopMole() {
    if (moleTimer) {
        clearInterval(moleTimer);
        moleTimer = null;
    }
    if (molePop) {
        clearTimeout(molePop);
        molePop = null;
    }
    moleUp = -1;
}

function showMoleInfo() {
    const info = document.getElementById("moleInfo");
    const best = document.getElementById("moleBest");
    if (info) {
        if (moleLeft > 0) {
            info.textContent = "还剩 " + moleLeft + " 秒 · 敲到 " + moleScore + " 只";
        } else if (moleScore > 0) {
            info.textContent = "时间到！敲到 " + moleScore + " 只小树鼠";
        } else {
            info.textContent = "树洞里会冒出小树鼠，点到它就加分";
        }
    }
    if (best) {
        best.textContent = "最高 " + moleBest;
    }
}

function paintMole() {
    const holes = document.querySelectorAll(".mole-hole");
    for (let i = 0; i < holes.length; i++) {
        holes[i].classList.toggle("up", i === moleUp);
    }
}

function hideMoleSoon() {
    if (molePop) {
        clearTimeout(molePop);
    }
    const stay = Math.max(
        pickByLevel("mole", [700, 520, 380, 260]),
        pickByLevel("mole", [1200, 900, 700, 520]) - moleScore * 20
    );
    molePop = setTimeout(function () {
        moleUp = -1;
        paintMole();
        if (moleLeft > 0) {
            popMole();
        }
    }, stay);
}

function popMole() {
    if (!moleOpen() || moleLeft <= 0) {
        return;
    }
    let next = Math.floor(Math.random() * 9);
    if (next === moleUp) {
        next = (next + 1 + Math.floor(Math.random() * 8)) % 9;
    }
    moleUp = next;
    paintMole();
    hideMoleSoon();
}

let moleAudio = null;

function readyMoleSound() {
    if (!moleAudio) {
        moleAudio = new AudioContext();
    }
    if (moleAudio.state === "suspended") {
        moleAudio.resume();
    }
    return moleAudio;
}

function playSweep(ctx, startFreq, endFreq, startAt, hold, vol) {
    const tone = ctx.createOscillator();
    const gain = ctx.createGain();
    tone.type = "triangle";
    tone.frequency.setValueAtTime(startFreq, startAt);
    tone.frequency.exponentialRampToValueAtTime(endFreq, startAt + hold);
    gain.gain.setValueAtTime(0.001, startAt);
    gain.gain.linearRampToValueAtTime(vol, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, startAt + hold);
    tone.connect(gain);
    gain.connect(ctx.destination);
    tone.start(startAt);
    tone.stop(startAt + hold + 0.02);
}

function playHammer() {
    const ctx = readyMoleSound();
    const t = ctx.currentTime;
    const samples = Math.floor(ctx.sampleRate * 0.1);
    const buffer = ctx.createBuffer(1, samples, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < samples; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.018));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(700, t);
    filter.frequency.exponentialRampToValueAtTime(1600, t + 0.08);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.85, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(t);
    noise.stop(t + 0.12);

    playSweep(ctx, 220, 620, t, 0.16, 0.72);
    playSweep(ctx, 440, 880, t + 0.04, 0.18, 0.55);
}

function playVowel(ctx, startAt, hold, freq, formant, vol) {
    const voice = ctx.createOscillator();
    const buzz = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    voice.type = "sawtooth";
    buzz.type = "sine";
    voice.frequency.setValueAtTime(freq, startAt);
    voice.frequency.exponentialRampToValueAtTime(freq * 0.92, startAt + hold);
    buzz.frequency.setValueAtTime(freq, startAt);
    filter.type = "bandpass";
    filter.frequency.value = formant;
    filter.Q.value = 4;
    gain.gain.setValueAtTime(0.001, startAt);
    gain.gain.linearRampToValueAtTime(vol, startAt + 0.03);
    gain.gain.setValueAtTime(vol * 0.85, startAt + hold * 0.55);
    gain.gain.exponentialRampToValueAtTime(0.01, startAt + hold);
    voice.connect(filter);
    buzz.connect(gain);
    filter.connect(gain);
    gain.connect(ctx.destination);
    voice.start(startAt);
    buzz.start(startAt);
    voice.stop(startAt + hold + 0.02);
    buzz.stop(startAt + hold + 0.02);
}

function playUhOh() {
    const ctx = readyMoleSound();
    const t = ctx.currentTime;
    playVowel(ctx, t, 0.2, 420, 900, 0.82);
    playVowel(ctx, t + 0.22, 0.32, 280, 620, 0.88);
}

function hitMole(index) {
    if (moleLeft <= 0) {
        startMole();
        return;
    }
    if (index !== moleUp) {
        playUhOh();
        return;
    }
    playHammer();
    moleScore += 1;
    if (moleScore > moleBest) {
        moleBest = moleScore;
    }
    if (typeof giveBadge === "function") {
        giveBadge("mole-first");
        if (moleScore >= 10) {
            giveBadge("mole-10");
        }
        if (moleScore >= 20) {
            giveBadge("mole-20");
        }
    }
    moleUp = -1;
    paintMole();
    showMoleInfo();
    if (molePop) {
        clearTimeout(molePop);
        molePop = null;
    }
    popMole();
}

function startMole() {
    stopMole();
    moleScore = 0;
    moleLeft = pickByLevel("mole", [30, 25, 20, 14]);
    moleUp = -1;
    showMoleInfo();
    paintMole();
    popMole();
    moleTimer = setInterval(function () {
        if (!moleOpen()) {
            stopMole();
            return;
        }
        moleLeft -= 1;
        if (moleLeft <= 0) {
            stopMole();
            moleUp = -1;
            paintMole();
            showMoleInfo();
            if (typeof noteGameBest === "function") {
                noteGameBest("mole", moleScore);
            }
            if (moleScore > 0 && typeof celebrateWin === "function") {
                celebrateWin("敲到 " + moleScore + " 只！");
            }
            return;
        }
        showMoleInfo();
    }, 1000);
}

function connectMole() {
    const yard = document.getElementById("moleYard");
    const again = document.getElementById("moleRestart");
    if (yard) {
        yard.onclick = function (event) {
            const hole = event.target.closest(".mole-hole");
            if (!hole) {
                return;
            }
            hitMole(Number(hole.getAttribute("data-mole")));
        };
    }
    if (again) {
        again.onclick = startMole;
    }
}

connectMole();
