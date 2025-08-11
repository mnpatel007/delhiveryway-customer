// src/context/AuthContext.js  (customer OR vendor repo)
import { createContext, useState } from 'react';
import io from 'socket.io-client';

const socket = io(process.env.REACT_APP_BACKEND_URL, { withCredentials: true });

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem('user');
            if (saved) {
                const userData = JSON.parse(saved);
                // Ensure the data is properly flattened
                if (userData.user?.address?.coordinates) {
                    userData.user.address = {
                        ...userData.user.address,
                        lat: userData.user.address.coordinates.lat,
                        lng: userData.user.address.coordinates.lng
                    };
                    delete userData.user.address.coordinates;
                }
                return userData;
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.removeItem('user');
        }
        return null;
    });

    const login = (userData) => {
        // Flatten user data to avoid React serialization issues
        const flattenedUser = {
            ...userData,
            user: userData.user ? {
                ...userData.user,
                // Flatten address object if it exists
                address: userData.user.address ? {
                    street: userData.user.address.street || '',
                    city: userData.user.address.city || '',
                    state: userData.user.address.state || '',
                    zipCode: userData.user.address.zipCode || '',
                    lat: userData.user.address.coordinates?.lat || null,
                    lng: userData.user.address.coordinates?.lng || null
                } : null
            } : null
        };
        
        localStorage.setItem('user', JSON.stringify(flattenedUser));
        setUser(flattenedUser);

        // NEW: join the user-id room immediately
        socket.emit('authenticate', { userId: flattenedUser.user?.id || flattenedUser.id });
    };

    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
        socket.disconnect();
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};