import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-black text-white py-12 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile: Stacked layout, centered text. Desktop: Grid layout (4 cols) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
          
          {/* Brand Section */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-2xl font-bold playfair mb-4">Fifth Beryl</h3>
            <p className="text-gray-400 mb-4 max-w-xs mx-auto md:mx-0">
              Premium quality shirts crafted with excellence.
            </p>
            <div className="flex gap-6 justify-center md:justify-start">
              <a href="#" className="hover:text-gray-300 transition-colors" aria-label="Instagram">
                <Instagram size={24} />
              </a>
              <a href="#" className="hover:text-gray-300 transition-colors" aria-label="Facebook">
                <Facebook size={24} />
              </a>
              <a href="#" className="hover:text-gray-300 transition-colors" aria-label="Twitter">
                <Twitter size={24} />
              </a>
              <a href="#" className="hover:text-gray-300 transition-colors" aria-label="Email">
                <Mail size={24} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col items-center md:items-start">
            <h4 className="font-semibold text-lg mb-4 uppercase tracking-wide">Quick Links</h4>
            <ul className="space-y-3 text-gray-400">
              <li>
                <Link to="/" className="hover:text-white transition-colors text-base">Home</Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-white transition-colors text-base">Products</Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-white transition-colors text-base">Orders</Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="flex flex-col items-center md:items-start">
            <h4 className="font-semibold text-lg mb-4 uppercase tracking-wide">Customer Service</h4>
            <ul className="space-y-3 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors text-base">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors text-base">Shipping Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors text-base">Returns & Exchanges</a></li>
              <li><a href="#" className="hover:text-white transition-colors text-base">FAQs</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="flex flex-col items-center md:items-start">
            <h4 className="font-semibold text-lg mb-4 uppercase tracking-wide">Newsletter</h4>
            <p className="text-gray-400 mb-4 text-sm max-w-xs mx-auto md:mx-0">
              Subscribe to get special offers and updates.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs mx-auto md:max-w-full">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-4 py-3 rounded-none bg-gray-900 border border-gray-700 focus:outline-none focus:border-white text-white placeholder-gray-500"
              />
              <button className="px-6 py-3 bg-white text-black font-bold hover:bg-gray-200 transition-colors rounded-none uppercase tracking-wider text-sm">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500 text-sm">
          <p>© 2025 Fifth Beryl. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;