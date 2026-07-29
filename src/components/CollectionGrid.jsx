import React from 'react';

// Sample product catalog data
const PRODUCTS = [
  {
    id: 1,
    name: "Vintage Heavyweight Bomber",
    category: "Jackets",
    price: "$180",
    image: "/assets/hero.png", // Replace with your actual product image path
    tag: "1 of 1"
  },
  {
    id: 2,
    name: "Raw Denim Flared Denim",
    category: "Jeans",
    price: "$140",
    image: "/assets/hero.png",
    tag: "Archival"
  },
  {
    id: 3,
    name: "Sun-Faded Boxy Hoodie",
    category: "Hoodies",
    price: "$120",
    image: "/assets/hero.png",
    tag: "Restocked"
  },
  // Add rest of your products here...
];

export default function CollectionGrid({ activeCategory, setActiveCategory }) {
  const categories = ["All", "Jackets", "Hoodies", "Jeans"];

  // Filter products based on selected category
  const filteredProducts = activeCategory === "All"
    ? PRODUCTS
    : PRODUCTS.filter(item => item.category === activeCategory);

  return (
    <section className="max-w-7xl mx-auto px-6 py-20 border-t border-white/10">
      
      {/* Header & Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <span className="text-xs uppercase tracking-[0.3em] text-[#c5a059] font-mono">
            Catalog Selection
          </span>
          <h2 className="text-3xl font-light tracking-wide text-white mt-1">
            {activeCategory === "All" ? "Full Collection" : activeCategory}
          </h2>
        </div>

        {/* Category Filter Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 text-xs uppercase tracking-widest transition-all duration-300 rounded-sm border ${
                activeCategory === cat
                  ? "bg-[#c5a059] text-black border-[#c5a059] font-semibold"
                  : "bg-transparent text-stone-400 border-white/10 hover:border-white/30 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => (
            <div 
              key={product.id} 
              className="group relative bg-[#121315] border border-white/5 rounded-sm overflow-hidden hover:border-white/20 transition-all duration-500"
            >
              {/* Product Image */}
              <div className="aspect-[3/4] w-full overflow-hidden bg-stone-900 relative">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <span className="absolute top-3 left-3 text-[10px] uppercase tracking-widest bg-black/60 text-[#c5a059] px-2 py-1 backdrop-blur-md border border-white/10">
                  {product.tag}
                </span>
              </div>

              {/* Product Details */}
              <div className="p-5 flex justify-between items-start">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-stone-400 font-mono">
                    {product.category}
                  </p>
                  <h3 className="text-base font-light text-white mt-1 group-hover:text-[#c5a059] transition-colors">
                    {product.name}
                  </h3>
                </div>
                <span className="text-sm font-mono text-stone-300">
                  {product.price}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-24 border border-dashed border-white/10 rounded-sm">
          <p className="text-stone-500 text-sm tracking-widest uppercase">
            No items available in {activeCategory} right now.
          </p>
        </div>
      )}
    </section>
  );
}