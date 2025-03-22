import React, { useState, useEffect } from 'react';
import { useUserDiscovery } from '../context/UserDiscoveryContext';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const DiscoverScreen = () => {
  const { 
    filteredUsers, 
    searchUsers, 
    loading, 
    error, 
    hasMore, 
    fetchMoreUsers,
    recentlyViewedUsers,
    suggestedUsers,
    recordUserView
  } = useUserDiscovery();
  
  const { currentUser } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('discover');
  const navigate = useNavigate();

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    searchUsers(value);
  };

  // Handle selecting a user to chat with
  const handleSelectUser = (user) => {
    // Record that we viewed this user
    recordUserView(user.id);
    
    // Navigate to chat with this user
    navigate(`/chat/${user.id}`);
  };

  // Handle navigating to message screen
  const handleMessageUser = (e, user) => {
    e.stopPropagation(); // Prevent the card click event from firing
    // Record that we viewed this user
    recordUserView(user.id);
    
    // Navigate to chat with this user
    navigate(`/chat/${user.id}`);
  };

  // Handle navigating to profile screen
  const handleViewProfile = (e, user) => {
    e.stopPropagation(); // Prevent the card click event from firing
    // Record that we viewed this user
    recordUserView(user.id);
    
    // Navigate to profile with this user
    navigate(`/profile/${user.id}`);
  };

  // Handle scroll to implement infinite scrolling
  const handleScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
    if (bottom && hasMore && !loading) {
      fetchMoreUsers();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <div className="w-72 bg-white border-r flex flex-col shadow-sm">
        {/* Logo and Branding */}
        <div className="p-4 border-b flex items-center justify-center">
          <img src="/tre.png" alt="Tre Logo" className="h-10" />
          <span className="ml-2 text-xl font-semibold text-green-600">Farmily Connect</span>
        </div>
        
        {/* User Profile */}
        <div className="p-5 border-b">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center text-white font-bold shadow-md">
              {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="ml-3">
              <div className="font-medium text-gray-800">{currentUser?.displayName || 'User'}</div>
              <div className="text-xs flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                <span className="text-green-600">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b">
          <button 
            className={`flex-1 py-4 font-medium transition-colors duration-200 ${activeTab === 'discover' ? 'text-green-600 border-b-2 border-green-600 bg-green-50' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('discover')}
          >
            Discover
          </button>
          <button 
            className={`flex-1 py-4 font-medium transition-colors duration-200 ${activeTab === 'recent' ? 'text-green-600 border-b-2 border-green-600 bg-green-50' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('recent')}
          >
            Recent
          </button>
        </div>

        {/* Navigation Links */}
        <div className="p-4 flex flex-col flex-1">
          <button 
            onClick={() => navigate('/chat')}
            className="w-full text-left py-3 px-4 rounded-lg flex items-center text-gray-700 hover:bg-green-50 transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-green-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
            </svg>
            Messages
          </button>
          <button 
            onClick={() => navigate('/profile')}
            className="w-full text-left py-3 px-4 rounded-lg flex items-center text-gray-700 hover:bg-green-50 transition-colors duration-200 mt-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-green-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            Profile
          </button>
          
          <div className="mt-auto">
            <button 
              className="w-full text-left py-3 px-4 rounded-lg flex items-center text-gray-700 hover:bg-green-50 transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              Settings
            </button>
            <button 
              className="w-full text-left py-3 px-4 rounded-lg flex items-center text-gray-700 hover:bg-red-50 transition-colors duration-200 mt-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm9.293 10.707a1 1 0 001.414-1.414L12.414 11l1.293-1.293a1 1 0 00-1.414-1.414L11 9.586 9.707 8.293a1 1 0 00-1.414 1.414L9.586 11l-1.293 1.293a1 1 0 101.414 1.414L11 12.414l1.293 1.293z" clipRule="evenodd" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Search Header */}
        <div className="bg-white p-5 border-b shadow-sm">
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              className="w-full border rounded-full pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              placeholder="Search users by name, interests, or location..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <div className="absolute left-4 top-3.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* User Lists */}
        <div className="flex-1 overflow-y-auto p-6" onScroll={handleScroll}>
          {loading && !filteredUsers.length ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500 flex flex-col items-center">
                <svg className="animate-spin h-8 w-8 text-green-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading users...
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-red-500 bg-red-50 p-4 rounded-lg shadow-sm">
                <div className="font-semibold">Error:</div>
                <div>{error}</div>
              </div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto">
              {activeTab === 'discover' && (
                <>
                  {!searchTerm && suggestedUsers.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Suggested for you</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {suggestedUsers.map(user => (
                          <div 
                            key={user.id}
                            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer transform hover:-translate-y-1 transition-transform duration-200"
                            onClick={() => handleSelectUser(user)}
                          >
                            <div className="p-5 flex items-start">
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-xl shadow-md flex-shrink-0">
                                {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div className="ml-4 flex-1">
                                <div className="font-medium text-lg">{user.username || 'User'}</div>
                                <div className="text-sm text-gray-500 mt-1">
                                  {user.bio ? (
                                    user.bio.length > 50 ? `${user.bio.substring(0, 50)}...` : user.bio
                                  ) : 'No bio available'}
                                </div>
                                <div className="mt-3 flex">
                                  <button 
                                    className="px-4 py-1 bg-green-500 text-white rounded-full text-sm hover:bg-green-600 transition-colors shadow-sm"
                                    onClick={(e) => handleMessageUser(e, user)}
                                  >
                                    Message
                                  </button>
                                  <button 
                                    className="ml-2 px-3 py-1 border border-gray-300 rounded-full text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                    onClick={(e) => handleViewProfile(e, user)}
                                  >
                                    View Profile
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <h3 className="text-lg font-semibold mb-4 pb-2 border-b">
                    {searchTerm ? `Search results for "${searchTerm}"` : 'Discover Users'}
                  </h3>
                  
                  {filteredUsers.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center shadow-sm border">
                      <div className="text-gray-500 flex flex-col items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <div className="text-lg font-medium mb-1">
                          {searchTerm ? 'No users found matching your search' : 'No users available'}
                        </div>
                        <div className="text-sm">
                          {searchTerm ? 'Try using different keywords or filters' : 'Check back later for new users'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filteredUsers.map(user => (
                        <div 
                          key={user.id}
                          className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer transform hover:-translate-y-1 transition-transform duration-200"
                          onClick={() => handleSelectUser(user)}
                        >
                          <div className="p-5 flex items-start">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-md flex-shrink-0">
                              {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="ml-4 flex-1">
                              <div className="font-medium text-lg">{user.username || 'User'}</div>
                              <div className="text-sm text-gray-500 mt-1">
                                {user.bio ? (
                                  user.bio.length > 50 ? `${user.bio.substring(0, 50)}...` : user.bio
                                ) : 'No bio available'}
                              </div>
                              <div className="mt-3 flex">
                                <button 
                                  className="px-4 py-1 bg-green-500 text-white rounded-full text-sm hover:bg-green-600 transition-colors shadow-sm"
                                  onClick={(e) => handleMessageUser(e, user)}
                                >
                                  Message
                                </button>
                                <button 
                                  className="ml-2 px-3 py-1 border border-gray-300 rounded-full text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                  onClick={(e) => handleViewProfile(e, user)}
                                >
                                  View Profile
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {loading && filteredUsers.length > 0 && (
                    <div className="text-center my-6">
                      <div className="inline-flex items-center px-4 py-2 bg-white rounded-lg shadow-sm">
                        <svg className="animate-spin h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-gray-600">Loading more users...</span>
                      </div>
                    </div>
                  )}
                  
                  {!hasMore && filteredUsers.length > 0 && (
                    <div className="text-center my-6">
                      <div className="inline-flex items-center px-4 py-2 bg-white rounded-lg shadow-sm text-gray-500">
                        You've reached the end of the list
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'recent' && (
                <>
                  <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Recently Viewed</h3>
                  
                  {recentlyViewedUsers.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center shadow-sm border">
                      <div className="text-gray-500 flex flex-col items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-lg font-medium mb-1">
                          No recently viewed users
                        </div>
                        <div className="text-sm">
                          Start exploring to see users here
                        </div>
                        <button 
                          className="mt-4 px-4 py-2 bg-green-500 text-white rounded-full text-sm hover:bg-green-600 transition-colors shadow-sm"
                          onClick={() => setActiveTab('discover')}
                        >
                          Discover Users
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {recentlyViewedUsers.map(user => (
                        <div 
                          key={user.id}
                          className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer transform hover:-translate-y-1 transition-transform duration-200"
                          onClick={() => handleSelectUser(user)}
                        >
                          <div className="p-5 flex items-start">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-xl shadow-md flex-shrink-0">
                              {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="ml-4 flex-1">
                              <div className="font-medium text-lg">{user.username || 'User'}</div>
                              <div className="text-sm text-gray-500 mt-1">
                                {user.bio ? (
                                  user.bio.length > 50 ? `${user.bio.substring(0, 50)}...` : user.bio
                                ) : 'No bio available'}
                              </div>
                              <div className="mt-3 flex">
                                <button 
                                  className="px-4 py-1 bg-green-500 text-white rounded-full text-sm hover:bg-green-600 transition-colors shadow-sm"
                                  onClick={(e) => handleMessageUser(e, user)}
                                >
                                  Message
                                </button>
                                <button 
                                  className="ml-2 px-3 py-1 border border-gray-300 rounded-full text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                  onClick={(e) => handleViewProfile(e, user)}
                                >
                                  View Profile
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscoverScreen;