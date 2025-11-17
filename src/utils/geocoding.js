import axios from 'axios';

// Create a separate axios instance for geocoding without authorization headers
const geocodingAxios = axios.create({
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// ====== Config ======
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
const GOOGLE_GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

// Simple in-memory cache (address string -> {lat, lng})
const geocodeCache = new Map();

// ---------- Helpers ----------
const normalizeString = (s) => (s || '').toString().trim();
const isFiniteNum = (n) => Number.isFinite(Number(n));

const formatAddressComponents = (address) => {
  if (typeof address === 'string') return normalizeString(address);

  const parts = [
    normalizeString(address.street),
    address.landmark ? `near ${normalizeString(address.landmark)}` : '',
    normalizeString(address.area),
    normalizeString(address.city),
    normalizeString(address.state),
    normalizeString(address.zipCode),
    'India', // default market
  ].filter(Boolean);

  return parts.join(', ');
};

const toLL = (lat, lng) => ({
  lat: parseFloat(lat),
  lng: parseFloat(lng),
});

// ---------- Geocoding ----------
/**
 * Geocode an address (string or object) -> { lat, lng }
 */
export const geocodeAddress = async (address) => {
  if (!address) throw new Error('Address is required');

  const addressString = formatAddressComponents(address);
  const cacheKey = addressString.toLowerCase();

  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  // 1) Try Google Geocoding API
  try {
    const resp = await geocodingAxios.get(GOOGLE_GEOCODE_URL, {
      params: {
        address: addressString,
        key: GOOGLE_MAPS_API_KEY,
        region: 'in',
        components: 'country:IN',
        bounds: '7.96553,68.17665|35.49401,97.40256', // SW|NE (lat,lng|lat,lng)
      },
      timeout: 8000,
    });

    const { data } = resp;

    if (data?.status === 'OK' && Array.isArray(data.results) && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      const result = toLL(lat, lng);
      geocodeCache.set(cacheKey, result);
      return result;
    }

    if (data?.status === 'ZERO_RESULTS') {
      // Fall through to Nominatim
      // console.warn('Google Geocoding: ZERO_RESULTS. Falling back to Nominatim.');
    } else {
      // console.warn('Google Geocoding non-OK status:', data?.status);
    }
  } catch (googleErr) {
    // console.warn('Google Geocoding failed. Falling back to Nominatim:', googleErr);
  }

  // 2) Fallback to Nominatim (OpenStreetMap)
  try {
    const resp = await geocodingAxios.get(NOMINATIM_SEARCH_URL, {
      params: {
        q: addressString,
        format: 'json',
        addressdetails: 1,
        limit: 1,
        countrycodes: 'in',
        'accept-language': 'en',
      },
      timeout: 8000,
      // Nominatim asks for a valid User-Agent (browser will provide one).
      // If you proxy via backend, set a descriptive UA there per their policy.
    });

    if (Array.isArray(resp.data) && resp.data[0]) {
      const { lat, lon } = resp.data[0];
      const result = toLL(lat, lon);
      geocodeCache.set(cacheKey, result);
      return result;
    }
  } catch (nomErr) {
    // continue to simplified retry path
  }

  // 3) Try simplified address (city, state, India)
  if (typeof address === 'object' && (address.city || address.state)) {
    const simple = [address.city, address.state, 'India'].filter(Boolean).join(', ');
    if (simple.toLowerCase() !== addressString.toLowerCase()) {
      return geocodeAddress(simple);
    }
  }

  // If we got here, both providers failed
  throw new Error(`Could not find coordinates for: ${addressString}`);
};

// ---------- Reverse Geocoding ----------
/**
 * Reverse geocode lat/lng -> formatted address (display_name)
 */
export const reverseGeocode = async (lat, lng) => {
  if (!isFiniteNum(lat) || !isFiniteNum(lng)) {
    throw new Error('Valid latitude and longitude are required');
  }

  try {
    const resp = await geocodingAxios.get(NOMINATIM_REVERSE_URL, {
      params: {
        lat,
        lon: lng,
        format: 'json',
        addressdetails: 1,
        'accept-language': 'en',
      },
      timeout: 8000,
    });

    // Nominatim /reverse returns an object, not an array
    if (resp?.data?.display_name) {
      return resp.data.display_name;
    }

    throw new Error('No address found for the given coordinates');
  } catch (error) {
    // Improved, specific error messages
    if (error.code === 'ECONNABORTED') {
      throw new Error('Reverse geocoding timed out. Please try again.');
    }
    if (error.response) {
      if (error.response.status === 429) {
        throw new Error('Too many reverse geocoding requests. Please wait and try again.');
      }
      throw new Error(
        `Reverse geocoding service error: ${error.response.status} - ${error.response.statusText}`
      );
    }
    if (error.request) {
      throw new Error('Could not connect to the reverse geocoding service.');
    }
    throw new Error(error.message || 'Failed to get address from coordinates');
  }
};
