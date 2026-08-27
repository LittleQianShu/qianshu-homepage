function putExtra(parent, html, where) {
    if (!parent || parent.querySelector("[data-page-extra]")) {
        return parent ? parent.querySelector("[data-page-extra]") : null;
    }
    const box = document.createElement("div");
    box.className = "page-extra";
    box.setAttribute("data-page-extra", "1");
    box.innerHTML = html;
    if (where === "start") {
        parent.insertBefore(box, parent.firstChild.nextSibling);
    } else {
        parent.appendChild(box);
    }
    return box;
}

function nice(text) {
    if (typeof popNice === "function") {
        popNice(text);
    }
    if (typeof playTone === "function") {
        playTone(620, 0.1);
    }
}

function connectPageExtras() {
    const stage = document.querySelector(".stage");
    if (stage && !document.getElementById("homeSpark")) {
        const bar = putExtra(stage, "<button type=\"button\" class=\"sound-btn\" id=\"homeSpark\">撒星星</button>");
        if (bar) {
            document.getElementById("homeSpark").onclick = function () {
                const marks = ["⭐", "✨", "🌟"];
                for (let i = 0; i < 8; i++) {
                    const bit = document.createElement("div");
                    bit.className = "spark-bit";
                    bit.textContent = marks[i % marks.length];
                    bit.style.left = 20 + Math.random() * 70 + "%";
                    bit.style.top = 30 + Math.random() * 20 + "%";
                    stage.appendChild(bit);
                    setTimeout(function () {
                        bit.remove();
                    }, 1300);
                }
                nice("星星来了");
            };
        }
    }

    const about = document.querySelector(".about-room");
    if (about && !document.getElementById("aboutMoodLine")) {
        const saved = localStorage.getItem("qs-home-mood") || "";
        putExtra(about, "<span id=\"aboutMoodLine\">今日心情</span>" +
            "<button type=\"button\" class=\"mood-chip\" data-mood=\"开心\">开心</button>" +
            "<button type=\"button\" class=\"mood-chip\" data-mood=\"平静\">平静</button>" +
            "<button type=\"button\" class=\"mood-chip\" data-mood=\"想玩\">想玩</button>");
        function paintMood() {
            const now = localStorage.getItem("qs-home-mood") || "";
            const line = document.getElementById("aboutMoodLine");
            if (line) {
                line.textContent = now ? "今日心情：" + now : "今日心情";
            }
            const chips = about.querySelectorAll("[data-mood]");
            for (let i = 0; i < chips.length; i++) {
                chips[i].classList.toggle("on", chips[i].getAttribute("data-mood") === now);
            }
        }
        about.addEventListener("click", function (event) {
            const btn = event.target.closest("[data-mood]");
            if (!btn) {
                return;
            }
            localStorage.setItem("qs-home-mood", btn.getAttribute("data-mood"));
            paintMood();
            nice(btn.getAttribute("data-mood"));
        });
        paintMood();
    }

    const works = document.querySelector(".works");
    if (works && !document.getElementById("worksLucky")) {
        putExtra(works, "<button type=\"button\" class=\"sound-btn\" id=\"worksLucky\">随便看一个</button>");
        document.getElementById("worksLucky").onclick = function () {
            const ids = ["workLottery", "workSlider", "workClock", "workDraw", "workColor"];
            const el = document.getElementById(ids[Math.floor(Math.random() * ids.length)]);
            if (el) {
                el.click();
            }
        };
    }

    const packs = document.getElementById("dockPacks");
    if (packs && !document.getElementById("dockLucky")) {
        const lucky = document.createElement("button");
        lucky.type = "button";
        lucky.className = "dock-pack-btn";
        lucky.id = "dockLucky";
        lucky.textContent = "随便玩";
        packs.appendChild(lucky);
        lucky.onclick = function () {
            const btns = document.querySelectorAll("#dockGames [data-play]");
            if (!btns.length || typeof showPlayGame !== "function") {
                return;
            }
            const pick = btns[Math.floor(Math.random() * btns.length)];
            showPlayGame(pick.getAttribute("data-play"));
            nice(pick.textContent);
        };
    }

    const notes = document.querySelector(".notes-room");
    if (notes && !document.getElementById("noteStickers")) {
        putExtra(notes, "<span>贴纸</span>" +
            "<button type=\"button\" class=\"mood-chip\" data-sticker=\"🌲\">🌲</button>" +
            "<button type=\"button\" class=\"mood-chip\" data-sticker=\"⭐\">⭐</button>" +
            "<button type=\"button\" class=\"mood-chip\" data-sticker=\"🌸\">🌸</button>" +
            "<button type=\"button\" class=\"mood-chip\" data-sticker=\"❤️\">❤️</button>");
        notes.addEventListener("click", function (event) {
            const btn = event.target.closest("[data-sticker]");
            const box = document.getElementById("noteText");
            if (!btn || !box) {
                return;
            }
            box.value = (box.value + btn.getAttribute("data-sticker")).slice(0, 60);
            nice(btn.getAttribute("data-sticker"));
        });
    }

    const album = document.querySelector(".album-room");
    if (album && !document.getElementById("albumPlay")) {
        putExtra(album, "<button type=\"button\" class=\"sound-btn\" id=\"albumPlay\">幻灯片</button>");
        let albumTick = null;
        let albumI = 0;
        document.getElementById("albumPlay").onclick = function () {
            if (albumTick) {
                clearInterval(albumTick);
                albumTick = null;
                this.textContent = "幻灯片";
                return;
            }
            this.textContent = "停一下";
            albumTick = setInterval(function () {
                const now = album.querySelectorAll(".photo");
                if (!now.length) {
                    return;
                }
                albumI = albumI % now.length;
                for (let i = 0; i < now.length; i++) {
                    now[i].classList.toggle("album-on", i === albumI);
                }
                const label = now[albumI].querySelector(".photo-name");
                if (typeof popNice === "function") {
                    popNice(label ? label.textContent : now[albumI].textContent);
                }
                albumI = (albumI + 1) % now.length;
            }, 900);
        };
    }

    const diary = document.querySelector(".diary-room");
    if (diary && !document.getElementById("diaryStamp")) {
        putExtra(diary, "<button type=\"button\" class=\"sound-btn\" id=\"diaryStamp\">写上今天的日期</button>");
        document.getElementById("diaryStamp").onclick = function () {
            const box = document.getElementById("diaryBox");
            if (!box) {
                return;
            }
            const now = new Date();
            const line = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
            if (box.value.indexOf(line) < 0) {
                box.value = line + "\n" + box.value;
            }
            nice(line);
        };
    }

    const achieve = document.querySelector(".achieve-room");
    if (achieve && !document.getElementById("badgeCount")) {
        const p = document.createElement("p");
        p.className = "works-hi";
        p.id = "badgeCount";
        const title = achieve.querySelector(".works-hi");
        if (title) {
            title.insertAdjacentElement("afterend", p);
        } else {
            achieve.appendChild(p);
        }
    }
    function paintBadgeCount() {
        const el = document.getElementById("badgeCount");
        if (!el || typeof BADGE_DEFS === "undefined" || typeof loadBadgeMap !== "function") {
            return;
        }
        const have = loadBadgeMap();
        let n = 0;
        for (let i = 0; i < BADGE_DEFS.length; i++) {
            if (have[BADGE_DEFS[i].id]) {
                n += 1;
            }
        }
        el.textContent = "已经点亮 " + n + " / " + BADGE_DEFS.length + " 枚";
    }
    if (typeof paintBadges === "function") {
        const raw = paintBadges;
        window.paintBadges = function () {
            raw();
            paintBadgeCount();
        };
    }
    paintBadgeCount();

    const sound = document.querySelector(".sound-room .sound-pad");
    if (sound && !document.getElementById("soundBell")) {
        const bell = document.createElement("button");
        bell.type = "button";
        bell.className = "sound-btn";
        bell.id = "soundBell";
        bell.textContent = "🔔 小铃";
        sound.appendChild(bell);
        bell.onclick = function () {
            if (typeof playTone === "function") {
                playTone(880, 0.08);
                setTimeout(function () {
                    playTone(1174, 0.16);
                }, 90);
            }
            nice("叮铃");
        };
        const mix = document.createElement("button");
        mix.type = "button";
        mix.className = "sound-btn";
        mix.id = "soundMix";
        mix.textContent = "连奏";
        sound.appendChild(mix);
        mix.onclick = function () {
            const ids = ["soundBo", "soundDing", "soundDrum", "soundWind", "soundLaugh", "soundBell"];
            for (let i = 0; i < ids.length; i++) {
                setTimeout(function (id) {
                    const btn = document.getElementById(id);
                    if (btn) {
                        btn.click();
                    }
                }, i * 280, ids[i]);
            }
        };
    }

    const lesson = document.querySelector(".lesson-main");
    if (lesson && !document.getElementById("lessonDaily")) {
        putExtra(lesson, "<button type=\"button\" class=\"sound-btn\" id=\"lessonDaily\">今日一题</button>");
        document.getElementById("lessonDaily").onclick = function () {
            const quiz = document.getElementById("lessonQuiz");
            const pick = document.getElementById("lessonPick");
            const bank = typeof classroom !== "undefined" ? classroom.xiaoxue : null;
            let q = "8 + 7 = ?";
            let a = "15";
            if (bank && bank.topics && bank.topics["一年级"]) {
                const pack = bank.topics["一年级"]["20以内加法"];
                if (pack && pack.length) {
                    const row = pack[Math.floor(Math.random() * pack.length)];
                    q = row.q;
                    a = row.a;
                }
            }
            if (pick) {
                pick.textContent = "今日一题（小学一年级）";
            }
            if (quiz) {
                quiz.innerHTML = "<p>" + q + "</p><p>答案先想一想，再点下面</p>" +
                    "<button type=\"button\" class=\"sound-btn\" id=\"lessonDailyAns\">看答案</button>";
                document.getElementById("lessonDailyAns").onclick = function () {
                    nice(a);
                    this.textContent = "答案是 " + a;
                };
            }
            if (typeof giveBadge === "function") {
                giveBadge("lesson-first");
            }
        };
    }

    const guess = document.querySelector(".guess-room");
    if (guess && !document.getElementById("guessHint")) {
        const go = document.getElementById("guessGo");
        if (go && go.parentNode) {
            const hint = document.createElement("button");
            hint.type = "button";
            hint.className = "sound-btn";
            hint.id = "guessHint";
            hint.textContent = "提示";
            go.parentNode.appendChild(hint);
            hint.onclick = function () {
                if (typeof hintGuess === "function") {
                    hintGuess();
                }
            };
        }
    }

    const timer = document.querySelector(".timer-room");
    if (timer && !document.getElementById("timerCustom")) {
        putExtra(timer, "<input id=\"timerCustom\" type=\"number\" min=\"3\" max=\"300\" value=\"15\" style=\"width:72px\">" +
            "<button type=\"button\" class=\"sound-btn\" id=\"timerGo\">自定秒数开始</button>");
        document.getElementById("timerGo").onclick = function () {
            const n = Number(document.getElementById("timerCustom").value);
            if (!(n >= 3 && n <= 300)) {
                nice("填 3 到 300");
                return;
            }
            if (typeof startHomeTimer === "function") {
                startHomeTimer(n);
            }
        };
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", connectPageExtras);
} else {
    connectPageExtras();
}
