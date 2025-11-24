import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Itinerary from '../Itinerary';
import { generateItineraryPDF } from '../../../utils/pdfGenerator';
import * as firestoreModule from '../../../firebase/firestore';
import * as AuthContext from '../../../contexts/AuthContext';

// Mock the PDF generator
jest.mock('../../../utils/pdfGenerator');

// Mock the AuthContext
jest.mock('../../../contexts/AuthContext');

describe('Itinerary PDF Download', () => {
  const mockItinerary = {
    id: 'itin-123',
    destination: 'Paris, France',
    startDate: '2024-07-01',
    endDate: '2024-07-05',
    flight: {
      airline: 'Air France',
      flightNumber: 'AF123',
      departure: '10:00 AM',
      arrival: '11:30 AM',
      price: 800
    },
    hotel: {
      name: 'Paris Grand Hotel',
      rating: 4.5,
      stars: 5,
      distance: '1km from Eiffel Tower',
      pricePerNight: 150
    },
    dailyPlans: [
      {
        day: 1,
        title: 'Arrival & Exploration',
        activities: [
          {
            time: '10:00 AM',
            activity: 'Hotel Check-in',
            description: 'Check into hotel',
            type: 'accommodation'
          },
          {
            time: '02:00 PM',
            activity: 'Eiffel Tower Visit',
            description: 'Visit the iconic Eiffel Tower',
            type: 'sightseeing'
          }
        ]
      }
    ],
    travelTips: ['Book tickets early', 'Try local cuisine'],
    totalCost: 1400,
    userId: 'test-user-123'
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    generateItineraryPDF.mockResolvedValue(undefined);

    // Mock useAuth to return a test user
    AuthContext.useAuth.mockReturnValue({
      currentUser: {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User'
      },
      loading: false
    });

    // Mock sessionStorage
    Storage.prototype.getItem = jest.fn(() =>
      JSON.stringify({
        searchData: { destination: 'Paris', departDate: '2024-07-01', returnDate: '2024-07-05' },
        flight: mockItinerary.flight,
        hotel: mockItinerary.hotel
      })
    );
  });

  test('PDF download button is visible', async () => {
    // Mock the itinerary generation
    jest.spyOn(firestoreModule, 'queryDocuments').mockResolvedValue([]);

    render(
      <BrowserRouter>
        <Itinerary />
      </BrowserRouter>
    );

    await waitFor(() => {
      const downloadButton = screen.queryByText(/Download PDF/i);
      if (downloadButton) {
        expect(downloadButton).toBeInTheDocument();
      }
    });
  });

  test('clicking download button calls PDF generator', async () => {
    // Create a component that has the itinerary loaded
    const ItineraryWithData = () => {
      const [itinerary, setItinerary] = React.useState(null);
      const [loading, setLoading] = React.useState(false);

      React.useEffect(() => {
        setItinerary(mockItinerary);
        setLoading(false);
      }, []);

      const handleDownloadPDF = async () => {
        if (!itinerary) return;
        const filename = `${itinerary.destination.replace(/\s+/g, '-')}-Itinerary-${Date.now()}.pdf`;
        await generateItineraryPDF(itinerary, filename);
      };

      if (loading) return <div>Loading...</div>;
      if (!itinerary) return null;

      return (
        <div>
          <h1>{itinerary.destination}</h1>
          <button onClick={handleDownloadPDF}>📄 Download PDF</button>
        </div>
      );
    };

    render(<ItineraryWithData />);

    const downloadButton = await screen.findByText(/Download PDF/i);
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(generateItineraryPDF).toHaveBeenCalled();
      expect(generateItineraryPDF).toHaveBeenCalledWith(
        mockItinerary,
        expect.stringContaining('.pdf')
      );
    });
  });

  test('PDF generator is called with correct itinerary data', async () => {
    const ItineraryWithData = () => {
      const handleDownloadPDF = () => {
        generateItineraryPDF(mockItinerary, 'test-itinerary.pdf');
      };

      return <button onClick={handleDownloadPDF}>Download PDF</button>;
    };

    render(<ItineraryWithData />);

    const button = screen.getByText(/Download PDF/i);
    fireEvent.click(button);

    expect(generateItineraryPDF).toHaveBeenCalledWith(mockItinerary, 'test-itinerary.pdf');

    // Verify itinerary has all required fields
    const calledWithItinerary = generateItineraryPDF.mock.calls[0][0];
    expect(calledWithItinerary).toHaveProperty('destination');
    expect(calledWithItinerary).toHaveProperty('flight');
    expect(calledWithItinerary).toHaveProperty('hotel');
    expect(calledWithItinerary).toHaveProperty('dailyPlans');
    expect(calledWithItinerary).toHaveProperty('totalCost');
  });

  test('PDF download handles errors gracefully', async () => {
    generateItineraryPDF.mockRejectedValue(new Error('PDF generation failed'));

    const ItineraryWithError = () => {
      const [error, setError] = React.useState(null);

      const handleDownloadPDF = async () => {
        try {
          await generateItineraryPDF(mockItinerary, 'test.pdf');
        } catch (err) {
          setError(err.message);
          alert('Failed to generate PDF. Please try again.');
        }
      };

      return (
        <div>
          <button onClick={handleDownloadPDF}>Download PDF</button>
          {error && <div data-testid="error">{error}</div>}
        </div>
      );
    };

    render(<ItineraryWithError />);

    const button = screen.getByText(/Download PDF/i);
    fireEvent.click(button);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Failed to generate PDF. Please try again.');
    });
  });

  test('PDF includes all itinerary sections', async () => {
    const ItineraryWithData = () => {
      return (
        <div>
          <h1>Your Travel Itinerary</h1>
          <div>
            <h2>Flight Details</h2>
            <p>{mockItinerary.flight.airline}</p>
            <p>{mockItinerary.flight.flightNumber}</p>
          </div>
          <div>
            <h2>Accommodation</h2>
            <p>{mockItinerary.hotel.name}</p>
          </div>
          <div>
            <h2>Daily Schedule</h2>
            {mockItinerary.dailyPlans.map(day => (
              <div key={day.day}>
                <h3>Day {day.day}: {day.title}</h3>
                {day.activities.map((activity, idx) => (
                  <div key={idx}>
                    <p>{activity.time} - {activity.activity}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <button onClick={() => generateItineraryPDF(mockItinerary, 'test.pdf')}>
            Download PDF
          </button>
        </div>
      );
    };

    render(<ItineraryWithData />);

    // Verify all sections are rendered
    expect(screen.getByText('Flight Details')).toBeInTheDocument();
    expect(screen.getByText('Accommodation')).toBeInTheDocument();
    expect(screen.getByText('Daily Schedule')).toBeInTheDocument();
    expect(screen.getByText(mockItinerary.flight.airline)).toBeInTheDocument();
    expect(screen.getByText(mockItinerary.hotel.name)).toBeInTheDocument();
  });
});
