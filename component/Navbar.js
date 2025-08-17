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
      // Fixed: Ensure proper slash in URL
      const response = await axios.get(process.env.NEXT_PUBLIC_API_URL + "/api/me", {
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
              className="text-sky-300 hover:text-purple-300 font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-all duration-200"
            >
              Home
            </Link>
            
            <Link 
              href="/chat" 
              className="text-sky-300 hover:text-purple-300 font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-all duration-200"
            >
              Chat
            </Link>
            
            <Link 
              href="/about" 
              className="text-sky-300 hover:text-purple-300 font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-all duration-200"
            >
              About
            </Link>
            
            {/* Show Settings link only when user is logged in */}
            {userLoggedIn && (
              <Link 
                href="/usersettings" 
                className="text-sky-300 hover:text-purple-300 font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-all duration-200"
              >
                Settings
              </Link>
            )}
          </div>

          {/* user authentication section */}
          <div className="flex items-center gap-4">
            {checkingAuth ? (
              // loading state with spinner
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                Loading...
              </div>
            ) : !userLoggedIn ? (
              // show login/signup buttons when user is not logged in
              <div className="flex items-center gap-3">
                <Link 
                  href="/login" 
                  className="text-purple-300 hover:text-purple-100 font-medium px-4 py-2 border border-purple-500 rounded-lg hover:bg-purple-500 hover:text-white transition-all duration-200"
                >
                  Login
                </Link>
                
                <Link 
                  href="/signup" 
                  className="bg-gradient-to-r from-sky-500 to-purple-500 hover:from-sky-400 hover:to-purple-400 text-white font-medium px-6 py-2 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              // show user profile when logged in
              <div className="relative flex items-center gap-4">
                <div className="flex items-center gap-3">
                  {/* user avatar circle */}
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-sky-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-semibold text-sm">
                      {getInitials(loggedInUser?.name)}
                    </span>
                  </div>
                  
                  {/* user dropdown menu */}
                  <div className="relative">
                    <button 
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="text-sky-300 hover:text-purple-300 font-medium flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-gray-800 transition-all duration-200"
                    >
                      <span className="hidden sm:block">
                        Hi, {loggedInUser?.name || "User"}
                      </span>
                      {/* dropdown arrow */}
                      <svg 
                        className={`w-4 h-4 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* dropdown menu items */}
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-purple-500 z-50 animate-fade-in">
                        <div className="py-2">
                          {/* user info */}
                          <div className="px-4 py-2 text-gray-400 text-sm border-b border-gray-600">
                            <div className="font-semibold text-white">{loggedInUser?.name}</div>
                            <div className="text-xs">{loggedInUser?.email}</div>
                          </div>
                          
                          {/* menu items */}
                          <Link 
                            href="/usersettings"
                            onClick={() => setShowUserMenu(false)}
                            className="block px-4 py-2 text-sky-300 hover:text-purple-300 hover:bg-gray-700 transition-all duration-200"
                          >
                            ⚙️ Account Settings
                          </Link>
                          
                          <Link 
                            href="/chat"
                            onClick={() => setShowUserMenu(false)}
                            className="block px-4 py-2 text-sky-300 hover:text-purple-300 hover:bg-gray-700 transition-all duration-200"
                          >
                            💬 Go to Chat
                          </Link>
                          
                          <hr className="border-gray-600 my-2" />
                          
                          {/* logout button */}
                          <button 
                            onClick={logoutUser}
                            className="block w-full text-left px-4 py-2 text-red-400 hover:text-red-300 hover:bg-gray-700 transition-all duration-200"
                          >
                            🚪 Logout
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

        {/* Mobile menu button - for future mobile responsiveness */}
        <div className="md:hidden mt-4">
          {userLoggedIn && (
            <div className="flex items-center justify-center gap-4">
              <Link 
                href="/chat" 
                className="text-sky-300 hover:text-purple-300 font-medium px-3 py-2 rounded-lg hover:bg-gray-800 text-sm transition-all duration-200"
              >
                💬 Chat
              </Link>
              <Link 
                href="/usersettings" 
                className="text-sky-300 hover:text-purple-300 font-medium px-3 py-2 rounded-lg hover:bg-gray-800 text-sm transition-all duration-200"
              >
                ⚙️ Settings
              </Link>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </nav>
  );
}