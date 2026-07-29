import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";
import Signup from "./Signup";
import Login from "./Login";

export default function Home({ products = [], onOrderSuccess }) {
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [copied, setCopied] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Auth / Modal States ('signup' | 'login' | null)
  const [authMode, setAuthMode] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Logout Function Added
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

  const PHONE_NUMBER = "+91 73872 02668";
  const INSTAGRAM_URL = "https://www.instagram.com/dthriftdrops/";

  const handleImageError = (e, item) => {
    e.target.onerror = null;
    const title = (item?.title || "").toUpperCase();
    
    if (title.includes("BASKETBALL")) {
      e.target.src = "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800";
    } else if (title.includes("HOCKEY") || title.includes("CANADA") || title.includes("GRETZKY")) {
      e.target.src = "https://images.unsplash.com/photo-1580748512586-b4d241ef51dc?auto=format&fit=crop&q=80&w=800";
    } else if (title.includes("MANNHEIM") || title.includes("LONG-SLEEVE")) {
      e.target.src = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800";
    } else {
      e.target.src = "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=800";
    }
  };

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
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const totalAmount = cart.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;

    if (!window.Razorpay) {
      alert("Razorpay SDK failed to load. Please check your internet connection.");
      return;
    }

    const options = {
      key: "rzp_test_THIYaRtmaw8L2O",
      amount: totalAmount * 100,
      currency: "INR",
      name: "DTHRIFT",
      description: "Order Payment",
      image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=200",
      handler: async function (response) {
        try {
          const apiRes = await fetch("https://dthrift-backend.onrender.com/api/checkout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              paymentId: response.razorpay_payment_id,
              customerName: currentUser ? currentUser.name : "Verified Customer",
              items: cart,
              amount: totalAmount,
            }),
          });

          const data = await apiRes.json();

          if (!apiRes.ok || !data.success) {
            throw new Error(data.error || "Checkout processing failed.");
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
            id: data.orderId || `ORD-${Date.now()}`,
            paymentId: response.razorpay_payment_id,
            customer: currentUser ? currentUser.name : "Verified Customer",
            items: cart.map((i) => `${i.title} (x${i.quantity})`).join(", "),
            itemCount: cart.reduce((acc, curr) => acc + curr.quantity, 0),
            amount: totalAmount,
            status: "Paid",
            city: "India",
            date: new Date().toISOString().replace("T", " ").substring(0, 16),
          };

          if (onOrderSuccess) {
            onOrderSuccess(newOrder, updatedProducts);
          }

          alert(`Payment Successful! Order recorded live in PostgreSQL.`);
          setCart([]);
          setIsCartOpen(false);
        } catch (err) {
          console.error("Checkout Error:", err);
          alert("Payment verified, but server record creation failed: " + err.message);
        }
      },
      prefill: {
        contact: "7387202668",
        name: currentUser ? currentUser.name : "",
        email: currentUser ? currentUser.email : "",
      },
      theme: {
        color: "#c5a059",
      },
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };

  useEffect(() => {
    const targetDate = new Date("August 1, 2026 00:00:00").getTime();

    const updateCountdown = () => {
      const now = Date.now();
      const diff = targetDate - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyPhone = () => {
    navigator.clipboard.writeText("+917387202668");
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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

      {/* --- NAVBAR (Fully Responsive & Compact) --- */}
      <header className="nav-animate fixed top-0 left-0 right-0 z-[999] px-3 sm:px-8 py-3 sm:py-4 flex justify-between items-center bg-[#0c0d0e]/95 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2 sm:gap-6">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="group flex items-center gap-1.5 text-xs font-mono tracking-widest text-white hover:text-[#c5a059] transition-all uppercase cursor-pointer py-1"
          >
            <span className="text-base sm:text-lg leading-none text-[#c5a059]">≡</span>
            <span className="hidden sm:inline">MENU</span>
          </button>

          <button
            onClick={() => setIsSearchOpen(true)}
            className="text-xs font-mono tracking-widest text-gray-400 hover:text-white transition-colors uppercase hidden sm:block cursor-pointer"
          >
            SEARCH
          </button>
        </div>

        <a 
          href="#" 
          className="text-base sm:text-xl md:text-2xl font-serif tracking-[0.25em] sm:tracking-[0.4em] text-[#f1ece1] uppercase font-bold hover:text-[#c5a059] transition-all truncate mx-2"
        >
          DTHRIFT
        </a>

        <div className="flex items-center gap-3 sm:gap-6 relative">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="text-xs font-mono tracking-widest text-gray-400 hover:text-white transition-colors uppercase sm:hidden cursor-pointer"
          >
            SEARCH
          </button>

          {currentUser ? (
            <div className="relative group">
              <button className="text-[11px] sm:text-xs font-mono tracking-wider sm:tracking-[0.25em] text-[#c5a059] transition-colors uppercase cursor-pointer py-2">
                HI, {currentUser.name.split(" ")[0]} ▾
              </button>
              
              <div className="absolute right-0 top-full w-36 bg-[#141619] border border-white/10 shadow-xl rounded-sm hidden group-hover:block py-2 z-50">
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
              className="text-[11px] sm:text-xs font-mono tracking-wider sm:tracking-[0.25em] text-white hover:text-[#c5a059] transition-colors uppercase cursor-pointer"
            >
              ACCOUNT
            </button>
          )}

          <button
            onClick={() => setIsCartOpen(true)}
            className="text-xs font-mono tracking-widest text-white hover:text-[#c5a059] transition-colors uppercase flex items-center gap-1.5 cursor-pointer bg-amber-600/10 sm:bg-transparent px-2 py-1 sm:p-0 rounded border border-amber-500/20 sm:border-0"
          >
            <span>BAG</span>
            <span className="bg-[#c5a059] text-black text-[10px] px-1.5 py-0.2 font-bold rounded-full">
              {cart.reduce((a, b) => a + b.quantity, 0)}
            </span>
          </button>
        </div>
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

      {/* --- SIDE NAVIGATION DRAWER --- */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex">
          <div className="w-full max-w-sm h-full p-8 sm:p-12 flex flex-col justify-between border-r border-white/10 bg-[#0c0d0e] animate-[slideRight_0.4s_cubic-bezier(0.16,1,0.3,1)]">
            <div>
              <div className="flex justify-between items-center mb-12">
                <span className="text-xs font-mono tracking-[0.4em] text-[#c5a059] uppercase">CATEGORIES</span>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="text-white text-xs font-mono hover:text-[#c5a059] hover:rotate-90 transition-all duration-300 cursor-pointer"
                >
                  ✕ CLOSE
                </button>
              </div>

              <div className="flex flex-col space-y-6 text-2xl font-serif tracking-[0.2em] uppercase text-white">
                <button 
                  onClick={() => { setSelectedCategory("JACKETS"); setIsMenuOpen(false); }}
                  className="text-left hover:text-[#c5a059] transition-all hover:translate-x-3 flex items-center justify-between group cursor-pointer"
                >
                  <span>JACKETS</span>
                  <span className="text-xs font-mono text-gray-500 group-hover:text-[#c5a059]">&rarr;</span>
                </button>
                <button 
                  onClick={() => { setSelectedCategory("HOODIES"); setIsMenuOpen(false); }}
                  className="text-left hover:text-[#c5a059] transition-all hover:translate-x-3 flex items-center justify-between group cursor-pointer"
                >
                  <span>HOODIES</span>
                  <span className="text-xs font-mono text-gray-500 group-hover:text-[#c5a059]">&rarr;</span>
                </button>
                <button 
                  onClick={() => { setSelectedCategory("JEANS"); setIsMenuOpen(false); }}
                  className="text-left hover:text-[#c5a059] transition-all hover:translate-x-3 flex items-center justify-between group cursor-pointer"
                >
                  <span>JEANS</span>
                  <span className="text-xs font-mono text-gray-500 group-hover:text-[#c5a059]">&rarr;</span>
                </button>
                <button 
                  onClick={() => { setSelectedCategory("JERSEY"); setIsMenuOpen(false); }}
                  className="text-left hover:text-[#c5a059] transition-all hover:translate-x-3 flex items-center justify-between group text-[#c5a059] cursor-pointer"
                >
                  <span>JERSEY</span>
                  <span className="text-xs font-mono text-[#c5a059] group-hover:translate-x-1 transition-transform">&rarr;</span>
                </button>

                <button 
                  onClick={() => { setShowContactModal(true); setIsMenuOpen(false); }}
                  className="text-left hover:text-[#c5a059] transition-all pt-6 border-t border-white/10 text-xs font-mono tracking-[0.3em] hover:translate-x-2 text-gray-400 cursor-pointer"
                >
                  SUPPORT & INQUIRIES
                </button>
              </div>
            </div>

            <div className="text-[10px] font-mono tracking-[0.25em] text-gray-600 uppercase border-t border-white/5 pt-6">
              DTHRIFT STUDIO &copy; 2026
            </div>
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

      {/* --- CATEGORY EXPLORER MODAL (Responsive Auto-Fit Grid) --- */}
      {selectedCategory && (
        <div className="fixed inset-0 z-[1002] bg-black/95 backdrop-blur-md flex flex-col p-4 sm:p-12 overflow-y-auto animate-[fadeIn_0.3s_ease-out]">
          <div className="flex justify-between items-center max-w-7xl mx-auto w-full mb-8 pt-12 sm:pt-0">
            <span className="text-xs font-mono tracking-[0.4em] text-[#c5a059] uppercase">
              Category / {selectedCategory}
            </span>
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-white text-xs font-mono hover:text-[#c5a059] transition-colors border border-white/20 px-5 py-2.5 hover:border-[#c5a059] cursor-pointer"
            >
              ✕ CLOSE
            </button>
          </div>

          <div 
            className="max-w-7xl mx-auto w-full grid gap-4 sm:gap-8"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 160px), 1fr))" }}
          >
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
                  className="group bg-[#181a1e] border border-zinc-700 rounded-sm cursor-pointer p-3 sm:p-4 hover:border-[#c5a059] transition-all duration-300 hover:-translate-y-2 shadow-2xl"
                >
                  <div className="aspect-[3/4] overflow-hidden mb-3 sm:mb-4 relative bg-zinc-900 border border-zinc-800">
                    <img
                      src={item.img}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      onError={(e) => handleImageError(e, item)}
                    />
                    <span className={`absolute top-2 left-2 text-[9px] sm:text-[10px] tracking-widest px-2 py-0.5 sm:px-2.5 sm:py-1 uppercase border backdrop-blur-sm font-mono font-bold ${
                      Number(item.stock) === 0 ? "bg-rose-950/90 text-rose-400 border-rose-500/50" : "bg-black/90 text-[#c5a059] border-white/20"
                    }`}>
                      {Number(item.stock) === 0 ? "SOLD OUT" : `Stock: ${item.stock} left`}
                    </span>
                  </div>

                  <div className="flex justify-between items-start pt-1 sm:pt-2">
                    <div>
                      <h4 className="text-xs sm:text-sm tracking-widest text-white uppercase font-serif font-bold group-hover:text-[#c5a059] transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[9px] sm:text-[10px] text-amber-500/85 mt-0.5 uppercase tracking-wider font-mono">
                        {item.category}
                      </p>
                    </div>
                    <span className="text-xs sm:text-sm font-mono text-[#c5a059] font-bold">
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
          <div className="bg-[#141619] border border-white/10 max-w-2xl w-full p-6 sm:p-8 rounded-sm relative grid grid-cols-1 md:grid-cols-2 gap-6 shadow-2xl animate-[scaleUp_0.3s_cubic-bezier(0.16,1,0.3,1)]">
            <button
              onClick={() => { setSelectedProduct(null); setActiveTab("details"); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xs font-mono hover:rotate-90 transition-transform cursor-pointer"
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
                  <p className="text-xs text-gray-400 font-sans leading-relaxed mb-6">
                    {selectedProduct.description || "Archival high-grade garment carefully curated and inspected for authentic vintage silhouette and wear."}
                  </p>
                ) : (
                  <div className="space-y-2 mb-6 font-mono text-[10px] text-gray-300 bg-white/5 p-3 rounded-sm border border-white/5">
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-gray-500">CHEST / PIT TO PIT:</span>
                      <span className="text-[#c5a059]">22.0 INCHES</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-gray-500">LENGTH:</span>
                      <span className="text-[#c5a059]">28.5 INCHES</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-gray-500">SHOULDER:</span>
                      <span className="text-[#c5a059]">19.5 INCHES</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">CONDITION:</span>
                      <span className="text-emerald-400">9.5/10 VINTAGE</span>
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
                {(products.find((p) => p.id === selectedProduct.id)?.stock || 0) === 0 ? "OUT OF STOCK" : "Add To Bag"}
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
                    <div key={item.id} className="flex justify-between items-center bg-white/5 p-3 rounded-sm border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <img 
                          src={item.img} 
                          alt={item.title} 
                          className="w-12 h-16 object-cover bg-black/40"
                          onError={(e) => handleImageError(e, item)}
                        />
                        <div>
                          <h4 className="text-xs font-serif tracking-wider text-white uppercase">{item.title}</h4>
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
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full font-sans text-[10px] tracking-[0.35em] uppercase border border-[#c5a059] bg-[#c5a059] text-black py-4 hover:bg-transparent hover:text-[#c5a059] transition-all font-semibold disabled:opacity-50 active:scale-95 cursor-pointer"
              >
                Proceed To Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN PAGE CONTENT --- */}
      <main className="pt-24 sm:pt-28 px-3 sm:px-6 md:px-10 pb-12 max-w-[1920px] mx-auto">
        
        {/* COUNTDOWN BANNER */}
        <section 
          className="reveal-item mb-12 border border-[#c5a059]/20 py-8 px-6 bg-gradient-to-r from-[#141619] via-[#1a1d22] to-[#141619] rounded-sm shadow-2xl relative overflow-hidden group"
          aria-label="Launch Countdown"
        >
          <div className="flex flex-col lg:flex-row justify-between items-center max-w-7xl mx-auto gap-6 relative z-10">
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-[9px] tracking-[0.4em] uppercase text-[#c5a059] font-mono font-medium">
                  Exclusive Drop Sequence
                </span>
              </div>
              <h2 className="text-base tracking-[0.35em] uppercase font-serif text-white">
                Launching Soon
              </h2>
            </div>

            <div className="flex gap-6 sm:gap-10 font-sans" aria-live="polite">
              {[
                { label: "days", value: timeLeft.days },
                { label: "hours", value: timeLeft.hours },
                { label: "minutes", value: timeLeft.minutes },
                { label: "seconds", value: timeLeft.seconds },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center min-w-[50px]">
                  <span className="text-2xl sm:text-3xl font-light tracking-widest text-[#f1ece1] tabular-nums font-mono">
                    {String(item.value || "0").padStart(2, "0")}
                  </span>
                  <span className="text-[8px] uppercase tracking-[0.3em] text-[#c5a059] mt-1 font-mono">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setShowContactModal(true)}
              className="font-sans text-[10px] tracking-[0.35em] uppercase border border-[#c5a059] bg-[#c5a059] text-black px-8 py-3.5 hover:bg-transparent hover:text-[#c5a059] transition-all duration-300 font-semibold active:scale-95 shadow-xl cursor-pointer"
            >
              Get Early Access
            </button>
          </div>
        </section>

        {/* --- DYNAMIC RESPONSIVE HERO GRID --- */}
        <section 
          className="reveal-item grid gap-6"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))" }}
        >
          {[
            {
              id: "card-jackets",
              title: "JACKETS",
              subtitle: "Leather, Bombers & Workwear",
              accent: "from-amber-950/40",
              img: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=1200",
            },
            {
              id: "card-hoodies",
              title: "HOODIES",
              subtitle: "Heavyweight Fleeces & Washes",
              accent: "from-stone-900/40",
              img: "https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?auto=format&fit=crop&q=80&w=1200",
            },
            {
              id: "card-jeans",
              title: "JEANS",
              subtitle: "Vintage Denim & Relaxed Fits",
              accent: "from-blue-950/40",
              img: "https://images.unsplash.com/photo-1602293589930-45aad59ba3ab?auto=format&fit=crop&q=80&w=1200",
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
        <footer className="reveal-item mt-24 pt-10 border-t border-white/10 font-sans text-[10px] tracking-[0.25em] text-gray-400 uppercase">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-8 mb-12">
            <div className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">
              DTHRIFT ARCHIVES // EST. 2026
            </div>

            <div className="flex flex-wrap gap-8 text-[10px]">
              <button 
                onClick={() => setShowContactModal(true)} 
                className="hover:text-[#c5a059] transition-colors uppercase cursor-pointer"
              >
                Contact
              </button>
              <a 
                href={INSTAGRAM_URL} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-[#c5a059] transition-colors uppercase"
              >
                Instagram
              </a>
            </div>
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-white/5 text-[9px] text-gray-500 font-mono">
            <span>DTHRIFT Studio</span>
            <span>&copy; 2026 All Rights Reserved</span>
          </div>
        </footer>

      </main>
    </div>
  ); 
}