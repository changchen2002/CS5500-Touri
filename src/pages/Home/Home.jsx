import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocuments } from '../../firebase/firestore';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [popularExperiences, setPopularExperiences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPopularExperiences = async () => {
      try {
        const experiences = await getDocuments('experiences');
        
        // Sort by rating and likes, then take top 3
        const sortedExperiences = experiences
          .sort((a, b) => {
            // Primary sort by rating
            if (b.rating !== a.rating) {
              return (b.rating || 0) - (a.rating || 0);
            }
            // Secondary sort by createdAt (newest first)
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
            return dateB - dateA;
          })
          .slice(0, 3);
        
        setPopularExperiences(sortedExperiences);
      } catch (error) {
        console.error('Error loading experiences:', error);
        setPopularExperiences([]);
      } finally {
        setLoading(false);
      }
    };

    loadPopularExperiences();
  }, []);

  const handleExperienceClick = (experience) => {
    // Navigate to experience detail page, passing the experience data and referrer
    navigate(`/experience/${experience.id}`, { 
      state: { 
        experience,
        from: 'home'
      } 
    });
  };

  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Plan Your Perfect Journey</h1>
          <p className="hero-subtitle">
            Discover destinations, explore community-created travel experiences, and generate personalized itineraries using AI
          </p>
          <div className="hero-buttons">
            <button 
              className="hero-button"
              onClick={() => navigate('/search')}
            >
              Start Planning
            </button>
            <button 
              className="hero-button secondary"
              onClick={() => navigate('/discover')}
            >
              Discover Destinations
            </button>
          </div>
        </div>
        <div className="hero-image">
          <div className="image-placeholder">🌍</div>
        </div>
      </section>

      <section className="popular-guides-section">
        <div className="section-header">
          <h2 className="section-title">Popular Travel Experiences</h2>
          <button className="view-all-btn" onClick={() => navigate('/discover')}>
            Discover More →
          </button>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            Loading experiences...
          </div>
        ) : popularExperiences.length > 0 ? (
          <div className="guides-preview-grid">
            {popularExperiences.map(experience => (
              <div
                key={experience.id}
                className="guide-preview-card"
                onClick={() => handleExperienceClick(experience)}
                style={{ cursor: 'pointer' }}
              >
                <div className="guide-preview-header">
                  <h3>{experience.title || experience.destination}</h3>
                  <div className="guide-preview-rating">
                    <span className="stars">{'⭐'.repeat(experience.rating || 0)}</span>
                    <span>{experience.rating || 0}</span>
                  </div>
                </div>
                <div className="guide-preview-location">
                  <span>📍</span>
                  <span>{experience.destination}</span>
                </div>
                <div className="guide-preview-footer">
                  <span>By {experience.userName || 'Anonymous'}</span>
                  <span>
                    {experience.tripDate && (
                      <>📅 {new Date(experience.tripDate).toLocaleDateString()}</>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem', 
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
          }}>
            <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '1rem' }}>
              No experiences shared yet
            </p>
            <p style={{ color: '#999' }}>
              Be the first to share your travel story!
            </p>
            <button 
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
              onClick={() => navigate('/share-experience')}
            >
              Share Your Experience
            </button>
          </div>
        )}
      </section>

      <section className="features-section">
        <h2 className="features-title">How It Works</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🌍</div>
            <h3>Discover Destinations</h3>
            <p>Browse popular destinations, explore travel experiences, and get inspired for your next adventure.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Search & Compare</h3>
            <p>Search for flights and hotels with custom filters. Compare top results sorted by your preferences.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI-Powered Planning</h3>
            <p>Get a personalized daily itinerary with activities, dining, and sightseeing suggestions.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3>Share Experiences</h3>
            <p>Share your travel experiences after your trip to help other travelers plan their journeys.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Community Insights</h3>
            <p>Learn from real travelers' experiences, tips, and recommendations from destinations worldwide.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📄</div>
            <h3>Download & Go</h3>
            <p>Export your complete travel plan as a PDF for offline access during your trip.</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to explore?</h2>
        <p>Start planning your next adventure today</p>
        <div className="cta-buttons">
          <button 
            className="cta-button"
            onClick={() => navigate('/search')}
          >
            Plan a Trip
          </button>
          <button 
            className="cta-button secondary"
            onClick={() => navigate('/discover')}
          >
            Discover Experiences
          </button>
        </div>
      </section>
    </div>
  );
};

export default Home;