import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signUp, signIn, signOutUser } from '../firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { currentUser } = useAuth();

  const validatePassword = (pass) => {
    if (pass.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // Check password confirmation for sign up
    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate display name for sign up
    if (isSignUp && displayName.trim().length < 2) {
      setError('Display name must be at least 2 characters');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password, displayName.trim());
      } else {
        await signIn(email, password);
      }

      // Redirect to previous page or home
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (error) {
      // Better error messages
      let errorMessage = error.message;
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please sign in instead.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Use at least 6 characters.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      navigate('/');
    } catch (error) {
      setError(error.message);
    }
  };

  if (currentUser) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="success-icon">✓</div>
          <h2>Welcome, {currentUser.displayName || currentUser.email}!</h2>
          <p className="success-message">You are successfully signed in.</p>
          <div className="auth-actions">
            <button onClick={() => navigate('/profile')} className="auth-button profile-btn">
              Go to Profile
            </button>
            <button onClick={handleSignOut} className="auth-button secondary">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="form-group">
              <label htmlFor="displayName">Display Name</label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength="6"
              required
            />
            <small>Minimum 6 characters</small>
          </div>

          {isSignUp && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength="6"
                required
              />
            </div>
          )}

          <button type="submit" disabled={loading} className="auth-button submit-btn">
            {loading ? (
              <span className="loading-spinner">Loading...</span>
            ) : (
              isSignUp ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>
        
        <p className="auth-switch">
          {isSignUp ? "Already have an account? " : "Don't have an account? "}
          <button 
            type="button" 
            onClick={() => setIsSignUp(!isSignUp)}
            className="auth-link"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
