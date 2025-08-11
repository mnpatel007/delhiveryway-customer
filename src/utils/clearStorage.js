// Clear problematic localStorage data
export const clearProblematicStorage = () => {
    try {
        // Clear user data that might have nested objects
        const userData = localStorage.getItem('user');
        if (userData) {
            const parsed = JSON.parse(userData);
            if (parsed.user?.address?.coordinates) {
                // Clean the data
                const cleanUser = {
                    ...parsed,
                    user: {
                        ...parsed.user,
                        address: {
                            street: parsed.user.address.street || '',
                            city: parsed.user.address.city || '',
                            state: parsed.user.address.state || '',
                            zipCode: parsed.user.address.zipCode || '',
                            lat: parsed.user.address.coordinates?.lat || null,
                            lng: parsed.user.address.coordinates?.lng || null
                        }
                    }
                };
                localStorage.setItem('user', JSON.stringify(cleanUser));
            }
        }
    } catch (error) {
        console.log('Clearing problematic storage:', error);
        localStorage.removeItem('user');
    }
};

// Call this on app start
clearProblematicStorage();