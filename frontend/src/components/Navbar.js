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
      // Navbar Background is Red-Brown (bg-foreground)
      className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-foreground/95 backdrop-blur-md h-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full relative">
          
          {/* Left: Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 flex-1 justify-start">
            <Link 
              to="/" 
              // FIX: Changed text-primary-foreground to text-background (Vanilla) for visibility on brown background
              // Hover remains hover:bg-background (Vanilla) hover:text-foreground (Red-Brown)
              className="px-4 py-2 transition-all duration-300 font-bold text-background hover:bg-background hover:text-foreground text-sm uppercase tracking-widest rounded-sm" 
              data-testid="nav-home"
            >
              Home
            </Link>
            <Link 
              to="/products" 
              className="px-4 py-2 transition-all duration-300 font-bold text-background hover:bg-background hover:text-foreground text-sm uppercase tracking-widest rounded-sm" 
              data-testid="nav-products"
            >
              Products
            </Link>
            {user && (
              <Link 
                to="/orders" 
                className="px-4 py-2 transition-all duration-300 font-bold text-background hover:bg-background hover:text-foreground text-sm uppercase tracking-widest rounded-sm" 
                data-testid="nav-orders"
              >
                Orders
              </Link>
            )}
          </div>

          {/* Center: Logo */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center">
            <Link to="/" className="flex items-center justify-center h-full" data-testid="nav-logo">
                <img 
                  src={LOGO_URL} 
                  alt="Fifth Beryl" 
                  className="h-16 w-auto object-contain hover:scale-105 transition-transform duration-300" 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    // Text color remains correct (Vanilla) for visibility
                    e.target.parentNode.innerHTML = '<h1 class="text-3xl font-bold playfair text-primary-foreground tracking-tight">Fifth Beryl</h1>';
                  }}
                />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center justify-start flex-1">
            <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                // FIX: Changed text-primary-foreground to text-background (Vanilla)
                className="p-2 text-background hover:bg-background hover:text-foreground transition-colors rounded-full"
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
              // FIX: Changed text-primary-foreground to text-background (Vanilla)
              className="relative p-2 rounded-full transition-all duration-300 text-background hover:bg-background hover:text-foreground"
              data-testid="nav-cart-btn"
            >
              <ShoppingCart size={24} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span 
                  // Cart badge is already high contrast (Vanilla BG, Brown Text)
                  className="absolute -top-1 -right-1 bg-background text-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-foreground group-hover:border-background group-hover:bg-foreground group-hover:text-background"
                >
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Menu */}
            <div className="hidden md:block">
                {user ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      // FIX: Added text-background to ensure icon visibility
                      className="rounded-full text-background hover:bg-background hover:text-foreground transition-colors" 
                      data-testid="user-menu-btn"
                    >
                        <Avatar className="h-9 w-9 border border-gray-200">
                        <AvatarImage src={null} alt={user.name || "Profile"} />
                        {/* Avatar Fallback is high contrast (Vanilla BG, Brown Text) */}
                        <AvatarFallback className="bg-background text-foreground">
                            <User size={18} />
                        </AvatarFallback>
                        </Avatar>
                    </Button>
                    </DropdownMenuTrigger>
                    {/* Dropdown content background is Vanilla (bg-background) */}
                    <DropdownMenuContent align="end" className="w-56 p-0 bg-background border border-gray-200 shadow-xl rounded-none mt-2">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    
                    <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer hover:bg-foreground hover:text-background rounded-none py-3 px-4 text-sm font-medium text-gray-700 transition-colors" data-testid="dropdown-profile">
                        My Profile
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => navigate('/wishlist')} className="cursor-pointer hover:bg-foreground hover:text-background rounded-none py-3 px-4 text-sm font-medium text-gray-700 transition-colors" data-testid="dropdown-wishlist">
                        My Wishlist
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => navigate('/orders')} className="cursor-pointer hover:bg-foreground hover:text-background rounded-none py-3 px-4 text-sm font-medium text-gray-700 transition-colors" data-testid="dropdown-orders">
                        My Orders
                    </DropdownMenuItem>
                    
                    {isAdmin && (
                        <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer hover:bg-foreground hover:text-background rounded-none py-3 px-4 text-sm font-medium text-foreground bg-gray-50 transition-colors" data-testid="dropdown-admin">
                        Admin Panel
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuItem onClick={signOut} className="cursor-pointer hover:bg-red-600 hover:text-white text-red-600 rounded-none py-3 px-4 border-t border-gray-100 text-sm font-medium transition-colors" data-testid="dropdown-signout">
                        <LogOut size={16} className="mr-2" />
                        Sign Out
                    </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                ) : (
                <Button 
                    onClick={() => navigate('/login')} 
                    // This uses the default variant (Vanilla Button, Brown Text), which is correct for visibility
                    className="rounded-none px-6 text-sm uppercase tracking-wide font-medium h-10" 
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
            className="md:hidden border-t border-gray-200 bg-background absolute w-full left-0 top-20 shadow-xl z-40"
            data-testid="mobile-menu"
          >
            <div className="px-6 py-8 space-y-6 h-screen bg-background">
              <div className="space-y-6">
                  <Link 
                    to="/" 
                    className="block text-2xl font-medium text-foreground hover:text-background hover:bg-foreground px-4 py-2 transition-colors playfair border-b border-gray-100" 
                    onClick={() => setMobileMenuOpen(false)}>
                    Home
                  </Link>
                  <Link 
                    to="/products" 
                    className="block text-2xl font-medium text-foreground hover:text-background hover:bg-foreground px-4 py-2 transition-colors playfair border-b border-gray-100" 
                    onClick={() => setMobileMenuOpen(false)}>
                    Products
                  </Link>
                  {user && (
                    <>
                        <Link 
                          to="/orders" 
                          className="block text-2xl font-medium text-foreground hover:text-background hover:bg-foreground px-4 py-2 transition-colors playfair border-b border-gray-100" 
                          onClick={() => setMobileMenuOpen(false)}>
                        Orders
                        </Link>
                        <Link 
                          to="/profile" 
                          className="block text-2xl font-medium text-foreground hover:text-background hover:bg-foreground px-4 py-2 transition-colors playfair border-b border-gray-100" 
                          onClick={() => setMobileMenuOpen(false)}>
                        Profile
                        </Link>
                        <Link 
                          to="/wishlist" 
                          className="block text-2xl font-medium text-foreground hover:text-background hover:bg-foreground px-4 py-2 transition-colors playfair border-b border-gray-100" 
                          onClick={() => setMobileMenuOpen(false)}>
                        Wishlist
                        </Link>
                    </>
                  )}
              </div>
              
              <div className="pt-8">
                {user ? (
                    <>
                    {isAdmin && (
                        <Link 
                          to="/admin" 
                          className="block text-lg font-medium text-foreground mb-6 bg-gray-50 p-4 text-center border border-foreground hover:bg-foreground hover:text-background transition-colors" 
                          onClick={() => setMobileMenuOpen(false)}>
                        Admin Panel
                        </Link>
                    )}
                    <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="w-full text-lg font-medium text-red-600 py-4 border border-red-200 bg-red-50 hover:bg-red-600 hover:text-primary-foreground transition-colors">
                        Sign Out
                    </button>
                    </>
                ) : (
                    <button onClick={() => { navigate('/login'); setMobileMenuOpen(false); }} 
                      // Uses default variant (Vanilla Button, Brown Text), which is correct for visibility
                      className="w-full bg-primary text-primary-foreground py-4 text-lg font-medium uppercase tracking-wider hover:bg-primary/90">
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