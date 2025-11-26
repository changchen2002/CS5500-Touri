const { onRequest } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const functionsV1 = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

admin.initializeApp();

// Set global options for all functions
setGlobalOptions({
  maxInstances: 10,
  region: 'us-central1',
});

// Get API keys - try functions.config() first (for gen1), then process.env (for gen2)
// For gen2 functions, we need to set environment variables during deployment
const getConfig = () => {
  // Try to get from functions.config() (works for gen1, may not work for gen2 at runtime)
  let config = {};
  try {
    const v1Config = functionsV1.config();
    if (v1Config && Object.keys(v1Config).length > 0) {
      config = v1Config;
    }
  } catch (e) {
    // functions.config() not available, use process.env
  }
  
  // Merge with process.env (for gen2 functions)
  return {
    flightapi: { key: config.flightapi?.key || process.env.FLIGHTAPI_KEY },
    serpapi: { key: config.serpapi?.key || process.env.SERPAPI_KEY },
    gemini: { key: config.gemini?.key || process.env.GEMINI_API_KEY }
  };
};

/**
 * Proxy endpoint for FlightAPI
 * GET /api/flights?origin=JFK&destination=LAX&departDate=2024-01-15&returnDate=2024-01-20&adults=1&children=0&infants=0&cabinClass=Economy&currency=USD
 */
exports.getFlights = onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      // Get API key from functions.config() (already set via CLI)
      const config = getConfig();
      const apiKey = config.flightapi?.key;
      
      if (!apiKey) {
        return res.status(500).json({ error: 'FlightAPI key not configured' });
      }

      // Extract parameters from query string
      const {
        origin,
        destination,
        departDate,
        returnDate,
        adults = 1,
        children = 0,
        infants = 0,
        cabinClass = 'Economy',
        currency = 'USD'
      } = req.query;

      // Validate required parameters
      if (!origin || !destination || !departDate || !returnDate) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Extract airport codes (uppercase, max 3 chars)
      const departureAirport = origin.toUpperCase().substring(0, 3);
      const arrivalAirport = destination.toUpperCase().substring(0, 3);

      // Build API URL
      const apiUrl = `https://api.flightapi.io/roundtrip/${apiKey}/${departureAirport}/${arrivalAirport}/${departDate}/${returnDate}/${adults}/${children}/${infants}/${cabinClass}/${currency}`;

      // Make request to FlightAPI
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ 
          error: `FlightAPI Error: ${response.status} ${response.statusText}`,
          details: errorText
        });
      }

      const data = await response.json();
      
      // Check if API returned an error
      if (data.error || data.message) {
        return res.status(400).json({ 
          error: data.error || data.message || 'API returned an error' 
        });
      }

      return res.json(data);
    } catch (error) {
      console.error('Error fetching flights:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  });
});

/**
 * Proxy endpoint for SerpAPI (Google Hotels)
 * POST /api/hotels
 * Body: { location, checkIn, checkOut, adults, children, currency }
 */
exports.getHotels = onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      // Get API key from functions.config() (already set via CLI)
      const config = getConfig();
      const apiKey = config.serpapi?.key;
      
      if (!apiKey) {
        return res.status(500).json({ error: 'SerpAPI key not configured' });
      }

      // Get parameters from request body (POST) or query string (GET)
      const params = req.method === 'POST' ? req.body : req.query;
      const {
        location,
        checkIn,
        checkOut,
        adults = 1,
        children = 0,
        currency = 'USD'
      } = params;

      // Validate required parameters
      if (!location || !checkIn || !checkOut) {
        return res.status(400).json({ error: 'Missing required parameters: location, checkIn, checkOut' });
      }

      // Build API URL
      const searchParams = new URLSearchParams({
        engine: 'google_hotels',
        q: location,
        check_in_date: checkIn,
        check_out_date: checkOut,
        adults: adults.toString(),
        children: children.toString(),
        currency: currency,
        gl: 'us',
        hl: 'en',
        api_key: apiKey
      });

      const apiUrl = `https://serpapi.com/search.json?${searchParams.toString()}`;

      // Make request to SerpAPI
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ 
          error: `SerpAPI Error: ${response.status} ${response.statusText}`,
          details: errorText
        });
      }

      const data = await response.json();
      
      // Check if API returned an error
      if (data.error) {
        return res.status(400).json({ 
          error: data.error || 'API returned an error' 
        });
      }

      return res.json(data);
    } catch (error) {
      console.error('Error fetching hotels:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  });
});

/**
 * Proxy endpoint for Google Gemini API
 * POST /api/generateItinerary
 * Body: { prompt }
 */
exports.generateItinerary = onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      // Get API key from functions.config() (already set via CLI)
      const config = getConfig();
      const apiKey = config.gemini?.key;
      
      if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API key not configured' });
      }

      // Get prompt from request body
      const { prompt } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'Missing required parameter: prompt' });
      }

      // Try different Gemini models
      const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-pro', 'gemini-1.0-pro'];
      let response;
      let lastError;

      for (const model of models) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: prompt
                }]
              }]
            })
          });
          
          if (response.ok) {
            break; // Success, exit loop
          } else if (response.status === 404) {
            // Model not found, try next one
            continue;
          } else {
            // Other error, break and handle
            break;
          }
        } catch (error) {
          lastError = error;
          continue; // Try next model
        }
      }

      if (!response || !response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || lastError?.message || 'All models unavailable';
        return res.status(response?.status || 500).json({ 
          error: `Gemini API error: ${errorMessage}` 
        });
      }

      const result = await response.json();
      return res.json(result);
    } catch (error) {
      console.error('Error generating itinerary:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  });
});

