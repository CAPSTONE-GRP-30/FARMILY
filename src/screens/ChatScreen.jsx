import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc,
  setDoc,
  orderBy, 
  serverTimestamp, 
  onSnapshot,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import Navbar from '../components/Navbar';


const ChatScreen = () => {
  const [activeTab, setActiveTab] = useState('chats');
  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { currentUser, userProfile } = useUser();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const chatAreaRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Effect to scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Fetch all users from Firebase
  const fetchUsers = async () => {
    if (!currentUser) return;
    
    try {
      const usersQuery = query(collection(db, "users"));
      const querySnapshot = await getDocs(usersQuery);
      
      const usersData = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(user => user.id !== currentUser.uid); // Exclude current user
      
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Load chat messages when a chat is selected
  useEffect(() => {
    if (!selectedChat || !currentUser) return;
  
    let chatId;
    let unsubscribe = () => {};
    
    try {
      // If selected from chats tab, chatId is already in the format we need
      if (activeTab === 'chats' && selectedChat.id.includes('_')) {
        chatId = selectedChat.id;
      } else {
        // If selected from people tab, generate chat ID from user IDs
        chatId = getChatId(currentUser.uid, selectedChat.id);
      }
      
      console.log("Subscribing to messages for chat:", chatId);
      
      // First check if the chat document exists
      getDoc(doc(db, "chats", chatId)).then(chatSnap => {
        if (!chatSnap.exists()) {
          // If chat doesn't exist yet, don't try to listen for messages
          console.log("Chat document doesn't exist yet:", chatId);
          setChatMessages([]);
          return;
        }
        
        // Chat exists, now subscribe to messages
        const messagesQuery = query(
          collection(db, "chats", chatId, "messages"),
          orderBy("timestamp", "asc")
        );
        
        unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
          const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            isOwn: doc.data().senderId === currentUser.uid
          }));
          
          setChatMessages(messages);
        }, error => {
          console.error("Error in messages snapshot:", error);
          alert(`Failed to load messages: ${error.message}`);
        });
      }).catch(error => {
        console.error("Error checking chat document:", error);
      });
    } catch (error) {
      console.error("Error setting up message listener:", error);
    }
    
    return () => unsubscribe();
  }, [selectedChat, currentUser, activeTab]);

  // Fetch user's existing chats
  const fetchChats = async () => {
    if (!currentUser) return;
    
    try {
      // Get chats where the current user is a participant
      const chatsQuery = query(
        collection(db, "chats"),
        where("participants", "array-contains", currentUser.uid)
      );
      
      const querySnapshot = await getDocs(chatsQuery);
      
      const chatsData = [];
      
      for (const chatDoc of querySnapshot.docs) {
        const chatData = chatDoc.data();
        const chatId = chatDoc.id;
        
        // Get the other participant's ID
        const otherUserId = chatData.participants.find(id => id !== currentUser.uid);
        
        // Get the other user's profile
        const userRef = doc(db, "users", otherUserId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          
          chatsData.push({
            id: chatId,
            userId: otherUserId,
            username: userData.username || 'User',
            lastMessage: chatData.lastMessage || '',
            lastMessageTime: chatData.lastMessageTime,
            photoURL: userData.photoURL || null,
            ...userData
          });
        }
      }
      
      // Sort chats by last message time (newest first)
      chatsData.sort((a, b) => {
        if (!a.lastMessageTime || !b.lastMessageTime) return 0;
        return b.lastMessageTime.toDate() - a.lastMessageTime.toDate();
      });
      
      setChats(chatsData);
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  };

  // Fetch user's groups
  const fetchGroups = async () => {
    if (!currentUser) return;
    
    try {
      const groupsQuery = query(
        collection(db, "groups"),
        where("members", "array-contains", currentUser.uid)
      );
      
      const querySnapshot = await getDocs(groupsQuery);
      
      const groupsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setGroups(groupsData);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (currentUser) {
        await Promise.all([fetchUsers(), fetchChats(), fetchGroups()]);
      }
      setLoading(false);
    };

    loadData();

    // Set up real-time listeners for chats collection to immediately update UI when new chats are created
    if (currentUser) {
      const chatsListener = onSnapshot(
        query(
          collection(db, "chats"),
          where("participants", "array-contains", currentUser.uid)
        ),
        () => {
          // Refresh chats when changes occur
          fetchChats();
        }
      );

      return () => chatsListener();
    }
  }, [currentUser]);

  // Helper function to generate consistent chat IDs
  const getChatId = (uid1, uid2) => {
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
  };

  // Handle sending a new message
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedChat || !currentUser || sending) return;
    
    try {
      setSending(true);
      let chatId;
      let otherUserId;
      
      // Determine the chat ID and other user ID
      if (activeTab === 'chats' && selectedChat.id.includes('_')) {
        chatId = selectedChat.id;
        otherUserId = selectedChat.userId;
      } else {
        otherUserId = selectedChat.id;
        chatId = getChatId(currentUser.uid, otherUserId);
      }
      
      // Create a local copy of the message that will be sent
      const messageText = newMessage.trim();
      const now = new Date();
      
      // Add optimistic message to UI immediately
      const optimisticMessage = {
        id: 'temp-' + Date.now(),
        text: messageText,
        senderId: currentUser.uid,
        timestamp: Timestamp.fromDate(now),
        isOwn: true,
        sending: true
      };
      
      setChatMessages(prevMessages => [...prevMessages, optimisticMessage]);
      setNewMessage('');
      
      // IMPORTANT: Create transaction to ensure chat document exists before writing messages
      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);
      
      // If chat doesn't exist, create it first and wait for completion
      if (!chatSnap.exists()) {
        console.log("Creating new chat:", chatId);
        await setDoc(chatRef, {
          participants: [currentUser.uid, otherUserId],
          createdAt: serverTimestamp(),
          lastMessage: messageText,
          lastMessageTime: serverTimestamp()
        });
        
        // Small delay to ensure document is available before writing messages
        // This is a workaround for eventual consistency challenges
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        // Update last message details
        await updateDoc(chatRef, {
          lastMessage: messageText,
          lastMessageTime: serverTimestamp()
        });
      }
      
      // Now it's safe to add the message
      console.log("Adding message to chat:", chatId);
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: messageText,
        senderId: currentUser.uid,
        timestamp: serverTimestamp()
      });
      
      console.log("Message sent successfully");
    } catch (error) {
      console.error("Error sending message:", error.message);
      // Display the specific error message to the user
      alert(`Failed to send message: ${error.message}`);
      
      // Revert optimistic update
      setChatMessages(prevMessages => 
        prevMessages.filter(msg => !msg.sending)
      );
      
      // Keep the message in the input
      setNewMessage(newMessage);
    } finally {
      setSending(false);
    }
  };

  // Handle selecting a chat
  const selectChat = (user) => {
    setSelectedChat(user);
  };

  // Handle selecting a group
  const selectGroup = (group) => {
    // Will be implemented for group messaging
    console.log("Group selected:", group);
  };

  // Navigate to discover screen
  const navigateToDiscover = () => {
    navigate('/discover');
  };

  // Format timestamp for display
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate();
    const now = new Date();
    
    // If same day, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If within a week, show day name
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    
    if (date > weekAgo) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Generate user avatar
  const UserAvatar = ({ user, size = 'md' }) => {
    const username = user?.username || 'User';
    const initial = username.charAt(0).toUpperCase();
    
    const sizeClasses = {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12'
    };
    
    // Generate a consistent background color based on the username
    const colors = [
      'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'
    ];
    
    const colorIndex = username.split('').reduce(
      (acc, char) => acc + char.charCodeAt(0), 0
    ) % colors.length;
    
    const bgColorClass = colors[colorIndex];
    
    return (
      <div className={`${sizeClasses[size]} rounded-full ${bgColorClass} flex items-center justify-center text-white font-medium`}>
        {initial}
      </div>
    );
  };

  // Group messages by date for better organization
  const groupMessagesByDate = (messages) => {
    const groups = {};
    
    messages.forEach(message => {
      if (!message.timestamp) return;
      
      const date = message.timestamp.toDate().toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      
      groups[date].push(message);
    });
    
    return groups;
  };

  // Format date heading
  const formatDateHeading = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric'
      });
    }
  };

  // Main render
  return (

    

    <div className="flex h-screen bg-gray-100">
       

      {/* Sidebar Navigation */}
      <div className="w-72 bg-white border-r flex flex-col shadow-sm">
        {/* App Logo & User Profile */}
        <div className="p-4 border-b bg-gradient-to-r from-green-600 to-teal-500 text-white">
  <Link to="/screens/FarmilyApp" className="flex items-center mb-4 cursor-pointer hover:opacity-80 transition-opacity">
    <img src="/tre.png" alt="Tre Logo" className="h-10 mr-2" />
    <div className="text-xl font-bold">Farmily</div>
  </Link>
  
          
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold border-2 border-white/30">
              {userProfile?.username ? userProfile.username.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="ml-3">
              <div className="font-medium">{userProfile?.username || 'User'}</div>
              <div className="text-xs flex items-center">
                <span className="w-2 h-2 bg-green-300 rounded-full mr-1"></span>
                Online
              </div>
            </div>
          </div>
        </div>

        {/* Search Box */}
        <div className="px-4 py-3 border-b">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full bg-gray-100 rounded-full px-4 py-2 pl-9 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b">
          <button 
            className={`flex-1 py-4 font-medium ${activeTab === 'chats' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('chats')}
          >
            Chats
          </button>
          <button 
            className={`flex-1 py-4 font-medium ${activeTab === 'groups' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('groups')}
          >
            Groups
          </button>
          <button 
            className={`flex-1 py-4 font-medium ${activeTab === 'people' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('people')}
          >
            People
          </button>
        </div>

        {/* User/Group List */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="p-8 flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-600 mb-3"></div>
              <div className="text-gray-500">Loading your conversations...</div>
            </div>
          ) : (
            <>
              {activeTab === 'people' && (
                <div>
                  {/* Discover Button */}
                  <div 
                    className="flex items-center p-4 bg-gradient-to-r from-green-50 to-teal-50 hover:from-green-100 hover:to-teal-100 cursor-pointer border-b"
                    onClick={navigateToDiscover}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <div className="font-medium">Discover People</div>
                      <div className="text-sm text-gray-500">
                        Find new connections
                      </div>
                    </div>
                  </div>
                  
                  {users.length > 0 ? (
                    users.map(user => (
                      <div 
                        key={user.id} 
                        className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedChat?.id === user.id && activeTab === 'people' ? 'bg-green-50' : ''
                        }`}
                        onClick={() => selectChat(user)}
                      >
                        <UserAvatar user={user} />
                        <div className="ml-3">
                          <div className="font-medium">{user.username || 'User'}</div>
                          <div className="text-sm text-gray-500">
                            {user.status || 'Tap to chat'}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500 h-full flex flex-col items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <div className="font-medium text-lg">No users found</div>
                      <div className="mt-2 text-sm">
                        Check back later or try the discover feature
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'chats' && (
                <div>
                  {chats.length > 0 ? (
                    chats.map(chat => (
                      <div 
                        key={chat.id} 
                        className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedChat?.id === chat.id && activeTab === 'chats' ? 'bg-green-50 border-l-4 border-green-600' : ''
                        }`}
                        onClick={() => selectChat(chat)}
                      >
                        <UserAvatar user={chat} />
                        <div className="ml-3 flex-1">
                          <div className="flex justify-between">
                            <div className="font-medium">{chat.username || 'User'}</div>
                            {chat.lastMessageTime && (
                              <div className="text-xs text-gray-500">
                                {formatTime(chat.lastMessageTime)}
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {chat.lastMessage || 'No messages yet'}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500 h-full flex flex-col items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <div className="font-medium text-lg">No active chats</div>
                      <div className="mt-2 text-sm">
                        Go to the People tab to start a conversation
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'groups' && (
                <div>
                  {/* Create Group Button */}
                  <div className="flex items-center p-4 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 cursor-pointer border-b">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <div className="font-medium">Create New Group</div>
                      <div className="text-sm text-gray-500">
                        Start a conversation with multiple people
                      </div>
                    </div>
                  </div>
                  
                  {groups.length > 0 ? (
                    groups.map(group => (
                      <div 
                        key={group.id} 
                        className="flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => selectGroup(group)}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                          {group.name ? group.name.charAt(0).toUpperCase() : 'G'}
                        </div>
                        <div className="ml-3">
                          <div className="font-medium">{group.name || 'Group'}</div>
                          <div className="text-sm text-gray-500">
                            {group.memberCount || group.members?.length || 0} members
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500 h-full flex flex-col items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <div className="font-medium text-lg">No groups yet</div>
                      <div className="mt-2 text-sm">
                        Create a new group to start collaborating
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-100">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white p-4 border-b flex items-center justify-between shadow-sm">
              <div className="flex items-center">
                <UserAvatar user={selectedChat} size="md" />
                <div className="ml-3">
                  <div className="font-medium text-lg">{selectedChat.username || 'User'}</div>
                  <div className="text-xs text-green-600 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                    Online now
                  </div>
                </div>
              </div>
              <div className="flex">
                <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600 ml-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600 ml-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages Area */}
<div 
  className="flex-1 overflow-y-auto p-4 bg-gray-100" 
  ref={chatAreaRef}
>
  {chatMessages.length === 0 ? (
    <div className="h-full flex flex-col items-center justify-center text-center p-6">
      <UserAvatar user={selectedChat} size="lg" />
      <div className="mt-4 font-medium text-lg">
        {selectedChat.username || 'User'}
      </div>
      <div className="mt-2 text-sm text-gray-500 max-w-md">
        This is the beginning of your conversation with {selectedChat.username || 'this user'}.
        Say hello and start chatting!
      </div>
    </div>
  ) : (
    <div>
      {Object.entries(groupMessagesByDate(chatMessages)).map(([date, messages]) => (
        <div key={date}>
          <div className="flex justify-center my-4">
            <div className="bg-gray-200 rounded-full px-4 py-1 text-xs text-gray-600">
              {formatDateHeading(date)}
            </div>
          </div>
          
          {messages.map((message) => (
  <div 
    key={message.id} 
    className={`flex flex-col mb-3 ${message.isOwn ? 'items-end' : 'items-start'}`}
  >
    {/* Show username for messages that are not from the current user */}
    {!message.isOwn && (
      <div className="text-xs font-medium text-gray-700 ml-2 mb-1">
        {selectedChat.username || 'User'}
      </div>
    )}
    <div 
      className={`max-w-xs px-4 py-2 rounded-3xl ${
        message.isOwn 
          ? 'bg-green-500 text-white' // Green theme for sender messages
          : 'bg-gray-200 text-gray-900' // Instagram's recipient message style
      } ${message.sending ? 'opacity-70' : ''}`}
    >
      <div className="text-sm">{message.text}</div>
      {message.timestamp && (
        <div className={`text-xs mt-1 ${message.isOwn ? 'text-white/70' : 'text-gray-500'}`}>
          {formatTime(message.timestamp)}
          {message.sending && " • Sending..."}
        </div>
      )}
    </div>
  </div>
))}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  )}
</div>

{/* Message Input */}
<div className="bg-white p-3 border-t">
  <form onSubmit={sendMessage} className="flex items-center">
    <button 
      type="button"
      className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </button>
    <input
      type="text"
      value={newMessage}
      onChange={(e) => setNewMessage(e.target.value)}
      placeholder="Message..."
      className="flex-1 border rounded-full px-4 py-2 mx-2 focus:outline-none focus:ring-1 focus:ring-gray-300 text-sm"
      disabled={sending}
    />
    {!newMessage.trim() ? (
      <button
        type="button"
        className="p-2 rounded-full text-gray-600"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    ) : (
      <button
        type="submit"
        disabled={sending}
        className="p-2 rounded-full text-green-500 hover:bg-gray-100"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    )}
  </form>
</div>

            
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-8 text-center">
            <div className="max-w-md">
              <img src="/bubble-chat.svg" alt="Select a conversation" className="w-48 h-48 mx-auto mb-6 opacity-30" />
              <h2 className="text-2xl font-bold text-gray-700 mb-2">Welcome to Tre Messenger</h2>
              <p className="text-gray-500 mb-6">
                Select a chat from the sidebar or start a new conversation by tapping on a contact in the People tab.
              </p>
              <button 
                onClick={() => setActiveTab('people')}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
              >
                Start a new conversation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatScreen;