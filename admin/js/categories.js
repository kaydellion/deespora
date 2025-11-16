// Categories Page Logic
let allCategories = [];

// Define available categories and their API endpoints
const categoryTypes = [
    { name: 'Events', endpoint: 'all-events', slug: 'events' },
    { name: 'Restaurants', endpoint: 'restaurants', slug: 'restaurants' },
    { name: 'Catering', endpoint: 'catering', slug: 'catering' },
    { name: 'Real Estate', endpoint: 'real-estate', slug: 'real-estate' },
    /*{ name: 'Worship', endpoint: 'worship', slug: 'worship' },
    { name: 'Deals', endpoint: 'deals', slug: 'deals' },
    { name: 'Cakes & Pastries', endpoint: 'cakes-pastries', slug: 'cakes-pastries' },
    { name: 'Legal & Tax', endpoint: 'legal-tax', slug: 'legal-tax' }*/
];

// Load categories when page loads
document.addEventListener('DOMContentLoaded', async function() {
    await loadCategories();
});

// Load categories data
async function loadCategories() {
    try {
        showCategoriesLoading();
        
        // Fetch counts for each category
        const categoriesData = await Promise.all(
            categoryTypes.map(async (cat) => {
                try {
                    const data = await API.getListings(cat.endpoint);
                    const count = Array.isArray(data) ? data.length : 0;
                    
                    return {
                        id: cat.slug,
                        name: cat.name,
                        slug: cat.slug,
                        endpoint: cat.endpoint,
                        listingsCount: count,
                        status: count > 0 ? 'Active' : 'Inactive',
                        createdDate: new Date().toISOString().split('T')[0]
                    };
                } catch (error) {
                    console.error(`Error loading ${cat.name}:`, error);
                    return {
                        id: cat.slug,
                        name: cat.name,
                        slug: cat.slug,
                        endpoint: cat.endpoint,
                        listingsCount: 0,
                        status: 'Inactive',
                        createdDate: new Date().toISOString().split('T')[0]
                    };
                }
            })
        );
        
        allCategories = categoriesData;
        displayCategories(allCategories);
        
    } catch (error) {
        console.error('Error loading categories:', error);
        showCategoriesError('Failed to load categories');
    }
}

// Display categories in table
function displayCategories(categories) {
    const tableBody = document.querySelector('#myTable tbody');
    
    if (!tableBody) {
        console.error('Table body not found');
        return;
    }
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // If no categories
    if (!categories || categories.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4">No categories found</td></tr>';
        return;
    }
    
    // Add rows for each category
    categories.forEach((category, index) => {
        const row = createCategoryRow(category, index);
        tableBody.innerHTML += row;
    });
}

// Create a table row for a category
function createCategoryRow(category, index) {
    const categoryName = category.name || 'Untitled';
    const categoryId = category.id || (1000 + index);
    const listingsCount = category.listingsCount || 0;
    const createdDate = category.createdDate || 'N/A';
    const status = category.status || 'Active';
    const statusClass = status === 'Active' ? 'status-active' : 'status-suspend';
    
    return `
        <tr>
            <td>${categoryName}</td>
            <td>${categoryId}</td>
            <td>${listingsCount}</td>
            <td>${createdDate}</td>
            <td><span class="${statusClass}">${status}</span></td>
            <td>
                <div class="dropdown">
                    <button class="btn p-0" type="button" data-bs-toggle="dropdown">
                        <i class="bi bi-three-dots-vertical"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><a class="dropdown-item" href="listing.html?category=${category.slug}">View Listings (${listingsCount})</a></li>
                        <li><a class="dropdown-item" href="#" onclick="editCategory('${categoryId}')">Edit</a></li>
                        <li><a class="dropdown-item" href="#" onclick="toggleCategoryStatus('${categoryId}', '${status}')">
                            ${status === 'Active' ? 'Deactivate' : 'Activate'}
                        </a></li>
                    </ul>
                </div>
            </td>
        </tr>
    `;
}

// Edit category
function editCategory(categoryId) {
    const category = allCategories.find(c => c.id == categoryId);
    
    if (category) {
        alert('Edit Category: ' + category.name + '\n\nNote: Implement edit modal here');
        console.log('Edit category:', category);
        // TODO: Open edit modal with category data pre-filled
    }
}

// Toggle category status
function toggleCategoryStatus(categoryId, currentStatus) {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    const confirmed = confirm(`Are you sure you want to ${newStatus === 'Inactive' ? 'deactivate' : 'activate'} this category?`);
    
    if (confirmed) {
        // Update status in array
        const category = allCategories.find(c => c.id == categoryId);
        if (category) {
            category.status = newStatus;
            displayCategories(allCategories);
            alert(`Category ${newStatus.toLowerCase()}`);
        }
    }
}

// Show loading in table
function showCategoriesLoading() {
    const tableBody = document.querySelector('#myTable tbody');
    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><div class="spinner-border spinner-border-sm" role="status"></div> Loading categories...</td></tr>';
    }
}

// Show error in table
function showCategoriesError(message) {
    const tableBody = document.querySelector('#myTable tbody');
    if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger">${message}</td></tr>`;
    }
}

// Add new category
function addNewCategory() {
    const categoryName = document.getElementById('categoryName').value;
    const categorySlug = document.getElementById('categorySlug').value;
    const categoryStatus = document.getElementById('categoryStatus').checked;
    
    if (!categoryName) {
        alert('Please enter a category name');
        return;
    }
    
    const newCategory = {
        id: categorySlug || categoryName.toLowerCase().replace(/\s+/g, '-'),
        name: categoryName,
        slug: categorySlug || categoryName.toLowerCase().replace(/\s+/g, '-'),
        listingsCount: 0,
        status: categoryStatus ? 'Active' : 'Inactive',
        createdDate: new Date().toISOString().split('T')[0]
    };
    
    // TODO: Add API call to save category to backend
    console.log('New category:', newCategory);
    alert('Category added!\n\nNote: API integration needed to save to backend');
    
    // Add to local array and refresh
    allCategories.push(newCategory);
    displayCategories(allCategories);
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('addCategoryModal'));
    if (modal) modal.hide();
    
    // Reset form
    document.getElementById('categoryName').value = '';
    document.getElementById('categorySlug').value = '';
}

// Handle save category button click
document.addEventListener('DOMContentLoaded', function() {
    const saveCategoryBtn = document.querySelector('.btn-category');
    if (saveCategoryBtn) {
        saveCategoryBtn.addEventListener('click', addNewCategory);
    }
});
