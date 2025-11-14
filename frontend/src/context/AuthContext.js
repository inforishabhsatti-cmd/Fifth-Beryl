import { createContext, useContext, useEffect, useState } from 'react';
// --- MODIFICATION 1: Import ONLY 'auth' from firebase.js ---
import { auth } from '../firebase'; 
import {
  // --- MODIFICATION 2: REMOVE auth functions from here ---
  // signInWithPopup, (REMOVED)
  // signOut as firebaseSignOut, (REMOVED)
  // onAuthStateChanged, (REMOVED)
  // createUserWithEmailAndPassword, (REMOVED)
  // signInWithEmailAndPassword, (REMOVED)
  // sendPasswordResetEmail (REMOVED)
  
  // --- MODIFICATION 3: Import ONLY what's needed for the functions ---
  GoogleAuthProvider,
  onAuthStateChanged,   // We keep this one as it's used differently
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup // Re-add functions, but we will call them WITH the auth object
} from 'firebase/auth';
import { toast } from 'sonner';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // onAuthStateChanged is special, it takes auth as its first argument
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const idToken = await user.getIdToken();
        setToken(idToken);
        setUser(user);
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // --- MODIFICATION 4: Call signInWithPopup WITH the auth object ---
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      setToken(idToken);
      toast.success('Welcome to Fifth Beryl!');
      return result.user;
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error(error.message);
      throw error;
    }
  };

  // --- MODIFICATION 5: Pass 'auth' as the first argument to all functions ---

  const signInWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await result.user.getIdToken();
      setToken(idToken);
      toast.success('Welcome back!');
      return result.user;
    } catch (error) {
      console.error('Error signing in with email:', error);
      toast.error(error.message);
      throw error;
    }
  };

  const registerWithEmail = async (email, password) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await result.user.getIdToken();
      setToken(idToken);
      toast.success('Welcome to Fifth Beryl!');
      return result.user;
    } catch (error) {
      console.error('Error registering:', error);
      toast.error(error.message);
      throw error;
    }
  };
  
  const sendPasswordReset = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent! Please check your inbox.');
    } catch (error) {
      console.error('Error sending password reset:', error);
      toast.error(error.message);
      throw error;
    }
  };

  const signOutUser = async () => { // Renamed to avoid conflict
    try {
      await signOut(auth); // Use the imported signOut function
      setToken(null);
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
      throw error;
    }
  };

  const value = {
    user,
    token,
    loading,
    signInWithGoogle,
    signInWithEmail, 
    registerWithEmail, 
    sendPasswordReset, 
    signOut: signOutUser // Assign the renamed function
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};