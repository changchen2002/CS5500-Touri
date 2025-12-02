/**
 * Unit tests for Data Transformation Functions
 * Tests: transformFlightData, transformHotelData, and helper functions
 */

// formatTime('2024-01-15T08:30:00Z') => '8:30 AM'
// formatTime('2024-01-15T14:45:00Z') => '2:45 PM'
// formatTime(null) => 'N/A'
// formatTime(undefined) => 'N/A'
// formatTime('') => 'N/A'
const formatTime = (isoString) => {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

// formatDuration(150) // Returns "2h 30m"
// formatDuration(45)  // Returns "0h 45m"
// formatDuration(0)   // Returns "0h 0m"
// formatDuration(null) // Returns "N/A"
const formatDuration = (minutes) => {
  if (minutes === null || minutes === undefined) return 'N/A';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

// getAirlineName(1, carriers) // Returns "Delta Airlines"
// getAirlineName(null, carriers) // Returns "Unknown Airline"
// getAirlineName(undefined, carriers) // Returns "Unknown Airline"
// getAirlineName(1, []) // Returns "Unknown Airline"
// getAirlineName(1, null) // Returns "Unknown Airline"
const getAirlineName = (carrierId, carriers) => {
  if (!carriers || !carrierId) return 'Unknown Airline';
  const carrier = carriers.find(c => c.id === carrierId);
  return carrier ? (carrier.name || carrier.display_name || 'Unknown Airline') : 'Unknown Airline';
};

// Transform FlightAPI response to UI format
const transformFlightData = (apiResponse, searchData) => {
  if (!apiResponse || !apiResponse.itineraries || !apiResponse.legs || !apiResponse.segments) {
    return [];
  }

  const { itineraries, legs, segments, carriers = [] } = apiResponse;
  
  return itineraries.map((itinerary, index) => {
    // Get the cheapest price
    const price = itinerary.cheapest_price?.amount || 
                 itinerary.pricing_options?.[0]?.price?.amount || 
                 0;

    // Get the first leg (outbound) and second leg (return)
    // leg_ids is an array of leg IDs
    // itinerary.leg_ids[0] is the first leg ID
    // itinerary.leg_ids[1] is the second leg ID
    const outboundLeg = legs.find(l => l.id === itinerary.leg_ids[0]);
    const returnLeg = legs.find(l => l.id === itinerary.leg_ids[1]);

    // Get segments for outbound leg
    const outboundSegments = outboundLeg 
      ? outboundLeg.segment_ids.map(segId => 
          segments.find(s => s.id === segId)
        ).filter(Boolean)
      : [];

    // Get first and last segment of outbound for display (the departure time)
    const firstOutboundSegment = outboundSegments[0];
    // lastOutboundSegment is the last segment of the outbound leg (the arrival time)
    const lastOutboundSegment = outboundSegments[outboundSegments.length - 1];

    // Get marketing carrier from first segment
    const marketingCarrierId = firstOutboundSegment?.marketing_carrier_id;
    const airline = getAirlineName(marketingCarrierId, carriers);

    // Format flight number
    // marketing_flight_number is the flight number
    // airline.substring(0, 2).toUpperCase() => the airline code UAL
    // firstOutboundSegment.marketing_flight_number => the flight number 1234
    // `${airline.substring(0, 2).toUpperCase()} ${firstOutboundSegment.marketing_flight_number}` => UAL 1234
    // if marketing_flight_number is not available, return 'N/A'
    const flightNumber = firstOutboundSegment?.marketing_flight_number 
      ? `${airline.substring(0, 2).toUpperCase()} ${firstOutboundSegment.marketing_flight_number}` : 'N/A';

    return {
      id: itinerary.id || `flight-${index}`,
      airline: airline,
      flightNumber: flightNumber,
      departure: formatTime(outboundLeg?.departure),
      arrival: formatTime(lastOutboundSegment?.arrival || outboundLeg?.arrival),
      duration: formatDuration(outboundLeg?.duration),
      stops: outboundLeg?.stop_count || 0,
      price: Math.round(price),
      aircraft: 'Aircraft Info N/A',
      returnDeparture: formatTime(returnLeg?.departure),
      returnArrival: formatTime(returnLeg?.arrival),
      returnDuration: formatDuration(returnLeg?.duration),
      returnStops: returnLeg?.stop_count || 0,
      rawData: itinerary
    };
  });
};

// Transform hotel API response to UI format
const transformHotelData = (apiResponse, searchParams) => {
  if (!apiResponse || !apiResponse.properties) {
    return [];
  }

  return apiResponse.properties.map((property, index) => {
    const price = property.rate_per_night?.extracted_lowest || 
                 property.total_rate?.extracted_lowest || 
                 0;

    return {
      id: property.property_token || `hotel-${index}`,
      name: property.name || 'Unknown Hotel',
      rating: property.overall_rating || 0,
      stars: Math.round(property.overall_rating || 0),
      distance: property.distance_from_center || 'Distance N/A',
      pricePerNight: Math.round(price),
      amenities: property.amenities || [],
      image: property.thumbnail || '🏨',
      address: property.address || '',
      reviews: property.reviews || 0,
      rawData: property
    };
  });
};

describe('Data Transformation Functions', () => {
  describe('formatTime', () => {
    it('should format ISO string to readable time', () => {
      const isoString = '2024-01-15T08:30:00Z';
      const result = formatTime(isoString);
      expect(result).toMatch(/\d{1,2}:\d{2}\s(AM|PM)/);
    });

    it('should return "N/A" for null input', () => {
      expect(formatTime(null)).toBe('N/A');
    });

    it('should return "N/A" for undefined input', () => {
      expect(formatTime(undefined)).toBe('N/A');
    });

    it('should return "N/A" for empty string', () => {
      expect(formatTime('')).toBe('N/A');
    });
  });

  describe('formatDuration', () => {
    it('should format minutes to hours and minutes', () => {
      expect(formatDuration(150)).toBe('2h 30m');
      expect(formatDuration(90)).toBe('1h 30m');
      expect(formatDuration(60)).toBe('1h 0m');
      expect(formatDuration(45)).toBe('0h 45m');
    });

    it('should return "N/A" for null input', () => {
      expect(formatDuration(null)).toBe('N/A');
    });

    it('should return "N/A" for undefined input', () => {
      expect(formatDuration(undefined)).toBe('N/A');
    });

    it('should handle zero minutes', () => {
      expect(formatDuration(0)).toBe('0h 0m');
    });
  });

  describe('getAirlineName', () => {
    const mockCarriers = [
      { id: 1, name: 'Delta Airlines', display_name: 'Delta' },
      { id: 2, name: 'American Airlines', display_name: 'American' },
      { id: 3, display_name: 'United Airlines' }
    ];

    it('should return airline name when carrier is found', () => {
      expect(getAirlineName(1, mockCarriers)).toBe('Delta Airlines');
      expect(getAirlineName(2, mockCarriers)).toBe('American Airlines');
    });

    it('should return display_name when name is not available', () => {
      expect(getAirlineName(3, mockCarriers)).toBe('United Airlines');
    });

    it('should return "Unknown Airline" when carrier not found', () => {
      expect(getAirlineName(999, mockCarriers)).toBe('Unknown Airline');
    });

    it('should return "Unknown Airline" for null carrierId', () => {
      expect(getAirlineName(null, mockCarriers)).toBe('Unknown Airline');
    });

    it('should return "Unknown Airline" for empty carriers array', () => {
      expect(getAirlineName(1, [])).toBe('Unknown Airline');
    });

    it('should return "Unknown Airline" for null carriers', () => {
      expect(getAirlineName(1, null)).toBe('Unknown Airline');
    });
  });

  describe('transformFlightData', () => {
    const mockApiResponse = {
      itineraries: [
        {
          id: 'itinerary-1',
          cheapest_price: { amount: 450.75 },
          leg_ids: ['leg-1', 'leg-2']
        }
      ],
      legs: [
        {
          id: 'leg-1',
          departure: '2024-01-15T08:30:00Z',
          arrival: '2024-01-15T11:00:00Z',
          duration: 150,
          stop_count: 0,
          segment_ids: ['seg-1']
        },
        {
          id: 'leg-2',
          departure: '2024-01-20T14:00:00Z',
          arrival: '2024-01-20T17:30:00Z',
          duration: 210,
          stop_count: 1,
          segment_ids: ['seg-2']
        }
      ],
      segments: [
        {
          id: 'seg-1',
          marketing_carrier_id: 1,
          marketing_flight_number: '1234',
          arrival: '2024-01-15T11:00:00Z'
        },
        {
          id: 'seg-2',
          marketing_carrier_id: 1,
          marketing_flight_number: '5678',
          arrival: '2024-01-20T17:30:00Z'
        }
      ],
      carriers: [
        { id: 1, name: 'Delta Airlines' }
      ]
    };

    it('should transform valid FlightAPI response correctly', () => {
      const result = transformFlightData(mockApiResponse);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'itinerary-1',
        airline: 'Delta Airlines',
        flightNumber: 'DE 1234',
        stops: 0,
        price: 451, 
        returnStops: 1
      });
      expect(result[0].departure).toMatch(/\d{1,2}:\d{2}\s(AM|PM)/);
      expect(result[0].arrival).toMatch(/\d{1,2}:\d{2}\s(AM|PM)/);
      expect(result[0].duration).toBe('2h 30m');
      expect(result[0].returnDuration).toBe('3h 30m');
    });

    it('should return empty array for null response', () => {
      expect(transformFlightData(null)).toEqual([]);
    });

    it('should return empty array for undefined response', () => {
      expect(transformFlightData(undefined)).toEqual([]);
    });

    it('should return empty array when itineraries is missing', () => {
      expect(transformFlightData({ legs: [], segments: [] })).toEqual([]);
    });

    it('should return empty array when legs is missing', () => {
      expect(transformFlightData({ itineraries: [], segments: [] })).toEqual([]);
    });

    it('should handle missing cheapest_price', () => {
      const response = {
        ...mockApiResponse,
        itineraries: [{
          id: 'itinerary-1',
          leg_ids: ['leg-1', 'leg-2'],
          pricing_options: [{ price: { amount: 300 } }]
        }]
      };

      const result = transformFlightData(response);
      expect(result[0].price).toBe(300);
    });

    it('should handle missing pricing_options', () => {
      const response = {
        ...mockApiResponse,
        itineraries: [{
          id: 'itinerary-1',
          leg_ids: ['leg-1', 'leg-2']
        }]
      };

      const result = transformFlightData(response);
      expect(result[0].price).toBe(0);
    });

    it('should handle missing outbound leg', () => {
      const response = {
        ...mockApiResponse,
        legs: [mockApiResponse.legs[1]] // Only return leg
      };

      const result = transformFlightData(response);
      expect(result[0].departure).toBe('N/A');
      expect(result[0].arrival).toBe('N/A');
      expect(result[0].duration).toBe('N/A');
    });

    it('should handle missing segments', () => {
      const response = {
        ...mockApiResponse,
        segments: []
      };

      const result = transformFlightData(response);
      expect(result[0].flightNumber).toBe('N/A');
    });

    it('should generate id when itinerary.id is missing', () => {
      const response = {
        ...mockApiResponse,
        itineraries: [{
          leg_ids: ['leg-1', 'leg-2']
        }]
      };

      const result = transformFlightData(response);
      expect(result[0].id).toBe('flight-0');
    });

    it('should handle multiple itineraries', () => {
      const response = {
        ...mockApiResponse,
        itineraries: [
          mockApiResponse.itineraries[0],
          {
            id: 'itinerary-2',
            cheapest_price: { amount: 350 },
            leg_ids: ['leg-1', 'leg-2']
          }
        ]
      };

      const result = transformFlightData(response);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('itinerary-1');
      expect(result[1].id).toBe('itinerary-2');
    });

    it('should round price correctly', () => {
      const response = {
        ...mockApiResponse,
        itineraries: [{
          id: 'itinerary-1',
          cheapest_price: { amount: 450.4 },
          leg_ids: ['leg-1', 'leg-2']
        }]
      };

      const result = transformFlightData(response);
      expect(result[0].price).toBe(450);
    });

    it('should include rawData in result', () => {
      const result = transformFlightData(mockApiResponse);
      expect(result[0].rawData).toEqual(mockApiResponse.itineraries[0]);
    });
  });

  describe('transformHotelData', () => {
    const mockApiResponse = {
      properties: [
        {
          property_token: 'hotel-1',
          name: 'Grand Hotel',
          overall_rating: 4.5,
          rate_per_night: { extracted_lowest: 199.99 },
          distance_from_center: '0.5 miles',
          amenities: ['WiFi', 'Pool', 'Gym'],
          thumbnail: 'https://example.com/image.jpg',
          address: '123 Main St',
          reviews: 150
        },
        {
          property_token: 'hotel-2',
          name: 'Budget Inn',
          overall_rating: 3.2,
          total_rate: { extracted_lowest: 89.50 },
          distance_from_center: '1.2 miles',
          amenities: ['WiFi'],
          address: '456 Oak Ave',
          reviews: 75
        }
      ]
    };

    it('should transform valid hotel API response correctly', () => {
      const result = transformHotelData(mockApiResponse);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'hotel-1',
        name: 'Grand Hotel',
        rating: 4.5,
        stars: 5, // Rounded from 4.5
        pricePerNight: 200, // Rounded
        distance: '0.5 miles',
        amenities: ['WiFi', 'Pool', 'Gym'],
        image: 'https://example.com/image.jpg',
        address: '123 Main St',
        reviews: 150
      });
    });

    it('should use total_rate when rate_per_night is missing', () => {
      const result = transformHotelData(mockApiResponse);
      expect(result[1].pricePerNight).toBe(90); // Rounded from 89.50
    });

    it('should return empty array for null response', () => {
      expect(transformHotelData(null)).toEqual([]);
    });

    it('should return empty array for undefined response', () => {
      expect(transformHotelData(undefined)).toEqual([]);
    });

    it('should return empty array when properties is missing', () => {
      expect(transformHotelData({})).toEqual([]);
    });

    it('should handle missing property_token', () => {
      const response = {
        properties: [{
          name: 'Hotel Without Token',
          overall_rating: 4.0
        }]
      };

      const result = transformHotelData(response);
      expect(result[0].id).toBe('hotel-0');
    });

    it('should handle missing name', () => {
      const response = {
        properties: [{
          property_token: 'hotel-1'
        }]
      };

      const result = transformHotelData(response);
      expect(result[0].name).toBe('Unknown Hotel');
    });

    it('should handle missing rating', () => {
      const response = {
        properties: [{
          property_token: 'hotel-1',
          name: 'Hotel'
        }]
      };

      const result = transformHotelData(response);
      expect(result[0].rating).toBe(0);
      expect(result[0].stars).toBe(0);
    });

    it('should round stars correctly', () => {
      const response = {
        properties: [
          { property_token: 'h1', name: 'Hotel 1', overall_rating: 4.4 }, // Rounds to 4
          { property_token: 'h2', name: 'Hotel 2', overall_rating: 4.5 }, // Rounds to 5
          { property_token: 'h3', name: 'Hotel 3', overall_rating: 4.6 }  // Rounds to 5
        ]
      };

      const result = transformHotelData(response);
      expect(result[0].stars).toBe(4);
      expect(result[1].stars).toBe(5);
      expect(result[2].stars).toBe(5);
    });

    it('should handle missing price', () => {
      const response = {
        properties: [{
          property_token: 'hotel-1',
          name: 'Hotel'
        }]
      };

      const result = transformHotelData(response);
      expect(result[0].pricePerNight).toBe(0);
    });

    it('should handle missing distance', () => {
      const response = {
        properties: [{
          property_token: 'hotel-1',
          name: 'Hotel'
        }]
      };

      const result = transformHotelData(response);
      expect(result[0].distance).toBe('Distance N/A');
    });

    it('should handle missing amenities', () => {
      const response = {
        properties: [{
          property_token: 'hotel-1',
          name: 'Hotel'
        }]
      };

      const result = transformHotelData(response);
      expect(result[0].amenities).toEqual([]);
    });

    it('should use emoji when thumbnail is missing', () => {
      const response = {
        properties: [{
          property_token: 'hotel-1',
          name: 'Hotel'
        }]
      };

      const result = transformHotelData(response);
      expect(result[0].image).toBe('🏨');
    });

    it('should handle missing address', () => {
      const response = {
        properties: [{
          property_token: 'hotel-1',
          name: 'Hotel'
        }]
      };

      const result = transformHotelData(response);
      expect(result[0].address).toBe('');
    });

    it('should handle missing reviews', () => {
      const response = {
        properties: [{
          property_token: 'hotel-1',
          name: 'Hotel'
        }]
      };

      const result = transformHotelData(response);
      expect(result[0].reviews).toBe(0);
    });

    it('should include rawData in result', () => {
      const result = transformHotelData(mockApiResponse);
      expect(result[0].rawData).toEqual(mockApiResponse.properties[0]);
    });

    it('should round price correctly', () => {
      const response = {
        properties: [{
          property_token: 'hotel-1',
          name: 'Hotel',
          rate_per_night: { extracted_lowest: 199.4 }
        }]
      };

      const result = transformHotelData(response);
      expect(result[0].pricePerNight).toBe(199);
    });
  });
});

