import React, { useState, useRef, useEffect } from 'react';
import { Search, User, X } from 'lucide-react';
import { useUser } from '../context/UserContext'; 
import { Link } from 'react-router-dom';

const Navbar = () => {
  // State for managing dropdowns and search
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Refs for handling clicks outside dropdowns
  const userDropdownRef = useRef(null);
  const servicesDropdownRef = useRef(null);
  const searchRef = useRef(null);
  
  // Use the custom hook to access user context
  const { userProfile, isAuthenticated, loading } = useUser();
  
  // Get user details from profile or use fallbacks
  const displayName = userProfile?.displayName || userProfile?.name || "Guest";
  const email = userProfile?.email || "No email available";
  const username = userProfile?.username || "No username";

  // Handle clicks outside dropdowns to close them
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
      if (servicesDropdownRef.current && !servicesDropdownRef.current.contains(event.target)) {
        setServicesDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target) && searchExpanded) {
        setSearchExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchExpanded]);

  // Toggle user dropdown
  const toggleUserDropdown = () => {
    setUserDropdownOpen(!userDropdownOpen);
  };

  // Toggle services dropdown
  const toggleServicesDropdown = () => {
    setServicesDropdownOpen(!servicesDropdownOpen);
  };

  // Toggle search bar expansion
  const toggleSearch = () => {
    setSearchExpanded(!searchExpanded);
    if (!searchExpanded) {
      // Focus the search input when expanded
      setTimeout(() => {
        document.getElementById('search-input')?.focus();
      }, 100);
    }
  };

  // Handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Implement search functionality here
    console.log('Searching for:', searchQuery);
    // Optional: collapse search after submission
    // setSearchExpanded(false);
    // setSearchQuery('');
  };

  return (
    <nav className="flex items-center justify-between bg-gray-900 text-white p-4">
      <div className="flex items-center space-x-8">
        <div className="flex items-center">
          <img src="/tre.png" alt="Farmily Logo" className="h-10 w-10" />
          <span className="ml-2 font-bold text-white">FARMILY</span>
        </div>
        
        <div className="space-x-6">
          <Link to="/screens/FarmilyApp" className="text-green-500 hover:text-green-400">Home</Link>
          
          {/* Services dropdown */}
          <div ref={servicesDropdownRef} className="relative inline-block">
            <button 
              onClick={toggleServicesDropdown}
              className="text-white hover:text-green-400 focus:outline-none"
            >
              Services <span className="text-xs">▼</span>
            </button>
            
            {servicesDropdownOpen && (
              <div className="absolute left-0 mt-2 w-40 bg-gray-800 rounded-md shadow-lg z-10 py-2">
                <Link to="/market" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                  Market
                </Link>
                <Link to="/chat" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                  Chat
                </Link>
                <Link to="/video-call" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                  Call
                </Link>
                <Link to="/crop-tracking" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                  Crop Tracking
                </Link>
              </div>
            )}
          </div>
          
          <Link to="/about" className="text-white hover:text-green-400">About Us</Link>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Expandable Search Bar */}
        <div ref={searchRef} className={`relative transition-all duration-300 ${searchExpanded ? 'w-64' : 'w-8'}`}>
          {searchExpanded ? (
            <form onSubmit={handleSearchSubmit} className="flex items-center bg-gray-800 rounded-full overflow-hidden">
              <input
                id="search-input"
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-800 text-white w-full py-1 px-4 focus:outline-none"
                placeholder="Search..."
              />
              <button type="button" onClick={toggleSearch} className="p-2 text-gray-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <button onClick={toggleSearch} className="text-white hover:text-green-400">
              <Search className="h-5 w-5" />
            </button>
          )}
        </div>
        
        {/* User Profile / Login Button */}
        <div ref={userDropdownRef} className="relative">
          {loading ? (
            // Show loading state while user data is being fetched
            <div className="flex items-center bg-gray-700 rounded-full p-1 px-3">
              <User className="h-5 w-5 text-white mr-2" />
              <span className="text-white">Loading...</span>
            </div>
          ) : isAuthenticated ? (
            // Show user profile when authenticated with dropdown
            <>
              <button 
                onClick={toggleUserDropdown}
                className="flex items-center bg-green-500 rounded-full p-1 px-3 hover:bg-green-600 transition-colors"
              >
                <User className="h-5 w-5 text-white mr-2" />
                <span className="text-white">{displayName}</span>
              </button>
              
              {/* User Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-md shadow-lg z-10 py-2">
                  <div className="px-4 py-3 border-b border-gray-700">
                    <p className="text-sm font-medium text-white">{displayName}</p>
                    <p className="text-xs text-gray-400 mt-1">{email}</p>
                    <p className="text-xs text-gray-400 mt-1">@{username}</p>
                  </div>
                  <Link to="/profile" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                    Your Profile
                  </Link>
                  <Link to="/settings" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                    Settings
                  </Link>
                  <Link to="/logout" className="block px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300">
                    Sign out
                  </Link>
                </div>
              )}
            </>
          ) : (
            // Show login button when not authenticated
            <Link to="/login" className="flex items-center bg-green-500 rounded-full p-1 px-3 hover:bg-green-600 transition-colors">
              <User className="h-5 w-5 text-white mr-2" />
              <span className="text-white">Login</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;