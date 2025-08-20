"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import io from "socket.io-client";
import Link from "next/link";

// Chat component - main chat interface with file upload
const Chat = () => {
  // all my existing state variables
  const [socketConnection, setSocketConnection] = useState(null);
  const [myUserInfo, setMyUserInfo] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [chattingWithUser, setChattingWithUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [dummyUsersCreated, setDummyUsersCreated] = useState(false);
  const [userIsLoggedIn, setUserIsLoggedIn] = useState(false);

  // NEW: file upload state variables
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // NEW: mobile state - controls which view to show on mobile
  const [showUsersList, setShowUsersList] = useState(true);

  const messagesEndRef = useRef(null);
let userToken = null;
if (typeof window !== "undefined") {
  userToken = localStorage.getItem("token");
}

  // check if user is logged in when component loads
  useEffect(() => {
    if (!userToken) {
      setUserIsLoggedIn(false);
      setPageLoading(false);
      return;
    }
    
    // check if token is valid
    checkUserToken();
  }, [userToken]);

  // function to verify user token
  const checkUserToken = async () => {
    try {
      const serverResponse = await axios.get(process.env.NEXT_PUBLIC_API_URL + "/api/me", {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      // token is good, user is logged in
      setMyUserInfo(serverResponse.data);
      setUserIsLoggedIn(true);
      setupChatConnection();
    } catch (error) {
      // token is bad, remove it
      console.error("Token check failed:", error);
      localStorage.removeItem("token");
      setUserIsLoggedIn(false);
      setPageLoading(false);
    }
  };

  // function to setup chat connection
  const setupChatConnection = () => {
    // create socket connection
    const newSocketConnection = io(process.env.NEXT_PUBLIC_API_URL, {
      auth: { token: userToken },
    });

    setSocketConnection(newSocketConnection);

    newSocketConnection.on("connect", () => {
      console.log("Connected to chat server");
      if (myUserInfo?.email) {
        newSocketConnection.emit("join", myUserInfo.email);
      }
    });

    newSocketConnection.on("message", (incomingMessage) => {
      console.log("Got new message:", incomingMessage);
      // only show message if it's for the current chat
      if (
        (incomingMessage.sender === chattingWithUser?.email &&
          incomingMessage.receiver === myUserInfo?.email) ||
        (incomingMessage.receiver === chattingWithUser?.email &&
          incomingMessage.sender === myUserInfo?.email)
      ) {
        setChatMessages((previousMessages) => {
          // check if message already exists to avoid duplicates
          const messageAlreadyExists = previousMessages.some(msg => 
            msg._id === incomingMessage._id || 
            (msg.message === incomingMessage.message && 
             msg.timestamp === incomingMessage.timestamp &&
             msg.sender === incomingMessage.sender)
          );
          if (messageAlreadyExists) return previousMessages;
          return [...previousMessages, incomingMessage];
        });
      }
    });

    newSocketConnection.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    createDummyUsers();
  };

  // join chat room when socket connects
  useEffect(() => {
    if (socketConnection && myUserInfo?.email) {
      socketConnection.emit("join", myUserInfo.email);
    }
  }, [socketConnection, myUserInfo]);

  // function to create dummy users for testing
  const createDummyUsers = async () => {
    if (dummyUsersCreated) return;

    try {
      const testUsers = [
        { name: "Alice", email: "alice@example.com", mobile: "1111111111", password: "123456" },
        { name: "Bob", email: "bob@example.com", mobile: "2222222222", password: "123456" },
        { name: "Charlie", email: "charlie@example.com", mobile: "3333333333", password: "123456" }
      ];

      // create each dummy user
      const createUserPromises = testUsers.map(user => 
        axios.post(process.env.NEXT_PUBLIC_API_URL + "/api/signup", user)
          .catch(error => {
            if (error.response?.status === 400 && 
                error.response?.data?.message?.includes("already exists")) {
              console.log(`User ${user.email} already exists, skipping...`);
            } else {
              console.error(`Error creating user ${user.email}:`, error);
            }
          })
      );

      await Promise.all(createUserPromises);
      setDummyUsersCreated(true);
      getAllUsers();
    } catch (error) {
      console.error("Error creating dummy users:", error);
    }
  };

  // function to get all users from server
  const getAllUsers = async () => {
    try {
      const response = await axios.get(process.env.NEXT_PUBLIC_API_URL + "/api/users", {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      // filter out current user from the list
      setAllUsers(response.data.filter((user) => user.email !== myUserInfo?.email));
      setPageLoading(false);
    } catch (error) {
      console.error("Error getting users:", error);
      setPageLoading(false);
    }
  };

  // function to get messages with selected user
  const getMessagesWithUser = async (otherUserEmail) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/messages/${otherUserEmail}`,
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      );
      setChatMessages(response.data);
      scrollToBottomOfChat();
    } catch (error) {
      console.error("Error getting messages:", error);
    }
  };

  // ===== NEW FILE UPLOAD FUNCTIONS =====

  // function to handle when user selects a file
  const handleFileSelection = (event) => {
    const file = event.target.files[0];
    console.log("User selected file:", file);
    
    if (!file) return;

    // check file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      alert('File too large! Maximum size is 100MB.');
      return;
    }

    // check file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv',
      'application/pdf', 'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type! Only images, videos, and documents allowed.');
      return;
    }

    console.log("File is valid, setting as selected");
    setSelectedFile(file);
  };

  // function to upload file to server
  const uploadFileToServer = async (file) => {
    console.log("Starting file upload...");
    setUploadingFile(true);

    try {
      // create form data for file upload
      const formData = new FormData();
      formData.append('file', file);

      // send file to server
      const response = await axios.post(process.env.NEXT_PUBLIC_API_URL + "/api/upload", formData, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log("File uploaded successfully:", response.data);
      return response.data;
      
    } catch (error) {
      console.error("File upload failed:", error);
      alert('File upload failed! Please try again.');
      throw error;
    } finally {
      setUploadingFile(false);
    }
  };

  // function to remove selected file
  const removeSelectedFile = () => {
    console.log("Removing selected file");
    setSelectedFile(null);
    // clear file input
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';
  };

  // function to display files in messages
  const renderFileInMessage = (message) => {
    if (!message.fileUrl) return null;

    const fileUrl = `${process.env.NEXT_PUBLIC_API_URL}/${message.fileUrl}`;

    // show different content based on file type
    if (message.fileType === 'image') {
      return (
        <div className="mt-2">
          <img 
            src={fileUrl} 
            alt={message.fileName} 
            className="max-w-xs max-h-64 rounded-lg cursor-pointer"
            onClick={() => window.open(fileUrl, '_blank')}
          />
          <p className="text-xs opacity-75 mt-1">{message.fileName}</p>
        </div>
      );
    } else if (message.fileType === 'video') {
      return (
        <div className="mt-2">
          <video controls className="max-w-xs max-h-64 rounded-lg">
            <source src={fileUrl} />
            Your browser does not support video.
          </video>
          <p className="text-xs opacity-75 mt-1">{message.fileName}</p>
        </div>
      );
    } else {
      return (
        <div className="mt-2 p-2 bg-black bg-opacity-20 rounded">
          <a href={fileUrl} target="_blank" className="text-sm underline">
            📄 {message.fileName || "Download file"}
          </a>
        </div>
      );
    }
  };

  // function to send new message - UPDATED with file support
  const sendNewMessage = async (event) => {
    event.preventDefault();
    
    // check if we have message or file to send
    if (!newMessage.trim() && !selectedFile) {
      console.log("No message or file to send");
      return;
    }

    if (!chattingWithUser) {
      console.log("No user selected");
      return;
    }

    try {
      let fileData = null;

      // if user selected a file, upload it first
      if (selectedFile) {
        console.log("Uploading file before sending message...");
        fileData = await uploadFileToServer(selectedFile);
      }

      // prepare message data with file info
      const messageData = {
        receiverEmail: chattingWithUser.email,
        message: newMessage.trim(),
        fileUrl: fileData?.fileUrl,
        fileName: fileData?.fileName,
        fileType: fileData?.fileType,
        fileSize: fileData?.fileSize
      };

      console.log("Sending message:", messageData);

      // send message to server
      const response = await axios.post(
        process.env.NEXT_PUBLIC_API_URL + "/api/messages",
        messageData,
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      );

      console.log("Message sent successfully");

      // add to chat messages
      setChatMessages((prev) => [...prev, response.data]);
      
      // clear inputs
      setNewMessage("");
      removeSelectedFile();
      scrollToBottomOfChat();

    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    }
  };

  // UPDATED: function to select user to chat with - now handles mobile view
  const selectUserToChat = (user) => {
    setChattingWithUser(user);
    getMessagesWithUser(user.email);
    // On mobile, switch to chat view when user is selected
    setShowUsersList(false);
  };

  // NEW: function to go back to users list (mobile only)
  const goBackToUsersList = () => {
    setShowUsersList(true);
    setChattingWithUser(null);
  };

  // function to scroll to bottom of chat
  const scrollToBottomOfChat = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // loading screen while checking authentication
  if (pageLoading) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <div className="text-white text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  // login required screen
  if (!userIsLoggedIn) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto bg-gray-800 rounded-lg shadow-xl p-8 border border-purple-500 text-center">
          {/* chat icon */}
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-sky-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-purple-400 mb-4">
            Login Required
          </h2>
          
          <p className="text-gray-300 mb-6">
            You need to be logged in to access the chat. Please login or create an account to continue.
          </p>
          
          {/* login/signup buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/login"
              className="bg-purple-600 hover:bg-purple-500 text-white font-medium px-6 py-2 rounded-lg"
            >
              Login
            </Link>
            
            <Link 
              href="/signup"
              className="bg-sky-500 hover:bg-sky-400 text-white font-medium px-6 py-2 rounded-lg"
            >
              Sign Up
            </Link>
          </div>
          
          {/* back to home link */}
          <div className="mt-6">
            <Link 
              href="/"
              className="text-sky-300 hover:text-purple-300 text-sm"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // UPDATED: main chat interface with mobile responsiveness
  return (
    <div className="h-screen bg-gray-900 flex">
      
      {/* USERS LIST - Shows full width on mobile when showUsersList=true, sidebar on desktop */}
      <div className={`
        bg-gray-800 
        ${showUsersList ? 'w-full' : 'hidden'} 
        md:block md:w-1/4 
        ${!showUsersList ? 'md:w-1/4' : ''}
      `}>
        {/* sidebar header */}
        <div className="p-4 bg-purple-800 flex items-center justify-between">
          <div>
            <h2 className="text-white text-xl">Omegachat</h2>
            <p className="text-purple-200 text-sm">Hi {myUserInfo?.name}</p>
          </div>
          
          {/* Mobile menu button - only visible on mobile when in chat view */}
          <button 
            className="md:hidden text-white p-2"
            onClick={goBackToUsersList}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* users list */}
        <div className="p-4 overflow-y-auto" style={{height: 'calc(100vh - 80px)'}}>
          <h3 className="text-white mb-3 text-lg">Users</h3>
          {allUsers.length === 0 ? (
            <div className="text-gray-400 text-sm text-center py-8">
              <div className="mb-4">
                <svg className="w-12 h-12 mx-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p>No users available</p>
              <p className="text-xs mt-1">Loading users...</p>
            </div>
          ) : (
            allUsers.map((user) => (
              <div
                key={user._id}
                onClick={() => selectUserToChat(user)}
                className={`
                  p-4 mb-2 cursor-pointer rounded-lg transition-colors
                  ${chattingWithUser?._id === user._id
                    ? "bg-purple-700 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600 active:bg-purple-600"
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  {/* User avatar placeholder */}
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-sky-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-lg truncate">{user.name}</div>
                    <div className="text-sm opacity-75 truncate">{user.email}</div>
                  </div>
                  
                  {/* Mobile chevron */}
                  <div className="md:hidden">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CHAT AREA - Shows full width on mobile when showUsersList=false, right side on desktop */}
      <div className={`
        flex-1 flex flex-col
        ${!showUsersList ? 'w-full' : 'hidden'} 
        md:flex md:w-3/4
      `}>
        {chattingWithUser ? (
          <>
            {/* UPDATED: chat header with back button for mobile */}
            <div className="p-4 bg-purple-800 text-white flex items-center space-x-3 shadow-lg">
              {/* Back button - only visible on mobile */}
              <button 
                className="md:hidden p-2 -ml-2 hover:bg-purple-700 rounded-lg"
                onClick={goBackToUsersList}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {/* User avatar and info */}
              <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-sky-400 rounded-full flex items-center justify-center text-white font-semibold">
                {chattingWithUser.name.charAt(0).toUpperCase()}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold truncate">{chattingWithUser.name}</h3>
                <p className="text-sm text-purple-200 truncate">{chattingWithUser.email}</p>
              </div>
              
              {/* Optional: More options button */}
              <button className="p-2 hover:bg-purple-700 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>

            {/* File preview area (shows when file is selected) */}
            {selectedFile && (
              <div className="bg-yellow-50 border-b border-yellow-200 p-3">
                <div className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm border">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <span className="text-blue-500 text-xl">📎</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{selectedFile.name}</p>
                      <p className="text-sm text-gray-600">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={removeSelectedFile}
                    className="text-red-500 hover:text-red-700 p-2 ml-2 hover:bg-red-50 rounded-lg"
                    disabled={uploadingFile}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {uploadingFile && (
                  <div className="mt-2 text-sm text-gray-600 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Uploading file...</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* UPDATED: messages area with better mobile styling */}
            <div className="flex-1 p-3 md:p-4 overflow-y-auto bg-gray-900" style={{height: 'calc(100vh - 140px)'}}>
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-400 mt-10 px-4">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-sky-500 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-lg mb-2">No messages yet</p>
                  <p className="text-sm">Start the conversation!</p>
                  <p className="text-xs mt-2 text-gray-500">Send text, photos, videos, or documents</p>
                </div>
              ) : (
                chatMessages.map((message, messageIndex) => (
                  <div
                    key={messageIndex}
                    className={`mb-3 flex ${
                      message.sender === myUserInfo?.email
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`
                        inline-block p-3 max-w-xs sm:max-w-md rounded-2xl shadow-sm
                        ${message.sender === myUserInfo?.email
                          ? "bg-purple-600 text-white rounded-br-md"
                          : "bg-gray-700 text-white rounded-bl-md"
                        }
                      `}
                    >
                      {/* text message */}
                      {message.message && <p className="break-words">{message.message}</p>}
                      
                      {/* File display */}
                      {renderFileInMessage(message)}
                      
                      <p className="text-xs mt-1 opacity-75">
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* UPDATED: message input with better mobile layout */}
            <form onSubmit={sendNewMessage} className="p-3 md:p-4 bg-gray-800">
              <div className="flex items-end space-x-2 md:space-x-3">
                
                {/* File upload button */}
                <div>
                  <input
                    type="file"
                    id="fileInput"
                    onChange={handleFileSelection}
                    accept="image/*,video/*,.pdf,.txt"
                    className="hidden"
                    disabled={uploadingFile}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('fileInput').click()}
                    className="bg-gray-600 hover:bg-gray-500 text-white p-3 rounded-full disabled:opacity-50 transition-colors"
                    disabled={uploadingFile}
                    title="Upload photo, video, or document"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                </div>

                {/* message input */}
                <div className="flex-1">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-full focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    disabled={uploadingFile}
                  />
                </div>

                {/* send button */}
                <button
                  type="submit"
                  disabled={(!newMessage.trim() && !selectedFile) || uploadingFile}
                  className="p-3 bg-purple-600 text-white rounded-full hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                  {uploadingFile ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
              
              {/* File type info - more compact on mobile */}
              <div className="mt-2 text-xs text-gray-400 text-center md:text-left">
                📎 Images, Videos, Documents • Max 100MB
              </div>
            </form>
          </>
        ) : (
          // UPDATED: welcome screen when no user is selected
          <div className="flex-1 flex items-center justify-center bg-gray-900 p-4">
            <div className="text-center text-gray-400 max-w-sm">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-sky-500 rounded-full flex items-center justify-center mx-auto mb-6 opacity-70">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl text-white mb-3 font-semibold">Welcome to Omegachat!</h3>
              
              {/* Desktop message */}
              <div className="hidden md:block">
                <p className="text-lg mb-2">Select a user from the left to start chatting</p>
                <p className="text-sm text-gray-500">
                  Send messages, photos, videos, and documents!
                </p>
              </div>
              
              {/* Mobile message */}
              <div className="md:hidden">
                <p className="text-lg mb-4">Choose someone to chat with</p>
                <button 
                  onClick={() => setShowUsersList(true)}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-full font-medium transition-colors"
                >
                  View Contacts
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;