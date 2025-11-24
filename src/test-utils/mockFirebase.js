// Mock Firebase functions for testing
export const mockGetDocuments = jest.fn();
export const mockAddDocument = jest.fn();
export const mockUpdateDocument = jest.fn();
export const mockDeleteDocument = jest.fn();
export const mockQueryDocuments = jest.fn();

// Mock auth functions
export const mockSignIn = jest.fn();
export const mockSignUp = jest.fn();
export const mockSignOut = jest.fn();

// Mock user data
export const mockCurrentUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User'
};

// Mock experience data
export const mockExperience = {
  id: 'exp-123',
  userId: 'test-user-123',
  destination: 'Paris, France',
  tripDate: '2024-06-15',
  title: 'Amazing Paris Trip',
  description: 'Had a wonderful time exploring the city',
  highlights: ['Eiffel Tower', 'Louvre Museum'],
  tips: ['Book tickets in advance', 'Try local cafes'],
  photos: ['https://example.com/photo1.jpg'],
  rating: 5,
  createdAt: new Date('2024-06-20')
};

// Mock itinerary data
export const mockItinerary = {
  id: 'itin-456',
  userId: 'test-user-123',
  destination: 'Tokyo, Japan',
  startDate: '2024-07-01',
  endDate: '2024-07-05',
  flight: {
    airline: 'ANA',
    flightNumber: 'NH001',
    departure: '10:00 AM',
    arrival: '2:00 PM',
    price: 1200
  },
  hotel: {
    name: 'Tokyo Grand Hotel',
    rating: 4.5,
    stars: 5,
    distance: '2km from city center',
    pricePerNight: 200
  },
  dailyPlans: [
    {
      day: 1,
      title: 'Arrival Day',
      activities: [
        {
          time: '10:00 AM',
          activity: 'Hotel Check-in',
          description: 'Check into hotel and freshen up',
          type: 'accommodation'
        }
      ]
    }
  ],
  travelTips: ['Bring comfortable shoes', 'Try local cuisine'],
  totalCost: 2000,
  createdAt: new Date('2024-06-25')
};

// Reset all mocks
export const resetAllMocks = () => {
  mockGetDocuments.mockReset();
  mockAddDocument.mockReset();
  mockUpdateDocument.mockReset();
  mockDeleteDocument.mockReset();
  mockQueryDocuments.mockReset();
  mockSignIn.mockReset();
  mockSignUp.mockReset();
  mockSignOut.mockReset();
};
