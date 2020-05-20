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

export { getLatestDownloadUrl }