import React, { createContext, useContext, useState } from "react";

const CartContext = createContext();

// Sample product database with high-fashion stock items
const INITIAL_PRODUCTS = [
  {
    id: "j1",
    title: "VINTAGE LEATHER BOMBER",
    category: "JACKETS",
    price: 240,
    stock: 2,
    img: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=1200",
    description: "1-of-1 hand-sourced vintage leather jacket with aged patina and distressed bronze hardware."
  },
  {
    id: "h1",
    title: "HEAVYWEIGHT BOXY HOODIE",
    category: "HOODIES",
    price: 130,
    stock: 5,
    img: "https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?auto=format&fit=crop&q=80&w=1200",
    description: "500 GSM French Terry cotton hoodie featuring sun-faded wash and custom drop-shoulder silhouette."
  },
  {
    id: "g1",
    title: "RAW FLARED DENIM",
    category: "JEANS",
    price: 160,
    stock: 3,
    img: "https://images.unsplash.com/photo-1602293589930-45aad59ba3ab?auto=format&fit=crop&q=80&w=1200",
    description: "14oz Japanese raw selvage denim cut in an archival relaxed flared silhouette."
  }
];

export function CartProvider({ children }) {
  const [products] = useState(INITIAL_PRODUCTS);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const addToCart = (product) => {
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

  const totalAmount = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);