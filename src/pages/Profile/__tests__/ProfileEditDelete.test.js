import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Profile from '../Profile';
import * as firestoreModule from '../../../firebase/firestore';
import * as AuthContext from '../../../contexts/AuthContext';

// Mock the AuthContext
jest.mock('../../../contexts/AuthContext');

describe('Profile Page - Edit and Delete Functionality', () => {
  const mockExperiences = [
    {
      id: 'exp-1',
      userId: 'test-user-123',
      destination: 'Paris, France',
      tripDate: '2024-06-15',
      title: 'Amazing Paris Trip',
      description: 'Had a wonderful time exploring the city',
      highlights: ['Eiffel Tower', 'Louvre Museum'],
      tips: ['Book tickets in advance', 'Try local cafes'],
      photos: ['https://example.com/photo1.jpg'],
      rating: 5,
      createdAt: { seconds: 1718409600, toDate: () => new Date('2024-06-15') }
    }
  ];

  const mockItineraries = [
    {
      id: 'itin-1',
      userId: 'test-user-123',
      destination: 'Tokyo, Japan',
      startDate: '2024-07-01',
      endDate: '2024-07-05',
      flight: { airline: 'ANA', flightNumber: 'NH001', price: 1200 },
      hotel: { name: 'Tokyo Hotel', pricePerNight: 200, rating: 4.5, stars: 5 },
      totalCost: 2000,
      createdAt: { seconds: 1719792000, toDate: () => new Date('2024-07-01') }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    global.alert.mockClear();
    global.confirm.mockClear();

    // Mock useAuth to return a test user
    AuthContext.useAuth.mockReturnValue({
      currentUser: {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User'
      },
      loading: false
    });

    // Mock Firestore queries
    jest.spyOn(firestoreModule, 'queryDocuments').mockImplementation((collection) => {
      if (collection === 'experiences') {
        return Promise.resolve(mockExperiences);
      }
      if (collection === 'itineraries') {
        return Promise.resolve(mockItineraries);
      }
      return Promise.resolve([]);
    });
  });

  describe('Edit Experience Functionality', () => {
    test('edit button is visible on experience cards', async () => {
      render(
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      );

      await waitFor(() => {
        const editButtons = screen.queryAllByText(/✏️ Edit/i);
        expect(editButtons.length).toBeGreaterThan(0);
      });
    });

    test('clicking edit button opens edit modal with pre-filled data', async () => {
      render(
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      );

      await waitFor(() => {
        const editButton = screen.getAllByText(/✏️ Edit/i)[0];
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Edit Experience')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Paris, France')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Amazing Paris Trip')).toBeInTheDocument();
      });
    });

    test('can modify experience fields in edit modal', async () => {
      render(
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      );

      await waitFor(() => {
        const editButton = screen.getAllByText(/✏️ Edit/i)[0];
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        const titleInput = screen.getByDisplayValue('Amazing Paris Trip');
        fireEvent.change(titleInput, { target: { value: 'Updated Paris Trip' } });
        expect(titleInput.value).toBe('Updated Paris Trip');
      });
    });

    test('submitting edit form calls updateDocument with correct data', async () => {
      const updateDocumentSpy = jest.spyOn(firestoreModule, 'updateDocument').mockResolvedValue();

      render(
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      );

      await waitFor(() => {
        const editButton = screen.getAllByText(/✏️ Edit/i)[0];
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        const titleInput = screen.getByDisplayValue('Amazing Paris Trip');
        fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
      });

      const submitButton = screen.getByText('Update Experience');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(updateDocumentSpy).toHaveBeenCalledWith(
          'experiences',
          'exp-1',
          expect.objectContaining({
            title: 'Updated Title',
            destination: 'Paris, France'
          })
        );
        expect(global.alert).toHaveBeenCalledWith('Experience updated successfully!');
      });
    });

    test('canceling edit closes modal without saving', async () => {
      render(
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      );

      await waitFor(() => {
        const editButton = screen.getAllByText(/✏️ Edit/i)[0];
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Edit Experience')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Edit Experience')).not.toBeInTheDocument();
      });
    });

    test('can add and remove highlights in edit modal', async () => {
      render(
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      );

      await waitFor(() => {
        const editButton = screen.getAllByText(/✏️ Edit/i)[0];
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        const addHighlightBtn = screen.getByText('+ Add Highlight');
        fireEvent.click(addHighlightBtn);
      });

      await waitFor(() => {
        const highlightInputs = screen.getAllByPlaceholderText(/Highlight \d+/);
        expect(highlightInputs.length).toBeGreaterThan(2);
      });
    });

    test('edit form has required field attributes', async () => {
      render(
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      );

      await waitFor(() => {
        const editButton = screen.getAllByText(/✏️ Edit/i)[0];
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        // Check that required fields have the required attribute
        const titleInput = screen.getByDisplayValue('Amazing Paris Trip');
        const destinationInput = screen.getByDisplayValue('Paris, France');

        expect(titleInput).toHaveAttribute('required');
        expect(destinationInput).toHaveAttribute('required');
      });
    });
  });

  describe('Delete Functionality', () => {
    test('delete button is visible on experience cards', async () => {
      render(
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      );

      await waitFor(() => {
        const deleteButtons = screen.queryAllByText(/🗑️ Delete/i);
        expect(deleteButtons.length).toBeGreaterThan(0);
      });
    });

    test('clicking delete shows confirmation dialog', async () => {
      global.confirm.mockReturnValue(false);

      render(
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      );

      await waitFor(() => {
        const deleteButtons = screen.getAllByText(/🗑️ Delete/i);
        fireEvent.click(deleteButtons[0]);
      });

      expect(global.confirm).toHaveBeenCalledWith(
        expect.stringContaining('Are you sure you want to delete')
      );
    });

    test('confirming delete calls deleteDocument', async () => {
      global.confirm.mockReturnValue(true);
      const deleteDocumentSpy = jest.spyOn(firestoreModule, 'deleteDocument').mockResolvedValue();

      render(
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      );

      // Wait for experiences to load first
      await waitFor(() => {
        expect(screen.getByText('Amazing Paris Trip')).toBeInTheDocument();
      });

      // Get all delete buttons and find the one for experiences (not itineraries)
      const deleteButtons = screen.getAllByText(/🗑️ Delete/i);
      // Click the last delete button which should be in the experiences section
      fireEvent.click(deleteButtons[deleteButtons.length - 1]);

      await waitFor(() => {
        expect(deleteDocumentSpy).toHaveBeenCalledWith('experiences', 'exp-1');
        expect(global.alert).toHaveBeenCalledWith('Experience deleted successfully!');
      });
    });

    test('canceling delete does not remove item', async () => {
      global.confirm.mockReturnValue(false);
      const deleteDocumentSpy = jest.spyOn(firestoreModule, 'deleteDocument');

      render(
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      );

      await waitFor(() => {
        const deleteButtons = screen.getAllByText(/🗑️ Delete/i);
        fireEvent.click(deleteButtons[0]);
      });

      expect(deleteDocumentSpy).not.toHaveBeenCalled();
    });

    test('delete itinerary works correctly', async () => {
      global.confirm.mockReturnValue(true);
      const deleteDocumentSpy = jest.spyOn(firestoreModule, 'deleteDocument').mockResolvedValue();

      render(
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Find delete buttons in itinerary section
        const allDeleteButtons = screen.getAllByText(/🗑️ Delete/i);
        // Assuming the last delete button is for itinerary
        fireEvent.click(allDeleteButtons[allDeleteButtons.length - 1]);
      });

      await waitFor(() => {
        expect(deleteDocumentSpy).toHaveBeenCalled();
        expect(global.alert).toHaveBeenCalled();
      });
    });

    test('delete error is handled gracefully', async () => {
      global.confirm.mockReturnValue(true);
      jest.spyOn(firestoreModule, 'deleteDocument').mockRejectedValue(new Error('Delete failed'));

      render(
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      );

      await waitFor(() => {
        const deleteButtons = screen.getAllByText(/🗑️ Delete/i);
        fireEvent.click(deleteButtons[0]);
      });

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          expect.stringContaining('Failed to delete')
        );
      });
    });
  });

  describe('Profile Data Loading', () => {
    test('displays loading state initially', () => {
      jest.spyOn(firestoreModule, 'queryDocuments').mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      );

      expect(screen.getByText(/Loading your itineraries.../i)).toBeInTheDocument();
    });

    test('displays experiences after loading', async () => {
      render(
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Amazing Paris Trip')).toBeInTheDocument();
        expect(screen.getByText(/📍 Paris, France/i)).toBeInTheDocument();
      });
    });

    test('displays empty state when no experiences', async () => {
      jest.spyOn(firestoreModule, 'queryDocuments').mockResolvedValue([]);

      render(
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/No shared experiences yet/i)).toBeInTheDocument();
      });
    });
  });
});
