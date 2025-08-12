import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const auth = localStorage.getItem('customerAuth');
        if (auth) {
            try {
                const { token } = JSON.parse(auth);
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            } catch (error) {
                console.error('Error parsing auth token:', error);
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('customerAuth');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    signup: (userData) => api.post('/auth/signup', userData),
    googleLogin: (googleData) => api.post('/auth/google', googleData),
    verifyEmail: (token, email) => api.get(`/auth/verify-email?token=${token}&email=${email}`),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (data) => api.post('/auth/reset-password', data),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (data) => api.put('/auth/profile', data),
    changePassword: (data) => api.put('/auth/change-password', data),
};

// Shops API
export const shopsAPI = {
    getAll: (params = {}) => api.get('/shops', { params }),
    getById: (id) => api.get(`/shops/${id}`),
    search: (params = {}) => api.get('/shops', { params }),
};

// Products API
export const productsAPI = {
    getByShop: (shopId, params = {}) => api.get(`/products/shop/${shopId}`, { params }),
    getById: (id) => api.get(`/products/${id}`),
    search: (params = {}) => api.get('/products/search', { params }),
};

// Orders API
export const ordersAPI = {
    create: (orderData) => api.post('/orders', orderData),
    getCustomerOrders: (params = {}) => api.get('/orders/customer', { params }),
    getById: (orderId) => api.get(`/orders/${orderId}`),
    cancel: (orderId, reason) => api.put(`/orders/${orderId}/cancel`, { reason }),
    approveBill: (orderId) => api.put(`/orders/${orderId}/approve-bill`),
    rejectBill: (orderId, reason) => api.put(`/orders/${orderId}/reject-bill`, { reason }),
    rate: (orderId, rating, review) => api.put(`/orders/${orderId}/rate`, { rating, review }),
    getStats: () => api.get('/orders/customer/stats'),
};

// Payment API
export const paymentAPI = {
    createPaymentIntent: (orderData) => api.post('/payment/create-intent', orderData),
    confirmPayment: (paymentIntentId) => api.post('/payment/confirm', { paymentIntentId }),
    getPaymentMethods: () => api.get('/payment/methods'),
};

// Utility functions
export const handleApiError = (error) => {
    if (error.response) {
        // Server responded with error status
        const message = error.response.data?.message || 'An error occurred';
        const status = error.response.status;

        console.error(`API Error ${status}:`, message);
        return { message, status, success: false };
    } else if (error.request) {
        // Request made but no response
        console.error('Network Error:', error.request);
        return {
            message: 'Network error. Please check your internet connection.',
            status: 0,
            success: false
        };
    } else {
        // Something else happened
        console.error('Error:', error.message);
        return {
            message: error.message || 'An unexpected error occurred',
            status: 0,
            success: false
        };
    }
};

// Helper function to make API calls with error handling
export const apiCall = async (apiFunction, ...args) => {
    try {
        const response = await apiFunction(...args);
        return {
            success: true,
            data: response.data,
            status: response.status
        };
    } catch (error) {
        return handleApiError(error);
    }
};

export default api;