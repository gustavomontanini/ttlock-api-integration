import { passcodeApi } from '../api/passcodeApi.js';
import { session } from '../utils/session.js';
import { appState } from '../state/appState.js';
import { toast } from '../utils/toast.js';

const TYPE_INFO = {
    1: {
        label: 'Permanente',
        description: 'Senha válida indefinidamente. Pode ser usada qualquer número de vezes sem restrição de data.',
        hasDates: false,
    },
    2: {
        label: 'Temporária',
        description: 'Senha válida dentro de um intervalo de datas específico. Ideal para visitas agendadas.',
        hasDates: true,
    },
    3: {
        label: 'Uso Único',
        description: 'Senha que expira após a primeira utilização. Pode ter uma janela de tempo opcional.',
        hasDates: true,
    },
    5: {
        label: 'Apagar Senha',
        description: 'Código especial que, ao ser digitado na fechadura, apaga todas as senhas cadastradas.',
        hasDates: false,
    },
    6: {
        label: 'Congelar',
        description: 'Código que congela temporariamente a fechadura, impedindo abertura por outros métodos.',
        hasDates: false,
    },
    7: {
        label: 'Cíclica',
        description: 'Senha com validade cíclica: repete-se semanalmente dentro do intervalo de tempo definido.',
        hasDates: true,
    },
};

export class PasscodePanel {
    constructor() {
        this.selectedType = 1;

        this.tabs = document.querySelectorAll('.passcode-tab');
        this.dateFields = document.getElementById('passcode-date-fields');
        this.descText = document.getElementById('passcode-type-desc-text');
        this.startDateInput = document.getElementById('passcode-start-date');
        this.endDateInput = document.getElementById('passcode-end-date');
        this.btnGenerate = document.getElementById('btn-generate-passcode');
        this.btnGenerateText = document.getElementById('btn-generate-text');
        this.resultPanel = document.getElementById('passcode-result');
        this.resultValue = document.getElementById('passcode-result-value');
        this.resultValidity = document.getElementById('passcode-result-validity');
        this.errorPanel = document.getElementById('passcode-error');
        this.errorText = document.getElementById('passcode-error-text');
        this.btnCopy = document.getElementById('btn-copy-passcode');
        this.lockNameEl = document.getElementById('passcode-lock-name');

        this.bindEvents();
        this.applyType(1);
    }

    bindEvents() {
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const type = parseInt(tab.getAttribute('data-type'));
                this.applyType(type);
            });
        });

        if (this.btnGenerate) {
            this.btnGenerate.addEventListener('click', () => this.generatePasscode());
        }

        if (this.btnCopy) {
            this.btnCopy.addEventListener('click', () => this.copyPasscode());
        }
    }

    // Called every time the lock view is entered, to sync the lock name
    syncLock() {
        if (this.lockNameEl && appState.selectedLockName) {
            this.lockNameEl.innerText = appState.selectedLockName;
        }
        this.resetResult();
    }

    applyType(type) {
        this.selectedType = type;

        // Update tabs styling
        this.tabs.forEach(tab => {
            const t = parseInt(tab.getAttribute('data-type'));
            if (t === type) {
                tab.className = 'passcode-tab active-tab px-4 py-2 rounded-lg text-sm font-semibold transition-all border bg-primary text-primary-foreground border-primary shadow-sm';
            } else {
                tab.className = 'passcode-tab px-4 py-2 rounded-lg text-sm font-semibold transition-all border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted';
            }
        });

        const info = TYPE_INFO[type] || TYPE_INFO[1];

        // Update description
        if (this.descText) this.descText.innerText = info.description;

        // Show/hide date fields
        if (this.dateFields) {
            if (info.hasDates) {
                this.dateFields.classList.remove('hidden');
                this.dateFields.classList.add('flex');
            } else {
                this.dateFields.classList.add('hidden');
                this.dateFields.classList.remove('flex');
            }
        }

        // Set default dates for timed types if empty
        if (info.hasDates) {
            if (!this.startDateInput.value) {
                this.startDateInput.value = this.formatDatetimeLocal(new Date());
            }
            if (!this.endDateInput.value) {
                const future = new Date();
                future.setDate(future.getDate() + 7);
                this.endDateInput.value = this.formatDatetimeLocal(future);
            }
        }

        this.resetResult();
    }

    resetResult() {
        if (this.resultPanel) this.resultPanel.classList.add('hidden');
        if (this.errorPanel) this.errorPanel.classList.add('hidden');
    }

    async generatePasscode() {
        if (!appState.selectedLockId) {
            toast.error('Nenhuma fechadura selecionada.');
            return;
        }

        const info = TYPE_INFO[this.selectedType];

        let startDate = null;
        let endDate = null;

        if (info.hasDates) {
            if (!this.startDateInput.value || !this.endDateInput.value) {
                toast.error('Por favor, preencha as datas de início e término.');
                return;
            }
            startDate = new Date(this.startDateInput.value).getTime();
            endDate = new Date(this.endDateInput.value).getTime();

            if (endDate <= startDate) {
                toast.error('A data de término deve ser posterior à data de início.');
                return;
            }
        }

        // Set loading state
        this.btnGenerate.disabled = true;
        this.btnGenerateText.innerText = 'Gerando...';
        this.resetResult();

        try {
            const data = await passcodeApi.generateRandomPasscode(
                session.getToken(),
                appState.selectedLockId,
                this.selectedType,
                startDate,
                endDate
            );

            if (data.errcode === 0 || data.keyboardPwd) {
                const code = data.keyboardPwd || data.passcode || '------';
                this.showResult(code, startDate, endDate, info);
                toast.success('Senha gerada com sucesso!');
            } else {
                this.showError(data.errmsg || 'Falha ao gerar a senha. Verifique as permissões.');
                toast.error(`Erro: ${data.errmsg || 'Erro desconhecido'}`);
            }
        } catch (err) {
            console.error(err);
            this.showError('Falha de conexão com o servidor.');
            toast.error('Falha de conexão com o servidor.');
        } finally {
            this.btnGenerate.disabled = false;
            this.btnGenerateText.innerText = 'Gerar Senha';
        }
    }

    showResult(code, startDate, endDate, info) {
        this.resultValue.innerText = code;

        let validityText = '';
        if (info.hasDates && startDate && endDate) {
            const fmt = (ts) => new Date(ts).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
            validityText = `Válida de ${fmt(startDate)} até ${fmt(endDate)}`;
        } else if (this.selectedType === 3) {
            validityText = 'Expira após o primeiro uso';
        } else if (this.selectedType === 5) {
            validityText = 'Código de limpeza de senhas';
        } else if (this.selectedType === 6) {
            validityText = 'Código de congelamento';
        } else {
            validityText = 'Sem data de expiração';
        }

        this.resultValidity.innerText = validityText;
        this.resultPanel.classList.remove('hidden');
        this.errorPanel.classList.add('hidden');
    }

    showError(message) {
        this.errorText.innerText = message;
        this.errorPanel.classList.remove('hidden');
        this.resultPanel.classList.add('hidden');
    }

    async copyPasscode() {
        const code = this.resultValue.innerText;
        if (!code || code === '------') return;

        try {
            await navigator.clipboard.writeText(code);
            toast.success('Senha copiada!');
        } catch {
            toast.info(`Senha: ${code}`);
        }
    }

    formatDatetimeLocal(date) {
        const pad = (n) => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }
}
