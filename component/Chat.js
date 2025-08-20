"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import io from "socket.io-client";
import Link from "next/link";

// Chat component - main chat interface with file upload
const Chat = () => {
  // Mobile state
  const [isMobile, setIsMobile] = useState(false);
  const [showUserList, setShowUserList] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  // All existing state variables
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState("");
  
  // Refs
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Check if mobile screen
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setShowUserList(true); // Always show user list on desktop
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    // Initialize socket
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL, {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to server');
      setError("");
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      setError('Connection failed. Please refresh the page.');
    });

    // Listen for new messages
    newSocket.on('newMessage', (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    // Listen for message updates
    newSocket.on('messageUpdated', (updatedMessage) => {
      setMessages(prev => prev.map(msg => 
        msg._id === updatedMessage._id ? updatedMessage : msg
      ));
    });

    // Listen for message deletions
    newSocket.on('messageDeleted', (messageId) => {
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
    });

    // Listen for online users
    newSocket.on('userOnline', (userId) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
    });

    newSocket.on('userOffline', (userId) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    // Listen for typing indicators
    newSocket.on('userTyping', (data) => {
      setTypingUsers(prev => new Set([...prev, data.userId]));
      setTimeout(() => {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }, 3000);
    });

    newSocket.on('userStoppedTyping', (data) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    });

    setSocket(newSocket);

    // Cleanup
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  // Load initial data
  useEffect(() => {
    loadCurrentUser();
    loadUsers();
    loadMessages();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load current user profile
  const loadCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUser(response.data);
    } catch (error) {
      console.error('❌ Error loading current user:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
  };

  // Load all users for chat list
  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('❌ Error loading users:', error);
      setError('Failed to load users');
    }
  };

  // Load chat messages
  const loadMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      setError('Failed to load messages');
    }
  };

  // Handle mobile user selection
  const handleUserSelect = (user) => {
    if (isMobile) {
      setSelectedUser(user);
      setShowUserList(false);
    }
  };

  // Handle back to user list (mobile)
  const handleBackToUserList = () => {
    setShowUserList(true);
    setSelectedUser(null);
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (!socket || !currentUser) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { userId: currentUser._id });
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('stopTyping', { userId: currentUser._id });
    }, 2000);
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }

    setError("");
  };

  // Clear selected file
  const clearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if ((!newMessage.trim() && !selectedFile) || loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      if (newMessage.trim()) {
        formData.append('message', newMessage.trim());
      }
      
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/messages`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Clear form
      setNewMessage("");
      clearFile();
      setSuccess("Message sent! 📤");
      
      // Clear success message
      setTimeout(() => setSuccess(""), 2000);
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      setError('Failed to send message: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
      
      // Stop typing indicator
      if (socket && currentUser) {
        socket.emit('stopTyping', { userId: currentUser._id });
        setIsTyping(false);
      }
    }
  };

  // Edit message
  const startEdit = (message) => {
    setEditingMessage(message._id);
    setEditText(message.message);
  };

  const saveEdit = async () => {
    if (!editText.trim() || !editingMessage) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/${editingMessage}`, {
        message: editText.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setEditingMessage(null);
      setEditText("");
      setSuccess("Message updated! ✏️");
      setTimeout(() => setSuccess(""), 2000);
      
    } catch (error) {
      console.error('❌ Error updating message:', error);
      setError('Failed to update message');
    }
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setEditText("");
  };

  // Delete message
  const deleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess("Message deleted! 🗑️");
      setTimeout(() => setSuccess(""), 2000);
      
    } catch (error) {
      console.error('❌ Error deleting message:', error);
      setError('Failed to delete message');
    }
  };

  // Filter messages based on selected user (mobile)
  const getFilteredMessages = () => {
    if (!isMobile || !selectedUser) return messages;
    
    return messages.filter(msg => 
      (msg.senderId?._id === selectedUser._id || msg.senderEmail === selectedUser.email) ||
      (msg.senderId?._id === currentUser?._id || msg.senderEmail === currentUser?.email)
    );
  };

  // Get user avatar
  const getUserAvatar = (user) => {
    return user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.email)}&background=8b5cf6&color=ffffff&size=40`;
  };

  // Check if user is online
  const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };

  // Get last message with user
  const getLastMessage = (user) => {
    const userMessages = messages.filter(msg => 
      msg.senderId?._id === user._id || msg.senderEmail === user.email
    );
    return userMessages[userMessages.length - 1];
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⚡</div>
          <div className="text-white text-xl">Loading Chat...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Mobile Header */}
      {isMobile && (
        <div className="bg-purple-800 p-4 border-b border-purple-600/30">
          <div className="flex items-center justify-between">
            {!showUserList ? (
              // Chat header with selected user
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBackToUserList}
                  className="text-white hover:text-purple-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                {selectedUser && (
                  <>
                    <img
                      src={getUserAvatar(selectedUser)}
                      alt={selectedUser.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <div className="font-semibold text-sm">{selectedUser.name}</div>
                      <div className="text-xs text-purple-200">
                        {isUserOnline(selectedUser._id) ? '🟢 Online' : '⚫ Offline'}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              // User list header
              <div className="flex items-center gap-3">
                <div className="text-lg font-bold">💬 Chats</div>
              </div>
            )}
            
            <Link
              href="/settings"
              className="text-white hover:text-purple-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
          </div>
        </div>
      )}

      <div className="flex h-screen">
        {/* DESKTOP SIDEBAR / MOBILE USER LIST */}
        {(!isMobile || showUserList) && (
          <div className={`${isMobile ? 'w-full' : 'w-1/3 border-r'} border-purple-500/30 bg-gray-900`}>
            {/* Desktop Header */}
            {!isMobile && (
              <div className="bg-purple-800 p-6 border-b border-purple-600/30">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold">💬 Chat Users</h1>
                  <Link
                    href="/settings"
                    className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105"
                  >
                    ⚙️ Settings
                  </Link>
                </div>
                <div className="mt-4 text-purple-200 text-sm">
                  Welcome back, <strong>{currentUser.name}</strong>! 👋
                </div>
              </div>
            )}

            {/* User List */}
            <div className="overflow-y-auto h-full">
              {users.filter(user => user._id !== currentUser._id).map((user) => {
                const lastMsg = getLastMessage(user);
                const isOnline = isUserOnline(user._id);

                return (
                  <div
                    key={user._id}
                    onClick={() => handleUserSelect(user)}
                    className={`p-4 border-b border-gray-700/50 hover:bg-purple-800/30 cursor-pointer transition-all duration-200 ${
                      selectedUser?._id === user._id ? 'bg-purple-800/50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={getUserAvatar(user)}
                          alt={user.name}
                          className="w-12 h-12 rounded-full"
                        />
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-900 ${
                          isOnline ? 'bg-green-500' : 'bg-gray-500'
                        }`}></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-white truncate">{user.name}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            isOnline ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-400 truncate">
                          {typingUsers.has(user._id) ? (
                            <span className="text-purple-400 italic">✍️ typing...</span>
                          ) : lastMsg ? (
                            <>
                              {lastMsg.senderId?._id === currentUser._id ? 'You: ' : ''}
                              {lastMsg.message || (lastMsg.fileUrl ? '📎 File' : 'New message')}
                            </>
                          ) : (
                            'No messages yet'
                          )}
                        </div>
                        
                        {lastMsg && (
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(lastMsg.timestamp).toLocaleDateString() === new Date().toLocaleDateString() 
                              ? new Date(lastMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                              : new Date(lastMsg.timestamp).toLocaleDateString()
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {users.length <= 1 && (
                <div className="p-8 text-center text-gray-400">
                  <div className="text-4xl mb-4">👥</div>
                  <div className="text-lg mb-2">No other users</div>
                  <div className="text-sm">Invite friends to start chatting!</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CHAT AREA */}
        {(!isMobile || !showUserList) && (
          <div className={`${isMobile ? 'w-full' : 'flex-1'} flex flex-col bg-gray-950`}>
            {/* Desktop Chat Header */}
            {!isMobile && (
              <div className="bg-purple-800 p-6 border-b border-purple-600/30">
                <h2 className="text-xl font-bold">
                  🌟 Global Chat Room
                </h2>
                <div className="text-purple-200 text-sm mt-1">
                  {users.length} user{users.length !== 1 ? 's' : ''} • {messages.length} message{messages.length !== 1 ? 's' : ''}
                </div>
              </div>
            )}

            {/* Status Messages */}
            {(error || success) && (
              <div className="p-4 border-b border-gray-700">
                {error && (
                  <div className="bg-red-900/50 text-red-300 p-3 rounded-lg mb-2 border border-red-500/30">
                    ❌ {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-900/50 text-green-300 p-3 rounded-lg border border-green-500/30">
                    {success}
                  </div>
                )}
              </div>
            )}

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {getFilteredMessages().map((message) => {
                const isOwnMessage = message.senderId?._id === currentUser._id || message.senderEmail === currentUser.email;
                const messageUser = message.senderId || { name: 'Unknown', email: message.senderEmail };

                return (
                  <div key={message._id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs sm:max-w-md lg:max-w-lg ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                      {/* Message Bubble */}
                      <div
                        className={`relative p-3 sm:p-4 rounded-2xl shadow-lg ${
                          isOwnMessage 
                            ? 'bg-gradient-to-br from-purple-600 to-purple-500 text-white' 
                            : 'bg-gray-800 text-white border border-gray-700'
                        }`}
                      >
                        {/* Sender Name (for incoming messages) */}
                        {!isOwnMessage && !isMobile && (
                          <div className="text-xs text-purple-300 mb-1 font-semibold">
                            {messageUser.name}
                          </div>
                        )}

                        {/* Message Content */}
                        {editingMessage === message._id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:outline-none focus:border-purple-400"
                              onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={saveEdit}
                                className="text-xs bg-green-600 hover:bg-green-500 px-2 py-1 rounded transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Text Message */}
                            {message.message && (
                              <div className="text-sm sm:text-base leading-relaxed">
                                {message.message}
                              </div>
                            )}

                            {/* File Attachment */}
                            {message.fileUrl && (
                              <div className="mt-2">
                                {message.fileType?.startsWith('image/') ? (
                                  <img
                                    src={`${process.env.NEXT_PUBLIC_API_URL}${message.fileUrl}`}
                                    alt="Shared image"
                                    className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}${message.fileUrl}`, '_blank')}
                                  />
                                ) : (
                                  <a
                                    href={`${process.env.NEXT_PUBLIC_API_URL}${message.fileUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg transition-colors text-sm"
                                  >
                                    📎 {message.fileName || 'Download File'}
                                  </a>
                                )}
                              </div>
                            )}
                          </>
                        )}

                        {/* Message Actions (Own Messages) */}
                        {isOwnMessage && editingMessage !== message._id && (
                          <div className="flex justify-end gap-2 mt-2">
                            <button
                              onClick={() => startEdit(message)}
                              className="text-xs opacity-70 hover:opacity-100 transition-opacity"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => deleteMessage(message._id)}
                              className="text-xs opacity-70 hover:opacity-100 transition-opacity"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Message Info */}
                      <div className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {message.edited && <span className="ml-1 italic">✏️ edited</span>}
                      </div>
                    </div>

                    {/* Avatar (for incoming messages on desktop) */}
                    {!isOwnMessage && !isMobile && (
                      <div className="order-2 ml-3">
                        <img
                          src={getUserAvatar(messageUser)}
                          alt={messageUser.name}
                          className="w-8 h-8 rounded-full"
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing Indicators */}
              {Array.from(typingUsers).length > 0 && (
                <div className="flex justify-start">
                  <div className="max-w-xs">
                    <div className="bg-gray-800 p-3 rounded-2xl border border-gray-700">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                        </div>
                        <span className="text-xs text-gray-400">Someone is typing...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* File Preview */}
            {selectedFile && (
              <div className="p-4 bg-gray-800 border-t border-gray-700">
                <div className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    {filePreview ? (
                      <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-purple-600 rounded flex items-center justify-center text-white">
                        📎
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-white">{selectedFile.name}</div>
                      <div className="text-xs text-gray-400">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={clearFile}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    ❌
                  </button>
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="p-4 bg-gray-900 border-t border-purple-500/30">
              <form onSubmit={sendMessage} className="flex items-end gap-3">
                {/* File Upload Button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-shrink-0 bg-purple-600 hover:bg-purple-500 p-3 rounded-full transition-all duration-300 transform hover:scale-105 text-white"
                >
                  📎
                </button>

                {/* Message Input */}
                <div className="flex-1 relative">
                  <textarea
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(e);
                      }
                    }}
                    placeholder={selectedFile ? "Add a caption (optional)" : "Type your message..."}
                    className="w-full bg-gray-800 text-white p-3 pr-12 rounded-2xl border border-gray-600 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 resize-none min-h-[48px] max-h-32"
                    rows="1"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#8b5cf6 #374151'
                    }}
                  />
                  
                  {/* Emoji Button */}
                  <button
                    type="button"
                    onClick={() => setNewMessage(prev => prev + "😊")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-400 transition-colors"
                  >
                    😊
                  </button>
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={loading || (!newMessage.trim() && !selectedFile)}
                  className={`flex-shrink-0 p-3 rounded-full font-bold transition-all duration-300 transform hover:scale-105 ${
                    loading || (!newMessage.trim() && !selectedFile)
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg hover:shadow-purple-500/25'
                  }`}
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </form>

              {/* Mobile Input Helper Text */}
              {isMobile && (
                <div className="text-xs text-gray-500 mt-2 text-center">
                  {selectedFile ? `📎 ${selectedFile.name}` : "Tap 📎 to share files • 😊 for emoji"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation (when in user list) */}
      {isMobile && showUserList && (
        <div className="fixed bottom-0 left-0 right-0 bg-purple-800 border-t border-purple-600/30 p-4">
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <div className="text-2xl mb-1">💬</div>
              <div className="text-xs text-purple-200">Chats</div>
            </div>
            <Link href="/settings" className="text-center">
              <div className="text-2xl mb-1">⚙️</div>
              <div className="text-xs text-purple-200">Settings</div>
            </Link>
          </div>
        </div>
      )}

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Custom scrollbar for message area */
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: #374151;
          border-radius: 3px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #8b5cf6;
          border-radius: 3px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #a855f7;
        }
        
        /* Auto-resize textarea */
        textarea {
          field-sizing: content;
        }
      `}</style>
    </div>
  );
};

export default Chat;