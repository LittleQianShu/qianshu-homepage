function fitPages() {
    const box = document.getElementById("pageFit");
    if (!box) {
        return;
    }
    const baseW = 1280;
    const baseH = 800;
    const scale = Math.min(window.innerWidth / baseW, window.innerHeight / baseH);
    box.style.width = window.innerWidth / scale + "px";
    box.style.height = window.innerHeight / scale + "px";
    box.style.left = "0px";
    box.style.top = "0px";
    box.style.transform = "scale(" + scale + ")";
}

window.addEventListener("resize", fitPages);
fitPages();
