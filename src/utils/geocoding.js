import axios from 'axios';

// API Configuration
const GOOGLE_MAPS_API_KEY = 'AIzaSyBTM8risurfzxPDibLQTKHOA9DSr89S6FA';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const GOOGLE_GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

// Cache for storing geocoding results to reduce API calls
const geocodeCache = new Map();

// Helper function to format address components
const formatAddressComponents = (address) => {
    const components = [
        address.street,
        address.landmark ? `near ${address.landmark}` : '',
        address.area || '',
        address.city,
        address.state,
        address.zipCode,
        'India' // Default to India since it's the primary market
    ].filter(Boolean); // Remove empty strings

    return components.join(', ');
};

/**
 * Geocode an address using available services
 * @param {string|object} address - The address to geocode (string or address object)
 * @returns {Promise<{lat: number, lng: number}>} - Object containing latitude and longitude
 */
export const geocodeAddress = async (address) => {
  if (!address) {
    throw new Error('Address is required');
  }

  // If address is an object, format it
  const addressString = typeof address === 'string' 
    ? address 
    : formatAddressComponents(address);

  // Check cache first
  const cacheKey = addressString.toLowerCase().trim();
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  try {
    // First try Google Maps Geocoding API
    try {
      const response = await axios.get(GOOGLE_GEOCODE_URL, {
        params: {
          address: addressString,
          key: GOOGLE_MAPS_API_KEY,
          region: 'in',
          components: 'country:IN',
          bounds: '68.17665,7.96553,97.40256,35.49401' // Rough bounds of India
        },
        timeout: 5000 // 5 second timeout
      });

      if (response.data && response.data.status === 'OK' && response.data.results.length > 0) {
        const { lat, lng } = response.data.results[0].geometry.location;
        const result = { lat, lng };
        geocodeCache.set(cacheKey, result);
        return result;
      } else if (response.data.status === 'ZERO_RESULTS') {
        console.warn('Google Geocoding API returned no results, falling back to Nominatim');
      } else {
        console.warn('Google Geocoding API error:', response.data.status, 'Falling back to Nominatim');
      }
    } catch (googleError) {
      console.warn('Google Geocoding API failed, falling back to Nominatim:', googleError);
    }

    // Fallback to Nominatim (OpenStreetMap)
    const response = await axios.get(NOMINATIM_URL, {
      params: {
        q: addressString,
        format: 'json',
        addressdetails: 1,
        limit: 1,
        countrycodes: 'in', // Focus on India
        'accept-language': 'en',
        namedetails: 1,
        extratags: 1
      },
      headers: {
        'User-Agent': 'DelhiveryWay/1.0 (contact@delhiveryway.com)' // Required by Nominatim
      },
      timeout: 5000 // 5 second timeout
    });

    if (response.data && response.data[0]) {
      const result = {
        lat: parseFloat(response.data[0].lat),
        lng: parseFloat(response.data[0].lon)
      };
      geocodeCache.set(cacheKey, result);
      return result;
    }

    // Try with a simpler address (just city and state) if full address fails
    if (typeof address === 'object' && (address.city || address.state)) {
      const simpleAddress = [address.city, address.state, 'India'].filter(Boolean).join(', ');
      if (simpleAddress !== addressString) {
        return geocodeAddress(simpleAddress);
      }
    }

    throw new Error(`Could not find coordinates for: ${addressString}`);
  } catch (error) {
    console.error('Geocoding error for address:', address, 'Error:', error);
    
    // Provide more specific error messages
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response.status === 429) {
        throw new Error('Too many geocoding requests. Please wait a moment and try again.');
      }
      throw new Error(`Geocoding service error: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('Could not connect to the geocoding service. Please check your internet connection.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Geocoding service timed out. Please try again.');
    }
    
    // Re-throw the original error if it's one of our custom errors
    if (error.message.includes('Could not find coordinates')) {
      throw error;
    }
    
    // For any other errors, provide a generic message
    throw new Error(`Failed to process address: ${error.message || 'Please check the address and try again.'}`);
  }
};

/**
 * Reverse geocode coordinates to get address
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string>} - Formatted address
 */
export const reverseGeocode = async (lat, lng) => {
  try {
    const response = await axios.get(NOMINATIM_URL, {
      params: {
        lat,
        lon: lng,
        format: 'json',
        addressdetails: 1,
        'accept-language': 'en'
      }
    });

    if (response.data && response.data[0]) {
      return response.data[0].display_name;
    }
    
    throw new Error('No address found for the given coordinates');
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw new Error('Failed to get address from coordinates');
  }
};
