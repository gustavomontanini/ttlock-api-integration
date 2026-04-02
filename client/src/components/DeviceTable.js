import { lockApi } from "../api/lockApi.js";
import { session } from "../utils/session.js";
import { appState } from "../state/appState.js";
import { toast } from "../utils/toast.js";

export class DeviceTable {
  constructor(onLockSelected) {
    this.container = document.getElementById("device-table");
    this.tbody = document.getElementById("device-list-body");
    this.btnFetchLocks = document.getElementById("btn-fetch-locks");
    this.emptyText = document.getElementById("no-devices");

    this.tabOnline = document.getElementById("tab-online");
    this.tabOffline = document.getElementById("tab-offline");

    this.onLockSelected = onLockSelected;

    this.allLocks = [];
    this.currentTab = "online";

    this.bindEvents();
  }

  bindEvents() {
    if (this.btnFetchLocks)
      this.btnFetchLocks.addEventListener("click", () => this.fetchLocks());

    if (this.tabOnline && this.tabOffline) {
      this.tabOnline.addEventListener("click", () => this.switchTab("online"));
      this.tabOffline.addEventListener("click", () =>
        this.switchTab("offline"),
      );
    }

    this.tbody.addEventListener("click", (e) => this.handleSelection(e));
  }

  enable() {
    if (this.btnFetchLocks) this.btnFetchLocks.disabled = false;
  }

  async fetchLocks() {
    const token = session.getToken();
    if (this.btnFetchLocks) this.btnFetchLocks.innerText = "Carregando...";

    try {
      const data = await lockApi.fetchLocks(token);
      this.allLocks = data.list || [];
      this.render();
      toast.info(`${this.allLocks.length} fechaduras carregadas.`);
    } catch (err) {
      toast.error("Falha ao tentar encontrar dispositivos.");
      console.error(err);
    } finally {
      if (this.btnFetchLocks)
        this.btnFetchLocks.innerText = "Encontrar Dispositivos";
    }
  }

  switchTab(tabName) {
    this.currentTab = tabName;

    // Modern Tab Classes
    const activeClass =
      "active-tab bg-background text-foreground shadow-sm px-5 py-1.5 rounded-md text-sm font-bold transition-all cursor-pointer";
    const inactiveClass =
      "text-muted-foreground hover:text-foreground px-5 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer";

    if (tabName === "online") {
      this.tabOnline.className = activeClass;
      this.tabOffline.className = inactiveClass;
    } else {
      this.tabOffline.className = activeClass;
      this.tabOnline.className = inactiveClass;
    }

    this.render();
  }

  render() {
    this.tbody.innerHTML = "";

    if (this.allLocks.length === 0) {
      this.emptyText.innerText = "Não há fechaduras vinculadas a esta conta.";
      this.emptyText.style.display = "block";
      this.container.style.display = "none";
      return;
    }

    const filteredLocks = this.allLocks.filter((lock) => {
      return this.currentTab === "online"
        ? lock.hasGateway === 1
        : lock.hasGateway === 0;
    });

    if (filteredLocks.length === 0) {
      const statusText = this.currentTab === "online" ? "online" : "offline";
      this.emptyText.innerText = `Nenhuma fechadura ${statusText} encontrada.`;
      this.emptyText.style.display = "block";
      this.container.style.display = "none";
      return;
    }

    this.emptyText.style.display = "none";
    this.container.style.display = "table";

    filteredLocks.forEach((lock) => {
      const tr = document.createElement("tr");
      const lockName = lock.lockAlias || "Sem Nome";

      tr.className = "hover:bg-muted/30 transition-colors group";
      tr.innerHTML = `
                <td class="px-6 py-4 text-center whitespace-nowrap font-medium group-hover:text-primary transition-colors">${lockName}</td>
                <td class="px-6 py-4 text-center whitespace-nowrap text-muted-foreground">${lock.lockId}</td>
                <td class="px-6 py-4 text-center whitespace-nowrap">
                    <span class="px-2.5 py-1.5 rounded-full text-xs font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                        ${lock.electricQuantity || 0}%
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                    <button class="select-btn inline-flex items-center justify-center gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer" data-id="${lock.lockId}" data-name="${lockName}">
                        Selecionar
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </button>
                </td>
            `;
      this.tbody.appendChild(tr);
    });
  }

  handleSelection(event) {
    const button = event.target.closest(".select-btn");

    if (button) {
      const id = button.getAttribute("data-id");
      const name = button.getAttribute("data-name");

      appState.setLock(id, name);

      if (this.onLockSelected) {
        this.onLockSelected(id, name);
      }
    }
  }
}
