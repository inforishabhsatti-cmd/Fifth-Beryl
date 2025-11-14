import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
// useTheme is no longer needed here for styles
// import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { cartCount } = useCart();
  // const { isDark } = useTheme(); // No longer needed
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Admin check logic
  const adminEmail = process.env.REACT_APP_ADMIN_EMAIL;
  const isAdmin = user && user.email === adminEmail;

  return (
    <motion.nav 
      initial={{ y: "-100%" }}
      animate={{ y: "0%" }}
      transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1], delay: 1 }}
      // --- MODIFIED: Removed dark theme classes ---
      className={`fixed top-0 left-0 right-0 z-50 glass border-b transition-colors duration-300 border-gray-200 bg-white/70`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center" data-testid="nav-logo">
            {/* --- MODIFIED: Removed dark theme classes --- */}
            <h1 className={`text-3xl font-bold playfair gradient-text`}>
              Fifth Beryl
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {/* --- MODIFIED: Removed dark theme classes --- */}
            <Link to="/" className={`transition-colors font-medium hover:text-emerald-600 text-gray-700`} data-testid="nav-home">
              Home
            </Link>
            <Link to="/products" className={`transition-colors font-medium hover:text-emerald-600 text-gray-700`} data-testid="nav-products">
              Products
            </Link>
            {user && (
              <Link to="/orders" className={`transition-colors font-medium hover:text-emerald-600 text-gray-700`} data-testid="nav-orders">
                Orders
              </Link>
            )}
            {user && (
              <Link to="/profile" className={`transition-colors font-medium hover:text-emerald-600 text-gray-700`} data-testid="nav-profile">
                Profile
              </Link>
            )}
          </div>

          {/* Right Icons */}
          <div className="hidden md:flex items-center gap-4">
            {/* ThemeToggle removed */}
            
            {/* Cart */}
            <button
              onClick={() => navigate('/cart')}
              // --- MODIFIED: Removed dark theme classes ---
              className={`relative p-2 hover:bg-emerald-50 rounded-full transition-colors hover:bg-emerald-50`}
              data-testid="nav-cart-btn"
            >
              {/* --- MODIFIED: Removed dark theme classes --- */}
              <ShoppingCart className={'text-gray-700'} size={24} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full" data-testid="user-menu-btn">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL} alt={user.displayName || "Profile"} />
                      <AvatarFallback>
                        <User size={20} />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/profile')} data-testid="dropdown-profile">
                    My Profile
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => navigate('/wishlist')} data-testid="dropdown-wishlist">
                    My Wishlist
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => navigate('/orders')} data-testid="dropdown-orders">
                    My Orders
                  </DropdownMenuItem>
                  
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')} data-testid="dropdown-admin">
                      Admin Panel
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem onClick={signOut} data-testid="dropdown-signout">
                    <LogOut size={16} className="mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => navigate('/login')} className="bg-green-700 hover:bg-green-800" data-testid="signin-btn">
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
            data-testid="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            // --- MODIFIED: Removed dark theme classes ---
            className={`md:hidden border-t border-gray-200 bg-white`}
            data-testid="mobile-menu"
          >
            <div className="px-4 py-4 space-y-3">
              {/* --- MODIFIED: Removed dark theme classes below --- */}
              <Link to="/" className={`block py-2 text-gray-700 hover:text-emerald-600`} onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
              <Link to="/products" className={`block py-2 text-gray-700 hover:text-emerald-600`} onClick={() => setMobileMenuOpen(false)}>
                Products
              </Link>
              {user && (
                <Link to="/orders" className={`block py-2 text-gray-700 hover:text-emerald-600`} onClick={() => setMobileMenuOpen(false)}>
                  Orders
                </Link>
              )}
              {user && (
                <Link to="/profile" className={`block py-2 text-gray-700 hover:text-emerald-600`} onClick={() => setMobileMenuOpen(false)}>
                  Profile
                </Link>
              )}
              
              {user && (
                <Link to="/wishlist" className={`block py-2 text-gray-700 hover:text-emerald-600`} onClick={() => setMobileMenuOpen(false)}>
                  Wishlist
                </Link>
              )}

              <Link to="/cart" className={`block py-2 text-gray-700 hover:text-emerald-600`} onClick={() => setMobileMenuOpen(false)}>
                Cart ({cartCount})
              </Link>
              {user ? (
                <>
                  {isAdmin && (
                    <Link to="/admin" className={`block py-2 text-gray-700 hover:text-emerald-600`} onClick={() => setMobileMenuOpen(false)}>
                      Admin Panel
                    </Link>
                  )}
                  <button onClick={signOut} className={`w-full text-left py-2 text-gray-700 hover:text-emerald-600`}>
                    Sign Out
                  </button>
                </>
              ) : (
                <button onClick={() => { navigate('/login'); setMobileMenuOpen(false); }} className="w-full btn-primary">
                  Sign In
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;