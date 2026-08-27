(function () {
    const box = document.getElementById("photoList");
    const tip = document.getElementById("albumTip");
    const addBtn = document.getElementById("albumAdd");
    const fileInput = document.getElementById("albumFile");
    if (!box || !addBtn || !fileInput) {
        return;
    }

    const STARTERS = [
        { title: "羽毛球", color: "#7cffb2", mark: "🏸" },
        { title: "星星", color: "#7ae0ff", mark: "⭐" },
        { title: "小花", color: "#ff8cc8", mark: "🌸" },
        { title: "画板", color: "#b388ff", mark: "🎨" }
    ];

    function loadMine() {
        try {
            const raw = JSON.parse(localStorage.getItem("qs-home-photos") || "[]");
            return Array.isArray(raw) ? raw.filter(function (item) {
                return item && item.id && item.src;
            }) : [];
        } catch (err) {
            return [];
        }
    }

    function saveMine(list) {
        try {
            localStorage.setItem("qs-home-photos", JSON.stringify(list));
            return true;
        } catch (err) {
            if (tip) {
                tip.textContent = "这张太大了，换一张小一点的再试。";
            }
            return false;
        }
    }

    function showTip() {
        if (!tip) {
            return;
        }
        const mine = loadMine();
        tip.textContent = mine.length
            ? "点照片会亮起来。自己的照片可以点「删」拿掉。"
            : "还没有自己的照片。点「添加照片」，从手机或电脑选一张。";
        tip.classList.toggle("album-empty", mine.length === 0);
    }

    function paintAlbum() {
        const mine = loadMine();
        box.innerHTML = "";
        mine.forEach(function (item) {
            const card = document.createElement("div");
            card.className = "photo photo-real";
            const img = document.createElement("img");
            img.alt = item.title || "照片";
            img.src = item.src;
            const name = document.createElement("span");
            name.className = "photo-name";
            name.textContent = item.title || "照片";
            const del = document.createElement("button");
            del.type = "button";
            del.className = "photo-del";
            del.setAttribute("data-del", item.id);
            del.textContent = "删";
            card.appendChild(img);
            card.appendChild(name);
            card.appendChild(del);
            box.appendChild(card);
        });
        STARTERS.forEach(function (item) {
            const card = document.createElement("div");
            card.className = "photo";
            card.style.background = item.color;
            card.textContent = item.mark + " " + item.title;
            box.appendChild(card);
        });
        const cards = box.querySelectorAll(".photo");
        for (let i = 0; i < cards.length; i++) {
            cards[i].onclick = function (event) {
                if (event.target.closest("[data-del]")) {
                    return;
                }
                cards[i].classList.toggle("on");
                const label = cards[i].querySelector(".photo-name");
                if (typeof popNice === "function") {
                    popNice(label ? label.textContent : cards[i].textContent);
                }
            };
        }
        showTip();
    }

    function shrinkPic(file, done) {
        if (!file || file.type.indexOf("image/") !== 0) {
            if (tip) {
                tip.textContent = "请选图片文件。";
            }
            return;
        }
        const reader = new FileReader();
        reader.onerror = function () {
            if (tip) {
                tip.textContent = "这张读不出来，换一张试试。";
            }
        };
        reader.onload = function () {
            const img = new Image();
            img.onerror = function () {
                if (tip) {
                    tip.textContent = "这张不是能用的图片。";
                }
            };
            img.onload = function () {
                const canvas = document.createElement("canvas");
                const max = 360;
                const scale = Math.min(1, max / Math.max(img.width, img.height));
                canvas.width = Math.max(1, Math.round(img.width * scale));
                canvas.height = Math.max(1, Math.round(img.height * scale));
                canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
                done(canvas.toDataURL("image/jpeg", 0.72));
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    }

    function addOne(file) {
        const mine = loadMine();
        if (mine.length >= 8) {
            if (tip) {
                tip.textContent = "最多放 8 张自己的照片。先删一张再加。";
            }
            return;
        }
        shrinkPic(file, function (src) {
            const next = loadMine();
            if (next.length >= 8) {
                return;
            }
            next.push({
                id: "p" + Date.now() + Math.floor(Math.random() * 1000),
                title: (file.name || "照片").replace(/\.[^.]+$/, "").slice(0, 8) || "照片",
                src: src
            });
            if (saveMine(next)) {
                paintAlbum();
            }
        });
    }

    box.onclick = function (event) {
        const btn = event.target.closest("[data-del]");
        if (!btn) {
            return;
        }
        event.stopPropagation();
        saveMine(loadMine().filter(function (item) {
            return item.id !== btn.getAttribute("data-del");
        }));
        paintAlbum();
    };

    addBtn.onclick = function () {
        fileInput.click();
    };
    fileInput.setAttribute("multiple", "multiple");
    fileInput.onchange = function () {
        const files = fileInput.files ? Array.prototype.slice.call(fileInput.files, 0, 8) : [];
        fileInput.value = "";
        files.forEach(addOne);
    };

    paintAlbum();
})();
