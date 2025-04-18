// DOM Elements
const connectionStatus = document.querySelector('.status-dot');
const connectionStatusText = document.querySelector('.status-text');
const latestUid = document.getElementById('latest-uid');
const latestTimestamp = document.getElementById('latest-timestamp');
const latestAccess = document.getElementById('latest-access');
const logsBody = document.getElementById('logs-body');

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
    }
    
    updateConnectionStatus(data.serialConnected);
}

// Update logs table
function updateLogs(logs) {
    if (!logs || logs.length === 0) {
        logsBody.innerHTML = '<tr><td colspan="3" class="center">No logs available</td></tr>';
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
        
        row.appendChild(uidCell);
        row.appendChild(timestampCell);
        row.appendChild(accessCell);
        
        logsBody.appendChild(row);
    });
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
        logsBody.innerHTML = '<tr><td colspan="3" class="center">Failed to load logs</td></tr>';
    }
}

// Initialize and set up polling
function init() {
    // Initial data fetch
    fetchLatestUID();
    fetchLogs();
    
    // Set up polling for updates
    setInterval(fetchLatestUID, 3000); // Update every 3 seconds
    setInterval(fetchLogs, 5000); // Update logs every 5 seconds
}

// Start when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
