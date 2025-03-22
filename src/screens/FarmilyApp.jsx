import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import FeaturesSection from '../components/FeaturesSection';
import Footer from '../components/Footer';
import FarmilyLandingPage from '../components/FarmilyLandingPage';
import FarmingMarketplace from '../components/FarmingMarketplace';

const FarmilyApp = () => {
  const [activeSection, setActiveSection] = useState('landing');
  const [contentHeight, setContentHeight] = useState(500); // Default height
  
  // Auto-switching effect with 5-second timer
  useEffect(() => {
    const intervalId = setInterval(() => {
      setActiveSection(prev => prev === 'landing' ? 'marketplace' : 'landing');
    }, 8000); // 5000ms = 5 seconds
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Update content height when active section changes
  useEffect(() => {
    // Small delay to ensure the content has rendered
    const timer = setTimeout(() => {
      const activeElement = document.querySelector(`.${activeSection}-content`);
      if (activeElement) {
        setContentHeight(activeElement.offsetHeight);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [activeSection]);

  return (
    <div className="farmily-app">
      <Navbar />
      
      {/* Features section */}
      <FeaturesSection />
      
      {/* Improved horizontal sliding container with dynamic height */}
      <div className="slider-container" style={{ 
        position: 'relative',
        width: '100%',
        height: `${contentHeight}px`, // Dynamic height based on content
        marginBottom: '20px',
        overflow: 'hidden' // Hidden overflow for sliding effect
      }}>
        {/* Landing page component */}
        <div
          className="landing-content"
          style={{
            position: 'absolute',
            width: '100%',
            transition: 'transform 0.8s ease-in-out, opacity 0.5s ease-in-out',
            transform: `translateX(${activeSection === 'landing' ? '0%' : '-100%'})`,
            opacity: activeSection === 'landing' ? 1 : 0,
            visibility: activeSection === 'landing' ? 'visible' : 'hidden'
          }}
        >
          <FarmilyLandingPage />
        </div>
        
        {/* Marketplace component */}
        <div
          className="marketplace-content"
          style={{
            position: 'absolute',
            width: '100%',
            transition: 'transform 0.8s ease-in-out, opacity 0.5s ease-in-out',
            transform: `translateX(${activeSection === 'marketplace' ? '0%' : '100%'})`,
            opacity: activeSection === 'marketplace' ? 1 : 0,
            visibility: activeSection === 'marketplace' ? 'visible' : 'hidden'
          }}
        >
          <FarmingMarketplace />
        </div>
      </div>
      
      {/* Improved navigation dots */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        margin: '20px 0'
      }}>
        <button 
          onClick={() => setActiveSection('landing')}
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            margin: '0 5px',
            background: activeSection === 'landing' ? '#333' : '#ccc',
            border: 'none',
            cursor: 'pointer'
          }}
          aria-label="View landing page"
        />
        <button 
          onClick={() => setActiveSection('marketplace')}
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            margin: '0 5px',
            background: activeSection === 'marketplace' ? '#333' : '#ccc',
            border: 'none',
            cursor: 'pointer'
          }}
          aria-label="View marketplace"
        />
      </div>
      
      <Footer />
    </div>
  );
};

export default FarmilyApp;