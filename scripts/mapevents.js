let display = "state";

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

let layerGroup = L.layerGroup().addTo(map);

let csvData;

Papa.parse(getLatestDownloadUrl(), {
    download: true,
    complete: function (results) {
        csvData = results.data;
        update('active');
    }
});

function update(count) {
    layerGroup.clearLayers();

    let colIndex = 10;

    if (count == 'active') {
        colIndex = 10;
    } else if (count == 'cumulative') {
        colIndex = 7;
    }

    for (let i = 1; i < csvData.length; i++) {
        if (csvData[i][colIndex] <= 0 || csvData[i][5] == "") {
            continue;
        }
        try {
            let location = "";
            for (let j = 1; j < 4; j++) {
                if (csvData[i][j] != '')
                    location += csvData[i][j] + ", ";
            }
            location = location.substring(0, location.length - 2);

            const marker = L.circleMarker([csvData[i][5], csvData[i][6]], {
                radius: Math.log(Math.max(csvData[i][colIndex], 5)) * 2,
                weight: 1.0,
                fillOpacity: 0.9,
                color: 'white',
                fillColor: '#ee4d5a',
                activeCases: csvData[i][10],
                confirmedCases: csvData[i][7],
                deaths: csvData[i][8],
                recovered: csvData[i][9],
                location: location
            })

            marker.on({
                mouseover: toolTip,
                click: popUp
            });

            marker.addTo(layerGroup)
        } catch (error) {
            // console.log(csvData[i])
        }

    }
}

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
    const tooltip = generateContent(L.tooltip(), layer)

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

    tooltip = generateContent(L.popup(), layer)
    layer.bindPopup(tooltip, {
        className: 'popup',
        permanent: true,
        autoPan: false
    }).openPopup();
}