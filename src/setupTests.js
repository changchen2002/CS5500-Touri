// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';

// Mock window.alert and window.confirm
global.alert = jest.fn();
global.confirm = jest.fn(() => true);

// Mock PDF generation libraries
jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    internal: {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297
      },
      getNumberOfPages: () => 1
    },
    setFillColor: jest.fn(),
    setTextColor: jest.fn(),
    setFontSize: jest.fn(),
    setFont: jest.fn(),
    setDrawColor: jest.fn(),
    rect: jest.fn(),
    text: jest.fn(),
    line: jest.fn(),
    splitTextToSize: jest.fn((text) => [text]),
    addPage: jest.fn(),
    setPage: jest.fn(),
    save: jest.fn()
  }));
});

jest.mock('html2canvas', () => {
  return jest.fn().mockResolvedValue({
    toDataURL: () => 'data:image/png;base64,mockimage',
    height: 1000,
    width: 800
  });
});

// Mock Firebase
jest.mock('./firebase/firestore', () => ({
  getDocuments: jest.fn(),
  addDocument: jest.fn(),
  updateDocument: jest.fn(),
  deleteDocument: jest.fn(),
  queryDocuments: jest.fn()
}));

jest.mock('./firebase/auth', () => ({
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOutUser: jest.fn()
}));

jest.mock('./contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    currentUser: {
      uid: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Test User'
    },
    loading: false
  }))
}));
