// Simple API Handler
const API = {
    // Login Admin - uses backend /auth/login endpoint
    login: async function(email, password) {
        try {
            const response = await fetch(`${API_CONFIG.baseURL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                mode: 'cors',
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (result.success && result.message && result.message.token) {
                const token = result.message.token;
                const user = result.message.user;
                
                localStorage.setItem('adminToken', token);
                localStorage.setItem('adminEmail', user.email);
                localStorage.setItem('adminUser', JSON.stringify(user));
                
                return { success: true, token: token, user: user };
            } else {
                throw new Error(result.message || 'Invalid email or password');
            }
        } catch (error) {
            console.error('Login error:', error);
            throw new Error(error.message || 'Login failed. Please try again.');
        }
    },

    // OLD Login method (kept for reference/fallback)
    // Uses Netlify Function with hardcoded credentials
    loginLegacy: async function(email, password) {
        try {
            const response = await fetch(API_CONFIG.loginURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (result.success) {
                localStorage.setItem('adminToken', result.token);
                localStorage.setItem('adminEmail', result.email);
                return { success: true, token: result.token };
            } else {
                throw new Error(result.message || 'Invalid email or password');
            }
        } catch (error) {
            console.error('Login error:', error);
            throw new Error(error.message || 'Login failed. Please try again.');
        }
    },

    // Register new admin user
    register: async function(userData) {
        try {
            const response = await fetch(`${API_CONFIG.baseURL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                mode: 'cors',
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (result.success) {
                return { success: true, data: result.data, message: result.message };
            } else {
                throw new Error(result.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            throw new Error(error.message || 'Registration failed. Please try again.');
        }
    },

    // Get all listings (events, restaurants, etc)
    getListings: async function(type = 'all-events') {
        try {
            const url = `${API_CONFIG.baseURL}/${type}`;
            console.log('Fetching from:', url);
            
            const response = await fetch(url, {
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
            console.log('Received data:', result);
            
            // Handle different response formats
            
            // If response has data.users (nested structure)
            if (result.data && result.data.users && Array.isArray(result.data.users)) {
                return result.data.users;
            }
            
            // If response has data property that is an array
            if (result.data && Array.isArray(result.data)) {
                return result.data;
            }
            
            // If response is already an array, return it
            if (Array.isArray(result)) {
                return result;
            }
            
            // If response has items property
            if (result.items && Array.isArray(result.items)) {
                return result.items;
            }
            
            // If response has users property directly
            if (result.users && Array.isArray(result.users)) {
                return result.users;
            }
            
            // Otherwise return empty array
            console.warn('Unexpected data format:', result);
            return [];
        } catch (error) {
            console.error('Error fetching listings:', error);
            console.error('Error details:', error.message);
            
            // Return empty array instead of throwing
            return [];
        }
    },

    // Get single listing by ID
    getListing: async function(id, type = 'events') {
        try {
            const url = `${API_CONFIG.baseURL}/${type}/${id}`;
            console.log('Fetching from:', url);
            
            const response = await fetch(url, {
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
            console.log('Received listing data:', result);
            
            // Unwrap response if needed
            if (result.data) {
                return result.data;
            }
            
            return result;
        } catch (error) {
            console.error('Error fetching listing:', error);
            return null;
        }
    },

    // Get Events
    getEvents: async function() {
        return this.getListings('all-events');
    },

    // Get Users
    getUsers: async function() {
        return this.getListings('all-users');
    },

    // Get single user by ID
    getUser: async function(id) {
        try {
            const url = `${API_CONFIG.baseURL}/get-user?id=${id}`;
            console.log('Fetching user from:', url);
            
            const response = await fetch(url, {
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
            
            // Handle wrapped response
            if (result.data) {
                return result.data;
            }
            
            return result;
        } catch (error) {
            console.error('Error fetching user:', error);
            return null;
        }
    },

    // Get Restaurants
    getRestaurants: async function() {
        return this.getListings('restaurants');
    },

    // Get Catering
    getCatering: async function() {
        return this.getListings('catering');
    },

    // Get Real Estate
    getRealEstate: async function() {
        return this.getListings('real-estate');
    }
};
