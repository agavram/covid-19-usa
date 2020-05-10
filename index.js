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
        `<div><b>${layer.options.location}</b></div>
        <div>Confirmed Cases: <span>${layer.options.confirmedCases}</span></div>
        <div>Active Cases: <span>${layer.options.activeCases}</span></div>
        <div>Deaths: <span>${layer.options.deaths}</span></div>`
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
        `<div><b>${layer.options.location}</b></div>
        <div>Confirmed Cases: <span>${layer.options.confirmedCases}</span></div>
        <div>Active Cases: <span>${layer.options.activeCases}</span></div>
        <div>Deaths: <span>${layer.options.deaths}</span></div>`
    );
    layer.bindPopup(tooltip, {
        className: 'popup',
        permanent: true,
        autoPan: false
    }).openPopup();
}

function getDate() {
    var offset = -16;
    const yesterday = new Date(new Date().getTime() + offset * 3600 * 1000)
    yesterday.setDate(yesterday.getDate() - 1);
    let dd = yesterday.getDate();
    let mm = yesterday.getMonth() + 1;
    const yyyy = yesterday.getFullYear();
    if (dd < 10) {
        dd = '0' + dd;
    }
    if (mm < 10) {
        mm = '0' + mm;
    }
    return `${mm}-${dd}-${yyyy}`
}

const baseUrl = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/';

function getLatestDownloadUrl() {
    return `${baseUrl}${getDate()}.csv`;
}