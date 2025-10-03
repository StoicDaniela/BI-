// BI Alarm Application Logic
// Enhanced with Authentication & Admin Features

// Global application state
let currentScreen = 'dashboard';
let selectedMetric = null;
let currentStep = 1;
let alerts = [
    {
        id: 1,
        metric: 'Общи Продажби',
        threshold: 'Спад > 15% спрямо вчера',
        status: 'Активна',
        active: true,
        owner: 'daniela@example.com'
    },
    {
        id: 2,
        metric: 'Брой Клиенти',
        threshold: 'Спад > 20% спрямо миналата седмица', 
        status: 'Активна',
        active: true,
        owner: 'petar@company.bg'
    }
];

// Anomalies data
let anomalies = [
    {
        id: 1,
        metric: 'Общи Продажби',
        severity: 'critical',
        change: -18,
        period: 'вчера',
        time: '2 часа',
        detected: '2025-10-02 10:30',
        notes: 'Възможно влияние от промоционалната кампания, която приключи вчера.'
    },
    {
        id: 2,
        metric: 'Средна Стойност Кошница',
        severity: 'warning',
        change: -8,
        period: 'вчера',
        time: '5 часа',
        detected: '2025-10-02 07:15',
        notes: ''
    },
    {
        id: 3,
        metric: 'Брой Клиенти',
        severity: 'normal',
        change: 3,
        period: 'вчера',
        time: '1 час',
        detected: '2025-10-02 12:00',
        notes: 'Леко увеличение в рамките на нормата.'
    }
];

// Show specific screen
function showScreen(screenId) {
    // Check authentication
    if (!window.authSystem.isAuthenticated()) {
        showNotification('Трябва да влезете в системата!', 'warning');
        return;
    }
    
    // Check admin access
    if (screenId === 'adminPanel' && !window.authSystem.hasPermission('admin')) {
        showNotification('Нямате права за достъп до административния панел!', 'error');
        return;
    }
    
    // Hide all screens
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show selected screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        currentScreen = screenId;
        
        // Update navigation
        updateNavigation(screenId);
        
        // Load screen-specific data
        loadScreenData(screenId);
    }
}

// Update navigation active state
function updateNavigation(activeScreen) {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Find and activate the correct nav button
    const activeBtn = document.querySelector(`[onclick="showScreen('${activeScreen}')"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

// Load screen-specific data
function loadScreenData(screenId) {
    switch (screenId) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'alerts':
            loadAlertsData();
            break;
        case 'details':
            loadDetailsData();
            break;
        case 'adminPanel':
            loadAdminData();
            break;
        case 'marketBasket':
            loadMarketBasketData();
            break;
    }
}

// Load dashboard data with user-specific information
function loadDashboardData() {
    const user = window.authSystem.currentUser();
    if (!user) return;
    
    // Filter anomalies based on user permissions
    let userAnomalies = anomalies;
    if (!window.authSystem.hasPermission('admin')) {
        // Regular users see only their own or public alerts
        userAnomalies = anomalies.filter(anomaly => 
            anomaly.public || anomaly.owner === user.email
        );
    }
    
    // Update summary cards with real-time data
    updateSummaryCards(userAnomalies);
    
    // Update notifications list
    updateNotificationsList(userAnomalies);
}

// Update summary cards
function updateSummaryCards(userAnomalies) {
    const criticalCount = userAnomalies.filter(a => a.severity === 'critical').length;
    const totalMetrics = alerts.length;
    const accuracy = calculateAccuracy();
    
    const summaryCards = document.querySelectorAll('.summary-card h3');
    if (summaryCards.length >= 3) {
        summaryCards[0].textContent = criticalCount;
        summaryCards[1].textContent = totalMetrics;
        summaryCards[2].textContent = accuracy + '%';
    }
}

// Calculate system accuracy
function calculateAccuracy() {
    // Simulate accuracy calculation
    const baseAccuracy = 94;
    const variation = Math.floor(Math.random() * 6) - 3; // ±3%
    return Math.max(85, Math.min(99, baseAccuracy + variation));
}

// Update notifications list
function updateNotificationsList(userAnomalies) {
    const notificationsList = document.querySelector('.notifications-list');
    if (!notificationsList) return;
    
    // Clear existing notifications
    notificationsList.innerHTML = '';
    
    // Add user-specific notifications
    userAnomalies.forEach(anomaly => {
        const notificationCard = createNotificationCard(anomaly);
        notificationsList.appendChild(notificationCard);
    });
}

// Create notification card element
function createNotificationCard(anomaly) {
    const card = document.createElement('div');
    card.className = `notification-card ${anomaly.severity}`;
    card.onclick = () => showAnomalyDetails(anomaly.id);
    
    const changeSymbol = anomaly.change > 0 ? '+' : '';
    const changeText = anomaly.change > 0 ? 'Растеж' : 'Спад';
    
    card.innerHTML = `
        <div class="notification-content">
            <div class="notification-info">
                <h4>${anomaly.metric}</h4>
                <p>${getSeverityText(anomaly.severity)} детектирано</p>
            </div>
            <div class="notification-meta">
                <div class="notification-value">${changeSymbol}${anomaly.change}%</div>
                <div>${changeText} спрямо ${anomaly.period}</div>
                <div>Преди ${anomaly.time}</div>
            </div>
        </div>
    `;
    
    return card;
}

// Get severity text in Bulgarian
function getSeverityText(severity) {
    switch (severity) {
        case 'critical': return 'Критично състояние';
        case 'warning': return 'Предупреждение';
        case 'normal': return 'Нормални стойности';
        default: return 'Неизвестно състояние';
    }
}

// Show anomaly details
function showAnomalyDetails(anomalyId) {
    const anomaly = anomalies.find(a => a.id === anomalyId);
    if (!anomaly) return;
    
    // Update details screen with anomaly data
    updateDetailsScreen(anomaly);
    
    // Switch to details screen
    showScreen('details');
}

// Update details screen with specific anomaly data
function updateDetailsScreen(anomaly) {
    const detailsCard = document.querySelector('.details-card');
    if (!detailsCard) return;
    
    // Update title
    const title = detailsCard.querySelector('h3');
    if (title) {
        title.textContent = `${anomaly.metric} - ${getSeverityText(anomaly.severity)}`;
    }
    
    // Update detail items
    const detailItems = detailsCard.querySelectorAll('.detail-item .value');
    if (detailItems.length >= 4) {
        detailItems[0].textContent = anomaly.metric;
        detailItems[1].textContent = `Спад с повече от 15% спрямо ${anomaly.period}`;
        detailItems[2].textContent = `${anomaly.change}%`;
        detailItems[2].className = `value ${anomaly.severity}`;
        detailItems[3].textContent = anomaly.detected;
    }
    
    // Update notes
    const notesTextarea = detailsCard.querySelector('textarea');
    if (notesTextarea) {
        notesTextarea.value = anomaly.notes || '';
    }
}

// Load alerts data
function loadAlertsData() {
    updateAlertsTable();
}

// Update alerts table
function updateAlertsTable() {
    const user = window.authSystem.currentUser();
    if (!user) return;
    
    const alarmsList = document.querySelector('.alarms-list');
    if (!alarmsList) return;
    
    // Filter alerts based on user permissions
    let userAlerts = alerts;
    if (!window.authSystem.hasPermission('admin')) {
        userAlerts = alerts.filter(alert => alert.owner === user.email);
    }
    
    // Clear existing alerts
    alarmsList.innerHTML = '';
    
    // Add user-specific alerts
    userAlerts.forEach(alert => {
        const alarmItem = createAlarmItem(alert);
        alarmsList.appendChild(alarmItem);
    });
    
    // Update navigation badge
    updateAlarmsBadge(userAlerts.length);
}

// Create alarm item element
function createAlarmItem(alert) {
    const item = document.createElement('div');
    item.className = 'alarm-item';
    
    item.innerHTML = `
        <div class="alarm-info">
            <h4>${alert.metric}</h4>
            <p>${alert.threshold}</p>
        </div>
        <div class="alarm-controls">
            <span class="status-badge">${alert.status}</span>
            <button class="alarm-control" onclick="toggleAlert(this, ${alert.id})" 
                    title="${alert.active ? 'Пауза' : 'Активирай'}">
                ${alert.active ? '⏸️' : '▶️'}
            </button>
        </div>
    `;
    
    return item;
}

// Update alarms badge in navigation
function updateAlarmsBadge(count) {
    const alarmNavBtn = document.querySelector('[onclick="showScreen(\'alerts\')"] span:last-child');
    if (alarmNavBtn) {
        alarmNavBtn.textContent = `Аларми (${count})`;
    }
}

// Load admin data
function loadAdminData() {
    if (!window.authSystem.hasPermission('admin')) {
        showNotification('Нямате права за достъп до административния панел!', 'error');
        return;
    }
    
    updateAdminStats();
    updateUsersTable();
}

// Update admin statistics
function updateAdminStats() {
    const users = window.authSystem.getAllUsers();
    const totalUsers = users.length;
    const totalAlerts = alerts.length;
    const totalAnomalies = anomalies.length;
    const uptime = calculateUptime();
    
    const adminCards = document.querySelectorAll('.admin-card h3');
    if (adminCards.length >= 4) {
        adminCards[0].textContent = totalUsers;
        adminCards[1].textContent = totalAlerts;
        adminCards[2].textContent = totalAnomalies;
        adminCards[3].textContent = uptime + '%';
    }
}

// Calculate system uptime
function calculateUptime() {
    return Math.floor(Math.random() * 5) + 95; // 95-99%
}

// Update users table in admin panel
function updateUsersTable() {
    const users = window.authSystem.getAllUsers();
    const tbody = document.querySelector('.users-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const row = createUserRow(user);
        tbody.appendChild(row);
    });
}

// Create user row for admin table
function createUserRow(user) {
    const row = document.createElement('tr');
    const timeAgo = formatTimeAgo(user.lastActivity);
    
    row.innerHTML = `
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${user.company}</td>
        <td>
            <select class="role-select" onchange="changeUserRole(${user.id}, this.value)">
                <option value="Потребител" ${user.role === 'Потребител' ? 'selected' : ''}>Потребител</option>
                <option value="Аналитик" ${user.role === 'Аналитик' ? 'selected' : ''}>Аналитик</option>
                <option value="Администратор" ${user.role === 'Администратор' ? 'selected' : ''}>Администратор</option>
            </select>
        </td>
        <td>${timeAgo}</td>
        <td>
            <button class="btn btn-primary" style="padding: 5px 10px; font-size: 0.8rem;" 
                    onclick="editUser(${user.id})">Редактирай</button>
        </td>
    `;
    
    return row;
}

// Format time ago
function formatTimeAgo(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 60) {
        return `Преди ${minutes} мин`;
    } else if (hours < 24) {
        return `Преди ${hours} часа`;
    } else {
        return `Преди ${days} дни`;
    }
}

// Change user role (admin function)
function changeUserRole(userId, newRole) {
    if (!window.authSystem.hasPermission('admin')) {
        showNotification('Нямате права за тази операция!', 'error');
        return;
    }
    
    if (window.authSystem.updateUserRole(userId, newRole)) {
        // Refresh admin data
        loadAdminData();
    }
}

// Edit user (admin function)
function editUser(userId) {
    if (!window.authSystem.hasPermission('admin')) {
        showNotification('Нямате права за тази операция!', 'error');
        return;
    }
    
    showNotification('Функционалността за редактиране ще бъде налична скоро!', 'info');
}

// Metric selection
function selectMetric(metric, element) {
    if (!window.authSystem.hasPermission('write')) {
        showNotification('Нямате права за създаване на аларми!', 'error');
        return;
    }
    
    // Remove selection from all options
    document.querySelectorAll('.metric-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Add selection to clicked option
    element.classList.add('selected');
    selectedMetric = metric;
}

// Step navigation
function nextStep(step) {
    if (!window.authSystem.hasPermission('write')) {
        showNotification('Нямате права за създаване на аларми!', 'error');
        return;
    }
    
    if (step === 2 && !selectedMetric) {
        showNotification('Моля изберете метрика!', 'warning');
        return;
    }
    
    // Hide current step
    document.getElementById(`step${currentStep}`).style.display = 'none';
    
    // Show next step
    document.getElementById(`step${step}`).style.display = 'block';
    currentStep = step;
}

function prevStep(step) {
    // Hide current step
    document.getElementById(`step${currentStep}`).style.display = 'none';
    
    // Show previous step
    document.getElementById(`step${step}`).style.display = 'block';
    currentStep = step;
}

// Create alert
function createAlert() {
    if (!window.authSystem.hasPermission('write')) {
        showNotification('Нямате права за създаване на аларми!', 'error');
        return;
    }
    
    if (!selectedMetric) {
        showNotification('Моля изберете метрика!', 'warning');
        return;
    }
    
    const user = window.authSystem.currentUser();
    
    // Create new alert
    const newAlert = {
        id: alerts.length + 1,
        metric: getMetricName(selectedMetric),
        threshold: 'Спад > 15% спрямо вчера', // Default threshold
        status: 'Активна',
        active: true,
        owner: user ? user.email : 'unknown'
    };
    
    alerts.push(newAlert);
    
    showNotification('Алармата е създадена успешно!', 'success');
    
    // Reset form
    selectedMetric = null;
    currentStep = 1;
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'none';
    document.getElementById('step1').style.display = 'block';
    
    // Clear selection
    document.querySelectorAll('.metric-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Refresh alerts data
    updateAlertsTable();
}

// Get metric name by ID
function getMetricName(metricId) {
    const metrics = {
        'sales': 'Общи Продажби',
        'basket': 'Средна Стойност Кошница',
        'customers': 'Брой Клиенти',
        'loading': 'Време за Зареждане',
        'conversion': 'Коефициент на Конверсия',
        'registrations': 'Нови Регистрации'
    };
    return metrics[metricId] || 'Неизвестна метрика';
}

// Toggle alert
function toggleAlert(button, alertId) {
    if (!window.authSystem.hasPermission('write')) {
        showNotification('Нямате права за управление на аларми!', 'error');
        return;
    }
    
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return;
    
    alert.active = !alert.active;
    alert.status = alert.active ? 'Активна' : 'Спряна';
    
    // Update button
    button.textContent = alert.active ? '⏸️' : '▶️';
    button.title = alert.active ? 'Пауза' : 'Активирай';
    
    // Update status badge
    const statusBadge = button.parentElement.querySelector('.status-badge');
    if (statusBadge) {
        statusBadge.textContent = alert.status;
        statusBadge.style.background = alert.active ? '#48dbfb' : '#6c757d';
    }
    
    showNotification(`Алармата е ${alert.active ? 'активирана' : 'спряна'}!`, 'info');
}

// Save notes
function saveNotes() {
    if (!window.authSystem.hasPermission('write')) {
        showNotification('Нямате права за редактиране на бележки!', 'error');
        return;
    }
    
    const notesTextarea = document.querySelector('.notes-section textarea');
    if (notesTextarea) {
        const notes = notesTextarea.value;
        // In a real app, this would save to a database
        showNotification('Бележката е запазена!', 'success');
    }
}

// Initialize application
function initializeApp() {
    // Check if user is authenticated
    if (window.authSystem && window.authSystem.isAuthenticated()) {
        showScreen('dashboard');
    }
}

// Notification system for app (different from auth notifications)
function showNotification(message, type = 'info') {
    // Use the auth system's notification if available
    if (window.authSystem && typeof window.authSystem === 'object') {
        // Call the notification from auth.js
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            // Fallback to simple alert
            alert(message);
        }
    } else {
        alert(message);
    }
}

// Load Market Basket Analysis data
function loadMarketBasketData() {
    // Initialize the market basket analyzer if not already done
    if (!window.marketBasketAnalyzer) {
        window.marketBasketAnalyzer = new MarketBasketAnalyzer();
    }
    
    // Reset the UI state
    const previewSection = document.getElementById('dataPreviewSection');
    const resultsSection = document.getElementById('analysisResultsSection');
    const statusDiv = document.getElementById('uploadStatus');
    
    if (previewSection) previewSection.style.display = 'none';
    if (resultsSection) resultsSection.style.display = 'none';
    if (statusDiv) statusDiv.style.display = 'none';
    
    // Clear file input
    const fileInput = document.getElementById('xlsxFileInput');
    if (fileInput) fileInput.value = '';
    
    console.log('Market Basket Analysis screen loaded');
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure auth system is loaded
    setTimeout(initializeApp, 100);
});

// Export functions for global access
window.appSystem = {
    showScreen,
    selectMetric,
    nextStep,
    prevStep,
    createAlert,
    toggleAlert,
    saveNotes,
    showAnomalyDetails,
    loadScreenData
};