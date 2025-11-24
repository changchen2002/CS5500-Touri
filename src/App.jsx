import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';


import Navbar from './components/Navbar/Navbar';
import Search from './components/Search/Search';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Auth from './components/Auth';


import Home from './pages/Home/Home';
import Results from './pages/Results/Results';
import Itinerary from './pages/Itinerary/Itinerary';
import Profile from './pages/Profile/Profile';
import Discover from './pages/Discover/Discover';
import ShareExperience from './pages/ShareExperience/ShareExperience';
import ExperienceDetail from './pages/ExperienceDetail/ExperienceDetail';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/experience/:id" element={<ExperienceDetail />} />
            <Route path="/search" element={<Search />} />
            <Route path="/results" element={<Results />} />
            <Route 
              path="/itinerary/:id?" 
              element={
                <ProtectedRoute>
                  <Itinerary />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/share-experience" 
              element={
                <ProtectedRoute>
                  <ShareExperience />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;


