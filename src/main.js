import md5 from 'blueimp-md5';
import { apiClient } from './api/apiClient.js';
import { session } from './utils/session.js';
import { renderDeviceTable } from './components/DeviceTable.js';

// 1. Elementos do DOM Cacheados
const ui = {
    screens: {
        login: document.getElementById('login-screen'),
        dashboard: document.getElementById('dashboard'),
    },
    buttons: {
        connect: document.getElementById('btn-connect'),
        logout: document.getElementById('btn-logout'),
        fetchLocks: document.getElementById('btn-fetch-locks'),
    },
    table: {
        container: document.getElementById('device-table'),
        bodyId: 'device-list-body',
        emptyText: document.getElementById('no-devices')
    },
    texts: {
        displayClientId: document.getElementById('display-client-id')
    }
};

// 2. Inicialização
function init() {
    if (session.isAuthenticated()) {
        showDashboard();
    } else {
        showLogin();
    }
    setupEventListeners();
}

// 3. Controladores de View
function showDashboard() {
    ui.screens.login.style.display = 'none';
    ui.screens.dashboard.style.display = 'block';
    ui.texts.displayClientId.innerText = session.getClientId();
}

function showLogin() {
    ui.screens.login.style.display = 'flex';
    ui.screens.dashboard.style.display = 'none';
}

// 4. Eventos
function setupEventListeners() {
    ui.buttons.connect.addEventListener('click', handleLogin);
    ui.buttons.logout.addEventListener('click', () => {
        session.clear();
        location.reload();
    });
    ui.buttons.fetchLocks.addEventListener('click', handleFetchLocks);
}

// 5. Lógica de Negócios (Handlers)
async function handleLogin() {
    const clientId = document.getElementById('clientId').value;
    const clientSecret = document.getElementById('clientSecret').value;
    const username = document.getElementById('username').value;
    const rawPassword = document.getElementById('password').value;

    if (!clientId || !clientSecret || !username || !rawPassword) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    // Mudança do texto do botão para dar feedback visual
    ui.buttons.connect.innerText = "Conectando...";

    const credentials = {
        clientId,
        clientSecret,
        username,
        password: md5(rawPassword)
    };

    try {
        const data = await apiClient.login(credentials);

        if (data.access_token) {
            session.save(data.access_token, credentials.clientId);
            showDashboard();
        } else {
            alert("Falha no login: " + (data.description || "Verifique suas credenciais."));
        }
    } catch (err) {
        alert("Erro de conexão. O servidor Proxy (Porta 3001) está rodando?");
    } finally {
        ui.buttons.connect.innerText = "Initialize Session";
    }
}

async function handleFetchLocks() {
    const token = session.getToken();
    const clientId = session.getClientId();
    ui.buttons.fetchLocks.innerText = "Carregando...";

    try {
        const data = await apiClient.fetchLocks(clientId, token);
        const hasLocks = renderDeviceTable(data.list, ui.table.bodyId);

        if (hasLocks) {
            ui.table.emptyText.style.display = 'none';
            ui.table.container.style.display = 'table';
        } else {
            ui.table.emptyText.innerText = "Nenhuma fechadura vinculada a esta conta.";
            ui.table.emptyText.style.display = 'block';
        }
    } catch (err) {
        alert("Erro ao buscar a lista de fechaduras.");
    } finally {
        ui.buttons.fetchLocks.innerText = "Fetch Device List";
    }
}

// Inicia a aplicação
init();