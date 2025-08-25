import axios from 'axios';

// Get API key from environment variables
const MAPBOX_ACCESS_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

/**
 * Geocode an address using Mapbox API (requires API key)
 * @param {string} address - The address to geocode
 * @returns {Promise<{lat: number, lng: number}>} - Object containing latitude and longitude
 */
export const geocodeAddress = async (address) => {
  if (!address) {
    throw new Error('Address is required');
  }

  try {
    // First try Mapbox if API key is available
    if (MAPBOX_ACCESS_TOKEN) {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`,
        {
          params: {
            access_token: MAPBOX_ACCESS_TOKEN,
            country: 'IN', // Focus on India
            limit: 1
          }
        }
      );

      const [longitude, latitude] = response.data.features[0]?.center || [];
      if (latitude && longitude) {
        return { lat: latitude, lng: longitude };
      }
    }

    // Fallback to Nominatim (OpenStreetMap) if Mapbox fails or no API key
    const response = await axios.get(NOMINATIM_URL, {
      params: {
        q: address,
        format: 'json',
        addressdetails: 1,
        limit: 1,
        countrycodes: 'in', // Focus on India
        'accept-language': 'en'
      }
    });

    if (response.data && response.data[0]) {
      return {
        lat: parseFloat(response.data[0].lat),
        lng: parseFloat(response.data[0].lon)
      };
    }

    throw new Error('No results found for the given address');
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error('Failed to geocode address. Please try again.');
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
