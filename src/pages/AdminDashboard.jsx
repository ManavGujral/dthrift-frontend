import React, { useState, useEffect } from "react";

export default function AdminDashboard({ products: initialProducts = [], setProducts: setParentProducts, onExitAdmin }) {
  const API_URL = "https://dthrift-backend.onrender.com/api";

  const [activeTab, setActiveTab] = useState("inventory"); // "inventory" | "orders" | "add"
  const [products, setProducts] = useState(initialProducts);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  // State for the uploaded image file
  const [imageFile, setImageFile] = useState(null);

  // Form State for Adding New Product (UPDATED: Added is_upcoming)
  const [newProduct, setNewProduct] = useState({
    title: "",
    category: "JACKETS",
    price: "",
    stock: "1",
    description: "",
    is_upcoming: false, 
  });

  // --- FETCH PRODUCTS DIRECTLY FROM POSTGRESQL ---
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
        if (setParentProducts) setParentProducts(data);
      }
    } catch (err) {
      showStatus("error", "Failed to connect to PostgreSQL backend.");
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- FETCH ORDERS DIRECTLY FROM POSTGRESQL ---
  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/orders`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  const showStatus = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg({ type: "", text: "" }), 4000);
  };

  // --- ADD NEW PRODUCT TO POSTGRESQL (UPDATED FOR FILES AND UPCOMING) ---
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.title || !newProduct.price) {
      showStatus("error", "Please fill in all required fields.");
      return;
    }

    // Must use FormData when sending files to the server
    const formData = new FormData();
    formData.append("title", newProduct.title.toUpperCase());
    formData.append("category", newProduct.category.toUpperCase());
    formData.append("price", Number(newProduct.price));
    formData.append("stock", Number(newProduct.stock) || 1);
    formData.append("description", newProduct.description);
    
    // Append the upcoming status boolean to the payload
    formData.append("is_upcoming", newProduct.is_upcoming);

    // Append the actual file if the user selected one
    if (imageFile) {
      formData.append("image", imageFile); 
    }

    try {
      const res = await fetch(`${API_URL}/products`, {
        method: "POST",
        // Note: Do NOT set "Content-Type" here. 
        // The browser automatically sets it correctly for FormData.
        body: formData,
      });

      if (res.ok) {
        showStatus("success", "Product successfully added to PostgreSQL database!");
        // Reset form including the upcoming boolean
        setNewProduct({ title: "", category: "JACKETS", price: "", stock: "1", description: "", is_upcoming: false });
        setImageFile(null); // Clear the file selection
        // Reset the file input element visually
        document.getElementById("image-upload").value = ""; 
        setActiveTab("inventory");
        fetchProducts(); // Refresh live view
      } else {
        const errData = await res.json();
        showStatus("error", errData.error || "Failed to add product.");
      }
    } catch (err) {
      showStatus("error", "Server connection error while adding product.");
    }
  };

  // --- UPDATE STOCK IN POSTGRESQL ---
  const handleUpdateStock = async (id, newStock) => {
    const stockVal = Math.max(0, Number(newStock));
    
    // 1. Optimistic UI update (forces the number to change on screen immediately)
    const updatedList = products.map((p) =>
      String(p.id) === String(id) ? { ...p, stock: stockVal } : p
    );
    setProducts(updatedList);
    if (setParentProducts) setParentProducts(updatedList);

    // 2. Send the update to the backend database
    try {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: stockVal }),
      });

      if (res.ok) {
        showStatus("success", `Stock updated to ${stockVal} in Database.`);
      } else {
        const errData = await res.json().catch(() => ({}));
        showStatus("error", `BACKEND ERROR: ${errData.error || res.statusText || res.status}`);
        fetchProducts(); // Revert back to real database numbers
      }
    } catch (err) {
      showStatus("error", "NETWORK ERROR: Is your Node server running on port 5000?");
      console.error(err);
      fetchProducts(); // Revert back to real database numbers
    }
  };

  // --- DELETE PRODUCT FROM POSTGRESQL ---
  const handleDeleteProduct = async (id, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}" from the database?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showStatus("success", `Deleted "${title}" from PostgreSQL.`);
        const filtered = products.filter((p) => String(p.id) !== String(id));
        setProducts(filtered);
        if (setParentProducts) setParentProducts(filtered);
      } else {
        showStatus("error", "Backend failed to delete item.");
      }
    } catch (err) {
      showStatus("error", "Error connecting to database to delete item.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0d0e] text-[#f1ece1] p-6 sm:p-12 font-sans selection:bg-[#c5a059] selection:text-black">
      
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-8 border-b border-white/10 gap-4 mb-8">
        <div>
          <span className="text-[9px] font-mono tracking-[0.4em] text-[#c5a059] uppercase block mb-1">
            CONTROL CENTER
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif tracking-widest text-white uppercase font-bold">
            POSTGRESQL ADMIN DASHBOARD
          </h1>
        </div>

        <button
          onClick={onExitAdmin}
          className="font-mono text-xs tracking-[0.25em] text-black bg-[#c5a059] px-6 py-3 uppercase font-semibold hover:bg-white transition-all cursor-pointer shadow-lg active:scale-95"
        >
          ✕ EXIT ADMIN MODE
        </button>
      </header>

      {/* STATUS NOTIFICATION ALERT */}
      {statusMsg.text && (
        <div
          className={`mb-6 p-4 rounded-sm border font-mono text-xs tracking-wider uppercase ${
            statusMsg.type === "success"
              ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300"
              : "bg-rose-950/60 border-rose-500/50 text-rose-300"
          }`}
        >
          {statusMsg.type === "success" ? "✓ " : "✕ "}
          {statusMsg.text}
        </div>
      )}

      {/* NAVIGATION TABS */}
      <div className="flex gap-4 border-b border-white/10 pb-4 mb-8 overflow-x-auto">
        <button
          onClick={() => {
            setActiveTab("inventory");
            fetchProducts();
          }}
          className={`text-xs font-mono tracking-[0.3em] uppercase px-5 py-2.5 transition-all cursor-pointer ${
            activeTab === "inventory"
              ? "bg-[#c5a059] text-black font-bold"
              : "border border-white/10 text-gray-400 hover:text-white hover:border-[#c5a059]"
          }`}
        >
          INVENTORY ({products.length})
        </button>

        <button
          onClick={() => setActiveTab("add")}
          className={`text-xs font-mono tracking-[0.3em] uppercase px-5 py-2.5 transition-all cursor-pointer ${
            activeTab === "add"
              ? "bg-[#c5a059] text-black font-bold"
              : "border border-white/10 text-gray-400 hover:text-white hover:border-[#c5a059]"
          }`}
        >
          + ADD PRODUCT
        </button>

        <button
          onClick={() => {
            setActiveTab("orders");
            fetchOrders();
          }}
          className={`text-xs font-mono tracking-[0.3em] uppercase px-5 py-2.5 transition-all cursor-pointer ${
            activeTab === "orders"
              ? "bg-[#c5a059] text-black font-bold"
              : "border border-white/10 text-gray-400 hover:text-white hover:border-[#c5a059]"
          }`}
        >
          LIVE ORDERS ({orders.length})
        </button>
      </div>

      {/* --- TAB 1: INVENTORY MANAGEMENT --- */}
      {activeTab === "inventory" && (
        <div>
          {loading ? (
            <div className="text-center py-20 font-mono text-xs tracking-widest text-gray-500 uppercase animate-pulse">
              Syncing with PostgreSQL Database...
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 font-mono text-xs tracking-widest text-gray-500 uppercase">
              No products found in PostgreSQL. Add your first item!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#141619] border border-white/10 p-5 rounded-sm flex flex-col justify-between hover:border-[#c5a059]/50 transition-colors shadow-2xl relative"
                >
                  <div>
                    <div className="aspect-[4/3] overflow-hidden border border-white/10 mb-4 relative">
                      <img
                        src={item.img}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=800";
                        }}
                      />
                      <span className="absolute top-2 left-2 bg-black/80 text-[9px] font-mono text-[#c5a059] px-2 py-1 uppercase border border-white/10">
                        {item.category}
                      </span>
                      
                      {/* NEW: Upcoming Badge indicator for Admin */}
                      {item.is_upcoming && (
                        <span className="absolute top-2 right-2 bg-white text-black text-[9px] font-bold font-mono px-2 py-1 uppercase border border-white/10 tracking-wider">
                          Upcoming
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif text-base tracking-wider text-white uppercase mb-1">
                      {item.title}
                    </h3>
                    <p className="font-mono text-sm text-[#c5a059] mb-4">
                      ₹{Number(item.price).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <div className="flex justify-between items-center font-mono text-xs">
                      <span className="text-gray-400">STOCK IN DB:</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateStock(item.id, Number(item.stock) - 1)}
                          className="w-7 h-7 bg-white/5 border border-white/10 text-white font-bold hover:bg-[#c5a059] hover:text-black transition-colors cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-bold text-white">
                          {item.stock}
                        </span>
                        <button
                          onClick={() => handleUpdateStock(item.id, Number(item.stock) + 1)}
                          className="w-7 h-7 bg-white/5 border border-white/10 text-white font-bold hover:bg-[#c5a059] hover:text-black transition-colors cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteProduct(item.id, item.title)}
                      className="w-full font-mono text-[10px] tracking-[0.2em] text-rose-400 border border-rose-500/30 py-2 uppercase hover:bg-rose-950/50 hover:border-rose-500 transition-all cursor-pointer"
                    >
                      Delete From PostgreSQL
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: ADD NEW PRODUCT --- */}
      {activeTab === "add" && (
        <div className="max-w-2xl bg-[#141619] border border-white/10 p-8 rounded-sm shadow-2xl">
          <h2 className="text-lg font-serif tracking-widest text-white uppercase mb-6 pb-2 border-b border-white/10">
            ADD NEW PRODUCT TO DATABASE
          </h2>

          <form onSubmit={handleAddProduct} className="space-y-5">
            <div>
              <label className="block text-[10px] font-mono tracking-widest text-gray-400 uppercase mb-2">
                PRODUCT TITLE *
              </label>
              <input
                type="text"
                required
                placeholder="E.G. ARCHIVAL LEATHER JACKET"
                value={newProduct.title}
                onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                className="w-full bg-black/50 border border-white/20 px-4 py-3 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-[#c5a059] uppercase"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-mono tracking-widest text-gray-400 uppercase mb-2">
                  CATEGORY *
                </label>
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  className="w-full bg-black/50 border border-white/20 px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-[#c5a059] uppercase"
                >
                  <option value="JACKETS">JACKETS</option>
                  <option value="JERSEY">JERSEY</option>
                  <option value="HOODIES">HOODIES</option>
                  <option value="JEANS">JEANS</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono tracking-widest text-gray-400 uppercase mb-2">
                  PRICE (₹) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="2999"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  className="w-full bg-black/50 border border-white/20 px-4 py-3 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono tracking-widest text-gray-400 uppercase mb-2">
                  INITIAL STOCK
                </label>
                <input
                  type="number"
                  placeholder="1"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                  className="w-full bg-black/50 border border-white/20 px-4 py-3 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-[#c5a059]"
                />
              </div>
            </div>

            {/* UPDATED FILE INPUT */}
            <div>
              <label className="block text-[10px] font-mono tracking-widest text-gray-400 uppercase mb-2">
                UPLOAD PRODUCT IMAGE *
              </label>
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                className="w-full bg-black/50 border border-white/20 px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            {/* NEW: UPCOMING TOGGLE CHECKBOX */}
            <div className="flex items-center bg-black/50 border border-white/20 px-4 py-3">
              <input
                type="checkbox"
                id="upcoming-toggle"
                checked={newProduct.is_upcoming}
                onChange={(e) => setNewProduct({ ...newProduct, is_upcoming: e.target.checked })}
                className="w-4 h-4 mr-3 bg-black/50 border-white/20 accent-[#c5a059] cursor-pointer"
              />
              <label 
                htmlFor="upcoming-toggle" 
                className="text-[10px] font-mono tracking-widest text-gray-300 uppercase cursor-pointer select-none"
              >
                Mark as "Upcoming" Release
              </label>
            </div>

            <div>
              <label className="block text-[10px] font-mono tracking-widest text-gray-400 uppercase mb-2">
                DESCRIPTION
              </label>
              <textarea
                rows="3"
                placeholder="Enter detailed description of item..."
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                className="w-full bg-black/50 border border-white/20 px-4 py-3 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-[#c5a059]"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full font-mono text-xs tracking-[0.3em] uppercase bg-[#c5a059] text-black py-4 hover:bg-white transition-all font-bold cursor-pointer"
            >
              COMMIT PRODUCT TO DATABASE
            </button>
          </form>
        </div>
      )}

      {/* --- TAB 3: LIVE ORDERS --- */}
      {activeTab === "orders" && (
        <div className="bg-[#141619] border border-white/10 rounded-sm p-6 overflow-x-auto shadow-2xl">
          <h2 className="text-lg font-serif tracking-widest text-white uppercase mb-6 pb-2 border-b border-white/10">
            REAL-TIME POSTGRESQL ORDERS
          </h2>

          {orders.length === 0 ? (
            <div className="text-center py-12 font-mono text-xs text-gray-500 uppercase">
              No orders recorded in PostgreSQL yet.
            </div>
          ) : (
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[#c5a059]">
                  <th className="py-3 px-2">PAYMENT ID</th>
                  <th className="py-3 px-2">CUSTOMER</th>
                  <th className="py-3 px-2">ITEMS</th>
                  <th className="py-3 px-2">AMOUNT</th>
                  <th className="py-3 px-2">DATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {orders.map((ord, idx) => (
                  <tr key={ord.id || idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-2 font-bold text-white">{ord.payment_id || ord.paymentId}</td>
                    <td className="py-3 px-2">{ord.customer_name || ord.customer || "Customer"}</td>
                    <td className="py-3 px-2 text-gray-400">{ord.items}</td>
                    <td className="py-3 px-2 text-[#c5a059]">₹{Number(ord.amount).toLocaleString("en-IN")}</td>
                    <td className="py-3 px-2 text-gray-500">
                      {ord.created_at ? new Date(ord.created_at).toLocaleString("en-IN") : "Just Now"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}