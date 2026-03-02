export function renderDeviceTable(locks, containerId) {
    const tbody = document.getElementById(containerId);
    tbody.innerHTML = ''; 

    if (!locks || locks.length === 0) return false;

    locks.forEach(lock => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${lock.lockAlias || 'Sem Nome'}</td>
            <td>${lock.lockId}</td>
            <td>${lock.electricQuantity}%</td>
            <td><button class="select-btn action-btn" data-id="${lock.lockId}">Selecionar</button></td>
        `;
        tbody.appendChild(tr);
    });

    return true; // Retorna true informando que houve renderização
}