import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebaseConfig'; 

const FarmYieldLogger = ({ onSubmitSuccess, onSubmitError, className }) => {
  const { currentUser } = useUser();
  const [yieldData, setYieldData] = useState({
    farmName: '',
    year: new Date().getFullYear(),
    cropType: '',
    acreage: '',
    totalYield: '',
    yieldPerAcre: '',
    irrigation: 'No',
    fertilizerUsed: '',
    additionalNotes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setYieldData(prev => ({
      ...prev,
      [name]: value,
      // Dynamically calculate yield per acre if both total yield and acreage are provided
      ...(name === 'totalYield' || name === 'acreage' 
        ? { 
            yieldPerAcre: yieldData.acreage && value 
              ? (parseFloat(value) / parseFloat(yieldData.acreage)).toFixed(2) 
              : '' 
          } 
        : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate user is logged in
    if (!currentUser) {
      const errorMsg = 'You must be logged in to log farm yields';
      setSubmitError(errorMsg);
      onSubmitError?.(errorMsg);
      return;
    }

    // Reset previous states
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      // Prepare data for Firestore
      const yieldEntry = {
        userId: currentUser.uid,
        farmName: yieldData.farmName,
        year: parseInt(yieldData.year),
        cropType: yieldData.cropType,
        acreage: parseFloat(yieldData.acreage),
        totalYield: parseFloat(yieldData.totalYield),
        yieldPerAcre: parseFloat(yieldData.yieldPerAcre),
        irrigation: yieldData.irrigation,
        fertilizerUsed: yieldData.fertilizerUsed,
        additionalNotes: yieldData.additionalNotes,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      };

      // Add document to Firestore
      const docRef = await addDoc(collection(db, 'farmYields'), yieldEntry);

      // Reset form and show success
      setYieldData({
        farmName: '',
        year: new Date().getFullYear(),
        cropType: '',
        acreage: '',
        totalYield: '',
        yieldPerAcre: '',
        irrigation: 'No',
        fertilizerUsed: '',
        additionalNotes: ''
      });
      
      setSubmitSuccess(true);
      onSubmitSuccess?.(docRef.id);
      console.log('Yield data logged with ID:', docRef.id);
    } catch (error) {
      console.error('Error logging yield data:', error);
      const errorMsg = 'Failed to log yield data. Please try again.';
      setSubmitError(errorMsg);
      onSubmitError?.(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`bg-green-50 flex items-center justify-center p-6 ${className}`}>
      <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl border-2 border-green-600 overflow-hidden">
        <div className="bg-green-600 text-white py-4 text-center">
          <h1 className="text-2xl font-bold">Crop Yield Logger</h1>
        </div>
        
        {/* Error handling */}
        {submitError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{submitError}</span>
          </div>
        )}

        {/* Success message */}
        {submitSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">Yield data logged successfully!</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Farm Name</label>
            <input
              type="text"
              name="farmName"
              value={yieldData.farmName}
              onChange={handleInputChange}
              placeholder="Enter your farm name"
              required
              className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <input
              type="number"
              name="year"
              value={yieldData.year}
              onChange={handleInputChange}
              min="2000"
              max="2050"
              required
              className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Crop Type</label>
            <input
              type="text"
              name="cropType"
              value={yieldData.cropType}
              onChange={handleInputChange}
              placeholder="Enter your crop type (e.g., Wheat, Rice, Corn)"
              required
              className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Total Acreage</label>
            <input
              type="number"
              name="acreage"
              value={yieldData.acreage}
              onChange={handleInputChange}
              placeholder="Total acres cultivated"
              step="0.1"
              min="0"
              required
              className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Total Yield (in bushels)</label>
            <input
              type="number"
              name="totalYield"
              value={yieldData.totalYield}
              onChange={handleInputChange}
              placeholder="Total crop yield"
              step="0.1"
              min="0"
              required
              className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Yield per Acre (auto-calculated)</label>
            <input
              type="number"
              name="yieldPerAcre"
              value={yieldData.yieldPerAcre}
              readOnly
              placeholder="Calculated yield per acre"
              className="w-full px-3 py-2 border border-green-300 rounded-md bg-green-50 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Irrigation</label>
            <select
              name="irrigation"
              value={yieldData.irrigation}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="No">No Irrigation</option>
              <option value="Yes">Irrigated</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fertilizer Used</label>
            <input
              type="text"
              name="fertilizerUsed"
              value={yieldData.fertilizerUsed}
              onChange={handleInputChange}
              placeholder="Type of fertilizer used"
              className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
            <textarea
              name="additionalNotes"
              value={yieldData.additionalNotes}
              onChange={handleInputChange}
              placeholder="Any additional information about your crop"
              className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              rows="3"
            />
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            className={`w-full py-3 rounded-md transition-colors duration-300 font-bold text-lg ${
              submitting 
                ? 'bg-green-400 cursor-not-allowed' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {submitting ? 'Logging Data...' : 'Submit Yield Data'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FarmYieldLogger;