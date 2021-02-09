import { parse } from 'papaparse';
import { Chart } from "chart.js";

let show = localStorage.getItem('show') != null ? localStorage.getItem('show') == 'true' : true;
const baseUrl = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/';

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

const globalTimeSeriesURL = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv";
let global;
parse(globalTimeSeriesURL, {
    worker: true,
    download: true,
    complete: function (results) {
        global = results.data;
    }
});

const usTimeSeriesURL = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_US.csv";
let us;
parse(usTimeSeriesURL, {
    worker: true,
    download: true,
    complete: function (results) {
        us = results.data;
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
            let location = row[11];

            const factor = Math.cos(degrees_to_radians(row[5])) / 1;

            const marker = L.circle([row[5], row[6]], {
                radius: Math.max(Math.pow(row[colIndex], 1 / 2.1), 20) * 400 * cumulativeScale * factor,
                weight: 1.0,
                fillOpacity: 0.9,
                color: 'white',
                fillColor: '#ee4d5a',
                activeCases: row[10],
                confirmedCases: row[7],
                deaths: row[8],
                recovered: row[9],
                location: location,
                latlng: { lat: row[5], lng: row[6] }
            });

            marker.on({
                mouseover: toolTip,
                click: popUp
            });

            marker.addTo(markers);
        } catch (error) {
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

function generateContent(layer) {
    let div = L.DomUtil.create('div');

    let temp = L.DomUtil.create('b', '', div);
    temp.innerHTML = `${layer.options.location}`;

    let line = L.DomUtil.create('div', 'popup-data', div);
    temp = L.DomUtil.create('span', '', line);
    temp.innerHTML = "Confirmed Cases";
    temp = L.DomUtil.create('span', 'red', line);
    temp.innerHTML = `${layer.options.confirmedCases}`;

    line = L.DomUtil.create('div', 'popup-data', div);
    temp = L.DomUtil.create('span', '', line);
    temp.innerHTML = "Active Cases";
    temp = L.DomUtil.create('span', 'red', line);
    temp.innerHTML = `${layer.options.activeCases}`;

    line = L.DomUtil.create('div', 'popup-data', div);
    temp = L.DomUtil.create('span', '', line);
    temp.innerHTML = "Deaths";
    temp = L.DomUtil.create('span', 'red', line);
    temp.innerHTML = `${layer.options.deaths}`;

    return div;
}

function toolTip(e) {
    const layer = e.target;
    const tooltip = L.tooltip().setContent(generateContent(layer));

    layer.bindTooltip(tooltip, {
        className: 'tooltip',
        direction: 'top',
        opacity: 1.0
    }).openTooltip();
}

let labels, data;

function popUp(e) {
    labels = undefined;
    data = undefined;
    map.setView(e.latlng, map.getZoom());
    const layer = e.target;
    layer.unbindTooltip();

    const targetLocation = layer.options.location.replaceAll(" ", "").toLowerCase();

    let countryData;

    if (layer.options.location.endsWith(", US")) {
        for (let i = 1; i < us.length; i++) {
            const current = us[i];
            const currentLocation = current[10].replaceAll(" ", "").toLowerCase();
            if (targetLocation === currentLocation) {
                labels = us[0].slice(11);
                data = current.slice(11);
                break;
            }
        }
    } else {
        for (let i = 1; i < global.length - 1; i++) {
            const current = global[i];
            let currentLocation = "";
            if (current[0]) {
                currentLocation = current.slice(0, 2).join(",");
            } else {
                currentLocation = current[1];
            }
            currentLocation = currentLocation.toLowerCase().replaceAll(" ", "");
            if (targetLocation.endsWith(currentLocation)) {
                if (!current[0]) {
                    countryData = current[1];
                    labels = global[0].slice(4);
                    data = global[i].slice(4);
                    break;
                }

                if (targetLocation === currentLocation) {
                    countryData = undefined;
                    labels = global[0].slice(4);
                    data = global[i].slice(4);
                    break;
                }
            }
        }
    }

    let div = generateContent(layer);

    let span;

    if (labels !== undefined) {
        span = L.DomUtil.create('span', 'open-graph', div);
        span.innerHTML = "View Graph";
        if (countryData) {
            span.innerHTML += ` of ${countryData}`;
        }
        span.addEventListener('click', () => {
            generateChart(labels, data, countryData ? countryData : layer.options.location);
        }, false);
    }

    const tooltip = L.popup().setContent(div);
    let popup = layer.bindPopup(tooltip, {
        className: 'popup',
        permanent: true,
        autoPan: false
    }).openPopup();
}

function getDate() {
    let latestDate = new Date();

    var offset = -30;
    latestDate.setUTCHours(latestDate.getUTCHours() + offset);

    let dd = latestDate.getUTCDate();
    let mm = latestDate.getUTCMonth() + 1;
    const yyyy = latestDate.getUTCFullYear();

    if (dd < 10) {
        dd = '0' + dd;
    }
    if (mm < 10) {
        mm = '0' + mm;
    }

    return `${mm}-${dd}-${yyyy}`;
}

function getLatestDownloadUrl() {
    return `${baseUrl}${getDate()}.csv`;
}

var ctx = document.getElementById("chart");
let chart;

Chart.defaults.LineWithLine = Chart.defaults.line;
Chart.controllers.LineWithLine = Chart.controllers.line.extend({
    draw: function (ease) {
        Chart.controllers.line.prototype.draw.call(this, ease);

        if (this.chart.tooltip._active && this.chart.tooltip._active.length) {
            var activePoint = this.chart.tooltip._active[0],
                ctx = this.chart.ctx,
                x = activePoint.tooltipPosition().x,
                topY = this.chart.legend.bottom,
                bottomY = this.chart.chartArea.bottom;

            // draw line
            ctx.save();
            ctx.beginPath();
            ctx.setLineDash([5, 3]);
            ctx.moveTo(x, topY);
            ctx.lineTo(x, bottomY);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ee4d5a';
            ctx.stroke();
            ctx.restore();
        }
    }
});

Chart.Tooltip.positioners.custom = function (elements, position) {
    if (!elements.length) {
        return false;
    }

    return {
        x: elements[0]._view.x,
        y: elements[0]._view.y
    };
};

function generateChart(labels, data, location) {
    const modal = document.getElementById('modal');
    modal.classList.remove("fade");
    document.getElementById('chartjs-tooltip')?.classList.remove("fade");

    let newCases = [];
    let smoothCases = [];

    for (let i = 0; i < data.length - 1; i++) {
        newCases.push(Math.max(data[i + 1] - data[i], 0));
    }

    for (let i = newCases.length - 1; i > 6; i--) {
        smoothCases.unshift(Math.round(
            (newCases[i] +
                newCases[i - 1] +
                newCases[i - 2] +
                newCases[i - 3] +
                newCases[i - 4] +
                newCases[i - 5] +
                newCases[i - 6]) / 7)
        );
    }

    labels = labels.slice(8);
    newCases = newCases.slice(7);

    if (chart !== undefined) {
        chart.destroy();
    }

    document.getElementById('center-title').innerText = 'Daily Cases in ' + location;

    chart = new Chart(ctx, {
        type: 'LineWithLine',
        data: {
            labels: labels,
            datasets: [{
                label: "New Cases",
                data: smoothCases,
                backgroundColor: "rgba(238, 77, 90, 0)",
                borderColor: "#ee4d5a",
                pointBackgroundColor: "#F6A2A9",
                pointRadius: 0,
                borderWidth: 2
            }, {
                data: newCases,
                type: "bar",
                backgroundColor: "rgba(238, 77, 90, 0.3)",
            }],
        },
        options: {
            maintainAspectRatio: false,
            animation: {
                duration: 0
            },
            title: {
                display: true,
                // text: 'Daily Cases in ' + location,
                fontSize: 16
            },
            legend: {
                display: false
            },
            scales: {
                yAxes: [{
                    gridLines: {
                        borderDash: [5, 3],
                    },
                    ticks: {
                        beginAtZero: true
                    },
                }],
                xAxes: [{
                    gridLines: {
                        borderDash: [5, 3],
                    },
                    display: true,
                    type: 'time',
                    time: {
                        parser: "MM/DD/YYYY",
                        tooltipFormat: 'll',
                        unitStepSize: 30,
                        displayFormats: {
                            'day': 'MMMM',
                         },
                        unit: 'day',
                    }
                }],
            },
            hover: { mode: null },
            tooltips: {
                enabled: false,
                intersect: false,
                position: "custom",
                mode: 'index',
                filter: function (tooltipItem) {
                    return tooltipItem.datasetIndex === 0;
                },
                custom: function (tooltipModel) {
                    // Tooltip Element
                    var tooltipEl = document.getElementById('chartjs-tooltip');

                    // Create element on first render
                    if (!tooltipEl) {
                        tooltipEl = document.createElement('div');
                        tooltipEl.id = 'chartjs-tooltip';
                        tooltipEl.innerHTML = '<table></table>';
                        document.body.appendChild(tooltipEl);
                    }

                    // Hide if no tooltip
                    if (tooltipModel.opacity === 0) {
                        tooltipEl.style.opacity = 0;
                        return;
                    }

                    if (tooltipModel.yAlign) {
                        tooltipEl.classList.add(tooltipModel.yAlign);
                    } else {
                        tooltipEl.classList.add('no-transform');
                    }

                    function getBody(bodyItem) {
                        return bodyItem.lines;
                    }

                    // Set Text
                    if (tooltipModel.body) {
                        var titleLines = tooltipModel.title || [];
                        var bodyLines = tooltipModel.body.map(getBody);

                        var innerHtml = '<thead>';

                        titleLines.forEach(function (title) {
                            innerHtml += '<tr><th>' + title + '</th></tr>';
                        });
                        innerHtml += '</thead><tbody>';

                        bodyLines.forEach(function (body, i) {
                            var colors = tooltipModel.labelColors[i];
                            var style = 'background:' + colors.backgroundColor;
                            style += '; border-color:' + colors.borderColor;
                            style += '; border-width: 2px';
                            var span = '<span style="' + style + '"></span>';
                            innerHtml += '<tr><td>' + span + body + '</td></tr>';
                        });
                        innerHtml += '</tbody>';

                        var tableRoot = tooltipEl.querySelector('table');
                        tableRoot.innerHTML = innerHtml;
                    }

                    var position = this._chart.canvas.getBoundingClientRect();

                    let left = position.left + window.pageXOffset + tooltipModel.caretX;

                    if (left - 10 > getWidth() / 2) {
                        left = left - tooltipEl.getBoundingClientRect().width - 12;
                        tooltipEl.classList.add("right");
                    } else {
                        left += 12;
                        tooltipEl.classList.remove("right");
                    }

                    requestAnimationFrame(() => {
                        // Display, position, and set styles for font
                        tooltipEl.style.opacity = 1;
                        tooltipEl.style.position = 'absolute';
                        tooltipEl.style.left = left + 'px';
                        tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY - 16 + 'px';
                        tooltipEl.style.fontFamily = tooltipModel._bodyFontFamily;
                        tooltipEl.style.fontSize = tooltipModel.bodyFontSize + 'px';
                        tooltipEl.style.fontStyle = tooltipModel._bodyFontStyle;
                        tooltipEl.style.padding = tooltipModel.yPadding + 'px ' + tooltipModel.xPadding + 'px';
                        tooltipEl.style.pointerEvents = 'none';
                    });
                }
            }
        }
    });
}

function getWidth() {
    return Math.max(
        document.body.scrollWidth,
        document.documentElement.scrollWidth,
        document.body.offsetWidth,
        document.documentElement.offsetWidth,
        document.documentElement.clientWidth
    );
}

document.getElementById('modal').addEventListener('mouseup', (e) => {
    let targetId = e.target.id;
    if (targetId === "modal" || targetId === "close-modal") {
        modal.classList.add("fade");
        document.getElementById('chartjs-tooltip')?.remove();
    }
});