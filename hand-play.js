(function () {
    const MODEL = "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/";

    const style = document.createElement("style");
    style.textContent = [
        "#handPlayPanel { position: absolute; right: 12px; bottom: 58px; z-index: 40;",
        "width: 168px; padding: 8px; border-radius: 14px;",
        "background: rgba(10, 6, 28, 0.72); border: 1px solid rgba(255,255,255,0.18);",
        "color: #f4edff; font-size: 12px; text-align: center; }",
        "#handPlayPanel video { width: 152px; height: 114px; object-fit: cover;",
        "border-radius: 10px; transform: scaleX(-1); background: #12081f; }",
        "#handPlayTip { margin: 6px 0 0; line-height: 1.4; }",
        "#handCursor { position: absolute; width: 22px; height: 22px; margin: -11px 0 0 -11px;",
        "border-radius: 50%; border: 3px solid #ffe566; background: rgba(255,229,102,0.35);",
        "box-shadow: 0 0 16px #ffe566; z-index: 39; pointer-events: none; display: none; }",
        "#handCursor.pinch { width: 14px; height: 14px; margin: -7px 0 0 -7px; background: #ff8cc8; }"
    ].join("");
    document.head.appendChild(style);

    const pageFit = document.getElementById("pageFit") || document.body;
    const panel = document.createElement("div");
    panel.id = "handPlayPanel";
    panel.innerHTML = "<video id=\"handCam\" playsinline muted></video><p id=\"handPlayTip\">举手对着镜头，食指当鼠标，捏一下当点击</p>";
    panel.hidden = true;
    pageFit.appendChild(panel);

    const cursor = document.createElement("div");
    cursor.id = "handCursor";
    pageFit.appendChild(cursor);

    const video = panel.querySelector("#handCam");
    const tip = panel.querySelector("#handPlayTip");
    const dock = document.getElementById("dockGames") || document.getElementById("gameDock");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dock-btn";
    btn.id = "handPlayBtn";
    btn.textContent = "举手玩";
    if (dock) {
        dock.appendChild(btn);
    } else {
        btn.style.position = "absolute";
        btn.style.right = "12px";
        btn.style.bottom = "12px";
        btn.style.zIndex = "41";
        pageFit.appendChild(btn);
    }

    let hands = null;
    let stream = null;
    let running = false;
    let sending = false;
    let wasPinch = false;

    function loadScript(src) {
        return new Promise(function (resolve, reject) {
            const s = document.createElement("script");
            s.src = src;
            s.crossOrigin = "anonymous";
            s.onload = resolve;
            s.onerror = function () {
                reject(new Error("脚本没载下来"));
            };
            document.head.appendChild(s);
        });
    }

    function pointOnPage(nx, ny) {
        const box = pageFit.getBoundingClientRect();
        const scale = box.width / 1280;
        const useScale = pageFit.id === "pageFit" && scale > 0;
        const width = useScale ? box.width : window.innerWidth;
        const height = useScale ? box.height : window.innerHeight;
        const left = useScale ? box.left : 0;
        const top = useScale ? box.top : 0;
        return {
            clientX: left + nx * width,
            clientY: top + ny * height
        };
    }

    function putCursor(clientX, clientY, pinch) {
        const box = pageFit.getBoundingClientRect();
        const scale = pageFit.id === "pageFit" && box.width > 0 ? box.width / 1280 : 1;
        cursor.style.display = "block";
        cursor.style.left = (clientX - box.left) / scale + "px";
        cursor.style.top = (clientY - box.top) / scale + "px";
        cursor.classList.toggle("pinch", pinch);
    }

    function hideCursor() {
        cursor.style.display = "none";
    }

    function onHands(results) {
        if (!running) {
            return;
        }
        const list = results.multiHandLandmarks;
        if (!list || !list[0]) {
            hideCursor();
            tip.textContent = "举起一只手，让镜头看见";
            return;
        }
        const finger = list[0][8];
        const thumb = list[0][4];
        const nx = 1 - finger.x;
        const ny = finger.y;
        const at = pointOnPage(nx, ny);
        const pinch = Math.hypot(finger.x - thumb.x, finger.y - thumb.y) < 0.055;
        putCursor(at.clientX, at.clientY, pinch);
        tip.textContent = pinch ? "捏住 = 点击" : "挥手移动，捏一下点击";
        document.dispatchEvent(new CustomEvent("qs-hand", {
            detail: { clientX: at.clientX, clientY: at.clientY, pinch: pinch }
        }));
        if (pinch && !wasPinch) {
            const hit = document.elementFromPoint(at.clientX, at.clientY);
            if (hit && !panel.contains(hit) && hit !== btn) {
                hit.click();
            }
        }
        wasPinch = pinch;
    }

    async function ensureHands() {
        if (hands) {
            return;
        }
        tip.textContent = "正在请来认手的小助手…";
        if (!window.Hands) {
            await loadScript(MODEL + "hands.js");
        }
        hands = new window.Hands({
            locateFile: function (file) {
                return MODEL + file;
            }
        });
        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 0,
            minDetectionConfidence: 0.6,
            minTrackingConfidence: 0.5
        });
        hands.onResults(onHands);
    }

    async function loop() {
        if (!running) {
            return;
        }
        if (video.readyState >= 2 && hands && !sending) {
            sending = true;
            try {
                await hands.send({ image: video });
            } catch (err) {
                tip.textContent = "认手时卡住了，再点一次举手玩";
            }
            sending = false;
        }
        requestAnimationFrame(loop);
    }

    async function startHand() {
        try {
            await ensureHands();
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: 640, height: 480 },
                audio: false
            });
            video.srcObject = stream;
            await video.play();
            running = true;
            wasPinch = false;
            panel.hidden = false;
            btn.classList.add("on");
            btn.textContent = "关掉手";
            tip.textContent = "举起一只手";
            loop();
        } catch (err) {
            running = false;
            panel.hidden = false;
            tip.textContent = "要允许摄像头。用 localhost 打开页面再试。";
        }
    }

    function stopHand() {
        running = false;
        hideCursor();
        btn.classList.remove("on");
        btn.textContent = "举手玩";
        tip.textContent = "举手对着镜头，食指当鼠标，捏一下当点击";
        panel.hidden = true;
        if (stream) {
            stream.getTracks().forEach(function (track) {
                track.stop();
            });
            stream = null;
        }
        video.srcObject = null;
    }

    btn.addEventListener("click", function () {
        if (running) {
            stopHand();
        } else {
            startHand();
        }
    });
})();
