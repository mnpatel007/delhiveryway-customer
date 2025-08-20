// Configuration file for the customer portal
const config = {
    // API Configuration
    API_BASE_URL: process.env.REACT_APP_API_URL || 'https://delhiveryway-backend-1.onrender.com/api',
    BACKEND_URL: process.env.REACT_APP_BACKEND_URL || 'https://delhiveryway-backend-1.onrender.com',
    SOCKET_URL: process.env.REACT_APP_SOCKET_URL || 'https://delhiveryway-backend-1.onrender.com',

    // Stripe Configuration
    STRIPE_PUBLISHABLE_KEY: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_51RdZkxRvhEVshUODDQprocdR1VZc3ANHK3sXO8CBX2R15UGdHybkDJ2LO0qqoHYTfghWvaghMbOfqP3lBWLgrMzz009Sc0sv3a',

    // App Configuration
    APP_NAME: process.env.REACT_APP_APP_NAME || 'DelhiveryWay Customer',
    APP_VERSION: process.env.REACT_APP_APP_VERSION || '1.0.0',
    APP_ENV: process.env.REACT_APP_APP_ENV || 'production',

    // Feature Flags
    ENABLE_GOOGLE_OAUTH: process.env.REACT_APP_ENABLE_GOOGLE_OAUTH === 'true',
    ENABLE_STRIPE_PAYMENTS: process.env.REACT_APP_ENABLE_STRIPE_PAYMENTS !== 'false',
    ENABLE_SOCKET_NOTIFICATIONS: process.env.REACT_APP_ENABLE_SOCKET_NOTIFICATIONS !== 'false',

    // Development Settings
    IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
    USE_MOCK_DATA: process.env.REACT_APP_USE_MOCK_DATA === 'true',

    // Default Values
    DEFAULT_DELIVERY_FEE: 30,
    DEFAULT_SERVICE_FEE_PERCENTAGE: 5, // 5%
    DEFAULT_TAX_PERCENTAGE: 5, // 5%

    // Timeouts
    API_TIMEOUT: 60000,
    SOCKET_TIMEOUT: 10000,

    // Pagination
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,

    // CORS and Network
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    ENABLE_CORS_PROXY: process.env.REACT_APP_ENABLE_CORS_PROXY === 'true'
};

export default config;
