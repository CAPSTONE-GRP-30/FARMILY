import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Chart } from 'react-chartjs-2';
import { useUser } from '../context/UserContext';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Custom Print Stylesheet Component
const PrintStylesheet = () => (
  <style type="text/css" media="print">
    {`
      @page {
        size: A4;
        margin: 1cm;
      }
      body {
        font-family: 'Arial', sans-serif;
        line-height: 1.6;
        color: #333;
      }
      .print-container {
        width: 100%;
        max-width: 100%;
        margin: 0;
        padding: 0;
      }
      .print-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid #2c7a2c;
        padding-bottom: 10px;
        margin-bottom: 20px;
      }
      .print-logo {
        max-width: 100px;
        max-height: 100px;
      }
      .print-title {
        font-size: 24px;
        color: #2c7a2c;
        margin: 0;
      }
      .print-section {
        margin-bottom: 20px;
        page-break-inside: avoid;
      }
      .print-section-title {
        font-size: 18px;
        color: #2c7a2c;
        border-bottom: 1px solid #2c7a2c;
        padding-bottom: 5px;
        margin-bottom: 10px;
      }
      .print-stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 15px;
      }
      .print-stat-card {
        border: 1px solid #e0e0e0;
        padding: 10px;
        text-align: center;
      }
      .print-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      .print-table th, 
      .print-table td {
        border: 1px solid #e0e0e0;
        padding: 8px;
        text-align: left;
      }
      .print-table thead {
        background-color: #f0f0f0;
      }
      .print-chart {
        max-width: 100%;
        height: auto !important;
        page-break-inside: avoid;
      }
      @media print {
        body * {
          visibility: hidden;
        }
        .print-container, 
        .print-container * {
          visibility: visible;
        }
        .print-container {
          position: absolute;
          left: 0;
          top: 0;
        }
      }
    `}
  </style>
);

const FarmYieldReport = ({ onReportGenerated }) => {
  const { currentUser } = useUser();
  const [farmYields, setFarmYields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch farm yields for the current user
  const fetchFarmYields = async () => {
    if (!currentUser) {
      setError('No authenticated user');
      setLoading(false);
      return;
    }

    try {
      const farmsQuery = query(
        collection(db, 'farmYields'),
        where('userId', '==', currentUser.uid),
        orderBy('year', 'desc')
      );

      const querySnapshot = await getDocs(farmsQuery);
      const yields = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setFarmYields(yields);
      setLoading(false);

      // Optional callback for parent component
      if (onReportGenerated) {
        onReportGenerated(yields);
      }
    } catch (err) {
      console.error('Error fetching farm yields:', err);
      setError('Failed to load farm yield data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmYields();
  }, [currentUser]);

  // Calculate overall statistics
  const calculateStatistics = () => {
    if (farmYields.length === 0) return null;

    const totalAcreage = farmYields.reduce((sum, yieldData) => sum + yieldData.acreage, 0);
    const totalYield = farmYields.reduce((sum, yieldData) => sum + yieldData.totalYield, 0);
    const averageYieldPerAcre = totalYield / totalAcreage;

    return {
      totalAcreage,
      totalYield,
      averageYieldPerAcre,
      cropTypes: [...new Set(farmYields.map(y => y.cropType))],
      years: [...new Set(farmYields.map(y => y.year))]
    };
  };

  // Prepare chart data
  const prepareChartData = () => {
    const cropYieldData = farmYields.reduce((acc, yieldData) => {
      if (!acc[yieldData.cropType]) {
        acc[yieldData.cropType] = [];
      }
      acc[yieldData.cropType].push(yieldData.yieldPerAcre);
      return acc;
    }, {});

    return {
      labels: Object.keys(cropYieldData),
      datasets: [{
        label: 'Yield per Acre by Crop Type',
        data: Object.keys(cropYieldData).map(cropType => 
          cropYieldData[cropType].reduce((a, b) => a + b, 0) / cropYieldData[cropType].length
        ),
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)'
        ]
      }]
    };
  };

  // Print report function
  const handlePrintReport = () => {
    window.print();
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-pulse text-green-600 text-xl">
          Loading farm yield data...
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4" role="alert">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  // Calculate statistics
  const stats = calculateStatistics();

  return (
    <>
      <PrintStylesheet />
      <div className="print-container min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          {/* Print Header */}
          <header className="print-header flex items-center justify-between mb-8 pb-4 border-b-2 border-green-100">
            <div className="flex items-center">
              <img 
                src="/tre.png" 
                alt="FARMILY Logo" 
                className="print-logo h-16 w-16 mr-4"
              />
              <h1 className="print-title text-4xl font-bold text-green-800">FARMILY</h1>
            </div>
            <div className="print-metadata text-right">
              <p className="text-sm text-green-700">Generated: {new Date().toLocaleDateString()}</p>
              <p className="text-sm text-green-700">User: {currentUser?.email}</p>
            </div>
          </header>

          {/* Overall Statistics Section */}
          <div className="print-section">
            <h2 className="print-section-title text-3xl font-semibold text-green-800 mb-6">
              Farm Yield Analysis Report
            </h2>

            {stats && (
              <div className="print-stats-grid grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                  { 
                    title: "Total Acreage", 
                    value: `${stats.totalAcreage.toFixed(2)} acres`, 
                    color: "text-green-600" 
                  },
                  { 
                    title: "Total Yield", 
                    value: `${stats.totalYield.toFixed(2)} units`, 
                    color: "text-emerald-600" 
                  },
                  { 
                    title: "Avg. Yield per Acre", 
                    value: stats.averageYieldPerAcre.toFixed(2), 
                    color: "text-lime-600" 
                  }
                ].map((stat, index) => (
                  <div 
                    key={index} 
                    className="print-stat-card bg-white border border-green-100 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <h3 className="text-lg font-medium text-green-700 mb-2">
                      {stat.title}
                    </h3>
                    <p className={`text-2xl font-bold ${stat.color}`}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detailed Yield Table */}
          <div className="print-section">
            <h2 className="print-section-title text-2xl font-semibold text-green-800 mb-4">
              Detailed Yield Data
            </h2>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="print-table w-full">
                <thead className="bg-green-100">
                  <tr>
                    {[
                      "Farm Name", "Year", "Crop Type", 
                      "Acreage", "Total Yield", "Yield per Acre"
                    ].map((header, index) => (
                      <th 
                        key={index} 
                        className="px-4 py-3 text-left text-green-800 font-semibold"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {farmYields.map(yieldData => (
                    <tr 
                      key={yieldData.id} 
                      className="border-b border-green-100 hover:bg-green-50 transition-colors"
                    >
                      {[
                        yieldData.farmName,
                        yieldData.year,
                        yieldData.cropType,
                        yieldData.acreage,
                        yieldData.totalYield,
                        yieldData.yieldPerAcre.toFixed(2)
                      ].map((value, index) => (
                        <td 
                          key={index} 
                          className="px-4 py-3 text-green-900"
                        >
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Yield Chart Section */}
          <div className="print-section">
            <h2 className="print-section-title text-2xl font-semibold text-green-800 mb-4">
              Crop Yield Analysis
            </h2>
            <div className="print-chart bg-white rounded-lg shadow-md p-6">
              <Chart 
                type="bar"
                data={prepareChartData()}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                      labels: {
                        color: '#2c7a2c'
                      }
                    },
                    title: {
                      display: true,
                      text: 'Average Yield per Acre by Crop Type',
                      color: '#2c7a2c',
                      font: {
                        size: 18
                      }
                    }
                  },
                  scales: {
                    x: {
                      title: {
                        display: true,
                        text: 'Crop Types',
                        color: '#2c7a2c'
                      },
                      ticks: {
                        color: '#2c7a2c'
                      }
                    },
                    y: {
                      title: {
                        display: true,
                        text: 'Yield per Acre',
                        color: '#2c7a2c'
                      },
                      ticks: {
                        color: '#2c7a2c'
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Footer */}
          <footer className="print-section text-center mt-8 pt-4 border-t border-green-100">
            <p className="text-sm text-green-700">
              © {new Date().getFullYear()} FARMILY - Farm Management System
            </p>
          </footer>

          {/* Print Button (hidden during print) */}
          <div className="no-print text-center mt-4">
            <button 
              onClick={handlePrintReport}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Print Report
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FarmYieldReport;