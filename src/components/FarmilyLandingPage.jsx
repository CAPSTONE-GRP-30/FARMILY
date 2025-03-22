import React from 'react';

const FarmilyLandingPage = () => {
  return (
    <>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="grid grid-cols-2 gap-8 p-8 bg-white">
          <div className="col-span-1 flex flex-col justify-center">
            <h1 className="text-4xl font-bold mb-4">Empowering Farmers with Innovative Digital Solutions</h1>
            <p className="text-lg">
              Farmily connects farmers, suppliers, and buyers through seamless communication and efficient farm management. Discover a dedicated marketplace and data-driven insights that transform your agricultural operations.
            </p>
          </div>
          <div className="col-span-1">
            <img src="/images/pexels-pixabay-265216.png" alt="Farmers using digital tools" className="w-full h-full object-cover rounded" />
          </div>
        </div>
      </section>
      
      {/* Transform Section*/}
      <section className="transform-section">
  <div className="relative bg-green-900 text-white py-16">
    <div className="absolute inset-0 overflow-hidden">
      <img src="/images/5.png" alt="Farm field" className="w-full h-full object-cover opacity-30" />
    </div>
    <div className="relative grid grid-cols-2 gap-8 p-8">
      <div className="col-span-1 flex flex-col justify-center">
        <h1 className="text-4xl font-bold mb-4">Transform Your Farming Experience with Farmily</h1>
        <p className="mb-6">
          Farmily connects farmers, suppliers, and buyers through a seamless digital platform, enhancing communication and operational efficiency. Discover a farm experience that brings you the information and tools needed for more informed decision-making.
        </p>
        <div className="flex space-x-4">
          <button className="bg-white text-green-900 font-medium py-2 px-4 rounded">Learn More</button>
          <button className="bg-green-600 text-white font-medium py-2 px-4 rounded">Sign Up</button>
        </div>
      </div>
    </div>
  </div>
</section>
      
      {/* Essential Features Section */}
      <section className="essential-features-section">
        <div className="py-12 px-8 bg-white">
          <h2 className="text-3xl font-bold text-center mb-12">Discover Farmily's Essential Features for Modern Farming Success</h2>
          
          <div className="grid grid-cols-3 gap-8 mb-16">
            <div className="flex flex-col items-center">
              <img src="/images/an-illustration-of-a-web-of-interconnect_uEWmpjfPTwmOR1vI44vZRQ_ev0LYGB5SHqavyIkgxYBAA 1.png" alt="Communication" className="w-full h-48 object-cover rounded mb-4" />
              <h3 className="text-lg font-bold text-center mb-2">Streamlined Communication for Efficient Farm Management</h3>
              <p className="text-center text-gray-600 mb-4">Our messaging system connects farmers, suppliers, and buyers in real-time.</p>
              <button className="border border-green-600 text-green-600 px-4 py-1 rounded">Learn More</button>
            </div>
            
            <div className="flex flex-col items-center">
              <img src="/images/Placeholder Image (15).png" alt="Marketplace" className="w-full h-48 object-cover rounded mb-4" />
              <h3 className="text-lg font-bold text-center mb-2">Marketplace for Buying and Selling Agricultural Goods</h3>
              <p className="text-center text-gray-600 mb-4">Easily buy and sell tools, seeds, and fertilizers with our dedicated marketplace.</p>
              <button className="border border-green-600 text-green-600 px-4 py-1 rounded">Shop Now</button>
            </div>
            
            <div className="flex flex-col items-center">
              <img src="/images/Placeholder Image-6.png" alt="Crop Tracking" className="w-full h-48 object-cover rounded mb-4" />
              <h3 className="text-lg font-bold text-center mb-2">Crop Tracking and Forecasting for Informed Decisions</h3>
              <p className="text-center text-gray-600 mb-4">Track crop health and receive climate-based recommendations for optimal growth.</p>
              <button className="border border-green-600 text-green-600 px-4 py-1 rounded">Explore</button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-8">
            <div className="flex flex-col justify-center">
              <h3 className="text-2xl font-bold mb-4">Empowering Farmers Through Seamless Communication</h3>
              <p className="text-gray-600 mb-6">Our secure messaging system fosters real-time connections between farmers, suppliers, and buyers. Experience efficient coordination and collaboration like never before.</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="font-bold mb-2">Real-Time Interaction</h4>
                  <p className="text-sm text-gray-600">Direct messages enable collaboration without friction on the internet and encrypted.</p>
                </div>
                <div>
                  <h4 className="font-bold mb-2">Multimedia Sharing</h4>
                  <p className="text-sm text-gray-600">Share images and photos to present evidence and share growing styles.</p>
                </div>
              </div>
              
              <button className="bg-green-600 text-white px-4 py-2 rounded w-32">Learn More</button>
            </div>
            
            <div className="relative">
              <img src="/images/Placeholder Image (2).png" alt="Messaging interface" className="w-full h-full object-cover rounded" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white bg-opacity-90 p-3 rounded-lg shadow-lg max-w-xs">
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-8">
  <div className="grid grid-cols-2 gap-8">
    {/* Image - Left Side */}
    <div className="flex items-center justify-center">
      <img src="/images/Placeholder Image (14).png" alt="Farm Management Tools" className="w-full h-auto rounded-lg shadow-lg" />
    </div>
    
    {/* Text Content - Right Side */}
    <div className="flex flex-col justify-center">
      <h3 className="text-2xl font-bold mb-4">Streamline Your Farm Management with Our Innovative Tools and Features</h3>
      <p className="text-gray-600 mb-6">Our efficient farm management tools empower farmers to design tasks, set deadlines, and receive timely reminders. This ensures that every aspect of farm activities is organized and on track.</p>
      
      <div className="grid grid-cols-1 gap-4">
        <div className="flex items-start space-x-3">
          <div className="bg-green-600 p-1 rounded text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h4 className="font-bold">Task Assignment</h4>
            <p className="text-sm text-gray-600">Easily assign tasks to your team and monitor progress for optimal productivity.</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <div className="bg-green-600 p-1 rounded text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div>
            <h4 className="font-bold">Automated Reminders</h4>
            <p className="text-sm text-gray-600">Receive automatic reminders to ensure important tasks are completed.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
        </div>
      </section>
      
      {/* Communication Section */}
      <section className="communication-section">
        <div className="bg-gray-50 py-12">
          <div className="grid grid-cols-2 gap-8 px-8">
            <div className="col-span-1">
              <img src="/images/Placeholder Image (13).png" alt="Farmers with drones" className="w-full h-full object-cover rounded" />
            </div>
            
            <div className="col-span-1 flex flex-col justify-center">
              <div className="text-green-600 font-medium mb-2">Empower</div>
              <h2 className="text-3xl font-bold mb-4">Transform Your Farming Experience with Farmily</h2>
              <p className="text-gray-600 mb-6">
                Farmily connects farmers, suppliers, and buyers through seamless communication and efficient management tools. Experience enhanced productivity and streamlined operations with our comprehensive digital solutions.
              </p>
              <button className="bg-green-600 text-white px-4 py-2 rounded w-32">Learn More</button>
            </div>
          </div>
          
          <div className="py-12 px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Discover How Farmily Transforms Farming with Innovative Digital Solutions</h2>
            
            <div className="grid grid-cols-3 gap-8 mb-16">
              <div className="flex flex-col items-center">
                <img src="/images/Placeholder Image-7.png" alt="Platform guide" className="w-full h-48 object-cover rounded mb-4" />
                <h3 className="text-lg font-bold text-center mb-2">A Step-by-Step Guide to Using Farmily's Platform Effectively</h3>
                <p className="text-center text-gray-600 mb-4">Start your journey by registering on our user-friendly platform.</p>
                <button className="bg-green-600 text-white px-4 py-1 rounded">Sign Up</button>
              </div>
              
              <div className="flex flex-col items-center">
                <img src="/images/Placeholder Image-3 (4).png" alt="Features" className="w-full h-48 object-cover rounded mb-4" />
                <h3 className="text-lg font-bold text-center mb-2">Utilize Our Features to Maximize Your Farming Efficiency and Success</h3>
                <p className="text-center text-gray-600 mb-4">Explore our messaging system, marketplace, and task management tools to streamline operations.</p>
                <button className="bg-green-600 text-white px-4 py-1 rounded">Learn More</button>
              </div>
              
              <div className="flex flex-col items-center">
                <img src="/images/Placeholder Image-4 (2).png" alt="Community" className="w-full h-48 object-cover rounded mb-4" />
                <h3 className="text-lg font-bold text-center mb-2">Join Our Community for Support, Insights, and Best Practices in Farming</h3>
                <p className="text-center text-gray-600 mb-4">Engage with fellow farmers and experts to enhance your agricultural knowledge.</p>
                <button className="bg-green-600 text-white px-4 py-1 rounded">Join Now</button>
              </div>
            </div>
          </div>
          
          <div className="py-12 px-8 bg-white">
  <div className="grid grid-cols-2 gap-8 items-center">
    {/* Text Content - Left Side */}
    <div className="flex flex-col">
      <div className="flex items-start mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>
      <h2 className="text-3xl font-bold mb-4">Your One-Stop Marketplace for Farming Needs</h2>
      <p className="text-gray-600 mb-6">
        Discover a dedicated marketplace designed specifically for farmers. Buy and sell equipment, seeds, fertilizers, and farm produce with ease and confidence.
      </p>
      <div className="flex">
        <button className="bg-green-600 text-white px-4 py-2 rounded">Learn More</button>
      </div>
    </div>
    
    {/* Image - Right Side */}
    <div className="flex items-center justify-center">
      <img src="/images/Placeholder Image-1 (2).png" alt="Marketplace" className="w-full h-auto object-cover rounded shadow-lg" />
    </div>
  </div>
</div>
        </div>
      </section>
    </>
  );
};

export default FarmilyLandingPage;