// Listings Page Logic
let allListings = [];
let currentType = 'all-events'; // default
let currentPage = 1;
let itemsPerPage = 20;
let totalPages = 1;

// Get URL parameter
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Get friendly category name from API type
function getCategoryName(type) {
    const categoryNames = {
        'all-events': 'Events',
        'restaurants': 'Restaurants',
        'catering': 'Catering',
        'real-estate': 'Real Estate',
        'realestate': 'Real Estate'
    };
    
    return categoryNames[type] || 'Events';
}

// Load listings when page loads
document.addEventListener('DOMContentLoaded', async function() {
    // Check if category parameter is provided
    const categoryParam = getUrlParameter('category');
    
    if (categoryParam) {
        // Map category names to API endpoints
        const categoryMap = {
            'restaurants': 'restaurants',
            'events': 'all-events',
            'catering': 'catering',
            'real-estate': 'real-estate',
            'realestate': 'real-estate'
        };
        
        // Get the type from URL
        const type = categoryMap[categoryParam.toLowerCase()] || 'all-events';
        await loadListings(type);
    } else {
        // Load all categories by default
        await loadAllListings();
    }
});

// Load all listings from all categories
async function loadAllListings() {
    try {
        showLoading();
        
        // Define all category endpoints
        const endpoints = ['all-events', 'restaurants', 'catering', 'real-estate'];
        
        // Fetch from all endpoints in parallel
        const allData = await Promise.all(
            endpoints.map(async (endpoint) => {
                try {
                    const data = await API.getListings(endpoint);
                    // Add category type to each listing for display
                    return data.map(item => ({ ...item, _categoryType: endpoint }));
                } catch (error) {
                    console.error(`Error loading ${endpoint}:`, error);
                    return [];
                }
            })
        );
        
        // Flatten all results into one array
        allListings = allData.flat();
        currentType = 'all'; // Set to 'all' to indicate mixed categories
        
        // Display in table
        displayListings(allListings);
        
    } catch (error) {
        console.error('Error loading all listings:', error);
        showError('Failed to load listings');
    }
}

// Load listings from API
async function loadListings(type = 'all-events') {
    currentType = type;
    
    try {
        // Show loading
        showLoading();
        
        // Fetch data from API
        const data = await API.getListings(type);
        allListings = data;
        
        // Display in table
        displayListings(allListings);
        
    } catch (error) {
        console.error('Error loading listings:', error);
        showError('Failed to load listings');
    }
}

// Display listings in table with pagination
function displayListings(listings) {
    const tableBody = document.querySelector('#myTable tbody');
    
    if (!tableBody) {
        console.error('Table body not found');
        return;
    }
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // If no listings
    if (!listings || listings.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4">No listings found</td></tr>';
        updatePagination(0);
        return;
    }
    
    // Calculate pagination
    totalPages = Math.ceil(listings.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedListings = listings.slice(startIndex, endIndex);
    
    // Add rows for current page
    paginatedListings.forEach((listing, index) => {
        const row = createListingRow(listing, startIndex + index);
        tableBody.innerHTML += row;
    });
    
    // Update pagination controls
    updatePagination(listings.length);
}

// Update pagination controls
function updatePagination(totalItems) {
    let paginationContainer = document.getElementById('paginationControls');
    
    // Create pagination container if it doesn't exist
    if (!paginationContainer) {
        const tableContainer = document.querySelector('.table-responsive');
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'paginationControls';
        paginationContainer.className = 'mt-3 d-flex justify-content-between align-items-center';
        tableContainer.after(paginationContainer);
    }
    
    if (totalItems === 0 || totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    // Create pagination HTML
    let paginationHTML = `
        <div class="text-muted">
            Showing ${((currentPage - 1) * itemsPerPage) + 1} to ${Math.min(currentPage * itemsPerPage, totalItems)} of ${totalItems} listings
        </div>
        <nav>
            <ul class="pagination mb-0">
                <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">Previous</a>
                </li>
    `;
    
    // Page numbers
    const maxPageButtons = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
    
    if (endPage - startPage < maxPageButtons - 1) {
        startPage = Math.max(1, endPage - maxPageButtons + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
            </li>
        `;
    }
    
    paginationHTML += `
                <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">Next</a>
                </li>
            </ul>
        </nav>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
}

// Change page
function changePage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    displayListings(allListings);
}

// Create a table row for a listing
function createListingRow(listing, index) {
    // Determine category name - use _categoryType if showing all, otherwise use currentType
    let categoryName;
    if (currentType === 'all' && listing._categoryType) {
        categoryName = getCategoryName(listing._categoryType);
    } else {
        categoryName = getCategoryName(currentType);
    }
    
    const title = listing.title || listing.name || 'Untitled';
    
    // Extract location from embedded venues if available
    const venue = listing._embedded?.venues?.[0];
    const city = venue?.city?.name || listing.city || '';
    const state = venue?.state?.stateCode || listing.state || '';
    const location = city && state ? `${city}, ${state}` : city || listing.location || 'N/A';
    
    // Extract date from nested structure
    const startDate = listing.dates?.start?.localDate || listing.date || listing.createdAt;
    const date = startDate || 'N/A';
    
    // Get status
    const statusCode = listing.dates?.status?.code || listing.status || 'active';
    const status = statusCode === 'onsale' || statusCode === 'active' ? 'Active' : 'Inactive';
    
    return `
        <tr>
            <td>${categoryName}</td>
            <td>${title}</td>
            <td>${location}</td>
            <td>${formatDate(date)}</td>
            <td><span class="badge bg-success">${status}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewListing('${listing.id || index}')">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="editListing('${listing.id || index}')">
                    <i class="bi bi-pencil"></i>
                </button>
            </td>
        </tr>
    `;
}

// View single listing
function viewListing(id) {
    const listing = allListings.find(l => l.id == id) || allListings[id];
    
    if (listing) {
        // Redirect to view page with listing ID and name for better searching
        const listingId = listing.id || id;
        const listingName = encodeURIComponent(listing.title || listing.name || '');
        window.location.href = `view-listing.html?id=${listingId}&type=${currentType}&name=${listingName}`;
    }
}

// Edit listing
function editListing(id) {
    const listing = allListings.find(l => l.id == id) || allListings[id];
    
    if (listing) {
        alert('Editing: ' + (listing.title || listing.name));
        console.log('Edit listing:', listing);
        // You can open edit modal here
    }
}

// Format date
function formatDate(dateString) {
    if (!dateString || dateString === 'N/A') return 'N/A';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    } catch (e) {
        return dateString;
    }
}

// Show loading
function showLoading() {
    const tableBody = document.querySelector('#myTable tbody');
    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><div class="spinner-border" role="status"></div></td></tr>';
    }
}

// Show error
function showError(message) {
    const tableBody = document.querySelector('#myTable tbody');
    if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger">${message}</td></tr>`;
    }
}

// Search functionality
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        
        // Reset to page 1 when searching
        currentPage = 1;
        
        if (searchTerm === '') {
            displayListings(allListings);
        } else {
            const filtered = allListings.filter(listing => {
                const title = (listing.title || listing.name || '').toLowerCase();
                const venue = listing._embedded?.venues?.[0];
                const city = (venue?.city?.name || listing.city || '').toLowerCase();
                const location = (listing.location || '').toLowerCase();
                const category = (listing.category || listing.type || '').toLowerCase();
                
                return title.includes(searchTerm) || 
                       city.includes(searchTerm) ||
                       location.includes(searchTerm) || 
                       category.includes(searchTerm);
            });
            
            displayListings(filtered);
        }
    });
}

// Category filter buttons (if you want to add them)
function filterByCategory(type) {
    loadListings(type);
}

// Toggle filter dropdown
const filterButton = document.getElementById('filterButton');
if (filterButton) {
    filterButton.addEventListener('click', function() {
        const filterDropdown = document.getElementById('filterDropdown');
        if (filterDropdown) {
            filterDropdown.classList.toggle('d-none');
        }
    });
}

// Apply filters
function applyFilters() {
    const categoryFilter = document.getElementById('filterCategory')?.value || '';
    const statusFilter = document.getElementById('filterStatus')?.value || '';
    const dateFilter = document.getElementById('filterDate')?.value || '';
    
    currentPage = 1; // Reset to first page
    
    let filtered = [...allListings];
    
    // Filter by category
    if (categoryFilter && currentType === 'all') {
        filtered = filtered.filter(listing => {
            return listing._categoryType === categoryFilter || 
                   listing._categoryType === `all-${categoryFilter}` ||
                   (categoryFilter === 'events' && listing._categoryType === 'all-events') ||
                   (categoryFilter === 'real-estate' && listing._categoryType === 'real-estate');
        });
    }
    
    // Filter by status
    if (statusFilter) {
        filtered = filtered.filter(listing => {
            const statusCode = listing.dates?.status?.code || listing.status || 'active';
            const isActive = statusCode === 'onsale' || statusCode === 'active';
            
            return (statusFilter === 'active' && isActive) || 
                   (statusFilter === 'inactive' && !isActive);
        });
    }
    
    // Filter by date
    if (dateFilter) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        filtered = filtered.filter(listing => {
            const startDate = listing.dates?.start?.localDate || listing.date;
            if (!startDate) return false;
            
            const eventDate = new Date(startDate);
            
            switch(dateFilter) {
                case 'upcoming':
                    return eventDate >= today;
                case 'past':
                    return eventDate < today;
                case 'this-week':
                    const weekFromNow = new Date(today);
                    weekFromNow.setDate(weekFromNow.getDate() + 7);
                    return eventDate >= today && eventDate <= weekFromNow;
                case 'this-month':
                    return eventDate.getMonth() === now.getMonth() && 
                           eventDate.getFullYear() === now.getFullYear();
                default:
                    return true;
            }
        });
    }
    
    displayListings(filtered);
}

// Clear all filters
function clearFilters() {
    // Reset filter inputs
    if (document.getElementById('filterCategory')) {
        document.getElementById('filterCategory').value = '';
    }
    if (document.getElementById('filterStatus')) {
        document.getElementById('filterStatus').value = '';
    }
    if (document.getElementById('filterDate')) {
        document.getElementById('filterDate').value = '';
    }
    
    // Reset search
    if (document.getElementById('searchInput')) {
        document.getElementById('searchInput').value = '';
    }
    
    // Display all listings
    currentPage = 1;
    displayListings(allListings);
}

