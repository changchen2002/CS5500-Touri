import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchFlightsViaFunction, fetchHotelsViaFunction } from '../../utils/functions';
import './Results.css';

const Results = () => {
  const navigate = useNavigate();
  const [searchData, setSearchData] = useState(null);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [flights, setFlights] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [apiError, setApiError] = useState(null);
  const [hotelApiError, setHotelApiError] = useState(null);

  const mockFlights = [
    {
      id: 'FL001',
      airline: 'Delta Airlines',
      flightNumber: 'DL 1234',
      departure: '08:00 AM',
      arrival: '10:30 AM',
      duration: '2h 30m',
      stops: 0,
      price: 245,
      aircraft: 'Boeing 737'
    },
    {
      id: 'FL002',
      airline: 'American Airlines',
      flightNumber: 'AA 5678',
      departure: '10:15 AM',
      arrival: '01:00 PM',
      duration: '2h 45m',
      stops: 0,
      price: 198,
      aircraft: 'Airbus A320'
    },
    {
      id: 'FL003',
      airline: 'JetBlue',
      flightNumber: 'B6 9012',
      departure: '02:30 PM',
      arrival: '05:15 PM',
      duration: '2h 45m',
      stops: 0,
      price: 215,
      aircraft: 'Airbus A321'
    },
    {
      id: 'FL004',
      airline: 'United Airlines',
      flightNumber: 'UA 3456',
      departure: '06:00 PM',
      arrival: '10:45 PM',
      duration: '4h 45m',
      stops: 1,
      price: 175,
      aircraft: 'Boeing 737'
    },
    {
      id: 'FL005',
      airline: 'Southwest',
      flightNumber: 'WN 7890',
      departure: '07:30 AM',
      arrival: '10:00 AM',
      duration: '2h 30m',
      stops: 0,
      price: 230,
      aircraft: 'Boeing 737 MAX'
    }
  ];

  const mockHotels = [
    {
      id: 'HT001',
      name: 'Grand Plaza Hotel',
      rating: 4.5,
      stars: 4,
      distance: '0.5 miles from center',
      pricePerNight: 189,
      amenities: ['Free WiFi', 'Pool', 'Gym', 'Breakfast'],
      image: '🏨'
    },
    {
      id: 'HT002',
      name: 'City Center Inn',
      rating: 4.2,
      stars: 3,
      distance: '0.8 miles from center',
      pricePerNight: 125,
      amenities: ['Free WiFi', 'Parking', 'Breakfast'],
      image: '🏨'
    },
    {
      id: 'HT003',
      name: 'Luxury Suites Downtown',
      rating: 4.8,
      stars: 5,
      distance: '0.3 miles from center',
      pricePerNight: 299,
      amenities: ['Free WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar'],
      image: '🏨'
    },
    {
      id: 'HT004',
      name: 'Budget Stay Express',
      rating: 3.9,
      stars: 2,
      distance: '2.1 miles from center',
      pricePerNight: 89,
      amenities: ['Free WiFi', 'Parking'],
      image: '🏨'
    },
    {
      id: 'HT005',
      name: 'Boutique Hotel Central',
      rating: 4.6,
      stars: 4,
      distance: '0.6 miles from center',
      pricePerNight: 210,
      amenities: ['Free WiFi', 'Gym', 'Restaurant', 'Room Service'],
      image: '🏨'
    }
  ];

  // Helper function to format time from ISO string
  const formatTime = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Helper function to format duration from minutes
  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Helper function to get airline name from carrier ID
  const getAirlineName = (carrierId, carriers) => {
    if (!carriers || !carrierId) return 'Unknown Airline';
    const carrier = carriers.find(c => c.id === carrierId || c.id === Math.abs(carrierId));
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
      const outboundLeg = legs.find(l => l.id === itinerary.leg_ids[0]);
      const returnLeg = legs.find(l => l.id === itinerary.leg_ids[1]);

      // Get segments for outbound leg
      const outboundSegments = outboundLeg 
        ? outboundLeg.segment_ids.map(segId => 
            segments.find(s => s.id === segId)
          ).filter(Boolean)
        : [];

      // Get first and last segment of outbound for display
      const firstOutboundSegment = outboundSegments[0];
      const lastOutboundSegment = outboundSegments[outboundSegments.length - 1];

      // Get marketing carrier from first segment
      const marketingCarrierId = firstOutboundSegment?.marketing_carrier_id;
      const airline = getAirlineName(marketingCarrierId, carriers);

      // Format flight number
      const flightNumber = firstOutboundSegment?.marketing_flight_number 
        ? `${airline.substring(0, 2).toUpperCase()} ${firstOutboundSegment.marketing_flight_number}`
        : 'N/A';

      return {
        id: itinerary.id || `flight-${index}`,
        airline: airline,
        flightNumber: flightNumber,
        departure: formatTime(outboundLeg?.departure),
        arrival: formatTime(lastOutboundSegment?.arrival || outboundLeg?.arrival),
        duration: formatDuration(outboundLeg?.duration),
        stops: outboundLeg?.stop_count || 0,
        price: Math.round(price),
        aircraft: 'Aircraft Info N/A', // API doesn't provide this directly
        returnDeparture: formatTime(returnLeg?.departure),
        returnArrival: formatTime(returnLeg?.arrival),
        returnDuration: formatDuration(returnLeg?.duration),
        returnStops: returnLeg?.stop_count || 0,
        rawData: itinerary // Keep raw data for deep linking if needed
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

  // Fetch hotels from SerpApi via Firebase Functions
  const fetchHotels = async (searchParams) => {
    try {
      setHotelApiError(null);
      
      // Call Firebase Function to fetch hotels
      const data = await fetchHotelsViaFunction(searchParams);
      
      // Check if API returned an error
      if (data.error) {
        throw new Error(data.error || 'API returned an error');
      }
      
      // Transform the data
      const transformedHotels = transformHotelData(data, searchParams);
      
      // Sort hotels based on user preference
      let sortedHotels = [...transformedHotels];
      if (searchParams.sortBy === 'price') {
        sortedHotels.sort((a, b) => a.pricePerNight - b.pricePerNight);
      } else if (searchParams.sortBy === 'rating') {
        sortedHotels.sort((a, b) => b.rating - a.rating);
      }

      // Limit to top 5 results
      const topHotels = sortedHotels.slice(0, 5);
      setHotels(topHotels);
    } catch (error) {
      console.error('Error fetching hotels:', error);
      setHotelApiError(error.message);
      // Fall back to mock hotels on error (limited to top 5)
      setHotels(mockHotels.slice(0, 5));
    }
  };

  // Fetch flights from FlightAPI via Firebase Functions
  const fetchFlights = async (searchParams) => {
    try {
      setApiError(null);
      
      // Call Firebase Function to fetch flights
      const data = await fetchFlightsViaFunction(searchParams);
      
      // Check if API returned an error
      if (data.error || data.message) {
        throw new Error(data.error || data.message || 'API returned an error');
      }
      
      // Transform the data
      const transformedFlights = transformFlightData(data, searchParams);
      
      // Sort flights based on user preference
      let sortedFlights = [...transformedFlights];
      if (searchParams.sortBy === 'price') {
        sortedFlights.sort((a, b) => a.price - b.price);
      } else if (searchParams.sortBy === 'duration') {
        sortedFlights.sort((a, b) => {
          const aDuration = parseInt(a.duration.replace(/[^\d]/g, '')) || 0;
          const bDuration = parseInt(b.duration.replace(/[^\d]/g, '')) || 0;
          return aDuration - bDuration;
        });
      } else if (searchParams.sortBy === 'stops') {
        sortedFlights.sort((a, b) => a.stops - b.stops);
      }

      // Limit to top 5 results
      const topFlights = sortedFlights.slice(0, 5);
      setFlights(topFlights);
    } catch (error) {
      console.error('Error fetching flights:', error);
      setApiError(error.message);
      // Fall back to mock flights on error (limited to top 5)
      setFlights(mockFlights.slice(0, 5));
    }
  };

  useEffect(() => {
    const data = sessionStorage.getItem('searchData');
    if (data) {
      const parsedData = JSON.parse(data);
      setSearchData(parsedData);
      
      // Handle both flight and hotel searches
      const promises = [];
      
      // Extract flight parameters from unified search data
      const flightParams = {
        origin: parsedData.origin,
        destination: parsedData.destination,
        departDate: parsedData.departDate,
        returnDate: parsedData.returnDate,
        adults: parsedData.adults,
        children: parsedData.children,
        infants: parsedData.infants,
        cabinClass: parsedData.cabinClass,
        currency: parsedData.currency,
        region: parsedData.region,
        sortBy: parsedData.flightSortBy || parsedData.sortBy || 'price'
      };
      
      // Extract hotel parameters from unified search data
      const hotelParams = {
        location: parsedData.location,
        checkIn: parsedData.checkIn,
        checkOut: parsedData.checkOut,
        adults: parsedData.adults,
        children: parsedData.children,
        currency: parsedData.currency,
        sortBy: parsedData.hotelSortBy || parsedData.sortBy || 'price'
      };
      
      // Fetch flights if flight parameters exist
      if (flightParams.origin && flightParams.destination && flightParams.departDate && flightParams.returnDate) {
        promises.push(fetchFlights(flightParams));
      } else {
        // Use mock flights if flight parameters are missing
        setFlights(mockFlights.slice(0, 5));
      }
      
      // Fetch hotels if hotel parameters exist
      if (hotelParams.location && hotelParams.checkIn && hotelParams.checkOut) {
        promises.push(fetchHotels(hotelParams));
      } else {
        // Use mock hotels if hotel parameters are missing
        setHotels(mockHotels.slice(0, 5));
      }
      
      // Wait for all API calls to complete
      Promise.all(promises).finally(() => {
        setLoading(false);
      });
      
      // If no promises, set loading to false immediately
      if (promises.length === 0) {
        setLoading(false);
      }
    } else {
      navigate('/search');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const handleSelectFlight = (flight) => {
    setSelectedFlight(flight);
  };

  const handleSelectHotel = (hotel) => {
    setSelectedHotel(hotel);
  };

  const handleGenerateItinerary = () => {
    if (selectedFlight && selectedHotel) {
      const selections = {
        flight: selectedFlight,
        hotel: selectedHotel,
        searchData: searchData
      };
      sessionStorage.setItem('selections', JSON.stringify(selections));
      navigate('/itinerary');
    } else {
      alert('Please select both a flight and a hotel to generate your itinerary.');
    }
  };

  if (loading) {
    return <div className="loading-container">Loading results...</div>;
  }

  return (
    <div className="results-container">
      <div className="results-header">
        <h1>Search Results</h1>
        <button 
          className="new-search-button"
          onClick={() => navigate('/search')}
        >
          New Search
        </button>
      </div>

      <div className="results-content">
        <section className="results-section results-section-left">
          <h2>Available Flights</h2>
          {apiError && (
            <div className="api-error-message" style={{ 
              padding: '10px', 
              marginBottom: '10px', 
              backgroundColor: '#fee', 
              color: '#c33',
              borderRadius: '4px'
            }}>
              ⚠️ API Error: {apiError}. Showing mock data as fallback.
            </div>
          )}
          <p className="results-subtitle">
            Showing top {flights.length} {flights.length === 1 ? 'result' : 'results'} for {searchData?.origin || 'Origin'} → {searchData?.destination || 'Destination'}
            {flights.length === 5 && ' (limited to top 5)'}
          </p>
          
          {flights.length === 0 && !loading && (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              No flights found. Please try different search parameters.
            </div>
          )}
          
          <div className="results-list">
            {flights.map(flight => (
              <div 
                key={flight.id} 
                className={`result-card ${selectedFlight?.id === flight.id ? 'selected' : ''}`}
                onClick={() => handleSelectFlight(flight)}
              >
                <div className="result-card-header">
                  <h3>{flight.airline}</h3>
                  <span className="flight-number">{flight.flightNumber}</span>
                </div>
                
                <div className="result-card-body">
                  <div className="flight-details">
                    <div className="flight-time">
                      <span className="time">{flight.departure}</span>
                      <span className="label">Departure</span>
                    </div>
                    <div className="flight-info">
                      <span className="duration">{flight.duration}</span>
                      <div className="flight-line">
                        <div className="line"></div>
                        <span className="plane-icon">✈️</span>
                      </div>
                      <span className="stops">{flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop(s)`}</span>
                    </div>
                    <div className="flight-time">
                      <span className="time">{flight.arrival}</span>
                      <span className="label">Arrival</span>
                    </div>
                  </div>
                  
                  <div className="result-footer">
                    <span className="aircraft">{flight.aircraft}</span>
                    <span className="price">${flight.price}</span>
                  </div>
                  
                  {flight.returnDeparture && (
                    <div className="return-flight-info" style={{ 
                      marginTop: '10px', 
                      paddingTop: '10px', 
                      borderTop: '1px solid #eee' 
                    }}>
                      <small style={{ color: '#666' }}>
                        Return: {flight.returnDeparture} → {flight.returnArrival} 
                        ({flight.returnDuration}, {flight.returnStops === 0 ? 'Non-stop' : `${flight.returnStops} stop(s)`})
                      </small>
                    </div>
                  )}
                </div>
                
                {selectedFlight?.id === flight.id && (
                  <div className="selected-badge">✓ Selected</div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="results-section results-section-right">
          <h2>Available Hotels</h2>
          {hotelApiError && (
            <div className="api-error-message" style={{ 
              padding: '10px', 
              marginBottom: '10px', 
              backgroundColor: '#fee', 
              color: '#c33',
              borderRadius: '4px'
            }}>
              ⚠️ Hotel API Error: {hotelApiError}. Showing mock data as fallback.
            </div>
          )}
          <p className="results-subtitle">
            Showing top {hotels.length} results in {searchData?.location || searchData?.destination || 'Location'}
          </p>
          
          {hotels.length === 0 && !loading && (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              No hotels found. Please try different search parameters.
            </div>
          )}
          
          <div className="results-list">
            {hotels.map(hotel => (
              <div 
                key={hotel.id} 
                className={`result-card ${selectedHotel?.id === hotel.id ? 'selected' : ''}`}
                onClick={() => handleSelectHotel(hotel)}
              >
                <div className="result-card-header">
                  <div>
                    <h3>{hotel.name}</h3>
                    <div className="hotel-rating">
                      <span className="stars">{'⭐'.repeat(Math.min(hotel.stars || 0, 5))}</span>
                      <span className="rating-score">{typeof hotel.rating === 'number' ? hotel.rating.toFixed(1) : hotel.rating || 'N/A'}/5</span>
                      {hotel.reviews > 0 && (
                        <span className="review-count" style={{ marginLeft: '0.5rem', color: '#666', fontSize: '0.85rem' }}>
                          ({hotel.reviews} reviews)
                        </span>
                      )}
                    </div>
                  </div>
                  {typeof hotel.image === 'string' && hotel.image.startsWith('http') ? (
                    <img src={hotel.image} alt={hotel.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                  ) : (
                    <span className="hotel-icon">{hotel.image}</span>
                  )}
                </div>
                
                <div className="result-card-body">
                  <div className="hotel-details">
                    {hotel.address && (
                      <p className="distance">📍 {hotel.address}</p>
                    )}
                    {hotel.distance && !hotel.address && (
                      <p className="distance">📍 {hotel.distance}</p>
                    )}
                    {hotel.amenities && hotel.amenities.length > 0 && (
                      <div className="amenities">
                        {hotel.amenities.slice(0, 5).map((amenity, index) => (
                          <span key={index} className="amenity-tag">{amenity}</span>
                        ))}
                        {hotel.amenities.length > 5 && (
                          <span className="amenity-tag">+{hotel.amenities.length - 5} more</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="result-footer">
                    <span className="price-label">Per night</span>
                    <span className="price">${hotel.pricePerNight}</span>
                  </div>
                </div>
                
                {selectedHotel?.id === hotel.id && (
                  <div className="selected-badge">✓ Selected</div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="generate-section">
        <div className="selection-summary">
          <div className="summary-item">
            <span className="summary-label">Selected Flight:</span>
            <span className="summary-value">
              {selectedFlight ? `${selectedFlight.airline} - $${selectedFlight.price}` : 'None'}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Selected Hotel:</span>
            <span className="summary-value">
              {selectedHotel ? `${selectedHotel.name} - $${selectedHotel.pricePerNight}/night` : 'None'}
            </span>
          </div>
        </div>
        
        <button 
          className="generate-button"
          onClick={handleGenerateItinerary}
          disabled={!selectedFlight || !selectedHotel}
        >
          Generate My Itinerary 🤖
        </button>
      </div>
    </div>
  );
};

export default Results;