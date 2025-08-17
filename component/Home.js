"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-sky-900 text-white flex flex-col items-center justify-center text-center p-6">
      
      {/* Title */}
      <h1 className="text-5xl md:text-7xl font-extrabold text-sky-300 drop-shadow-lg">
        Welcome to AlphaChat
      </h1>

      {/* Subtitle */}
      <p className="mt-6 text-lg md:text-xl max-w-2xl text-purple-200">
        AlphaChat is your modern, fast, and secure chatting platform.  
        Connect with friends in real-time and enjoy a sleek, dark-themed interface.
      </p>

      {/* Call to Action Buttons */}
      <div className="mt-10 flex gap-6 flex-wrap justify-center">
        <Link
          href="/signup"
          className="px-6 py-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold shadow-md transition"
        >
          Get Started
        </Link>
        <Link
          href="/login"
          className="px-6 py-3 rounded-lg bg-purple-500 hover:bg-purple-400 text-white font-semibold shadow-md transition"
        >
          Login
        </Link>
      </div>

      {/* About Section */}
      <div className="mt-20 max-w-3xl bg-gray-800 bg-opacity-60 p-8 rounded-xl border border-purple-500 shadow-lg">
        <h2 className="text-3xl font-bold text-sky-300">About AlphaChat</h2>
        <p className="mt-4 text-purple-200 leading-relaxed">
          AlphaChat is built to make conversations more engaging, faster, and more secure.  
          With our real-time messaging system, you can chat with friends without delays.  
          Your privacy is our top priority, so all messages are encrypted for complete security.  
          Whether you're catching up with friends or meeting new people, AlphaChat ensures a smooth and beautiful chatting experience.
        </p>
      </div>
    </div>
  );
}
