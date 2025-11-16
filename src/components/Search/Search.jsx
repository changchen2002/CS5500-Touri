import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Search.css';

const Search = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const [searchParams, setSearchParams] = useState({
    // Flight parameters
    origin: '',
    destination: location.state?.destination || '',
    departDate: '',
    returnDate: '',
    infants: 0,
    cabinClass: 'Economy',
    region: 'US',
    // Shared parameters
    adults: 1,
    children: 0,
    currency: 'USD',
    // Hotel parameters
    location: location.state?.destination || '',
    checkIn: '',
    checkOut: '',
    // Sorting
    flightSortBy: 'price',
    hotelSortBy: 'price'
  });

  useEffect(() => {
    if (location.state?.destination) {
      // Pre-fill destination and location if provided
      const dest = location.state.destination;
      setSearchParams(prev => ({
        ...prev,
        destination: dest,
        location: dest
      }));
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      // Store all search parameters - Results page will extract what's needed for each API
      const searchData = {
        type: 'both',
        ...searchParams
      };
      
      sessionStorage.setItem('searchData', JSON.stringify(searchData));
      
      setLoading(false);
      navigate('/results');
    }, 1000);
  };

  return (
    <div className="search-container">
      <div className="search-header">
        <h1>Search Your Travel Options</h1>
        <p>Find the perfect flights and hotels for your journey</p>
      </div>

      <div className="search-form-container">
        <form onSubmit={handleSearch} className="search-form">
          {/* Flight Parameters */}
          <div className="form-row">
            <div className="form-group">
              <label>Origin Airport Code (IATA)</label>
              <input
                type="text"
                name="origin"
                value={searchParams.origin}
                onChange={handleChange}
                placeholder="e.g., BOS"
                maxLength="3"
                required
              />
              <small>Enter 3-letter airport code (e.g., BOS, JFK, LAX)</small>
            </div>
            <div className="form-group">
              <label>Destination Airport Code (IATA)</label>
              <input
                type="text"
                name="destination"
                value={searchParams.destination}
                onChange={handleChange}
                placeholder="e.g., JFK"
                maxLength="3"
                required
              />
              <small>Enter 3-letter airport code (e.g., BOS, JFK, LAX)</small>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Departure Date</label>
              <input
                type="date"
                name="departDate"
                value={searchParams.departDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div className="form-group">
              <label>Return Date</label>
              <input
                type="date"
                name="returnDate"
                value={searchParams.returnDate}
                onChange={handleChange}
                min={searchParams.departDate || new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          {/* Hotel Parameters */}
          <div className="form-row">
            <div className="form-group full-width">
              <label>Hotel Location</label>
              <input
                type="text"
                name="location"
                value={searchParams.location}
                onChange={handleChange}
                placeholder="e.g., New York, NY or Bali"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Check-in Date</label>
              <input
                type="date"
                name="checkIn"
                value={searchParams.checkIn}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div className="form-group">
              <label>Check-out Date</label>
              <input
                type="date"
                name="checkOut"
                value={searchParams.checkOut}
                onChange={handleChange}
                min={searchParams.checkIn || new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          {/* Shared Parameters */}
          <div className="form-row">
            <div className="form-group">
              <label>Adults</label>
              <input
                type="number"
                name="adults"
                value={searchParams.adults}
                onChange={handleChange}
                min="1"
                max="10"
                required
              />
            </div>
            <div className="form-group">
              <label>Children</label>
              <input
                type="number"
                name="children"
                value={searchParams.children}
                onChange={handleChange}
                min="0"
                max="10"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Infants (Flight only)</label>
              <input
                type="number"
                name="infants"
                value={searchParams.infants}
                onChange={handleChange}
                min="0"
                max="9"
                required
              />
            </div>
            <div className="form-group">
              <label>Cabin Class (Flight only)</label>
              <select
                name="cabinClass"
                value={searchParams.cabinClass}
                onChange={handleChange}
                required
              >
                <option value="Economy">Economy</option>
                <option value="Premium_Economy">Premium Economy</option>
                <option value="Business">Business</option>
                <option value="First">First</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Currency</label>
              <input
                type="text"
                name="currency"
                value={searchParams.currency}
                onChange={handleChange}
                placeholder="USD"
                maxLength="3"
                required
              />
              <small>3-letter currency code (e.g., USD, EUR, GBP)</small>
            </div>
            <div className="form-group">
              <label>Region (ISO Code - Flight only)</label>
              <input
                type="text"
                name="region"
                value={searchParams.region}
                onChange={handleChange}
                placeholder="US"
                maxLength="2"
                required
              />
              <small>2-letter country code (e.g., US, GB, FR)</small>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Flight Sort By</label>
              <select
                name="flightSortBy"
                value={searchParams.flightSortBy}
                onChange={handleChange}
              >
                <option value="price">Price (Low to High)</option>
                <option value="duration">Duration (Shortest)</option>
                <option value="stops">Stops (Fewest)</option>
                <option value="departure">Departure Time</option>
              </select>
            </div>
            <div className="form-group">
              <label>Hotel Sort By</label>
              <select
                name="hotelSortBy"
                value={searchParams.hotelSortBy}
                onChange={handleChange}
              >
                <option value="price">Price (Low to High)</option>
                <option value="rating">Rating (High to Low)</option>
                <option value="distance">Distance from Center</option>
              </select>
            </div>
          </div>

          <button type="submit" className="search-button" disabled={loading}>
            {loading ? 'Searching...' : 'Search Flights & Hotels'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Search;