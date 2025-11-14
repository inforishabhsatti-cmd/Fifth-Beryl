import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';

const LoginPage = () => {
  const navigate = useNavigate();
  const { signInWithGoogle, signInWithEmail, registerWithEmail, sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      navigate('/'); // Redirect to home after successful login
    } catch (error) {
      // Error is already toasted in AuthContext
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      navigate('/'); // Redirect to home
    } catch (error) {
      // Error is toasted in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerWithEmail(email, password);
      navigate('/'); // Redirect to home
    } catch (error) {
      // Error is toasted in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = () => {
    if (!email) {
      toast.error('Please enter your email address to reset your password.');
      return;
    }
    sendPasswordReset(email);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex justify-center items-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            {/* --- LOGIN TAB --- */}
            <TabsContent value="login">
              <div className="bg-white rounded-2xl p-8 shadow-lg space-y-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-green-700 hover:bg-green-800">
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
                <div className="text-center">
                  <Button variant="link" onClick={handlePasswordReset}>
                    Forgot password?
                  </Button>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">
                      Or continue with
                    </span>
                  </div>
                </div>
                <Button onClick={handleGoogleSignIn} variant="outline" className="w-full">
                  Sign In with Google
                </Button>
              </div>
            </TabsContent>
            
            {/* --- REGISTER TAB --- */}
            <TabsContent value="register">
              <div className="bg-white rounded-2xl p-8 shadow-lg space-y-6">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label htmlFor="reg-email">Email</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="reg-password">Password</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Must be at least 6 characters"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-green-700 hover:bg-green-800">
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
                <p className="px-8 text-center text-sm text-gray-500">
                  By creating an account, you agree to our
                  <Link to="#" className="underline underline-offset-4 hover:text-primary">
                    Terms of Service
                  </Link>
                  .
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default LoginPage;