import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  where,
  orderBy,
  limit,
  startAfter,
  getDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useUser } from './UserContext';

// Create the context
const UserDiscoveryContext = createContext();

// Custom hook for using the context
export const useUserDiscovery = () => {
  const context = useContext(UserDiscoveryContext);
  if (context === undefined) {
    throw new Error('useUserDiscovery must be used within a UserDiscoveryProvider');
  }
  return context;
};

// Provider component
export const UserDiscoveryProvider = ({ children }) => {
  const { currentUser } = useUser();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [recentlyViewedUsers, setRecentlyViewedUsers] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);

  // Fetch all users from Firebase
  const fetchUsers = async (limitCount = 20) => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // First get users from users collection
      const usersQuery = query(
        collection(db, "users"), 
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(usersQuery);
      
      if (!querySnapshot.empty) {
        const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
        setLastVisible(lastVisibleDoc);
        
        // Filter out the current user
        const usersData = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(user => user.id !== currentUser.uid);
        
        // For each user, fetch their username from usernames collection
        const usersWithUsernames = await Promise.all(
          usersData.map(async (user) => {
            try {
              // Check if username already exists in user document
              if (user.username) {
                return user;
              }
              
              // Fetch username from usernames collection using user ID
              const usernameDoc = await getDoc(doc(db, "usernames", user.id));
              if (usernameDoc.exists()) {
                return {
                  ...user,
                  username: usernameDoc.data().username
                };
              }
              return user;
            } catch (err) {
              console.warn(`Failed to fetch username for user ${user.id}:`, err);
              return user;
            }
          })
        );
        
        setUsers(usersWithUsernames);
        setFilteredUsers(usersWithUsernames);
        setHasMore(querySnapshot.docs.length >= limitCount);
      } else {
        setUsers([]);
        setFilteredUsers([]);
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch more users (pagination)
  const fetchMoreUsers = async (limitCount = 20) => {
    if (!currentUser || !lastVisible || !hasMore) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const usersQuery = query(
        collection(db, "users"), 
        startAfter(lastVisible),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(usersQuery);
      
      if (!querySnapshot.empty) {
        const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
        setLastVisible(lastVisibleDoc);
        
        const newUsersData = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(user => user.id !== currentUser.uid); // Exclude current user
        
        // For each new user, fetch their username from usernames collection
        const newUsersWithUsernames = await Promise.all(
          newUsersData.map(async (user) => {
            try {
              // Check if username already exists in user document
              if (user.username) {
                return user;
              }
              
              // Fetch username from usernames collection using user ID
              const usernameDoc = await getDoc(doc(db, "usernames", user.id));
              if (usernameDoc.exists()) {
                return {
                  ...user,
                  username: usernameDoc.data().username
                };
              }
              return user;
            } catch (err) {
              console.warn(`Failed to fetch username for user ${user.id}:`, err);
              return user;
            }
          })
        );
        
        setUsers(prevUsers => [...prevUsers, ...newUsersWithUsernames]);
        
        // If there's a search query, filter the new results too
        if (searchQuery) {
          const lowercaseQuery = searchQuery.toLowerCase();
          const newFilteredUsers = newUsersWithUsernames.filter(user => 
            user.username?.toLowerCase().includes(lowercaseQuery) ||
            user.displayName?.toLowerCase().includes(lowercaseQuery)
          );
          setFilteredUsers(prevFiltered => [...prevFiltered, ...newFilteredUsers]);
        } else {
          setFilteredUsers(prevFiltered => [...prevFiltered, ...newUsersWithUsernames]);
        }
        
        setHasMore(querySnapshot.docs.length >= limitCount);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error fetching more users:", err);
      setError("Failed to load more users");
    } finally {
      setLoading(false);
    }
  };

  // Search users by username or display name
  const searchUsers = async (searchTerm) => {
    setSearchQuery(searchTerm);
    
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      return;
    }
    
    const lowercaseQuery = searchTerm.toLowerCase();
    
    // First filter locally
    const localFilteredUsers = users.filter(user => 
      user.username?.toLowerCase().includes(lowercaseQuery) ||
      user.displayName?.toLowerCase().includes(lowercaseQuery)
    );
    
    setFilteredUsers(localFilteredUsers);
    
    // Then also search in Firebase for more comprehensive results
    if (searchTerm.length >= 3) {
      setLoading(true);
      
      try {
        // Search users by displayName or username
        const usersQuery = query(
          collection(db, "users"),
          limit(20)
        );
        
        const querySnapshot = await getDocs(usersQuery);
        
        if (!querySnapshot.empty) {
          const allUsers = querySnapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            .filter(user => user.id !== currentUser.uid); // Exclude current user
          
          // Fetch usernames for users without a username field
          const usersWithUsernames = await Promise.all(
            allUsers.map(async (user) => {
              if (user.username) {
                return user;
              }
              
              try {
                const usernameDoc = await getDoc(doc(db, "usernames", user.id));
                if (usernameDoc.exists()) {
                  return {
                    ...user,
                    username: usernameDoc.data().username
                  };
                }
                return user;
              } catch (err) {
                console.warn(`Failed to fetch username for user ${user.id}:`, err);
                return user;
              }
            })
          );
          
          // Filter by search term
          const searchResults = usersWithUsernames.filter(user => 
            user.username?.toLowerCase().includes(lowercaseQuery) ||
            user.displayName?.toLowerCase().includes(lowercaseQuery)
          );
          
          // Combine with local results, remove duplicates
          const combinedResults = [...localFilteredUsers];
          
          searchResults.forEach(user => {
            if (!combinedResults.some(u => u.id === user.id)) {
              combinedResults.push(user);
            }
          });
          
          setFilteredUsers(combinedResults);
        }
      } catch (err) {
        console.error("Error searching users:", err);
        setError("Search failed");
      } finally {
        setLoading(false);
      }
    }
  };

  // Fetch recently viewed users
  const fetchRecentlyViewedUsers = async () => {
    if (!currentUser) return;
    
    try {
      // Get the user's recently viewed list from Firestore
      const userDoc = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userDoc);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const recentlyViewed = userData.recentlyViewed || [];
        
        if (recentlyViewed.length > 0) {
          const recentUsers = [];
          
          // Get user details for each recently viewed user ID
          for (const userId of recentlyViewed) {
            const userRef = doc(db, "users", userId);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
              const userData = {
                id: userSnap.id,
                ...userSnap.data()
              };
              
              // If no username in user data, fetch from usernames collection
              if (!userData.username) {
                try {
                  const usernameDoc = await getDoc(doc(db, "usernames", userId));
                  if (usernameDoc.exists()) {
                    userData.username = usernameDoc.data().username;
                  }
                } catch (err) {
                  console.warn(`Failed to fetch username for user ${userId}:`, err);
                }
              }
              
              recentUsers.push(userData);
            }
          }
          
          setRecentlyViewedUsers(recentUsers);
        }
      }
    } catch (err) {
      console.error("Error fetching recently viewed users:", err);
    }
  };

  // Fetch suggested users
  const fetchSuggestedUsers = async () => {
    if (!currentUser) return;
    
    try {
      // For simplicity, we're just getting some random users
      // In a real app, you might want to implement more complex logic for suggestions
      const suggestedQuery = query(
        collection(db, "users"),
        where("id", "!=", currentUser.uid),
        limit(5)
      );
      
      const querySnapshot = await getDocs(suggestedQuery);
      
      if (!querySnapshot.empty) {
        const suggestedData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Fetch usernames for suggested users if needed
        const suggestedWithUsernames = await Promise.all(
          suggestedData.map(async (user) => {
            if (user.username) {
              return user;
            }
            
            try {
              const usernameDoc = await getDoc(doc(db, "usernames", user.id));
              if (usernameDoc.exists()) {
                return {
                  ...user,
                  username: usernameDoc.data().username
                };
              }
              return user;
            } catch (err) {
              console.warn(`Failed to fetch username for user ${user.id}:`, err);
              return user;
            }
          })
        );
        
        setSuggestedUsers(suggestedWithUsernames);
      }
    } catch (err) {
      console.error("Error fetching suggested users:", err);
    }
  };

  // Record a user view (adds to recently viewed)
  const recordUserView = async (userId) => {
    if (!currentUser || userId === currentUser.uid) return;
    
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        let recentlyViewed = userData.recentlyViewed || [];
        
        // Remove the user if already in the list (to move to front)
        recentlyViewed = recentlyViewed.filter(id => id !== userId);
        
        // Add to the beginning of the array
        recentlyViewed.unshift(userId);
        
        // Keep only the last 10 viewed users
        if (recentlyViewed.length > 10) {
          recentlyViewed = recentlyViewed.slice(0, 10);
        }
        
        // Update the user document
        await updateDoc(userRef, {
          recentlyViewed: recentlyViewed
        });
        
        // Also update local state
        await fetchRecentlyViewedUsers();
      }
    } catch (err) {
      console.error("Error recording user view:", err);
    }
  };

  // Load initial data when the component mounts
  useEffect(() => {
    if (currentUser) {
      fetchUsers();
      fetchRecentlyViewedUsers();
      fetchSuggestedUsers();
    }
  }, [currentUser]);

  // Value object to be provided to consumers
  const value = {
    users,                      // All fetched users
    filteredUsers,              // Search results or all users if no search
    searchQuery,                // Current search term
    loading,                    // Loading state
    error,                      // Error state
    hasMore,                    // Whether there are more users to load
    recentlyViewedUsers,        // Recently viewed users
    suggestedUsers,             // Suggested users
    searchUsers,                // Function to search users
    fetchMoreUsers,             // Function to load more users (pagination)
    fetchRecentlyViewedUsers,   // Function to refresh recently viewed users
    recordUserView,             // Function to record a user view
    refreshUsers: fetchUsers    // Function to refresh all users
  };

  return (
    <UserDiscoveryContext.Provider value={value}>
      {children}
    </UserDiscoveryContext.Provider>
  );
};

export default UserDiscoveryContext;