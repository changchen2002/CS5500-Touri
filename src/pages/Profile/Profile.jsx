import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { queryDocuments, deleteDocument, updateDocument } from '../../firebase/firestore';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [savedItineraries, setSavedItineraries] = useState([]);
  const [sharedExperiences, setSharedExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingExperience, setEditingExperience] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
  const [notification, setNotification] = useState(null);

  // Show notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadSavedItineraries = useCallback(async () => {
    try {
      const itineraries = await queryDocuments(
        'itineraries',
        [{ field: 'userId', operator: '==', value: currentUser.uid }]
      );
      
      const sortedItineraries = itineraries.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      });
      
      setSavedItineraries(sortedItineraries);
    } catch (error) {
      console.error('Error loading itineraries:', error);
      setSavedItineraries([]);
    }
  }, [currentUser?.uid]);

  const loadSharedExperiences = useCallback(async () => {
    try {
      const experiences = await queryDocuments(
        'experiences',
        [{ field: 'userId', operator: '==', value: currentUser.uid }]
      );
      
      const sortedExperiences = experiences.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      });
      
      setSharedExperiences(sortedExperiences);
    } catch (error) {
      console.error('Error loading experiences:', error);
      setSharedExperiences([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    if (currentUser?.uid) {
      loadSavedItineraries();
      loadSharedExperiences();
    }
  }, [currentUser?.uid, loadSavedItineraries, loadSharedExperiences]);

  const handleDeleteExperience = async (experienceId) => {
    if (!window.confirm('Are you sure you want to delete this experience? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDocument('experiences', experienceId);
      showNotification('Experience deleted successfully!', 'success');
      loadSharedExperiences();
    } catch (error) {
      console.error('Error deleting experience:', error);
      showNotification('Failed to delete experience. Please try again.', 'error');
    }
  };

  const handleDeleteItinerary = async (itineraryId) => {
    if (!window.confirm('Are you sure you want to delete this itinerary? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDocument('itineraries', itineraryId);
      showNotification('Itinerary deleted successfully!', 'success');
      loadSavedItineraries();
    } catch (error) {
      console.error('Error deleting itinerary:', error);
      showNotification('Failed to delete itinerary. Please try again.', 'error');
    }
  };

  const handleEditExperience = (experience) => {
    setEditingExperience(experience.id);
    setEditFormData({
      destination: experience.destination || '',
      tripDate: experience.tripDate || '',
      title: experience.title || '',
      description: experience.description || '',
      duration: experience.duration || '',
      budget: experience.budget || '',
      totalExpense: experience.totalExpense || '',
      highlights: experience.highlights && experience.highlights.length > 0 ? experience.highlights : [''],
      photos: experience.photos && experience.photos.length > 0 ? experience.photos : [''],
      rating: experience.rating || 5,
      tips: experience.tips && experience.tips.length > 0 ? experience.tips : [''],
      itinerary: experience.itinerary && experience.itinerary.length > 0 
        ? experience.itinerary 
        : [{ day: 1, activities: '' }],
      expenses: experience.expenses && experience.expenses.length > 0
        ? experience.expenses
        : [{ category: '', amount: '' }]
    });
  };

  const handleCancelEdit = () => {
    setEditingExperience(null);
    setEditFormData(null);
  };

  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditArrayChange = (field, index, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const handleEditItineraryChange = (index, field, value) => {
    setEditFormData(prev => ({
      ...prev,
      itinerary: prev.itinerary.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleEditExpenseChange = (index, field, value) => {
    setEditFormData(prev => ({
      ...prev,
      expenses: prev.expenses.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addEditArrayField = (field) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const addEditItineraryDay = () => {
    setEditFormData(prev => ({
      ...prev,
      itinerary: [...prev.itinerary, { day: prev.itinerary.length + 1, activities: '' }]
    }));
  };

  const addEditExpense = () => {
    setEditFormData(prev => ({
      ...prev,
      expenses: [...prev.expenses, { category: '', amount: '' }]
    }));
  };

  const removeEditArrayField = (field, index) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const removeEditItineraryDay = (index) => {
    if (editFormData.itinerary.length > 1) {
      setEditFormData(prev => ({
        ...prev,
        itinerary: prev.itinerary.filter((_, i) => i !== index)
      }));
    }
  };

  const removeEditExpense = (index) => {
    if (editFormData.expenses.length > 1) {
      setEditFormData(prev => ({
        ...prev,
        expenses: prev.expenses.filter((_, i) => i !== index)
      }));
    }
  };

  const handleUpdateExperience = async (e) => {
    e.preventDefault();

    try {
      const updatedData = {
        destination: editFormData.destination,
        tripDate: editFormData.tripDate,
        title: editFormData.title,
        description: editFormData.description,
        duration: editFormData.duration,
        budget: editFormData.budget,
        totalExpense: editFormData.totalExpense ? Number(editFormData.totalExpense) : null,
        highlights: editFormData.highlights.filter(h => h.length > 0),
        tips: editFormData.tips.filter(t => t.length > 0),
        photos: editFormData.photos.filter(p => p.length > 0),
        rating: Number(editFormData.rating),
        itinerary: editFormData.itinerary.filter(i => i.activities.length > 0),
        expenses: editFormData.expenses.filter(e => e.category && e.amount),
        updatedAt: new Date().toISOString()
      };

      await updateDocument('experiences', editingExperience, updatedData);
      showNotification('Experience updated successfully! 🎉', 'success');
      setEditingExperience(null);
      setEditFormData(null);
      loadSharedExperiences();
    } catch (error) {
      console.error('Error updating experience:', error);
      showNotification('Failed to update experience. Please try again.', 'error');
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : '👤'}
        </div>
        <div className="profile-info">
          <h1>{currentUser.displayName || 'Traveler'}</h1>
          <p>{currentUser.email}</p>
        </div>
      </div>

      <div className="profile-content">
        <section className="saved-itineraries">
          <h2>Saved Itineraries</h2>
          
          {loading ? (
            <div className="loading-message">Loading your itineraries...</div>
          ) : savedItineraries.length > 0 ? (
            <div className="itineraries-grid">
              {savedItineraries.map((itinerary) => (
                <div key={itinerary.id} className="itinerary-card">
                  <div className="card-clickable" onClick={() => navigate(`/itinerary/${itinerary.id}`)}>
                    <div className="card-header">
                      <h3>{itinerary.destination}</h3>
                      <span className="card-date">
                        {new Date(itinerary.startDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="card-content">
                      <p><strong>Flight:</strong> {itinerary.flight?.airline} - {itinerary.flight?.flightNumber}</p>
                      <p><strong>Hotel:</strong> {itinerary.hotel?.name}</p>
                      <p className="card-cost"><strong>Total Cost:</strong> ${itinerary.totalCost}</p>
                    </div>
                    <div className="card-footer">
                      <span className="saved-date">
                        Saved: {itinerary.createdAt?.toDate ? itinerary.createdAt.toDate().toLocaleDateString() : (itinerary.createdAt ? new Date(itinerary.createdAt).toLocaleDateString() : 'N/A')}
                      </span>
                    </div>
                  </div>
                  <div className="card-actions">
                    <button
                      className="view-btn"
                      onClick={() => navigate(`/itinerary/${itinerary.id}`)}
                    >
                      📄 View Details
                    </button>
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItinerary(itinerary.id);
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No saved itineraries yet</p>
              <p className="empty-subtitle">Start planning your next adventure!</p>
            </div>
          )}
        </section>

        <section className="shared-experiences">
          <div className="section-header">
            <h2>Shared Experiences</h2>
            <button 
              className="share-experience-btn"
              onClick={() => navigate('/share-experience')}
            >
              + Share Experience
            </button>
          </div>
          
          {sharedExperiences.length > 0 ? (
            <div className="experiences-grid">
              {sharedExperiences.map((experience) => (
                <div key={experience.id} className="experience-card">
                  <div className="experience-header">
                    <h3>{experience.title || experience.destination}</h3>
                    <div className="experience-rating">
                      {'⭐'.repeat(experience.rating || 0)}
                    </div>
                  </div>
                  <div className="experience-meta">
                    <span>📍 {experience.destination}</span>
                    {experience.tripDate && (
                      <span>📅 {new Date(experience.tripDate).toLocaleDateString()}</span>
                    )}
                  </div>
                  <p className="experience-description">
                    {experience.description?.substring(0, 150)}...
                  </p>
                  {experience.highlights && experience.highlights.length > 0 && (
                    <div className="experience-highlights">
                      <strong>Highlights:</strong>
                      <div className="highlights-tags">
                        {experience.highlights.slice(0, 3).map((highlight, idx) => (
                          <span key={idx} className="highlight-tag">{highlight}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {experience.tips && experience.tips.length > 0 && (
                    <div className="experience-highlights" style={{ marginTop: '0.5rem' }}>
                      <strong>Tips:</strong>
                      <div className="highlights-tags">
                        {experience.tips.slice(0, 2).map((tip, idx) => (
                          <span key={idx} className="highlight-tag">💡 {tip}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="card-actions">
                    <button
                      className="edit-btn"
                      onClick={() => handleEditExperience(experience)}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteExperience(experience.id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No shared experiences yet</p>
              <p className="empty-subtitle">Share your travel stories with the community!</p>
              <button 
                className="empty-cta-btn"
                onClick={() => navigate('/share-experience')}
              >
                Share Your First Experience
              </button>
            </div>
          )}
        </section>

        <section className="profile-stats">
          <h2>Travel Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-icon">✈️</span>
              <span className="stat-number">{savedItineraries.length}</span>
              <span className="stat-label">Trips Planned</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon">🌍</span>
              <span className="stat-number">
                {new Set(savedItineraries.map(i => i.destination)).size}
              </span>
              <span className="stat-label">Destinations</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon">💰</span>
              <span className="stat-number">
                ${savedItineraries.reduce((sum, i) => sum + (i.totalCost || 0), 0)}
              </span>
              <span className="stat-label">Total Budget</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon">📝</span>
              <span className="stat-number">{sharedExperiences.length}</span>
              <span className="stat-label">Experiences Shared</span>
            </div>
          </div>
        </section>
      </div>

      {editingExperience && editFormData && (
        <div className="edit-modal">
          <div className="edit-modal-content">
            <div className="edit-modal-header">
              <h2>Edit Experience</h2>
              <button className="close-btn" onClick={handleCancelEdit}>×</button>
            </div>

            <form onSubmit={handleUpdateExperience} className="edit-form">
              <div className="form-section">
                <h3>Trip Details</h3>

                <div className="form-row">
                  <div className="form-group">
                    <label>Destination *</label>
                    <input
                      type="text"
                      value={editFormData.destination}
                      onChange={(e) => handleEditFormChange('destination', e.target.value)}
                      placeholder="e.g., Paris, France"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Trip Date *</label>
                    <input
                      type="date"
                      value={editFormData.tripDate}
                      onChange={(e) => handleEditFormChange('tripDate', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Experience Title *</label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => handleEditFormChange('title', e.target.value)}
                    placeholder="e.g., Amazing 3-Day Trip to Paris"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Duration</label>
                    <input
                      type="text"
                      value={editFormData.duration}
                      onChange={(e) => handleEditFormChange('duration', e.target.value)}
                      placeholder="e.g., 5 days, 1 week"
                    />
                  </div>
                  <div className="form-group">
                    <label>Budget Level</label>
                    <select
                      value={editFormData.budget}
                      onChange={(e) => handleEditFormChange('budget', e.target.value)}
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
                    value={editFormData.totalExpense}
                    onChange={(e) => handleEditFormChange('totalExpense', e.target.value)}
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
                        className={`rating-star ${editFormData.rating >= rating ? 'active' : ''}`}
                        onClick={() => handleEditFormChange('rating', rating)}
                      >
                        ⭐
                      </button>
                    ))}
                    <span className="rating-text">{editFormData.rating} / 5</span>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Your Story</h3>

                <div className="form-group">
                  <label>Describe Your Experience *</label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => handleEditFormChange('description', e.target.value)}
                    placeholder="Tell us about your trip..."
                    rows="6"
                    required
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Daily Itinerary</h3>
                <p className="helper-text">Share what you did each day of your trip</p>
                
                {editFormData.itinerary.map((day, index) => (
                  <div key={index} className="itinerary-day-group">
                    <div className="day-header">
                      <h4>Day {day.day}</h4>
                      {editFormData.itinerary.length > 1 && (
                        <button
                          type="button"
                          className="remove-btn"
                          onClick={() => removeEditItineraryDay(index)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <textarea
                      value={day.activities}
                      onChange={(e) => handleEditItineraryChange(index, 'activities', e.target.value)}
                      placeholder="Describe what you did on this day..."
                      rows="3"
                      className="itinerary-textarea"
                    />
                  </div>
                ))}
                
                <button
                  type="button"
                  className="add-field-btn"
                  onClick={addEditItineraryDay}
                >
                  + Add Day
                </button>
              </div>

              <div className="form-section">
                <h3>Expense Breakdown</h3>
                <p className="helper-text">Share how you spent your budget (Optional)</p>
                
                {editFormData.expenses.map((expense, index) => (
                  <div key={index} className="expense-row">
                    <input
                      type="text"
                      value={expense.category}
                      onChange={(e) => handleEditExpenseChange(index, 'category', e.target.value)}
                      placeholder="Category (e.g., Accommodation, Food, Transport)"
                      className="expense-category"
                    />
                    <input
                      type="number"
                      value={expense.amount}
                      onChange={(e) => handleEditExpenseChange(index, 'amount', e.target.value)}
                      placeholder="Amount ($)"
                      min="0"
                      className="expense-amount"
                    />
                    {editFormData.expenses.length > 1 && (
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => removeEditExpense(index)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                
                <button
                  type="button"
                  className="add-field-btn"
                  onClick={addEditExpense}
                >
                  + Add Expense
                </button>
              </div>

              <div className="form-section">
                <h3>Trip Highlights</h3>

                {editFormData.highlights.map((highlight, index) => (
                  <div key={index} className="array-input-group">
                    <input
                      type="text"
                      value={highlight}
                      onChange={(e) => handleEditArrayChange('highlights', index, e.target.value)}
                      placeholder={`Highlight ${index + 1}`}
                      className="array-input"
                    />
                    {editFormData.highlights.length > 1 && (
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => removeEditArrayField('highlights', index)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  className="add-field-btn"
                  onClick={() => addEditArrayField('highlights')}
                >
                  + Add Highlight
                </button>
              </div>

              <div className="form-section">
                <h3>Tips for Future Travelers</h3>

                {editFormData.tips.map((tip, index) => (
                  <div key={index} className="array-input-group">
                    <input
                      type="text"
                      value={tip}
                      onChange={(e) => handleEditArrayChange('tips', index, e.target.value)}
                      placeholder={`Tip ${index + 1}`}
                      className="array-input"
                    />
                    {editFormData.tips.length > 1 && (
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => removeEditArrayField('tips', index)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  className="add-field-btn"
                  onClick={() => addEditArrayField('tips')}
                >
                  + Add Tip
                </button>
              </div>

              <div className="form-section">
                <h3>Photos (Optional)</h3>
                <p className="helper-text">Add photo URLs to showcase your trip</p>

                {editFormData.photos.map((photo, index) => (
                  <div key={index} className="array-input-group">
                    <input
                      type="url"
                      value={photo}
                      onChange={(e) => handleEditArrayChange('photos', index, e.target.value)}
                      placeholder={`Photo URL ${index + 1}`}
                      className="array-input"
                    />
                    {editFormData.photos.length > 1 && (
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => removeEditArrayField('photos', index)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  className="add-field-btn"
                  onClick={() => addEditArrayField('photos')}
                >
                  + Add Photo URL
                </button>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                >
                  Update Experience
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className={`notification-toast ${notification.type}`}>
          <div className="notification-content">
            <span className="notification-icon">
              {notification.type === 'success' ? '✅' : '❌'}
            </span>
            <span className="notification-message">{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;