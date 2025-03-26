import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FarmYieldLogger from '../components/FarmYieldLogger';
import FarmYieldVisualization from '../components/FarmYieldVisualization';
import FarmYieldReport from '../components/FarmYieldReport';

const ProductInsightsDashboard = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState('yieldLogger');

  // Tab navigation component
  const TabNavigation = () => {
    const tabStyles = {
      container: "flex justify-center mb-8 bg-white shadow-md rounded-full p-1 mx-auto max-w-xl",
      base: "px-6 py-3 text-sm font-semibold tracking-wider uppercase transition-all duration-300 rounded-full",
      active: "bg-green-600 text-white shadow-lg",
      inactive: "text-green-800 hover:bg-green-50 hover:text-green-700"
    };

    return (
      <div className={tabStyles.container}>
        <button
          onClick={() => setActiveTab('yieldLogger')}
          className={`${tabStyles.base} ${
            activeTab === 'yieldLogger' ? tabStyles.active : tabStyles.inactive
          }`}
        >
          Yield Logger
        </button>
        <button
          onClick={() => setActiveTab('visualization')}
          className={`${tabStyles.base} ${
            activeTab === 'visualization' ? tabStyles.active : tabStyles.inactive
          }`}
        >
          Visualization
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`${tabStyles.base} ${
            activeTab === 'report' ? tabStyles.active : tabStyles.inactive
          }`}
        >
          Yield Report
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-green-50 flex flex-col">
      <Navbar />
      
      <div className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
        <div className="bg-white shadow-2xl rounded-3xl overflow-hidden border-2 border-green-100">
          {/* Page Header */}
          <div className="bg-green-600 text-white py-6 px-8">
            <h1 className="text-4xl font-extrabold tracking-tight text-center">
              Production Insights Platform
            </h1>
            <p className="text-center mt-2 text-green-100">
              Empowering Farmers with Data-Driven Solutions
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="py-8 px-4">
            <TabNavigation />
            
            {/* Dynamic Tab Content */}
            <div className="rounded-2xl overflow-hidden">
              {activeTab === 'yieldLogger' && <FarmYieldLogger />}
              {activeTab === 'visualization' && <FarmYieldVisualization />}
              {activeTab === 'report' && <FarmYieldReport currentUser={{uid: 'demo-user'}} />}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductInsightsDashboard;