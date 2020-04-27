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

Number.prototype.toFixedNumber = function (digits, base) {
    var pow = Math.pow(base || 10, digits);
    return Math.round(this * pow) / pow;
}

function toolTip(e) {
    const layer = e.target;
    const tooltip = L.tooltip().setContent(
        `<b>${layer.options.location}</b><br>${layer.options.cases} cases`
    );
    layer.bindTooltip(tooltip, {
        className: 'tooltip',
        direction: 'top',
        opacity: 1.0
    }).openTooltip();
}

function popUp(e) {
    map.setView(e.latlng, map.getZoom());
    const layer = e.target;
    layer.unbindTooltip();
    tooltip = L.popup().setContent(
        `<b>${layer.options.location}</b><br>${layer.options.cases} cases`
    );
    layer.bindPopup(tooltip, {
        className: 'popup',
        permanent: true,
        autoPan: false
    }).openPopup();
}