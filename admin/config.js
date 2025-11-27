// API Configuration
const API_CONFIG = {
    baseURL: 'https://deesporabackend.vercel.app',
    // Credentials are now handled by Netlify Function
    loginURL: '/.netlify/functions/login'
};
// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token && !window.location.pathname.includes('index.html')) {
        window.location.href = 'index.html';
    }
}

// Logout function
function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    window.location.href = 'index.html';
}
