import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getDocuments } from '../../firebase/firestore';
import './ExperienceDetail.css';

const ExperienceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [experience, setExperience] = useState(location.state?.experience || null);
  const [loading, setLoading] = useState(!experience);
  const [referrer, setReferrer] = useState(null);

  // Helper function to safely format dates
  const formatDate = (dateValue, options = {}) => {
    if (!dateValue) return null;
    
    try {
      let date;
      
      // Check if it's a Firestore Timestamp
      if (dateValue.toDate && typeof dateValue.toDate === 'function') {
        date = dateValue.toDate();
      } 
      // Check if it's already a Date object
      else if (dateValue instanceof Date) {
        date = dateValue;
      }
      // Handle string format: "November 23, 2025 at 2:36:28 PM UTC-8"
      else if (typeof dateValue === 'string') {
        // Check for the custom "at" format
        if (dateValue.includes(' at ') && dateValue.includes('UTC')) {
          // Split by ' at ' to separate date and time
          const [datePart, timeWithTZ] = dateValue.split(' at ');
          
          // Remove timezone info (everything after and including 'UTC')
          let timePart = timeWithTZ.split(' UTC')[0].trim();
          
          // *** FIX: Replace Unicode Non-Breaking Space ***
          timePart = timePart.replace(/\u202f/g, ' '); 

          // Combine date and cleaned time, then parse
          const dateTimeString = `${datePart} ${timePart}`;
          date = new Date(dateTimeString);
        } else {
          // Try standard date parsing
          date = new Date(dateValue);
        }
      }
      else {
        date = new Date(dateValue);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.log('Invalid date format:', dateValue);
        return null;
      }
      
      // Use custom options or default locale string
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      console.error('Error formatting date:', error, dateValue);
      return null;
    }
  };

  useEffect(() => {
    if (location.state?.from) {
      setReferrer(location.state.from);
    } else {
      const previousPath = window.history.state?.usr?.previousPath;
      if (previousPath?.includes('/discover')) {
        setReferrer('discover');
      } else if (previousPath === '/' || !previousPath) {
        setReferrer('home');
      } else {
        setReferrer('discover');
      }
    }
  }, [location.state]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const loadExperience = useCallback(async () => {
    try {
      const allExperiences = await getDocuments('experiences');
      const fetchedExperience = allExperiences.find(exp => exp.id === id);

      if (fetchedExperience) {
        setExperience(fetchedExperience);
      } else {
        throw new Error('Experience not found');
      }
    } catch (error) {
      console.error('Error loading experience:', error);
      alert('Failed to load experience. It may have been deleted.');
      navigate('/discover');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (!experience) {
      loadExperience();
    }
  }, [experience, loadExperience]);

  const handlePlanTrip = () => {
    navigate('/search', { state: { destination: experience.destination } });
  };

  const handleBack = () => {
    if (referrer === 'home') {
      navigate('/');
    } else {
      navigate('/discover');
    }
  };

  const getBackButtonText = () => {
    if (referrer === 'home') {
      return '← Back to Home';
    }
    return '← Back to Discover';
  };

  if (loading) {
    return <div className="loading-container">Loading experience...</div>;
  }

  if (!experience) {
    return (
      <div className="error-container">
        <p>Experience not found</p>
        <button onClick={() => navigate('/discover')}>Back to Discover</button>
      </div>
    );
  }

  return (
    <div className="experience-detail-container">
      <button className="back-button" onClick={handleBack}>
        {getBackButtonText()}
      </button>

      <div className="experience-detail-header">
        <div className="experience-header-top">
          <div className="experience-title-section">
            <h1>{experience.title || experience.destination}</h1>
            <div className="experience-meta-row">
              <div className="experience-location">
                <span className="location-icon">📍</span>
                <span>{experience.destination}</span>
              </div>
              {experience.tripDate && (
                <div className="experience-date">
                  <span className="date-icon">📅</span>
                  <span>
                    {formatDate(experience.tripDate, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) || 'Date unavailable'}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="experience-rating-large">
            <span className="stars">{'⭐'.repeat(experience.rating || 0)}</span>
            <span className="rating-text">{experience.rating || 0} / 5</span>
          </div>
        </div>

        <div className="experience-author-section">
          <div className="author-avatar">
            {(experience.userName || 'A').charAt(0).toUpperCase()}
          </div>
          <div className="author-info">
            <div className="author-name">Shared by {experience.userName || 'Anonymous'}</div>
            {experience.createdAt ? (
              <div className="posted-date">
                {/* Posted {formatDate(experience.createdAt)} */}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="experience-main-content">
        <div className="experience-left-column">
          {experience.photos && experience.photos.length > 0 && experience.photos[0] && (
            <div className="experience-photos">
              <div className="main-photo">
                <img 
                  src={experience.photos[0]} 
                  alt={experience.destination}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
              {experience.photos.length > 1 && (
                <div className="photo-gallery">
                  {experience.photos.slice(1, 5).map((photo, index) => (
                    <img 
                      key={index}
                      src={photo} 
                      alt={`${experience.destination} ${index + 2}`}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ))}
                  {experience.photos.length > 5 && (
                    <div className="more-photos">
                      +{experience.photos.length - 5}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="experience-content-card">
            <h2><span className="section-icon">📖</span>About This Experience</h2>
            <p className="experience-description">{experience.description}</p>
          </div>

          {experience.highlights && experience.highlights.length > 0 && (
            <div className="experience-content-card">
              <h2><span className="section-icon">✨</span>Trip Highlights</h2>
              <div className="highlights-grid">
                {experience.highlights.map((highlight, index) => (
                  <div key={index} className="highlight-item">
                    <span className="highlight-number">{index + 1}</span>
                    <span className="highlight-text">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {experience.itinerary && experience.itinerary.length > 0 && (
            <div className="experience-content-card">
              <h2><span className="section-icon">📅</span>Daily Itinerary</h2>
              <div className="itinerary-grid">
                {experience.itinerary.map((day, index) => (
                  <div key={index} className="itinerary-day">
                    <div className="day-badge">Day {day.day}</div>
                    <div className="day-activities">{day.activities}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {experience.tips && experience.tips.length > 0 && (
            <div className="experience-content-card">
              <h2><span className="section-icon">💡</span>Traveler Tips</h2>
              <div className="tips-grid">
                {experience.tips.map((tip, index) => (
                  <div key={index} className="tip-item">
                    <span className="tip-icon">💡</span>
                    <span className="tip-text">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {experience.expenses && experience.expenses.length > 0 && (
            <div className="experience-content-card">
              <h2><span className="section-icon">💰</span>Expense Breakdown</h2>
              <div className="expenses-grid">
                {experience.expenses.map((expense, index) => (
                  <div key={index} className="expense-item">
                    <span className="expense-category">{expense.category}</span>
                    <span className="expense-amount">${expense.amount}</span>
                  </div>
                ))}
                {experience.totalExpense && (
                  <div className="expense-item total">
                    <span className="expense-category"><strong>Total</strong></span>
                    <span className="expense-amount"><strong>${experience.totalExpense}</strong></span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="experience-right-column">
          <div className="experience-cta-sidebar">
            <h3>Plan Your Trip</h3>
            <p>Ready to visit {experience.destination}? Start planning your adventure now!</p>
            <button className="cta-button" onClick={handlePlanTrip}>
              Plan Trip Here ✈️
            </button>
          </div>

          <div className="quick-info-card">
            <h4>Quick Info</h4>
            <div className="info-item">
              <span className="info-icon">📍</span>
              <span className="info-text">{experience.destination}</span>
            </div>
            <div className="info-item">
              <span className="info-icon">⭐</span>
              <span className="info-text">{experience.rating} / 5 Rating</span>
            </div>
            {experience.duration && (
              <div className="info-item">
                <span className="info-icon">⏱️</span>
                <span className="info-text">{experience.duration}</span>
              </div>
            )}
            {experience.budget && (
              <div className="info-item">
                <span className="info-icon">💰</span>
                <span className="info-text">Budget: {experience.budget}</span>
              </div>
            )}
            {experience.totalExpense && (
              <div className="info-item">
                <span className="info-icon">💵</span>
                <span className="info-text">Total: ${experience.totalExpense}</span>
              </div>
            )}
            {experience.tripDate && (
              <div className="info-item">
                <span className="info-icon">📅</span>
                <span className="info-text">
                  Visited {formatDate(experience.tripDate, { month: 'short', year: 'numeric' }) || 'Date unavailable'}
                </span>
              </div>
            )}
            {experience.highlights && (
              <div className="info-item">
                <span className="info-icon">✨</span>
                <span className="info-text">{experience.highlights.length} Highlights</span>
              </div>
            )}
            {experience.tips && (
              <div className="info-item">
                <span className="info-icon">💡</span>
                <span className="info-text">{experience.tips.length} Travel Tips</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExperienceDetail;