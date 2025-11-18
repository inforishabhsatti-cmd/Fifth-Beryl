// src/pages/LoginPage.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Chrome } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const { signUp, logIn, signInWithGoogle, currentUser } = useAuth();
  const navigate = useNavigate();

  // If user is already logged in, send to /profile
  useEffect(() => {
    if (currentUser) {
      navigate('/profile');
    }
  }, [currentUser, navigate]);

  // ---- Helper: map Firebase error codes to friendly messages ----
  const getFriendlyErrorMessage = (code, fallbackMessage) => {
    switch (code) {
      case 'auth/invalid-email':
        return 'Invalid email address format.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect email or password.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters long.';
      case 'auth/operation-not-allowed':
        return 'This sign-in method is not enabled. Please contact support.';
      case 'auth/popup-blocked':
        return 'Popup was blocked by the browser. Please allow popups and try again.';
      case 'auth/popup-closed-by-user':
        return 'You closed the sign-in popup before completing login.';
      case 'auth/unauthorized-domain':
        return 'This domain is not authorized for Google sign-in in Firebase settings.';
      default:
        if (fallbackMessage) return fallbackMessage;
        return 'An unknown error occurred. Please try again.';
    }
  };

  // ---- EMAIL LOGIN / SIGNUP ----
  const handleEmailSubmit = async (e, action) => {
    e.preventDefault();
    setError('');
    setLoadingEmail(true);

    try {
      if (action === 'login') {
        await logIn(email, password);
      } else {
        await signUp(email, password);
      }
      navigate('/profile');
    } catch (err) {
      console.error('Email auth error:', err);
      const friendly = getFriendlyErrorMessage(err.code, err.message);
      setError(`${friendly} (${err.code ?? 'no-code'})`);
    } finally {
      setLoadingEmail(false);
    }
  };

  // ---- GOOGLE SIGN-IN (redirect flow) ----
  const handleGoogleSignIn = async () => {
    setError('');
    setLoadingGoogle(true);

    try {
      // This will trigger a full-page redirect to Google.
      // After successful sign-in, app will reload and onAuthStateChanged will fire.
      await signInWithGoogle();
    } catch (err) {
      console.error('Google sign-in redirect error:', err);
      const friendly = getFriendlyErrorMessage(err.code, err.message);
      setError(`${friendly} (${err.code ?? 'no-code'})`);
      setLoadingGoogle(false);
    }
  };

  const isAnyLoading = loadingEmail || loadingGoogle;

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Tabs defaultValue="login" className="w-full max-w-sm">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>

        {/* --- LOGIN TAB --- */}
        <TabsContent value="login">
          <Card>
            <form onSubmit={(e) => handleEmailSubmit(e, 'login')}>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>
                  Sign in to your account to continue.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isAnyLoading}
                >
                  {loadingEmail ? 'Signing In...' : 'Sign In'}
                </Button>

                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={isAnyLoading}
                >
                  <Chrome className="w-4 h-4 mr-2" />
                  {loadingGoogle ? 'Redirecting to Google...' : 'Sign In with Google'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* --- SIGNUP TAB --- */}
        <TabsContent value="signup">
          <Card>
            <form onSubmit={(e) => handleEmailSubmit(e, 'signup')}>
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>
                  Enter your email and password to get started.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isAnyLoading}
                >
                  {loadingEmail ? 'Creating Account...' : 'Sign Up'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
