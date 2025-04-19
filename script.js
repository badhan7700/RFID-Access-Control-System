// DOM Elements
const connectionStatus = document.querySelector('.status-dot');
const connectionStatusText = document.querySelector('.status-text');
const latestUid = document.getElementById('latest-uid');
const latestTimestamp = document.getElementById('latest-timestamp');
const latestAccess = document.getElementById('latest-access');
const latestBalance = document.getElementById('latest-balance');
const logsBody = document.getElementById('logs-body');
const balancesBody = document.getElementById('balances-body');
const tollAmount = document.getElementById('toll-amount');
const activeUsers = document.getElementById('active-users');
const balanceForm = document.getElementById('balance-form');
const balanceMessage = document.getElementById('balance-message');
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

// Format currency
function formatCurrency(amount) {
    return 'TK ' + Number(amount).toFixed(2);
}

// Format datetime
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(date);
}

// Update connection status
function updateConnectionStatus(isConnected) {
    if (isConnected) {
        connectionStatus.classList.add('connected');
        connectionStatus.classList.remove('disconnected');
        connectionStatusText.textContent = 'Serial Status: Connected';
    } else {
        connectionStatus.classList.add('disconnected');
        connectionStatus.classList.remove('connected');
        connectionStatusText.textContent = 'Serial Status: Disconnected';
    }
}

// Update latest UID display
function updateLatestUID(data) {
    if (data.latestUID) {
        latestUid.textContent = data.latestUID.uid || 'None';
        latestTimestamp.textContent = data.latestUID.timestamp ? formatDateTime(data.latestUID.timestamp) : '-';
        
        // Update access status with appropriate class
        latestAccess.textContent = data.latestUID.access || 'N/A';
        latestAccess.className = data.latestUID.access?.toLowerCase() || 'neutral';
        
        // Update balance if available
        latestBalance.textContent = data.latestUID.balance !== undefined ? 
            formatCurrency(data.latestUID.balance) : '-';
    }
    
    updateConnectionStatus(data.serialConnected);
}

// Update logs table
function updateLogs(logs) {
    if (!logs || logs.length === 0) {
        logsBody.innerHTML = '<tr><td colspan="5" class="center">No logs available</td></tr>';
        return;
    }

    logsBody.innerHTML = '';
    
    logs.forEach(log => {
        const row = document.createElement('tr');
        
        const uidCell = document.createElement('td');
        uidCell.textContent = log.uid;
        
        const timestampCell = document.createElement('td');
        timestampCell.textContent = formatDateTime(log.timestamp);
        
        const accessCell = document.createElement('td');
        accessCell.textContent = log.access || 'N/A';
        accessCell.classList.add(log.access?.toLowerCase() || 'neutral');
        
        const balanceCell = document.createElement('td');
        balanceCell.textContent = log.balance !== undefined ? 
            formatCurrency(log.balance) : '-';
            
        const messageCell = document.createElement('td');
        messageCell.textContent = log.message || '-';
        
        row.appendChild(uidCell);
        row.appendChild(timestampCell);
        row.appendChild(accessCell);
        row.appendChild(balanceCell);
        row.appendChild(messageCell);
        
        logsBody.appendChild(row);
    });
}

// Update balances table
function updateBalances(balances) {
    if (!balances || Object.keys(balances).length === 0) {
        balancesBody.innerHTML = '<tr><td colspan="3" class="center">No balances available</td></tr>';
        return;
    }

    balancesBody.innerHTML = '';
    
    Object.entries(balances).forEach(([uid, balance]) => {
        const row = document.createElement('tr');
        
        const uidCell = document.createElement('td');
        uidCell.textContent = uid;
        
        const balanceCell = document.createElement('td');
        balanceCell.textContent = formatCurrency(balance);
        
        const actionsCell = document.createElement('td');
        const topUpBtn = document.createElement('button');
        topUpBtn.className = 'btn btn-small';
        topUpBtn.textContent = 'Top Up';
        topUpBtn.addEventListener('click', () => {
            document.getElementById('uid-input').value = uid;
            document.getElementById('amount-input').focus();
            switchTab('balances');
        });
        actionsCell.appendChild(topUpBtn);
        
        row.appendChild(uidCell);
        row.appendChild(balanceCell);
        row.appendChild(actionsCell);
        
        balancesBody.appendChild(row);
    });
    
    // Update active users count
    if (activeUsers) {
        activeUsers.textContent = Object.keys(balances).length;
    }
}

// Fetch toll amount
async function fetchTollAmount() {
    try {
        const response = await fetch('/api/toll');
        if (!response.ok) throw new Error('Failed to fetch toll amount');
        
        const data = await response.json();
        tollAmount.textContent = formatCurrency(data.amount);
    } catch (error) {
        console.error('Error fetching toll amount:', error);
        tollAmount.textContent = 'Error';
    }
}

// Fetch latest UID
async function fetchLatestUID() {
    try {
        const response = await fetch('/api/uid');
        if (!response.ok) throw new Error('Failed to fetch latest UID');
        
        const data = await response.json();
        updateLatestUID(data);
    } catch (error) {
        console.error('Error fetching latest UID:', error);
        updateConnectionStatus(false);
    }
}

// Fetch logs
async function fetchLogs() {
    try {
        const response = await fetch('/api/logs');
        if (!response.ok) throw new Error('Failed to fetch logs');
        
        const logs = await response.json();
        updateLogs(logs);
    } catch (error) {
        console.error('Error fetching logs:', error);
        logsBody.innerHTML = '<tr><td colspan="5" class="center">Failed to load logs</td></tr>';
    }
}

// Fetch balances
async function fetchBalances() {
    try {
        const response = await fetch('/api/balances');
        if (!response.ok) throw new Error('Failed to fetch balances');
        
        const balances = await response.json();
        updateBalances(balances);
    } catch (error) {
        console.error('Error fetching balances:', error);
        balancesBody.innerHTML = '<tr><td colspan="3" class="center">Failed to load balances</td></tr>';
    }
}

// Add balance
async function addBalance(uid, amount) {
    try {
        const response = await fetch('/api/balance/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ uid, amount: Number(amount) })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to add balance');
        }
        
        // Display success message
        balanceMessage.textContent = `Balance added successfully! New balance: ${formatCurrency(result.balance)}`;
        balanceMessage.className = 'message success';
        
        // Refresh balances
        fetchBalances();
        
        // Clear form
        document.getElementById('uid-input').value = '';
        document.getElementById('amount-input').value = '100';
        
        // Hide message after 5 seconds
        setTimeout(() => {
            balanceMessage.textContent = '';
            balanceMessage.className = 'message';
        }, 5000);
        
    } catch (error) {
        console.error('Error adding balance:', error);
        balanceMessage.textContent = error.message || 'Failed to add balance';
        balanceMessage.className = 'message error';
    }
}

// Switch tabs
function switchTab(tabId) {
    // Update active button
    tabButtons.forEach(button => {
        if (button.dataset.tab === tabId) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    // Update active content
    tabContents.forEach(content => {
        if (content.id === tabId) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

// Initialize tabs
function initTabs() {
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            switchTab(button.dataset.tab);
        });
    });
}

// Initialize form submission
function initForm() {
    balanceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const uid = document.getElementById('uid-input').value.trim();
        const amount = document.getElementById('amount-input').value;
        
        if (!uid || !amount) {
            balanceMessage.textContent = 'Please fill all fields';
            balanceMessage.className = 'message error';
            return;
        }
        
        addBalance(uid, amount);
    });
}

// Initialize and set up polling
function init() {
    // Initialize UI elements
    initTabs();
    initForm();
    
    // Initial data fetch
    fetchTollAmount();
    fetchLatestUID();
    fetchLogs();
    fetchBalances();
    
    // Set up polling for updates
    setInterval(fetchLatestUID, 3000); // Update every 3 seconds
    setInterval(fetchLogs, 10000); // Update logs every 10 seconds
    setInterval(fetchBalances, 15000); // Update balances every 15 seconds
}

// Start when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
