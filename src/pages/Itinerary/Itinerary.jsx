import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { addDocument } from '../../firebase/firestore';
import { generateItineraryPDF } from '../../utils/pdfGenerator';
import './Itinerary.css';

const Itinerary = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const data = sessionStorage.getItem('selections');
    if (data) {
      const parsedData = JSON.parse(data);
      generateItinerary(parsedData);
    } else {
      navigate('/results');
    }
  }, [navigate]);

  // Generate mock itinerary as fallback
  const generateMockItinerary = (data) => {
    setTimeout(() => {
      const destination = data.searchData?.destination || data.searchData?.location || 'Destination';
      const startDate = data.searchData?.departDate || data.searchData?.checkIn;
      const endDate = data.searchData?.returnDate || data.searchData?.checkOut;
      const start = new Date(startDate);
      const end = new Date(endDate);
      const numDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 3;

      const mockItinerary = {
        id: `ITN-${Date.now()}`,
        destination: destination,
        startDate: startDate,
        endDate: endDate,
        flight: data.flight,
        hotel: data.hotel,
        dailyPlans: [
          {
            day: 1,
            title: 'Arrival & City Exploration',
            activities: [
              {
                time: '09:00 AM',
                activity: 'Arrival & Hotel Check-in',
                description: `Arrive at ${data.hotel?.name || 'hotel'}, check-in and freshen up`,
                type: 'accommodation'
              },
              {
                time: '11:00 AM',
                activity: 'Local Breakfast',
                description: 'Try authentic local cuisine at a nearby café',
                type: 'dining'
              },
              {
                time: '01:00 PM',
                activity: 'City Center Walking Tour',
                description: 'Explore the historic downtown area and main attractions',
                type: 'sightseeing'
              },
              {
                time: '06:00 PM',
                activity: 'Welcome Dinner',
                description: 'Dinner at a recommended local restaurant',
                type: 'dining'
              }
            ]
          },
          {
            day: 2,
            title: 'Cultural Immersion',
            activities: [
              {
                time: '08:00 AM',
                activity: 'Breakfast at Hotel',
                description: 'Enjoy breakfast included in your stay',
                type: 'dining'
              },
              {
                time: '09:30 AM',
                activity: 'Museum Visit',
                description: 'Visit the local art and history museum',
                type: 'sightseeing'
              },
              {
                time: '12:30 PM',
                activity: 'Lunch Break',
                description: 'Lunch at a popular local spot',
                type: 'dining'
              },
              {
                time: '02:00 PM',
                activity: 'Shopping District',
                description: 'Browse local markets and shops for souvenirs',
                type: 'activity'
              },
              {
                time: '07:00 PM',
                activity: 'Evening Entertainment',
                description: 'Local theater show or live music venue',
                type: 'activity'
              }
            ]
          },
          {
            day: numDays,
            title: 'Departure Day',
            activities: [
              {
                time: '08:00 AM',
                activity: 'Breakfast & Check-out',
                description: 'Final breakfast and hotel check-out',
                type: 'accommodation'
              },
              {
                time: '10:00 AM',
                activity: 'Last-minute Sightseeing',
                description: 'Visit any remaining attractions on your list',
                type: 'sightseeing'
              },
              {
                time: '12:00 PM',
                activity: 'Lunch',
                description: 'Final meal before departure',
                type: 'dining'
              },
              {
                time: '02:00 PM',
                activity: 'Airport Transfer',
                description: `Depart for airport for ${data.flight?.flightNumber || 'your'} flight`,
                type: 'transport'
              }
            ]
          }
        ],
        travelTips: [
          'Consider local weather and peak tourist seasons when planning activities',
          'Don\'t miss trying authentic local dishes and visiting popular food markets',
          'Popular attractions may require advance booking - check online',
          'Research local public transport options or consider ride-sharing apps'
        ],
        totalCost: (data.flight?.price || 0) + ((data.hotel?.pricePerNight || 0) * numDays),
        createdAt: new Date().toISOString()
      };

      setItinerary(mockItinerary);
      setLoading(false);
    }, 2000);
  };

  // Generate itinerary using Gemini API
  const generateItineraryWithGemini = async (data) => {
    try {
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
      
      if (!apiKey) {
        console.log('Gemini API key not found, using mock itinerary');
        generateMockItinerary(data);
        return;
      }

      const destination = data.searchData?.destination || data.searchData?.location || 'Destination';
      const startDate = data.searchData?.departDate || data.searchData?.checkIn;
      const endDate = data.searchData?.returnDate || data.searchData?.checkOut;
      
      // Calculate number of days
      const start = new Date(startDate);
      const end = new Date(endDate);
      const numDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 3;

      // Build prompt for Gemini
      const prompt = `Create a detailed ${numDays}-day travel itinerary for ${destination} based on the following information:

Flight Details:
- Airline: ${data.flight?.airline || 'N/A'}
- Flight Number: ${data.flight?.flightNumber || 'N/A'}
- Departure Time: ${data.flight?.departure || 'N/A'}
- Arrival Time: ${data.flight?.arrival || 'N/A'}
${data.flight?.returnDeparture ? `- Return Flight: Departure ${data.flight.returnDeparture}, Arrival ${data.flight.returnArrival}` : ''}

Hotel Details:
- Name: ${data.hotel?.name || 'N/A'}
- Location: ${data.hotel?.address || data.hotel?.distance || 'N/A'}
- Rating: ${data.hotel?.rating || 'N/A'}/5

Travel Dates: ${startDate} to ${endDate} (${numDays} days)

Please create a detailed daily itinerary with:
1. Day-by-day plans with creative, descriptive titles
2. Specific activities with times (format: "HH:MM AM/PM")
3. Detailed activity descriptions
4. Activity types: accommodation, dining, sightseeing, activity, or transport
5. Include arrival day activities, main exploration days, and departure day
6. Make activities realistic and culturally relevant to ${destination}

Return the response as a valid JSON object with this exact structure:
{
  "dailyPlans": [
    {
      "day": 1,
      "title": "Creative day title",
      "activities": [
        {
          "time": "09:00 AM",
          "activity": "Activity name",
          "description": "Detailed description of the activity",
          "type": "accommodation"
        }
      ]
    }
  ],
  "travelTips": [
    "Practical tip 1",
    "Practical tip 2",
    "Practical tip 3",
    "Practical tip 4"
  ]
}

Make it realistic, culturally relevant, and include popular attractions and local experiences for ${destination}. Only return valid JSON, no markdown or additional text.`;

      // Call Gemini API
      // Try different model names in case one is unavailable
      const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-pro', 'gemini-1.0-pro'];
      let response;
      let lastError;
      
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
          
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

      if (!response) {
        throw new Error(`Failed to connect to Gemini API: ${lastError?.message || 'All models unavailable. Please check your API key and available models.'}`);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        console.error('Gemini API error details:', errorData);
        throw new Error(`Gemini API error: ${errorMessage}`);
      }

      const result = await response.json();
      
      // Extract text from Gemini response
      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Try to parse JSON from the response
      let itineraryData;
      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                         responseText.match(/```\s*([\s\S]*?)\s*```/) ||
                         [null, responseText];
        const jsonText = jsonMatch[1] || responseText;
        itineraryData = JSON.parse(jsonText.trim());
      } catch (parseError) {
        console.error('Failed to parse Gemini response as JSON, using mock data:', parseError);
        generateMockItinerary(data);
        return;
      }

      // Build the itinerary object
      const generatedItinerary = {
        id: `ITN-${Date.now()}`,
        destination: destination,
        startDate: startDate,
        endDate: endDate,
        flight: data.flight,
        hotel: data.hotel,
        dailyPlans: itineraryData.dailyPlans || [],
        travelTips: itineraryData.travelTips || [],
        totalCost: (data.flight?.price || 0) + ((data.hotel?.pricePerNight || 0) * numDays),
        createdAt: new Date().toISOString()
      };

      setItinerary(generatedItinerary);
      setLoading(false);
    } catch (error) {
      console.error('Error generating itinerary with Gemini:', error);
      // Fall back to mock itinerary on error
      generateMockItinerary(data);
    }
  };

  const generateItinerary = (data) => {
    generateItineraryWithGemini(data);
  };

  const handleSaveItinerary = async () => {
    if (!currentUser) {
      alert('Please sign in to save your itinerary');
      navigate('/auth');
      return;
    }

    setSaving(true);
    try {
      await addDocument('itineraries', {
        ...itinerary,
        userId: currentUser.uid,
        userEmail: currentUser.email
      });
      alert('Itinerary saved successfully!');
    } catch (error) {
      console.error('Error saving itinerary:', error);
      alert('Failed to save itinerary. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!itinerary) {
      alert('No itinerary data available to download.');
      return;
    }

    try {
      const filename = `${itinerary.destination.replace(/\s+/g, '-')}-Itinerary-${Date.now()}.pdf`;
      await generateItineraryPDF(itinerary, filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      accommodation: '🏨',
      dining: '🍽️',
      sightseeing: '🏛️',
      activity: '🎭',
      transport: '🚗'
    };
    return icons[type] || '📍';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Generating your personalized itinerary...</p>
      </div>
    );
  }

  return (
    <div className="itinerary-container">
      <div className="itinerary-header">
        <div className="header-content">
          <h1>Your Travel Itinerary</h1>
          <p className="destination">{itinerary.destination}</p>
          <p className="dates">
            {new Date(itinerary.startDate).toLocaleDateString()} - {new Date(itinerary.endDate).toLocaleDateString()}
          </p>
        </div>
        
        <div className="header-actions">
          <button className="action-button save" onClick={handleSaveItinerary} disabled={saving}>
            {saving ? 'Saving...' : '💾 Save Itinerary'}
          </button>
          <button className="action-button download" onClick={handleDownloadPDF}>
            📄 Download PDF
          </button>
        </div>
      </div>

      <div className="travel-summary">
        <div className="summary-card">
          <h3>Flight Details</h3>
          <div className="summary-details">
            <p><strong>{itinerary.flight.airline}</strong></p>
            <p>Flight: {itinerary.flight.flightNumber}</p>
            <p>Departure: {itinerary.flight.departure}</p>
            <p>Arrival: {itinerary.flight.arrival}</p>
            <p className="price">${itinerary.flight.price}</p>
          </div>
        </div>

        <div className="summary-card">
          <h3>Accommodation</h3>
          <div className="summary-details">
            <p><strong>{itinerary.hotel.name}</strong></p>
            <p>Rating: {'⭐'.repeat(itinerary.hotel.stars)} ({itinerary.hotel.rating}/5)</p>
            <p>{itinerary.hotel.distance}</p>
            <p className="price">${itinerary.hotel.pricePerNight} per night</p>
          </div>
        </div>

        <div className="summary-card total">
          <h3>Total Estimated Cost</h3>
          <p className="total-price">${itinerary.totalCost}</p>
          <p className="price-note">*Approximate cost for flights and accommodation</p>
        </div>
      </div>

      <div className="daily-itinerary">
        <h2>Daily Schedule</h2>
        
        {itinerary.dailyPlans.map((day) => (
          <div key={day.day} className="day-section">
            <div className="day-header">
              <h3>Day {day.day}</h3>
              <p className="day-title">{day.title}</p>
            </div>
            
            <div className="activities-timeline">
              {day.activities.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-time">
                    <span className="time-dot"></span>
                    <span className="time-text">{activity.time}</span>
                  </div>
                  
                  <div className="activity-content">
                    <div className="activity-header">
                      <span className="activity-icon">{getActivityIcon(activity.type)}</span>
                      <h4>{activity.activity}</h4>
                    </div>
                    <p>{activity.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="recommendations">
        <h2>Travel Tips</h2>
        <div className="tips-grid">
          {itinerary.travelTips && itinerary.travelTips.length > 0 ? (
            itinerary.travelTips.map((tip, index) => {
              const tipIcons = ['💡', '🍴', '🎫', '🚌', '🌍', '📸', '💰', '🛡️'];
              const tipTitles = ['Best Time to Visit', 'Local Cuisine', 'Book in Advance', 'Transportation', 'Cultural Etiquette', 'Photography Tips', 'Budget Planning', 'Safety Tips'];
              return (
                <div key={index} className="tip-card">
                  <span className="tip-icon">{tipIcons[index % tipIcons.length]}</span>
                  <h4>{tipTitles[index % tipTitles.length]}</h4>
                  <p>{tip}</p>
                </div>
              );
            })
          ) : (
            <>
              <div className="tip-card">
                <span className="tip-icon">💡</span>
                <h4>Best Time to Visit</h4>
                <p>Consider local weather and peak tourist seasons when planning activities</p>
              </div>
              <div className="tip-card">
                <span className="tip-icon">🍴</span>
                <h4>Local Cuisine</h4>
                <p>Don't miss trying authentic local dishes and visiting popular food markets</p>
              </div>
              <div className="tip-card">
                <span className="tip-icon">🎫</span>
                <h4>Book in Advance</h4>
                <p>Popular attractions may require advance booking - check online</p>
              </div>
              <div className="tip-card">
                <span className="tip-icon">🚌</span>
                <h4>Transportation</h4>
                <p>Research local public transport options or consider ride-sharing apps</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="itinerary-footer">
        <button className="secondary-button" onClick={() => navigate('/search')}>
          Plan Another Trip
        </button>
      </div>
    </div>
  );
};

export default Itinerary;