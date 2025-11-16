// Netlify Function for Admin Login
exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        // Parse request body
        const { email, password } = JSON.parse(event.body);

        // Get credentials from environment variables
        const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

        /* Debug logging (remove after testing)
        console.log('Login attempt:', { email, hasPassword: !!password });
        console.log('Environment check:', { 
            hasAdminEmail: !!ADMIN_EMAIL, 
            hasAdminPassword: !!ADMIN_PASSWORD,
            adminEmailValue: ADMIN_EMAIL // Only for debugging
        });*/

        // Validate credentials
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            // Generate a simple token (you can use JWT for better security)
            const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Login successful',
                    token: token,
                    email: email
                })
            };
        } else {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Invalid credentials'
                })
            };
        }
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Server error',
                error: error.message
            })
        };
    }
};
