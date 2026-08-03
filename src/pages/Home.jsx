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

  const handleTrackOrder = (e) => {
    e.preventDefault();
    if (!trackingId.trim()) {
      alert("Please enter a valid Order ID or Phone Number.");
      return;
    }
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

      {/* --- BRAND MATCHED NAVBAR --- */}
      <header className="nav-animate fixed top-0 left-0 right-0 z-[999] bg-[#0c0d0e]/95 backdrop-blur-md border-b border-white/10 text-[#f1ece1]">
        <div className="w-full py-1.5 text-center text-[10px] md:text-xs font-mono uppercase tracking-[0.25em] text-[#c5a059] border-b border-white/5 bg-black/40">
          Orders Dispatch Within 24 Hours
        </div>

        <nav className="flex items-center justify-between px-4 sm:px-6 md:px-12 py-3.5 relative">
          
          {/* Left: Mobile Hamburger & Desktop Logo */}
          <div className="w-1/4 flex items-center justify-start">
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="md:hidden text-[#f1ece1] hover:text-[#c5a059] transition-colors p-1"
              aria-label="Open Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
              className="hidden md:block font-serif text-3xl font-black tracking-tighter uppercase text-[#f1ece1] hover:text-[#c5a059] transition-colors cursor-pointer"
            >
              DT
            </button>
          </div>

          {/* Center: Mobile Logo & Desktop Links */}
          <div className="w-2/4 flex justify-center">
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
              className="md:hidden font-serif text-2xl font-black tracking-tighter uppercase text-[#f1ece1] hover:text-[#c5a059] transition-colors cursor-pointer"
            >
              DT
            </button>
            
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

          {/* Right: Icons */}
          <div className="w-1/4 flex justify-end items-center space-x-3 sm:space-x-5 text-[#f1ece1]">
            <button 
              onClick={() => setIsSearchOpen(true)} 
              className="hover:text-[#c5a059] transition-colors cursor-pointer p-1"
              title="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

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
                className="hover:text-[#c5a059] transition-colors cursor-pointer p-1"
                title="Account"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            )}

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

      {/* --- MODALS OMITTED FOR BREVITY, IDENTICAL TO PREVIOUS (Tracking, Checkout, Search, Contact, Product Explore) --- */}
      {/* ... */}
      
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

      {/* --- BRAND MATCHED HERO SECTION --- */}
      <div className="pt-[60px] sm:pt-[88px] w-full">
        <section className="reveal-item w-full bg-[#111315] min-h-[45vh] md:min-h-[65vh] flex flex-col items-center justify-center py-8 md:py-24 px-4 overflow-hidden border-b border-white/10 relative">
          
          <div className="absolute inset-0 bg-[#c5a059]/5 blur-3xl pointer-events-none" />

          <h1 className="text-[#f1ece1] font-black text-[15vw] md:text-[12rem] leading-[0.85] tracking-tighter uppercase mb-2 drop-shadow-2xl">
            DTHRIFT
          </h1>

          <div className="flex items-center w-full max-w-4xl my-6 md:my-10 z-10 px-4">
            <div className="flex-grow border-t border-[#c5a059]/40"></div>
            <span className="px-4 md:px-8 text-[#c5a059] font-mono text-xs md:text-xl tracking-[0.4em] uppercase whitespace-nowrap">
              Collection Live
            </span>
            <div className="flex-grow border-t border-[#c5a059]/40"></div>
          </div>

          <h2 className="text-[#f1ece1] font-black text-[15vw] md:text-[12rem] leading-[0.8] tracking-tighter uppercase z-10 drop-shadow-2xl">
            CHECK NOW
          </h2>
        </section>
      </div>

      {/* --- MAIN PAGE CONTENT --- */}
      <main className="pt-16 px-4 sm:px-6 md:px-10 pb-12 max-w-[1920px] mx-auto">
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
      </main>
    </div>
  ); 
}