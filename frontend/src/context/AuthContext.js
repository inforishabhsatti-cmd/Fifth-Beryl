import React, { useContext, useState, useEffect, createContext } from 'react';
import { auth } from '../firebase';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import axios from 'axios';

// Create an Axios instance for your API
// This is the new, correct line
const api = axios.create({
  baseURL: (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000') + '/api',
});

// Create the context
const AuthContext = createContext();

// Create a custom hook to use the context
export function useAuth() {
  return useContext(AuthContext);
}

// Create the AuthProvider component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true); // App-wide loading state

  // --- AUTH FUNCTIONS ---

  function signUp(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function logIn(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logOut() {
    return signOut(auth);
  }

  function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

  // --- SESSION MANAGEMENT EFFECT ---

  useEffect(() => {
    // This listener runs on auth state change (login/logout)
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        setCurrentUser(user);

        // Get the Firebase token and set it in Axios headers
        try {
          const token = await user.getIdToken();
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          // Fetch user profile from your backend
          const response = await api.get('/profile');
          
          // Check if user is an admin
          const adminEmail = process.env.REACT_APP_ADMIN_EMAIL;
          if (response.data && response.data.email === adminEmail) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }

        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          setIsAdmin(false); // Default to not admin on error
        }
      } else {
        // User is signed out
        setCurrentUser(null);
        setIsAdmin(false);
        delete api.defaults.headers.common['Authorization'];
      }
      
      // Done loading, app can now render
      setLoading(false);
    });

    // Cleanup function
    return unsubscribe;
  }, []);

  // The value provided to all children
  const value = {
    currentUser,
    isAdmin,
    loading,
    api, // Export the Axios instance so other parts of your app can use it
    signUp,
    logIn,
    logOut,
    signInWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Only render children when auth state is determined */}
      {!loading && children}
    </AuthContext.Provider>
  );
}