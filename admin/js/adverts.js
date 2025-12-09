// Adverts Management
let advertsTable;
let allAdverts = [];

// Initialize page
$(document).ready(function() {
    loadAdverts();
    loadCategories(); // Load categories for the dropdown
    
    // Search functionality
    $('#searchInput').on('keyup', function() {
        advertsTable.search(this.value).draw();
    });
});

// Load all adverts from backend
async function loadAdverts() {
    try {
        console.log('Loading adverts...');
        
        const response = await fetch(`${API_CONFIG.baseURL}/listings`, {
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
        console.log('Adverts response:', result);

        // Extract data array - handle different response formats
        let advertsData = [];
        
        if (result.data && Array.isArray(result.data.listings)) {
            advertsData = result.data.listings;
        } else if (result.data && Array.isArray(result.data)) {
            advertsData = result.data;
        } else if (Array.isArray(result)) {
            advertsData = result;
        } else if (result.listings && Array.isArray(result.listings)) {
            advertsData = result.listings;
        }
        
        allAdverts = advertsData;
        console.log('Loaded adverts count:', allAdverts.length);
        
        displayAdverts(allAdverts);
        
    } catch (error) {
        console.error('Error loading adverts:', error);
        alert('Failed to load adverts: ' + error.message);
    }
}

// Display adverts in table
function displayAdverts(adverts) {
    const tbody = $('#advertsTable tbody');
    
    // Destroy existing DataTable if it exists
    if (advertsTable) {
        advertsTable.destroy();
        advertsTable = null;
    }
    
    tbody.empty();

    if (!adverts || adverts.length === 0) {
        tbody.html('<tr><td colspan="8" class="text-center">No adverts found</td></tr>');
        return;
    }

    adverts.forEach(advert => {
        const row = createAdvertRow(advert);
        tbody.append(row);
    });

    // Initialize DataTable with new data
    advertsTable = $('#advertsTable').DataTable({
        pageLength: 20,
        order: [[6, 'desc']], // Sort by created date
        language: {
            search: "",
            searchPlaceholder: "Search adverts..."
        },
        destroy: true // Allow reinitialization
    });
}

// Create table row for advert
function createAdvertRow(advert) {
    const eventDate = advert.eventDate ? new Date(advert.eventDate).toLocaleDateString() : 'N/A';
    const createdDate = advert.createdAt ? new Date(advert.createdAt).toLocaleDateString() : 'N/A';
    const categoryName = advert.category?.name || 'N/A';
    const statusBadge = advert.status ? 
        '<span class="badge bg-success">Active</span>' : 
        '<span class="badge bg-danger">Inactive</span>';
    const promotedBadge = advert.promoted ? 
        '<span class="badge bg-warning">Yes</span>' : 
        '<span class="badge bg-secondary">No</span>';
    
    // Use _id or id, whichever is available
    const advertId = advert._id || advert.id;

    return `
        <tr>
            <td>${advert.title || 'N/A'}</td>
            <td>${categoryName}</td>
            <td>${advert.location || 'N/A'}</td>
            <td>${eventDate}</td>
            <td>${statusBadge}</td>
            <td>${promotedBadge}</td>
            <td>${createdDate}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary btn-sm" onclick="viewAdvert('${advertId}')" title="View">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-outline-warning btn-sm" onclick="openPromoteModal('${advertId}')" title="Promote">
                        <i class="bi bi-star"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="deleteAdvert('${advertId}')" title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

// View advert details
async function viewAdvert(advertId) {
    try {
        console.log('Viewing advert:', advertId);
        
        const response = await fetch(`${API_CONFIG.baseURL}/listings/${advertId}`, {
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
        console.log('View advert response:', result);
        
        // Extract advert data - handle multiple response structures
        let advert = null;
        if (result.data && result.data.listing) {
            advert = result.data.listing;
        } else if (result.data) {
            advert = result.data;
        } else if (result.listing) {
            advert = result.listing;
        } else {
            advert = result;
        }
        
        console.log('Extracted advert:', advert);

        if (!advert || !advert.title) {
            throw new Error('Invalid advert data received');
        }

        // Display in modal
        const modalBody = document.getElementById('advertDetailsBody');
        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Basic Information</h6>
                    <p><strong>Title:</strong> ${advert.title || 'N/A'}</p>
                    <p><strong>Category:</strong> ${advert.category?.name || advert.category || 'N/A'}</p>
                    <p><strong>Location:</strong> ${advert.location || 'N/A'}</p>
                    <p><strong>Contact Phone:</strong> ${advert.phoneNumber || advert.contactPhone || 'N/A'}</p>
                    <p><strong>Website:</strong> ${advert.websiteUrl ? `<a href="${advert.websiteUrl}" target="_blank">${advert.websiteUrl}</a>` : 'N/A'}</p>
                </div>
                <div class="col-md-6">
                    <h6>Status & Dates</h6>
                    <p><strong>Status:</strong> ${advert.status ? 'Active' : 'Inactive'}</p>
                    <p><strong>Promoted:</strong> ${advert.promoted ? 'Yes' : 'No'}</p>
                    <p><strong>Event Date:</strong> ${advert.eventDate ? new Date(advert.eventDate).toLocaleString() : 'N/A'}</p>
                    <p><strong>Created:</strong> ${advert.createdAt ? new Date(advert.createdAt).toLocaleString() : 'N/A'}</p>
                </div>
                <div class="col-12 mt-3">
                    <h6>Description</h6>
                    <p>${advert.description || 'No description available'}</p>
                </div>
                ${advert.images && advert.images.length > 0 ? `
                <div class="col-12 mt-3">
                    <h6>Images</h6>
                    <div class="d-flex gap-2 flex-wrap">
                        ${advert.images.map(img => `<img src="${img}" alt="Advert image" style="max-width: 150px; height: auto; border-radius: 8px;">`).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        `;

        const modal = new bootstrap.Modal(document.getElementById('viewAdvertModal'));
        modal.show();

    } catch (error) {
        console.error('Error loading advert details:', error);
        alert('Failed to load advert details: ' + error.message);
    }
}

// Open promote modal
function openPromoteModal(advertId) {
    document.getElementById('promoteAdvertId').value = advertId;
    
    // Set default start date to now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('promotionStartDate').value = now.toISOString().slice(0, 16);
    
    const modal = new bootstrap.Modal(document.getElementById('promoteAdvertModal'));
    modal.show();
}

// Submit promotion
async function submitPromotion() {
    const advertId = document.getElementById('promoteAdvertId').value;
    const promoteOnHomepage = document.getElementById('promoteOnHomepage').checked;
    const highlightInNewsletter = document.getElementById('highlightInNewsletter').checked;
    const addTrendingBadge = document.getElementById('addTrendingBadge').checked;
    const promotionDuration = document.getElementById('promotionDuration').value;
    const promotionStartDate = document.getElementById('promotionStartDate').value;

    try {
        const response = await fetch(`${API_CONFIG.baseURL}/listings/${advertId}/promote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors',
            body: JSON.stringify({
                promoteOnHomepage,
                highlightInNewsletter,
                addTrendingBadge,
                promotionDuration,
                promotionStartDate: new Date(promotionStartDate).toISOString()
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert('Advert promoted successfully!');
            bootstrap.Modal.getInstance(document.getElementById('promoteAdvertModal')).hide();
            loadAdverts(); // Reload data
        } else {
            alert(result.message || 'Failed to promote advert');
        }

    } catch (error) {
        console.error('Error promoting advert:', error);
        alert('Failed to promote advert');
    }
}

// Delete advert
async function deleteAdvert(advertId) {
    if (!confirm('Are you sure you want to delete this advert? This action cannot be undone.')) {
        return;
    }

    try {
        console.log('Deleting advert:', advertId);
        
        const response = await fetch(`${API_CONFIG.baseURL}/listings/${advertId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Delete response:', result);

        if (result.success || result.message || response.ok) {
            alert('Advert deleted successfully');
            await loadAdverts(); // Reload data
        } else {
            throw new Error(result.message || 'Failed to delete advert');
        }

    } catch (error) {
        console.error('Error deleting advert:', error);
        alert('Failed to delete advert: ' + error.message);
    }
}

// Load categories for dropdown
async function loadCategories() {
    try {
        const categories = await API.getCategories();
        const categorySelect = document.getElementById('advertCategory');
        
        if (!categorySelect) return;
        
        // Clear existing options except the first one
        categorySelect.innerHTML = '<option value="" selected disabled>Select Category</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id || category._id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Submit new advert
async function submitAdvert() {
    const form = document.getElementById('addAdvertForm');
    
    // Validate form
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // Get current user from localStorage
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const userId = adminUser.id || adminUser._id;
    
    if (!userId) {
        alert('User not found. Please log in again.');
        return;
    }

    // Create FormData object
    const formData = new FormData();
    
    // Add text fields
    formData.append('title', document.getElementById('advertTitle').value);
    formData.append('description', document.getElementById('advertDescription').value);
    formData.append('category', document.getElementById('advertCategory').value);
    formData.append('location', document.getElementById('advertLocation').value);
    formData.append('userId', userId);
    
    // Add optional fields
    const phone = document.getElementById('advertPhone').value;
    if (phone) formData.append('phoneNumber', phone);
    
    const website = document.getElementById('advertWebsite').value;
    if (website) formData.append('websiteUrl', website);
    
    const eventDate = document.getElementById('advertEventDate').value;
    if (eventDate) formData.append('eventDate', new Date(eventDate).toISOString());
    
    // Add promotion fields
    formData.append('promoteOnHomepage', document.getElementById('advertPromoteHomepage').checked);
    formData.append('highlightInNewsletter', document.getElementById('advertHighlightNewsletter').checked);
    formData.append('addTrendingBadge', document.getElementById('advertTrendingBadge').checked);
    
    const promotionDuration = document.getElementById('advertPromotionDuration').value;
    if (promotionDuration) formData.append('promotionDuration', promotionDuration);
    
    const promotionStartDate = document.getElementById('advertPromotionStartDate').value;
    if (promotionStartDate) formData.append('promotionStartDate', new Date(promotionStartDate).toISOString());
    
    // Add images
    const imageFiles = document.getElementById('advertImages').files;
    for (let i = 0; i < imageFiles.length; i++) {
        formData.append('images', imageFiles[i]);
    }

    try {
        // Show loading state
        const submitBtn = document.querySelector('#addAdvertModal .btn-listing');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating...';
        submitBtn.disabled = true;

        console.log('Creating advert...');
        const result = await API.createListing(formData);
        console.log('Create advert result:', result);

        if (result.success || result.data) {
            alert('Advert created successfully!');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addAdvertModal'));
            if (modal) {
                modal.hide();
            }
            
            // Reset form
            form.reset();
            
            // Reload adverts
            await loadAdverts();
        } else {
            throw new Error(result.message || 'Failed to create advert');
        }

    } catch (error) {
        console.error('Error creating advert:', error);
        alert(error.message || 'Failed to create advert. Please try again.');
    } finally {
        // Reset button state
        const submitBtn = document.querySelector('#addAdvertModal .btn-listing');
        if (submitBtn) {
            submitBtn.innerHTML = 'Create Advert';
            submitBtn.disabled = false;
        }
    }
}
