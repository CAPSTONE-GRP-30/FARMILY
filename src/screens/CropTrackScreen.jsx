import React, { useState } from 'react';
import CropGrowthTracker from '../components/CropGrowthTracker';
import WeatherForecast from '../components/WeatherForecast';
import CropDetectionComponent from '../components/CropDetectionComponent';

const CropTrackScreen = () => {
  const [activeTab, setActiveTab] = useState('crop');
  const [currentFarmId, setCurrentFarmId] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);

  // Handle farm changes to keep consistent between tabs
  const handleFarmChange = (farmId) => {
    setCurrentFarmId(farmId);
  };

  // Handle detection results from the CropDetectionComponent
  const handleDetectionComplete = (result) => {
    setDetectionResult(result);
    console.log(result);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header with Logo and App Name */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/tre.png" alt="Farmily Logo" className="h-10 w-auto" />
            <h1 className="text-2xl font-bold text-green-700">Farmily</h1>
          </div>
          
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800">Farm Monitoring Dashboard</h2>
          <p className="text-gray-600 mt-1">Track crop growth and weather conditions for optimal farming</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-3 px-6 font-medium transition-colors duration-200 relative ${
              activeTab === 'crop'
                ? 'text-green-700 font-medium'
                : 'text-gray-500 hover:text-green-600'
            }`}
            onClick={() => setActiveTab('crop')}
          >
            <div className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span>Crop Growth</span>
            </div>
            {activeTab === 'crop' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600"></div>}
          </button>
          
          <button
            className={`py-3 px-6 font-medium transition-colors duration-200 relative ${
              activeTab === 'weather'
                ? 'text-green-700 font-medium'
                : 'text-gray-500 hover:text-green-600'
            }`}
            onClick={() => setActiveTab('weather')}
          >
            <div className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
              <span>Weather Forecast</span>
            </div>
            {activeTab === 'weather' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600"></div>}
          </button>

          <button
            className={`py-3 px-6 font-medium transition-colors duration-200 relative ${
              activeTab === 'detection'
                ? 'text-green-700 font-medium'
                : 'text-gray-500 hover:text-green-600'
            }`}
            onClick={() => setActiveTab('detection')}
          >
            <div className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Disease Detection</span>
            </div>
            {activeTab === 'detection' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600"></div>}
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          {activeTab === 'crop' && (
            <CropGrowthTracker onFarmChange={handleFarmChange} />
          )}
          
          {activeTab === 'weather' && (
            <WeatherForecast farmId={currentFarmId} />
          )}

          {activeTab === 'detection' && (
            <div className="p-4">
              <CropDetectionComponent onDetectionComplete={handleDetectionComplete} />
              
              {/* Optional: Display additional information based on detection results */}
              {detectionResult && (
                <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Recent Detection Results</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {new Date().toLocaleString()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      detectionResult.prediction === 'healthy' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {detectionResult.prediction.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Optional Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-500 text-center">© 2025 Farmily. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default CropTrackScreen;