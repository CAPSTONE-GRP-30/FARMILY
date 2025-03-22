import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white p-8">
      <div className="flex justify-between items-start mb-12">
        {/* Logo and Navigation */}
        <div className="space-y-6">
          <div className="flex items-center">
            <img src="/tre.png" alt="Farmily Logo" className="h-10 w-10" />
            <span className="ml-2 font-bold text-white">FARMILY</span>
          </div>
          
          <div className="space-x-6">
            <a href="/about" className="text-white hover:text-green-400">About Us</a>
            <a href="/services" className="text-white hover:text-green-400">Our Services</a>
            <a href="/community" className="text-white hover:text-green-400">Community Posts</a>
            <a href="/help" className="text-white hover:text-green-400">Get Help</a>
          </div>
        </div>
        
        {/* Subscription Form */}
        <div>
          <h3 className="mb-4">Join</h3>
          <div className="flex space-x-2">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="px-4 py-2 bg-transparent border border-gray-600 text-white rounded focus:outline-none focus:border-green-500"
            />
            <button className="px-4 py-2 bg-gray-800 border border-gray-600 rounded text-white hover:bg-gray-700">
              Subscribe
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            By subscribing you agree to our 
            <a href="/privacy" className="text-gray-400 hover:text-green-400 ml-1">Privacy Policy</a>
          </p>
        </div>
      </div>
      
      <hr className="border-gray-700 mb-6" />
      
      {/* Bottom Footer */}
      <div className="flex justify-between items-center">
        <div className="space-x-6">
          <a href="/privacy" className="text-gray-400 text-sm hover:text-green-400">Privacy Policy</a>
          <a href="/terms" className="text-gray-400 text-sm hover:text-green-400">Terms of Service</a>
          <a href="/cookies" className="text-gray-400 text-sm hover:text-green-400">Cookie Settings</a>
        </div>
        <div className="text-gray-400 text-sm">
          © 2025 Farmily. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;