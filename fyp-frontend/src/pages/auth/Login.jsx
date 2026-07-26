import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { BookOpen, Lock, Mail } from "lucide-react";

export default function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Call login with only email and password — no role needed
    const result = await login(email, password);

    setLoading(false);

    if (result.success) {
      // Backend already detected the role — navigate based on it
      const role = result.user?.role;
      if (role === "admin")        navigate("/admin");
      else if (role === "teacher") navigate("/teacher");
      else                         navigate("/student");
    } else {
      setError(result.message);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/bg3.jpg')" }}
    >
      <div className="bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-lg w-full max-w-md border border-slate-200">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="w-28 h-28 mx-auto mb-4">
            <img
              src="/logoassesspng.png"
              alt="Assess.io Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Assess.io</h1>
          <p className="text-slate-500 text-sm mt-1">
            AI-Powered Assignment Grading System
          </p>
        </div>

        {/* Error message shown when login fails */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-5 text-sm text-center border border-red-100">
            {error}
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* Role dropdown removed — system detects role automatically from credentials */}

          {/* Submit button — shows loading state while waiting for response */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg transition-colors shadow-md active:scale-95 mt-2"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-600 mt-6">
          Your portal is determined automatically based on your account.
        </p>
      </div>
    </div>
  );
}