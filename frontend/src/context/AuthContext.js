import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import {
  // --- MODIFIED: Changed from signInWithPopup
  signInWithRedirect, 
  // ---
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
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
    // onAuthStateChanged will still work perfectly with redirects.
    // When the user comes back from Google, this listener will fire.
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
      // --- MODIFIED: Use redirect instead of popup ---
      await signInWithRedirect(auth, provider);
      // The page will now navigate away. No further code here will run.
      // The useEffect hook above will handle the login when the user returns.
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error(error.message);
      throw error;
    }
  };

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

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
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
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};