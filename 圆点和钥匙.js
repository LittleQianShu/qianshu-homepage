(function () {
    const layer = document.getElementById("fleeLayer");
    const pageFit = document.getElementById("pageFit");
    const lines = document.getElementById("fleeLines");
    const hi = document.querySelector(".hi");
    if (!layer || !pageFit || !lines) {
        return;
    }

    const SQRT3 = Math.sqrt(3);
    const HUES = ["#7ae0ff", "#ff8cc8", "#b388ff", "#7cffb2", "#c9b6ff", "#ff9f43"];
    const PEEP_WORDS = [
        "嘿，我在这儿", "别抓我啦", "线还连着哦", "点到我了",
        "上面也有人", "左边报到", "右边也在", "下面排队",
        "我们是一串", "又一个圆圆", "数数有几个", "我躲得快",
        "点我也行", "这边也亮", "手拉手呢", "别挤别挤",
        "我是第几个", "圈圈点点", "还能再点", "全连上了",
        "角落报到", "边上站着", "随机出现", "全屏都有",
        "不围圆圈", "四边都有", "再点一下", "我在外围"
    ];
    const KEY_WORDS = [
        "钥匙叮一声", "又一把钥匙", "钥匙连着人", "钥匙发光啦",
        "第十把也有", "钥匙也会躲", "叮叮叮", "金灿灿",
        "开一下试试", "钥匙到齐了", "边上的钥匙", "角落钥匙",
        "随机一把", "全屏钥匙"
    ];

    let folks = [];

    function fieldSize() {
        return {
            w: pageFit.clientWidth || 1280,
            h: pageFit.clientHeight || 800
        };
    }

    function hexPlan(w, h) {
        const left = 22;
        const right = 46;
        const top = 70;
        const bottom = 28;
        const usableW = Math.max(240, w - left - right);
        const usableH = Math.max(180, h - top - bottom);
        const guess = 50;
        const cols = Math.max(8, Math.round(usableW / (SQRT3 * guess) - 0.5));
        const rows = Math.max(5, Math.round((usableH / guess - 0.5) / 1.5));
        const size = Math.min(
            usableW / (SQRT3 * (cols - 1 + 0.5)),
            usableH / (1.5 * (rows - 1))
        );
        const gridW = size * SQRT3 * (cols - 1 + 0.5);
        const gridH = size * 1.5 * (rows - 1);
        return {
            cols: cols,
            rows: rows,
            size: size,
            originX: left + (usableW - gridW) / 2,
            originY: top + (usableH - gridH) / 2
        };
    }

    function hexSpot(col, row, plan) {
        return {
            x: plan.originX + plan.size * SQRT3 * (col + (row % 2) * 0.5),
            y: plan.originY + plan.size * 1.5 * row
        };
    }

    function hexNear(a, b) {
        const dc = b.col - a.col;
        const dr = b.row - a.row;
        if (dr === 0 && Math.abs(dc) === 1) {
            return true;
        }
        if (Math.abs(dr) !== 1) {
            return false;
        }
        if (a.row % 2 === 0) {
            return dc === 0 || dc === -1;
        }
        return dc === 0 || dc === 1;
    }

    function makeFolk(kind, i) {
        const folk = {
            kind: kind,
            hue: kind === "key" ? "#ffd76a" : HUES[i % HUES.length],
            swing: 3 + Math.random() * 4,
            word: kind === "key" ? KEY_WORDS[i % KEY_WORDS.length] : PEEP_WORDS[i % PEEP_WORDS.length],
            homeX: 80,
            homeY: 80,
            x: 80,
            y: 80,
            angle: Math.random() * Math.PI * 2,
            speed: 0.01 + Math.random() * 0.016,
            lineEls: []
        };
        folk.el = document.createElement("button");
        folk.el.type = "button";
        folk.el.className = "flee-item flee-" + kind;
        folk.el.style.setProperty("--hue", folk.hue);
        folk.el.setAttribute("aria-label", kind === "key" ? "钥匙" : "小人");
        if (kind === "key") {
            folk.el.innerHTML = "<span class=\"flee-key-bow\"></span><span class=\"flee-key-stem\"></span><span class=\"flee-key-bit\"></span>";
        } else {
            folk.el.innerHTML = "<span class=\"flee-head\"></span><span class=\"flee-eye l\"></span><span class=\"flee-eye r\"></span>";
        }
        folk.el.onclick = function () {
            folk.el.classList.remove("pop");
            void folk.el.offsetWidth;
            folk.el.classList.add("pop");
            if (typeof playTone === "function") {
                playTone(kind === "key" ? 720 : 480 + i * 10, 0.14);
            }
            if (hi) {
                hi.classList.add("show");
                hi.textContent = folk.word;
            }
        };
        layer.appendChild(folk.el);
        return folk;
    }

    function clearFolks() {
        folks.forEach(function (folk) {
            folk.el.remove();
        });
        folks = [];
        lines.innerHTML = "";
    }

    function addLink(i, j) {
        if (i === j) {
            return;
        }
        const a = Math.min(i, j);
        const b = Math.max(i, j);
        const already = folks[a].lineEls.some(function (link) {
            return link.other === b;
        });
        if (already) {
            return;
        }
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("class", "flee-line");
        lines.appendChild(line);
        folks[a].lineEls.push({ line: line, other: b });
    }

    function wireAll() {
        lines.innerHTML = "";
        folks.forEach(function (folk) {
            folk.lineEls = [];
        });
        for (let i = 0; i < folks.length; i++) {
            for (let j = i + 1; j < folks.length; j++) {
                if (hexNear(folks[i], folks[j])) {
                    addLink(i, j);
                }
            }
        }
    }

    function scatter() {
        const size = fieldSize();
        const plan = hexPlan(size.w, size.h);
        const cells = [];
        for (let row = 0; row < plan.rows; row++) {
            for (let col = 0; col < plan.cols; col++) {
                const spot = hexSpot(col, row, plan);
                cells.push({ col: col, row: row, x: spot.x, y: spot.y });
            }
        }
        clearFolks();
        cells.forEach(function (cell, i) {
            const kind = (i % 8 === 2 || i % 8 === 5 || i % 8 === 7) ? "key" : "peep";
            const folk = makeFolk(kind, i);
            folk.col = cell.col;
            folk.row = cell.row;
            folk.homeX = cell.x;
            folk.homeY = cell.y;
            folk.x = cell.x;
            folk.y = cell.y;
            folks.push(folk);
        });
        wireAll();
    }

    scatter();
    window.addEventListener("resize", function () {
        scatter();
    });

    let mouseX = -9999;
    let mouseY = -9999;

    function setPointer(clientX, clientY) {
        const box = pageFit.getBoundingClientRect();
        const size = fieldSize();
        mouseX = (clientX - box.left) * (size.w / box.width);
        mouseY = (clientY - box.top) * (size.h / box.height);
    }
    document.addEventListener("mousemove", function (event) {
        setPointer(event.clientX, event.clientY);
    });
    document.addEventListener("qs-hand", function (event) {
        setPointer(event.detail.clientX, event.detail.clientY);
    });
    document.addEventListener("mouseleave", function () {
        mouseX = -9999;
        mouseY = -9999;
    });

    function tick() {
        folks.forEach(function (folk) {
            folk.angle += folk.speed;
            const idleX = folk.homeX + Math.cos(folk.angle) * folk.swing;
            const idleY = folk.homeY + Math.sin(folk.angle * 1.15) * folk.swing;
            const dx = mouseX - idleX;
            const dy = mouseY - idleY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const feel = 80;
            let pushX = 0;
            let pushY = 0;
            if (dist < feel && dist > 0.1) {
                const push = Math.sin(((feel - dist) / feel) * (Math.PI / 2)) * 32;
                const away = Math.atan2(-dy, -dx);
                pushX = Math.cos(away) * push;
                pushY = Math.sin(away) * push;
            }
            folk.x = idleX + pushX;
            folk.y = idleY + pushY;
            folk.el.style.transform = "translate(" + folk.x + "px," + folk.y + "px)";
        });
        folks.forEach(function (folk) {
            folk.lineEls.forEach(function (link) {
                const other = folks[link.other];
                if (!other) {
                    return;
                }
                link.line.setAttribute("x1", folk.x + 18);
                link.line.setAttribute("y1", folk.y + 18);
                link.line.setAttribute("x2", other.x + 18);
                link.line.setAttribute("y2", other.y + 18);
            });
        });
        requestAnimationFrame(tick);
    }

    tick();
})();
