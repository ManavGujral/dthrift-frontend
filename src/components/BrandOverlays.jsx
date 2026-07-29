import React from "react";
import { useCart } from "./CartContext";

export default function BrandOverlays() {
  const {
    products,
    cart,
    addToCart,
    removeFromCart,
    totalAmount,
    isCartOpen,
    setIsCartOpen,
    selectedProduct,
    setSelectedProduct,
    selectedCategory,
    setSelectedCategory,
  } = useCart();

  // Integrated Checkout Handler (UPI / WhatsApp Order or Payment Gateway)
  const handleCheckout = () => {
    if (cart.length === 0) return;
    const orderSummary = cart
      .map((i) => `${i.title} (x${i.quantity}) - $${i.price * i.quantity}`)
      .join("%0A");
    const total = `%0A%0ATotal: $${totalAmount}`;
    const whatsappUrl = `https://wa.me/917387202668?text=New%20DTHRIFT%20Order:%0A${orderSummary}${total}`;
    
    window.open(whatsappUrl, "_blank");
  };

  return (
    <>
      {/* --- CATEGORY / COLLECTION EXPLORER MODAL --- */}
      {selectedCategory && (
        <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex flex-col p-6 sm:p-12 overflow-y-auto">
          <div className="flex justify-between items-center max-w-7xl mx-auto w-full mb-8">
            <span className="text-xs font-mono tracking-[0.4em] text-[#c5a059] uppercase">
              Collection / {selectedCategory}
            </span>
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-white text-xl hover:text-[#c5a059] transition-colors"
            >
              ✕ CLOSE
            </button>
          </div>

          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products
              .filter((p) => p.category === selectedCategory)
              .map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedProduct(item)}
                  className="group bg-[#141619] border border-white/10 rounded-sm cursor-pointer p-4 hover:border-[#c5a059] transition-all"
                >
                  <div className="aspect-[3/4] overflow-hidden mb-4 relative">
                    <img
                      src={item.img}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-2 left-2 bg-black/70 text-[#c5a059] text-[9px] tracking-widest px-2 py-1 uppercase border border-white/10">
                      Stock: {item.stock} left
                    </span>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm tracking-widest text-white uppercase font-serif">
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">
                        {item.category}
                      </p>
                    </div>
                    <span className="text-sm font-mono text-[#c5a059]">${item.price}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* --- PRODUCT INSPECT / DETAILS MODAL --- */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141619] border border-white/10 max-w-2xl w-full p-6 sm:p-8 rounded-sm relative grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-sm font-mono"
            >
              ✕
            </button>

            <div className="aspect-[3/4] overflow-hidden border border-white/10">
              <img src={selectedProduct.img} alt={selectedProduct.title} className="w-full h-full object-cover" />
            </div>

            <div className="flex flex-col justify-between">
              <div>
                <span className="text-[9px] tracking-[0.4em] text-[#c5a059] uppercase block mb-1">
                  {selectedProduct.category}
                </span>
                <h3 className="text-xl font-serif tracking-widest text-white uppercase mb-2">
                  {selectedProduct.title}
                </h3>
                <p className="text-lg font-mono text-white mb-4">${selectedProduct.price}</p>
                <p className="text-xs text-gray-400 font-sans leading-relaxed mb-6">
                  {selectedProduct.description}
                </p>
                <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 mb-6">
                  Status: {selectedProduct.stock > 0 ? `In Stock (${selectedProduct.stock} Available)` : "Sold Out"}
                </p>
              </div>

              <button
                onClick={() => {
                  addToCart(selectedProduct);
                  setSelectedProduct(null);
                }}
                disabled={selectedProduct.stock === 0}
                className="w-full font-sans text-[10px] tracking-[0.35em] uppercase border border-[#c5a059] bg-[#c5a059] text-black py-3 hover:bg-transparent hover:text-[#c5a059] transition-all font-semibold"
              >
                Add To Bag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CART DRAWER --- */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="bg-[#141619] border-l border-white/10 w-full max-w-md h-full p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-6 border-b border-white/10 mb-6">
                <h3 className="text-sm tracking-[0.3em] font-serif uppercase text-white">
                  Shopping Bag ({cart.reduce((a, b) => a + b.quantity, 0)})
                </h3>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="text-gray-400 hover:text-white text-xs font-mono"
                >
                  ✕ CLOSE
                </button>
              </div>

              {cart.length === 0 ? (
                <p className="text-xs text-gray-500 font-mono tracking-widest uppercase text-center py-12">
                  Your bag is empty.
                </p>
              ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center bg-white/5 p-3 rounded-sm border border-white/5">
                      <div className="flex items-center gap-3">
                        <img src={item.img} alt={item.title} className="w-12 h-16 object-cover" />
                        <div>
                          <h4 className="text-xs font-serif tracking-wider text-white uppercase">{item.title}</h4>
                          <p className="text-[10px] font-mono text-gray-400">
                            ${item.price} x {item.quantity}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-rose-400 text-xs font-mono hover:text-rose-300"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer / Checkout */}
            <div className="pt-6 border-t border-white/10">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs uppercase tracking-widest text-gray-400">Total</span>
                <span className="text-lg font-mono text-[#c5a059]">${totalAmount}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full font-sans text-[10px] tracking-[0.35em] uppercase border border-[#c5a059] bg-[#c5a059] text-black py-4 hover:bg-transparent hover:text-[#c5a059] transition-all font-semibold disabled:opacity-50"
              >
                Proceed To Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}