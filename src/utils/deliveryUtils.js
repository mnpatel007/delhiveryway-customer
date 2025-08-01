// Utility functions for delivery charge calculation

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
    // Validate coordinates
    if (!lat1 || !lng1 || !lat2 || !lng2 ||
        Math.abs(lat1) > 90 || Math.abs(lat2) > 90 ||
        Math.abs(lng1) > 180 || Math.abs(lng2) > 180) {
        console.error('Invalid coordinates:', { lat1, lng1, lat2, lng2 });
        return 0; // Return 0 distance for invalid coordinates
    }

    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Additional validation - distance should be reasonable
    if (distance > 20000) { // More than half Earth's circumference is suspicious
        console.error('Suspicious distance calculated:', distance, 'km between', { lat1, lng1, lat2, lng2 });
        return 0;
    }

    return distance;
};

/**
 * Calculate delivery charge based on distance
 * @param {number} distance - Distance in kilometers
 * @returns {number} Delivery charge in rupees
 */
export const calculateDeliveryCharge = (distance) => {
    // Base delivery charge
    const baseCharge = 20;

    // Distance-based pricing tiers
    if (distance <= 2) {
        return baseCharge; // ₹20 for up to 2km
    } else if (distance <= 5) {
        return baseCharge + 10; // ₹30 for 2-5km
    } else if (distance <= 10) {
        return baseCharge + 25; // ₹45 for 5-10km
    } else if (distance <= 15) {
        return baseCharge + 40; // ₹60 for 10-15km
    } else if (distance <= 25) {
        return baseCharge + 60; // ₹80 for 15-25km
    } else {
        return baseCharge + 80; // ₹100 for 25km+
    }
};

/**
 * Geocode an address to get coordinates
 * @param {string} address - Address to geocode
 * @returns {Promise<{lat: number, lng: number}>} Coordinates
 */
export const geocodeAddress = async (address) => {
    console.log('🔍 Frontend geocoding address:', address);

    try {
        // Try Google Maps API first if key is available and valid
        if (process.env.REACT_APP_GOOGLE_MAPS_API_KEY &&
            process.env.REACT_APP_GOOGLE_MAPS_API_KEY !== 'your_google_maps_api_key_here') {

            console.log('🗺️ Trying Google Maps API...');
            try {
                const response = await fetch(
                    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
                );
                const data = await response.json();
                console.log('Google Maps API response status:', data.status);

                if (data.status === 'OK' && data.results.length > 0) {
                    const location = data.results[0].geometry.location;
                    const coords = {
                        lat: location.lat,
                        lng: location.lng
                    };
                    console.log('✅ Google Maps found coordinates:', coords);
                    return coords;
                } else {
                    console.log('❌ Google Maps failed:', data.status, data.error_message);
                }
            } catch (gmError) {
                console.log('❌ Google Maps API error:', gmError.message);
            }
        } else {
            console.log('⚠️ Google Maps API key not available or invalid');
        }

        // Fallback to free geocoding service
        console.log('🌍 Using fallback geocoding service (OpenStreetMap)...');
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
                {
                    headers: {
                        'User-Agent': 'DelhiveryWay-App/1.0'
                    }
                }
            );
            const data = await response.json();
            console.log('OpenStreetMap response:', data.length, 'results');

            if (data && data.length > 0) {
                const coords = {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon)
                };
                console.log('✅ OpenStreetMap found coordinates:', coords);
                return coords;
            } else {
                console.log('❌ OpenStreetMap: No results found');
                throw new Error('Address not found');
            }
        } catch (osmError) {
            console.log('❌ OpenStreetMap error:', osmError.message);
            throw osmError;
        }
    } catch (error) {
        console.error('🚨 All geocoding methods failed:', error.message);
        console.log('🔄 Falling back to default Delhi coordinates');
        // Fallback to default coordinates (Delhi city center)
        return {
            lat: 28.6139,
            lng: 77.2090
        };
    }
};

/**
 * Get delivery charge for multiple shops
 * @param {Array} shops - Array of shop objects with location data
 * @param {Object} customerCoords - Customer coordinates {lat, lng}
 * @returns {Object} Object with shopId as key and delivery charge as value
 */
export const getDeliveryChargesForShops = (shops, customerCoords) => {
    const deliveryCharges = {};

    shops.forEach(shop => {
        if (shop.location && shop.location.lat && shop.location.lng) {
            const distance = calculateDistance(
                customerCoords.lat,
                customerCoords.lng,
                shop.location.lat,
                shop.location.lng
            );
            deliveryCharges[shop._id] = {
                distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
                charge: calculateDeliveryCharge(distance)
            };
        } else {
            // Fallback charge if shop doesn't have coordinates
            deliveryCharges[shop._id] = {
                distance: 0,
                charge: 30 // Default charge
            };
        }
    });

    return deliveryCharges;
};

/**
 * Format distance for display
 * @param {number} distance - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distance) => {
    if (distance < 1) {
        return `${Math.round(distance * 1000)}m`;
    } else {
        return `${Math.round(distance * 10) / 10}km`;
    }
};