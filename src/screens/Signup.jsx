import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber 
} from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig'; 

const Signup = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('email'); // 'email' or 'phone'
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  
  // Nature-like green color
  const themeGreen = '#6EB257';

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Generate a username based on user details
  const generateUsername = async (firstName, lastName, email) => {
    try {
      // Create base username from first name and last name
      let baseUsername = '';
      
      // If we have first and last name, use them
      if (firstName && lastName) {
        baseUsername = `${firstName.toLowerCase()}${lastName.toLowerCase()}`;
      } 
      // If we only have email, use part before @ symbol
      else if (email) {
        baseUsername = email.split('@')[0].toLowerCase();
      } 
      // Fallback to random string
      else {
        const randomStr = Math.random().toString(36).substring(2, 8);
        baseUsername = `user${randomStr}`;
      }
      
      // Check if username exists and generate alternatives if needed
      let username = baseUsername;
      let usernameExists = true;
      let attempts = 0;
      
      while (usernameExists && attempts < 5) {
        // Check if username exists in the username collection
        const usernameQuery = query(
          collection(db, "usernames"), 
          where("username", "==", username)
        );
        
        const querySnapshot = await getDocs(usernameQuery);
        
        if (querySnapshot.empty) {
          usernameExists = false;
        } else {
          // Add random numbers if username exists
          username = `${baseUsername}${Math.floor(Math.random() * 1000)}`;
          attempts++;
        }
      }
      
      return username;
    } catch (error) {
      console.error("Error generating username:", error);
      // Fallback to a random username if there's an error
      return `user${Math.random().toString(36).substring(2, 8)}`;
    }
  };

  // Save username to the usernames collection
  const saveUsername = async (uid, username) => {
    try {
      const usernameRef = doc(db, "usernames", uid);
      await setDoc(usernameRef, {
        uid: uid,
        username: username,
        createdAt: serverTimestamp()
      });
      
      console.log("Username saved successfully:", username);
      return true;
    } catch (error) {
      console.error("Error saving username:", error);
      throw error;
    }
  };

  // Save user data to Firestore with improved error handling
  const saveUserToFirestore = async (user, authProvider, additionalData = {}) => {
    try {
      console.log("Attempting to save user to Firestore:", user.uid);
      
      // Check if db is properly initialized
      if (!db) {
        console.error("Firestore db instance is not initialized");
        throw new Error("Database not initialized");
      }
      
      // Generate a username for the user
      const username = await generateUsername(
        additionalData.firstName || '',
        additionalData.lastName || '',
        user.email || ''
      );
      
      // Create the user document reference
      const userRef = doc(db, "users", user.uid);
      
      // Create user document with specified structure
      const userData = {
        uid: user.uid,
        displayName: user.displayName || `${additionalData.firstName || ''} ${additionalData.lastName || ''}`.trim(),
        firstName: additionalData.firstName || '',
        lastName: additionalData.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        username: username, // Add username to user document
        authProvider: authProvider,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        profileComplete: Boolean(user.displayName || (additionalData.firstName && additionalData.lastName)),
        agreedToTerms: additionalData.agreeToTerms || false,
        settings: {
          notifications: true,
          rememberMe: false
        },
        farms: [],
        role: "owner"
      };
      
      console.log("User data to save:", userData);
      
      // Save username to the usernames collection
      await saveUsername(user.uid, username);
      
      // Attempt to save the user data
      await setDoc(userRef, userData);
      console.log("User data successfully saved to Firestore");
      return true;
    } catch (error) {
      console.error("Error saving user data:", error.message, error.code);
      setError(`Failed to save user data: ${error.message}`);
      throw error;
    }
  };

  // Email/Password Signup
  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate form
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    if (!formData.agreeToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      return;
    }
    
    setLoading(true);
    
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      
      console.log("User created successfully, updating profile");
      
      // Update profile with name
      await updateProfile(userCredential.user, {
        displayName: `${formData.firstName} ${formData.lastName}`
      });
      
      console.log("Profile updated, saving to Firestore");
      
      // Save user data to Firestore
      await saveUserToFirestore(
        userCredential.user, 
        'email', 
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          agreeToTerms: formData.agreeToTerms
        }
      );
      
      console.log("All signup operations completed successfully");
      
      // Only navigate after everything is complete
      navigate('/screens/FarmilyApp');
    } catch (error) {
      console.error("Signup error:", error.code, error.message);
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please use a different email or log in.');
      } else {
        setError(`Failed to create account: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Google Signup
  const handleGoogleSignup = async () => {
    setError('');
    setLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      console.log("Google sign-in successful, saving to Firestore");
      
      // Extract first and last name from Google display name if available
      let firstName = '';
      let lastName = '';
      
      if (user.displayName) {
        const nameParts = user.displayName.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }
      
      // Save user data to Firestore
      await saveUserToFirestore(
        user, 
        'google',
        {
          firstName: firstName,
          lastName: lastName,
          agreeToTerms: true // Assuming agreement by using Google sign-in
        }
      );
      
      console.log("Google user saved to Firestore");
      
      // Only navigate after everything is complete
      navigate('/screens/FarmilyApp');
    } catch (error) {
      console.error("Google signup error:", error.code, error.message);
      setError(`Google sign-up failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Set up recaptcha
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'normal',
        'callback': () => {
          // reCAPTCHA solved, allow sending OTP
          console.log("reCAPTCHA verified");
        },
        'expired-callback': () => {
          // Reset recaptcha
          console.log("reCAPTCHA expired");
          setError('reCAPTCHA has expired. Please try again.');
        }
      });
    }
  };

  // Phone Number Signup - Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid phone number');
      setLoading(false);
      return;
    }
    
    if (!formData.agreeToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      setLoading(false);
      return;
    }
    
    try {
      console.log("Setting up reCAPTCHA");
      setupRecaptcha();
      const formattedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      const appVerifier = window.recaptchaVerifier;
      
      console.log("Sending verification code to:", formattedPhoneNumber);
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier);
      window.confirmationResult = confirmationResult; // Store globally for verification
      setVerificationId(confirmationResult.verificationId);
      setShowOtpInput(true);
      setError('');
      console.log("Verification code sent successfully");
    } catch (error) {
      console.error("OTP send error:", error.code, error.message);
      setError(`Failed to send verification code: ${error.message}`);
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  // Phone Number Signup - Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit code');
      setLoading(false);
      return;
    }
    
    try {
      console.log("Verifying OTP");
      const confirmationResult = window.confirmationResult;
      if (!confirmationResult) {
        throw new Error('Verification session expired. Please try again.');
      }
      
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      
      console.log("OTP verified successfully, saving to Firestore");
      
      // For phone sign-ups, we'll generate a completely random username
      // since we don't have a name or email to work with
      
      // Save user data to Firestore
      await saveUserToFirestore(
        user, 
        'phone',
        {
          agreeToTerms: formData.agreeToTerms
        }
      );
      
      console.log("Phone user saved to Firestore");
      
      // Only navigate after everything is complete
      navigate('/screens/FarmilyApp');
    } catch (error) {
      console.error("OTP verification error:", error.code, error.message);
      setError(`Invalid verification code: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white p-4">
      <div className="w-full max-w-md">
        {/* Logo and App Name */}
        <div className="flex flex-col items-center mb-8">
          <img src="/tre.png" alt="Farmilly Logo" className="w-16 h-16" />
          <h1 style={{ color: themeGreen }} className="text-2xl font-bold mt-2">FARMILLY</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Create an Account</h2>
          
          {/* Signup Method Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              className={`py-2 px-4 font-medium text-sm flex-1 text-center ${
                activeTab === 'email' 
                  ? `border-b-2 border-green-500 text-green-600` 
                  : `text-gray-500 hover:text-gray-700`
              }`}
              onClick={() => setActiveTab('email')}
            >
              Email
            </button>
            <button
              className={`py-2 px-4 font-medium text-sm flex-1 text-center ${
                activeTab === 'phone' 
                  ? `border-b-2 border-green-500 text-green-600` 
                  : `text-gray-500 hover:text-gray-700`
              }`}
              onClick={() => setActiveTab('phone')}
            >
              Phone Number
            </button>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded">
              {error}
            </div>
          )}
          
          {/* Email Signup Form */}
          {activeTab === 'email' && (
            <form onSubmit={handleEmailSignup}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="your@email.com"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
              </div>
              
              <div className="mb-6">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="flex items-center mb-6">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  required
                  disabled={loading}
                />
                <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-700">
                  I agree to the <a href="#" style={{ color: themeGreen }} className="font-medium hover:underline">Terms of Service</a> and <a href="#" style={{ color: themeGreen }} className="font-medium hover:underline">Privacy Policy</a>
                </label>
              </div>
              
              <button
                type="submit"
                style={{ backgroundColor: themeGreen }}
                className="w-full py-2 px-4 text-white font-medium rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-70"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}
          
          {/* Phone Signup Form */}
          {activeTab === 'phone' && (
            <form onSubmit={showOtpInput ? handleVerifyOtp : handleSendOtp}>
              {!showOtpInput ? (
                <>
                  <div className="mb-4">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="+1234567890"
                      required
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +1 for US)</p>
                  </div>
                  
                  <div id="recaptcha-container" className="mb-4"></div>
                  
                  <div className="flex items-center mb-6">
                    <input
                      type="checkbox"
                      id="agreeToTermsPhone"
                      checked={formData.agreeToTerms}
                      onChange={(e) => setFormData(prev => ({...prev, agreeToTerms: e.target.checked}))}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      required
                      disabled={loading}
                    />
                    <label htmlFor="agreeToTermsPhone" className="ml-2 block text-sm text-gray-700">
                      I agree to the <a href="#" style={{ color: themeGreen }} className="font-medium hover:underline">Terms of Service</a> and <a href="#" style={{ color: themeGreen }} className="font-medium hover:underline">Privacy Policy</a>
                    </label>
                  </div>
                  
                  <button
                    type="submit"
                    style={{ backgroundColor: themeGreen }}
                    className="w-full py-2 px-4 text-white font-medium rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-70"
                    disabled={loading}
                  >
                    {loading ? 'Sending Code...' : 'Send Verification Code'}
                  </button>
                </>
              ) : (
                <>
                  <div className="mb-6">
                    <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                    <input
                      type="text"
                      id="otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="6-digit code"
                      maxLength={6}
                      required
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter the 6-digit code sent to your phone</p>
                  </div>
                  
                  <button
                    type="submit"
                    style={{ backgroundColor: themeGreen }}
                    className="w-full py-2 px-4 text-white font-medium rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-70"
                    disabled={loading}
                  >
                    {loading ? 'Verifying...' : 'Verify & Create Account'}
                  </button>
                </>
              )}
            </form>
          )}
          
          {/* OR Divider */}
          <div className="relative flex items-center justify-center mt-8 mb-6">
            <div className="absolute border-t border-gray-300 w-full"></div>
            <div className="relative bg-white px-4 text-sm text-gray-500">or continue with</div>
          </div>
          
          {/* Social Login */}
          <button 
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mb-4 disabled:opacity-70"
            disabled={loading}
          >
            {/* SVG inline to avoid external image loading issues */}
            <svg 
              className="w-5 h-5 mr-2" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
              <path d="M1 1h22v22H1z" fill="none" />
            </svg>
            <span className="text-sm font-medium text-gray-700">
              {loading ? 'Connecting...' : 'Continue with Google'}
            </span>
          </button>
          
          {/* Already have an account */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <Link to="/login" style={{ color: themeGreen }} className="font-medium hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;