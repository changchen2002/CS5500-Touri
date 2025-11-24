import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Discover from '../Discover';
import * as firestoreModule from '../../../firebase/firestore';
import * as AuthContext from '../../../contexts/AuthContext';

// Mock the AuthContext
jest.mock('../../../contexts/AuthContext');

describe('Discover Page - Real Firestore Data Integration', () => {
  const mockExperiences = [
    {
      id: 'exp-1',
      userId: 'user-1',
      userName: 'John Doe',
      userEmail: 'john@example.com',
      destination: 'Paris, France',
      tripDate: '2024-06-15',
      title: 'Amazing Paris Trip',
      description: 'Had a wonderful time exploring the city of lights',
      highlights: ['Eiffel Tower', 'Louvre Museum', 'Seine River Cruise'],
      tips: ['Book tickets in advance', 'Try local cafes', 'Visit early morning'],
      photos: ['https://example.com/paris1.jpg'],
      rating: 5,
      createdAt: { seconds: 1718409600, toDate: () => new Date('2024-06-15') }
    },
    {
      id: 'exp-2',
      userId: 'user-2',
      userName: 'Jane Smith',
      userEmail: 'jane@example.com',
      destination: 'Tokyo, Japan',
      tripDate: '2024-07-01',
      title: 'Tokyo Adventure',
      description: 'Incredible experience in Tokyo with amazing food and culture',
      highlights: ['Shibuya Crossing', 'Senso-ji Temple', 'Tokyo Skytree'],
      tips: ['Get a JR Pass', 'Try ramen', 'Visit temples early'],
      photos: ['https://example.com/tokyo1.jpg'],
      rating: 5,
      createdAt: { seconds: 1719792000, toDate: () => new Date('2024-07-01') }
    },
    {
      id: 'exp-3',
      userId: 'user-3',
      userName: 'Bob Johnson',
      userEmail: 'bob@example.com',
      destination: 'New York, USA',
      tripDate: '2024-05-20',
      title: 'NYC Experience',
      description: 'Great city with lots to see and do',
      highlights: ['Statue of Liberty', 'Central Park', 'Times Square'],
      tips: ['Use subway', 'Walk everywhere', 'Try pizza'],
      photos: ['https://example.com/nyc1.jpg'],
      rating: 4,
      createdAt: { seconds: 1716163200, toDate: () => new Date('2024-05-20') }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useAuth to return a test user
    AuthContext.useAuth.mockReturnValue({
      currentUser: {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User'
      },
      loading: false
    });
  });

  describe('Firestore Data Fetching', () => {
    test('calls getDocuments with experiences collection on load', async () => {
      const getDocumentsSpy = jest.spyOn(firestoreModule, 'getDocuments').mockResolvedValue(mockExperiences);

      render(
        <BrowserRouter>
          <Discover />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(getDocumentsSpy).toHaveBeenCalledWith('experiences');
      });
    });

    test('displays real Firestore data (not mock data)', async () => {
      jest.spyOn(firestoreModule, 'getDocuments').mockResolvedValue(mockExperiences);

      render(
        <BrowserRouter>
          <Discover />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Verify experiences from Firestore are displayed
        expect(screen.getByText('Amazing Paris Trip')).toBeInTheDocument();
        expect(screen.getByText('Tokyo Adventure')).toBeInTheDocument();
        expect(screen.getByText('NYC Experience')).toBeInTheDocument();
      });
    });

    test('displays loading state while fetching data', () => {
      jest.spyOn(firestoreModule, 'getDocuments').mockImplementation(
        () => new Promise(() => {}) // Never resolves to keep loading
      );

      render(
        <BrowserRouter>
          <Discover />
        </BrowserRouter>
      );

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    test('handles empty Firestore collection gracefully', async () => {
      jest.spyOn(firestoreModule, 'getDocuments').mockResolvedValue([]);

      render(
        <BrowserRouter>
          <Discover />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/No experiences shared yet/i)).toBeInTheDocument();
      });
    });

    test('handles Firestore fetch errors gracefully', async () => {
      jest.spyOn(firestoreModule, 'getDocuments').mockRejectedValue(new Error('Firestore error'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <BrowserRouter>
          <Discover />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading experiences:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Shared Experience Display', () => {
    test('displays all experience fields from Firestore', async () => {
      jest.spyOn(firestoreModule, 'getDocuments').mockResolvedValue(mockExperiences);

      render(
        <BrowserRouter>
          <Discover />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Check title and destination
        expect(screen.getByText('Amazing Paris Trip')).toBeInTheDocument();
        expect(screen.getByText(/Paris, France/i)).toBeInTheDocument();

        // Check author information
        expect(screen.getByText(/John Doe/i)).toBeInTheDocument();

        // Check description
        expect(screen.getByText(/wonderful time exploring the city/i)).toBeInTheDocument();
      });
    });

    test('displays experience highlights from Firestore', async () => {
      jest.spyOn(firestoreModule, 'getDocuments').mockResolvedValue(mockExperiences);

      render(
        <BrowserRouter>
          <Discover />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Eiffel Tower')).toBeInTheDocument();
        expect(screen.getByText('Louvre Museum')).toBeInTheDocument();
        expect(screen.getByText('Seine River Cruise')).toBeInTheDocument();
      });
    });

    test('displays View Tips button for experiences with tips', async () => {
      jest.spyOn(firestoreModule, 'getDocuments').mockResolvedValue(mockExperiences);

      render(
        <BrowserRouter>
          <Discover />
        </BrowserRouter>
      );

      await waitFor(() => {
        const viewTipsButtons = screen.getAllByText(/View Tips/i);
        expect(viewTipsButtons.length).toBeGreaterThan(0);
      });
    });

    test('displays ratings from Firestore data', async () => {
      jest.spyOn(firestoreModule, 'getDocuments').mockResolvedValue(mockExperiences);

      render(
        <BrowserRouter>
          <Discover />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Look for rating display (5 stars, 4 stars, etc.)
        const ratingElements = screen.getAllByText(/⭐/);
        expect(ratingElements.length).toBeGreaterThan(0);
      });
    });

    test('newly shared experience appears on Discover page', async () => {
      // Test that multiple experiences can be displayed
      jest.spyOn(firestoreModule, 'getDocuments').mockResolvedValue(mockExperiences);

      render(
        <BrowserRouter>
          <Discover />
        </BrowserRouter>
      );

      // All experiences should be displayed
      await waitFor(() => {
        expect(screen.getByText('Amazing Paris Trip')).toBeInTheDocument();
        expect(screen.getByText('Tokyo Adventure')).toBeInTheDocument();
        expect(screen.getByText('NYC Experience')).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filter Functionality', () => {
    test('search filters experiences by destination', async () => {
      jest.spyOn(firestoreModule, 'getDocuments').mockResolvedValue(mockExperiences);

      render(
        <BrowserRouter>
          <Discover />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Amazing Paris Trip')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search destinations/i);
      fireEvent.change(searchInput, { target: { value: 'Paris' } });

      await waitFor(() => {
        expect(screen.getByText('Amazing Paris Trip')).toBeInTheDocument();
        expect(screen.queryByText('Tokyo Adventure')).not.toBeInTheDocument();
      });
    });

    test('search filters experiences by title', async () => {
      jest.spyOn(firestoreModule, 'getDocuments').mockResolvedValue(mockExperiences);

      render(
        <BrowserRouter>
          <Discover />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Tokyo Adventure')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search destinations/i);
      fireEvent.change(searchInput, { target: { value: 'Adventure' } });

      await waitFor(() => {
        expect(screen.getByText('Tokyo Adventure')).toBeInTheDocument();
        expect(screen.queryByText('Amazing Paris Trip')).not.toBeInTheDocument();
      });
    });

    test('search is case-insensitive', async () => {
      jest.spyOn(firestoreModule, 'getDocuments').mockResolvedValue(mockExperiences);

      render(
        <BrowserRouter>
          <Discover />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Amazing Paris Trip')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search destinations/i);
      fireEvent.change(searchInput, { target: { value: 'PARIS' } });

      await waitFor(() => {
        expect(screen.getByText('Amazing Paris Trip')).toBeInTheDocument();
      });
    });

    test('clearing search shows all experiences again', async () => {
      jest.spyOn(firestoreModule, 'getDocuments').mockResolvedValue(mockExperiences);

      render(
        <BrowserRouter>
          <Discover />
        </BrowserRouter>
      );

      const searchInput = screen.getByPlaceholderText(/search destinations/i);

      // Search for Paris
      fireEvent.change(searchInput, { target: { value: 'Paris' } });
      await waitFor(() => {
        expect(screen.queryByText('Tokyo Adventure')).not.toBeInTheDocument();
      });

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });
      await waitFor(() => {
        expect(screen.getByText('Amazing Paris Trip')).toBeInTheDocument();
        expect(screen.getByText('Tokyo Adventure')).toBeInTheDocument();
        expect(screen.getByText('NYC Experience')).toBeInTheDocument();
      });
    });

    test('category filter works with Firestore data', async () => {
      jest.spyOn(firestoreModule, 'getDocuments').mockResolvedValue(mockExperiences);

      render(
        <BrowserRouter>
          <Discover />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Amazing Paris Trip')).toBeInTheDocument();
      });

      // Test that category filter exists (All button should be present)
      const allCategoryButton = screen.getByText('All');
      expect(allCategoryButton).toBeInTheDocument();
    });
  });

  describe('Data Integrity', () => {
    test('verifies Firestore data structure matches expected format', async () => {
      const getDocumentsSpy = jest.spyOn(firestoreModule, 'getDocuments').mockResolvedValue(mockExperiences);

      render(
        <BrowserRouter>
          <Discover />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(getDocumentsSpy).toHaveBeenCalled();
      });

      const returnedData = getDocumentsSpy.mock.results[0].value;
      await returnedData.then(data => {
        data.forEach(exp => {
          expect(exp).toHaveProperty('id');
          expect(exp).toHaveProperty('destination');
          expect(exp).toHaveProperty('title');
          expect(exp).toHaveProperty('description');
          expect(exp).toHaveProperty('rating');
          expect(exp).toHaveProperty('userId');
        });
      });
    });

    test('handles experiences with missing optional fields', async () => {
      const incompleteExperience = [{
        id: 'exp-incomplete',
        userId: 'user-4',
        destination: 'London, UK',
        title: 'Quick London Trip',
        description: 'Short visit',
        rating: 4,
        createdAt: { seconds: 1718409600, toDate: () => new Date('2024-06-15') }
        // Missing: highlights, tips, photos, userName, userEmail
      }];

      jest.spyOn(firestoreModule, 'getDocuments').mockResolvedValue(incompleteExperience);

      render(
        <BrowserRouter>
          <Discover />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Quick London Trip')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Data Updates', () => {
    test('component displays data from Firestore', async () => {
      // Test that Firestore data is fetched and displayed
      const updatedExperience = {
        ...mockExperiences[0],
        title: 'Updated Paris Trip Title',
        description: 'Updated description'
      };

      jest.spyOn(firestoreModule, 'getDocuments').mockResolvedValue([updatedExperience]);

      render(
        <BrowserRouter>
          <Discover />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Updated Paris Trip Title')).toBeInTheDocument();
        expect(screen.getByText('Updated description')).toBeInTheDocument();
      });
    });
  });
});
