(function () {
    const tip = document.getElementById("parkTip");
    const ticketsEl = document.getElementById("parkTickets");
    const stage = document.getElementById("parkStage");
    const world = document.getElementById("parkWorld");
    if (!tip || !ticketsEl || !stage || !world) {
        return;
    }

    const RIDES = [
        { id: "dragon", name: "钢铁游龙", x: -220, z: -280 },
        { id: "drop", name: "绝顶雄风", x: -20, z: -310 },
        { id: "hammer", name: "大摆锤", x: 150, z: -280 },
        { id: "pirate", name: "海盗船", x: 290, z: -230 },
        { id: "flume", name: "激流勇进", x: 270, z: -50 },
        { id: "raft", name: "峡谷漂流", x: 300, z: 130 },
        { id: "fly", name: "飞越极限", x: -300, z: -40 },
        { id: "dino", name: "恐龙危机", x: -280, z: 110 },
        { id: "space", name: "太空梭", x: -300, z: 250 },
        { id: "wheel", name: "摩天轮", x: -130, z: 290 },
        { id: "horse", name: "旋转木马", x: 20, z: 290 },
        { id: "bumper", name: "碰碰车", x: 170, z: 270 },
        { id: "shoot", name: "射击馆", x: 300, z: 270 }
    ];

    const TREES = [
        [-400, -360], [-360, 360], [390, -380], [400, 380],
        [-80, 40], [90, 70], [-160, 180], [40, -120],
        [-400, 40], [410, -80]
    ];

    let tickets = Number(localStorage.getItem("qs-home-park-tickets") || "0");
    let ready = false;
    let shootLeft = 0;

    function showTickets() {
        ticketsEl.textContent = String(tickets);
    }

    function saveTickets() {
        localStorage.setItem("qs-home-park-tickets", String(tickets));
        showTickets();
    }

    function addTicket(why) {
        tickets += 1;
        saveTickets();
        tip.textContent = why + " 通关章 +1，现在 " + tickets + " 枚";
        if (typeof playDing === "function") {
            playDing();
        } else if (typeof playTone === "function") {
            playTone(720, 0.12);
        }
        if (typeof giveBadge === "function") {
            giveBadge("park-first");
            if (tickets >= 10) {
                giveBadge("park-10");
            }
        }
    }

    function makeSprite(kind, name, x, z, rideId) {
        const el = document.createElement("div");
        el.className = "park-iso" + (rideId ? "" : " is-deco");
        el.setAttribute("data-kind", kind);
        el.style.left = ((520 + x) / 1040 * 100) + "%";
        el.style.top = ((520 + z) / 1040 * 100) + "%";
        if (rideId) {
            el.setAttribute("data-ride", rideId);
            el.setAttribute("role", "button");
            el.tabIndex = 0;
            el.onclick = function () {
                playRide(rideId);
            };
        }
        el.innerHTML = '<div class="park-iso-art"></div>' +
            (name ? '<span class="park-iso-name">' + name + "</span>" : "");
        return el;
    }

    function line(text) {
        return "<p>" + text + "</p>";
    }

    function closeStage() {
        stage.classList.remove("is-open");
        stage.innerHTML = "";
        tip.textContent = "点一个项目进去玩。";
    }

    function openStage(html) {
        stage.classList.add("is-open");
        stage.innerHTML = '<button type="button" class="park-stage-close" id="parkStageClose">关</button>' + html;
        const closeBtn = document.getElementById("parkStageClose");
        if (closeBtn) {
            closeBtn.onclick = closeStage;
        }
    }

    function playDragon() {
        openStage('<div class="park-fx park-track"><div class="park-rail"></div><div class="park-cart run">🚃</div></div>' +
            line("钢铁游龙出站。第一落差下去，车头已经看不见了。"));
        addTicket("过山车出闸");
    }

    function playDrop() {
        openStage('<div class="park-fx"><div class="park-tower"><div class="park-drop fall">座舱</div></div></div>' +
            line("绝顶雄风：升到顶，停半秒，整舱砸下来。"));
        addTicket("跳楼机落地");
    }

    function playHammer() {
        openStage('<div class="park-fx"><div class="park-hammer swing"></div></div>' +
            line("大摆锤拉到接近垂直，再甩到另一边。"));
        addTicket("摆锤一轮");
    }

    function playPirate() {
        openStage('<div class="park-fx"><div class="park-ship rock">⛵</div></div>' +
            line("海盗船越荡越高，甲板几乎立起来。"));
        addTicket("海盗船收缆");
    }

    function playFlume() {
        openStage('<div class="park-fx park-water"><div class="park-boat flume">🚤</div></div>' +
            line("激流勇进：爬坡、停在槽口，然后整船砸进水里。"));
        addTicket("激流勇进出水");
    }

    function playRaft() {
        openStage('<div class="park-fx park-water"><div class="park-boat raft">🛶</div></div>' +
            line("峡谷漂流：橡皮艇打转，浪从侧面灌进来。"));
        addTicket("漂流靠岸");
    }

    function playFly() {
        openStage('<div class="park-fx park-sky"><div class="park-plane fly">✈️</div></div>' +
            line("飞越极限：座椅前倾，银幕扑过来，像从高空俯冲。"));
        addTicket("飞行影院散场");
    }

    function playDino() {
        openStage('<div class="park-fx park-dark"><div class="park-dino roar">🦖</div></div>' +
            line("恐龙危机：隧道里突然亮灯，一头暴龙贴着车窗。"));
        addTicket("4D 骑乘出洞");
    }

    function playSpace() {
        openStage('<div class="park-fx park-pad"><div class="park-rocket launch">🚀</div></div>' +
            line("太空梭点火，垂直弹射，耳膜发紧。"));
        addTicket("发射完成");
    }

    function playWheel() {
        openStage('<div class="park-fx"><div class="park-wheel-wrap"><div class="park-wheel spin"><div class="park-cab">□</div></div></div><div class="park-pole"></div></div>' +
            line("摩天轮最顶点，能看见整座园区的轨道和水道。"));
        addTicket("摩天轮一圈");
    }

    function playHorse() {
        openStage('<div class="park-fx"><div class="park-horse bounce">🎠</div></div>' +
            line("旋转木马中轴带动整圈升降，灯条跟着转。"));
        addTicket("木马一圈");
    }

    function playBumper() {
        openStage('<div class="park-fx park-arena"><div class="park-car a hit">🚙</div><div class="park-car b hit">🚗</div></div>' +
            line("碰碰车对撞，保险杠一声闷响。"));
        addTicket("碰碰车一局");
    }

    function playShoot() {
        shootLeft = 6;
        let html = '<div class="park-targets">';
        for (let i = 0; i < 6; i++) {
            html += '<button type="button" class="park-target">靶</button>';
        }
        html += "</div>" + line("射击馆：6 个靶全打掉才算通关。");
        openStage(html);
        const targets = stage.querySelectorAll(".park-target");
        for (let i = 0; i < targets.length; i++) {
            targets[i].onclick = function () {
                if (this.classList.contains("down")) {
                    return;
                }
                this.classList.add("down");
                shootLeft -= 1;
                if (typeof playTone === "function") {
                    playTone(400 + shootLeft * 50, 0.07);
                }
                if (shootLeft <= 0) {
                    addTicket("射击馆清靶");
                    stage.insertAdjacentHTML("beforeend", line("靶场清空。"));
                } else {
                    tip.textContent = "还剩 " + shootLeft + " 个靶";
                }
            };
        }
        tip.textContent = "6 个靶，逐个点掉";
    }

    const PLAY = {
        dragon: playDragon,
        drop: playDrop,
        hammer: playHammer,
        pirate: playPirate,
        flume: playFlume,
        raft: playRaft,
        fly: playFly,
        dino: playDino,
        space: playSpace,
        wheel: playWheel,
        horse: playHorse,
        bumper: playBumper,
        shoot: playShoot
    };

    function playRide(ride) {
        const fn = PLAY[ride];
        if (fn) {
            fn();
        }
    }

    function drawWorld() {
        world.innerHTML = '<div class="park-ground"></div>';
        world.appendChild(makeSprite("gate", "正门", 0, 420));
        for (let i = 0; i < RIDES.length; i++) {
            const ride = RIDES[i];
            world.appendChild(makeSprite(ride.id, ride.name, ride.x, ride.z, ride.id));
        }
        for (let i = 0; i < TREES.length; i++) {
            world.appendChild(makeSprite("tree", "", TREES[i][0], TREES[i][1]));
        }
    }

    window.startPark = function () {
        if (!ready) {
            drawWorld();
            ready = true;
        }
        closeStage();
        showTickets();
        tip.textContent = "全园都在这一屏。点一个项目进去玩。";
    };
})();
