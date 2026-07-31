import React, { useState, useEffect } from "react";
import Home from "./pages/Home.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import LaunchCelebration from "./components/LaunchCelebration.jsx";

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const ADMIN_PASSWORD = "dthrift2026";

  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("https://dthrift-backend.onrender.com/api/products");
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        } else {
          console.error("Failed to fetch products from backend.");
        }
      } catch (error) {
        console.error("Error connecting to backend:", error);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "A" || e.key === "a")) {
        e.preventDefault();
        if (isAdmin) {
          setIsAdmin(false);
        } else {
          setShowPasswordModal(true);
          setPasswordInput("");
          setPasswordError("");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAdmin]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowPasswordModal(false);
      setPasswordInput("");
      setPasswordError("");
    } else {
      setPasswordError("ACCESS DENIED: INCORRECT PASSWORD");
    }
  };

  const handleOrderSuccess = (newOrder, updatedProducts) => {
    setProducts(updatedProducts);
  };

  return (
    <div className="app-container">
      <LaunchCelebration />
      
      {showPasswordModal && (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141619] border border-[#c5a059]/40 p-8 rounded-sm max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xs font-mono"
            >
              ✕ CLOSE
            </button>
            <span className="text-[9px] font-mono tracking-[0.4em] text-[#c5a059] uppercase block mb-2">
              AUTHENTICATION REQUIRED
            </span>
            <h3 className="text-xl font-serif text-white tracking-widest uppercase mb-6">
              ADMIN CONTROL PANEL
            </h3>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <input
                type="password"
                autoFocus
                placeholder="ENTER ADMIN PASSWORD"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-black/50 border border-white/20 px-4 py-3 text-xs font-mono tracking-widest text-white placeholder-gray-600 focus:outline-none focus:border-[#c5a059] transition-colors uppercase"
              />
              {passwordError && (
                <p className="text-[10px] font-mono text-rose-400 tracking-wider">{passwordError}</p>
              )}
              <button
                type="submit"
                className="w-full font-sans text-[10px] tracking-[0.35em] uppercase border border-[#c5a059] bg-[#c5a059] text-black py-3.5 hover:bg-transparent hover:text-[#c5a059] transition-all font-semibold"
              >
                ACCESS PANEL
              </button>
            </form>
          </div>
        </div>
      )}

      {isAdmin ? (
        <AdminDashboard 
          products={products} 
          setProducts={setProducts} 
          onExitAdmin={() => setIsAdmin(false)} 
        />
      ) : (
        <Home products={products} onOrderSuccess={handleOrderSuccess} />
      )}
    </div>
  );
}