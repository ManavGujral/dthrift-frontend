export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#e3ded8]/90 backdrop-blur-md border-b border-black/10 px-8 py-5 flex justify-between items-center text-[11px] tracking-[0.25em] uppercase text-black">
      {/* LEFT NAV */}
      <div className="hidden md:flex gap-8 font-medium">
        <a href="#" className="hover:opacity-50 transition-opacity">Collection</a>
        <a href="#" className="hover:opacity-50 transition-opacity">Athletics</a>
      </div>

      {/* CENTER BRAND LOGO */}
      <a href="#" className="text-base font-semibold tracking-[0.35em] text-black uppercase">
        DTHRIFT
      </a>

      {/* RIGHT UTILITY */}
      <div className="flex gap-8 font-medium">
        <button className="hover:opacity-50 transition-opacity uppercase">Search</button>
        <button className="hover:opacity-50 transition-opacity uppercase">Bag (0)</button>
      </div>
    </nav>
  );
}