import { parse } from 'papaparse';
import { getLatestDownloadUrl } from './utils.js';

let show = localStorage.getItem('show') != null ? localStorage.getItem('show') == 'true' : true;
displayHelp();

document.getElementById('toggle-help').addEventListener('click', () => {
    show = !show;
    localStorage.setItem('show', show);
    displayHelp();
});

document.getElementById('active').addEventListener('click', () => {
    update('activate');
});

document.getElementById('confirmed').addEventListener('click', () => {
    update('confirmed');
});


function displayHelp() {
    let elements = document.getElementsByClassName("help");
    if (show) {
        document.getElementById("toggle-help").style.transform = "rotate(0deg)";
    } else {
        document.getElementById("toggle-help").style.transform = "rotate(180deg)";
    }
    for (let i = 0; i < elements.length; i++) {
        if (show) {
            elements[i].style.display = "inline-block";
        } else {
            elements[i].style.display = "none";
        }
    }
}

var map = L.map("map", {
    preferCanvas: 'true',
    worldCopyJump: 'true',
    center: [39.8283, -98.5795],
    zoom: 5
});

L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png", {
    maxZoom: 8,
    minZoom: 3,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
        '&copy; <a href="https://openmaptiles.org/"> OpenMapTiles </a>' +
        '&copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
}
).addTo(map);

map.createPane('labels');
map.getPane('labels').style.zIndex = 500;

var positronLabels = L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
    maxZoom: 8,
    minZoom: 3,
    pane: 'labels'
}).addTo(map);

let markers = L.layerGroup();

let csvData;

parse(getLatestDownloadUrl(), {
    download: true,
    complete: function (results) {
        csvData = results.data;
        update('active');
    }
});

let cumulativeScale = 1;
function update(count) {
    markers.clearLayers();


    let colIndex = 10;

    if (count == 'active') {
        colIndex = 10;
    } else if (count == 'confirmed') {
        colIndex = 7;
    }

    for (let i = 1; i < csvData.length; i++) {
        let row = csvData[i];

        row[7] = Math.abs(row[7]);
        row[10] = Math.abs(row[10]);

        if (row[colIndex] === 0 || !row[5]) {
            continue;
        }
        try {
            let location = "";
            for (let j = 1; j < 4; j++) {
                if (row[j] != '')
                    location += row[j] + ", ";
            }
            location = location.substring(0, location.length - 2);

            const factor = Math.cos(degrees_to_radians(row[5])) / 1;

            const marker = L.circle([row[5], row[6]], {
                radius: Math.max(Math.sqrt(row[colIndex]), 20) * 450 * cumulativeScale * factor,
                weight: 1.0,
                fillOpacity: 0.9,
                color: 'white',
                fillColor: '#ee4d5a',
                activeCases: row[10],
                confirmedCases: row[7],
                deaths: row[8],
                recovered: row[9],
                location: location,
            });

            marker.on({
                mouseover: toolTip,
                click: popUp
            });

            marker.addTo(markers);
        } catch (error) {
            // console.log(csvData[i])
        }
    }

    markers.addTo(map);
}

function degrees_to_radians(degrees) {
    var pi = Math.PI;
    return degrees * (pi / 180);
}

let lastZoom = 5;
map.on('zoomend', function () {
    var zoomDiff = ((lastZoom - 1) / (map.getZoom() - 1));
    cumulativeScale *= zoomDiff;
    markers.eachLayer(function (marker) {
        marker.setRadius(marker._mRadius * zoomDiff);
    });
    lastZoom = map.getZoom();
});

function generateContent(popup, layer) {
    return popup.setContent(
        `<b>${layer.options.location}</b>
        <br>Confirmed Cases <span class="space">${layer.options.confirmedCases}</span><span class="red">${layer.options.confirmedCases}</span>
        <br>Active Cases <span class="space">${layer.options.activeCases}</span><span class="red">${layer.options.activeCases}</span>
        <br>Deaths <span class="space">${layer.options.deaths}</span><span class="red">${layer.options.deaths}</span>`
    );
}

function toolTip(e) {
    const layer = e.target;
    const tooltip = generateContent(L.tooltip(), layer);

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

    const tooltip = generateContent(L.popup(), layer);
    layer.bindPopup(tooltip, {
        className: 'popup',
        permanent: true,
        autoPan: false
    }).openPopup();
}