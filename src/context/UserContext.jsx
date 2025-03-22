import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

// Create the context
const UserContext = createContext();

// Custom hook for using the context
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// Provider component
export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // User is signed in
          setCurrentUser(user);
          
          // Fetch additional user data from Firestore
          await fetchUserProfile(user.uid);
          
          // Update last login timestamp
          await updateLastLogin(user.uid);
        } else {
          // User is signed out
          setCurrentUser(null);
          setUserProfile(null);
          setUsername(null);
        }
      } catch (err) {
        console.error("Auth state change error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Fetch username from usernames collection
  const fetchUsername = async (uid) => {
    try {
      const usernameRef = doc(db, "usernames", uid);
      const usernameSnap = await getDoc(usernameRef);
      
      if (usernameSnap.exists()) {
        const usernameData = usernameSnap.data();
        setUsername(usernameData.username);
        return usernameData.username;
      } else {
        console.warn("No username found in usernames collection");
        
        // Fallback: try to find username by querying usernames collection
        const usernamesQuery = query(
          collection(db, "usernames"),
          where("uid", "==", uid)
        );
        
        const querySnapshot = await getDocs(usernamesQuery);
        if (!querySnapshot.empty) {
          const usernameDoc = querySnapshot.docs[0].data();
          setUsername(usernameDoc.username);
          return usernameDoc.username;
        }
        
        setUsername(null);
        return null;
      }
    } catch (err) {
      console.error("Error fetching username:", err);
      setError("Failed to load username");
      return null;
    }
  };

  // Fetch user profile data from Firestore
  const fetchUserProfile = async (uid) => {
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      
      // Also fetch username from usernames collection
      const username = await fetchUsername(uid);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        
        // Add username from usernames collection if it exists and differs
        if (username && (!userData.username || userData.username !== username)) {
          userData.username = username;
        }
        
        setUserProfile(userData);
        return userData;
      } else {
        console.warn("No user profile found in Firestore");
        setUserProfile(null);
        return null;
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setError("Failed to load user profile");
      throw err;
    }
  };

  // Update last login timestamp
  const updateLastLogin = async (uid) => {
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        lastLogin: serverTimestamp()
      });
    } catch (err) {
      console.error("Error updating last login:", err);
      // Not throwing error as this is not critical
    }
  };

  // Refresh user profile data
  const refreshUserProfile = async () => {
    if (!currentUser) return null;
    
    setLoading(true);
    try {
      const profile = await fetchUserProfile(currentUser.uid);
      setLoading(false);
      return profile;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // Auth state change listener will update state
    } catch (err) {
      console.error("Sign out error:", err);
      setError("Failed to sign out");
      throw err;
    }
  };

  // Update user profile in Firestore
  const updateUserProfile = async (profileData) => {
    if (!currentUser) throw new Error("No authenticated user");
    
    try {
      const userRef = doc(db, "users", currentUser.uid);
      
      // Only update the fields provided in profileData
      await updateDoc(userRef, {
        ...profileData,
        updatedAt: serverTimestamp()
      });
      
      // Refresh profile after update
      return await refreshUserProfile();
    } catch (err) {
      console.error("Update profile error:", err);
      setError("Failed to update profile");
      throw err;
    }
  };

  // Update username function
  const updateUsername = async (newUsername) => {
    if (!currentUser) throw new Error("No authenticated user");
    
    try {
      // Check if username exists already
      const usernameQuery = query(
        collection(db, "usernames"),
        where("username", "==", newUsername)
      );
      
      const querySnapshot = await getDocs(usernameQuery);
      if (!querySnapshot.empty) {
        throw new Error("Username already taken");
      }
      
      // Update in usernames collection
      const usernameRef = doc(db, "usernames", currentUser.uid);
      await updateDoc(usernameRef, {
        username: newUsername,
        updatedAt: serverTimestamp()
      });
      
      // Also update in user profile
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        username: newUsername,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setUsername(newUsername);
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          username: newUsername
        });
      }
      
      return newUsername;
    } catch (err) {
      console.error("Update username error:", err);
      setError("Failed to update username");
      throw err;
    }
  };

  // Context value with user state and functions
  const value = {
    currentUser,         // Firebase auth user object
    userProfile,         // Extended user data from Firestore
    username,            // Username from usernames collection
    loading,             // Loading state
    error,               // Error state
    isAuthenticated: !!currentUser,  // Convenience boolean for auth status
    refreshUserProfile,  // Function to refresh user data
    updateUserProfile,   // Function to update user profile
    updateUsername,      // Function to update username
    signOut              // Function to sign out
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;