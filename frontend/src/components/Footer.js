import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Mail, ChevronDown } from 'lucide-react'; // Added ChevronDown for collapsibles

const Footer = () => {
  // Helper to render collapsible sections on mobile
  const CollapsibleSection = ({ title, children }) => (
    <details className="md:contents border-b border-gray-800 md:border-none last:border-b-0">
      <summary className="font-semibold text-lg py-4 md:py-0 uppercase tracking-wide cursor-pointer md:cursor-default list-none flex justify-between items-center md:block">
        {title}
        <ChevronDown size={18} className="md:hidden transition-transform duration-300 details-open:rotate-180" />
      </summary>
      <div className="md:mt-4 pb-4 md:pb-0 text-gray-400 text-base md:text-left">
        {children}
      </div>
    </details>
  );

  return (
    <footer className="bg-black text-white py-12 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile: Stacked layout, centered text. Desktop: Grid layout (4 cols) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-y-0 gap-x-8 md:gap-y-8 md:text-left">
          
          {/* Brand Section (Always visible, centralized on mobile) */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left mb-8 md:mb-0">
            <h3 className="text-3xl font-bold playfair mb-4">Fifth Beryl</h3>
            <p className="text-gray-400 mb-6 max-w-xs mx-auto md:mx-0 text-sm">
              Premium quality shirts crafted with excellence.
            </p>
            <div className="flex gap-4 justify-center md:justify-start">
              <a href="#" className="hover:text-gray-300 transition-colors" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="#" className="hover:text-gray-300 transition-colors" aria-label="Facebook">
                <Facebook size={20} />
              </a>
              <a href="#" className="hover:text-gray-300 transition-colors" aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="#" className="hover:text-gray-300 transition-colors" aria-label="Email">
                <Mail size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links (Collapsible on Mobile) */}
          <CollapsibleSection title="Quick Links">
            <ul className="space-y-3">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-white transition-colors">Products</Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-white transition-colors">Orders</Link>
              </li>
            </ul>
          </CollapsibleSection>

          {/* Customer Service (Collapsible on Mobile) */}
          <CollapsibleSection title="Customer Service">
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Shipping Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Returns & Exchanges</a></li>
              <li><a href="#" className="hover:text-white transition-colors">FAQs</a></li>
            </ul>
          </CollapsibleSection>

          {/* Newsletter (Always visible, stacked on mobile) */}
          <div className="mt-8 md:mt-0 flex flex-col items-center md:items-start text-center md:text-left">
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