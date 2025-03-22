import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Splash = () => {
  const [showLogo, setShowLogo] = useState(false);
  const [showText, setShowText] = useState(false);
  const navigate = useNavigate();

  // Nature-like green color
  const themeGreen = '#6EB257';

  useEffect(() => {
    // Animate logo appearance
    const logoTimer = setTimeout(() => {
      setShowLogo(true);
    }, 300);

    // Animate text appearance after logo
    const textTimer = setTimeout(() => {
      setShowText(true);
    }, 1200);

    // Navigate to login screen after animations
    const navigationTimer = setTimeout(() => {
      navigate('/login');
    }, 3000);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(textTimer);
      clearTimeout(navigationTimer);
    };
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-screen bg-white">
      <div className="flex flex-col items-center justify-center">
        {/* Logo with fade-in and slight bounce animation */}
        <div 
          className={`transform transition-all duration-1000 ease-out ${
            showLogo 
              ? 'opacity-100 translate-y-0 scale-100' 
              : 'opacity-0 translate-y-4 scale-95'
          }`}
        >
          <img 
            src="/tre.png" 
            alt="Farmilly Logo" 
            className="w-32 h-32 md:w-40 md:h-40"
          />
        </div>

        {/* Text with fade-in animation */}
        <div 
          className={`mt-4 transition-all duration-1000 ease-out ${
            showText ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <h1 
            style={{ color: themeGreen }}
            className="text-4xl md:text-5xl font-bold tracking-wider"
          >
            FARMILLY
          </h1>
        </div>
      </div>
    </div>
  );
};

export default Splash;