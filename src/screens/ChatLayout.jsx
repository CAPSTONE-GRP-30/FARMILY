import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  orderBy, 
  serverTimestamp, 
  onSnapshot,
  where
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Main layout component for the chat interface
const ChatLayout = () => {
  const [activeTab, setActiveTab] = useState('chats');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const { currentUser, userProfile } = useUser();

  // Fetch all users from Firebase
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersQuery = query(collection(db, "users"));
        const querySnapshot = await getDocs(usersQuery);
        
        const usersData = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(user => user.id !== currentUser?.uid); // Exclude current user
        
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);

  // Load chat messages when a chat is selected
  useEffect(() => {
    if (!selectedChat || !currentUser) return;

    const chatId = getChatId(currentUser.uid, selectedChat.id);
    
    const messagesQuery = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc")
    );
    
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isOwn: doc.data().senderId === currentUser.uid
      }));
      
      setChatMessages(messages);
    });
    
    return () => unsubscribe();
  }, [selectedChat, currentUser]);

  // Helper function to generate consistent chat IDs
  const getChatId = (uid1, uid2) => {
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
  };

  // Handle sending a new message
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedChat || !currentUser) return;
    
    try {
      const chatId = getChatId(currentUser.uid, selectedChat.id);
      
      // Check if chat document exists, create if not
      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (!chatSnap.exists()) {
        // Create new chat document
        await chatRef.set({
          participants: [currentUser.uid, selectedChat.id],
          createdAt: serverTimestamp(),
          lastMessage: newMessage,
          lastMessageTime: serverTimestamp()
        });
      }
      
      // Add new message to chat
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: newMessage,
        senderId: currentUser.uid,
        timestamp: serverTimestamp()
      });
      
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Handle selecting a chat
  const selectChat = (user) => {
    setSelectedChat(user);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white border-r">
        {/* Tab Navigation */}
        <div className="flex border-b">
          <button 
            className={`flex-1 py-4 font-medium ${activeTab === 'chats' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('chats')}
          >
            Chats
          </button>
          <button 
            className={`flex-1 py-4 font-medium ${activeTab === 'groups' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('groups')}
          >
            Groups
          </button>
          <button 
            className={`flex-1 py-4 font-medium ${activeTab === 'people' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('people')}
          >
            People
          </button>
        </div>

        {/* User/Group List */}
        <div className="overflow-y-auto h-full pb-20">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : (
            <>
              {activeTab === 'people' && (
                <div>
                  {users.length > 0 ? (
                    users.map(user => (
                      <div 
                        key={user.id} 
                        className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer ${selectedChat?.id === user.id ? 'bg-blue-50' : ''}`}
                        onClick={() => selectChat(user)}
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                          {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="ml-3">
                          <div className="font-medium">{user.username || 'User'}</div>
                          <div className="text-sm text-gray-500">
                            {user.status || 'Available'}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">No users found</div>
                  )}
                </div>
              )}

              {activeTab === 'chats' && (
                <div className="p-4 text-center text-gray-500">
                  Your active chats will appear here
                </div>
              )}

              {activeTab === 'groups' && (
                <div className="p-4 text-center text-gray-500">
                  Your groups will appear here
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white p-4 border-b flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                {selectedChat.username ? selectedChat.username.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="ml-3">
                <div className="font-medium">{selectedChat.username || 'User'}</div>
                <div className="text-sm text-gray-500">
                  {selectedChat.status || 'Available'}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {chatMessages.length > 0 ? (
                chatMessages.map(message => (
                  <div 
                    key={message.id} 
                    className={`mb-4 flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-xs md:max-w-md rounded-lg p-3 ${
                        message.isOwn 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white text-gray-800 border'
                      }`}
                    >
                      {message.text}
                      <div 
                        className={`text-xs mt-1 ${message.isOwn ? 'text-blue-100' : 'text-gray-500'}`}
                      >
                        {message.timestamp ? new Date(message.timestamp.toDate()).toLocaleTimeString() : ''}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Start a conversation with {selectedChat.username || 'this user'}
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="bg-white p-4 border-t">
              <form onSubmit={sendMessage} className="flex">
                <input
                  type="text"
                  className="flex-1 border rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button 
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700"
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatLayout;