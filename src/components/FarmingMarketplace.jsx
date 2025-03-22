import React from 'react';
import { Search, ShoppingCart, Filter, Shield, CheckCircle, ThumbsUp, Users } from 'lucide-react';

const FarmingMarketplace = () => {
  return (
    <div className="w-full mx-auto font-sans">
    {/* Hero Section */}
  <div className="relative w-full h-72 bg-green-800 overflow-hidden mb-20">
        {/* Background Image */}
          <img 
            src="/images/section 03.png" 
            alt="Farming background" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Overlay */}
    <div className="absolute inset-0 bg-black opacity-40"></div>
    {/* Content */}
    <div className="absolute inset-0 flex flex-col justify-center px-8 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold text-white mb-3">Your Farming Marketplace</h1>
      <p className="text-lg text-white opacity-90">Connecting buyers and marketplace providers in your local area and beyond</p>
    </div>
  </div>

      {/* Content Container */}
      <div className="max-w-6xl mx-auto">
  {/* First Section - One-Stop Marketplace */}
  <div className="flex flex-col md:flex-row gap-12 px-6 mb-24">
    {/* Text Content - Left Side */}
    <div className="flex-1">
      <h2 className="text-2xl font-bold mb-4">Your One-Stop Marketplace for All Farming Needs and Supplies</h2>
      <p className="text-gray-700 mb-8">Discover a vibrant marketplace designed for farmers. Buy and sell seeds, fertilizers, tools, and products with ease.</p>
      
      <div className="flex gap-16 mt-8">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 bg-green-100 rounded-md flex items-center justify-center mb-3">
            <Search className="w-7 h-7 text-green-600" />
          </div>
          <h3 className="font-medium mb-2">Easy Search</h3>
          <p className="text-sm text-gray-600 text-center max-w-xs">Find everything you need to improve your farming operations in one place</p>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 bg-green-100 rounded-md flex items-center justify-center mb-3">
            <Shield className="w-7 h-7 text-green-600" />
          </div>
          <h3 className="font-medium mb-2">Trusted Transactions</h3>
          <p className="text-sm text-gray-600 text-center max-w-xs">Connect with verified sellers to secure quality, verified transactions you can trust</p>
        </div>
      </div>
    </div>
    
    {/* Image - Right Side */}
    <div className="flex-1 flex items-center justify-center">
      <img src="/images/Placeholder Image (9).png" alt="Marketplace fresh produce" className="rounded-md w-full object-cover" />
    </div>
  </div>

        {/* Second Section - Product Search */}
        <div className="px-6 mb-24">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
    {/* Text Content - Left Side */}
    <div className="flex flex-col justify-center">
      <h2 className="text-2xl font-bold mb-4">Discover Products Effortlessly with Our Advanced Search and Filter Features</h2>
      <p className="text-gray-700 mb-10">Try a marketplace filled with intuitive search and filter systems to streamline your buying experience. Easily find the crops, seeds, and fertilizers you need with just a few clicks.</p>
      
      <div className="space-y-8">
        <div>
          <h3 className="font-medium mb-3">Smart Filtering</h3>
          <p className="text-sm text-gray-600">Narrow down your product search by category, price, and seller ratings</p>
        </div>
        
        <div>
          <h3 className="font-medium mb-3">User-Friendly Search</h3>
          <p className="text-sm text-gray-600">Quality search options with our powerful search bar and intuitive suggestions</p>
        </div>
      </div>
    </div>
    
    {/* Image - Right Side */}
    <div className="flex items-center justify-center">
      <img src="/images/Placeholder Image (3).png" alt="Search and filter interface" className="rounded-md w-full h-auto object-cover shadow-lg" />
    </div>
  </div>
</div>

        {/* Third Section - Verified Sellers */}
        <div className="flex flex-col md:flex-row gap-12 px-6 mb-24">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-4">Trustworthy Transactions with Verified Seller Profiles in Our Marketplace</h2>
            <p className="text-gray-700 mb-8">Our marketplace features certified seller profiles and secure systems which enables safe transactions. The verification steps and ratings promote reliability giving you peace of mind when buying or selling.</p>
            
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <p className="text-sm text-gray-700">100% ID and business verification</p>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <p className="text-sm text-gray-700">Customer-led trusted sellers and buyer ratings</p>
            </div>
            
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <p className="text-sm text-gray-700">Each farmer's profile shows all previous marketplace interactions</p>
            </div>
          </div>
          
          <div className="flex-1">
            <img src="/images/Placeholder Image (8).png" alt="Verified seller profile interface" className="rounded-md w-full" />
          </div>
        </div>

        {/* List and Buy Section */}
        <div className="bg-gray-50 py-16 px-6 mb-24">
          <h2 className="text-2xl font-bold text-center mb-3">Discover, List, and Buy with Ease</h2>
          <p className="text-center text-gray-700 mb-16 max-w-3xl mx-auto">Our marketplace connects farmers and consumers directly to each other. Follow these simple steps to navigate through listings and make purchases efficiently.</p>
          
          <div className="flex flex-col md:flex-row gap-12 justify-between mb-16">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <span className="font-medium">1</span>
              </div>
              <h3 className="font-medium mb-3">Step 1: Listing Your Products</h3>
              <p className="text-sm text-gray-600">Easily create a listing by entering product details and photos to showcase your produce</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <span className="font-medium">2</span>
              </div>
              <h3 className="font-medium mb-3">Step 2: Browsing Available Products</h3>
              <p className="text-sm text-gray-600">Filter items and filter features to find what you need</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <span className="font-medium">3</span>
              </div>
              <h3 className="font-medium mb-3">Step 3: Making a Purchase</h3>
              <p className="text-sm text-gray-600">Select your items and proceed to checkout securely</p>
            </div>
          </div>
          
          <div className="flex justify-center gap-6">
            <button className="px-6 py-2 border border-green-600 text-green-600 rounded-md">No</button>
            <button className="px-6 py-2 bg-green-600 text-white rounded-md">Yes</button>
          </div>
        </div>

        {/* Unlock Potential Section */}
        <div className="flex flex-col md:flex-row gap-12 px-6 mb-24">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-4">Unlock Your Farming Potential with Our Marketplace</h2>
            <p className="text-gray-700 mb-8">Our marketplace connects farmers, suppliers, and buyers, streamlining transactions for all. Discover a wide range of products related to your agricultural needs, ensuring quality and reliability.</p>
            
            <button className="px-6 py-2 bg-green-600 text-white rounded-md">Learn More</button>
          </div>
          
          <div className="flex-1">
            <img src="/images/Placeholder Image (16).png" alt="Farmer's market with produce" className="rounded-md w-full" />
          </div>
        </div>

        {/* Testimonial Section */}
        <div className="px-6 mb-24">
  <div className="flex flex-col md:flex-row items-center gap-8">
    {/* Image - Left Side */}
    <div className="w-full md:w-1/3 flex justify-center">
      <div className="relative w-full max-w-md">
        <img src="/images/unsplash_ydi3ulD5pIE.png" alt="Customer illustration" className="w-full h-auto" />
      </div>
    </div>
    
    {/* Text Content - Right Side */}
    <div className="w-full md:w-2/3 flex flex-col items-center md:items-start">
      <div className="flex mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <div key={star} className="text-green-500 text-xl">★</div>
        ))}
      </div>
      
      <p className="text-center md:text-left text-gray-700 mb-4 max-w-xl">
        "This marketplace has transformed how I source supplies. I can find everything I need in one place, and the seller verification gives me peace of mind."
      </p>
      
      <div className="text-center md:text-left">
        <p className="font-medium">John Doe</p>
        <p className="text-sm text-gray-600">Farmers Acres, Boston</p>
      </div>
    </div>
  </div>
</div>

        {/* CTA Section */}
        <div className="px-6 mb-20">
          <h2 className="text-2xl font-bold mb-4">Join Our Vibrant Marketplace Today</h2>
          <p className="text-gray-700 mb-8">Start buying and selling farm essentials with ease—connect with trusted sellers and buyers now!</p>
          
          <div className="flex gap-6">
            <button className="px-6 py-2 bg-green-600 text-white rounded-md">Register</button>
            <button className="px-6 py-2 border border-green-600 text-green-600 rounded-md">Login</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmingMarketplace;