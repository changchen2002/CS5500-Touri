/**
 * Utility functions to call Firebase Cloud Functions
 * These functions proxy API calls to keep API keys secure on the server
 */

import { app } from '../firebase/config';

// Get the Firebase Functions URLs
// Gen2 functions use Cloud Run URLs, not the standard cloudfunctions.net URLs
const getFunctionsUrl = (functionName) => {
  // For gen2 functions, use the Cloud Run URLs
  const functionUrls = {
    getFlights: 'https://getflights-oq5g767q3q-uc.a.run.app',
    getHotels: 'https://gethotels-oq5g767q3q-uc.a.run.app',
    generateItinerary: 'https://generateitinerary-oq5g767q3q-uc.a.run.app'
  };
  
  // Check if we're in development mode with emulator
  if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_FUNCTIONS_EMULATOR === 'true') {
    const projectId = app.options?.projectId || process.env.REACT_APP_FIREBASE_PROJECT_ID || 'touri-26007';
    return `http://localhost:5001/${projectId}/us-central1/${functionName}`;
  }
  
  return functionUrls[functionName] || functionUrls.getFlights;
};

/**
 * Call FlightAPI through Firebase Functions
 * @param {Object} params - Flight search parameters
 * @returns {Promise} Flight data from API
 */
export const fetchFlightsViaFunction = async (params) => {
  const functionsUrl = getFunctionsUrl('getFlights');
  const queryParams = new URLSearchParams({
    origin: params.origin,
    destination: params.destination,
    departDate: params.departDate,
    returnDate: params.returnDate,
    adults: params.adults || 1,
    children: params.children || 0,
    infants: params.infants || 0,
    cabinClass: params.cabinClass || 'Economy',
    currency: params.currency || 'USD'
  });

  const response = await fetch(`${functionsUrl}/getFlights?${queryParams.toString()}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Call SerpAPI (Google Hotels) through Firebase Functions
 * @param {Object} params - Hotel search parameters
 * @returns {Promise} Hotel data from API
 */
export const fetchHotelsViaFunction = async (params) => {
  const functionsUrl = getFunctionsUrl('getHotels');
  
  const response = await fetch(functionsUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      location: params.location,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      adults: params.adults || 1,
      children: params.children || 0,
      currency: params.currency || 'USD'
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Call Gemini API through Firebase Functions
 * @param {string} prompt - The prompt to send to Gemini
 * @returns {Promise} Gemini API response
 */
export const generateItineraryViaFunction = async (prompt) => {
  const functionsUrl = getFunctionsUrl('generateItinerary');
  
  const response = await fetch(functionsUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

