/**
 * Unit tests for API Functions
 * Tests: fetchFlightsViaFunction, fetchHotelsViaFunction, generateItineraryViaFunction, getFunctionsUrl
 */

// Mock fetch globally
global.fetch = jest.fn();

// Mock Firebase config
jest.mock('../../firebase/config', () => ({
  __esModule: true,
  default: {
    options: {
      projectId: 'touri-26007'
    }
  }
}));

// firbase cloud functions to test
import {
  fetchFlightsViaFunction,
  fetchHotelsViaFunction,
  generateItineraryViaFunction
} from '../functions';

// Helper to get the internal getFunctionsUrl function
describe('API Functions', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    fetch.mockClear();
    // Reset environment variables
    delete process.env.REACT_APP_USE_FUNCTIONS_EMULATOR;
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('fetchFlightsViaFunction', () => {
    const mockParams = {
      origin: 'JFK',
      destination: 'LAX',
      departDate: '2024-01-15',
      returnDate: '2024-01-20',
      adults: 2,
      children: 1,
      infants: 0,
      cabinClass: 'Economy',
      currency: 'USD'
    };

    it('should successfully fetch flights with valid parameters', async () => {
      const mockResponse = {
        itineraries: [
          {
            id: 'itinerary-1',
            cheapest_price: { amount: 450 },
            leg_ids: ['leg-1', 'leg-2']
          }
        ],
        legs: [],
        segments: [],
        carriers: []
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await fetchFlightsViaFunction(mockParams);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('getflights-oq5g767q3q-uc.a.run.app/getFlights')
      );
      expect(result).toEqual(mockResponse);
    });

    it('should include all parameters in query string', async () => {
      const mockResponse = { itineraries: [], legs: [], segments: [], carriers: [] };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await fetchFlightsViaFunction(mockParams);

    // jest stores the calls in an array of arrays
    //   [
    //     [  // First call
    //       'https://getflights-oq5g767q3q-uc.a.run.app/getFlights?origin=JFK&...',  // [0][0] - First argument (URL)
    //       { method: 'GET', ... }  // [0][1] - Second argument (options)
    //     ]
    //   ]
      const fetchCall = fetch.mock.calls[0][0];
    //   expect url to contain the parameters
      expect(fetchCall).toContain('origin=JFK');
      expect(fetchCall).toContain('destination=LAX');
      expect(fetchCall).toContain('departDate=2024-01-15');
      expect(fetchCall).toContain('returnDate=2024-01-20');
      expect(fetchCall).toContain('adults=2');
      expect(fetchCall).toContain('children=1');
      expect(fetchCall).toContain('infants=0');
      expect(fetchCall).toContain('cabinClass=Economy');
      expect(fetchCall).toContain('currency=USD');
    });

    it('should throw error when API returns error response', async () => {
      const errorResponse = {
        error: 'FlightAPI key not configured'
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => errorResponse
      });

      await expect(fetchFlightsViaFunction(mockParams)).rejects.toThrow(
        'FlightAPI key not configured'
      );
    });

    it('should throw error with HTTP status when error object is missing', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({})
      });

      await expect(fetchFlightsViaFunction(mockParams)).rejects.toThrow(
        'HTTP 404: Not Found'
      );
    });

    it('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchFlightsViaFunction(mockParams)).rejects.toThrow('Network error');
    });
  });

  describe('fetchHotelsViaFunction', () => {
    const mockParams = {
      location: 'New York',
      checkIn: '2024-01-15',
      checkOut: '2024-01-20',
      adults: 2,
      children: 1,
      currency: 'USD'
    };

    it('should successfully fetch hotels with valid parameters', async () => {
      const mockResponse = {
        properties: [
          {
            property_token: 'hotel-1',
            name: 'Grand Hotel',
            overall_rating: 4.5,
            rate_per_night: { extracted_lowest: 200 }
          }
        ]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await fetchHotelsViaFunction(mockParams);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('gethotels-oq5g767q3q-uc.a.run.app'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should send correct JSON body in POST request', async () => {
      const mockResponse = { properties: [] };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await fetchHotelsViaFunction(mockParams);

      const fetchCall = fetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody).toEqual({
        location: 'New York',
        checkIn: '2024-01-15',
        checkOut: '2024-01-20',
        adults: 2,
        children: 1,
        currency: 'USD'
      });
    });

    it('should use default values for optional parameters', async () => {
      const minimalParams = {
        location: 'New York',
        checkIn: '2024-01-15',
        checkOut: '2024-01-20'
      };

      const mockResponse = { properties: [] };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await fetchHotelsViaFunction(minimalParams);

      const fetchCall = fetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.adults).toBe(1); // Default 
      expect(requestBody.children).toBe(0); // Default
      expect(requestBody.currency).toBe('USD'); // Default
    });

    it('should throw error when API returns error response', async () => {
      const errorResponse = {
        error: 'SerpAPI key not configured'
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => errorResponse
      });

      await expect(fetchHotelsViaFunction(mockParams)).rejects.toThrow(
        'SerpAPI key not configured'
      );
    });

    it('should throw error with HTTP status when error object is missing', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({})
      });

      await expect(fetchHotelsViaFunction(mockParams)).rejects.toThrow(
        'HTTP 400: Bad Request'
      );
    });

    it('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchHotelsViaFunction(mockParams)).rejects.toThrow('Network error');
    });
  });

  describe('generateItineraryViaFunction', () => {
    const mockPrompt = 'Create a 3-day itinerary for New York';

    it('should successfully generate itinerary with valid prompt', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    dailyPlans: [],
                    travelTips: []
                  })
                }
              ]
            }
          }
        ]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await generateItineraryViaFunction(mockPrompt);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('generateitinerary-oq5g767q3q-uc.a.run.app'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should send prompt in request body', async () => {
      const mockResponse = {
        candidates: [{ content: { parts: [{ text: '{}' }] } }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await generateItineraryViaFunction(mockPrompt);

      const fetchCall = fetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody).toEqual({
        prompt: mockPrompt
      });
    });

    it('should throw error when API returns error response', async () => {
      const errorResponse = {
        error: 'Gemini API key not configured'
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => errorResponse
      });

      await expect(generateItineraryViaFunction(mockPrompt)).rejects.toThrow(
        'Gemini API key not configured'
      );
    });

    it('should throw error with HTTP status when error object is missing', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => ({})
      });

      await expect(generateItineraryViaFunction(mockPrompt)).rejects.toThrow(
        'HTTP 503: Service Unavailable'
      );
    });

    it('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(generateItineraryViaFunction(mockPrompt)).rejects.toThrow('Network error');
    });

    it('should handle empty prompt', async () => {
      const mockResponse = {
        candidates: [{ content: { parts: [{ text: '{}' }] } }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await generateItineraryViaFunction('');

      const fetchCall = fetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.prompt).toBe('');
    });
  });
});

