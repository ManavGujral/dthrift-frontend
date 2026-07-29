export default function CinemaOverlay() {
  return (
    <div className="cinema fixed inset-0 bg-black opacity-0 pointer-events-none z-[999] flex items-center justify-center transition-opacity duration-1000">
      <video
        autoPlay
        muted
        loop
        className="w-full h-full object-cover opacity-60 filter grayscale brightness-90"
      >
        <source src="/fashion-film.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-center px-4">
        <span className="text-[10px] tracking-[0.6em] text-white/50 uppercase mb-3">
          Film Presentation
        </span>
        <h1 className="text-3xl md:text-6xl font-light tracking-[0.3em] uppercase text-white">
          DTHRIFT FILM
        </h1>
      </div>
    </div>
  );
}