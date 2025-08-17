"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
   
    try {
      // Fixed: Added proper slash before /api/login
      const res = await axios.post(process.env.NEXT_PUBLIC_API_URL + "/api/login", form);
      
      // Save token in localStorage
      localStorage.setItem("token", res.data.token);
      
      // Show success message
      alert("Login successful! Welcome back.");
     
      // Force a page refresh to update navbar state, then redirect
      window.location.href = "/"; // This will refresh the entire page and update navbar
     
    } catch (err) {
      console.error("Login error:", err);
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8 border border-purple-500">
        <h2 className="text-3xl font-bold text-center text-purple-400 mb-6">Welcome Back</h2>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm text-sky-300 mb-2">Email</label>
            <input
              name="email"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-500 focus:border-sky-400 focus:outline-none transition-all duration-200"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm text-sky-300 mb-2">Password</label>
            <input
              name="password"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-500 focus:border-sky-400 focus:outline-none transition-all duration-200"
              required
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-400 transition-all duration-200 p-3 rounded-lg text-white font-semibold shadow-md disabled:cursor-not-allowed"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Don't have an account?{" "}
            <a href="/signup" className="text-sky-400 hover:text-sky-300 font-medium">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}