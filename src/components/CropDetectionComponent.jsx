import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, AlertTriangle, Check, Loader, ChevronDown, X, Leaf, Info, RefreshCw } from 'lucide-react';

const CropDetectionComponent = ({ onDetectionComplete }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [apiUrl, setApiUrl] = useState('https://1adb-34-48-117-5.ngrok-free.app');
  const [isUrlEditing, setIsUrlEditing] = useState(false);
  const [apiStatus, setApiStatus] = useState('unknown');
  const fileInputRef = useRef(null);

  // Combined disease info for both Tomato and Maize
  const diseaseInfo = {
    // Tomato Diseases
    "Septoria_leaf_spot": {
      description: "Brown spots with dark borders, usually starting on lower leaves.",
      treatment: "Remove infected leaves, apply fungicide, improve air circulation."
    },
    "Leaf_Mold": {
      description: "Yellow spots on upper leaf surfaces and olive-green to gray mold on undersides.",
      treatment: "Increase spacing between plants, reduce humidity, apply fungicide."
    },
    "Target_Spot": {
      description: "Brown circular lesions with concentric rings giving a target-like appearance.",
      treatment: "Rotate crops, apply fungicide, avoid overhead watering."
    },
    "powdery_mildew": {
      description: "White powdery spots on leaves and stems.",
      treatment: "Increase air circulation, apply fungicide, remove infected parts."
    },
    "Bacterial_spot": {
      description: "Small, dark, water-soaked spots on leaves, stems, and fruits.",
      treatment: "Use copper-based sprays, remove infected plants, rotate crops."
    },
    "Late_blight": {
      description: "Dark green to brown water-soaked spots on leaves that quickly enlarge.",
      treatment: "Apply fungicide preventatively, remove infected plants, improve drainage."
    },
    "Early_blight": {
      description: "Dark brown spots with concentric rings on lower leaves first.",
      treatment: "Apply fungicide, remove infected leaves, maintain plant nutrition."
    },
    "healthy": {
      description: "No signs of disease. Plant appears normal and vibrant.",
      treatment: "Continue regular maintenance and monitoring."
    },
    "Spider_mites Two-spotted_spider_mite": {
      description: "Tiny yellow or brown spots on leaves, fine webbing on undersides.",
      treatment: "Spray with water, apply insecticidal soap or miticide, introduce predatory mites."
    },
    "Tomato_Yellow_Leaf_Curl_Virus": {
      description: "Yellowing and upward curling of leaves, stunted growth.",
      treatment: "Remove infected plants, control whitefly vectors, use resistant varieties."
    },
    "Tomato_mosaic_virus": {
      description: "Mottled light and dark green patterns on leaves, distorted growth.",
      treatment: "Remove infected plants, control aphids, practice good sanitation, use resistant varieties."
    },
    // Maize Diseases
    "Blight": {
      description: "Yellowing and browning of leaves, causing extensive damage to crop.",
      treatment: "Apply fungicides, remove infected plants, practice crop rotation."
    },
    "Gray_Leaf_Spot": {
      description: "Rectangular gray-brown lesions on leaves, reducing photosynthesis.",
      treatment: "Use resistant varieties, apply fungicides, improve field drainage."
    },
    "Common_Rust": {
      description: "Orange-brown pustules on leaves and stems, weakening the plant.",
      treatment: "Plant resistant varieties, apply fungicides, remove infected plant parts."
    }
  };

  // Check API availability on component mount
  useEffect(() => {
    checkApiConnection();
  }, [apiUrl]);

  const checkApiConnection = async () => {
    setApiStatus('unknown');
    try {
      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
      });
      
      const data = await response.json();
      
      if (data.status === 'healthy') {
        setApiStatus('connected');
        setError(null);
      } else {
        throw new Error("API not healthy");
      }
    } catch (err) {
      console.error("API Connection error:", err);
      setApiStatus('error');
      setError("Failed to connect to the detection service. The API may be unavailable or the URL may be incorrect.");
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setDetectionResult(null);
      setError(null);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setDetectionResult(null);
      setError(null);
    } else {
      setError("Please drop an image file");
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleCameraCapture = () => {
    triggerFileInput();
  };

  const handleUrlChange = (e) => {
    setApiUrl(e.target.value);
  };

  const saveApiUrl = () => {
    // Ensure URL doesn't end with a trailing slash
    const cleanUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    setApiUrl(cleanUrl);
    setIsUrlEditing(false);
    checkApiConnection();
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      setError("Please select an image first");
      return;
    }

    if (apiStatus === 'error') {
      setError("Cannot analyze: API is unreachable. Please check the API URL and try again.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedImage);

    try {
      const response = await fetch(`${apiUrl}/predict`, {
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': 'true'
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'success') {
        // Add confidence threshold warnings
        if (data.confidence < 0.4) {
          setError(`Warning: Low confidence detection (${Math.round(data.confidence * 100)}%). Results may not be reliable.`);
        } else if (data.confidence < 0.6) {
          setError(`Note: Moderate confidence (${Math.round(data.confidence * 100)}%). Additional verification recommended.`);
        }
        
        setDetectionResult(data);
        if (onDetectionComplete) {
          onDetectionComplete(data);
        }
      } else {
        setError(data.error || "An error occurred during analysis");
      }
    } catch (err) {
      console.error("API Error details:", err);
      setError(`Detection service error: ${err.message}. The API may be temporarily unavailable.`);
      setApiStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const resetDetection = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setDetectionResult(null);
    setError(null);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence > 0.8) return "text-green-600";
    if (confidence > 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence > 0.8) return "High";
    if (confidence > 0.6) return "Moderate";
    if (confidence > 0.4) return "Low";
    return "Very low";
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto border border-green-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Leaf size={28} className="text-green-500" />
          <h2 className="text-2xl font-bold text-gray-800">Plant Health Diagnostics</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              apiStatus === 'connected' ? 'bg-green-500' : 
              apiStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-sm text-gray-600">
              {apiStatus === 'connected' ? 'API Connected' : 
               apiStatus === 'error' ? 'API Unavailable' : 'Checking API...'}
            </span>
            {apiStatus !== 'connected' && (
              <button 
                onClick={checkApiConnection}
                className="text-green-600 hover:text-green-700"
                title="Refresh connection"
              >
                <RefreshCw size={16} />
              </button>
            )}
          </div>
          
          {isUrlEditing ? (
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={apiUrl} 
                onChange={handleUrlChange} 
                className="border border-green-300 rounded-md px-3 py-1 text-sm w-64"
                placeholder="Enter API URL"
              />
              <button 
                onClick={saveApiUrl} 
                className="bg-green-600 text-white text-sm px-3 py-1 rounded-md"
              >
                Save
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsUrlEditing(true)}
              className="text-sm text-green-600 hover:underline"
            >
              Edit API URL
            </button>
          )}
        </div>
      </div>
      
      {!detectionResult ? (
        <div 
          className="border-2 border-dashed border-green-200 rounded-lg p-8 text-center mb-6 bg-green-50 transition-all hover:bg-green-100 hover:border-green-300"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {previewUrl ? (
            <div className="space-y-4">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="max-h-64 mx-auto rounded-lg object-contain" 
                />
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                <button 
                  onClick={resetDetection}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-md hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <X size={16} />
                  Remove
                </button>
                <button 
                  onClick={handleAnalyze}
                  className={`flex items-center gap-2 px-6 py-2 rounded-md transition-colors shadow-sm ${
                    apiStatus === 'error' 
                      ? 'bg-gray-400 text-white cursor-not-allowed' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                  disabled={isLoading || apiStatus === 'error'}
                >
                  {isLoading ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Analyze Plant
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-gray-600 max-w-lg mx-auto">
                <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Upload size={36} className="text-green-500" />
                </div>
                <p className="text-lg font-medium">Upload a plant image for instant disease detection</p>
                <p className="text-sm mt-2">Our AI analyzes your crop photos to identify diseases and provide treatment recommendations</p>
              </div>
              
              <div className="flex flex-wrap gap-4 justify-center">
                <button 
                  onClick={triggerFileInput}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm"
                >
                  <Upload size={18} />
                  Upload Image
                </button>
                <button 
                  onClick={handleCameraCapture}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-green-700 rounded-md hover:bg-green-50 transition-colors border border-green-200"
                >
                  <Camera size={18} />
                  Take Photo
                </button>
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-full md:w-1/3 bg-white rounded-lg shadow-sm p-3 border border-green-100">
              <img 
                src={previewUrl} 
                alt="Analyzed crop" 
                className="w-full rounded-lg object-cover" 
              />
            </div>
            
            <div className="w-full md:w-2/3 space-y-4">
              <div className="flex items-start justify-between bg-white p-4 rounded-lg shadow-sm border-l-4 border-l-green-500 border border-t-green-100 border-r-green-100 border-b-green-100">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    {detectionResult.prediction === "healthy" ? (
                      <span className="text-green-600">Healthy Plant</span>
                    ) : (
                      <span className="text-red-600">Disease Detected</span>
                    )}
                  </h3>
                  <p className="text-lg font-medium mt-1 capitalize">
                    {detectionResult.prediction.replace(/_/g, ' ')}
                  </p>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-500">Confidence</div>
                  <div className={`text-lg font-medium ${getConfidenceColor(detectionResult.confidence)}`}>
                    {Math.round(detectionResult.confidence * 100)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {getConfidenceLabel(detectionResult.confidence)}
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-green-100">
                <div 
                  className="flex items-center justify-between cursor-pointer p-4 hover:bg-green-50 transition-colors rounded-t-lg"
                  onClick={() => setShowInfo(!showInfo)}
                >
                  <div className="flex items-center gap-2">
                    <Info size={18} className="text-green-500" />
                    <h4 className="font-medium text-gray-800">Disease Information & Treatment</h4>
                  </div>
                  <ChevronDown 
                    size={20} 
                    className={`transition-transform text-green-600 ${showInfo ? 'rotate-180' : ''}`} 
                  />
                </div>
                
                {showInfo && diseaseInfo[detectionResult.prediction] && (
                  <div className="p-4 pt-2 border-t border-green-100 space-y-4 bg-green-50 rounded-b-lg">
                    <div>
                      <div className="text-sm font-medium text-green-700 mb-1">Description:</div>
                      <div className="text-gray-800 bg-white p-3 rounded-md border border-green-100">
                        {diseaseInfo[detectionResult.prediction].description}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-green-700 mb-1">Recommended Treatment:</div>
                      <div className="text-gray-800 bg-white p-3 rounded-md border border-green-100">
                        {diseaseInfo[detectionResult.prediction].treatment}
                      </div>
                    </div>
                    {detectionResult.confidence < 0.6 && (
                      <div className="bg-yellow-50 p-3 rounded-md border border-yellow-100 text-yellow-800 text-sm">
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={16} className="text-yellow-600" />
                          <span className="font-medium">Low Confidence Warning</span>
                        </div>
                        <p className="mt-1">
                          This diagnosis has {detectionResult.confidence < 0.4 ? "very low" : "low"} confidence. 
                          Consider consulting with an expert or uploading additional images with better lighting and focus.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <button 
              onClick={resetDetection}
              className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm"
            >
              Analyze Another Image
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <div className={`mt-4 p-3 ${error.includes('Warning') || error.includes('Note') ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 'bg-red-50 text-red-700 border-red-100'} rounded-md flex items-center gap-2 border`}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}
      
      <div className="mt-8 p-4 text-sm text-gray-600 bg-green-50 rounded-lg border border-green-100">
        <div className="flex items-center gap-2 mb-2">
          <Info size={16} className="text-green-500" />
          <p className="font-medium">Tips for Best Results:</p>
        </div>
        <ul className="list-disc pl-6 space-y-1">
          <li>Upload a clear, well-lit image of your plant</li>
          <li>Focus on the affected area (leaves, stems, fruits)</li>
          <li>Include multiple angles for more accurate diagnosis</li>
          <li>Ensure the image shows the symptoms clearly</li>
          <li>Higher confidence scores (above 60%) indicate more reliable results</li>
        </ul>
      </div>
    </div>
  );
};

export default CropDetectionComponent;