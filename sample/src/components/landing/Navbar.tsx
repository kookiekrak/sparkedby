import { useState } from 'react';
import { Menu, X } from 'lucide-react';

/**
 * Navbar Component
 * 
 * A simple navigation bar that can be customized with your brand colors and links.
 * 
 * Configuration:
 * - Set VITE_COMPANY_NAME in .env file to customize the company name
 * - Set VITE_PRIMARY_COLOR and VITE_SECONDARY_COLOR for color scheme
 */
const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white/90 backdrop-blur-sm fixed w-full z-50 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo/Brand Name */}
        <div className="flex items-center">
          <span 
            className="text-2xl font-bold bg-clip-text text-transparent"
            style={{ background: `linear-gradient(to right, ${import.meta.env.VITE_PRIMARY_COLOR || '#3b82f6'}, ${import.meta.env.VITE_SECONDARY_COLOR || '#a855f7'})` }}
          >
            {import.meta.env.VITE_COMPANY_NAME || 'Your Brand'}
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors">
            Features
          </a>
          <a href="#about" className="text-gray-700 hover:text-blue-600 transition-colors">
            About
          </a>
          <a href="#contact" className="text-gray-700 hover:text-blue-600 transition-colors">
            Contact
          </a>
          <a href="#faq" className="text-gray-700 hover:text-blue-600 transition-colors">
            FAQ
          </a>
          <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full hover:shadow-lg transition-all duration-300 font-medium">
            Early Access
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-gray-700 focus:outline-none"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white animate-fade-in">
          <div className="container mx-auto px-4 py-3 flex flex-col space-y-4">
            <a
              href="#features"
              className="text-gray-700 hover:text-blue-600 transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-gray-700 hover:text-blue-600 transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              How It Works
            </a>
            <a
              href="#templates"
              className="text-gray-700 hover:text-blue-600 transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Templates
            </a>
            <a
              href="#faq"
              className="text-gray-700 hover:text-blue-600 transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              FAQ
            </a>
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full hover:shadow-lg transition-all duration-300 font-medium w-full">
              Early Access
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
