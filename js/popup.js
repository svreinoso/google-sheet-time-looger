let authorizeBtn = document.getElementById('authorizeBtn');
let logoutBtn = document.getElementById('logoutBtn');
let sheedDataFormSubmit = document.getElementById('sheedDataFormSubmit');
let logTimeFormSubmit = document.getElementById('logTimeFormSubmit');
let takeTabInfo = document.getElementById('takeTabInfo');
let selectedWeek, allTimes;

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

function getSelectedWeek (){
    const startOfWeek = moment().startOf('isoWeek');
    const endOfWeek = moment().endOf('isoWeek');

    let days = [];
    let day = startOfWeek;

    while (day <= endOfWeek) {
        days.push(day.toDate());
        day = day.clone().add(1, 'd');
    }

    selectedWeek = {
        startDay: startOfWeek,
        endDay: endOfWeek,
        days: days
    };
}

function deleteLog(selectedRowLog) {
    if (!confirm('Are you sure you want to delete this log?')) return;
    let index = allTimes.indexOf(selectedRowLog);
    console.log(index);
}

function showDaysTimes () {
    selectedWeek.days.forEach(day => {
        let logs = allTimes.filter((value, index) => moment(day).format('YYYY-MM-DD') === value[5]);
        let dayLog = 
        `<div class="day-logs">
            <div class="current-day"><p>${moment(day).format('ddd DD')}</p></div>
            <div>`;
        logs.forEach((row, rowIndex) => {
            dayLog += 
            `<div class="log-row">
                <p>
                    Ticket: <b>${row[1]},</b> 
                    Description: <b>${row[2]},</b> 
                    Time: <b>${row[3]},</b>
                    Type: <b>${row[4]}</b>
                </p>
                <div class="log-actions">
                    <span data-type="edit" data-date="${moment(day).format('YYYY-MM-DD')}" data-index="${rowIndex}">&#9997;</span>
                    <span data-type="delete" data-date="${moment(day).format('YYYY-MM-DD')}" data-index="${rowIndex}">&#10060;</span>
                </div>
            </div>`;
        });
        dayLog +=
        `</div></div>`;
        let div = document.createElement('div');
        div.innerHTML = dayLog;
        document.getElementById('logForDays').append(div);
        document.querySelectorAll('.log-actions span').forEach((element) => {
            let dataset = element.dataset;
            element.onclick = () => {
                let seletedRowLogs = allTimes.filter((value, index) => value[5] === dataset.date);
                let selectedRowLog = seletedRowLogs[dataset.index];
                if (dataset.type === 'delete') {
                    deleteLog(selectedRowLog);
                    return;
                };
                $('#logTimeForm #date').val(selectedRowLog[5]);
                $('#logTimeForm #type').val(selectedRowLog[4]);
                $('#logTimeForm #worked').val(selectedRowLog[3]);
                $('#logTimeForm #description').val(selectedRowLog[2]);
                $('#logTimeForm #issue').val(selectedRowLog[1]);
                $('[href="#tab1"]').tab('show');
            };
        });
    });
}

function loadHistoryTab() {
    getSelectedWeek();
    let selectedWeekValue = selectedWeek.startDay.format('DD MMM YYYY') + ' - ' + selectedWeek.endDay.format('DD MMM YYYY');
    document.getElementById('selectedWeekText').innerText = selectedWeekValue;

    httpServices.get((response) => {
        allTimes = response.values;
        showDaysTimes();
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
    if (!getCookie('token')) chrome.identity.getAuthToken({ 'interactive': true }, getToken);
}

init();