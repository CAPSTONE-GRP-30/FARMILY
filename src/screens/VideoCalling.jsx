import React, { useState, useEffect } from "react";
import AgoraRTC, {
  AgoraRTCProvider,
  LocalUser,
  RemoteUser,
  useJoin,
  useLocalMicrophoneTrack,
  useLocalCameraTrack,
  usePublish,
  useRemoteUsers,
  useRTCClient,
} from "agora-rtc-react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext"; // Import the user context

// Constants - hidden from users
const AGORA_APP_ID = "576dbd6a01cf495597d22f2fb0872433";
const DEFAULT_TOKEN = "007eJxTYNhu9POvI/P0+1fMftlN4dsW8NPqRevOqYt1J8xeXeDy4lK6AoOpuVlKUopZooFhcpqJpamppXmKkVGaUVqSgYW5kYmxcXzf/fSGQEYG3kX2DIxQCOKzMLg5BvkyMAAA+zQglw==";

// Helper function to generate a random meeting ID
const generateMeetingId = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Main wrapper component
export const VideoCalling = () => {
  const [initError, setInitError] = useState(null);
  
  // Create client with error handling
  const client = React.useMemo(() => {
    try {
      return AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    } catch (error) {
      console.error("Failed to create Agora client:", error);
      setInitError(error.message || "Failed to initialize video calling");
      return null;
    }
  }, []);
  
  if (initError || !client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-green-50 font-sans flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <h2 className="text-xl text-red-600 mb-4">Video Call Error</h2>
          <p className="mb-4">{initError || "Failed to initialize video calling"}</p>
          <Link to="/screens/FarmilyApp" className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <AgoraRTCProvider client={client}>
      <VideoCallingUI />
    </AgoraRTCProvider>
  );
};

// UI component for video calling
const VideoCallingUI = () => {
  const navigate = useNavigate();
  const { userProfile, username } = useUser(); // Get user data from context
  const rtcClient = useRTCClient();
  
  // Meeting state
  const [meetingId, setMeetingId] = useState("");
  const [generatedMeetingId, setGeneratedMeetingId] = useState("");
  const [calling, setCalling] = useState(false);
  const [userName, setUserName] = useState("");
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(true);
  const [participantNames, setParticipantNames] = useState({});
  const [error, setError] = useState(null);
  
  // Control microphone and camera
  const [micOn, setMic] = useState(true);
  const [cameraOn, setCamera] = useState(true);
  
  // Generate a meeting ID on initial component load
  useEffect(() => {
    setGeneratedMeetingId(generateMeetingId());
  }, []);
  
  // Set username from context if available
  useEffect(() => {
    if (username) {
      setUserName(username);
    } else if (userProfile && userProfile.displayName) {
      setUserName(userProfile.displayName);
    } else if (userProfile && userProfile.username) {
      setUserName(userProfile.username);
    }
  }, [username, userProfile]);
  
  // Join the channel when calling is true
  const { isJoined, joinState } = useJoin(
    { 
      appid: AGORA_APP_ID, 
      channel: isCreatingMeeting ? generatedMeetingId : meetingId, 
      token: DEFAULT_TOKEN,
      uid: userProfile?.uid || undefined // Use user ID from profile if available
    }, 
    calling
  );
  
  // Handle join error
  useEffect(() => {
    if (joinState === 'failed' && calling) {
      setError("Failed to join meeting. Please check your connection and try again.");
      setCalling(false);
    }
  }, [joinState, calling]);
  
  // Create local audio and video tracks with error handling
  const { localMicrophoneTrack, micError } = useLocalMicrophoneTrack(micOn);
  const { localCameraTrack, cameraError } = useLocalCameraTrack(cameraOn);
  
  // Handle track errors
  useEffect(() => {
    if (micError && calling) {
      console.error("Microphone error:", micError);
      if (micError.toString().includes("permission")) {
        setError("Microphone access denied. Please allow access in your browser settings.");
      }
    }
    
    if (cameraError && calling) {
      console.error("Camera error:", cameraError);
      if (cameraError.toString().includes("permission")) {
        setError("Camera access denied. Please allow access in your browser settings.");
      }
    }
  }, [micError, cameraError, calling]);
  
  // Publish tracks to the channel
  const { isPublished } = usePublish([localMicrophoneTrack, localCameraTrack]);
  
  // Get the list of remote users
  const remoteUsers = useRemoteUsers();
  
  // Reset error when calling state changes
  useEffect(() => {
    setError(null);
  }, [calling]);
  
  // Set up user metadata for name sharing
  useEffect(() => {
    if (calling && rtcClient && userName && isJoined) {
      try {
        // Set up metadata for the local user
        rtcClient.setLocalUserAttributes({
          name: userName
        }).catch(err => console.error("Failed to set local attributes:", err));
        
        // Broadcast name to other users
        rtcClient.dispatchEvent({
          type: 'user-name',
          uid: rtcClient.uid,
          name: userName
        });
        
        // Listen for other users' name events
        rtcClient.on('user-name', (event) => {
          setParticipantNames(prev => ({
            ...prev,
            [event.uid]: event.name
          }));
        });
        
        // When a new user joins, ask them for their name
        rtcClient.on('user-joined', (user) => {
          rtcClient.dispatchEvent({
            type: 'request-name',
            uid: rtcClient.uid,
            requestFor: user.uid
          });
        });
        
        // When someone asks for our name, send it to them
        rtcClient.on('request-name', (event) => {
          if (event.requestFor === rtcClient.uid) {
            rtcClient.dispatchEvent({
              type: 'user-name',
              uid: rtcClient.uid,
              name: userName
            });
          }
        });
        
        // Initial request for existing users' names
        remoteUsers.forEach(user => {
          rtcClient.dispatchEvent({
            type: 'request-name',
            uid: rtcClient.uid,
            requestFor: user.uid
          });
        });
      } catch (err) {
        console.error("Error setting up user metadata:", err);
      }
    }
    
    return () => {
      if (rtcClient) {
        rtcClient.off('user-name');
        rtcClient.off('request-name');
        rtcClient.off('user-joined');
      }
    };
  }, [calling, rtcClient, userName, remoteUsers, isJoined]);
  
  // Handle joining a meeting
  const joinMeeting = () => {
    if (!meetingId) return;
    setCalling(true);
  };
  
  // Handle creating a new meeting
  const createMeeting = () => {
    setCalling(true);
  };
  
  // Start or end the call
  const endCall = () => {
    // Clean up tracks before ending call
    if (localMicrophoneTrack) {
      localMicrophoneTrack.stop();
      localMicrophoneTrack.close();
    }
    if (localCameraTrack) {
      localCameraTrack.stop();
      localCameraTrack.close();
    }
    
    setCalling(false);
    setParticipantNames({});
  };
  
  // Toggle between joining and creating a meeting
  const toggleMeetingMode = () => {
    setIsCreatingMeeting(!isCreatingMeeting);
  };
  
  // Toggle microphone
  const toggleMic = () => {
    setMic(!micOn);
  };
  
  // Toggle camera
  const toggleCamera = () => {
    setCamera(!cameraOn);
  };
  
  // Display error message if there is one
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-green-50 font-sans">
        <div className="max-w-6xl mx-auto p-4">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              <img src="/tre.png" alt="FARMILY Logo" className="h-10 w-auto" />
              <h1 className="text-2xl font-bold text-green-600">FARMILY</h1>
            </div>
            
            <Link to="/screens/FarmilyApp" className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition">
              Back to Dashboard
            </Link>
          </div>
          
          <div className="max-w-md mx-auto p-8 bg-white rounded-lg shadow-md border border-green-100">
            <div className="text-center">
              <div className="text-red-600 text-lg mb-4">Error</div>
              <p className="mb-6">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-green-50 font-sans">
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <img src="/tre.png" alt="FARMILY Logo" className="h-10 w-auto" />
            <h1 className="text-2xl font-bold text-green-600">FARMILY </h1>
          </div>
          
          {!calling && (
            <Link to="/screens/FarmilyApp" className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition">
              Back to Dashboard
            </Link>
          )}
        </div>
        
        {!calling ? (
          <div className="max-w-md mx-auto p-8 bg-white rounded-lg shadow-md border border-green-100">
            <div className="flex justify-center mb-6">
              <img src="/tre.png" alt="FARMILY Logo" className="h-20 w-auto" />
            </div>
            
            <div className="flex mb-4">
              <button 
                onClick={() => setIsCreatingMeeting(true)}
                className={`flex-1 py-2 px-4 font-medium border-b-2 ${isCreatingMeeting ? 'border-green-500 text-green-600' : 'border-gray-200 text-gray-500'}`}
              >
                New Meeting
              </button>
              <button 
                onClick={() => setIsCreatingMeeting(false)}
                className={`flex-1 py-2 px-4 font-medium border-b-2 ${!isCreatingMeeting ? 'border-green-500 text-green-600' : 'border-gray-200 text-gray-500'}`}
              >
                Join Meeting
              </button>
            </div>
            
            {isCreatingMeeting ? (
              <div>
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-500 mb-2">Your meeting ID:</p>
                  <div className="flex items-center justify-center">
                    <span className="text-lg font-bold bg-green-50 py-2 px-4 rounded border border-green-100">
                      {generatedMeetingId}
                    </span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(generatedMeetingId);
                        alert("Meeting ID copied to clipboard!");
                      }}
                      className="ml-2 p-2 text-green-600 hover:text-green-700"
                      title="Copy to clipboard"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name:</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <button 
                  onClick={createMeeting} 
                  disabled={!userName}
                  className={`w-full py-3 px-4 rounded-md text-white font-medium ${!userName ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} transition`}
                >
                  Start Meeting
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meeting ID:</label>
                  <input
                    type="text"
                    value={meetingId}
                    onChange={(e) => setMeetingId(e.target.value)}
                    placeholder="Enter meeting ID"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name:</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <button 
                  onClick={joinMeeting} 
                  disabled={!meetingId || !userName}
                  className={`w-full py-3 px-4 rounded-md text-white font-medium ${!meetingId || !userName ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} transition`}
                >
                  Join Meeting
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-green-600 text-white p-3 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <img src="/tre.png" alt="FARMILY Logo" className="h-6 w-auto" />
                <span className="font-medium">Meeting ID: {isCreatingMeeting ? generatedMeetingId : meetingId}</span>
              </div>
              <div className="text-sm">
                {remoteUsers.length} participant{remoteUsers.length !== 1 ? 's' : ''}
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex flex-wrap gap-4 mb-6">
                {localCameraTrack && (
                  <div className="flex-1 min-w-[300px]">
                    <div className="relative rounded-lg overflow-hidden bg-black">
                      <LocalUser
                        audioTrack={localMicrophoneTrack}
                        cameraOn={cameraOn}
                        micOn={micOn}
                        videoTrack={localCameraTrack}
                        style={{ width: '100%', height: 300 }}
                      />
                      <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                        You ({userName})
                      </div>
                    </div>
                  </div>
                )}
                
                {remoteUsers.map((user) => (
                  <div key={user.uid} className="flex-1 min-w-[300px]">
                    <div className="relative rounded-lg overflow-hidden bg-black">
                      <RemoteUser user={user} style={{ width: '100%', height: 300 }}>
                        <span className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                          {participantNames[user.uid] || `Participant ${user.uid}`}
                        </span>
                      </RemoteUser>
                    </div>
                  </div>
                ))}
                
                {(!localCameraTrack || remoteUsers.length === 0) && (
                  <div className="flex-1 min-w-[300px] flex items-center justify-center bg-gray-100 h-[300px] rounded-lg">
                    <div className="text-center">
                      {!localCameraTrack ? (
                        <>
                          <div className="text-gray-500 mb-2">Camera unavailable</div>
                          <div className="text-sm text-gray-400">Please check your camera permissions</div>
                        </>
                      ) : (
                        <>
                          <div className="text-gray-500 mb-2">Waiting for others to join...</div>
                          <div className="text-sm text-gray-400">Share the Meeting ID with others</div>
                          <div className="flex items-center justify-center mt-2">
                            <span className="text-lg font-bold bg-green-50 py-1 px-3 rounded border border-green-100">
                              {isCreatingMeeting ? generatedMeetingId : meetingId}
                            </span>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(isCreatingMeeting ? generatedMeetingId : meetingId);
                                alert("Meeting ID copied to clipboard!");
                              }}
                              className="ml-2 p-1 text-green-600 hover:text-green-700"
                              title="Copy to clipboard"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-center space-x-4 py-4 border-t">
                <button 
                  onClick={toggleMic}
                  className={`p-3 rounded-full ${micOn ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-600'}`}
                  title={micOn ? "Mute Microphone" : "Unmute Microphone"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {micOn ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" stroke-dasharray="2 2" />
                    )}
                  </svg>
                </button>
                
                <button 
                  onClick={toggleCamera}
                  className={`p-3 rounded-full ${cameraOn ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-600'}`}
                  title={cameraOn ? "Turn Off Camera" : "Turn On Camera"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {cameraOn ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    )}
                  </svg>
                </button>
                
                <button 
                  onClick={endCall}
                  className="p-3 rounded-full bg-red-100 text-red-600"
                  title="End Call"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCalling;