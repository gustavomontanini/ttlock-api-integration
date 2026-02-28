import md5 from 'blueimp-md5';

// --- Selectors ---
const loginScreen = document.getElementById('login-screen');
const dashboard = document.getElementById('dashboard');
const btnConnect = document.getElementById('btn-connect');
const btnFetchLocks = document.getElementById('btn-fetch-locks');
const deviceTable = document.getElementById('device-table');
const deviceListBody = document.getElementById('device-list-body');
const noDevicesText = document.getElementById('no-devices');
const displayClientId = document.getElementById('display-client-id');

// --- Initialization ---
if (sessionStorage.getItem('tt_token')) {
    showDashboard();
}

// --- Login Logic ---
btnConnect.addEventListener('click', async () => {
    const rawPassword = document.getElementById('password').value;
    const credentials = {
        clientId: document.getElementById('clientId').value,
        clientSecret: document.getElementById('clientSecret').value,
        username: document.getElementById('username').value,
        password: md5(rawPassword) // Encrypting as required by TTLock
    };

    try {
        const response = await fetch('http://localhost:3001/api/auth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        const data = await response.json();

        if (data.access_token) {
            sessionStorage.setItem('tt_token', data.access_token);
            sessionStorage.setItem('tt_cid', credentials.clientId);
            showDashboard();
        } else {
            alert("Login Failed: " + (data.description || "Check credentials"));
        }
    } catch (err) {
        alert("Proxy Server not reachable on port 3001.");
    }
});

// --- Fetch Devices Logic ---
btnFetchLocks.addEventListener('click', async () => {
    const token = sessionStorage.getItem('tt_token');
    const clientId = sessionStorage.getItem('tt_cid');

    try {
        const response = await fetch('http://localhost:3001/api/lock/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken: token, clientId: clientId })
        });
        const data = await response.json();

        if (data.list && data.list.length > 0) {
            noDevicesText.style.display = 'none';
            deviceTable.style.display = 'table';
            deviceListBody.innerHTML = ''; 

            data.list.forEach(lock => {
                const row = `
                    <tr>
                        <td>${lock.lockAlias || 'Unnamed'}</td>
                        <td>${lock.lockId}</td>
                        <td>${lock.electricQuantity}%</td>
                        <td><button class="select-btn" data-id="${lock.lockId}">Select</button></td>
                    </tr>`;
                deviceListBody.insertAdjacentHTML('beforeend', row);
            });
        }
    } catch (err) {
        alert("Error fetching device list.");
    }
});

function showDashboard() {
    loginScreen.style.display = 'none';
    dashboard.style.display = 'block';
    displayClientId.innerText = sessionStorage.getItem('tt_cid');
}

document.getElementById('btn-logout').onclick = () => {
    sessionStorage.clear();
    location.reload();
};