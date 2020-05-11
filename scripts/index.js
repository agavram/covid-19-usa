let show = localStorage.getItem('show') != null ? localStorage.getItem('show') == 'true' : true;
displayHelp();

function toggleHelp() {
    show = !show;
    localStorage.setItem('show', show);
    displayHelp();
}

function displayHelp() {
    let elements = document.getElementsByClassName("help");
    if (show) {
        document.getElementById("toggle").style.transform = "rotate(0deg)"
    } else {
        document.getElementById("toggle").style.transform = "rotate(180deg)"
    }
    for (let i = 0; i < elements.length; i++) {
        if (show) {
            elements[i].style.display = "inline-block";
        } else {
            elements[i].style.display = "none";
        }
    }
}