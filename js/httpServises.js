var httpServices = {};
httpServices.defaultUrl = function () {
    var sheet = JSON.parse(localStorage.getItem('sheetData'));
    if (!sheet) return null;
    var url = 'https://sheets.googleapis.com/v4/spreadsheets/' + sheet.id + '/values/' + sheet.tabName + '!A1:F1:append?valueInputOption=USER_ENTERED';
    return url;
}

function handleError(requestData, errorCallback) {
    console.log(requestData);

    switch (requestData.status) {
        case 401:
            handleUnauthorized();
            return
        default:
            break;
    }

    if (requestData.response) {
        var errorData = JSON.parse(requestData.response) || {};
        var error = errorData.error || {};
        var message = error.message ? error.message : '';
        alert('Error: ' + message + ' Please review the request');
    }
    errorCallback && errorCallback(requestData);
}

function handleUnauthorized() {
    setCookie('token', '', -1);
    alert('Please authorize first');
    $('[href="#tab3"]').tab('show');
}

function handleNotSheetData() {
    alert('Please provide sheet data');
    $('[href="#tab2"]').tab('show');
}

httpServices.get = function (successCallback, errorCallback) {
    var token = getCookie('token');
    if (!token) {
        handleUnauthorized();
        return;
    }
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            successCallback(JSON.parse(xmlHttp.responseText));
        } else if (xmlHttp.readyState === 4) {
            handleError(xmlHttp, errorCallback);
        }
    };
    var url = httpServices.defaultUrl();
    if (!url) {
        handleNotSheetData();
        return;
    }
    xmlHttp.open("GET", url, true);
    xmlHttp.send(null);
};

httpServices.post = function (jsonData, successCallback, errorCallback) {
    var token = getCookie('token');
    if (!token) {
        handleUnauthorized();
        return;
    }
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            successCallback();
        } else if (xmlHttp.readyState === 4) {
            handleError(xmlHttp, errorCallback);
        }
    };
    var url = httpServices.defaultUrl();
    if (!url) {
        handleNotSheetData();
        return;
    }
    xmlHttp.open("POST", url, true);
    xmlHttp.setRequestHeader('Content-type', 'application/json; charset=utf-8');
    xmlHttp.setRequestHeader('Authorization', 'Bearer ' + token);
    var data = JSON.stringify(jsonData);
    xmlHttp.send(data);
};
