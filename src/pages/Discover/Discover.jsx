import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocuments } from '../../firebase/firestore';
import './Discover.css';

const Discover = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const loadExperiences = useCallback(async () => {
    try {
      const fetchedExperiences = await getDocuments('experiences');
      setExperiences(fetchedExperiences);
    } catch (error) {
      console.error('Error loading experiences:', error);
      setExperiences([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExperiences();
  }, [loadExperiences]);

  // Extract unique destinations for category filtering
  const categories = ['All', ...new Set(experiences.map(exp => {
    // Extract region/category from destination
    const dest = exp.destination.toLowerCase();
    if (dest.includes('france') || dest.includes('paris') || dest.includes('greece') || dest.includes('italy') || dest.includes('spain') || dest.includes('iceland')) return 'European';
    if (dest.includes('japan') || dest.includes('tokyo') || dest.includes('china') || dest.includes('korea')) return 'Asian';
    if (dest.includes('usa') || dest.includes('canada') || dest.includes('new york') || dest.includes('los angeles')) return 'North American';
    if (dest.includes('bali') || dest.includes('indonesia') || dest.includes('thailand') || dest.includes('vietnam') || dest.includes('singapore')) return 'Southeast Asian';
    if (dest.includes('dubai') || dest.includes('uae') || dest.includes('egypt') || dest.includes('turkey')) return 'Middle Eastern';
    if (dest.includes('australia') || dest.includes('sydney') || dest.includes('new zealand')) return 'Australian';
    return 'Other';
  }))].filter(Boolean);

  // Helper function to get category for an experience
  const getCategory = (destination) => {
    const dest = destination.toLowerCase();
    if (dest.includes('france') || dest.includes('paris') || dest.includes('greece') || dest.includes('italy') || dest.includes('spain') || dest.includes('iceland')) return 'European';
    if (dest.includes('japan') || dest.includes('tokyo') || dest.includes('china') || dest.includes('korea')) return 'Asian';
    if (dest.includes('usa') || dest.includes('canada') || dest.includes('new york') || dest.includes('los angeles')) return 'North American';
    if (dest.includes('bali') || dest.includes('indonesia') || dest.includes('thailand') || dest.includes('vietnam') || dest.includes('singapore')) return 'Southeast Asian';
    if (dest.includes('dubai') || dest.includes('uae') || dest.includes('egypt') || dest.includes('turkey')) return 'Middle Eastern';
    if (dest.includes('australia') || dest.includes('sydney') || dest.includes('new zealand')) return 'Australian';
    return 'Other';
  };

  const filteredExperiences = experiences.filter(exp => {
    const matchesSearch = exp.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         exp.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const expCategory = getCategory(exp.destination);
    const matchesCategory = selectedCategory === 'All' || expCategory === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleExploreDestination = (e, destination) => {
    e.stopPropagation(); // Prevent card click
    navigate('/search', { state: { destination } });
  };

  const handleViewExperience = (experience) => {
    navigate(`/experience/${experience.id}`, { 
      state: { 
        experience,
        from: 'discover'
      } 
    });
  };

  return (
    <div className="discover-container">
      <div className="discover-header">
        <h1>Discover Travel Experiences</h1>
        <p>Explore real travel experiences shared by our community</p>
      </div>

      <div className="discover-filters">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search destinations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category}
              className={`category-button ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-message">Loading experiences...</div>
      ) : filteredExperiences.length > 0 ? (
        <div className="destinations-grid">
          {filteredExperiences.map(experience => (
            <div 
              key={experience.id} 
              className="destination-card"
              onClick={() => handleViewExperience(experience)}
              style={{ cursor: 'pointer' }}
            >
              <div className="destination-header">
                <div className="destination-icon">
                  {experience.photos && experience.photos.length > 0 && experience.photos[0] ? (
                    <img src={experience.photos[0]} alt={experience.destination} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' }} />
                  ) : (
                    <div style={{ fontSize: '48px' }}>🌍</div>
                  )}
                </div>
                <div className="destination-rating">
                  <span className="stars">{'⭐'.repeat(experience.rating || 0)}</span>
                  <span className="rating-number">{experience.rating || 0}</span>
                </div>
              </div>

              <div className="destination-content">
                <h3>{experience.title || experience.destination}</h3>
                <p className="destination-description">
                  {experience.description.length > 150
                    ? `${experience.description.substring(0, 150)}...`
                    : experience.description}
                </p>

                <div className="destination-meta">
                  <span className="meta-tag">{getCategory(experience.destination)}</span>
                  <span className="meta-tag">📍 {experience.destination}</span>
                  {experience.duration && (
                    <span className="meta-tag">⏱️ {experience.duration}</span>
                  )}
                  {experience.budget && (
                    <span className="meta-tag">💰 {experience.budget}</span>
                  )}
                </div>

                {experience.highlights && experience.highlights.length > 0 && (
                  <div className="destination-attractions">
                    <strong>Highlights:</strong>
                    <ul>
                      {experience.highlights.slice(0, 3).map((highlight, idx) => (
                        <li key={idx}>{highlight}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {experience.tripDate && (
                  <div className="destination-timing">
                    <span className="timing-icon">📅</span>
                    <span>Visited: {new Date(experience.tripDate).toLocaleDateString()}</span>
                  </div>
                )}

                <div className="experience-author">
                  <span>👤 Shared by {experience.userName || 'Anonymous'}</span>
                </div>
              </div>

              <div className="destination-actions">
                <button
                  className="action-btn primary"
                  onClick={() => handleViewExperience(experience)}
                >
                  View Details
                </button>
                <button
                  className="action-btn secondary"
                  onClick={(e) => handleExploreDestination(e, experience.destination)}
                >
                  Plan Trip Here
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-results">
          <p>{searchQuery || selectedCategory !== 'All'
            ? 'No experiences found matching your criteria.'
            : 'No experiences shared yet. Be the first to share your travel story!'}</p>
          <button onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}>
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Discover;

