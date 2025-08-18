import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem('customerAuth');
            if (saved) {
                const authData = JSON.parse(saved);
                // Validate the auth data structure
                if (authData && authData.token && authData.user) {
                    // Set axios default header
                    axios.defaults.headers.common['Authorization'] = `Bearer ${authData.token}`;
                    console.log('✅ Auth restored from localStorage:', authData.user.name);
                    return authData;
                }
            }
        } catch (error) {
            console.error('❌ Error parsing auth data:', error);
            localStorage.removeItem('customerAuth');
        }
        return null;
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Set up axios interceptors
    useEffect(() => {
        // Request interceptor
        const requestInterceptor = axios.interceptors.request.use(
            (config) => {
                if (user?.token) {
                    config.headers.Authorization = `Bearer ${user.token}`;
                }
                return config;
            },
            (error) => {
                console.error('❌ Request interceptor error:', error);
                return Promise.reject(error);
            }
        );

        // Response interceptor
        const responseInterceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    console.log('🔐 Token expired or invalid - logging out');
                    logout();
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.request.eject(requestInterceptor);
            axios.interceptors.response.eject(responseInterceptor);
        };
    }, [user]);

    const login = (authData) => {
        try {
            setError(null);
            
            // Handle different response structures
            let userData;
            if (authData.data) {
                userData = {
                    user: authData.data.user || authData.data.data?.user,
                    token: authData.data.token || authData.data.data?.token
                };
            } else {
                userData = {
                    user: authData.user,
                    token: authData.token
                };
            }

            // Validate required fields
            if (!userData.user || !userData.token) {
                throw new Error('Invalid authentication data received');
            }

            // Ensure user has required fields
            if (!userData.user.email || !userData.user.name) {
                throw new Error('Incomplete user data received');
            }

            // Store in localStorage with error handling
            try {
                localStorage.setItem('customerAuth', JSON.stringify(userData));
            } catch (storageError) {
                console.error('❌ Failed to save auth data:', storageError);
                throw new Error('Failed to save authentication data');
            }

            // Set axios default header
            axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;

            // Update state
            setUser(userData);

            console.log('✅ Customer logged in successfully:', userData.user.name);
            return true;
        } catch (error) {
            console.error('❌ Login error:', error);
            setError(error.message || 'Login failed');
            return false;
        }
    };

    const logout = () => {
        try {
            setError(null);
            
            // Clear localStorage
            localStorage.removeItem('customerAuth');

            // Clear axios header
            delete axios.defaults.headers.common['Authorization'];

            // Clear state
            setUser(null);

            console.log('✅ Customer logged out successfully');
        } catch (error) {
            console.error('❌ Logout error:', error);
            setError('Logout failed');
        }
    };

    const updateUser = (updatedUserData) => {
        try {
            setError(null);
            
            if (!user) {
                throw new Error('No user logged in');
            }

            const newAuthData = {
                ...user,
                user: { 
                    ...user.user, 
                    ...updatedUserData 
                }
            };

            // Validate updated data
            if (!newAuthData.user.email || !newAuthData.user.name) {
                throw new Error('Invalid user data');
            }

            localStorage.setItem('customerAuth', JSON.stringify(newAuthData));
            setUser(newAuthData);
            
            console.log('✅ User data updated successfully');
            return true;
        } catch (error) {
            console.error('❌ Update user error:', error);
            setError(error.message || 'Failed to update user data');
            return false;
        }
    };

    const isAuthenticated = () => {
        return !!(user?.token && user?.user);
    };

    const getToken = () => {
        return user?.token || null;
    };

    const getUser = () => {
        return user?.user || null;
    };

    const clearError = () => {
        setError(null);
    };

    // Auto-refresh token if needed (optional enhancement)
    useEffect(() => {
        if (user?.token) {
            try {
                // Decode JWT to check expiration (basic check)
                const tokenParts = user.token.split('.');
                if (tokenParts.length === 3) {
                    const payload = JSON.parse(atob(tokenParts[1]));
                    const currentTime = Date.now() / 1000;
                    
                    // If token expires in less than 5 minutes, we might want to refresh
                    if (payload.exp && payload.exp - currentTime < 300) {
                        console.log('⚠️ Token expiring soon');
                        // Could implement token refresh here
                    }
                }
            } catch (error) {
                console.log('ℹ️ Could not decode token for expiration check');
            }
        }
    }, [user]);

    const value = {
        // User data
        user: user?.user || null,
        token: user?.token || null,
        
        // State
        loading,
        error,
        
        // Actions
        login,
        logout,
        updateUser,
        clearError,
        
        // Utilities
        isAuthenticated,
        getToken,
        getUser,
        setLoading,
        
        // Full auth object for backward compatibility
        auth: user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook for using auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Helper function to check if user has specific role
export const hasRole = (user, role) => {
    return user?.role === role;
};

// Helper function to check if user is customer
export const isCustomer = (user) => {
    return hasRole(user, 'customer');
};