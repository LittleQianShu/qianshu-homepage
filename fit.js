function fitPages() {
    const box = document.getElementById("pageFit");
    if (!box) {
        return;
    }
    const baseW = 1280;
    const scale = window.innerWidth / baseW;
    box.style.transform = "scale(" + scale + ")";
    box.style.left = "0px";
    box.style.top = "0px";
    box.style.width = baseW + "px";
    box.style.height = window.innerHeight / scale + "px";
}

window.addEventListener("resize", fitPages);
fitPages();
