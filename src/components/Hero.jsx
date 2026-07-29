export default function Hero() {
  return (
    <section className="h-screen flex flex-col items-center justify-center text-center px-6 relative z-10 border-b border-white/10">
      <span className="text-[10px] tracking-[0.6em] text-white/40 uppercase mb-4 block">
        New Standard
      </span>

      <h1 className="text-5xl md:text-8xl font-light leading-[1.05] tracking-tight uppercase max-w-5xl">
        Elevate <br />
        <span className="font-semibold text-white/90">Your Style</span>
      </h1>

      <p className="mt-8 text-xs tracking-[0.2em] text-white/50 max-w-sm uppercase leading-relaxed font-light">
        Premium streetwear engineered for the next generation.
      </p>

      <button className="mt-12 border border-white text-xs tracking-[0.3em] uppercase px-8 py-4 hover:bg-white hover:text-black transition-all duration-300">
        Explore Collection
      </button>
    </section>
  );
}