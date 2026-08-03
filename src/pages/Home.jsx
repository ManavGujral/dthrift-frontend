import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";
import Signup from "./Signup";
import Login from "./Login";

export default function Home({ products = [], onOrderSuccess }) {
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  const [copied, setCopied] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  
  // Mobile Menu States
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuView, setMenuView] = useState("main"); // 'main' or 'collections'
  
  // Tracking Modal States
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingId, setTrackingId] = useState("");

  // Auth / Modal States
  const [authMode, setAuthMode] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Checkout Info Modal States
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    pincode: "",
  });

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("token"); 
    localStorage.removeItem("user"); 
  };

  // Search States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Store States
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeTab, setActiveTab] = useState("details");

  const selectedSize = "FREE SIZE";

  const PHONE_NUMBER = "+91 73872 02668";
  const INSTAGRAM_URL = "https://www.instagram.com/dthriftdrops/";

  const handleImageError = (e, item) => {
    e.target.onerror = null; 
    if (!e.target.src || e.target.src.trim() === "" || e.target.src.includes("undefined")) {
      e.target.src = "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=800";
    }
  };

  // Reset menu view when drawer closes
  useEffect(() => {
    if (!isMenuOpen) {
      setTimeout(() => setMenuView("main"), 300);
    }
  }, [isMenuOpen]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleMouseMove = (e, cardId) => {
    const card = document.getElementById(cardId);
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;

    gsap.to(card, {
      rotateX: rotateX,
      rotateY: rotateY,
      transformPerspective: 1000,
      duration: 0.4,
      ease: "power2.out"
    });
  };

  const handleMouseLeave = (cardId) => {
    const card = document.getElementById(cardId);
    if (!card) return;
    gsap.to(card, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.6,
      ease: "power2.out"
    });
  };

  const addToCart = (product) => {
    const currentStock = products.find((p) => p.id === product.id)?.stock || 0;
    const currentInCart = cart.find((item) => item.id === product.id)?.quantity || 0;

    if (currentInCart >= currentStock) {
      alert(`Only ${currentStock} piece(s) available in stock!`);
      return;
    }

    setCart((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, size: selectedSize, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const totalAmount = cart.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0);

  const handleOpenCheckoutModal = () => {
    if (cart.length === 0) return;
    if (currentUser) {
      setCustomerInfo((prev) => ({
        ...prev,
        name: currentUser.name || "",
        email: currentUser.email || "",
      }));
    }
    setIsCartOpen(false);
    setShowCheckoutModal(true);
  };

  const handleCheckout = async (e) => {
    if (e) e.preventDefault();

    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      alert("Please fill in your Name, Mobile Number, and Delivery Address.");
      return;
    }

    if (!window.Razorpay) {
      alert("Razorpay SDK failed to load. Please check your internet connection.");
      return;
    }

    try {
      const orderRes = await fetch("https://dthrift-backend.onrender.com/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: totalAmount }),
      });
      
      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        throw new Error(orderData.error || "Failed to create order");
      }

      const options = {
        key: import.meta.env?.VITE_RAZORPAY_KEY_ID || process.env.REACT_APP_RAZORPAY_KEY_ID || "rzp_test_THIYaRtmaw8L2O",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "DTHRIFT",
        description: "Order Payment",
        order_id: orderData.id,
        image: "/IMG_6260.PNG",
        handler: async function (response) {
          try {
            const apiRes = await fetch("https://dthrift-backend.onrender.com/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                items: cart, 
                customerDetails: customerInfo,
              }),
            });

            const data = await apiRes.json();

            if (!apiRes.ok || !data.success) {
              throw new Error(data.error || "Payment verification failed.");
            }

            const updatedProducts = products.map((prod) => {
              const cartItem = cart.find((c) => c.id === prod.id);
              if (cartItem) {
                const newStock = Math.max(0, prod.stock - cartItem.quantity);
                return { ...prod, stock: newStock };
              }
              return prod;
            });

            const newOrder = {
              id: orderData.id,
              paymentId: response.razorpay_payment_id,
              customer: customerInfo.name,
              phone: customerInfo.phone,
              email: customerInfo.email,
              address: `${customerInfo.address}, ${customerInfo.city} - ${customerInfo.pincode}`,
              items: cart.map((i) => `${i.title} [${i.size}] (x${i.quantity})`).join(", "),
              itemCount: cart.reduce((acc, curr) => acc + curr.quantity, 0),
              amount: totalAmount,
              status: "Paid",
              city: customerInfo.city || "India",
              date: new Date().toISOString().replace("T", " ").substring(0, 16),
            };

            if (onOrderSuccess) {
              onOrderSuccess(newOrder, updatedProducts);
            }

            alert(`Payment Successful! Order recorded live in database.`);
            setCart([]);
            setShowCheckoutModal(false);
          } catch (err) {
            console.error("Verification Error:", err);
            alert("Payment verified, but server record creation failed: " + err.message);
          }
        },
        prefill: {
          contact: customerInfo.phone, 
          name: customerInfo.name,     
          email: customerInfo.email,   
        },
        theme: {
          color: "#c5a059",
        },
      };

      const paymentObject = new window.Razorpay(options);
      
      paymentObject.on('payment.failed', function (response) {
        console.error("Payment Failed:", response.error);
        alert(`Payment Failed: ${response.error.description}`);
      });

      paymentObject.open();

    } catch (error) {
      console.error("Checkout Error:", error);
      alert("Something went wrong initiating checkout: " + error.message);
    }
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText("+917387202668");
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Tracking form handler
  const handleTrackOrder = (e) => {
    e.preventDefault();
    if (!trackingId.trim()) {
      alert("Please enter a valid Order ID or Phone Number.");
      return;
    }
    // Placeholder for actual tracking logic
    alert(`Checking status for: ${trackingId}\nUpdates will be sent to your registered contact info.`);
    setTrackingId("");
    setShowTrackingModal(false);
  };

  useLayoutEffect(() => {
    document.body.style.backgroundColor = "#0c0d0e";

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      tl.to(".loader-text", {
        opacity: 1,
        letterSpacing: "0.8em",
        duration: 1,
        ease: "power3.out",
      })
        .to(
          ".loader-bar",
          {
            width: "100%",
            duration: 1.1,
            ease: "expo.inOut",
          },
          "-=0.4"
        )
        .to(".loader", {
          clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)",
          duration: 0.8,
          ease: "power4.inOut",
          onComplete: () => setLoading(false),
        })
        .from(
          ".nav-animate",
          {
            y: -30,
            opacity: 0,
            duration: 0.9,
            ease: "power3.out",
          },
          "-=0.2"
        )
        .from(
          ".reveal-item",
          {
            y: 45,
            opacity: 0,
            duration: 1,
            stagger: 0.18,
            ease: "power3.out",
          },
          "-=0.5"
        );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const searchResults = products.filter((item) =>
    (item.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.category || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div ref={containerRef} className="relative bg-[#0c0d0e] text-[#f1ece1] min-h-screen selection:bg-[#c5a059] selection:text-black overflow-x-hidden">
      
      {loading && (
        <div 
          className="loader fixed inset-0 bg-[#070809] z-[2000] flex flex-col items-center justify-center text-[#f1ece1]"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
        >
          <h1 className="loader-text text-2xl sm:text-3xl font-serif tracking-[0.3em] opacity-0 text-[#c5a059] font-light uppercase">
            D T H R I F T
          </h1>
          <div className="w-40 h-[2px] bg-white/10 mt-8 overflow-hidden relative">
            <div className="loader-bar absolute top-0 left-0 h-full w-0 bg-[#c5a059]"></div>
          </div>
        </div>
      )}

      {/* --- UPDATED BRAND MATCHED NAVBAR --- */}
      <header className="nav-animate fixed top-0 left-0 right-0 z-[999] bg-[#0c0d0e]/95 backdrop-blur-md border-b border-white/10 text-[#f1ece1]">
        {/* Top Announcement Bar */}
        <div className="w-full py-1.5 text-center text-[10px] md:text-xs font-mono uppercase tracking-[0.25em] text-[#c5a059] border-b border-white/5 bg-black/40">
          Orders Dispatch Within 24 Hours
        </div>

        {/* Main Navigation */}
        <nav className="flex items-center justify-between px-4 sm:px-6 md:px-12 py-3.5 relative">
          
          {/* Left: Mobile Hamburger & Desktop Logo */}
          <div className="w-1/4 flex items-center justify-start">
            {/* Hamburger (Mobile Only) */}
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="md:hidden text-[#f1ece1] hover:text-[#c5a059] transition-colors p-1"
              aria-label="Open Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {/* Logo (Desktop Only) */}
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
              className="hidden md:block font-serif text-3xl font-black tracking-tighter uppercase text-[#f1ece1] hover:text-[#c5a059] transition-colors cursor-pointer"
            >
              DT
            </button>
          </div>

          {/* Center: Mobile Logo & Desktop Links */}
          <div className="w-2/4 flex justify-center">
            {/* Logo (Mobile Only) - Perfectly centered */}
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
              className="md:hidden font-serif text-2xl font-black tracking-tighter uppercase text-[#f1ece1] hover:text-[#c5a059] transition-colors cursor-pointer"
            >
              DT
            </button>
            
            {/* Links (Desktop Only) */}
            <div className="hidden md:flex space-x-8 text-xs font-mono tracking-widest uppercase text-gray-300">
              <button 
                onClick={() => setIsMenuOpen(true)}
                className="flex items-center gap-1.5 hover:text-[#c5a059] transition-colors cursor-pointer"
              >
                Collections 
                <span className="text-[10px] text-[#c5a059]">▾</span>
              </button>
              <button 
                onClick={() => setShowTrackingModal(true)}
                className="hover:text-[#c5a059] transition-colors cursor-pointer"
              >
                Track Your Order
              </button>
              <button 
                onClick={() => setShowContactModal(true)} 
                className="hover:text-[#c5a059] transition-colors cursor-pointer"
              >
                Contact Us
              </button>
              <button 
                onClick={() => setIsMenuOpen(true)}
                className="hover:text-[#c5a059] transition-colors cursor-pointer"
              >
                Shop All
              </button>
            </div>
          </div>

          {/* Right: Modern Action Icons */}
          <div className="w-1/4 flex justify-end items-center space-x-3 sm:space-x-5 text-[#f1ece1]">
            {/* Search Icon */}
            <button 
              onClick={() => setIsSearchOpen(true)} 
              className="hover:text-[#c5a059] transition-colors cursor-pointer p-1"
              title="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Account Icon */}
            {currentUser ? (
              <div className="relative group hidden sm:block">
                <button className="text-[10px] font-mono tracking-widest text-[#c5a059] font-bold uppercase cursor-pointer py-1">
                  {currentUser.name.split(" ")[0]} ▾
                </button>
                <div className="absolute right-0 top-full w-32 bg-[#141619] border border-white/10 shadow-2xl rounded-sm hidden group-hover:block py-2 z-50">
                  <button
                    onMouseDown={handleLogout}
                    className="w-full text-left px-4 py-2 text-[10px] font-mono tracking-widest text-rose-400 hover:bg-white/5 transition-colors uppercase cursor-pointer"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setAuthMode("signup")} 
                className="hover:text-[#c5a059] transition-colors cursor-pointer p-1 hidden sm:block"
                title="Account"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            )}

            {/* Bag Icon */}
            <button 
              onClick={() => setIsCartOpen(true)} 
              className="hover:text-[#c5a059] transition-colors cursor-pointer relative p-1"
              title="Shopping Bag"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#c5a059] text-black text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold font-mono">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* --- AUTH MODALS --- */}
      {authMode === "signup" && (
        <Signup
          onSignupSuccess={(user) => {
            setCurrentUser(user);
            setAuthMode(null);
          }}
          onClose={() => setAuthMode(null)}
          onSwitchToLogin={() => setAuthMode("login")}
        />
      )}

      {authMode === "login" && (
        <Login
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setAuthMode(null);
          }}
          onClose={() => setAuthMode(null)}
          onSwitchToSignup={() => setAuthMode("signup")}
        />
      )}

      {/* --- TRACK ORDER MODAL --- */}
      {showTrackingModal && (
        <div className="fixed inset-0 z-[1006] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-[fadeIn_0.25s_ease-out]">
          <div className="bg-[#141619] border border-[#c5a059]/40 max-w-md w-full p-6 sm:p-8 rounded-sm relative shadow-2xl">
            <button 
              onClick={() => setShowTrackingModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xs font-mono cursor-pointer"
            >
              ✕ CLOSE
            </button>

            <span className="text-[9px] font-mono tracking-[0.4em] text-[#c5a059] uppercase block mb-1">
              Order Status
            </span>
            <h3 className="text-xl font-serif tracking-widest text-white uppercase mb-6 border-b border-white/10 pb-3">
              Track Your Order
            </h3>

            <form onSubmit={handleTrackOrder} className="space-y-5 font-mono text-xs">
              <div>
                <label className="block text-gray-400 text-[10px] uppercase tracking-wider mb-2">
                  Order ID or Mobile Number
                </label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  placeholder="e.g., ORD-12345 or 9876543210"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 px-4 py-3 text-white placeholder-zinc-600 rounded-sm focus:outline-none focus:border-[#c5a059] uppercase"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full font-sans text-[10px] tracking-[0.3em] uppercase bg-[#c5a059] text-black px-6 py-3.5 font-semibold hover:bg-white transition-colors rounded-sm cursor-pointer"
                >
                  Find Order &rarr;
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CUSTOMER SHIPPING MODAL --- */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-[1006] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-[fadeIn_0.25s_ease-out]">
          <div className="bg-[#141619] border border-[#c5a059]/40 max-w-lg w-full p-6 sm:p-8 rounded-sm relative shadow-2xl">
            <button 
              onClick={() => setShowCheckoutModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xs font-mono cursor-pointer"
            >
              ✕ CLOSE
            </button>

            <span className="text-[9px] font-mono tracking-[0.4em] text-[#c5a059] uppercase block mb-1">
              Step 1 of 2 // Shipping Info
            </span>
            <h3 className="text-xl font-serif tracking-widest text-white uppercase mb-6 border-b border-white/10 pb-3">
              Delivery Details
            </h3>

            <form onSubmit={handleCheckout} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-gray-400 text-[10px] uppercase tracking-wider mb-1">Full Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="JOHN DOE"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  className="w-full bg-black/60 border border-white/15 px-3 py-2.5 text-white placeholder-zinc-600 rounded-sm focus:outline-none focus:border-[#c5a059] uppercase"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-[10px] uppercase tracking-wider mb-1">Mobile Number *</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="9876543210"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    className="w-full bg-black/60 border border-white/15 px-3 py-2.5 text-white placeholder-zinc-600 rounded-sm focus:outline-none focus:border-[#c5a059]"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-[10px] uppercase tracking-wider mb-1">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="JOHN@EXAMPLE.COM"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                    className="w-full bg-black/60 border border-white/15 px-3 py-2.5 text-white placeholder-zinc-600 rounded-sm focus:outline-none focus:border-[#c5a059]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-[10px] uppercase tracking-wider mb-1">Shipping Address *</label>
                <textarea 
                  required
                  rows="2"
                  placeholder="HOUSE NO, STREET, AREA, LANDMARK"
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                  className="w-full bg-black/60 border border-white/15 px-3 py-2.5 text-white placeholder-zinc-600 rounded-sm focus:outline-none focus:border-[#c5a059] uppercase resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-[10px] uppercase tracking-wider mb-1">City *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="MUMBAI"
                    value={customerInfo.city}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, city: e.target.value })}
                    className="w-full bg-black/60 border border-white/15 px-3 py-2.5 text-white placeholder-zinc-600 rounded-sm focus:outline-none focus:border-[#c5a059] uppercase"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-[10px] uppercase tracking-wider mb-1">Pincode *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="400001"
                    value={customerInfo.pincode}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, pincode: e.target.value })}
                    className="w-full bg-black/60 border border-white/15 px-3 py-2.5 text-white placeholder-zinc-600 rounded-sm focus:outline-none focus:border-[#c5a059]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-gray-400 text-[10px]">TOTAL PAYABLE: <strong className="text-[#c5a059] text-sm">₹{totalAmount.toLocaleString("en-IN")}</strong></span>
                <button
                  type="submit"
                  className="font-sans text-[10px] tracking-[0.3em] uppercase bg-[#c5a059] text-black px-6 py-3 font-semibold hover:bg-white transition-colors rounded-sm cursor-pointer"
                >
                  Proceed to Pay &rarr;
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- SEARCH OVERLAY MODAL --- */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[1005] bg-black/95 backdrop-blur-md p-6 sm:p-12 flex flex-col justify-start animate-[fadeIn_0.25s_ease-out]">
          <div className="flex justify-between items-center max-w-5xl mx-auto w-full mb-8 pt-8">
            <span className="text-xs font-mono tracking-[0.4em] text-[#c5a059] uppercase">PRODUCT SEARCH</span>
            <button
              onClick={() => setIsSearchOpen(false)}
              className="text-white text-xs font-mono hover:text-[#c5a059] transition-colors cursor-pointer"
            >
              ✕ CLOSE
            </button>
          </div>

          <div className="max-w-5xl mx-auto w-full">
            <input
              type="text"
              autoFocus
              placeholder="SEARCH JACKETS, HOODIES, JEANS, JERSEY..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-b border-white/20 pb-4 text-xl sm:text-3xl font-serif tracking-widest text-white placeholder-gray-600 focus:outline-none focus:border-[#c5a059] transition-colors uppercase"
            />

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto pr-2">
              {searchResults.length === 0 ? (
                <p className="text-xs font-mono text-gray-500 tracking-widest uppercase col-span-3 py-8">
                  No items match your search.
                </p>
              ) : (
                searchResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedProduct(item);
                      setIsSearchOpen(false);
                    }}
                    className="bg-[#141619] border border-white/10 p-3 rounded-sm cursor-pointer hover:border-[#c5a059] transition-all flex items-center gap-4"
                  >
                    <img 
                      src={item.img} 
                      alt={item.title} 
                      className="w-16 h-20 object-cover bg-zinc-800"
                      onError={(e) => handleImageError(e, item)}
                    />
                    <div>
                      <h4 className="text-xs font-serif tracking-wider text-white uppercase">{item.title}</h4>
                      <p className="text-[10px] font-mono text-[#c5a059] mt-1">₹{Number(item.price).toLocaleString("en-IN")}</p>
                      <p className="text-[9px] font-mono text-gray-400 mt-0.5">Stock: {item.stock}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- NEW NESTED FULL/BOTTOM SHEET NAVIGATION MENU --- */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-end sm:items-center sm:justify-center animate-[fadeIn_0.25s_ease-out]">
          {/* Menu Container: Slides up from bottom on mobile, scales in on desktop */}
          <div className="w-full sm:max-w-md bg-[#141619] sm:border sm:border-white/10 sm:rounded-md rounded-t-3xl min-h-[65vh] max-h-[90vh] flex flex-col p-6 animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)] sm:animate-[scaleUp_0.2s_ease-out]">
            
            {/* Header: Back Button & Close Icon */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10 shrink-0">
              {menuView === "collections" ? (
                <button 
                  onClick={() => setMenuView("main")}
                  className="flex items-center gap-1.5 text-white text-sm font-sans hover:text-[#c5a059] transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
              ) : (
                <div /> 
              )}

              <button 
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-400 hover:text-white border border-white/10 hover:border-white/30 rounded-full p-2 transition-all cursor-pointer bg-white/5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Menu Content */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {menuView === "main" ? (
                <div className="flex flex-col space-y-7 mt-2">
                  <button 
                    onClick={() => setMenuView("collections")}
                    className="flex justify-between items-center text-left text-2xl font-sans font-bold text-white hover:text-[#c5a059] transition-colors group cursor-pointer"
                  >
                    <span>Collections</span>
                    <span className="text-xl text-gray-500 group-hover:text-[#c5a059] transition-colors">&rsaquo;</span>
                  </button>
                  <button 
                    onClick={() => { setShowTrackingModal(true); setIsMenuOpen(false); }}
                    className="text-left text-2xl font-sans font-bold text-white hover:text-[#c5a059] transition-colors cursor-pointer"
                  >
                    Track Your Order
                  </button>
                  <button 
                    onClick={() => { setShowContactModal(true); setIsMenuOpen(false); }}
                    className="text-left text-2xl font-sans font-bold text-white hover:text-[#c5a059] transition-colors cursor-pointer"
                  >
                    Contact Us
                  </button>
                  <button 
                    onClick={() => { setIsMenuOpen(false); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }}
                    className="text-left text-2xl font-sans font-bold text-white hover:text-[#c5a059] transition-colors cursor-pointer"
                  >
                    Shop All
                  </button>
                </div>
              ) : (
                <div className="flex flex-col space-y-7 mt-2 animate-[slideRight_0.2s_ease-out]">
                  {["Jackets", "Hoodies", "Jeans", "Jersey"].map((cat) => (
                    <button 
                      key={cat}
                      onClick={() => { setSelectedCategory(cat.toUpperCase()); setIsMenuOpen(false); }}
                      className="text-left text-2xl font-sans font-bold text-white hover:text-[#c5a059] hover:translate-x-2 transition-all cursor-pointer"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Area (Login & Currency) */}
            {menuView === "main" && (
              <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center shrink-0">
                {!currentUser ? (
                  <button 
                    onClick={() => { setAuthMode("login"); setIsMenuOpen(false); }}
                    className="border border-[#c5a059]/50 bg-[#c5a059]/10 text-[#c5a059] rounded-full px-6 py-2.5 text-sm font-sans font-semibold hover:bg-[#c5a059] hover:text-black transition-all cursor-pointer"
                  >
                    Login
                  </button>
                ) : (
                  <div className="text-sm font-mono text-[#c5a059] uppercase">
                    HI, {currentUser.name.split(" ")[0]}
                  </div>
                )}
                
                <div className="text-xs font-mono tracking-widest text-gray-400 flex items-center gap-2">
                  <span>🌍</span> ₹ INR / EN
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- CONTACT MODAL --- */}
      {showContactModal && (
        <div className="fixed inset-0 z-[1002] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-[fadeIn_0.25s_ease-out]">
          <div className="bg-[#141619] border border-[#c5a059]/30 p-8 rounded-sm max-w-sm w-full text-center relative shadow-2xl">
            <button 
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xs font-sans hover:rotate-90 transition-transform cursor-pointer"
            >
              ✕
            </button>
            <span className="text-[9px] tracking-[0.35em] text-[#c5a059] uppercase block mb-2 font-mono">
              VIP Customer Support
            </span>
            <h3 className="text-xl font-serif tracking-widest text-[#f1ece1] uppercase mb-6">
              Get In Touch
            </h3>
            
            <a 
              href={`tel:+917387202668`}
              className="block text-lg font-mono tracking-wider text-white bg-white/5 border border-white/10 py-3.5 px-4 rounded-sm hover:border-[#c5a059] transition-colors mb-4"
            >
              {PHONE_NUMBER}
            </a>

            <button
              onClick={handleCopyPhone}
              className="w-full font-sans text-[10px] tracking-[0.3em] uppercase border border-[#c5a059] text-[#c5a059] py-3 hover:bg-[#c5a059] hover:text-black transition-all font-semibold active:scale-95 cursor-pointer"
            >
              {copied ? "Copied to Clipboard!" : "Copy Number"}
            </button>
          </div>
        </div>
      )}

      {/* --- CATEGORY EXPLORER MODAL --- */}
      {selectedCategory && (
        <div className="fixed inset-0 z-[1002] bg-black/95 backdrop-blur-md flex flex-col p-6 sm:p-12 overflow-y-auto animate-[fadeIn_0.3s_ease-out]">
          
          <div className="flex justify-between items-center max-w-7xl mx-auto w-full mb-8 pt-4 sm:pt-0 sticky top-0 bg-black/90 py-4 z-20 border-b border-white/10">
            <span className="text-xs font-mono tracking-[0.4em] text-[#c5a059] uppercase">
              Category / {selectedCategory}
            </span>
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-white text-xs font-mono tracking-widest hover:text-[#c5a059] transition-colors border border-white/20 px-4 py-2 hover:border-[#c5a059] cursor-pointer bg-black"
            >
              ✕ CLOSE
            </button>
          </div>

          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products
              .filter((p) => {
                if (!p.category) return false;
                const cat = p.category.toString().toUpperCase().trim();
                const target = selectedCategory.toUpperCase().trim();
                return cat === target || cat === target.replace(/S$/, '') || cat + 'S' === target;
              })
              .map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedProduct(item)}
                  className="group bg-[#181a1e] border border-zinc-700 rounded-sm cursor-pointer p-4 hover:border-[#c5a059] transition-all duration-300 hover:-translate-y-2 shadow-2xl"
                >
                  <div className="aspect-[3/4] overflow-hidden mb-4 relative bg-zinc-900 border border-zinc-800">
                    <img
                      src={item.img}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      onError={(e) => handleImageError(e, item)}
                    />
                    <span className={`absolute top-2 left-2 text-[10px] tracking-widest px-2.5 py-1 uppercase border backdrop-blur-sm font-mono font-bold ${
                      Number(item.stock) === 0 ? "bg-rose-950/90 text-rose-400 border-rose-500/50" : "bg-black/90 text-[#c5a059] border-white/20"
                    }`}>
                      {Number(item.stock) === 0 ? "SOLD OUT" : `Stock: ${item.stock} left`}
                    </span>
                  </div>

                  <div className="flex justify-between items-start pt-2">
                    <div>
                      <h4 className="text-sm tracking-widest text-white uppercase font-serif font-bold group-hover:text-[#c5a059] transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-amber-500/80 mt-1 uppercase tracking-wider font-mono">
                        {item.category}
                      </p>
                    </div>
                    <span className="text-sm font-mono text-[#c5a059] font-bold">
                      ₹{Number(item.price).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* --- PRODUCT INSPECT MODAL --- */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[1003] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-[fadeIn_0.25s_ease-out]">
          <div className="bg-[#141619] border border-white/10 max-w-2xl w-full p-6 sm:p-8 rounded-sm relative grid grid-cols-1 md:grid-cols-2 gap-6 shadow-2xl animate-[scaleUp_0.3s_cubic-bezier(0.16,1,0.3,1)] max-h-[90vh] overflow-y-auto">
            
            <div className="col-span-full flex justify-between items-center pb-2 border-b border-white/10 md:hidden">
              <span className="text-[10px] font-mono tracking-widest text-[#c5a059] uppercase">Product Details</span>
              <button
                onClick={() => { setSelectedProduct(null); setActiveTab("details"); }}
                className="text-white text-xs font-mono tracking-widest hover:text-[#c5a059] cursor-pointer"
              >
                ✕ CLOSE
              </button>
            </div>

            <button
              onClick={() => { setSelectedProduct(null); setActiveTab("details"); }}
              className="hidden md:block absolute top-4 right-4 text-gray-400 hover:text-white text-xs font-mono hover:rotate-90 transition-transform cursor-pointer"
            >
              ✕ CLOSE
            </button>

            <div className="aspect-[3/4] overflow-hidden border border-white/10 group relative bg-black/40">
              <img 
                src={selectedProduct.img} 
                alt={selectedProduct.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                onError={(e) => handleImageError(e, selectedProduct)}
              />
              <span className="absolute top-2 left-2 bg-black/80 text-[#c5a059] text-[9px] tracking-widest px-2.5 py-1 uppercase border border-white/10">
                Stock: {products.find((p) => p.id === selectedProduct.id)?.stock || 0} Left
              </span>
            </div>

            <div className="flex flex-col justify-between">
              <div>
                <div className="flex gap-4 border-b border-white/10 pb-3 mb-4">
                  <button 
                    onClick={() => setActiveTab("details")}
                    className={`text-[10px] font-mono tracking-widest uppercase pb-1 border-b transition-all cursor-pointer ${
                      activeTab === "details" ? "border-[#c5a059] text-[#c5a059]" : "border-transparent text-gray-500 hover:text-white"
                    }`}
                  >
                    OVERVIEW
                  </button>
                  <button 
                    onClick={() => setActiveTab("measurements")}
                    className={`text-[10px] font-mono tracking-widest uppercase pb-1 border-b transition-all cursor-pointer ${
                      activeTab === "measurements" ? "border-[#c5a059] text-[#c5a059]" : "border-transparent text-gray-500 hover:text-white"
                    }`}
                  >
                    SPECS & FIT
                  </button>
                </div>

                <span className="text-[9px] tracking-[0.4em] text-[#c5a059] uppercase block mb-1 font-mono">
                  {selectedProduct.category}
                </span>
                <h3 className="text-xl font-serif tracking-widest text-white uppercase mb-2">
                  {selectedProduct.title}
                </h3>
                <p className="text-lg font-mono text-[#c5a059] mb-4">₹{Number(selectedProduct.price).toLocaleString("en-IN")}</p>
                
                {activeTab === "details" ? (
                  <div>
                    <p className="text-xs text-gray-400 font-sans leading-relaxed mb-6">
                      {selectedProduct.description || "Archival high-grade garment carefully curated and inspected for authentic vintage silhouette and wear."}
                    </p>
                    <div className="mb-4 inline-block border border-[#c5a059]/50 bg-[#c5a059]/10 px-3 py-1.5 rounded-sm">
                      <span className="text-[10px] font-mono tracking-widest text-[#c5a059] uppercase">
                        Size: {selectedSize}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 mb-6 font-mono text-xs text-gray-200 bg-white/5 p-4 rounded-sm border border-white/10 shadow-inner">
                    <div className="text-[10px] text-[#c5a059] tracking-widest uppercase mb-1 pb-1 border-b border-white/10">
                      Measurements for: {selectedSize}
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-gray-400 tracking-wider">FIT:</span>
                      <span className="text-[#c5a059] font-bold">RELAXED / OVERSIZED</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-gray-400 tracking-wider">NOTE:</span>
                      <span className="text-[#c5a059] font-bold text-right ml-4">DESIGNED TO FIT MOST BODY TYPES</span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-gray-400 tracking-wider">CONDITION:</span>
                      <span className="text-emerald-400 font-bold">9.5/10 VINTAGE</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  addToCart(products.find((p) => p.id === selectedProduct.id) || selectedProduct);
                  setSelectedProduct(null);
                  setActiveTab("details");
                }}
                disabled={(products.find((p) => p.id === selectedProduct.id)?.stock || 0) === 0}
                className="w-full font-sans text-[10px] tracking-[0.35em] uppercase border border-[#c5a059] bg-[#c5a059] text-black py-4 hover:bg-transparent hover:text-[#c5a059] transition-all font-semibold disabled:opacity-30 disabled:hover:bg-[#c5a059] disabled:hover:text-black active:scale-95 cursor-pointer"
              >
                {(products.find((p) => p.id === selectedProduct.id)?.stock || 0) === 0 ? "OUT OF STOCK" : `Add To Bag (${selectedSize})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CART DRAWER --- */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[1004] bg-black/80 backdrop-blur-sm flex justify-end animate-[fadeIn_0.3s_ease-out]">
          <div className="bg-[#141619] border-l border-white/10 w-full max-w-md h-full p-6 flex flex-col justify-between animate-[slideLeft_0.4s_cubic-bezier(0.16,1,0.3,1)]">
            <div>
              <div className="flex justify-between items-center pb-6 border-b border-white/10 mb-6">
                <h3 className="text-sm tracking-[0.3em] font-serif uppercase text-white">
                  Shopping Bag ({cart.reduce((a, b) => a + b.quantity, 0)})
                </h3>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="text-gray-400 hover:text-white text-xs font-mono hover:rotate-90 transition-transform cursor-pointer"
                >
                  ✕ CLOSE
                </button>
              </div>

              {cart.length === 0 ? (
                <p className="text-xs text-gray-500 font-mono tracking-widest uppercase text-center py-16">
                  Your shopping bag is empty.
                </p>
              ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  {cart.map((item) => (
                    <div key={`${item.id}`} className="flex justify-between items-center bg-white/5 p-3 rounded-sm border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <img 
                          src={item.img} 
                          alt={item.title} 
                          className="w-12 h-16 object-cover bg-black/40"
                          onError={(e) => handleImageError(e, item)}
                        />
                        <div>
                          <h4 className="text-xs font-serif tracking-wider text-white uppercase">{item.title}</h4>
                          <p className="text-[10px] font-mono text-[#c5a059] mt-0.5">SIZE: {item.size}</p>
                          <p className="text-[10px] font-mono text-gray-400">
                            ₹{Number(item.price).toLocaleString("en-IN")} x {item.quantity}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-rose-400 text-xs font-mono hover:text-rose-300 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-white/10">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs uppercase tracking-widest text-gray-400">Total</span>
                <span className="text-xl font-mono text-[#c5a059]">₹{totalAmount.toLocaleString("en-IN")}</span>
              </div>
              <button
                onClick={handleOpenCheckoutModal}
                disabled={cart.length === 0}
                className="w-full font-sans text-[10px] tracking-[0.3em] uppercase border border-[#c5a059] bg-[#c5a059] text-black py-4 hover:bg-transparent hover:text-[#c5a059] transition-all font-semibold disabled:opacity-50 active:scale-95 cursor-pointer"
              >
                Proceed To Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- BRAND MATCHED HERO SECTION --- */}
      {/* Adjusted padding (pt-[60px] instead of pt-[76px]) so the hero doesn't start too far down */}
      <div className="pt-[60px] sm:pt-[88px] w-full">
        {/* Adjusted min-height (min-h-[45vh] on mobile) and padding (py-8 on mobile) to pull the text up */}
        <section className="reveal-item w-full bg-[#111315] min-h-[45vh] md:min-h-[65vh] flex flex-col items-center justify-center py-8 md:py-24 px-4 overflow-hidden border-b border-white/10 relative">
          
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-[#c5a059]/5 blur-3xl pointer-events-none" />

          {/* Top Massive Brand Text */}
          <h1 className="text-[#f1ece1] font-black text-[15vw] md:text-[12rem] leading-[0.85] tracking-tighter uppercase mb-2 drop-shadow-2xl">
            DTHRIFT
          </h1>

          {/* Center Divider & Subtitle */}
          <div className="flex items-center w-full max-w-4xl my-6 md:my-10 z-10 px-4">
            <div className="flex-grow border-t border-[#c5a059]/40"></div>
            <span className="px-4 md:px-8 text-[#c5a059] font-mono text-xs md:text-xl tracking-[0.4em] uppercase whitespace-nowrap">
              Collection Live
            </span>
            <div className="flex-grow border-t border-[#c5a059]/40"></div>
          </div>

          {/* Bottom Massive Text */}
          <h2 className="text-[#f1ece1] font-black text-[15vw] md:text-[12rem] leading-[0.8] tracking-tighter uppercase z-10 drop-shadow-2xl">
            CHECK NOW
          </h2>

        </section>
      </div>

      {/* --- MAIN PAGE CONTENT --- */}
      <main className="pt-16 px-4 sm:px-6 md:px-10 pb-12 max-w-[1920px] mx-auto">
        
        {/* --- 4-COLUMN HERO GRID --- */}
        <section className="reveal-item grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              id: "card-jackets",
              title: "JACKETS",
              subtitle: "Black Utility Vest",
              accent: "from-amber-950/40",
              img: "/images/IMG_6379.PNG",
            },
            {
              id: "card-hoodies",
              title: "HOODIES",
              subtitle: "Cream Baeina Hoodie",
              accent: "from-stone-900/40",
              img: "/images/IMG_6513.PNG",
            },
            {
              id: "card-jeans",
              title: "JEANS",
              subtitle: "Vintage Black Baggy ",
              accent: "from-blue-950/40",
              img: "/images/IMG_Jeans.png",
            },
            {
              id: "card-jersey",
              title: "JERSEY",
              subtitle: "Shohoku #03 & Vintage Hockey",
              accent: "from-rose-950/40",
              img: "/images/jerseys/IMG_6380.PNG",
            },
          ].map((col) => (
            <article 
              key={col.id}
              id={col.id}
              onMouseMove={(e) => handleMouseMove(e, col.id)}
              onMouseLeave={() => handleMouseLeave(col.id)}
              onClick={() => setSelectedCategory(col.title)}
              className="relative group cursor-pointer overflow-hidden aspect-[3/4.5] bg-[#141619] border border-white/10 rounded-sm shadow-2xl transition-border duration-300 hover:border-[#c5a059] transform-gpu"
              style={{ transformStyle: "preserve-3d" }}
            >
              <img
                src={col.img}
                alt={col.title}
                loading="eager"
                className="w-full h-full object-cover filter brightness-[0.85] contrast-[1.1] group-hover:scale-105 group-hover:brightness-100 transition-all duration-700 ease-out"
                onError={(e) => handleImageError(e, { title: col.title })}
              />
              
              <div className={`absolute inset-0 bg-gradient-to-t ${col.accent} via-black/40 to-black/60 group-hover:opacity-75 transition-opacity duration-500`} />

              <div className="absolute inset-0 flex flex-col items-center justify-between p-6 z-10 text-center" style={{ transform: "translateZ(30px)" }}>
                <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-[#c5a059] font-medium border-b border-[#c5a059]/30 pb-1 group-hover:border-[#c5a059] transition-colors">
                  {col.title}
                </span>

                <div>
                  <h2 className="text-3xl sm:text-4xl font-serif font-normal tracking-[0.2em] text-[#f1ece1] uppercase drop-shadow-xl group-hover:tracking-[0.25em] group-hover:text-white transition-all duration-500">
                    {col.title}
                  </h2>
                  <p className="font-sans text-[10px] tracking-[0.25em] uppercase text-gray-300 mt-2 font-light group-hover:text-white transition-colors">
                    {col.subtitle}
                  </p>
                </div>

                <div className="font-mono text-[10px] tracking-[0.35em] uppercase text-[#c5a059] group-hover:translate-x-2 transition-transform duration-300 flex items-center gap-2 bg-black/40 px-4 py-2 border border-white/5 backdrop-blur-sm">
                  <span>Quick View</span>
                  <span>&rarr;</span>
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* --- FOOTER --- */}
        <footer className="reveal-item mt-28 pt-16 pb-12 border-t border-white/10 bg-[#090a0b] text-gray-400 font-sans text-xs tracking-wider uppercase">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            
            <div className="space-y-4">
              <h3 className="text-lg font-serif tracking-[0.3em] text-[#f1ece1] font-bold">DTHRIFT</h3>
              <p className="text-[11px] text-gray-400 font-mono tracking-widest leading-relaxed normal-case">
                Curated archival luxury, vintage streetwear, and rare statement pieces. Est. 2026.
              </p>
              <div className="pt-2 text-[10px] font-mono text-[#c5a059]">
                SUPPORT: {PHONE_NUMBER}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[11px] font-mono tracking-[0.3em] text-[#c5a059]">Explore</h4>
              <ul className="space-y-2.5 text-[11px] font-mono">
                <li><button onClick={() => setSelectedCategory("JACKETS")} className="hover:text-white transition-colors cursor-pointer">Jackets & Outerwear</button></li>
                <li><button onClick={() => setSelectedCategory("HOODIES")} className="hover:text-white transition-colors cursor-pointer">Heavyweight Hoodies</button></li>
                <li><button onClick={() => setSelectedCategory("JEANS")} className="hover:text-white transition-colors cursor-pointer">Vintage Denim</button></li>
                <li><button onClick={() => setSelectedCategory("JERSEY")} className="hover:text-white transition-colors cursor-pointer">Archival Jerseys</button></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-[11px] font-mono tracking-[0.3em] text-[#c5a059]">Client Services</h4>
              <ul className="space-y-2.5 text-[11px] font-mono">
                <li><button onClick={() => setShowContactModal(true)} className="hover:text-white transition-colors cursor-pointer">VIP Support & Inquiries</button></li>
                <li><button onClick={() => setShowTrackingModal(true)} className="hover:text-white transition-colors cursor-pointer">Track Your Order</button></li>
                <li><button onClick={() => setAuthMode("signup")} className="hover:text-white transition-colors cursor-pointer">My Account</button></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-[11px] font-mono tracking-[0.3em] text-[#c5a059]">The Vault</h4>
              <p className="text-[10px] font-mono text-gray-400 normal-case leading-relaxed">
                Subscribe for private drop access and early inventory alerts.
              </p>
              <div className="flex items-center border border-white/20 rounded-sm bg-black overflow-hidden focus-within:border-[#c5a059] transition-colors">
                <input 
                  type="email" 
                  placeholder="ENTER YOUR EMAIL" 
                  className="bg-transparent px-3 py-2 text-[10px] font-mono text-white placeholder-gray-600 focus:outline-none w-full uppercase"
                />
                <button 
                  onClick={() => alert("Subscribed successfully to DTHRIFT Archives.")}
                  className="bg-[#c5a059] text-black px-4 py-2 text-[10px] font-mono font-bold uppercase hover:bg-[#ebd494] transition-colors cursor-pointer"
                >
                  Join
                </button>
              </div>
            </div>

          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-[9px] font-mono text-gray-500">
            <div>
              DTHRIFT STUDIO &copy; 2026 // ALL RIGHTS RESERVED
            </div>
            <div className="flex gap-6">
              <span>SECURE RAZORPAY ENCRYPTION</span>
              <span>AUTHENTIC VINTAGE GUARANTEE</span>
            </div>
          </div>
        </footer>

      </main>
    </div>
  ); 
}