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

export default function LoginPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signUp, logIn, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/profile');
    }
  }, [currentUser, navigate]);

  const handleEmailSubmit = async (e, action) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (action === 'login') {
        await logIn(email, password);
      } else {
        await signUp(name, email, password);
      }
      navigate('/profile');
    } catch (err) {
      console.error('Auth error:', err);
      const friendly =
        err.response?.data?.detail ||
        'An unknown error occurred. Please try again.';
      setError(friendly);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex items-center justify-center overflow-hidden bg-[#faf8f5]">
      
      {/* Left Side - Editorial Image (Hidden on mobile) */}
      <div className="hidden lg:block w-1/2 h-full bg-black relative">
        <img 
          // Using a high-quality fashion placeholder. Replace with your own brand image asset if you have one.
          src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop" 
          alt="Fashion Editorial" 
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-black/20 flex flex-col justify-between p-12 text-white">
           <h2 className="text-3xl font-bold tracking-widest uppercase">Fifth Beryl</h2>
           <div>
             <p className="text-lg font-light italic">"Elegance is not standing out, but being remembered."</p>
           </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 h-full flex flex-col items-center justify-center p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold playfair text-gray-900 mb-2">Fifth Beryl</h1>
            <p className="text-gray-500">Welcome to the exclusive collection</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* --- LOGIN TAB --- */}
            <TabsContent value="login">
              <Card className="border-none shadow-none bg-transparent">
                <form onSubmit={(e) => handleEmailSubmit(e, 'login')}>
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-2xl playfair">Welcome Back</CardTitle>
                    <CardDescription>
                      Enter your credentials to access your account.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="px-0 space-y-4">
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
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-11 bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Password</Label>
                        {/* Optional: Add Forgot Password link here later */}
                      </div>
                      <Input
                        id="login-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11 bg-white"
                      />
                    </div>
                  </CardContent>

                  <CardFooter className="px-0 flex flex-col gap-4">
                    <Button type="submit" className="w-full h-11 text-base bg-green-700 hover:bg-green-800 transition-colors" disabled={loading}>
                      {loading ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            {/* --- SIGNUP TAB --- */}
            <TabsContent value="signup">
              <Card className="border-none shadow-none bg-transparent">
                <form onSubmit={(e) => handleEmailSubmit(e, 'signup')}>
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-2xl playfair">Create Account</CardTitle>
                    <CardDescription>
                      Join us for an exclusive shopping experience.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="px-0 space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="h-11 bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-11 bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11 bg-white"
                      />
                    </div>
                  </CardContent>

                  <CardFooter className="px-0 flex flex-col gap-4">
                    <Button type="submit" className="w-full h-11 text-base bg-green-700 hover:bg-green-800 transition-colors" disabled={loading}>
                      {loading ? 'Creating Account...' : 'Join Fifth Beryl'}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}