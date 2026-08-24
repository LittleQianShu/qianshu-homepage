(function () {
    const scoreEl = document.getElementById("navScore");
    const themeBtn = document.getElementById("themeBtn");
    const guessBtn = document.getElementById("guessBtn");
    const timerBtn = document.getElementById("timerBtn");
    if (!scoreEl || !themeBtn || !guessBtn || !timerBtn) {
        return;
    }

    let roomScore = Number(localStorage.getItem("qs-home-score") || "0");
    let lastRoom = "home";

    function showScore() {
        scoreEl.textContent = "积分 " + roomScore;
    }

    function saveScore() {
        localStorage.setItem("qs-home-score", String(roomScore));
        showScore();
    }

    function addRoomPoint(name) {
        if (name === lastRoom) {
            return;
        }
        lastRoom = name;
        roomScore += 1;
        saveScore();
    }

    function wrap(fnName, roomName) {
        const raw = window[fnName];
        if (typeof raw !== "function") {
            return;
        }
        window[fnName] = function () {
            addRoomPoint(roomName);
            return raw.apply(this, arguments);
        };
    }

    if (typeof clearRooms === "function") {
        const rawClear = clearRooms;
        window.clearRooms = function () {
            rawClear();
            document.body.classList.remove("page-guess");
            document.body.classList.remove("page-timer");
        };
    }

    wrap("openHome", "home");
    wrap("openAbout", "about");
    wrap("openWorks", "works");
    wrap("openNotes", "notes");
    wrap("openAlbum", "album");
    wrap("openDiary", "diary");
    wrap("openAchieve", "achieve");
    wrap("openSounds", "sound");
    wrap("openLesson", "lesson");
    wrap("openGames", "play");
    if (typeof openStudio === "function") {
        const rawStudio = openStudio;
        window.openStudio = function (room, start) {
            addRoomPoint("studio-" + room);
            return rawStudio(room, start);
        };
    }

    function openGuess() {
        addRoomPoint("guess");
        clearRooms();
        document.body.classList.add("page-guess");
        lightNav(guessBtn);
        newGuess();
    }

    function openTimer() {
        addRoomPoint("timer");
        clearRooms();
        document.body.classList.add("page-timer");
        lightNav(timerBtn);
        if (typeof readySound === "function") {
            readySound();
        }
    }

    homeBtn.onclick = openHome;
    aboutBtn.onclick = openAbout;
    worksBtn.onclick = openWorks;
    notesBtn.onclick = openNotes;
    albumBtn.onclick = openAlbum;
    diaryBtn.onclick = openDiary;
    achieveBtn.onclick = openAchieve;
    soundBtn.onclick = openSounds;
    lessonBtn.onclick = openLesson;
    gameBtn.onclick = openGames;
    guessBtn.onclick = openGuess;
    timerBtn.onclick = openTimer;

    function applyTheme(isDay) {
        document.body.classList.toggle("theme-day", isDay);
        localStorage.setItem("qs-home-theme", isDay ? "day" : "night");
        themeBtn.textContent = isDay ? "黑夜" : "白天";
    }
    applyTheme(localStorage.getItem("qs-home-theme") === "day");
    themeBtn.onclick = function () {
        applyTheme(!document.body.classList.contains("theme-day"));
    };

    let secret = 1;
    let guessMax = Number(localStorage.getItem("qs-home-guess-max") || "20");
    let guessTimes = 0;
    let guessDone = false;
    const guessInput = document.getElementById("guessInput");
    const guessTip = document.getElementById("guessTip");
    const guessMaxBox = document.getElementById("guessMax");
    const maxBtns = document.querySelectorAll(".guess-max-btn");

    function markMaxBtns() {
        for (let i = 0; i < maxBtns.length; i++) {
            maxBtns[i].classList.toggle("on", Number(maxBtns[i].getAttribute("data-max")) === guessMax);
        }
        if (guessMaxBox) {
            guessMaxBox.value = String(guessMax);
        }
    }

    function setGuessMax(n) {
        const max = Math.floor(n);
        if (!(max >= 2 && max <= 999)) {
            guessTip.textContent = "最大数请填 2 到 999";
            return;
        }
        guessMax = max;
        localStorage.setItem("qs-home-guess-max", String(guessMax));
        markMaxBtns();
        newGuess();
    }

    function newGuess() {
        secret = 1 + Math.floor(Math.random() * guessMax);
        guessTimes = 0;
        guessDone = false;
        guessTip.textContent = "我想了 1 到 " + guessMax + " 的一个数";
        guessInput.min = "1";
        guessInput.max = String(guessMax);
        guessInput.placeholder = "1-" + guessMax;
        guessInput.value = "";
    }

    for (let i = 0; i < maxBtns.length; i++) {
        maxBtns[i].onclick = function () {
            setGuessMax(Number(maxBtns[i].getAttribute("data-max")));
        };
    }
    document.getElementById("guessUseMax").onclick = function () {
        setGuessMax(Number(guessMaxBox.value));
    };

    document.getElementById("guessGo").onclick = function () {
        const n = Number(guessInput.value);
        if (!n) {
            guessTip.textContent = "先写一个数字";
            return;
        }
        if (n < 1 || n > guessMax) {
            guessTip.textContent = "请猜 1 到 " + guessMax + " 之间";
            return;
        }
        if (guessDone) {
            guessTip.textContent = "已经对了，点再来一局";
            return;
        }
        guessTimes += 1;
        if (n === secret) {
            guessDone = true;
            guessTip.textContent = "对了！就是 " + secret + "，用了 " + guessTimes + " 次";
            roomScore += 3;
            saveScore();
        } else if (n > secret) {
            guessTip.textContent = n + " 大了（第 " + guessTimes + " 次）";
        } else {
            guessTip.textContent = n + " 小了（第 " + guessTimes + " 次）";
        }
    };
    document.getElementById("guessNew").onclick = newGuess;
    markMaxBtns();

    let left = 10;
    let tick = null;
    const timerNum = document.getElementById("timerNum");
    const timerTip = document.getElementById("timerTip");

    function showTimer() {
        timerNum.textContent = left;
    }

    function stopTimer() {
        if (tick) {
            clearInterval(tick);
            tick = null;
        }
    }

    function startTimer(sec) {
        stopTimer();
        left = sec;
        showTimer();
        timerTip.textContent = "开始倒数";
        tick = setInterval(function () {
            left -= 1;
            showTimer();
            if (left <= 0) {
                stopTimer();
                timerTip.textContent = "时间到！";
                if (typeof playDing === "function") {
                    playDing();
                }
            }
        }, 1000);
    }

    document.getElementById("timer10").onclick = function () {
        startTimer(10);
    };
    document.getElementById("timer30").onclick = function () {
        startTimer(30);
    };
    document.getElementById("timer60").onclick = function () {
        startTimer(60);
    };
    document.getElementById("timerStop").onclick = function () {
        stopTimer();
        timerTip.textContent = "停住了";
    };

    showScore();
    newGuess();
})();
