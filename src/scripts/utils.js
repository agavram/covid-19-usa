function getDate() {
    let latestDate = new Date();

    var offset = -30;
    latestDate.setUTCHours(latestDate.getUTCHours() + offset);
    console.log(latestDate.toUTCString());

    let dd = latestDate.getUTCDate();
    let mm = latestDate.getUTCMonth() + 1;
    const yyyy = latestDate.getUTCFullYear();

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

export { getLatestDownloadUrl }