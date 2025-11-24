// Admins Management
let adminsTable;
let allAdmins = [];

// Initialize page
$(document).ready(function() {
    loadAdmins();
});

// Load all admin users
async function loadAdmins() {
    try {
        // Fetch all users and filter for admins/super-admins
        const users = await API.getUsers();
        
        // Filter for admin roles (you may need to adjust based on your backend response)
        allAdmins = users.filter(user => 
            user.role === 'admin' || 
            user.role === 'super-admin' ||
            user.role === 'administrator'
        );
        
        // If no role field exists, show all users with admin in email/name
        if (allAdmins.length === 0) {
            allAdmins = users.filter(user => 
                user.email?.includes('admin') || 
                user.firstName?.toLowerCase().includes('admin')
            );
        }
        
        displayAdmins(allAdmins);
        
    } catch (error) {
        console.error('Error loading admins:', error);
        showError('Failed to load admin users');
    }
}

// Display admins in table
function displayAdmins(admins) {
    const tbody = $('#adminsTable tbody');
    tbody.empty();

    if (!admins || admins.length === 0) {
        tbody.html('<tr><td colspan="7" class="text-center">No admin users found</td></tr>');
        return;
    }

    admins.forEach(admin => {
        const row = createAdminRow(admin);
        tbody.append(row);
    });

    // Initialize DataTable
    if (adminsTable) {
        adminsTable.destroy();
    }
    
    adminsTable = $('#adminsTable').DataTable({
        pageLength: 20,
        order: [[5, 'desc']], // Sort by created date
        language: {
            search: "",
            searchPlaceholder: "Search admins..."
        }
    });
}

// Create table row for admin
function createAdminRow(admin) {
    const name = `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || 'N/A';
    const email = admin.email || 'N/A';
    const phone = admin.phoneNumber || admin.phone || 'N/A';
    const role = admin.role || 'admin';
    const status = admin.status || (admin.isActive ? 'Active' : 'Active');
    const createdDate = admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : 'N/A';
    const adminId = admin._id || admin.id;
    
    const statusBadge = status === 'Active' || status === 'active' ? 
        '<span class="badge bg-success">Active</span>' : 
        '<span class="badge bg-danger">Inactive</span>';
    
    const roleBadge = role === 'super-admin' ?
        '<span class="badge bg-primary">Super Admin</span>' :
        '<span class="badge bg-secondary">Admin</span>';

    return `
        <tr>
            <td>${name}</td>
            <td>${email}</td>
            <td>${phone}</td>
            <td>${roleBadge}</td>
            <td>${statusBadge}</td>
            <td>${createdDate}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary btn-sm" onclick="viewAdmin('${adminId}')" title="View">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="toggleAdminStatus('${adminId}', '${status}')" title="${status === 'Active' ? 'Deactivate' : 'Activate'}">
                        <i class="bi bi-${status === 'Active' ? 'x-circle' : 'check-circle'}"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

// Create new admin
async function createAdmin() {
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    // Validation
    if (!firstName || !lastName || !email || !phoneNumber || !password) {
        showFormError('Please fill in all required fields');
        return;
    }

    if (password.length < 5) {
        showFormError('Password must be at least 5 characters');
        return;
    }

    // Show loading
    document.getElementById('createBtnText').classList.add('d-none');
    document.getElementById('createBtnSpinner').classList.remove('d-none');
    hideFormMessages();

    try {
        const userData = {
            firstName,
            lastName,
            email,
            password,
            phoneNumber,
            role: role || 'admin'
        };

        const result = await API.register(userData);

        if (result.success) {
            showFormSuccess('Admin created successfully!');
            
            // Reset form
            document.getElementById('addAdminForm').reset();
            
            // Reload admins list
            setTimeout(() => {
                bootstrap.Modal.getInstance(document.getElementById('addAdminModal')).hide();
                loadAdmins();
                hideFormMessages();
            }, 2000);
        } else {
            showFormError(result.message || 'Failed to create admin');
        }

    } catch (error) {
        console.error('Error creating admin:', error);
        showFormError(error.message || 'Failed to create admin');
    } finally {
        document.getElementById('createBtnText').classList.remove('d-none');
        document.getElementById('createBtnSpinner').classList.add('d-none');
    }
}

// View admin details
async function viewAdmin(adminId) {
    try {
        const response = await fetch(`${API_CONFIG.baseURL}/get-user/?id=${adminId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const admin = result.data || result;

        // Display in modal
        const modalBody = document.getElementById('adminDetailsBody');
        const name = `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || 'N/A';
        
        modalBody.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h6>Personal Information</h6>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${admin.email || 'N/A'}</p>
                    <p><strong>Phone:</strong> ${admin.phoneNumber || admin.phone || 'N/A'}</p>
                    <p><strong>Role:</strong> ${admin.role || 'admin'}</p>
                    <p><strong>Status:</strong> ${admin.status || (admin.isActive ? 'Active' : 'Active')}</p>
                    <p><strong>Email Verified:</strong> ${admin.phoneVerified ? 'Yes' : 'No'}</p>
                    <p><strong>Created:</strong> ${admin.createdAt ? new Date(admin.createdAt).toLocaleString() : 'N/A'}</p>
                </div>
            </div>
        `;

        const modal = new bootstrap.Modal(document.getElementById('viewAdminModal'));
        modal.show();

    } catch (error) {
        console.error('Error loading admin details:', error);
        alert('Failed to load admin details');
    }
}

// Toggle admin status
async function toggleAdminStatus(adminId, currentStatus) {
    const action = currentStatus === 'Active' ? 'deactivate' : 'activate';
    const endpoint = action === 'deactivate' ? 'deactivate' : 'activate';
    
    const confirmed = confirm(`Are you sure you want to ${action} this admin?`);
    
    if (!confirmed) return;
    
    try {
        const response = await fetch(`${API_CONFIG.baseURL}/${endpoint}/${adminId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors'
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert(`Admin ${action}d successfully`);
            loadAdmins(); // Reload data
        } else {
            alert(result.message || `Failed to ${action} admin`);
        }

    } catch (error) {
        console.error(`Error ${action}ing admin:`, error);
        alert(`Failed to ${action} admin`);
    }
}

// Form message helpers
function showFormError(message) {
    const errorDiv = document.getElementById('formError');
    errorDiv.textContent = message;
    errorDiv.classList.remove('d-none');
    
    const successDiv = document.getElementById('formSuccess');
    successDiv.classList.add('d-none');
}

function showFormSuccess(message) {
    const successDiv = document.getElementById('formSuccess');
    successDiv.textContent = message;
    successDiv.classList.remove('d-none');
    
    const errorDiv = document.getElementById('formError');
    errorDiv.classList.add('d-none');
}

function hideFormMessages() {
    document.getElementById('formError').classList.add('d-none');
    document.getElementById('formSuccess').classList.add('d-none');
}

function showError(message) {
    const tbody = $('#adminsTable tbody');
    tbody.html(`<tr><td colspan="7" class="text-center text-danger">${message}</td></tr>`);
}

// Reset form when modal is closed
$('#addAdminModal').on('hidden.bs.modal', function () {
    document.getElementById('addAdminForm').reset();
    hideFormMessages();
});
