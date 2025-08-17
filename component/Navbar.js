"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import axios from "axios";

// Navigation bar component
export default function Navbar() {
  // states for user login status
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // check if user is logged in when page loads
  useEffect(() => {
    checkIfUserIsLoggedIn();
    
    // listen for changes in local storage
    const handleStorageChange = (event) => {
      if (event.key === 'token') {
        checkIfUserIsLoggedIn();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // check auth status every few seconds
    const authCheckInterval = setInterval(() => {
      checkIfUserIsLoggedIn();
    }, 5000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(authCheckInterval);
    };
  }, []);

  // function to check authentication status
  const checkIfUserIsLoggedIn = async () => {
    const userToken = localStorage.getItem("token");
    
    if (!userToken) {
      setUserLoggedIn(false);
      setLoggedInUser(null);
      setCheckingAuth(false);
      return;
    }

    try {
      // verify token with server
      const response = await axios.get(process.env.NEXT_PUBLIC_API_URL + "api/me", {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      // token is valid, user is logged in
      setLoggedInUser(response.data);
      setUserLoggedIn(true);
    } catch (error) {
      // token is invalid, remove it
      console.error("Token check failed:", error);
      localStorage.removeItem("token");
      setUserLoggedIn(false);
      setLoggedInUser(null);
    } finally {
      setCheckingAuth(false);
    }
  };

  // function to logout user
  const logoutUser = () => {
    localStorage.removeItem("token");
    setUserLoggedIn(false);
    setLoggedInUser(null);
    setShowUserMenu(false);
    
    // go to home page
    window.location.href = "/";
  };

  // get user initials for avatar
  const getInitials = (userName) => {
    if (!userName) return "U";
    return userName.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    // navbar container with gradient background
    <nav className="bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 border-b-2 border-purple-500 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          
          {/* logo section */}
          <div className="flex items-center gap-2">
            {/* logo icon */}
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-sky-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AC</span>
            </div>
            {/* app name */}
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-sky-400 bg-clip-text text-transparent">
              AlphaChat
            </h1>
          </div>
          
          {/* navigation links */}
          <div className="hidden md:flex items-center gap-8">
            <Link 
              href="/" 
              className="text-sky-300 hover:text-purple-300 font-medium px-4 py-2 rounded-lg hover:bg-gray-800"
            >
              Home
            </Link>
            
            <Link 
              href="/chat" 
              className="text-sky-300 hover:text-purple-300 font-medium px-4 py-2 rounded-lg hover:bg-gray-800"
            >
              Chat
            </Link>
            
            <Link 
              href="/about" 
              className="text-sky-300 hover:text-purple-300 font-medium px-4 py-2 rounded-lg hover:bg-gray-800"
            >
              About
            </Link>
            <Link 
              href="/usersettings" 
              className="text-sky-300 hover:text-purple-300 font-medium px-4 py-2 rounded-lg hover:bg-gray-800"
            >
              Profile
            </Link>
          </div>

          {/* user authentication section */}
          <div className="flex items-center gap-4">
            {checkingAuth ? (
              // loading state
              <div className="text-gray-400 text-sm">Loading...</div>
            ) : !userLoggedIn ? (
              // show login/signup buttons when user is not logged in
              <div className="flex items-center gap-3">
                <Link 
                  href="/login" 
                  className="text-purple-300 hover:text-purple-100 font-medium px-4 py-2 border border-purple-500 rounded-lg hover:bg-purple-500 "
                >
                  Login
                </Link>
                
                <Link 
                  href="/signup" 
                  className="bg-gradient-to-r from-sky-500 to-purple-500 hover:from-sky-400 hover:to-purple-400 text-white font-medium px-6 py-2 rounded-lg shadow-lg"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              // show user profile when logged in
              <div className="relative flex items-center gap-4">
                <div className="flex items-center gap-3">
                  {/* user avatar circle */}
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-sky-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {getInitials(loggedInUser?.name)}
                    </span>
                  </div>
                  
                  {/* user dropdown menu */}
                  <div className="relative">
                    <button 
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="text-sky-300 hover:text-purple-300 font-medium flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-gray-800"
                    >
                      <span className="hidden sm:block">
                        Hi, {loggedInUser?.name || "User"}
                      </span>
                      {/* dropdown arrow */}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* dropdown menu items */}
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-purple-500 z-50">
                        <div className="py-2">
                          {/* user email */}
                          <div className="px-4 py-2 text-gray-400 text-sm border-b border-gray-600">
                            {loggedInUser?.email}
                          </div>
                          
                          <hr className="border-gray-600 my-2" />
                          
                          {/* logout button */}
                          <button 
                            onClick={logoutUser}
                            className="block w-full text-left px-4 py-2 text-red-400 hover:text-red-300 hover:bg-gray-700"
                          >
                            Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}