import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with better configuration
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000, // Increased timeout for better reliability
    headers: {
        'Content-Type': 'application/json',
    },
    // Add retry configuration
    retry: 3,
    retryDelay: 1000,
});

// Enhanced request interceptor
api.interceptors.request.use(
    (config) => {
        // Add timestamp to prevent caching issues
        config.params = {
            ...config.params,
            _t: Date.now()
        };

        // Add auth token if available
        const auth = localStorage.getItem('customerAuth');
        if (auth) {
            try {
                const { token } = JSON.parse(auth);
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            } catch (error) {
                console.error('Error parsing auth token:', error);
                localStorage.removeItem('customerAuth');
            }
        }

        console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Enhanced response interceptor with retry logic
api.interceptors.response.use(
    (response) => {
        console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
        return response;
    },
    async (error) => {
        const config = error.config;

        console.error(`❌ API Error: ${config?.method?.toUpperCase()} ${config?.url} - ${error.response?.status || 'Network Error'}`);

        // Handle authentication errors
        if (error.response?.status === 401) {
            console.log('🔐 Authentication error - clearing auth data');
            localStorage.removeItem('customerAuth');

            // Only redirect if not already on auth pages
            if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
                window.location.href = '/login';
            }
            return Promise.reject(error);
        }

        // Retry logic for network errors and 5xx errors
        if (
            (!error.response || error.response.status >= 500) &&
            config &&
            !config.__isRetryRequest &&
            config.retry > 0
        ) {
            config.__isRetryRequest = true;
            config.retry -= 1;

            console.log(`🔄 Retrying request... (${3 - config.retry}/3)`);

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, config.retryDelay));

            return api(config);
        }

        return Promise.reject(error);
    }
);

// Auth API with improved error handling
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    signup: (userData) => api.post('/auth/signup', userData),
    googleLogin: (googleData) => api.post('/auth/google', googleData),
    verifyEmail: (token, email) => api.get(`/auth/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`),
    forgotPassword: (data) => api.post('/auth/forgot-password', data),
    resetPassword: (data) => api.post('/auth/reset-password', data),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (data) => api.put('/auth/profile', data),
    changePassword: (data) => api.put('/auth/change-password', data),
};

// Shops API with caching and fallback
export const shopsAPI = {
    getAll: (params = {}) => {
        // Add default parameters for better results
        const defaultParams = {
            limit: 50,
            page: 1,
            active: true,
            ...params
        };
        return api.get('/shops', { params: defaultParams });
    },
    getById: (id) => api.get(`/shops/${id}`),
    search: (params = {}) => api.get('/shops/search', { params }),
    getByCategory: (category, params = {}) => api.get(`/shops/category/${category}`, { params }),
    getNearby: (lat, lng, radius = 10, params = {}) => api.get('/shops/nearby', {
        params: { lat, lng, radius, ...params }
    }),
};

// Products API with enhanced filtering
export const productsAPI = {
    getByShop: (shopId, params = {}) => {
        const defaultParams = {
            active: true,
            ...params
        };
        return api.get(`/products/shop/${shopId}`, { params: defaultParams });
    },
    getById: (id) => api.get(`/products/${id}`),
    search: (params = {}) => api.get('/products/search', { params }),
    getByCategory: (category, params = {}) => api.get(`/products/category/${category}`, { params }),
    getFeatured: (params = {}) => api.get('/products/featured', { params }),
};

// Orders API with comprehensive order management
export const ordersAPI = {
    create: (orderData) => api.post('/orders', orderData),
    getCustomerOrders: (params = {}) => {
        const defaultParams = {
            limit: 50,
            page: 1,
            sort: '-createdAt',
            ...params
        };
        return api.get('/orders/customer', { params: defaultParams });
    },
    getById: (orderId) => api.get(`/orders/${orderId}`),
    cancel: (orderId, reason) => api.put(`/orders/${orderId}/cancel`, { reason }),
    approveBill: (orderId) => api.put(`/orders/${orderId}/approve-bill`),
    rejectBill: (orderId, reason) => api.put(`/orders/${orderId}/reject-bill`, { reason }),
    rate: (orderId, rating, review) => api.put(`/orders/${orderId}/rate`, { rating, review }),
    getStats: () => api.get('/orders/customer/stats'),
    track: (orderId) => api.get(`/orders/${orderId}/track`),
};

// Payment API with Stripe integration
export const paymentAPI = {
    createPaymentIntent: (orderData) => api.post('/payment/create-intent', orderData),
    createCheckoutSession: (orderData) => api.post('/payment/create-checkout-session', orderData),
    confirmPayment: (paymentIntentId) => api.post('/payment/confirm', { paymentIntentId }),
    getPaymentMethods: () => api.get('/payment/methods'),
    getSession: (sessionId) => api.get(`/payment/session/${sessionId}`),
};

// Contact API
export const contactAPI = {
    send: (data) => api.post('/contact', data),
};


// Utility functions for better error handling
export const handleApiError = (error) => {
    // Network error
    if (!error.response) {
        console.error('🌐 Network Error:', error.message);
        return {
            message: 'Unable to connect to server. Please check your internet connection and try again.',
            status: 0,
            success: false,
            type: 'NETWORK_ERROR'
        };
    }

    // Server error
    const status = error.response.status;
    const data = error.response.data;

    let message = data?.message || 'An unexpected error occurred';

    // Customize messages based on status codes
    switch (status) {
        case 400:
            message = data?.message || 'Invalid request. Please check your input and try again.';
            break;
        case 401:
            message = 'Authentication required. Please log in and try again.';
            break;
        case 403:
            message = 'Access denied. You don\'t have permission to perform this action.';
            break;
        case 404:
            message = 'The requested resource was not found.';
            break;
        case 409:
            message = data?.message || 'A conflict occurred. The resource may already exist.';
            break;
        case 422:
            message = data?.message || 'Validation failed. Please check your input.';
            break;
        case 429:
            message = 'Too many requests. Please wait a moment and try again.';
            break;
        case 500:
            message = 'Server error. Please try again later.';
            break;
        case 502:
        case 503:
        case 504:
            message = 'Service temporarily unavailable. Please try again in a few moments.';
            break;
        default:
            message = data?.message || `Server error (${status}). Please try again.`;
    }

    console.error(`❌ API Error ${status}:`, message);

    return {
        message,
        status,
        success: false,
        type: 'API_ERROR',
        details: data
    };
};

// Enhanced API call wrapper with better error handling and loading states
export const apiCall = async (apiFunction, ...args) => {
    try {
        console.log('🚀 Making API call...');
        const startTime = Date.now();

        const response = await apiFunction(...args);

        const duration = Date.now() - startTime;
        console.log(`✅ API call completed in ${duration}ms`);

        return {
            success: true,
            data: response.data,
            status: response.status,
            duration
        };
    } catch (error) {
        const errorResult = handleApiError(error);

        // Add additional context for debugging
        errorResult.timestamp = new Date().toISOString();
        errorResult.args = args;

        return errorResult;
    }
};

// Health check function
export const healthCheck = async () => {
    try {
        const response = await api.get('/health', { timeout: 5000 });
        return {
            success: true,
            status: 'healthy',
            data: response.data
        };
    } catch (error) {
        return {
            success: false,
            status: 'unhealthy',
            error: error.message
        };
    }
};

// Cache management
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getCachedData = (key) => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`📦 Using cached data for: ${key}`);
        return cached.data;
    }
    return null;
};

export const setCachedData = (key, data) => {
    cache.set(key, {
        data,
        timestamp: Date.now()
    });
    console.log(`💾 Cached data for: ${key}`);
};

export const clearCache = () => {
    cache.clear();
    console.log('🗑️ Cache cleared');
};

// Export the main api instance and named export
export { api };
export default api;