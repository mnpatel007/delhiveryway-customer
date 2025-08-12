import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem('customerAuth');
            if (saved) {
                const authData = JSON.parse(saved);
                // Set axios default header
                if (authData.token) {
                    axios.defaults.headers.common['Authorization'] = `Bearer ${authData.token}`;
                }
                return authData;
            }
        } catch (error) {
            console.error('Error parsing auth data:', error);
            localStorage.removeItem('customerAuth');
        }
        return null;
    });

    const [loading, setLoading] = useState(false);

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
            (error) => Promise.reject(error)
        );

        // Response interceptor
        const responseInterceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    // Token expired or invalid
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
            // Ensure we have the correct structure
            const userData = {
                user: authData.data?.user || authData.user,
                token: authData.data?.token || authData.token
            };

            // Store in localStorage
            localStorage.setItem('customerAuth', JSON.stringify(userData));

            // Set axios default header
            axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;

            // Update state
            setUser(userData);

            console.log('✅ Customer logged in:', userData.user?.name);
        } catch (error) {
            console.error('Login error:', error);
        }
    };

    const logout = () => {
        try {
            // Clear localStorage
            localStorage.removeItem('customerAuth');

            // Clear axios header
            delete axios.defaults.headers.common['Authorization'];

            // Clear state
            setUser(null);

            console.log('✅ Customer logged out');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const updateUser = (updatedUserData) => {
        try {
            const newAuthData = {
                ...user,
                user: { ...user.user, ...updatedUserData }
            };

            localStorage.setItem('customerAuth', JSON.stringify(newAuthData));
            setUser(newAuthData);
        } catch (error) {
            console.error('Update user error:', error);
        }
    };

    const isAuthenticated = () => {
        return !!(user?.token && user?.user);
    };

    const getToken = () => {
        return user?.token;
    };

    const getUser = () => {
        return user?.user;
    };

    const value = {
        user: user?.user || null,
        token: user?.token || null,
        loading,
        login,
        logout,
        updateUser,
        isAuthenticated,
        getToken,
        getUser,
        setLoading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};