// src/context/AuthContext.js
import React, {
  useContext,
  useState,
  useEffect,
  createContext,
} from 'react';
import axios from 'axios';

// Axios instance for your backend
const api = axios.create({
  baseURL:
    (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000') + '/api',
});

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

// Helper: set token in axios headers
const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true); // overall auth loading
  const [token, setToken] = useState(
    () => localStorage.getItem('authToken') || null
  );

  // --- NEW AUTH FUNCTIONS ---

  // Effect to load user on startup if token exists
  useEffect(() => {
    const loadUserFromToken = async () => {
      if (token) {
        setAuthToken(token);
        try {
          // fetch user profile from backend
          const response = await api.get('/profile');
          setCurrentUser(response.data);

          // Check admin status from profile
          const adminEmail = process.env.REACT_APP_ADMIN_EMAIL;
          if (response.data && response.data.email === adminEmail) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          // Token is invalid, log out
          logOut();
        }
      }
      setLoading(false);
    };

    loadUserFromToken();
  }, [token]); // This effect runs when the token state changes

  async function signUp(name, email, password) {
    // Note: Our new endpoint also takes a 'name'
    const response = await api.post('/auth/register', { name, email, password });
    // After successful signup, log them in
    await logIn(email, password);
    return response.data; // Returns the new user profile
  }

  async function logIn(email, password) {
    const response = await api.post('/auth/login', { email, password });
    const { access_token } = response.data;

    // Save token
    localStorage.setItem('authToken', access_token);
    setToken(access_token);
    setAuthToken(access_token);

    // setToken will trigger the useEffect to fetch the user
  }

  function logOut() {
    localStorage.removeItem('authToken');
    setToken(null);
    setAuthToken(null);
    setCurrentUser(null);
    setIsAdmin(false);
  }

  async function signInWithGoogle() {
    // This now just redirects to our backend login route
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
    window.location.href = `${backendUrl}/api/auth/google/login`;
  }

  // --- NEW: Function to handle the Google OAuth callback ---
  const handleGoogleCallback = (token) => {
    localStorage.setItem('authToken', token);
    setToken(token);
    setAuthToken(token);
    // setToken will trigger the useEffect to fetch user
  };

  const value = {
    currentUser,
    isAdmin,
    loading,
    api,
    signUp,
    logIn,
    logOut,
    signInWithGoogle,
    handleGoogleCallback, // Expose the new callback handler
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}