import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useUser } from '../context/UserContext';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  ScatterChart,
  Scatter
} from 'recharts';
import { Loader2, AlertTriangle, InfoIcon } from 'lucide-react';

const FarmYieldVisualization = () => {
  const { currentUser } = useUser();
  const [farmData, setFarmData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('line');

  useEffect(() => {
    const fetchFarmYields = async () => {
      if (!currentUser) {
        setError('No user logged in');
        setLoading(false);
        return;
      }

      try {
        const farmYieldsQuery = query(
          collection(db, 'farmYields'),
          where('userId', '==', currentUser.uid)
        );

        const querySnapshot = await getDocs(farmYieldsQuery);
        
        const yields = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setFarmData(yields);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching farm yields:', err);
        setError('Failed to load farm yield data');
        setLoading(false);
      }
    };

    fetchFarmYields();
  }, [currentUser]);

  // Prepare data for different chart types
  const processedData = farmData.map(farm => ({
    name: `${farm.farmName} (${farm.cropType})`,
    yieldPerAcre: farm.yieldPerAcre,
    totalYield: farm.totalYield,
    acreage: farm.acreage
  }));

  const cropTypeData = farmData.reduce((acc, farm) => {
    const existing = acc.find(item => item.cropType === farm.cropType);
    if (existing) {
      existing.totalYield += farm.totalYield;
      existing.count += 1;
    } else {
      acc.push({
        cropType: farm.cropType,
        totalYield: farm.totalYield,
        count: 1
      });
    }
    return acc;
  }, []);

  // Loading State
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-100 rounded-lg">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading farm yield data...</span>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
        <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
        <div>
          <p className="text-red-700 font-semibold">Error</p>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  // No Data State
  if (farmData.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center">
        <InfoIcon className="h-8 w-8 text-yellow-500 mr-3" />
        <div>
          <p className="text-yellow-700 font-semibold">No Data</p>
          <p className="text-yellow-600">No farm yield data found for this user.</p>
        </div>
      </div>
    );
  }

  // Chart Type Selector
  const ChartTypeSelector = () => (
    <div className="flex justify-center space-x-4 mb-6">
      <button 
        onClick={() => setChartType('line')}
        className={`px-4 py-2 rounded-lg ${
          chartType === 'line' 
            ? 'bg-green-600 text-white' 
            : 'bg-green-100 text-green-800 hover:bg-green-200'
        }`}
      >
        Line Chart
      </button>
      <button 
        onClick={() => setChartType('area')}
        className={`px-4 py-2 rounded-lg ${
          chartType === 'area' 
            ? 'bg-green-600 text-white' 
            : 'bg-green-100 text-green-800 hover:bg-green-200'
        }`}
      >
        Area Chart
      </button>
      <button 
        onClick={() => setChartType('scatter')}
        className={`px-4 py-2 rounded-lg ${
          chartType === 'scatter' 
            ? 'bg-green-600 text-white' 
            : 'bg-green-100 text-green-800 hover:bg-green-200'
        }`}
      >
        Scatter Chart
      </button>
    </div>
  );

  const renderChart = () => {
    switch(chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'Yield', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="yieldPerAcre" stroke="#8884d8" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="totalYield" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'Yield', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="yieldPerAcre" stroke="#8884d8" fill="#8884d8" opacity={0.3} />
              <Area type="monotone" dataKey="totalYield" stroke="#82ca9d" fill="#82ca9d" opacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart>
              <CartesianGrid />
              <XAxis type="number" dataKey="acreage" name="Acreage" />
              <YAxis type="number" dataKey="totalYield" name="Total Yield" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter name="Farm Yields" data={processedData} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 p-4 bg-gray-50">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 pb-4 border-b mb-4">
          Farm Yields Visualization
        </h2>
        <ChartTypeSelector />
        {renderChart()}
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 pb-4 border-b mb-4">
          Crop Type Yield Summary
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={cropTypeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="cropType" />
            <YAxis label={{ value: 'Total Yield', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="totalYield" stroke="#8884d8" />
            <Line type="monotone" dataKey="count" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FarmYieldVisualization;