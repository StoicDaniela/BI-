// Data Manager - Управление на данни и логика
class DataManager {
    constructor() {
        this.data = this.loadData();
        this.thresholds = this.loadThresholds();
        this.initializeSystem();
    }

    // Зареждане на данни от localStorage
    loadData() {
        const stored = localStorage.getItem('biSystemData');
        return stored ? JSON.parse(stored) : [];
    }

    // Запазване на данни в localStorage
    saveData() {
        localStorage.setItem('biSystemData', JSON.stringify(this.data));
    }

    // Зареждане на прагове за алерти
    loadThresholds() {
        const stored = localStorage.getItem('biSystemThresholds');
        return stored ? JSON.parse(stored) : {
            sales: { min: 1000, max: 10000 },
            traffic: { min: 500, max: 5000 },
            production: { min: 100, max: 1000 },
            finance: { min: 5000, max: 50000 }
        };
    }

    // Запазване на прагове
    saveThresholds() {
        localStorage.setItem('biSystemThresholds', JSON.stringify(this.thresholds));
    }

    // Добавяне на нови данни
    addData(date, type, value, description) {
        const newEntry = {
            id: Date.now(),
            date: date,
            type: type,
            value: parseFloat(value),
            description: description,
            timestamp: new Date().toISOString()
        };

        this.data.push(newEntry);
        this.saveData();
        this.checkForAnomalies(newEntry);
        return newEntry;
    }

    // Изтриване на данни
    deleteData(id) {
        this.data = this.data.filter(item => item.id !== parseInt(id));
        this.saveData();
    }

    // Импорт от CSV
    importFromCSV(csvText) {
        const lines = csvText.split('\n');
        const imported = [];
        
        for (let i = 1; i < lines.length; i++) { // Пропускаме header-а
            const line = lines[i].trim();
            if (line) {
                const [date, value, type, description] = line.split(',');
                if (date && value && type) {
                    const entry = this.addData(
                        date.trim(),
                        type.trim(),
                        parseFloat(value.trim()),
                        description ? description.trim() : ''
                    );
                    imported.push(entry);
                }
            }
        }
        
        return imported;
    }

    // Експорт към CSV
    exportToCSV() {
        const headers = ['Дата', 'Стойност', 'Тип', 'Описание'];
        const csvContent = [
            headers.join(','),
            ...this.data.map(item => 
                `${item.date},${item.value},${item.type},"${item.description}"`
            )
        ].join('\n');
        
        return csvContent;
    }

    // Проверка за аномалии
    checkForAnomalies(entry) {
        const threshold = this.thresholds[entry.type];
        if (!threshold) return null;

        let anomaly = null;
        if (entry.value < threshold.min) {
            anomaly = {
                type: 'low',
                message: `Ниска стойност за ${this.getTypeLabel(entry.type)}: ${entry.value}`,
                severity: 'warning',
                timestamp: new Date().toISOString()
            };
        } else if (entry.value > threshold.max) {
            anomaly = {
                type: 'high', 
                message: `Висока стойност за ${this.getTypeLabel(entry.type)}: ${entry.value}`,
                severity: 'danger',
                timestamp: new Date().toISOString()
            };
        }

        if (anomaly && window.uiManager) {
            window.uiManager.addAlert(anomaly);
        }

        return anomaly;
    }

    // Получаване на етикет за тип
    getTypeLabel(type) {
        const labels = {
            sales: 'Продажби',
            traffic: 'Трафик', 
            production: 'Производство',
            finance: 'Финанси'
        };
        return labels[type] || type;
    }

    // Получаване на статистики
    getStats() {
        if (this.data.length === 0) {
            return {
                sales: { current: 0, trend: 0, total: 0 },
                traffic: { current: 0, trend: 0, total: 0 },
                production: { current: 0, trend: 0, total: 0 },
                finance: { current: 0, trend: 0, total: 0 }
            };
        }

        const stats = {};
        const types = ['sales', 'traffic', 'production', 'finance'];
        
        types.forEach(type => {
            const typeData = this.data.filter(item => item.type === type);
            if (typeData.length > 0) {
                const values = typeData.map(item => item.value);
                const current = values[values.length - 1] || 0;
                const previous = values[values.length - 2] || current;
                const trend = current - previous;
                const total = values.reduce((sum, val) => sum + val, 0);
                
                stats[type] = { current, trend, total };
            } else {
                stats[type] = { current: 0, trend: 0, total: 0 };
            }
        });

        return stats;
    }

    // Получаване на данни за графика
    getChartData(type = null, days = 30) {
        let filteredData = this.data;
        
        if (type) {
            filteredData = this.data.filter(item => item.type === type);
        }

        // Филтриране по дни
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        filteredData = filteredData.filter(item => 
            new Date(item.date) >= cutoffDate
        );

        // Сортиране по дата
        filteredData.sort((a, b) => new Date(a.date) - new Date(b.date));

        return filteredData;
    }

    // Изчистване на всички данни
    clearAllData() {
        this.data = [];
        this.saveData();
        localStorage.removeItem('biSystemAlerts');
    }

    // Инициализиране на системата
    initializeSystem() {
        // Автоматично запазване на данни на всеки 5 минути
        setInterval(() => {
            this.saveData();
        }, 5 * 60 * 1000);

        // Симулация на нови данни (за демо)
        if (this.data.length === 0) {
            this.generateSampleData();
        }
    }

    // Генериране на примерни данни
    generateSampleData() {
        const types = ['sales', 'traffic', 'production', 'finance'];
        const today = new Date();
        
        for (let i = 7; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            types.forEach(type => {
                const value = Math.floor(Math.random() * 5000) + 1000;
                this.addData(
                    date.toISOString().split('T')[0],
                    type,
                    value,
                    `Автоматично генерирани данни`
                );
            });
        }
    }

    // Получаване на системна информация
    getSystemInfo() {
        const dataSize = new Blob([JSON.stringify(this.data)]).size;
        const formatSize = (bytes) => {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
            return Math.round(bytes / (1024 * 1024)) + ' MB';
        };

        return {
            totalUsers: 1,
            totalData: this.data.length,
            storageUsed: formatSize(dataSize),
            lastLogin: 'Сега'
        };
    }
}

// Инициализиране на глобален обект
window.dataManager = new DataManager();

// Глобални функции за достъп от HTML
window.addData = function() {
    const date = document.getElementById('dataDate').value;
    const type = document.getElementById('dataType').value;
    const value = document.getElementById('dataValue').value;
    const description = document.getElementById('dataDescription').value;

    if (!date || !type || !value) {
        alert('Моля, попълнете всички задължителни полета!');
        return;
    }

    window.dataManager.addData(date, type, value, description);
    
    // Изчистване на формата
    document.getElementById('dataDate').value = '';
    document.getElementById('dataType').value = '';
    document.getElementById('dataValue').value = '';
    document.getElementById('dataDescription').value = '';

    // Обновяване на UI
    if (window.uiManager) {
        window.uiManager.updateDisplay();
        window.uiManager.showAlert('success', 'Данните са добавени успешно!');
    }
};

window.deleteData = function(id) {
    if (confirm('Сигурни ли сте, че искате да изтриете този запис?')) {
        window.dataManager.deleteData(id);
        if (window.uiManager) {
            window.uiManager.updateDisplay();
            window.uiManager.showAlert('success', 'Записът е изтрит!');
        }
    }
};

window.exportData = function() {
    const csvContent = window.dataManager.exportToCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bi-data-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    if (window.uiManager) {
        window.uiManager.showAlert('success', 'Данните са експортирани!');
    }
};

window.importCSV = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const csvText = e.target.result;
            const imported = window.dataManager.importFromCSV(csvText);
            
            if (window.uiManager) {
                window.uiManager.updateDisplay();
                window.uiManager.showAlert('success', `Импортирани са ${imported.length} записа!`);
            }
        } catch (error) {
            console.error('Грешка при импорт:', error);
            if (window.uiManager) {
                window.uiManager.showAlert('danger', 'Грешка при импорт на файла!');
            }
        }
    };
    reader.readAsText(file);
};

window.clearCache = function() {
    if (confirm('Това ще изчисти кеша на браузъра. Продължавате?')) {
        localStorage.clear();
        if (window.uiManager) {
            window.uiManager.showAlert('success', 'Кешът е изчистен!');
        }
        setTimeout(() => location.reload(), 1000);
    }
};

window.resetSystem = function() {
    if (confirm('ВНИМАНИЕ: Това ще изтрие всички данни! Сигурни ли сте?')) {
        if (confirm('Това действие е необратимо. Потвърдете отново:')) {
            window.dataManager.clearAllData();
            localStorage.clear();
            if (window.uiManager) {
                window.uiManager.showAlert('success', 'Системата е нулирана!');
            }
            setTimeout(() => location.reload(), 1500);
        }
    }
};