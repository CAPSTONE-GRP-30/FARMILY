import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../context/UserContext';
import Navbar from '../components/Navbar';
import FeaturesSection from '../components/FeaturesSection';
import Footer from '../components/Footer';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp, 
  query, 
  orderBy, 
  limit,
  where,
  onSnapshot,
  increment
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { toast } from 'react-toastify';

const FarmilyCommunityHub = () => {
  const { currentUser, userProfile, loading } = useUser();
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('General Farming');
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [categories, setCategories] = useState([
    'General Farming', 'Organic Farming', 'Mechanized Farming', 
    'Crop Management', 'Livestock', 'Market Insights'
  ]);
  const [announcements, setAnnouncements] = useState([]);
  const [expertQuestion, setExpertQuestion] = useState('');
  const [expertQuestionCategory, setExpertQuestionCategory] = useState('General Farming');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [communityStats, setCommunityStats] = useState({
    activeUsers: 0,
    popularThreads: 0,
    totalPosts: 0
  });
  const [marketUpdates, setMarketUpdates] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [commentText, setCommentText] = useState('');
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [isEditing, setIsEditing] = useState(null);
  const [editContent, setEditContent] = useState('');
  
  const postsRef = collection(db, "posts");
  const announcementsRef = collection(db, "announcements");
  const categoriesRef = collection(db, "categories");
  const expertQuestionsRef = collection(db, "expertQuestions");
  const marketUpdatesRef = collection(db, "marketUpdates");
  const communityStatsRef = collection(db, "communityStats");
  
  const postEndRef = useRef(null);
  
  const scrollToBottom = () => {
    postEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch categories from Firestore
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesQuery = query(categoriesRef, orderBy("order", "asc"));
        const querySnapshot = await getDocs(categoriesQuery);
        
        if (!querySnapshot.empty) {
          const categoriesData = querySnapshot.docs.map(doc => doc.data().name);
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch posts with real-time updates
  useEffect(() => {
    setLoadingPosts(true);
    
    const postsQuery = query(
      postsRef,
      orderBy("createdAt", "desc"),
      limit(50)
    );
    
    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setPosts(postsData);
      setFilteredPosts(postsData);
      setLoadingPosts(false);
    }, (error) => {
      console.error("Error fetching posts:", error);
      setLoadingPosts(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Fetch announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const announcementsQuery = query(
          announcementsRef,
          where("isPinned", "==", true),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        
        const querySnapshot = await getDocs(announcementsQuery);
        const announcementsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setAnnouncements(announcementsData);
      } catch (error) {
        console.error("Error fetching announcements:", error);
      }
    };

    fetchAnnouncements();
  }, []);

  // Fetch market updates
  useEffect(() => {
    const fetchMarketUpdates = async () => {
      try {
        const now = new Date();
        const marketUpdatesQuery = query(
          marketUpdatesRef,
          where("expiresAt", ">", now),
          orderBy("expiresAt", "asc"),
          limit(5)
        );
        
        const querySnapshot = await getDocs(marketUpdatesQuery);
        const updatesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setMarketUpdates(updatesData);
      } catch (error) {
        console.error("Error fetching market updates:", error);
      }
    };

    fetchMarketUpdates();
  }, []);

  // Fetch community stats
  useEffect(() => {
    const fetchCommunityStats = async () => {
      try {
        const statsDoc = await getDocs(query(communityStatsRef, limit(1)));
        
        if (!statsDoc.empty) {
          setCommunityStats(statsDoc.docs[0].data());
        }
      } catch (error) {
        console.error("Error fetching community stats:", error);
      }
    };

    fetchCommunityStats();
  }, []);

  // Filter posts when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPosts(posts);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = posts.filter(post => 
        post.title?.toLowerCase().includes(lowercaseQuery) || 
        post.content?.toLowerCase().includes(lowercaseQuery) ||
        post.category?.toLowerCase().includes(lowercaseQuery) ||
        post.authorName?.toLowerCase().includes(lowercaseQuery)
      );
      setFilteredPosts(filtered);
    }
  }, [searchQuery, posts]);

  // Handle creating a new post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error("You must be logged in to create a post.");
      return;
    }
    
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      toast.warning("Please provide both a title and content for your post.");
      return;
    }
    
    try {
      const newPost = {
        title: newPostTitle,
        content: newPostContent,
        category: selectedCategory,
        authorId: currentUser.uid,
        authorName: userProfile?.username || userProfile?.displayName || 'Anonymous User',
        createdAt: serverTimestamp(),
        likes: 0,
        comments: []
      };
      
      await addDoc(postsRef, newPost);
      
      // Reset form
      setNewPostTitle('');
      setNewPostContent('');
      setIsCreatingPost(false);
      
      toast.success("Post created successfully!");
      scrollToBottom();
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post. Please try again.");
    }
  };

  // Handle submitting an expert question
  const handleSubmitExpertQuestion = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error("You must be logged in to submit a question.");
      return;
    }
    
    if (!expertQuestion.trim()) {
      toast.warning("Please enter your question.");
      return;
    }
    
    setSubmittingQuestion(true);
    
    try {
      const newQuestion = {
        question: expertQuestion,
        category: expertQuestionCategory,
        authorId: currentUser.uid,
        authorName: userProfile?.username || userProfile?.displayName || 'Anonymous User',
        createdAt: serverTimestamp(),
        status: "pending",
        answer: null,
        answeredAt: null
      };
      
      await addDoc(expertQuestionsRef, newQuestion);
      
      // Reset form
      setExpertQuestion('');
      setSubmittingQuestion(false);
      
      toast.success("Your question has been submitted to our experts!");
    } catch (error) {
      console.error("Error submitting question:", error);
      toast.error("Failed to submit question. Please try again.");
      setSubmittingQuestion(false);
    }
  };

  // Like a post
  const handleLikePost = async (postId) => {
    if (!currentUser) {
      toast.error("You must be logged in to like posts.");
      return;
    }
    
    try {
      const postRef = doc(db, "posts", postId);
      
      // Check if user already liked
      const activityQuery = query(
        collection(db, "userPostsActivity"),
        where("userId", "==", currentUser.uid),
        where("postId", "==", postId),
        where("action", "==", "like")
      );
      
      const activitySnapshot = await getDocs(activityQuery);
      
      if (activitySnapshot.empty) {
        // User hasn't liked post yet
        await updateDoc(postRef, {
          likes: increment(1)
        });
        
        // Record user activity
        await addDoc(collection(db, "userPostsActivity"), {
          userId: currentUser.uid,
          postId: postId,
          action: "like",
          timestamp: serverTimestamp()
        });
        
        toast.success("Post liked!");
      } else {
        toast.info("You already liked this post.");
      }
    } catch (error) {
      console.error("Error liking post:", error);
      toast.error("Failed to like post.");
    }
  };

  // Comment on a post
  const handleAddComment = async (postId) => {
    if (!currentUser) {
      toast.error("You must be logged in to comment.");
      return;
    }
    
    if (!commentText.trim()) {
      toast.warning("Please enter a comment.");
      return;
    }
    
    try {
      const comment = {
        postId: postId,
        content: commentText,
        authorId: currentUser.uid,
        authorName: userProfile?.username || userProfile?.displayName || 'Anonymous User',
        createdAt: serverTimestamp(),
        likes: 0
      };
      
      // Add to subcollection
      await addDoc(collection(db, "posts", postId, "comments"), comment);
      
      // Record activity
      await addDoc(collection(db, "userPostsActivity"), {
        userId: currentUser.uid,
        postId: postId,
        action: "comment",
        timestamp: serverTimestamp()
      });
      
      setCommentText('');
      setActiveCommentPostId(null);
      
      toast.success("Comment added!");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment.");
    }
  };

  // Edit a post
  const handleEditPost = async (postId) => {
    if (!editContent.trim()) {
      toast.warning("Post content cannot be empty.");
      return;
    }
    
    try {
      const postRef = doc(db, "posts", postId);
      
      await updateDoc(postRef, {
        content: editContent
      });
      
      setIsEditing(null);
      setEditContent('');
      
      toast.success("Post updated successfully!");
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error("Failed to update post.");
    }
  };

  // Delete a post
  const handleDeletePost = async (postId) => {
    if (window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, "posts", postId));
        toast.success("Post deleted successfully!");
      } catch (error) {
        console.error("Error deleting post:", error);
        toast.error("Failed to delete post.");
      }
    }
  };

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <FeaturesSection />
      
      {/* Hero Section */}
      <div className="bg-green-800 text-white py-16 relative" style={{ backgroundImage: "url('/images/an-illustration-of-a-diverse-group-of-pe_d37EOcfuRk6gXwl_EBSkeA_Z1e2OmHXRfawosI9etWogw.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-3xl font-bold mb-4">Welcome to Farmily Community Hub</h1>
          <p className="max-w-2xl mx-auto">Engage, collaborate, and grow together with a thriving community built for all your farming needs.</p>
        </div>
        <div className="absolute inset-0 bg-green-800 bg-opacity-70"></div>
      </div>
      
      
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold mb-4">Connect with the Farming Community</h2>
          <p className="mb-6">Share knowledge, ask questions, and stay updated with the latest farming trends.</p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
            <div className="flex w-full max-w-md">
              <input 
                type="text" 
                placeholder="Search for questions, answers, or topics..." 
                className="px-4 py-2 border border-green-300 rounded-l-md w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="bg-green-700 text-white px-4 py-2 rounded-r-md">Search</button>
            </div>
            
            {currentUser ? (
              <button 
                className="bg-green-500 hover:bg-green-600 transition-colors text-white px-6 py-2 rounded-md"
                onClick={() => setIsCreatingPost(!isCreatingPost)}
              >
                {isCreatingPost ? 'Cancel' : '+ Create Post'}
              </button>
            ) : (
              <button 
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md"
                onClick={() => toast.info("You need to log in to create posts.")}
              >
                Login to Post
              </button>
            )}
          </div>
          
          {/* Tab Navigation */}
          <div className="flex flex-wrap justify-center border-b mb-6">
            <button 
              className={`px-4 py-2 ${activeTab === 'posts' ? 'border-b-2 border-green-500 text-green-700 font-medium' : 'text-gray-500'}`}
              onClick={() => setActiveTab('posts')}
            >
              Community Posts
            </button>
            <button 
              className={`px-4 py-2 ${activeTab === 'experts' ? 'border-b-2 border-green-500 text-green-700 font-medium' : 'text-gray-500'}`}
              onClick={() => setActiveTab('experts')}
            >
              Ask Experts
            </button>
            <button 
              className={`px-4 py-2 ${activeTab === 'market' ? 'border-b-2 border-green-500 text-green-700 font-medium' : 'text-gray-500'}`}
              onClick={() => setActiveTab('market')}
            >
              Market Updates
            </button>
            <button 
              className={`px-4 py-2 ${activeTab === 'insights' ? 'border-b-2 border-green-500 text-green-700 font-medium' : 'text-gray-500'}`}
              onClick={() => setActiveTab('insights')}
            >
              Insights
            </button>
          </div>
        </div>

        {/* Create Post Form */}
        {isCreatingPost && (
          <div className="mb-12 bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-md">
            <h2 className="text-xl font-bold mb-4">Create a New Post</h2>
            <form onSubmit={handleCreatePost}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Post Title</label>
                <input 
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Enter your post title..."
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Post Content</label>
                <textarea 
                  className="w-full p-2 border border-gray-300 rounded-md" 
                  rows="6"
                  placeholder="Share your knowledge, ask questions, or start a discussion..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button 
                      key={category}
                      type="button"
                      className={`border px-3 py-1 rounded-full text-sm ${
                        selectedCategory === category 
                          ? 'bg-green-500 text-white border-green-500' 
                          : 'border-green-500 text-green-500 hover:bg-green-50'
                      }`}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <button 
                  type="button"
                  className="bg-gray-300 hover:bg-gray-400 transition-colors text-gray-700 px-6 py-2 rounded-md mr-2"
                  onClick={() => setIsCreatingPost(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-green-500 hover:bg-green-600 transition-colors text-white px-6 py-2 rounded-md"
                >
                  Publish Post
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Featured Announcements */}
        {announcements.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Featured Announcements</h2>
            <div className="space-y-3">
              {announcements.map(announcement => (
                <div key={announcement.id} className="bg-green-50 p-4 rounded-md border-l-4 border-green-500">
                  <div className="flex items-start">
                    <span className="text-red-500 mr-2">📌</span>
                    <div>
                      <h3 className="font-bold">{announcement.title}</h3>
                      <p className="text-sm mt-1">{announcement.content}</p>
                      <div className="text-xs text-gray-500 mt-2">
                        {announcement.createdAt && formatDate(announcement.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Tab Content */}
        {activeTab === 'posts' && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Community Posts</h2>
            <p className="mb-6">Discover and engage with posts from the farming community</p>
            
            {loadingPosts ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="bg-gray-50 p-6 rounded-md border border-gray-200 text-center">
                <p className="text-gray-600">No posts found. Be the first to create a post!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredPosts.map(post => (
                  <div key={post.id} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-lg">{post.title}</h3>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        {post.category}
                      </span>
                    </div>
                    
                    {isEditing === post.id ? (
                      <div className="mb-4">
                        <textarea 
                          className="w-full p-2 border border-gray-300 rounded-md" 
                          rows="4"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                        />
                        <div className="flex justify-end mt-2">
                          <button 
                            className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-1 rounded-md text-sm mr-2"
                            onClick={() => setIsEditing(null)}
                          >
                            Cancel
                          </button>
                          <button 
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm"
                            onClick={() => handleEditPost(post.id)}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mb-4">{post.content}</p>
                    )}
                    
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className="bg-green-500 rounded-full w-6 h-6 flex items-center justify-center text-white mr-2">
                          {post.authorName?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <span>{post.authorName || 'Anonymous User'}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span>{post.createdAt ? formatDate(post.createdAt) : 'Just now'}</span>
                        <div className="flex items-center">
                          <button 
                            className="mr-1 hover:text-green-500"
                            onClick={() => handleLikePost(post.id)}
                            aria-label="Like post"
                          >
                            👍
                          </button>
                          <span>{post.likes || 0}</span>
                        </div>
                        <div className="flex items-center">
                          <button 
                            className="mr-1 hover:text-green-500"
                            onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                            aria-label="Comment on post"
                          >
                            💬
                          </button>
                          <span>{post.comments?.length || 0}</span>
                        </div>
                        
                        {currentUser && post.authorId === currentUser.uid && (
                          <div className="flex items-center gap-2">
                            <button 
                              className="text-blue-500 hover:text-blue-700"
                              onClick={() => {
                                setIsEditing(post.id);
                                setEditContent(post.content);
                              }}
                              aria-label="Edit post"
                            >
                              Edit
                            </button>
                            <button 
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDeletePost(post.id)}
                              aria-label="Delete post"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Comment form */}
                    {activeCommentPostId === post.id && (
                      <div className="mt-4 border-t pt-4">
                        <textarea 
                          className="w-full p-2 border border-gray-300 rounded-md" 
                          rows="2"
                          placeholder="Add a comment..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                        />
                        <div className="flex justify-end mt-2">
                          <button 
                            className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-1 rounded-md text-sm mr-2"
                            onClick={() => {
                              setActiveCommentPostId(null);
                              setCommentText('');
                            }}
                          >
                            Cancel
                          </button>
                          <button 
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm"
                            onClick={() => handleAddComment(post.id)}
                          >
                            Comment
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={postEndRef} />
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'experts' && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Ask the Experts</h2>
            <p className="mb-6">Submit inquiries for expert advice on farming topics.</p>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <form onSubmit={handleSubmitExpertQuestion}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Your Question</label>
                  <textarea 
                    className="w-full p-2 border border-gray-300 rounded-md" 
                    rows="3"
                    placeholder="Ask your farming question here..."
                    value={expertQuestion}
                    onChange={(e) => setExpertQuestion(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                      <button 
                        key={category}
                        type="button"
                        className={`border px-3 py-1 rounded-full text-sm ${
                          expertQuestionCategory === category 
                            ? 'bg-green-500 text-white border-green-500' 
                            : 'border-green-500 text-green-500 hover:bg-green-50'
                        }`}
                        onClick={() => setExpertQuestionCategory(category)}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
                <button 
                  type="submit"
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md"
                  disabled={submittingQuestion || !currentUser}
                >
                  {submittingQuestion ? 'Submitting...' : 'Submit Question'}
                </button>
                {!currentUser && (
                  <p className="text-sm text-red-500 mt-2">You must be logged in to submit a question.</p>
                )}
              </form>
              
              <div className="mt-8">
                <h3 className="font-medium text-lg mb-3">Recently Answered Questions</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-md">
                    <div className="font-medium">How to control aphids naturally?</div>
                    <div className="text-sm mt-1">Q: What's the best way to control aphids without using chemical pesticides?</div>
                    <div className="mt-2 pl-4 border-l-2 border-green-500">
                      <p className="text-sm italic">A: Ladybugs are natural predators of aphids. You can also spray plants with a solution of water and mild soap, or neem oil. Companion planting with plants like marigolds can help repel aphids naturally.</p>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">Answered by Dr. Garcia, Organic Farming Expert</div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-md">
                    <div className="font-medium">Soil pH correction methods</div>
                    <div className="text-sm mt-1">Q: My soil pH is too acidic. What's the best way to raise it for vegetable gardening?</div>
                    <div className="mt-2 pl-4 border-l-2 border-green-500">
                      <p className="text-sm italic">A: For raising soil pH, agricultural lime is most effective. Apply approximately 5-10 pounds per 100 square feet and till into the soil. Wood ash can also help raise pH in small amounts. Test your soil after 3-4 weeks to monitor changes.</p>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">Answered by Maria Johnson, Soil Specialist</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'market' && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Market Updates</h2>
            <p className="mb-6">Stay informed with the latest agricultural market trends and prices.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold mb-4">Crop Prices</h3>
                {marketUpdates.filter(update => update.type === 'crop').length > 0 ? (
                  <div className="space-y-3">
                    {marketUpdates
                      .filter(update => update.type === 'crop')
                      .map(update => (
                        <div key={update.id} className="border-b pb-2">
                          <div className="flex justify-between">
                            <span className="font-medium">{update.item}</span>
                            <span className={`${
                              update.trend === 'up' ? 'text-green-600' : 
                              update.trend === 'down' ? 'text-red-600' : 
                              'text-gray-600'
                            }`}>
                              {update.price}
                              {update.trend === 'up' ? ' ↑' : update.trend === 'down' ? ' ↓' : ''}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {update.notes}
                          </div>
                        </div>
                      ))
                    }
                  </div>
                ) : (
                  <p className="text-gray-500">No crop price updates available currently.</p>
                )}
              </div>
              
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold mb-4">Livestock Prices</h3>
                {marketUpdates.filter(update => update.type === 'livestock').length > 0 ? (
                  <div className="space-y-3">
                    {marketUpdates
                      .filter(update => update.type === 'livestock')
                      .map(update => (
                        <div key={update.id} className="border-b pb-2">
                          <div className="flex justify-between">
                            <span className="font-medium">{update.item}</span>
                            <span className={`${
                              update.trend === 'up' ? 'text-green-600' : 
                              update.trend === 'down' ? 'text-red-600' : 
                              'text-gray-600'
                            }`}>
                              {update.price}
                              {update.trend === 'up' ? ' ↑' : update.trend === 'down' ? ' ↓' : ''}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {update.notes}
                          </div>
                        </div>
                      ))
                    }
                  </div>
                ) : (
                  <p className="text-gray-500">No livestock price updates available currently.</p>
                )}
              </div>
              
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold mb-4">Upcoming Markets & Fairs</h3>
                <div className="space-y-3">
                  <div className="border-b pb-2">
                    <div className="font-medium">County Agricultural Fair</div>
                    <div className="text-sm">April 15-17, 2023 • County Fairgrounds</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Annual county fair featuring livestock shows, equipment displays, and local produce vendors.
                    </div>
                  </div>
                  <div className="border-b pb-2">
                    <div className="font-medium">Farmers Market Season Opening</div>
                    <div className="text-sm">May 1, 2023 • Downtown Market Square</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Weekly farmers market returns for the season every Saturday, 8am-1pm.
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Organic Farming Conference</div>
                    <div className="text-sm">May 20-21, 2023 • Agricultural Center</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Two-day conference featuring workshops, networking, and latest organic farming techniques.
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold mb-4">Market Trends & Forecasts</h3>
                <div className="space-y-4">
                  <div>
                    <div className="font-medium">Seasonal Outlook</div>
                    <div className="text-sm mt-1">
                      Crops are expected to receive adequate rainfall this growing season. Early forecasts predict average to above-average yields for major crops, with potential price stabilization by mid-summer.
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Supply Chain Update</div>
                    <div className="text-sm mt-1">
                      Fertilizer prices have stabilized but remain higher than previous years. Transportation costs are projected to decrease over the next quarter as fuel prices moderate.
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Export Markets</div>
                    <div className="text-sm mt-1">
                      International demand for organic products continues to grow, presenting opportunities for certified organic producers. New trade agreements may open additional markets in Q3.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'insights' && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Farming Insights</h2>
            <p className="mb-6">Explore data-driven insights and learn from successful farming practices.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm lg:col-span-2">
                <h3 className="text-xl font-bold mb-4">Community Statistics</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-md text-center">
                    <div className="text-3xl font-bold text-green-600">{communityStats.activeUsers || 0}</div>
                    <div className="text-sm text-gray-500">Active Members</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md text-center">
                    <div className="text-3xl font-bold text-green-600">{communityStats.totalPosts || 0}</div>
                    <div className="text-sm text-gray-500">Total Posts</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md text-center">
                    <div className="text-3xl font-bold text-green-600">{communityStats.popularThreads || 0}</div>
                    <div className="text-sm text-gray-500">Active Discussions</div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="font-medium mb-2">Most Active Categories</h4>
                  <div className="space-y-2">
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="flex justify-between mb-1">
                        <span>Organic Farming</span>
                        <span className="text-green-600">32%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '32%' }}></div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="flex justify-between mb-1">
                        <span>Crop Management</span>
                        <span className="text-green-600">28%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '28%' }}></div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="flex justify-between mb-1">
                        <span>Livestock</span>
                        <span className="text-green-600">21%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '21%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold mb-4">Seasonal Tips</h3>
                <div className="space-y-4">
                  <div className="border-l-4 border-green-500 pl-3">
                    <div className="font-medium">Spring Planting</div>
                    <p className="text-sm mt-1">
                      Wait until after the last frost date in your region before planting warm-season crops. Consider succession planting to extend harvests.
                    </p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-3">
                    <div className="font-medium">Soil Preparation</div>
                    <p className="text-sm mt-1">
                      Test soil pH and nutrient levels before amending. Add organic matter to improve soil structure and water retention.
                    </p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-3">
                    <div className="font-medium">Pest Management</div>
                    <p className="text-sm mt-1">
                      Monitor crops regularly for early signs of pest damage. Consider integrated pest management approaches to minimize chemical interventions.
                    </p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-3">
                    <div className="font-medium">Water Conservation</div>
                    <p className="text-sm mt-1">
                      Implement drip irrigation systems to reduce water usage. Apply mulch to retain soil moisture and suppress weeds.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm lg:col-span-3">
                <h3 className="text-xl font-bold mb-4">Frequently Asked Questions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="font-medium">What crops are most profitable for small-scale farmers?</div>
                    <p className="text-sm mt-1">
                      High-value specialty crops like herbs, microgreens, garlic, and berries typically offer the best returns for small acreage. Focus on crops with longer shelf life or those that can be preserved to extend selling season.
                    </p>
                  </div>
                  <div>
                    <div className="font-medium">How can I improve soil health organically?</div>
                    <p className="text-sm mt-1">
                      Implement crop rotation, plant cover crops, add compost regularly, and minimize tillage. Consider incorporating livestock into your system for additional organic inputs.
                    </p>
                  </div>
                  <div>
                    <div className="font-medium">What funding options are available for new farmers?</div>
                    <p className="text-sm mt-1">
                      USDA offers various programs including FSA loans, NRCS conservation grants, and Rural Development grants. Many states also have beginning farmer loan programs with favorable terms.
                    </p>
                  </div>
                  <div>
                    <div className="font-medium">How do I get certified organic?</div>
                    <p className="text-sm mt-1">
                      Contact a USDA-accredited certifying agency to begin the process. Prepare documentation of your practices, create an organic system plan, and maintain detailed records. Land must be free from prohibited substances for 3 years.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Community Directory - Display on all tabs */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Community Directory</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold mb-4">Expert Advisors</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-green-500 rounded-full w-10 h-10 flex items-center justify-center text-white text-lg flex-shrink-0">
                    JG
                  </div>
                  <div className="ml-3">
                    <div className="font-medium">Dr. James Garcia</div>
                    <div className="text-sm text-gray-600">Organic Farming Specialist</div>
                    <div className="text-xs text-gray-500 mt-1">20+ years experience in organic certification and sustainable practices</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-green-500 rounded-full w-10 h-10 flex items-center justify-center text-white text-lg flex-shrink-0">
                    MJ
                  </div>
                  <div className="ml-3">
                    <div className="font-medium">Maria Johnson</div>
                    <div className="text-sm text-gray-600">Soil & Crop Nutrition Expert</div>
                    <div className="text-xs text-gray-500 mt-1">PhD in Soil Science, specializing in fertility management and soil health</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-green-500 rounded-full w-10 h-10 flex items-center justify-center text-white text-lg flex-shrink-0">
                    RL
                  </div>
                  <div className="ml-3">
                    <div className="font-medium">Robert Lee</div>
                    <div className="text-sm text-gray-600">Agricultural Economics</div>
                    <div className="text-xs text-gray-500 mt-1">Market analyst with expertise in farm business planning and risk management</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold mb-4">Local Resources</h3>
              <div className="space-y-3">
                <div>
                  <div className="font-medium">County Extension Office</div>
                  <div className="text-sm text-gray-600">Agricultural education and resources</div>
                  <div className="text-xs text-gray-500">555-123-4567 • Open Mon-Fri, 8am-5pm</div>
                </div>
                <div>
                  <div className="font-medium">Farm Equipment Rentals</div>
                  <div className="text-sm text-gray-600">Affordable equipment sharing</div>
                  <div className="text-xs text-gray-500">555-987-6543 • www.farmequipment.org</div>
                </div>
                <div>
                  <div className="font-medium">Seed & Supply Co-op</div>
                  <div className="text-sm text-gray-600">Member-owned agricultural supplies</div>
                  <div className="text-xs text-gray-500">555-234-5678 • 123 Farm Road</div>
                </div>
                <div>
                  <div className="font-medium">Local Farmers Market</div>
                  <div className="text-sm text-gray-600">Direct-to-consumer sales</div>
                  <div className="text-xs text-gray-500">Every Saturday, 8am-1pm • Downtown Square</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold mb-4">Upcoming Events</h3>
              <div className="space-y-3">
                <div>
                  <div className="font-medium">Sustainable Farming Workshop</div>
                  <div className="text-sm">April 10, 2023 • 10am-3pm</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Practical techniques for implementing sustainable practices on small to medium farms.
                  </div>
                </div>
                <div>
                  <div className="font-medium">Beginning Farmer Meetup</div>
                  <div className="text-sm">April 22, 2023 • 6pm-8pm</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Networking event for new farmers to connect with experienced mentors.
                  </div>
                </div>
                <div>
                  <div className="font-medium">Agricultural Technology Demo Day</div>
                  <div className="text-sm">May 5, 2023 • 9am-4pm</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Demonstrations of the latest farming technologies and precision agriculture tools.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default FarmilyCommunityHub;