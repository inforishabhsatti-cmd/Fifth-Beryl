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
  const [name, setName] = useState(''); // Added for sign up
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // One loading state
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const { signUp, logIn, signInWithGoogle, currentUser } = useAuth();
  const navigate = useNavigate();

  // If user is already logged in, send to /profile
  useEffect(() => {
    if (currentUser) {
      navigate('/profile');
    }
  }, [currentUser, navigate]);

  // --- REWRITTEN: Email Login / Signup ---
  const handleEmailSubmit = async (e, action) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (action === 'login') {
        await logIn(email, password);
      } else {
        await signUp(name, email, password); // Pass name to signup
      }
      navigate('/profile');
    } catch (err) {
      console.error('Auth error:', err);
      // Get error message from backend response
      const friendly =
        err.response?.data?.detail || 'An unknown error occurred. Please try again.';
      setError(friendly);
    } finally {
      setLoading(false);
    }
  };

  // --- REWRITTEN: Google Sign-In ---
  const handleGoogleSignIn = async () => {
    setError('');
    setLoadingGoogle(true);
    // No try/catch needed here, as it's a full page redirect.
    // The backend handles errors on the callback.
    await signInWithGoogle();
  };

  const isAnyLoading = loading || loadingGoogle;

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
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>

                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={isAnyLoading}
                >
                  <Chrome className="w-4 h-4 mr-2" />
                  {loadingGoogle ? 'Redirecting...' : 'Sign In with Google'}
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
                  Enter your details to get started.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* --- NEW: Name Field --- */}
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

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
                    placeholder="••••••••"
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
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </Button>
                 <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={isAnyLoading}
                >
                  <Chrome className="w-4 h-4 mr-2" />
                  {loadingGoogle ? 'Redirecting...' : 'Sign Up with Google'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}