import React from "react";
import { Link } from "react-router-dom";
import { FaInstagram, FaFacebookF, FaTwitter, FaEnvelope } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-black text-white pt-16 pb-8 mt-10 border-t border-gray-700">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">

        {/* Brand + About */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Fifth Beryl</h2>
          <p className="text-gray-400 mb-4">
            Redefining luxury with crafted premium shirts — made for the bold.
          </p>
          <div className="flex space-x-4 text-xl">
            <a href="#" className="hover:text-gray-300"><FaInstagram /></a>
            <a href="#" className="hover:text-gray-300"><FaFacebookF /></a>
            <a href="#" className="hover:text-gray-300"><FaTwitter /></a>
            <a href="mailto:support@fifthberyl.com" className="hover:text-gray-300"><FaEnvelope /></a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold mb-3">QUICK LINKS</h3>
          <ul className="space-y-2 text-gray-400">
            <li><Link to="/" className="hover:text-gray-200">Home</Link></li>
            <li><Link to="/products" className="hover:text-gray-200">Products</Link></li>
            <li><Link to="/orders" className="hover:text-gray-200">Orders</Link></li>
            <li><Link to="/cart" className="hover:text-gray-200">Cart</Link></li>
          </ul>
        </div>

        {/* Customer Service */}
        <div>
          <h3 className="text-lg font-semibold mb-3">CUSTOMER SERVICE</h3>
          <ul className="space-y-2 text-gray-400">
            <li><Link to="/contact" className="hover:text-gray-200">Contact Us</Link></li>
            <li><Link to="/shipping" className="hover:text-gray-200">Shipping Policy</Link></li>
            <li><Link to="/returns" className="hover:text-gray-200">Returns & Exchanges</Link></li>
            <li><Link to="/faq" className="hover:text-gray-200">FAQs</Link></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h3 className="text-lg font-semibold mb-3">NEWSLETTER</h3>
          <p className="text-gray-400 mb-4">
            Subscribe for exclusive deals & early access.
          </p>
          <div className="flex">
            <input
              type="email"
              className="flex-1 px-4 py-2 text-black"
              placeholder="Your email"
            />
            <button className="bg-white text-black px-4 py-2 font-medium hover:bg-gray-200">
              SUBSCRIBE
            </button>
          </div>
        </div>

      </div>

      {/* Bottom line */}
      <div className="text-center text-gray-500 text-sm mt-12 border-t border-gray-700 pt-6">
        © {new Date().getFullYear()} Fifth Beryl — All Rights Reserved.
        <br />
        Designed & Built with ❤️ by Naman.
      </div>
    </footer>
  );
};

export default Footer;
