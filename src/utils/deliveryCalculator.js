import { api } from '../services/api';

/**
 * Calculate delivery fee for a single shop
 * @param {string} shopId - Shop ID
 * @param {object} location - Customer location {lat, lng}
 * @param {number} orderValue - Order value for discount calculation
 * @returns {Promise<object>} Delivery fee calculation result
 */
export const calculateDeliveryFee = async (shopId, location, orderValue = 0) => {
    try {
        if (!shopId || !location || !location.lat || !location.lng) {
            throw new Error('Shop ID and location are required');
        }

        const response = await api.post('/delivery/calculate-fee', {
            shopId,
            deliveryLocation: {
                lat: location.lat,
                lng: location.lng
            },
            orderValue
        });

        if (response.data.success) {
            return response.data.data;
        } else {
            throw new Error(response.data.message || 'Failed to calculate delivery fee');
        }
    } catch (error) {
        console.error('Error calculating delivery fee:', error);
        throw error;
    }
};

/**
 * Calculate delivery fees for multiple shops
 * @param {string[]} shopIds - Array of shop IDs
 * @param {object} location - Customer location {lat, lng}
 * @param {number} orderValue - Order value for discount calculation
 * @returns {Promise<object[]>} Array of delivery fee calculations
 */
export const calculateDeliveryFeesBulk = async (shopIds, location, orderValue = 0) => {
    try {
        if (!shopIds || !Array.isArray(shopIds) || shopIds.length === 0) {
            throw new Error('Shop IDs array is required');
        }

        if (!location || !location.lat || !location.lng) {
            throw new Error('Location is required');
        }

        const response = await api.post('/delivery/calculate-fees-bulk', {
            shopIds,
            deliveryLocation: {
                lat: location.lat,
                lng: location.lng
            },
            orderValue
        });

        if (response.data.success) {
            return response.data.data;
        } else {
            throw new Error(response.data.message || 'Failed to calculate delivery fees');
        }
    } catch (error) {
        console.error('Error calculating bulk delivery fees:', error);
        throw error;
    }
};

/**
 * Get display text for delivery fee based on shop's delivery mode
 * @param {object} shop - Shop object
 * @param {number} calculatedFee - Calculated delivery fee (optional)
 * @returns {string} Display text for delivery fee
 */
export const getDeliveryFeeDisplay = (shop, calculatedFee = null) => {
    if (!shop) return '₹30 delivery';

    // If we have a calculated fee, use it
    if (calculatedFee !== null) {
        return `₹${calculatedFee} delivery`;
    }

    // If shop uses distance-based pricing, show "From ₹X"
    if (shop.deliveryFeeMode === 'distance' && shop.feePerKm) {
        return `From ₹${shop.feePerKm} delivery`;
    }

    // Default to fixed fee
    const fixedFee = shop.deliveryFee || 30;
    return `₹${fixedFee} delivery`;
};

/**
 * Get customer's current location using browser geolocation API
 * @returns {Promise<object|null>} Customer location {lat, lng} or null
 */
export const getCurrentLocation = () => {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            console.log('Geolocation is not supported by this browser');
            resolve(null);
            return;
        }

        const options = {
            enableHighAccuracy: true, // Use GPS for maximum accuracy
            timeout: 15000, // 15 seconds timeout for better accuracy
            maximumAge: 60000 // Cache for only 1 minute to get fresh location
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };

                console.log('📍 Got current location:', location);

                // Save to localStorage for future use
                localStorage.setItem('currentLocation', JSON.stringify({
                    ...location,
                    timestamp: Date.now()
                }));

                resolve(location);
            },
            (error) => {
                console.error('Error getting location:', error);

                // Try to get from localStorage as fallback
                const fallbackLocation = getCustomerLocation();
                if (fallbackLocation) {
                    console.log('📍 Using fallback location from localStorage');
                    resolve(fallbackLocation);
                } else {
                    resolve(null);
                }
            },
            options
        );
    });
};

/**
 * Check if customer location is available from localStorage or context
 * @returns {object|null} Customer location {lat, lng} or null
 */
export const getCustomerLocation = () => {
    try {
        // First try current location (most accurate)
        const currentLocation = localStorage.getItem('currentLocation');
        if (currentLocation) {
            const location = JSON.parse(currentLocation);
            // Check if location is not older than 30 minutes
            if (location.timestamp && (Date.now() - location.timestamp) < 1800000) {
                return {
                    lat: location.lat,
                    lng: location.lng
                };
            }
        }

        // Fallback to saved delivery address
        const savedAddress = localStorage.getItem('deliveryAddress');
        if (savedAddress) {
            const address = JSON.parse(savedAddress);
            if (address.coordinates && address.coordinates.lat && address.coordinates.lng) {
                return {
                    lat: address.coordinates.lat,
                    lng: address.coordinates.lng
                };
            }
        }

        return null;
    } catch (error) {
        console.error('Error getting customer location:', error);
        return null;
    }
};