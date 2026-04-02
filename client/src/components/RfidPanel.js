import { rfidApi } from "../api/rfidApi.js";
import { session } from "../utils/session.js";
import { appState } from "../state/appState.js";
import { toast } from "../utils/toast.js";

export class RfidPanel {
  constructor() {
    this.selectedType = 1;

    this.tabs = document.querySelectorAll(".rfid-tab");
    this.dateFields = document.getElementById("rfid-date-fields");
    this.inputName = document.getElementById("input-rfid-name");
    this.inputNumber = document.getElementById("input-rfid-number");
    this.startDateInput = document.getElementById("rfid-start-date");
    this.endDateInput = document.getElementById("rfid-end-date");
    this.btnAdd = document.getElementById("btn-add-rfid");
    this.btnAddText = document.getElementById("btn-add-rfid-text");
    this.lockNameEl = document.getElementById("rfid-lock-name");

    this.resultPanel = document.getElementById("rfid-result");
    this.errorPanel = document.getElementById("rfid-error");
    this.errorText = document.getElementById("rfid-error-text");

    this.bindEvents();
    this.applyType(1);
  }

  bindEvents() {
    this.tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const type = parseInt(tab.getAttribute("data-type"));
        this.applyType(type);
      });
    });

    if (this.btnAdd) {
      this.btnAdd.addEventListener("click", () => this.addCard());
    }
  }

  syncLock() {
    if (this.lockNameEl && appState.selectedLockName) {
      this.lockNameEl.innerText = appState.selectedLockName;
    }
    this.resetResult();
  }

  applyType(type) {
    this.selectedType = type;

    this.tabs.forEach((tab) => {
      const t = parseInt(tab.getAttribute("data-type"));
      if (t === type) {
        tab.className =
          "rfid-tab active-tab px-4 py-2 rounded-lg text-sm font-semibold transition-all border bg-secondary text-secondary-foreground border-primary/20 shadow-sm";
      } else {
        tab.className =
          "rfid-tab px-4 py-2 rounded-lg text-sm font-semibold transition-all border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted";
      }
    });

    if (this.dateFields) {
      this.dateFields.style.display = type === 2 ? "flex" : "none";
    }

    if (type === 2) {
      if (!this.startDateInput.value)
        this.startDateInput.value = this.formatDatetimeLocal(new Date());
      if (!this.endDateInput.value) {
        const future = new Date();
        future.setDate(future.getDate() + 30);
        this.endDateInput.value = this.formatDatetimeLocal(future);
      }
    }

    this.resetResult();
  }

  resetResult() {
    if (this.resultPanel) this.resultPanel.classList.add("hidden");
    if (this.errorPanel) this.errorPanel.classList.add("hidden");
  }

  async addCard() {
    if (!appState.selectedLockId)
      return toast.error("Nenhuma fechadura selecionada.");

    const name = this.inputName.value.trim() || "Cartão RFID";
    const number = this.inputNumber.value.trim();

    // STRICT VALIDATION: Card number is required for Gateway pushes
    if (!number) {
      return toast.error(
        "O número do cartão é obrigatório para registro via Gateway.",
      );
    }

    let startDate = 0;
    let endDate = 0;

    if (this.selectedType === 2) {
      if (!this.startDateInput.value || !this.endDateInput.value) {
        return toast.error("Preencha as datas de início e término.");
      }
      startDate = new Date(this.startDateInput.value).getTime();
      endDate = new Date(this.endDateInput.value).getTime();

      if (endDate <= startDate)
        return toast.error(
          "A data de término deve ser posterior à data de início.",
        );
    }

    this.btnAdd.disabled = true;
    this.btnAddText.innerText = "Comunicando com o Gateway...";
    this.resetResult();

    try {
      const data = await rfidApi.addCard({
        accessToken: session.getToken(),
        lockId: appState.selectedLockId,
        cardNumber: number,
        name: name,
        startDate: startDate,
        endDate: endDate,
      });

      if (!data.errcode || data.errcode === 0 || data.cardId) {
        toast.success("Cartão sincronizado com sucesso!");

        this.resultPanel.classList.remove("hidden");
        this.inputName.value = "";
        this.inputNumber.value = "";
      } else {
        this.errorText.innerText =
          data.errmsg || "O Gateway não conseguiu registrar o cartão.";
        this.errorPanel.classList.remove("hidden");
      }
    } catch (err) {
      console.error(err);
      this.errorText.innerText = "Falha de conexão com o servidor proxy.";
      this.errorPanel.classList.remove("hidden");
    } finally {
      this.btnAdd.disabled = false;
      this.btnAddText.innerText = "Adicionar Cartão via Gateway";
    }
  }

  formatDatetimeLocal(date) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}
