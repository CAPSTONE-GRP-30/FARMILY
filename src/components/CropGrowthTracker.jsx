import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

const CropGrowthTracker = ({ onFarmChange }) => {
  const { currentUser, isAuthenticated, loading: userLoading } = useUser();
  const [activeField, setActiveField] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [farms, setFarms] = useState([]);
  const [activeFarm, setActiveFarm] = useState(null);

  // Fetch user's farms
  useEffect(() => {
    const fetchFarms = async () => {
      if (!isAuthenticated || userLoading) return;
      
      try {
        setLoading(true);
        const farmsQuery = query(
          collection(db, "farms"),
          where("ownerId", "==", currentUser.uid)
        );
        
        const querySnapshot = await getDocs(farmsQuery);
        const farmsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setFarms(farmsData);
        
        // Set active farm to the first one if there are any
        if (farmsData.length > 0 && !activeFarm) {
          setActiveFarm(farmsData[0].id);
          // Notify parent component about farm change if provided
          if (onFarmChange) onFarmChange(farmsData[0].id);
        }
        
      } catch (err) {
        console.error("Error fetching farms:", err);
        setError("Failed to load farms");
      } finally {
        setLoading(false);
      }
    };

    fetchFarms();
  }, [currentUser, isAuthenticated, userLoading]);

  // Fetch fields based on active farm
  useEffect(() => {
    const fetchFields = async () => {
      if (!isAuthenticated || userLoading || !activeFarm) return;
      
      try {
        setLoading(true);
        
        // Query fields that belong to the active farm
        const fieldsQuery = query(
          collection(db, "fields"),
          where("farmId", "==", activeFarm),
          where("ownerId", "==", currentUser.uid)
        );
        
        const querySnapshot = await getDocs(fieldsQuery);
        const fieldsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore timestamps to readable dates
          growthStages: doc.data().growthStages ? {
            seeding: doc.data().growthStages.seeding ? {
              date: doc.data().growthStages.seeding.date?.toDate()?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) || 'Not recorded'
            } : { date: 'Not recorded' },
            emergence: doc.data().growthStages.emergence ? {
              date: doc.data().growthStages.emergence.date?.toDate()?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) || 'Not recorded'
            } : { date: 'Not recorded' },
            vegetative: doc.data().growthStages.vegetative ? {
              date: doc.data().growthStages.vegetative.date?.toDate()?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) || 'Not recorded'
            } : { date: 'Not recorded' }
          } : { seeding: { date: 'Not recorded' }, emergence: { date: 'Not recorded' }, vegetative: { date: 'Not recorded' } },
          // Convert notes timestamps to readable dates
          notes: doc.data().notes ? doc.data().notes.map(note => ({
            ...note,
            date: note.date?.toDate()?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          })) : []
        }));
        
        setFields(fieldsData);
        
        // Set active field to the first one if there are any and none is active
        if (fieldsData.length > 0 && !activeField) {
          setActiveField(fieldsData[0].id);
        }
        
      } catch (err) {
        console.error("Error fetching fields:", err);
        setError("Failed to load fields");
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, [currentUser, isAuthenticated, userLoading, activeFarm]);

  // Function to add a new farm
  const addFarm = async (farmName, location = "") => {
    if (!isAuthenticated) return;
    
    try {
      const newFarm = {
        name: farmName,
        location: location,
        ownerId: currentUser.uid,
        members: [{ userId: currentUser.uid, role: "owner" }],
        fieldIds: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, "farms"), newFarm);
      
      // Add the new farm to the state
      setFarms([...farms, { id: docRef.id, ...newFarm }]);
      
      // Set as active farm
      setActiveFarm(docRef.id);
      // Notify parent component about farm change if provided
      if (onFarmChange) onFarmChange(docRef.id);
      
      return docRef.id;
    } catch (err) {
      console.error("Error adding farm:", err);
      setError("Failed to add farm");
      throw err;
    }
  };

  // Function to add a new field to the active farm
  const addField = async (fieldName = `Field ${fields.length + 1}`) => {
    if (!isAuthenticated || !activeFarm) return;
    
    try {
      const newField = {
        name: fieldName,
        ownerId: currentUser.uid,
        farmId: activeFarm,
        growthStages: {
          seeding: { date: null },
          emergence: { date: null },
          vegetative: { date: null }
        },
        notes: [],
        yieldData: [],
        metrics: {
          moisture: [],
          temperature: [],
          rainfall: []
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, "fields"), newField);
      
      // Update farm to include this field
      const farmRef = doc(db, "farms", activeFarm);
      await updateDoc(farmRef, {
        fieldIds: arrayUnion(docRef.id),
        updatedAt: serverTimestamp()
      });
      
      // Add the formatted field to state
      const formattedField = {
        id: docRef.id,
        ...newField,
        growthStages: {
          seeding: { date: 'Not recorded' },
          emergence: { date: 'Not recorded' },
          vegetative: { date: 'Not recorded' }
        },
        notes: []
      };
      
      setFields([...fields, formattedField]);
      setActiveField(docRef.id);
      
      return docRef.id;
    } catch (err) {
      console.error("Error adding field:", err);
      setError("Failed to add field");
      throw err;
    }
  };

  // Function to add a new note to the active field
const addNote = async (type) => {
    if (!isAuthenticated || !activeField) return;
    
    try {
      const noteLabels = {
        fertilizer: 'Applied fertilizer',
        scout: 'Scouted for pests',
        irrigation: 'Irrigated'
      };
      
      const noteId = Date.now().toString();
      const now = new Date(); // Create a regular Date object
      
      // Reference to the active field document
      const fieldRef = doc(db, "fields", activeField);
      
      // Get the current field data first
      const fieldSnapshot = await getDoc(fieldRef);
      const fieldData = fieldSnapshot.data();
      
      // Create the new notes array with the new note
      const updatedNotes = [...(fieldData.notes || []), {
        id: noteId,
        type,
        date: now, // Use a regular Date object instead of serverTimestamp()
        label: noteLabels[type]
      }];
      
      // Update the entire notes array
      await updateDoc(fieldRef, {
        notes: updatedNotes,
        updatedAt: serverTimestamp() // This is fine because it's not in an array
      });
      
      // Update local state
      const updatedFields = fields.map(field => {
        if (field.id === activeField) {
          return {
            ...field,
            notes: [...field.notes, {
              id: noteId,
              type,
              date: now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
              label: noteLabels[type]
            }]
          };
        }
        return field;
      });
      
      setFields(updatedFields);
    } catch (err) {
      console.error("Error adding note:", err);
      setError("Failed to add note");
    }
  };

  // Function to update growth stage
  const updateGrowthStage = async (stage, date = new Date()) => {
    if (!isAuthenticated || !activeField) return;
    
    try {
      // Reference to the active field document
      const fieldRef = doc(db, "fields", activeField);
      
      // Create the update object
      const update = {
        [`growthStages.${stage}.date`]: date,
        updatedAt: serverTimestamp()
      };
      
      // Update in Firestore
      await updateDoc(fieldRef, update);
      
      // Update local state
      const updatedFields = fields.map(field => {
        if (field.id === activeField) {
          return {
            ...field,
            growthStages: {
              ...field.growthStages,
              [stage]: {
                date: date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
              }
            }
          };
        }
        return field;
      });
      
      setFields(updatedFields);
    } catch (err) {
      console.error(`Error updating ${stage} stage:`, err);
      setError(`Failed to update ${stage} stage`);
    }
  };

  // Function to switch active farm
  const switchFarm = (farmId) => {
    setActiveFarm(farmId);
    setActiveField(null); // Reset active field when switching farms
    // Notify parent component about farm change if provided
    if (onFarmChange) onFarmChange(farmId);
  };

  // Render loading state
  if (userLoading || loading) {
    return <div className="flex justify-center p-8">Loading crop data...</div>;
  }

  // Render error state
  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }

  // Render authentication required
  if (!isAuthenticated) {
    return <div className="p-4">Please log in to view your crop data.</div>;
  }

  return (
    <div className="w-full h-full">
      {/* Farm Selection */}
      <div className="mb-6">
        <div className="flex justify-between items-center border-b border-green-500 pb-2 mb-4">
          <h1 className="text-xl font-semibold text-gray-800">Farm Selection</h1>
          <button 
            onClick={() => addFarm(`Farm ${farms.length + 1}`)}
            className="px-3 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded"
          >
            + Add Farm
          </button>
        </div>
        
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {farms.length === 0 ? (
            <div className="text-gray-500">No farms available. Create your first farm!</div>
          ) : (
            farms.map(farm => (
              <button
                key={farm.id}
                onClick={() => switchFarm(farm.id)}
                className={`px-4 py-2 rounded-md ${activeFarm === farm.id 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {farm.name}
              </button>
            ))
          )}
        </div>
      </div>
      
      {/* Header */}
      {activeFarm && (
        <div className="flex justify-between items-center border-b border-green-500 pb-2 mb-6">
          <h1 className="text-xl font-semibold text-gray-800">Crop Growth</h1>
          <div className="flex space-x-4">
            {fields.map(field => (
              <button
                key={field.id}
                onClick={() => setActiveField(field.id)}
                className={`px-3 py-1 ${activeField === field.id ? 'text-green-600 font-medium' : 'text-gray-600'}`}
              >
                {field.name}
              </button>
            ))}
            <button 
              onClick={() => addField()}
              className="px-3 py-1 text-gray-600 hover:text-green-600"
            >
              + Add Field
            </button>
          </div>
        </div>
      )}

      {/* Active Field Content */}
      {fields.find(field => field.id === activeField) && (
        <div>
          <h2 className="text-2xl font-bold mb-6">
            {fields.find(field => field.id === activeField)?.name}
          </h2>
          
          {/* Planting Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold mb-3">Planting</h3>
              <div className="space-x-2">
                <button 
                  onClick={() => updateGrowthStage('seeding', new Date())}
                  className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 rounded"
                >
                  Update Seeding
                </button>
                <button 
                  onClick={() => updateGrowthStage('emergence', new Date())}
                  className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 rounded"
                >
                  Update Emergence
                </button>
                <button 
                  onClick={() => updateGrowthStage('vegetative', new Date())}
                  className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 rounded"
                >
                  Update Vegetative
                </button>
              </div>
            </div>
            
            <div className="space-y-4 ml-1">
              <div className="flex items-start">
                <div className="flex flex-col items-center mr-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-500 text-xs">🌱</span>
                  </div>
                  <div className="w-0.5 h-6 bg-green-200"></div>
                </div>
                <div>
                  <p className="text-green-500 font-medium">Seeding</p>
                  <p className="text-green-500 text-sm">
                    {fields.find(field => field.id === activeField)?.growthStages?.seeding?.date || 'Not recorded'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex flex-col items-center mr-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-500 text-xs">🌱</span>
                  </div>
                  <div className="w-0.5 h-6 bg-green-200"></div>
                </div>
                <div>
                  <p className="text-green-500 font-medium">Emergence</p>
                  <p className="text-green-500 text-sm">
                    {fields.find(field => field.id === activeField)?.growthStages?.emergence?.date || 'Not recorded'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex flex-col items-center mr-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-500 text-xs">🌿</span>
                  </div>
                </div>
                <div>
                  <p className="text-green-500 font-medium">Vegetative</p>
                  <p className="text-green-500 text-sm">
                    {fields.find(field => field.id === activeField)?.growthStages?.vegetative?.date || 'Not recorded'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Health Section */}
          <div className="mb-8">
            <h3 className="font-semibold mb-3">Health</h3>
            <div className="border border-green-200 rounded-md p-4">
              <h4 className="text-gray-400 mb-2 text-sm">Yield Progress</h4>
              <div className="h-40 relative">
                {/* Placeholder for yield progress chart */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-100 to-green-50 opacity-50"></div>
                <svg className="w-full h-full" viewBox="0 0 400 150">
                  <path 
                    d="M0,50 C50,20 100,120 150,100 C200,80 250,30 300,50 C350,70 400,50 400,50" 
                    fill="none" 
                    stroke="#4ade80" 
                    strokeWidth="2"
                  />
                  <path 
                    d="M0,50 C50,20 100,120 150,100 C200,80 250,30 300,50 C350,70 400,50 400,150 L0,150 Z" 
                    fill="url(#gradient)" 
                    opacity="0.2"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#4ade80" />
                      <stop offset="100%" stopColor="#ffffff" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute bottom-2 right-2 text-xs text-green-500">Months</div>
              </div>
            </div>
          </div>
          
          {/* Notes Section */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Notes</h3>
              <div className="flex space-x-2">
                <button 
                  onClick={() => addNote('fertilizer')}
                  className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 rounded"
                >
                  Add Fertilizer
                </button>
                <button 
                  onClick={() => addNote('scout')}
                  className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 rounded"
                >
                  Add Scout
                </button>
                <button 
                  onClick={() => addNote('irrigation')}
                  className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 rounded"
                >
                  Add Irrigation
                </button>
              </div>
            </div>
            
            <div className="space-y-4 ml-1">
              {fields.find(field => field.id === activeField)?.notes.map((note, index) => (
                <div key={note.id || index} className="flex items-start">
                  <div className="flex flex-col items-center mr-2">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-500 text-xs">
                        {note.type === 'fertilizer' ? '🌱' : note.type === 'scout' ? '🔍' : '💧'}
                      </span>
                    </div>
                    {index < fields.find(field => field.id === activeField)?.notes.length - 1 && (
                      <div className="w-0.5 h-6 bg-green-200"></div>
                    )}
                  </div>
                  <div>
                    <p className="text-green-500 font-medium">{note.label}</p>
                    <p className="text-green-500 text-sm">{note.date}</p>
                  </div>
                </div>
              ))}
              
              {fields.find(field => field.id === activeField)?.notes.length === 0 && (
                <div className="text-gray-500 italic">No notes yet. Add your first note!</div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* No farms message */}
      {farms.length === 0 && (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-medium text-gray-700 mb-4">Welcome to Crop Growth Tracker</h3>
          <p className="text-gray-600 mb-6">To get started, create your first farm using the button above.</p>
        </div>
      )}
      
      {/* Farm exists but no fields message */}
      {farms.length > 0 && fields.length === 0 && (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-medium text-gray-700 mb-4">No Fields Available</h3>
          <p className="text-gray-600 mb-6">Create your first field to start tracking crop growth.</p>
          <button
            onClick={() => addField()}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Create First Field
          </button>
        </div>
      )}
    </div>
  );
};

export default CropGrowthTracker;