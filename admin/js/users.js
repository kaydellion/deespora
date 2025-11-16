// Users Page Logic
let allUsers = [];

// Load users when page loads
document.addEventListener('DOMContentLoaded', async function() {
    await loadUsers();
});

// Load users from API
async function loadUsers() {
    try {
        // Show loading in table
        showUsersLoading();
        
        // Fetch users from API
        const data = await API.getUsers();
        allUsers = data;
        
        // Display in table
        displayUsers(allUsers);
        
    } catch (error) {
        console.error('Error loading users:', error);
        showUsersError('Failed to load users');
    }
}

// Display users in table
function displayUsers(users) {
    const tableBody = document.querySelector('#myTable tbody');
    
    if (!tableBody) {
        console.error('Table body not found');
        return;
    }
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // If no users
    if (!users || users.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4">No users found</td></tr>';
        return;
    }
    
    // Add rows for each user
    users.forEach((user, index) => {
        const row = createUserRow(user, index);
        tableBody.innerHTML += row;
    });
}

// Create a table row for a user
function createUserRow(user, index) {
    const userId = user._id || user.id || (1000 + index);
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || 'N/A';
    const email = user.email || 'N/A';
    const phone = user.phoneNumber || user.phone || 'N/A';
    const date = formatUserDate(user.createdAt || user.onboardingDate);
    const status = user.status || (user.isActive ? 'Active' : 'Active');
    const statusClass = status === 'Active' || status === 'active' ? 'status-active' : 'status-suspend';
    
    return `
        <tr>
            <td>${date}</td>
            <td>${userId.toString().substring(0, 10)}</td>
            <td>${name}</td>
            <td>${email}</td>
            <td>${phone}</td>
            <td><span class="${statusClass}">${status}</span></td>
            <td>
                <div class="dropdown">
                    <button class="btn p-0" type="button" data-bs-toggle="dropdown">
                        <i class="bi bi-three-dots-vertical"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><a class="dropdown-item" href="#" onclick="viewUser('${userId}')">View Details</a></li>
                        <li><a class="dropdown-item" href="#" onclick="toggleUserStatus('${userId}', '${status}')">
                            ${status === 'Active' ? 'Suspend' : 'Activate'}
                        </a></li>
                    </ul>
                </div>
            </td>
        </tr>
    `;
}

// View user details
function viewUser(userId) {
    const user = allUsers.find(u => (u._id || u.id) == userId);
    
    if (user) {
        const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A';
        const details = `
Name: ${name}
Email: ${user.email || 'N/A'}
Phone: ${user.phoneNumber || user.phone || 'N/A'}
Status: ${user.status || (user.isActive ? 'Active' : 'Active')}
Joined: ${formatUserDate(user.createdAt)}
        `;
        alert(details);
        console.log('User details:', user);
    }
}

// Toggle user status (suspend/activate)
function toggleUserStatus(userId, currentStatus) {
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    const confirmed = confirm(`Are you sure you want to ${newStatus === 'Suspended' ? 'suspend' : 'activate'} this user?`);
    
    if (confirmed) {
        // TODO: Add API call to update user status
        alert(`User ${newStatus.toLowerCase()} (API call needed)`);
        console.log(`Update user ${userId} to ${newStatus}`);
        
        // Reload users after update
        // loadUsers();
    }
}

// Format user date
function formatUserDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short',
            year: 'numeric', 
            month: 'short', 
            day: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
}

// Show loading in table
function showUsersLoading() {
    const tableBody = document.querySelector('#myTable tbody');
    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><div class="spinner-border spinner-border-sm" role="status"></div> Loading users...</td></tr>';
    }
}

// Show error in table
function showUsersError(message) {
    const tableBody = document.querySelector('#myTable tbody');
    if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">${message}</td></tr>`;
    }
}

// Search functionality
const customSearch = document.getElementById('customSearch');
if (customSearch) {
    customSearch.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        
        if (searchTerm === '') {
            displayUsers(allUsers);
        } else {
            const filtered = allUsers.filter(user => {
                const name = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
                const email = (user.email || '').toLowerCase();
                const phone = (user.phoneNumber || user.phone || '').toLowerCase();
                
                return name.includes(searchTerm) || 
                       email.includes(searchTerm) || 
                       phone.includes(searchTerm);
            });
            
            displayUsers(filtered);
        }
    });
}

// Export to CSV
function exportToCSV() {
    if (!allUsers || allUsers.length === 0) {
        alert('No users to export');
        return;
    }
    
    // Create CSV header
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Onboarding Date'];
    
    // Create CSV rows
    const rows = allUsers.map(user => {
        const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A';
        const email = user.email || 'N/A';
        const phone = user.phoneNumber || user.phone || 'N/A';
        const status = user.status || (user.isActive ? 'Active' : 'Active');
        const date = formatUserDate(user.createdAt || user.onboardingDate);
        
        return [name, email, phone, status, date];
    });
    
    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Download file
    downloadFile(csvContent, 'users.csv', 'text/csv');
    console.log('Exported users to CSV');
}

// Export to JSON
function exportToJSON() {
    if (!allUsers || allUsers.length === 0) {
        alert('No users to export');
        return;
    }
    
    const jsonContent = JSON.stringify(allUsers, null, 2);
    downloadFile(jsonContent, 'users.json', 'application/json');
    console.log('Exported users to JSON');
}

// Download file helper
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Handle file import
function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileType = file.name.split('.').pop().toLowerCase();
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            let importedData = [];
            
            if (fileType === 'json') {
                importedData = JSON.parse(e.target.result);
            } else if (fileType === 'csv') {
                importedData = parseCSV(e.target.result);
            } else {
                alert('Unsupported file format. Please use CSV or JSON.');
                return;
            }
            
            console.log('Imported data:', importedData);
            alert(`Successfully imported ${importedData.length} users!\n\nNote: This is display-only. To save to database, implement API call.`);
            
            // Display imported data (this is temporary, you'd need API to save)
            allUsers = importedData;
            displayUsers(allUsers);
            
        } catch (error) {
            console.error('Import error:', error);
            alert('Error importing file: ' + error.message);
        }
    };
    
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
}

// Parse CSV to JSON
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.replace(/"/g, '').trim());
        const user = {};
        
        headers.forEach((header, index) => {
            if (header === 'Name') {
                const names = values[index].split(' ');
                user.firstName = names[0] || '';
                user.lastName = names.slice(1).join(' ') || '';
            } else if (header === 'Email') {
                user.email = values[index];
            } else if (header === 'Phone') {
                user.phoneNumber = values[index];
            } else if (header === 'Status') {
                user.status = values[index];
            } else if (header === 'Onboarding Date') {
                user.createdAt = values[index];
            }
        });
        
        return user;
    });
}
