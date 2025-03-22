import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import FarmilyApp from './screens/FarmilyApp';
import Splash from './screens/Splash';
import Login from './screens/Login';
import Signup from './screens/Signup';
import ChatScreen from './screens/ChatScreen';
import { UserProvider, useUser } from './context/UserContext';
import { UserDiscoveryProvider } from './context/UserDiscoveryContext';
import DiscoverScreen from './screens/DiscoverScreen';
import ProtectedRoute from './ProtectedRoute';

// Component that handles conditional redirection after splash
const SplashHandler = () => {
  const [showSplash, setShowSplash] = useState(true);
  const { isAuthenticated, loading } = useUser();

  // Control splash screen display time
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 8000); // Show splash for 8 seconds

    return () => clearTimeout(timer);
  }, []);

  // If still showing splash or auth is loading, show splash screen
  if (showSplash || loading) {
    return <Splash />;
  }

  // If authenticated, redirect to app, otherwise to login
  return <Navigate to={isAuthenticated ? "/screens/FarmilyApp" : "/login"} replace />;
};

const ProtectedRoutes = () => {
  return (
    <UserDiscoveryProvider>
      <Routes>
        <Route path="/screens/FarmilyApp" element={<FarmilyApp />} />
        <Route path="/chat" element={<ChatScreen />} />
        <Route path="/discover" element={<DiscoverScreen />} />
      </Routes>
    </UserDiscoveryProvider>
  );
};

const App = () => {
  return (
    <Router>
      <UserProvider>
        <Routes>
          {/* Root path with splash handling and conditional redirection */}
          <Route path="/" element={<SplashHandler />} />
          
          {/* Authentication routes (public) */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected routes wrapped with UserDiscoveryProvider */}
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <ProtectedRoutes />
              </ProtectedRoute>
            } 
          />
          
          {/* Fallback route - redirects to login if route doesn't exist */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </UserProvider>
    </Router>
  );
};

export default App;