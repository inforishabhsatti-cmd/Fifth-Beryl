import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

// --- LOGO CONFIGURATION ---
const LOGO_URL = "/assets/favicon.png"; 

const Navbar = () => {
  const { currentUser: user, logOut: signOut } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Scroll Logic
  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  const adminEmail = process.env.REACT_APP_ADMIN_EMAIL;
  const isAdmin = user && user.email === adminEmail;

  return (
    <motion.nav 
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      // Increased height to h-24 (approx 96px) to fit the larger logo comfortably
      className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-md h-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full relative">
          
          {/* Left: Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8 flex-1 justify-start">
            <Link to="/" className="transition-colors font-medium text-gray-600 hover:text-black text-sm uppercase tracking-wide" data-testid="nav-home">
              Home
            </Link>
            <Link to="/products" className="transition-colors font-medium text-gray-600 hover:text-black text-sm uppercase tracking-wide" data-testid="nav-products">
              Products
            </Link>
            {user && (
              <Link to="/orders" className="transition-colors font-medium text-gray-600 hover:text-black text-sm uppercase tracking-wide" data-testid="nav-orders">
                Orders
              </Link>
            )}
          </div>

          {/* Center: Logo (Absolute Positioned) */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center">
            <Link to="/" className="flex items-center justify-center h-full" data-testid="nav-logo">
                <img 
                  src={LOGO_URL} 
                  alt="Fifth Beryl" 
                  // Increased size to h-16 (64px) for better visibility
                  className="h-16 w-auto object-contain" 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    // Fallback text
                    e.target.parentNode.innerHTML = '<h1 class="text-3xl font-bold playfair text-black tracking-tight">Fifth Beryl</h1>';
                  }}
                />
            </Link>
          </div>

          {/* Mobile Menu Button (Left Aligned on Mobile) */}
          <div className="md:hidden flex items-center justify-start flex-1">
            <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-black hover:bg-gray-100 rounded-full"
                data-testid="mobile-menu-btn"
            >
                {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>

          {/* Right: Icons */}
          <div className="flex items-center gap-4 flex-1 justify-end">
            
            {/* Cart */}
            <button
              onClick={() => navigate('/cart')}
              className="relative p-2 rounded-full transition-colors text-black hover:bg-gray-100"
              data-testid="nav-cart-btn"
            >
              <ShoppingCart size={24} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Menu */}
            <div className="hidden md:block">
                {user ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 transition-colors" data-testid="user-menu-btn">
                        <Avatar className="h-9 w-9 border border-gray-200">
                        <AvatarImage src={null} alt={user.name || "Profile"} />
                        <AvatarFallback className="bg-black text-white">
                            <User size={18} />
                        </AvatarFallback>
                        </Avatar>
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 p-0 bg-white border border-gray-200 shadow-xl rounded-none mt-2">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <p className="text-sm font-medium text-black truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    
                    <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer hover:bg-gray-50 rounded-none py-3 px-4 text-sm font-medium text-gray-700" data-testid="dropdown-profile">
                        My Profile
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => navigate('/wishlist')} className="cursor-pointer hover:bg-gray-50 rounded-none py-3 px-4 text-sm font-medium text-gray-700" data-testid="dropdown-wishlist">
                        My Wishlist
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => navigate('/orders')} className="cursor-pointer hover:bg-gray-50 rounded-none py-3 px-4 text-sm font-medium text-gray-700" data-testid="dropdown-orders">
                        My Orders
                    </DropdownMenuItem>
                    
                    {isAdmin && (
                        <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer hover:bg-gray-50 rounded-none py-3 px-4 text-sm font-medium text-black bg-gray-50" data-testid="dropdown-admin">
                        Admin Panel
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuItem onClick={signOut} className="cursor-pointer hover:bg-red-50 text-red-600 rounded-none py-3 px-4 border-t border-gray-100 text-sm font-medium" data-testid="dropdown-signout">
                        <LogOut size={16} className="mr-2" />
                        Sign Out
                    </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                ) : (
                <Button 
                    onClick={() => navigate('/login')} 
                    className="bg-black hover:bg-gray-800 text-white rounded-none px-6 text-sm uppercase tracking-wide font-medium h-10" 
                    data-testid="signin-btn"
                >
                    Sign In
                </Button>
                )}
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-200 bg-white absolute w-full left-0 top-24 shadow-xl z-40"
            data-testid="mobile-menu"
          >
            <div className="px-6 py-8 space-y-6 h-screen bg-white">
              <div className="space-y-6">
                  <Link to="/" className="block text-2xl font-medium text-black hover:text-gray-600 playfair border-b border-gray-100 pb-4" onClick={() => setMobileMenuOpen(false)}>
                    Home
                  </Link>
                  <Link to="/products" className="block text-2xl font-medium text-black hover:text-gray-600 playfair border-b border-gray-100 pb-4" onClick={() => setMobileMenuOpen(false)}>
                    Products
                  </Link>
                  {user && (
                    <>
                        <Link to="/orders" className="block text-2xl font-medium text-black hover:text-gray-600 playfair border-b border-gray-100 pb-4" onClick={() => setMobileMenuOpen(false)}>
                        Orders
                        </Link>
                        <Link to="/profile" className="block text-2xl font-medium text-black hover:text-gray-600 playfair border-b border-gray-100 pb-4" onClick={() => setMobileMenuOpen(false)}>
                        Profile
                        </Link>
                        <Link to="/wishlist" className="block text-2xl font-medium text-black hover:text-gray-600 playfair border-b border-gray-100 pb-4" onClick={() => setMobileMenuOpen(false)}>
                        Wishlist
                        </Link>
                    </>
                  )}
              </div>
              
              <div className="pt-8">
                {user ? (
                    <>
                    {isAdmin && (
                        <Link to="/admin" className="block text-lg font-medium text-black mb-6 bg-gray-50 p-4 text-center border border-black" onClick={() => setMobileMenuOpen(false)}>
                        Admin Panel
                        </Link>
                    )}
                    <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="w-full text-lg font-medium text-red-600 py-4 border border-red-200 bg-red-50">
                        Sign Out
                    </button>
                    </>
                ) : (
                    <button onClick={() => { navigate('/login'); setMobileMenuOpen(false); }} className="w-full bg-black text-white py-4 text-lg font-medium uppercase tracking-wider">
                    Sign In
                    </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;