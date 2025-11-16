import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase'; 
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  // --- MODIFICATION 1: Import 'signInWithRedirect' instead of 'signInWithPopup' ---
  signInWithRedirect 
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

  // --- MODIFICATION 2: Update 'signInWithGoogle' to use redirect ---
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // This will navigate the user away to Google's sign-in page.
      await signInWithRedirect(auth, provider);
      // The rest of this function will not run, as the page is changing.
      // The 'onAuthStateChanged' listener above will handle the user
      // when they are redirected back to your app.
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error(error.message);
      throw error;
    }
  };

  // ... (rest of the file is correct)

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

  const signOutUser = async () => {
    try {
      await signOut(auth);
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
    signOut: signOutUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};