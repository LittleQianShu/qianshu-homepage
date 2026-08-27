const DOCK_PACKS = {
    hands: ["bubble", "star", "tap", "snake", "mole", "fruit", "race", "jump", "stack"],
    brain: ["match", "memory", "maze", "simon", "diff", "calc", "order", "count", "color", "gate"],
    vs: ["chess", "go", "rps", "trust", "duel"],
    make: ["piano", "paint", "dress"],
    big: ["quest"]
};

function packOfGame(name) {
    const keys = Object.keys(DOCK_PACKS);
    for (let i = 0; i < keys.length; i++) {
        if (DOCK_PACKS[keys[i]].indexOf(name) >= 0) {
            return keys[i];
        }
    }
    return "hands";
}

function currentDockPack() {
    const raw = localStorage.getItem("qs-home-dock-pack") || "vs";
    return DOCK_PACKS[raw] ? raw : "vs";
}

function paintDockPack(pack) {
    const packBtns = document.querySelectorAll("[data-dock-pack]");
    for (let i = 0; i < packBtns.length; i++) {
        packBtns[i].classList.toggle("on", packBtns[i].getAttribute("data-dock-pack") === pack);
    }
    const games = document.querySelectorAll("#dockGames [data-play]");
    for (let i = 0; i < games.length; i++) {
        const name = games[i].getAttribute("data-play");
        games[i].classList.toggle("is-pack-hide", packOfGame(name) !== pack);
    }
}

function showDockPack(pack) {
    if (!DOCK_PACKS[pack]) {
        return;
    }
    localStorage.setItem("qs-home-dock-pack", pack);
    paintDockPack(pack);
    if (typeof fitChessBoard === "function" && document.body.classList.contains("now-chess")) {
        fitChessBoard();
    }
}

function showDockPackForGame(name) {
    showDockPack(packOfGame(name));
}

function connectGameDock() {
    const packs = document.getElementById("dockPacks");
    if (packs) {
        packs.onclick = function (event) {
            const btn = event.target.closest("[data-dock-pack]");
            if (btn) {
                showDockPack(btn.getAttribute("data-dock-pack"));
            }
        };
    }
    paintDockPack(currentDockPack());
    if (typeof showPlayGame === "function") {
        const raw = showPlayGame;
        window.showPlayGame = function (name) {
            showDockPackForGame(name);
            return raw(name);
        };
    }
}

connectGameDock();
