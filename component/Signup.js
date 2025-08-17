"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

// Signup page - create new user account
export default function Signup() {
  // state for form inputs
  const [userForm, setUserForm] = useState({ 
    name: "", 
    email: "", 
    mobile: "", 
    password: "" 
  });
  const [submittingForm, setSubmittingForm] = useState(false);
  const router = useRouter();

  // function to handle input changes
  const handleInputChange = (e) => {
    const inputName = e.target.name;
    const inputValue = e.target.value;
    
    // update form state with new value
    setUserForm({ 
      ...userForm, 
      [inputName]: inputValue 
    });
  };

  // function to submit signup form
  const handleFormSubmit = async (e) => {
    e.preventDefault(); // stop page from refreshing
    setSubmittingForm(true);
    
    try {
      // send user data to backend
      const serverResponse = await axios.post(process.env.NEXT_PUBLIC_API_URL + "/api/signup", userForm);
      
      // if backend returns token, save it and login user
      if (serverResponse.data.token) {
        localStorage.setItem("token", serverResponse.data.token);
        alert("Account created successfully! You are now logged in.");
        
        // go to home page and refresh navbar
        window.location.href = "/";
      } else {
        // if no token, just show success message
        alert("Account created successfully! Please login.");
        router.push("/login");
      }
      
    } catch (error) {
      // show error if something went wrong
      console.log("Signup error:", error);
      alert(error.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmittingForm(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      {/* signup form box */}
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8 border border-sky-500">
        {/* title */}
        <h2 className="text-3xl font-bold text-center text-sky-400 mb-6">Create an Account</h2>

        {/* form for new user */}
        <form className="space-y-5" onSubmit={handleFormSubmit}>
          {/* name field */}
          <div>
            <label className="block text-sm text-purple-300 mb-2">Name</label>
            <input
              name="name"
              placeholder="Enter your name"
              value={userForm.name}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-500 focus:border-purple-400 focus:outline-none"
              required
              disabled={submittingForm}
            />
          </div>

          {/* email field */}
          <div>
            <label className="block text-sm text-purple-300 mb-2">Email</label>
            <input
              name="email"
              type="email"
              placeholder="Enter your email"
              value={userForm.email}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-500 focus:border-purple-400 focus:outline-none"
              required
              disabled={submittingForm}
            />
          </div>

          {/* mobile field */}
          <div>
            <label className="block text-sm text-purple-300 mb-2">Mobile</label>
            <input
              name="mobile"
              placeholder="Enter your mobile number"
              value={userForm.mobile}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-500 focus:border-purple-400 focus:outline-none"
              required
              disabled={submittingForm}
            />
          </div>

          {/* password field */}
          <div>
            <label className="block text-sm text-purple-300 mb-2">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={userForm.password}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-500 focus:border-purple-400 focus:outline-none"
              required
              disabled={submittingForm}
            />
          </div>

          {/* submit button */}
          <button
            type="submit"
            disabled={submittingForm}
            className="w-full bg-sky-500 hover:bg-sky-400 disabled:bg-sky-400 p-3 rounded-lg text-white font-semibold shadow-md disabled:cursor-not-allowed"
          >
            {submittingForm ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        {/* login link */}
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Already have an account?{" "}
            <a href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}