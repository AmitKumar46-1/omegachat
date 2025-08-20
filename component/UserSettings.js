// CREATE NEW FILE: components/UserSettings.js
// Mobile-ready Dark purple theme settings page

"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Mobile state
  const [isMobile, setIsMobile] = useState(false);
  
  // Profile update state
  const [profile, setProfile] = useState({
    name: '',
    email: ''
  });
  
  // Password change state  
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Delete account state
  const [deletePassword, setDeletePassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  
  // Stats state
  const [stats, setStats] = useState({});
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Check if mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load user profile when component loads
  useEffect(() => {
    loadUserProfile();
    loadUserStats();
  }, []);

  // Load current user profile
  const loadUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(process.env.NEXT_PUBLIC_API_URL + '/api/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setProfile({
        name: response.data.name,
        email: response.data.email
      });
      
      console.log('✅ Profile loaded');
    } catch (error) {
      console.error('❌ Error loading profile:', error);
      setMessage('Failed to load profile');
    }
  };

  // Load user statistics
  const loadUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(process.env.NEXT_PUBLIC_API_URL + '/api/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStats(response.data);
      console.log('✅ Stats loaded');
    } catch (error) {
      console.error('❌ Error loading stats:', error);
    }
  };

  // Update user profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(process.env.NEXT_PUBLIC_API_URL + '/api/user/profile', profile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage('✅ Profile updated successfully!');
      console.log('✅ Profile updated');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('❌ Profile update error:', error);
      setMessage('❌ ' + (error.response?.data?.message || 'Failed to update profile'));
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage('❌ New passwords do not match');
      return;
    }
    
    if (passwords.newPassword.length < 6) {
      setMessage('❌ Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(process.env.NEXT_PUBLIC_API_URL + '/api/user/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage('✅ Password changed successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      console.log('✅ Password changed');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('❌ Password change error:', error);
      setMessage('❌ ' + (error.response?.data?.message || 'Failed to change password'));
    } finally {
      setLoading(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    
    if (confirmText !== 'DELETE') {
      setMessage('❌ Please type "DELETE" to confirm');
      return;
    }
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(process.env.NEXT_PUBLIC_API_URL + '/api/user/account', {
        data: { password: deletePassword },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage('✅ Account deleted successfully. Goodbye!');
      
      setTimeout(() => {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }, 2000);
      
    } catch (error) {
      console.error('❌ Account deletion error:', error);
      setMessage('❌ ' + (error.response?.data?.message || 'Failed to delete account'));
    } finally {
      setLoading(false);
    }
  };

  // Search messages
  const handleSearchMessages = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/search?query=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSearchResults(response.data);
      console.log('🔍 Search completed');
    } catch (error) {
      console.error('❌ Search error:', error);
      setMessage('❌ Search failed');
    }
  };

  // Mobile tab items configuration
  const tabItems = [
    { id: 'profile', icon: '👤', label: 'Profile', shortLabel: 'Profile' },
    { id: 'password', icon: '🔐', label: 'Password', shortLabel: 'Security' },
    { id: 'stats', icon: '📊', label: 'Stats', shortLabel: 'Stats' },
    { id: 'search', icon: '🔍', label: 'Search', shortLabel: 'Search' },
    { id: 'delete', icon: '🗑️', label: 'Delete', shortLabel: 'Delete' }
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-700 to-purple-500 py-8 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-5xl font-bold mb-2 sm:mb-4 text-white drop-shadow-lg">
            ⚙️ Account Settings
          </h1>
          <p className="text-base sm:text-xl text-purple-100 opacity-90">
            Manage your profile and account preferences
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Message Display */}
        {message && (
          <div className={`max-w-md mx-auto mb-6 sm:mb-8 p-4 rounded-xl text-center border-2 ${
            message.includes('✅') 
              ? 'bg-green-900/50 text-green-300 border-green-500/50' 
              : 'bg-red-900/50 text-red-300 border-red-500/50'
          } backdrop-blur-sm`}>
            {message}
          </div>
        )}

        {/* Settings Container */}
        <div className="bg-gray-900 rounded-2xl shadow-2xl border border-purple-500/30 overflow-hidden">
          
          {/* MOBILE TAB NAVIGATION */}
          {isMobile ? (
            <div className="border-b border-purple-500/30">
              {/* Mobile tab selector dropdown */}
              <div className="p-4 bg-purple-800">
                <div className="relative">
                  <select
                    value={activeTab}
                    onChange={(e) => setActiveTab(e.target.value)}
                    className="w-full bg-purple-700 text-white p-3 rounded-lg border border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none cursor-pointer"
                  >
                    {tabItems.map((tab) => (
                      <option key={tab.id} value={tab.id}>
                        {tab.icon} {tab.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Mobile horizontal scroll tabs */}
              <div className="flex overflow-x-auto scrollbar-hide bg-gray-800">
                {tabItems.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 px-4 py-3 text-center font-medium text-sm transition-all duration-300 min-w-[80px] ${
                      activeTab === tab.id 
                        ? `${tab.id === 'delete' ? 'bg-red-600 text-white' : 'bg-purple-600 text-white'} border-b-2 ${tab.id === 'delete' ? 'border-red-400' : 'border-purple-400'}` 
                        : `${tab.id === 'delete' ? 'text-red-300 hover:text-red-200 hover:bg-red-800/30' : 'text-purple-300 hover:text-white hover:bg-purple-800/30'}`
                    }`}
                  >
                    <div className="text-lg mb-1">{tab.icon}</div>
                    <div className="text-xs">{tab.shortLabel}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // DESKTOP TAB NAVIGATION (Original)
            <div className="flex border-b border-purple-500/30">
              {tabItems.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-6 px-8 text-center font-bold text-lg transition-all duration-300 ${
                    activeTab === tab.id 
                      ? `${tab.id === 'delete' ? 'bg-red-600 text-white' : 'bg-purple-600 text-white'} shadow-lg` 
                      : `${tab.id === 'delete' ? 'text-red-300 hover:text-white hover:bg-red-800/30' : 'text-purple-300 hover:text-white hover:bg-purple-800/30'}`
                  }`}
                >
                  <span className="text-2xl mb-2 block">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Tab Content */}
          <div className="p-4 sm:p-12">
            {/* Edit Profile Tab */}
            {activeTab === 'profile' && (
              <div className="max-w-lg mx-auto">
                <div className="text-center mb-6 sm:mb-8">
                  <h2 className="text-2xl sm:text-4xl font-bold text-purple-300 mb-2">👤 Edit Profile</h2>
                  <p className="text-gray-400 text-sm sm:text-base">Update your personal information</p>
                </div>
                
                <form onSubmit={handleUpdateProfile} className="space-y-4 sm:space-y-6">
                  <div className="relative">
                    <label className="block text-sm font-bold text-purple-300 mb-2 sm:mb-3 uppercase tracking-wide">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                      className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gray-800 border-2 border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 text-sm sm:text-base"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-bold text-purple-300 mb-2 sm:mb-3 uppercase tracking-wide">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                      className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gray-800 border-2 border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 text-sm sm:text-base"
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 sm:py-4 px-6 rounded-xl font-bold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 ${
                      loading 
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-500 hover:to-purple-400 shadow-lg hover:shadow-purple-500/25'
                    }`}
                  >
                    {loading ? '⏳ Updating...' : '✅ Update Profile'}
                  </button>
                </form>
              </div>
            )}

            {/* Change Password Tab */}
            {activeTab === 'password' && (
              <div className="max-w-lg mx-auto">
                <div className="text-center mb-6 sm:mb-8">
                  <h2 className="text-2xl sm:text-4xl font-bold text-purple-300 mb-2">🔐 Change Password</h2>
                  <p className="text-gray-400 text-sm sm:text-base">Update your account security</p>
                </div>
                
                <form onSubmit={handleChangePassword} className="space-y-4 sm:space-y-6">
                  <div className="relative">
                    <label className="block text-sm font-bold text-purple-300 mb-2 sm:mb-3 uppercase tracking-wide">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwords.currentPassword}
                      onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                      className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gray-800 border-2 border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 text-sm sm:text-base"
                      placeholder="Enter current password"
                      required
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-bold text-purple-300 mb-2 sm:mb-3 uppercase tracking-wide">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                      className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gray-800 border-2 border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 text-sm sm:text-base"
                      placeholder="Enter new password (min 6 characters)"
                      required
                      minLength="6"
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-bold text-purple-300 mb-2 sm:mb-3 uppercase tracking-wide">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                      className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gray-800 border-2 border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 text-sm sm:text-base"
                      placeholder="Confirm new password"
                      required
                      minLength="6"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 sm:py-4 px-6 rounded-xl font-bold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 ${
                      loading 
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-500 hover:to-green-400 shadow-lg hover:shadow-green-500/25'
                    }`}
                  >
                    {loading ? '⏳ Changing...' : '🔐 Change Password'}
                  </button>
                </form>
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8 sm:mb-12">
                  <h2 className="text-2xl sm:text-4xl font-bold text-purple-300 mb-2">📊 My Statistics</h2>
                  <p className="text-gray-400 text-sm sm:text-base">Your chat activity overview</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                  <div className="bg-gradient-to-br from-blue-900/50 to-blue-700/50 p-4 sm:p-8 rounded-2xl border border-blue-500/30 transform hover:scale-105 transition-all duration-300">
                    <div className="text-3xl sm:text-5xl font-bold text-blue-300 mb-2">{stats.messagesSent || 0}</div>
                    <div className="text-base sm:text-lg text-blue-200 font-semibold">Messages Sent</div>
                    <div className="text-blue-400 text-xs sm:text-sm mt-2">📤 Outgoing messages</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-900/50 to-green-700/50 p-4 sm:p-8 rounded-2xl border border-green-500/30 transform hover:scale-105 transition-all duration-300">
                    <div className="text-3xl sm:text-5xl font-bold text-green-300 mb-2">{stats.messagesReceived || 0}</div>
                    <div className="text-base sm:text-lg text-green-200 font-semibold">Messages Received</div>
                    <div className="text-green-400 text-xs sm:text-sm mt-2">📥 Incoming messages</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-900/50 to-purple-700/50 p-4 sm:p-8 rounded-2xl border border-purple-500/30 transform hover:scale-105 transition-all duration-300">
                    <div className="text-3xl sm:text-5xl font-bold text-purple-300 mb-2">{stats.totalMessages || 0}</div>
                    <div className="text-base sm:text-lg text-purple-200 font-semibold">Total Messages</div>
                    <div className="text-purple-400 text-xs sm:text-sm mt-2">💬 All conversations</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-yellow-900/50 to-yellow-700/50 p-4 sm:p-8 rounded-2xl border border-yellow-500/30 transform hover:scale-105 transition-all duration-300">
                    <div className="text-3xl sm:text-5xl font-bold text-yellow-300 mb-2">{stats.filesSent || 0}</div>
                    <div className="text-base sm:text-lg text-yellow-200 font-semibold">Files Shared</div>
                    <div className="text-yellow-400 text-xs sm:text-sm mt-2">📎 Images, videos, docs</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-indigo-900/50 to-indigo-700/50 p-4 sm:p-8 rounded-2xl border border-indigo-500/30 transform hover:scale-105 transition-all duration-300">
                    <div className="text-3xl sm:text-5xl font-bold text-indigo-300 mb-2">{stats.totalUsers || 0}</div>
                    <div className="text-base sm:text-lg text-indigo-200 font-semibold">Other Users</div>
                    <div className="text-indigo-400 text-xs sm:text-sm mt-2">👥 In the system</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-pink-900/50 to-pink-700/50 p-4 sm:p-8 rounded-2xl border border-pink-500/30 transform hover:scale-105 transition-all duration-300">
                    <div className="text-3xl sm:text-5xl font-bold text-pink-300 mb-2">
                      {((stats.messagesSent || 0) + (stats.messagesReceived || 0)) > 0 ? 
                        Math.round(((stats.messagesSent || 0) / ((stats.messagesSent || 0) + (stats.messagesReceived || 0))) * 100) : 0}%
                    </div>
                    <div className="text-base sm:text-lg text-pink-200 font-semibold">Activity Rate</div>
                    <div className="text-pink-400 text-xs sm:text-sm mt-2">📈 Messages sent ratio</div>
                  </div>
                </div>
              </div>
            )}

            {/* Search Messages Tab */}
            {activeTab === 'search' && (
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8 sm:mb-12">
                  <h2 className="text-2xl sm:text-4xl font-bold text-purple-300 mb-2">🔍 Search Messages</h2>
                  <p className="text-gray-400 text-sm sm:text-base">Find your conversations quickly</p>
                </div>
                
                <div className="mb-6 sm:mb-8">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearchMessages()}
                      className="flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-gray-800 border-2 border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 text-sm sm:text-base"
                      placeholder="Type your search query..."
                    />
                    <button
                      onClick={handleSearchMessages}
                      className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-bold hover:from-purple-500 hover:to-purple-400 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 text-sm sm:text-base"
                    >
                      🔍 Search
                    </button>
                  </div>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto">
                    {searchResults.map((msg, index) => (
                      <div key={msg._id || index} className="bg-gray-800 p-4 sm:p-6 rounded-xl border border-purple-500/20">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                          <div className="text-purple-300 font-semibold text-sm sm:text-base">
                            {msg.senderEmail === profile.email ? 'You' : msg.senderId?.name || msg.senderEmail}
                          </div>
                          <div className="text-gray-400 text-xs sm:text-sm">
                            {new Date(msg.timestamp).toLocaleDateString()} {new Date(msg.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="text-white text-sm sm:text-base">{msg.message}</div>
                        {msg.edited && (
                          <div className="text-gray-400 text-xs mt-2 italic">✏️ Edited</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {searchQuery && searchResults.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <div className="text-2xl sm:text-4xl mb-4">🔍</div>
                    <div className="text-base sm:text-lg">No messages found</div>
                    <div className="text-xs sm:text-sm mt-2">Try a different search term</div>
                  </div>
                )}
              </div>
            )}

            {/* Delete Account Tab */}
            {activeTab === 'delete' && (
              <div className="max-w-lg mx-auto">
                <div className="text-center mb-6 sm:mb-8">
                  <h2 className="text-2xl sm:text-4xl font-bold text-red-400 mb-2">🗑️ Delete Account</h2>
                  <p className="text-gray-400 text-sm sm:text-base">Permanently remove your account</p>
                </div>
                
                <div className="bg-red-900/30 border-2 border-red-500/50 p-4 sm:p-6 rounded-xl mb-6 sm:mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl sm:text-2xl">⚠️</span>
                    <span className="text-red-300 font-bold text-base sm:text-lg">Danger Zone</span>
                  </div>
                  <p className="text-red-200 leading-relaxed text-sm sm:text-base">
                    This action <strong>cannot be undone</strong>. Your account and all messages will be permanently deleted from our servers. All your chat history, files, and profile information will be lost forever.
                  </p>
                </div>
                
                <form onSubmit={handleDeleteAccount} className="space-y-4 sm:space-y-6">
                  <div className="relative">
                    <label className="block text-sm font-bold text-red-300 mb-2 sm:mb-3 uppercase tracking-wide">
                      Enter Your Password
                    </label>
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gray-800 border-2 border-red-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-500/20 transition-all duration-300 text-sm sm:text-base"
                      placeholder="Confirm with your password"
                      required
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-bold text-red-300 mb-2 sm:mb-3 uppercase tracking-wide">
                      Type "DELETE" to Confirm
                    </label>
                    <input
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gray-800 border-2 border-red-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-500/20 transition-all duration-300 text-sm sm:text-base"
                      placeholder="Type DELETE in capital letters"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || confirmText !== 'DELETE'}
                    className={`w-full py-3 sm:py-4 px-6 rounded-xl font-bold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 ${
                      loading || confirmText !== 'DELETE'
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-400 shadow-lg hover:shadow-red-500/25'
                    }`}
                  >
                    {loading ? '⏳ Deleting...' : '💀 Delete Account Permanently'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Back to Chat Button */}
        <div className="text-center mt-8 sm:mt-12">
          <button
            onClick={() => window.location.href = '/chat'}
            className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
          >
            💬 Back to Chat
          </button>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;  /* Internet Explorer 10+ */
          scrollbar-width: none;  /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar { 
          display: none;  /* Safari and Chrome */
        }
      `}</style>
    </div>
  );
};

export default UserSettings;