import { useState } from 'react';
import { Menu, X, DollarSign } from 'lucide-react';

/**
 * Navbar Component for FriendSplit
 * 
 * A fun, friendly navigation bar for the expense sharing app.
 */
const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-teal-50/90 backdrop-blur-sm fixed w-full z-50 shadow-sm border-b-2 border-teal-300">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo/Brand Name */}
        <div className="flex items-center">
          <div className="flex items-center gap-2">  
            <DollarSign className="h-7 w-7 text-teal-500" />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-emerald-600">
              FriendSplit
            </span>
          </div>
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
