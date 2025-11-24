// Adverts Management
let advertsTable;
let allAdverts = [];

// Initialize page
$(document).ready(function() {
    loadAdverts();
    
    // Search functionality
    $('#searchInput').on('keyup', function() {
        advertsTable.search(this.value).draw();
    });
});

// Load all adverts from backend
async function loadAdverts() {
    try {
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

        // Extract data array
        allAdverts = result.data || result || [];
        
        displayAdverts(allAdverts);
        
    } catch (error) {
        console.error('Error loading adverts:', error);
        alert('Failed to load adverts. Please check the console.');
    }
}

// Display adverts in table
function displayAdverts(adverts) {
    const tbody = $('#advertsTable tbody');
    tbody.empty();

    if (!adverts || adverts.length === 0) {
        tbody.html('<tr><td colspan="8" class="text-center">No adverts found</td></tr>');
        return;
    }

    adverts.forEach(advert => {
        const row = createAdvertRow(advert);
        tbody.append(row);
    });

    // Initialize DataTable
    if (advertsTable) {
        advertsTable.destroy();
    }
    
    advertsTable = $('#advertsTable').DataTable({
        pageLength: 20,
        order: [[6, 'desc']], // Sort by created date
        language: {
            search: "",
            searchPlaceholder: "Search adverts..."
        }
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
                    <button class="btn btn-outline-primary btn-sm" onclick="viewAdvert('${advert.id}')" title="View">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-outline-warning btn-sm" onclick="openPromoteModal('${advert.id}')" title="Promote">
                        <i class="bi bi-star"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="deleteAdvert('${advert.id}')" title="Delete">
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
        const advert = result.data || result;

        // Display in modal
        const modalBody = document.getElementById('advertDetailsBody');
        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Basic Information</h6>
                    <p><strong>Title:</strong> ${advert.title || 'N/A'}</p>
                    <p><strong>Category:</strong> ${advert.category?.name || 'N/A'}</p>
                    <p><strong>Location:</strong> ${advert.location || 'N/A'}</p>
                    <p><strong>Contact Phone:</strong> ${advert.contactPhone || 'N/A'}</p>
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
        alert('Failed to load advert details');
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
        const response = await fetch(`${API_CONFIG.baseURL}/listings/${advertId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors'
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert('Advert deleted successfully');
            loadAdverts(); // Reload data
        } else {
            alert(result.message || 'Failed to delete advert');
        }

    } catch (error) {
        console.error('Error deleting advert:', error);
        alert('Failed to delete advert');
    }
}
