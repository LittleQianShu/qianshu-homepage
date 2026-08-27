const BADGE_DEFS = [
    { id: "match-first", name: "初级消消员", how: "消消乐里第一次消除", mark: "🍬", game: "match" },
    { id: "match-200", name: "消到停不下来", how: "消消乐一局拿到 200 分", mark: "🍭", game: "match" },
    { id: "star-10", name: "初见流星", how: "接星星累计接到 10 个", mark: "✨", game: "star" },
    { id: "star-50", name: "星星捕手", how: "接星星累计接到 50 个", mark: "⭐", game: "star" },
    { id: "chess-first", name: "小树出征", how: "五子棋赢电脑一盘", mark: "🌱", game: "chess" },
    { id: "go-first", name: "第一盘围棋", how: "下完一盘围棋", mark: "⚪", game: "go" },
    { id: "chess-hard", name: "棋艺大师", how: "五子棋困难模式赢电脑", mark: "🌲", game: "chess" },
    { id: "memory-first", name: "好记性", how: "记忆翻牌找出全部配对", mark: "🧠", game: "memory" },
    { id: "tap-20", name: "点点新手", how: "点点乐一局点到 20 次", mark: "👆", game: "tap" },
    { id: "tap-40", name: "手速开了", how: "点点乐一局点到 40 次", mark: "⚡", game: "tap" },
    { id: "snake-5", name: "小树开口", how: "小树吃星星吃到 5 颗", mark: "🍏", game: "snake" },
    { id: "snake-15", name: "星星大餐", how: "小树吃星星吃到 15 颗", mark: "🌟", game: "snake" },
    { id: "mole-first", name: "第一锤", how: "敲树洞敲到第一只小树鼠", mark: "🔨", game: "mole" },
    { id: "mole-10", name: "锤锤准", how: "敲树洞一局敲到 10 只", mark: "🪵", game: "mole" },
    { id: "mole-20", name: "树洞猎人", how: "敲树洞一局敲到 20 只", mark: "🏆", game: "mole" },
    { id: "rps-win", name: "先到三分", how: "对决赢下一局", mark: "✊", game: "rps" },
    { id: "rps-streak", name: "连胜气势", how: "对决连赢 3 手", mark: "🔥", game: "rps" },
    { id: "bubble-10", name: "泡泡使者", how: "戳泡泡一局戳到 10 个", mark: "🫧", game: "bubble" },
    { id: "trust-done", name: "五位对手", how: "信任小游戏打完一组对手", mark: "🤝", game: "trust" },
    { id: "guess-win", name: "数字神探", how: "猜数字猜中一次", mark: "🔢", game: "guess" },
    { id: "timer-done", name: "时间到啦", how: "倒计时完整走到 0", mark: "⏰", game: "timer" },
    { id: "lesson-first", name: "走进课堂", how: "小课堂里点一次学段", mark: "📚", game: "lesson" },
    { id: "about-look", name: "认识自己", how: "关于我里点开一张卡片", mark: "🦀", game: "about" },
    { id: "piano-first", name: "第一颗音", how: "小树钢琴弹一个键", mark: "🎹", game: "piano" },
    { id: "maze-first", name: "找到小花", how: "走迷宫走到小花", mark: "🧭", game: "maze" },
    { id: "simon-first", name: "跟灯走", how: "跟灯走对一轮", mark: "💡", game: "simon" },
    { id: "simon-6", name: "六步不忘", how: "跟灯走到 6 步", mark: "🔮", game: "simon" },
    { id: "paint-first", name: "第一笔颜色", how: "涂色花园涂一块", mark: "🎨", game: "paint" },
    { id: "diff-first", name: "火眼金睛", how: "找不同找出不一样的一格", mark: "🔎", game: "diff" },
    { id: "fruit-first", name: "第一口果", how: "接果子点到一个", mark: "🍎", game: "fruit" },
    { id: "fruit-15", name: "果篮满了", how: "接果子一局接到 15 个", mark: "🧺", game: "fruit" },
    { id: "calc-first", name: "第一道加法", how: "加法题答对一题", mark: "➕", game: "calc" },
    { id: "calc-8", name: "加法小能手", how: "加法题连对 8 题", mark: "🧮", game: "calc" },
    { id: "order-first", name: "排队高手", how: "按顺序点完 1 到 5", mark: "🔢", game: "order" },
    { id: "dress-first", name: "换装一次", how: "给小树换一顶帽子或一件衣服", mark: "👗", game: "dress" },
    { id: "race-first", name: "冲过终点", how: "猛点跑到右边", mark: "🏁", game: "race" },
    { id: "stack-first", name: "第一块饼干", how: "叠饼干叠一块", mark: "🍪", game: "stack" },
    { id: "stack-8", name: "高高的塔", how: "叠饼干叠到 8 块", mark: "🗼", game: "stack" },
    { id: "count-first", name: "数星星", how: "数对天上的星星", mark: "✨", game: "count" },
    { id: "color-first", name: "认颜色", how: "找颜色点对一次", mark: "🎨", game: "color" },
    { id: "color-8", name: "色感开了", how: "找颜色对 8 次", mark: "🌈", game: "color" },
    { id: "jump-first", name: "第一跳", how: "小树跳跳过一块石头", mark: "🦘", game: "jump" },
    { id: "jump-5", name: "连跳五块", how: "小树跳一局跳过 5 块石头", mark: "🌲", game: "jump" },
    { id: "gate-first", name: "第一次弹跳", how: "倍数门里小球第一次碰到技能", mark: "×", game: "gate" },
    { id: "gate-1m", name: "百万收成", how: "倍数门一局收到 100 万", mark: "💥", game: "gate" },
    { id: "duel-first", name: "对决赢了", how: "圆圈对决里让对方颜色消失", mark: "🟣", game: "duel" },
    { id: "quest-first", name: "踏上旅途", how: "小树大冒险过第一关", mark: "🗺️", game: "quest" },
    { id: "quest-end", name: "走到尽头", how: "小树大冒险打完第五关", mark: "👑", game: "quest" }
];

function loadBadgeMap() {
    try {
        const raw = JSON.parse(localStorage.getItem("qs-home-badges") || "{}");
        return raw && typeof raw === "object" ? raw : {};
    } catch (err) {
        return {};
    }
}

function starTotal() {
    return Number(localStorage.getItem("qs-home-stars") || "0");
}

function badgeHow(def, have) {
    if (def.id === "star-10" && !have[def.id]) {
        return def.how + "（已接到 " + starTotal() + " / 10）";
    }
    if (def.id === "star-50" && !have[def.id]) {
        return def.how + "（已接到 " + starTotal() + " / 50）";
    }
    return def.how;
}

function paintBadges() {
    const list = document.getElementById("badgeList");
    if (!list) {
        return;
    }
    const have = loadBadgeMap();
    list.innerHTML = "";
    for (let i = 0; i < BADGE_DEFS.length; i++) {
        const def = BADGE_DEFS[i];
        const on = Boolean(have[def.id]);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "badge" + (on ? " on" : "");
        btn.setAttribute("data-badge", def.id);
        btn.innerHTML =
            '<span class="badge-mark">' + def.mark + "</span>" +
            "<strong>" + def.name + "</strong>" +
            "<span>" + (on ? "已点亮 · " + def.how : "未点亮 · " + badgeHow(def, have)) + "</span>";
        btn.onclick = function () {
            if (def.game === "guess" && typeof openGuess === "function") {
                openGuess();
                return;
            }
            if (def.game === "timer" && typeof openTimer === "function") {
                openTimer();
                return;
            }
            if (def.game === "lesson" && typeof openLesson === "function") {
                openLesson();
                return;
            }
            if (def.game === "about" && typeof openAbout === "function") {
                openAbout();
                return;
            }
            if (typeof openGames === "function") {
                openGames();
            }
            if (typeof showPlayGame === "function") {
                showPlayGame(def.game);
            }
        };
        list.appendChild(btn);
    }
}

function toastBadge(name) {
    const el = document.getElementById("badgeToast");
    if (!el) {
        return;
    }
    el.hidden = false;
    el.textContent = "获得徽章：" + name;
    window.clearTimeout(toastBadge.timer);
    toastBadge.timer = window.setTimeout(function () {
        el.hidden = true;
    }, 2600);
}

function unlockBadge(id) {
    const def = BADGE_DEFS.filter(function (item) {
        return item.id === id;
    })[0];
    if (!def) {
        return false;
    }
    const have = loadBadgeMap();
    if (have[id]) {
        return false;
    }
    have[id] = Date.now();
    localStorage.setItem("qs-home-badges", JSON.stringify(have));
    paintBadges();
    toastBadge(def.name);
    return true;
}

function giveBadge(id) {
    if (typeof unlockBadge === "function") {
        unlockBadge(id);
    }
}

function noteStarCatch() {
    const next = starTotal() + 1;
    localStorage.setItem("qs-home-stars", String(next));
    if (next >= 10) {
        unlockBadge("star-10");
    }
    if (next >= 50) {
        unlockBadge("star-50");
    } else {
        paintBadges();
    }
}

paintBadges();
if (typeof openAchieve === "function") {
    const rawAchieve = openAchieve;
    window.openAchieve = function () {
        const result = rawAchieve.apply(this, arguments);
        paintBadges();
        return result;
    };
    const achieveBtn = document.getElementById("achieveBtn");
    if (achieveBtn) {
        achieveBtn.onclick = openAchieve;
    }
}
