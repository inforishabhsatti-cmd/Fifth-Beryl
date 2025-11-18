// src/context/AuthContext.js
import React, {
  useContext,
  useState,
  useEffect,
  createContext,
} from 'react';
import { auth } from '../firebase';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithRedirect,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
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

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true); // overall auth loading

  // ---- AUTH FUNCTIONS ----

  function signUp(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function logIn(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logOut() {
    return signOut(auth);
  }

  // Use redirect-based Google sign-in (no popup, no window.close)
  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      // This causes a full-page redirect to Google. It won't "return" in this session.
      await signInWithRedirect(auth, provider);
    } catch (err) {
      console.error('Firebase Google redirect sign-in error:', err);
      throw err;
    }
  }

  // ---- SESSION MANAGEMENT ----

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);

        try {
          const token = await user.getIdToken();
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          // fetch user profile from backend
          const response = await api.get('/profile');

          const adminEmail = process.env.REACT_APP_ADMIN_EMAIL;
          if (response.data && response.data.email === adminEmail) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Failed to fetch user profile or set admin:', error);
          setIsAdmin(false);
        }
      } else {
        // signed out
        setCurrentUser(null);
        setIsAdmin(false);
        delete api.defaults.headers.common['Authorization'];
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    isAdmin,
    loading,
    api,
    signUp,
    logIn,
    logOut,
    signInWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Only render app once auth state is known */}
      {!loading && children}
    </AuthContext.Provider>
  );
}
