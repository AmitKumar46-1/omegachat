"use client";
import Link from "next/link";

// About page for my chat app
export default function About() {
  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* main heading section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            {/* logo box */}
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-sky-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">AC</span>
            </div>
            {/* app name with gradient */}
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-sky-400 bg-clip-text text-transparent">
              Omegachat
            </h1>
          </div>
          {/* description text */}
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            A modern, real-time chat application that brings people together through seamless communication
          </p>
        </div>

        {/* two column layout */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          
          {/* what is Omegachat section */}
          <div className="bg-gray-800 rounded-lg p-8 border border-purple-500">
            <h2 className="text-2xl font-bold text-purple-400 mb-4">What is Omegachat?</h2>
            <p className="text-gray-300 leading-relaxed">
              Omegachat is a real-time messaging platform designed for instant communication. 
              Built with modern web technologies, it provides a fast, secure, and user-friendly 
              chat experience. Whether you want to connect with friends, family, or colleagues, 
              Omegachat makes it simple and enjoyable.
            </p>
          </div>

          {/* mission section */}
          <div className="bg-gray-800 rounded-lg p-8 border border-sky-500">
            <h2 className="text-2xl font-bold text-sky-400 mb-4">Our Mission</h2>
            <p className="text-gray-300 leading-relaxed">
              To create a simple yet powerful communication platform that connects people 
              instantly. We believe in making technology accessible and enjoyable for everyone, 
              focusing on clean design, reliable performance, and user privacy.
            </p>
          </div>
        </div>

        {/* features section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-white mb-8">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            
            {/* real-time messaging feature */}
            <div className="bg-gray-800 rounded-lg p-6 text-center border border-gray-700 hover:border-purple-500 transition-all duration-200">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                {/* message icon */}
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-purple-400 mb-2">Real-time Messaging</h3>
              <p className="text-gray-400 text-sm">
                Instant message delivery with live notifications and real-time updates
              </p>
            </div>

            {/* secure authentication feature */}
            <div className="bg-gray-800 rounded-lg p-6 text-center border border-gray-700 hover:border-sky-500 transition-all duration-200">
              <div className="w-12 h-12 bg-sky-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                {/* lock icon */}
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-sky-400 mb-2">Secure Authentication</h3>
              <p className="text-gray-400 text-sm">
                Protected user accounts with JWT tokens and encrypted passwords
              </p>
            </div>

            {/* easy to use feature */}
            <div className="bg-gray-800 rounded-lg p-6 text-center border border-gray-700 hover:border-purple-500 transition-all duration-200">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-sky-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                {/* smiley icon */}
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M15 14h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-purple-400 mb-2">Easy to Use</h3>
              <p className="text-gray-400 text-sm">
                Simple, intuitive interface that anyone can use without training
              </p>
            </div>
          </div>
        </div>

        {/* technology stack section */}
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Built With Modern Technology</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* frontend technologies */}
            <div>
              <h3 className="text-lg font-semibold text-purple-400 mb-3">Frontend</h3>
              <ul className="text-gray-300 space-y-2">
                <li>• Next.js - React framework for production</li>
                <li>• Tailwind CSS - Modern utility-first CSS</li>
                <li>• Socket.IO Client - Real-time communication</li>
                <li>• Axios - HTTP client for API calls</li>
              </ul>
            </div>
            {/* backend technologies */}
            <div>
              <h3 className="text-lg font-semibold text-sky-400 mb-3">Backend</h3>
              <ul className="text-gray-300 space-y-2">
                <li>• Node.js & Express - Server framework</li>
                <li>• MongoDB - Database for messages & users</li>
                <li>• Socket.IO - Real-time WebSocket connections</li>
                <li>• JWT - Secure user authentication</li>
              </ul>
            </div>
          </div>
        </div>

        {/* call to action section */}
        <div className="text-center bg-gradient-to-r from-purple-900 to-sky-900 rounded-lg p-8 border border-purple-500">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Start Chatting?</h2>
          <p className="text-gray-300 mb-6">
            Join Omegachat today and connect with people instantly. It's free, fast, and easy to get started.
          </p>
          {/* action buttons */}
          <div className="flex justify-center gap-4">
            <Link 
              href="/signup"
              className="bg-gradient-to-r from-sky-500 to-purple-500 hover:from-sky-400 hover:to-purple-400 text-white font-medium px-8 py-3 rounded-lg shadow-lg hover:shadow-xl"
            >
              Get Started
            </Link>
            <Link 
              href="/chat"
              className="text-purple-300 hover:text-purple-100 font-medium px-8 py-3 border border-purple-500 rounded-lg hover:bg-purple-500 "
            >
              Try Chat
            </Link>
          </div>
        </div>

        {/* simple footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-700">
          <p className="text-gray-400">
            Made with ❤️ using modern web technologies
          </p>
          <div className="mt-4">
            <Link 
              href="/"
              className="text-sky-400 hover:text-sky-300"
            >
              ← Back to Home
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}