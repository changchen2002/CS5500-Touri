import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { addDocument } from '../../firebase/firestore';
import './ShareExperience.css';

const ShareExperience = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [experience, setExperience] = useState({
    destination: '',
    tripDate: '',
    title: '',
    description: '',
    duration: '',
    budget: '',
    totalExpense: '',
    highlights: [''],
    photos: [''],
    rating: 5,
    tips: [''],
    itinerary: [{ day: 1, activities: '' }],
    expenses: [{ category: '', amount: '' }]
  });

  const handleChange = (field, value) => {
    setExperience(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field, index, value) => {
    setExperience(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const handleItineraryChange = (index, field, value) => {
    setExperience(prev => ({
      ...prev,
      itinerary: prev.itinerary.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleExpenseChange = (index, field, value) => {
    setExperience(prev => ({
      ...prev,
      expenses: prev.expenses.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addArrayField = (field) => {
    setExperience(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const addItineraryDay = () => {
    setExperience(prev => ({
      ...prev,
      itinerary: [...prev.itinerary, { day: prev.itinerary.length + 1, activities: '' }]
    }));
  };

  const addExpense = () => {
    setExperience(prev => ({
      ...prev,
      expenses: [...prev.expenses, { category: '', amount: '' }]
    }));
  };

  const removeArrayField = (field, index) => {
    setExperience(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const removeItineraryDay = (index) => {
    if (experience.itinerary.length > 1) {
      setExperience(prev => ({
        ...prev,
        itinerary: prev.itinerary.filter((_, i) => i !== index)
      }));
    }
  };

  const removeExpense = (index) => {
    if (experience.expenses.length > 1) {
      setExperience(prev => ({
        ...prev,
        expenses: prev.expenses.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      alert('Please sign in to share your experience');
      navigate('/auth');
      return;
    }

    setLoading(true);
    try {
      const experienceData = {
        destination: experience.destination,
        tripDate: experience.tripDate,
        title: experience.title,
        description: experience.description,
        duration: experience.duration,
        budget: experience.budget,
        totalExpense: experience.totalExpense ? Number(experience.totalExpense) : null,
        highlights: experience.highlights.filter(h => h.length > 0),
        tips: experience.tips.filter(t => t.length > 0),
        photos: experience.photos.filter(p => p.length > 0),
        rating: Number(experience.rating),
        itinerary: experience.itinerary.filter(i => i.activities.length > 0),
        expenses: experience.expenses.filter(e => e.category && e.amount),
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous',
        userEmail: currentUser.email,
        createdAt: new Date().toISOString() // Add createdAt timestamp
      };

      await addDocument('experiences', experienceData);
      alert('Experience shared successfully! Thank you for contributing to our community.');
      navigate('/profile');
    } catch (error) {
      console.error('Error sharing experience:', error);
      alert('Failed to share experience. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="auth-required">
        <h2>Sign In Required</h2>
        <p>Please sign in to share your travel experience</p>
        <button onClick={() => navigate('/auth')}>Sign In</button>
      </div>
    );
  }

  return (
    <div className="share-experience-container">
      <div className="share-header">
        <h1>Share Your Travel Experience</h1>
        <p>Help fellow travelers by sharing your journey and insights</p>
      </div>

      <form onSubmit={handleSubmit} className="experience-form">
        <div className="form-section">
          <h2>Trip Details</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label>Destination *</label>
              <input
                type="text"
                value={experience.destination}
                onChange={(e) => handleChange('destination', e.target.value)}
                placeholder="e.g., Paris, France"
                required
              />
            </div>
            <div className="form-group">
              <label>Trip Date *</label>
              <input
                type="date"
                value={experience.tripDate}
                onChange={(e) => handleChange('tripDate', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Experience Title *</label>
            <input
              type="text"
              value={experience.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., Amazing 3-Day Trip to Paris"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Duration</label>
              <input
                type="text"
                value={experience.duration}
                onChange={(e) => handleChange('duration', e.target.value)}
                placeholder="e.g., 5 days, 1 week"
              />
            </div>
            <div className="form-group">
              <label>Budget Level</label>
              <select
                value={experience.budget}
                onChange={(e) => handleChange('budget', e.target.value)}
              >
                <option value="">Select budget</option>
                <option value="$">$ - Budget</option>
                <option value="$$">$$ - Moderate</option>
                <option value="$$$">$$$ - Expensive</option>
                <option value="$$$$">$$$$ - Luxury</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Total Expense (Optional)</label>
            <input
              type="number"
              value={experience.totalExpense}
              onChange={(e) => handleChange('totalExpense', e.target.value)}
              placeholder="Total amount spent (in USD)"
              min="0"
            />
          </div>

          <div className="form-group">
            <label>Overall Rating</label>
            <div className="rating-input">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  type="button"
                  className={`rating-star ${experience.rating >= rating ? 'active' : ''}`}
                  onClick={() => handleChange('rating', rating)}
                >
                  ⭐
                </button>
              ))}
              <span className="rating-text">{experience.rating} / 5</span>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Your Story</h2>
          
          <div className="form-group">
            <label>Describe Your Experience *</label>
            <textarea
              value={experience.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Tell us about your trip - what made it special, what you enjoyed most, any surprises..."
              rows="6"
              required
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Daily Itinerary</h2>
          <p className="helper-text">Share what you did each day of your trip</p>
          
          {experience.itinerary.map((day, index) => (
            <div key={index} className="itinerary-day-group">
              <div className="day-header">
                <h4>Day {day.day}</h4>
                {experience.itinerary.length > 1 && (
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeItineraryDay(index)}
                  >
                    ×
                  </button>
                )}
              </div>
              <textarea
                value={day.activities}
                onChange={(e) => handleItineraryChange(index, 'activities', e.target.value)}
                placeholder="Describe what you did on this day..."
                rows="3"
                className="itinerary-textarea"
              />
            </div>
          ))}
          
          <button
            type="button"
            className="add-field-btn"
            onClick={addItineraryDay}
          >
            + Add Day
          </button>
        </div>

        <div className="form-section">
          <h2>Expense Breakdown</h2>
          <p className="helper-text">Share how you spent your budget (Optional)</p>
          
          {experience.expenses.map((expense, index) => (
            <div key={index} className="expense-row">
              <input
                type="text"
                value={expense.category}
                onChange={(e) => handleExpenseChange(index, 'category', e.target.value)}
                placeholder="Category (e.g., Accommodation, Food, Transport)"
                className="expense-category"
              />
              <input
                type="number"
                value={expense.amount}
                onChange={(e) => handleExpenseChange(index, 'amount', e.target.value)}
                placeholder="Amount ($)"
                min="0"
                className="expense-amount"
              />
              {experience.expenses.length > 1 && (
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeExpense(index)}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          
          <button
            type="button"
            className="add-field-btn"
            onClick={addExpense}
          >
            + Add Expense
          </button>
        </div>

        <div className="form-section">
          <h2>Trip Highlights</h2>
          
          {experience.highlights.map((highlight, index) => (
            <div key={index} className="array-input-group">
              <input
                type="text"
                value={highlight}
                onChange={(e) => handleArrayChange('highlights', index, e.target.value)}
                placeholder={`Highlight ${index + 1}`}
                className="array-input"
              />
              {experience.highlights.length > 1 && (
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeArrayField('highlights', index)}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          
          <button
            type="button"
            className="add-field-btn"
            onClick={() => addArrayField('highlights')}
          >
            + Add Highlight
          </button>
        </div>

        <div className="form-section">
          <h2>Tips for Future Travelers</h2>
          
          {experience.tips.map((tip, index) => (
            <div key={index} className="array-input-group">
              <input
                type="text"
                value={tip}
                onChange={(e) => handleArrayChange('tips', index, e.target.value)}
                placeholder={`Tip ${index + 1}`}
                className="array-input"
              />
              {experience.tips.length > 1 && (
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeArrayField('tips', index)}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          
          <button
            type="button"
            className="add-field-btn"
            onClick={() => addArrayField('tips')}
          >
            + Add Tip
          </button>
        </div>

        <div className="form-section">
          <h2>Photos (Optional)</h2>
          <p className="helper-text">Add photo URLs to showcase your trip</p>
          
          {experience.photos.map((photo, index) => (
            <div key={index} className="array-input-group">
              <input
                type="url"
                value={photo}
                onChange={(e) => handleArrayChange('photos', index, e.target.value)}
                placeholder={`Photo URL ${index + 1}`}
                className="array-input"
              />
              {experience.photos.length > 1 && (
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeArrayField('photos', index)}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          
          <button
            type="button"
            className="add-field-btn"
            onClick={() => addArrayField('photos')}
          >
            + Add Photo URL
          </button>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate('/profile')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Sharing...' : 'Share Experience'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ShareExperience;