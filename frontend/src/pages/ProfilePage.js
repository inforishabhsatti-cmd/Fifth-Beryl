// src/pages/ProfilePage.js
import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function ProfilePage() {
  const { currentUser, logOut } = useAuth();
  const navigate = useNavigate();

  // This is the check that was missing.
  // If there's no user, redirect to login.
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const handleLogout = () => {
    logOut();
    navigate('/login');
  };

  // If currentUser is null (which can happen for a split second
  // or on a bad redirect), show a loading state.
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading user...</p>
      </div>
    );
  }

  // If we are here, currentUser is valid
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-2xl">My Profile</CardTitle>
              <CardDescription>
                Welcome, {currentUser.name}! View your details here.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <p id="name" className="text-lg p-3 border rounded-md bg-gray-50">
                  {currentUser.name}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <p id="email" className="text-lg p-3 border rounded-md bg-gray-50">
                  {currentUser.email}
                </p>
              </div>
              <Button 
                onClick={handleLogout} 
                variant="destructive" 
                className="w-full"
              >
                Log Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}