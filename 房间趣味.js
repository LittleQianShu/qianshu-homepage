(function () {
    const nav = document.querySelector(".nav");
    if (nav) {
        nav.addEventListener("click", function (event) {
            const btn = event.target.closest("button");
            if (!btn) {
                return;
            }
            btn.classList.remove("nav-pop");
            void btn.offsetWidth;
            btn.classList.add("nav-pop");
        });
    }

    const name = document.querySelector(".stage .name");
    const hi = document.querySelector(".stage .hi");
    const hellos = ["千树在这儿！", "点我的名字会亮", "今天也要玩吗？", "森林报到！"];
    if (name) {
        name.onclick = function () {
            if (hi) {
                hi.textContent = hellos[Math.floor(Math.random() * hellos.length)];
                hi.classList.add("show");
            }
            if (typeof popNice === "function") {
                popNice("🌲");
            }
            if (typeof playTone === "function") {
                playTone(523, 0.12);
            }
        };
    }

    const photos = document.querySelectorAll(".photo");
    for (let i = 0; i < photos.length; i++) {
        photos[i].addEventListener("click", function () {
            if (typeof popNice === "function") {
                popNice(photos[i].textContent);
            }
            if (typeof playTone === "function") {
                playTone(600 + i * 80, 0.12);
            }
        });
    }

    const diarySave = document.getElementById("diarySave");
    if (diarySave) {
        diarySave.addEventListener("click", function () {
            if (typeof celebrateWin === "function") {
                celebrateWin("日记收好了");
            }
        });
    }

    const noteSend = document.getElementById("noteSend");
    if (noteSend) {
        noteSend.addEventListener("click", function () {
            if (typeof popNice === "function") {
                popNice("送到了");
            }
            if (typeof playTone === "function") {
                playTone(700, 0.12);
            }
        });
    }

    function boom(freq, time, type) {
        if (typeof playTone !== "function") {
            return;
        }
        playTone(freq, time);
    }

    const extra = {
        soundDrum: function () {
            boom(90, 0.2);
            setTimeout(function () {
                boom(70, 0.18);
            }, 80);
        },
        soundWind: function () {
            boom(880, 0.08);
            setTimeout(function () {
                boom(440, 0.2);
            }, 90);
        },
        soundLaugh: function () {
            boom(392, 0.1);
            setTimeout(function () {
                boom(523, 0.1);
            }, 100);
            setTimeout(function () {
                boom(659, 0.16);
            }, 200);
        }
    };
    const keys = Object.keys(extra);
    for (let i = 0; i < keys.length; i++) {
        const btn = document.getElementById(keys[i]);
        if (btn) {
            btn.onclick = extra[keys[i]];
        }
    }

    const timerNum = document.getElementById("timerNum");
    if (timerNum) {
        const obs = new MutationObserver(function () {
            timerNum.classList.remove("tick");
            void timerNum.offsetWidth;
            timerNum.classList.add("tick");
        });
        obs.observe(timerNum, { childList: true, characterData: true, subtree: true });
    }
})();
