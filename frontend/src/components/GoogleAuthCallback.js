// src/components/GoogleAuthCallback.js
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function GoogleAuthCallback() {
  const { handleGoogleCallback } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (token) {
      // Save the token using our context function
      handleGoogleCallback(token);
      // Redirect to profile page
      navigate('/profile');
    } else {
      // Handle error
      console.error('Google Auth Error:', error || 'No token provided');
      // Redirect to login with error
      navigate('/login?error=' + (error || 'Google login failed'));
    }
  }, [location, navigate, handleGoogleCallback]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Loading, please wait...</p>
    </div>
  );
}