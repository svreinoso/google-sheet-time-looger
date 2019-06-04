let authorizeBtn = document.getElementById('authorizeBtn');
let logoutBtn = document.getElementById('logoutBtn');
let sheedDataFormSubmit = document.getElementById('sheedDataFormSubmit');
let logTimeFormSubmit = document.getElementById('logTimeFormSubmit');
let takeTabInfo = document.getElementById('takeTabInfo');

takeTabInfo.onclick = () => {
    getTabInfo();
}

function getTabInfo() {
    chrome.tabs.getSelected((tab) => {
        let url = tab.url;
        if (url.indexOf('https://osresearch.atlassian.net/browse') < 0) return;
        if (url.endWith('/')) url = url.substring(0, url.length -1); 
        const splittedUrl = url.split('/');
        const issue = splittedUrl[splittedUrl.length - 1];
        document.querySelector('#logTimeForm #issue').value = issue;
        document.querySelector('#logTimeForm #description').value = 'Working in issue ' + url;
    });
}

logoutBtn.onclick = function () {
    let token = getCookie('token')
    chrome.identity.removeCachedAuthToken({token: token}, () => {
        setCookie('token', '', -1);
        alert('Logout successful');
        location.reload();
    });
}

sheedDataFormSubmit.onclick = function (params) {
    if (!$('#sheedDataForm').valid()) return;

    let data = {
        tabName: $('#sheedDataForm #tabName').val(),
        id: $('#sheedDataForm #id').val(),
        fullName: $('#sheedDataForm #fullName').val()
    };
    localStorage.setItem('sheetData', JSON.stringify(data));
    alert('Data Saved');
    location.reload();
}

logTimeFormSubmit.onclick = () => {
    if (!$('#logTimeForm').valid()) return;
    let sheet = JSON.parse(localStorage.getItem('sheetData'));
    if (!sheet) {
        alert('First add sheet settings');
        return;
    }
    $('#logTimeFormSubmit').addClass('disabled');

    let issue = $('#logTimeForm #issue').val();
    let description = $('#logTimeForm #description').val();
    let worked = $('#logTimeForm #worked').val();
    let type = $('#logTimeForm #type').val();
    let date = $('#logTimeForm #date').val();

    let data = {
        values: [
            [sheet.fullName, issue, description, worked, type, date]
        ]
    };

    httpServices.post(data, (response) => {
        alert('Data Saved');
        location.reload();
    }, (error) => {
        $('#logTimeFormSubmit').removeClass('disabled');
    });
};

authorizeBtn.onclick = function (element) {
    chrome.identity.getAuthToken({ 'interactive': true }, getToken);
};

function getToken(token) {
    setCookie('token', token, 1 / 24);
    alert('Authorized');
    location.reload();
}

function setCookie(cname, cvalue, exdays) {
    let d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function loadLogTimeTab() {
    
}

function loadSheetDataTab() {
    let sheet = JSON.parse(localStorage.getItem('sheetData'));
    if (sheet) {
        document.querySelector('#sheedDataForm #id').value = sheet.id;
        document.querySelector('#sheedDataForm #tabName').value = sheet.tabName;
        document.querySelector('#sheedDataForm #fullName').value = sheet.fullName;
    }
}

function loadAuthorizeTab() {
    let token = getCookie('token');
    if (token) {
        authorizeBtn.hidden = true;
    } else {
        document.getElementById('alreadyAuthorized').hidden = true;
    }
}

function loadHistoryTab() {
    httpServices.get((response) => {
        console.log(response);
    }, (error) => {
        console.log(error);
    });
}

$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    const id = e.target.hash;
    switch (id) {
        case '#tab1':
            loadLogTimeTab();
            break;
        case '#tab2':
            loadHistoryTab();
            break;
        case '#tab3':
            loadSheetDataTab();
            break;
        case '#tab4':
            loadAuthorizeTab();
            break;
    }
});

function init() {
    document.getElementById('date').valueAsDate = new Date();
    getTabInfo();
}

init();