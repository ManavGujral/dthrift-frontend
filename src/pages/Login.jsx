import React, { useState } from "react";

export default function Login({ onLoginSuccess, onSwitchToSignup, onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("https://dthrift-backend.onrender.com/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to log in.");
      }

      alert("Logged in successfully!");
      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1005] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#141619] border border-[#c5a059]/40 p-8 rounded-sm max-w-md w-full shadow-2xl relative">
        
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white text-xs font-mono hover:rotate-90 transition-transform cursor-pointer"
          >
            ✕ CLOSE
          </button>
        )}

        <span className="text-[9px] font-mono tracking-[0.4em] text-[#c5a059] uppercase block mb-2">
          DTHRIFT PORTAL
        </span>
        <h3 className="text-2xl font-serif text-white tracking-widest uppercase mb-6">
          LOG IN
        </h3>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono tracking-widest text-gray-400 mb-1 uppercase">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="ENTER YOUR EMAIL"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-white/20 px-4 py-3 text-xs font-mono tracking-widest text-white placeholder-gray-600 focus:outline-none focus:border-[#c5a059] transition-colors uppercase"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono tracking-widest text-gray-400 mb-1 uppercase">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="ENTER YOUR PASSWORD"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-white/20 px-4 py-3 text-xs font-mono tracking-widest text-white placeholder-gray-600 focus:outline-none focus:border-[#c5a059] transition-colors uppercase"
            />
          </div>

          {error && (
            <p className="text-[10px] font-mono text-rose-400 tracking-wider">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full font-sans text-[10px] tracking-[0.35em] uppercase border border-[#c5a059] bg-[#c5a059] text-black py-3.5 hover:bg-transparent hover:text-[#c5a059] transition-all font-semibold cursor-pointer disabled:opacity-50"
          >
            {loading ? "LOGGING IN..." : "LOG IN"}
          </button>
        </form>

        {onSwitchToSignup && (
          <div className="mt-6 text-center">
            <button
              onClick={onSwitchToSignup}
              className="text-[10px] font-mono tracking-widest text-gray-400 hover:text-[#c5a059] transition-colors uppercase cursor-pointer"
            >
              Don't have an account? Sign Up
            </button>
          </div>
        )}
      </div>
    </div>
  );
}