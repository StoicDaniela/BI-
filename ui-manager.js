// UI Manager - Управление на потребителския интерфейс (Simplified version)
class UIManager {
    constructor() {
        this.alerts = this.loadAlerts();
        this.chart = null;
        this.initializeUI();
    }

    // Зареждане на алерти от localStorage
    loadAlerts() {
        const stored = localStorage.getItem('biSystemAlerts');
        return stored ? JSON.parse(stored) : [];
    }

    // Запазване на алерти в localStorage
    saveAlerts() {
        localStorage.setItem('biSystemAlerts', JSON.stringify(this.alerts));
    }

    // Инициализиране на UI
    initializeUI() {
        this.updateDisplay();
        this.updateLastCheckTime();
        
        // Автоматично обновяване на всеки 5 минути
        setInterval(() => {
            this.updateLastCheckTime();
            this.updateDisplay();
        }, 5 * 60 * 1000);

        // Обновяване на часа на всяка секунда
        setInterval(() => {
            this.updateLastCheckTime();
        }, 1000);
    }

    // Обновяване на цялото показване
    updateDisplay() {
        this.updateStats();
        this.updateDataTable();
        this.updateSimpleChart();
        this.updateAlerts();
        this.updateSystemInfo();
    }

    // Обновяване на статистики
    updateStats() {
        const stats = window.dataManager.getStats();
        const statsGrid = document.getElementById('statsGrid');
        
        if (!statsGrid) return;

        const statCards = [
            {
                icon: '💰',
                label: 'Продажби',
                value: stats.sales.current,
                trend: stats.sales.trend,
                color: '#0D8BB1'
            },
            {
                icon: '👥',
                label: 'Трафик',
                value: stats.traffic.current,
                trend: stats.traffic.trend,
                color: '#0D8BB1'
            },
            {
                icon: '🏭',
                label: 'Производство',
                value: stats.production.current,
                trend: stats.production.trend,
                color: '#0D8BB1'
            },
            {
                icon: '📊',
                label: 'Финанси',
                value: stats.finance.current,
                trend: stats.finance.trend,
                color: '#0D8BB1'
            }
        ];

        statsGrid.innerHTML = statCards.map(stat => `
            <div class="stat-card">
                <h3>${stat.icon} ${stat.value.toLocaleString()}</h3>
                <p>${stat.label}</p>
                <small style="color: rgba(255,255,255,0.8);">
                    ${stat.trend >= 0 ? '↗️' : '↘️'} ${stat.trend >= 0 ? '+' : ''}${stat.trend}
                </small>
            </div>
        `).join('');
    }

    // Обновяване на таблицата с данни
    updateDataTable() {
        const table = document.getElementById('dataTable');
        if (!table) return;

        const tbody = table.querySelector('tbody');
        const data = window.dataManager.data;

        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: #666; font-style: italic;">
                        Няма данни за показване. Добавете първите си данни!
                    </td>
                </tr>
            `;
            return;
        }

        // Показваме последните 10 записа
        const recentData = data.slice(-10).reverse();
        
        tbody.innerHTML = recentData.map(item => `
            <tr>
                <td>${item.date}</td>
                <td>
                    <span style="background: rgba(13, 139, 177, 0.1); color: #0D8BB1; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">
                        ${window.dataManager.getTypeLabel(item.type)}
                    </span>
                </td>
                <td><strong>${item.value.toLocaleString()}</strong></td>
                <td>${item.description}</td>
                <td>
                    <button class="btn btn-danger" onclick="deleteData(${item.id})" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">
                        <i class="fas fa-trash"></i> Изтрий
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Обновяване на опростена графика (без Chart.js временно)
    updateSimpleChart() {
        const chartContainer = document.getElementById('chartContainer');
        if (!chartContainer) return;

        const data = window.dataManager.getChartData();
        
        if (data.length === 0) {
            chartContainer.innerHTML = '📊 Графиката ще се покаже тук след добавяне на данни';
            return;
        }

        // Временно показваме статистики вместо графика
        const stats = window.dataManager.getStats();
        const types = ['sales', 'traffic', 'production', 'finance'];
        
        chartContainer.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; padding: 1rem;">
                ${types.map(type => `
                    <div style="text-align: center; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                        <h4 style="color: #0D8BB1; margin-bottom: 0.5rem;">${window.dataManager.getTypeLabel(type)}</h4>
                        <div style="font-size: 1.5rem; font-weight: bold; color: #333;">${stats[type].current}</div>
                        <div style="font-size: 0.9rem; color: ${stats[type].trend >= 0 ? '#28a745' : '#dc3545'};">
                            ${stats[type].trend >= 0 ? '↗️ +' : '↘️ '}${stats[type].trend}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Обновяване на алертите
    updateAlerts() {
        const alertsContainer = document.getElementById('alertsContainer');
        if (!alertsContainer) return;

        if (this.alerts.length === 0) {
            alertsContainer.innerHTML = `
                <div style="text-align: center; color: #666; font-style: italic; padding: 1rem;">
                    🟢 Няма активни алерти
                </div>
            `;
            return;
        }

        // Показваме последните 5 алерта
        const recentAlerts = this.alerts.slice(-5).reverse();
        
        alertsContainer.innerHTML = recentAlerts.map(alert => `
            <div class="alert alert-${alert.severity}">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        ${alert.severity === 'danger' ? '🚨' : '⚠️'} ${alert.message}
                    </div>
                    <button onclick="uiManager.removeAlert('${alert.timestamp}')" style="background: none; border: none; color: inherit; cursor: pointer; font-size: 1.2rem;">
                        ×
                    </button>
                </div>
                <small style="opacity: 0.8; font-size: 0.8rem;">
                    ${new Date(alert.timestamp).toLocaleString('bg-BG')}
                </small>
            </div>
        `).join('');
    }

    // Добавяне на алерт
    addAlert(alert) {
        this.alerts.push(alert);
        this.saveAlerts();
        this.updateAlerts();
    }

    // Премахване на алерт
    removeAlert(timestamp) {
        this.alerts = this.alerts.filter(alert => alert.timestamp !== timestamp);
        this.saveAlerts();
        this.updateAlerts();
    }

    // Показване на временен алерт
    showAlert(type, message, duration = 3000) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            border-radius: 8px;
        `;
        alertDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>${type === 'success' ? '✅' : type === 'danger' ? '❌' : '⚠️'} ${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer; font-size: 1.2rem; margin-left: 1rem;">×</button>
            </div>
        `;

        document.body.appendChild(alertDiv);

        // Автоматично премахване
        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.remove();
            }
        }, duration);
    }

    // Обновяване на времето на последна проверка
    updateLastCheckTime() {
        const timeElement = document.getElementById('lastCheckTime');
        if (timeElement) {
            const now = new Date();
            timeElement.textContent = now.toLocaleTimeString('bg-BG', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
    }

    // Обновяване на системна информация
    updateSystemInfo() {
        const systemInfo = window.dataManager.getSystemInfo();
        
        const elements = {
            totalUsers: document.getElementById('totalUsers'),
            totalData: document.getElementById('totalData'),
            storageUsed: document.getElementById('storageUsed'),
            lastLogin: document.getElementById('lastLogin')
        };

        Object.keys(elements).forEach(key => {
            if (elements[key]) {
                elements[key].textContent = systemInfo[key];
            }
        });
    }

    // Показване на модал за потвърждение
    showConfirmModal(title, message, onConfirm) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        modal.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 10px; max-width: 400px; width: 90%;">
                <h3 style="margin-bottom: 1rem; color: #0D8BB1;">${title}</h3>
                <p style="margin-bottom: 2rem; color: #333;">${message}</p>
                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button id="cancelBtn" class="btn btn-secondary">Отказ</button>
                    <button id="confirmBtn" class="btn btn-primary">Потвърди</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        modal.querySelector('#cancelBtn').onclick = () => modal.remove();
        modal.querySelector('#confirmBtn').onclick = () => {
            onConfirm();
            modal.remove();
        };

        // Затваряне при клик извън модала
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        };
    }
}

// Инициализиране на глобален обект
window.uiManager = new UIManager();

// Инициализиране след зареждане на DOM
document.addEventListener('DOMContentLoaded', function() {
    // Задаване на днешна дата по подразбиране
    const dateInput = document.getElementById('dataDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    // Първоначално обновяване на дисплея
    if (window.uiManager) {
        window.uiManager.updateDisplay();
    }
});