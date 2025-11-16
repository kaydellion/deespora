// Dashboard Events Logic
let dashboardEvents = [];
let dashboardUsers = [];
let dashboardStats = {};

// Load all dashboard data when page loads
document.addEventListener('DOMContentLoaded', async function() {
    await loadDashboardData();
});

// Load all dashboard data (events, users, and calculate stats)
async function loadDashboardData() {
    try {
        // Fetch all data in parallel
        const [events, users, restaurants, catering, realEstate] = await Promise.all([
            API.getEvents(),
            API.getUsers(),
            API.getRestaurants().catch(() => []),
            API.getCatering().catch(() => []),
            API.getRealEstate().catch(() => [])
        ]);
        
        dashboardEvents = events || [];
        dashboardUsers = users || [];
        
        // Calculate statistics
        calculateDashboardStats(dashboardUsers, dashboardEvents, restaurants, catering, realEstate);
        
        // Update stats display
        updateStatsDisplay();
        
        // Display events in table
        showTableLoading();
        displayDashboardEvents(dashboardEvents);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showTableError('Failed to load dashboard data');
    }
}

// Calculate all dashboard statistics
function calculateDashboardStats(users, events, restaurants, catering, realEstate) {
    // User Stats
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'Active' || u.isActive === true).length;
    const suspendedUsers = totalUsers - activeUsers;
    
    // Calculate new users this week (within last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newUsersThisWeek = users.filter(u => {
        const createdDate = new Date(u.createdAt);
        return createdDate >= oneWeekAgo;
    }).length;
    
    // Calculate active users today (assuming they have a lastActive field, or use all active)
    const activeUsersToday = activeUsers; // You can refine this if you have lastActive data
    
    // Listing Stats
    const totalListings = events.length + restaurants.length + catering.length + realEstate.length;
    const restaurantsCount = restaurants.length;
    const cateringCount = catering.length;
    const realEstateCount = realEstate.length;
    const eventsCount = events.length;
    
    dashboardStats = {
        totalUsers,
        activeUsers,
        churnedUsers: suspendedUsers,
        newUsersThisWeek,
        activeUsersToday,
        totalListings,
        restaurants: restaurantsCount,
        catering: cateringCount,
        realEstate: realEstateCount,
        events: eventsCount,
        worship: 0, // No endpoint available
        deals: 0, // No endpoint available
        cakesPastries: 0, // No endpoint available
        legalTax: 0 // No endpoint available
    };
    
    console.log('Dashboard Stats:', dashboardStats);
}

// Update stats display in the UI
function updateStatsDisplay() {
    // User Stats
    const totalUsersEl = document.getElementById('totalUsers');
    const activeUsersEl = document.getElementById('activeUsers');
    const churnedUsersEl = document.getElementById('churnedUsers');
    const newUsersWeekEl = document.getElementById('newUsersWeek');
    const activeUsersTodayEl = document.getElementById('activeUsersToday');
    
    if (totalUsersEl) totalUsersEl.textContent = dashboardStats.totalUsers.toLocaleString();
    if (activeUsersEl) activeUsersEl.textContent = dashboardStats.activeUsers.toLocaleString();
    if (churnedUsersEl) churnedUsersEl.textContent = dashboardStats.churnedUsers.toLocaleString();
    if (newUsersWeekEl) newUsersWeekEl.textContent = dashboardStats.newUsersThisWeek.toLocaleString();
    if (activeUsersTodayEl) activeUsersTodayEl.textContent = dashboardStats.activeUsersToday.toLocaleString();
    
    // Listing Stats
    const totalListingsEl = document.getElementById('totalListings');
    const restaurantsEl = document.getElementById('restaurantsCount');
    const cateringEl = document.getElementById('cateringCount');
    const worshipEl = document.getElementById('worshipCount');
    const realEstateEl = document.getElementById('realEstateCount');
    const dealsEl = document.getElementById('dealsCount');
    const cakesEl = document.getElementById('cakesCount');
    const legalTaxEl = document.getElementById('legalTaxCount');
    
    if (totalListingsEl) totalListingsEl.textContent = dashboardStats.totalListings.toLocaleString();
    if (restaurantsEl) restaurantsEl.textContent = dashboardStats.restaurants.toLocaleString();
    if (cateringEl) cateringEl.textContent = dashboardStats.catering.toLocaleString();
    if (worshipEl) worshipEl.textContent = dashboardStats.worship.toLocaleString();
    if (realEstateEl) realEstateEl.textContent = dashboardStats.realEstate.toLocaleString();
    if (dealsEl) dealsEl.textContent = dashboardStats.deals.toLocaleString();
    if (cakesEl) cakesEl.textContent = dashboardStats.cakesPastries.toLocaleString();
    if (legalTaxEl) legalTaxEl.textContent = dashboardStats.legalTax.toLocaleString();
}

// Load events from API
async function loadDashboardEvents() {
    try {
        // Show loading in table
        showTableLoading();
        
        // Fetch events from API
        const data = await API.getEvents();
        dashboardEvents = data;
        
        // Display in table
        displayDashboardEvents(dashboardEvents);
        
    } catch (error) {
        console.error('Error loading events:', error);
        showTableError('Failed to load events');
    }
}

// Display events in table
function displayDashboardEvents(events) {
    const tableBody = document.querySelector('#myTable tbody');
    
    if (!tableBody) {
        console.error('Table body not found');
        return;
    }
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // If no events
    if (!events || events.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4">No events found</td></tr>';
        return;
    }
    
    // Add rows for each event
    events.forEach((event, index) => {
        const row = createEventRow(event, index);
        tableBody.innerHTML += row;
    });
}

// Create a table row for an event
function createEventRow(event, index) {
    const eventName = event.name || event.title || 'Untitled Event';
    const eventId = event.id || event._id || (1000 + index);
    
    // Extract organizer (could be from classifications or embedded data)
    const organizer = event.organizer || 
                     (event.classifications && event.classifications[0]?.segment?.name) || 
                     'N/A';
    
    // Extract date from nested structure
    const startDate = event.dates?.start?.localDate || event.date || event.startDate;
    const startTime = event.dates?.start?.localTime;
    const date = formatEventDate(startDate, startTime);
    
    // Extract location from embedded venues
    const venue = event._embedded?.venues?.[0];
    const city = venue?.city?.name || event.city || '';
    const state = venue?.state?.stateCode || event.state || '';
    const location = city && state ? `${city}, ${state}` : city || event.location || event.venue || 'N/A';
    
    // Views and saved (placeholder data since not in API)
    const views = event.views || Math.floor(Math.random() * 1000);
    const saved = event.saved || Math.floor(Math.random() * 500);
    
    // Status from dates.status.code
    const statusCode = event.dates?.status?.code || event.status || 'upcoming';
    const status = getEventStatus(statusCode, startDate);
    const statusClass = status === 'Upcoming' ? 'text-success' : status === 'Past' ? 'text-danger' : 'text-warning';
    
    return `
        <tr>
            <td>${eventName}</td>
            <td>${eventId.toString().substring(0, 10)}</td>
            <td>${organizer}</td>
            <td>${date}</td>
            <td>${location}</td>
            <td>${views} | ${saved}</td>
            <td><span class="${statusClass}">${status}</span></td>
            <td>
                <div class="dropdown">
                    <button class="btn p-0" type="button" data-bs-toggle="dropdown">
                        <i class="bi bi-three-dots-vertical"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><a class="dropdown-item" href="#" onclick="viewEventDetail('${eventId}')">View Event</a></li>
                        <li><a class="dropdown-item" href="view-listing.html?id=${eventId}&type=all-events">Full Details</a></li>
                        <li><button class="dropdown-item" data-bs-toggle="modal" data-bs-target="#promoteEventModal">Promote on App</button></li>
                    </ul>
                </div>
            </td>
        </tr>
    `;
}

// Get event status based on status code and date
function getEventStatus(statusCode, startDate) {
    if (statusCode === 'offsale' || statusCode === 'cancelled') {
        return 'Past';
    }
    
    if (statusCode === 'onsale') {
        return 'Upcoming';
    }
    
    // Check if date has passed
    if (startDate) {
        const eventDate = new Date(startDate);
        const now = new Date();
        
        if (eventDate < now) {
            return 'Past';
        } else if (eventDate.toDateString() === now.toDateString()) {
            return 'Ongoing';
        }
    }
    
    return 'Upcoming';
}

// View event detail
function viewEventDetail(eventId) {
    const event = dashboardEvents.find(e => (e.id || e._id) == eventId);
    
    if (event) {
        console.log('Event details:', event);
        
        // Extract comprehensive event data
        const eventName = event.title || event.name || 'Untitled Event';
        
        // Extract location from embedded venues
        const venue = event._embedded?.venues?.[0];
        const venueName = venue?.name || '';
        const city = venue?.city?.name || event.city || '';
        const state = venue?.state?.stateCode || event.state || '';
        const address = venue?.address?.line1 || '';
        const location = [venueName, address, city, state].filter(Boolean).join(', ') || 'N/A';
        
        // Extract dates
        const startDate = event.dates?.start?.localDate || event.date;
        const startTime = event.dates?.start?.localTime;
        const timezone = event.dates?.timezone || '';
        const dateDisplay = startDate ? formatEventDate(startDate, startTime) : 'TBD';
        
        // Status
        const statusCode = event.dates?.status?.code || event.status || '-';
        const status = statusCode === 'onsale' ? 'On Sale' : 
                      statusCode === 'offsale' ? 'Off Sale' : 
                      statusCode === 'cancelled' ? 'Cancelled' : statusCode;
        
        // Price ranges
        const priceRange = event.priceRanges?.[0] ? 
            `$${event.priceRanges[0].min} - $${event.priceRanges[0].max} ${event.priceRanges[0].currency || 'USD'}` : 
            'N/A';
        
        // URL
        const eventUrl = event.url || '#';
        
        // Images
        const images = event.images || [];
        const primaryImage = images.find(img => img.ratio === '16_9' && img.width >= 640) || images[0];
        
        // Categories/Classifications
        const classifications = event.classifications || [];
        const categories = classifications.map(c => {
            const parts = [];
            if (c.segment?.name) parts.push(c.segment.name);
            if (c.genre?.name) parts.push(c.genre.name);
            if (c.subGenre?.name) parts.push(c.subGenre.name);
            return parts.join(' / ');
        }).filter(Boolean).join(', ') || 'N/A';
        
        // Populate modal
        document.getElementById('modalEventName').textContent = eventName;
        document.getElementById('modalEventId').textContent = eventId;
        document.getElementById('modalEventDate').textContent = dateDisplay;
        document.getElementById('modalEventTimezone').textContent = timezone || 'N/A';
        document.getElementById('modalEventLocation').textContent = location;
        document.getElementById('modalEventPrice').textContent = priceRange;
        document.getElementById('modalEventUrl').href = eventUrl;
        document.getElementById('modalEventUrl').textContent = eventUrl !== '#' ? 'View Event Page' : 'No URL available';
        document.getElementById('modalEventJson').textContent = JSON.stringify(event, null, 2);
        document.getElementById('modalFullDetailsLink').href = `view-listing.html?id=${eventId}&type=all-events`;
        
        // Status badge
        const statusBadge = document.getElementById('modalEventStatus');
        statusBadge.textContent = status;
        statusBadge.className = 'badge ' + (status === 'On Sale' ? 'bg-success' : status === 'Off Sale' ? 'bg-danger' : 'bg-warning');
        
        // Image
        if (primaryImage) {
            document.getElementById('eventImage').src = primaryImage.url;
            document.getElementById('eventImageContainer').classList.remove('d-none');
        } else {
            document.getElementById('eventImageContainer').classList.add('d-none');
        }
        
        // Categories
        if (categories !== 'N/A') {
            document.getElementById('modalEventCategories').textContent = categories;
            document.getElementById('modalEventClassifications').classList.remove('d-none');
        } else {
            document.getElementById('modalEventClassifications').classList.add('d-none');
        }
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('viewEventModal'));
        modal.show();
    }
}

// Format event date
function formatEventDate(dateString, timeString) {
    if (!dateString) return 'TBD';
    
    try {
        const date = new Date(dateString);
        let formatted = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric'
        });
        
        // Add time if available
        if (timeString) {
            const timeParts = timeString.split(':');
            if (timeParts.length >= 2) {
                let hours = parseInt(timeParts[0]);
                const minutes = timeParts[1];
                const ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12 || 12;
                formatted += ` ${hours}:${minutes} ${ampm}`;
            }
        }
        
        return formatted;
    } catch (e) {
        return dateString;
    }
}

// Show loading in table
function showTableLoading() {
    const tableBody = document.querySelector('#myTable tbody');
    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4"><div class="spinner-border spinner-border-sm" role="status"></div> Loading events...</td></tr>';
    }
}

// Show error in table
function showTableError(message) {
    const tableBody = document.querySelector('#myTable tbody');
    if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-danger">${message}</td></tr>`;
    }
}

// Search functionality
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        
        if (searchTerm === '') {
            displayDashboardEvents(dashboardEvents);
        } else {
            const filtered = dashboardEvents.filter(event => {
                const name = (event.title || event.name || '').toLowerCase();
                const venue = event._embedded?.venues?.[0];
                const city = (venue?.city?.name || event.city || '').toLowerCase();
                const location = (event.location || '').toLowerCase();
                const organizer = (event.organizer || event.createdBy || '').toLowerCase();
                
                return name.includes(searchTerm) || 
                       city.includes(searchTerm) ||
                       location.includes(searchTerm) || 
                       organizer.includes(searchTerm);
            });
            
            displayDashboardEvents(filtered);
        }
    });
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

// Apply dashboard filters
function applyDashboardFilters() {
    const statusFilter = document.getElementById('filterStatus')?.value || '';
    const dateFilter = document.getElementById('filterDate')?.value || '';
    const locationFilter = document.getElementById('filterLocation')?.value.toLowerCase() || '';
    
    let filtered = [...dashboardEvents];
    
    // Filter by status
    if (statusFilter) {
        filtered = filtered.filter(event => {
            const startDate = event.dates?.start?.localDate || event.date;
            const statusCode = event.dates?.status?.code || event.status || 'upcoming';
            const eventStatus = getEventStatus(statusCode, startDate).toLowerCase();
            
            return eventStatus === statusFilter;
        });
    }
    
    // Filter by date range
    if (dateFilter) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        filtered = filtered.filter(event => {
            const startDate = event.dates?.start?.localDate || event.date;
            if (!startDate) return false;
            
            const eventDate = new Date(startDate);
            
            switch(dateFilter) {
                case 'today':
                    return eventDate.toDateString() === today.toDateString();
                case 'this-week':
                    const weekFromNow = new Date(today);
                    weekFromNow.setDate(weekFromNow.getDate() + 7);
                    return eventDate >= today && eventDate <= weekFromNow;
                case 'this-month':
                    return eventDate.getMonth() === now.getMonth() && 
                           eventDate.getFullYear() === now.getFullYear();
                case 'next-month':
                    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                    const monthAfter = new Date(now.getFullYear(), now.getMonth() + 2, 0);
                    return eventDate >= nextMonth && eventDate <= monthAfter;
                default:
                    return true;
            }
        });
    }
    
    // Filter by location
    if (locationFilter) {
        filtered = filtered.filter(event => {
            const venue = event._embedded?.venues?.[0];
            const city = (venue?.city?.name || event.city || '').toLowerCase();
            const state = (venue?.state?.stateCode || venue?.state?.name || event.state || '').toLowerCase();
            const location = (event.location || '').toLowerCase();
            
            return city.includes(locationFilter) || 
                   state.includes(locationFilter) || 
                   location.includes(locationFilter);
        });
    }
    
    displayDashboardEvents(filtered);
}

// Clear dashboard filters
function clearDashboardFilters() {
    // Reset filter inputs
    if (document.getElementById('filterStatus')) {
        document.getElementById('filterStatus').value = '';
    }
    if (document.getElementById('filterDate')) {
        document.getElementById('filterDate').value = '';
    }
    if (document.getElementById('filterLocation')) {
        document.getElementById('filterLocation').value = '';
    }
    
    // Reset search
    if (document.getElementById('searchInput')) {
        document.getElementById('searchInput').value = '';
    }
    
    // Display all events
    displayDashboardEvents(dashboardEvents);
}

