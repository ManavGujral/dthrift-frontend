import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

const LaunchCelebration = () => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    const todayLocal = `${year}-${month}-${day}`;
    const launchDate = '2026-08-01'; 

    if (todayLocal === launchDate) {
      setShowModal(true);
      triggerConfetti();
    }
  }, []);

  const triggerConfetti = () => {
    const count = 250;
    const defaults = { origin: { y: 1 }, zIndex: 99999 };

    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    // Exploding upward from the bottom
    fire(0.25, { spread: 26, startVelocity: 75, colors: ['#c5a059', '#ffffff', '#000000'] });
    fire(0.2, { spread: 60, startVelocity: 65, colors: ['#c5a059', '#ffffff'] });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, startVelocity: 85 });
    fire(0.1, { spread: 120, startVelocity: 45, decay: 0.92, colors: ['#c5a059', '#444444'] });
    fire(0.1, { spread: 120, startVelocity: 95 });
  };

  if (!showModal) return null;

  // A hardcoded array to generate a cool fake barcode without breaking hydration
  const barcodePattern = [2, 1, 3, 1, 1, 4, 1, 2, 1, 1, 2, 3, 1, 2, 1, 1, 4, 1, 2];

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a0a] font-sans overflow-hidden">
      
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] md:w-[40vw] md:h-[40vw] bg-[#c5a059] rounded-full opacity-[0.05] blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full px-4 flex flex-col items-center">
        
        {/* Blinking Live System Indicator */}
        <div className="flex items-center gap-3 mb-12 animate-pulse">
          <div className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.9)]" />
          <span className="text-red-500 text-[10px] md:text-xs font-mono tracking-[0.4em] uppercase font-bold">
            System Live // Drop Active
          </span>
        </div>

        {/* Massive Overlapping Typography */}
        <div className="text-center relative">
          <h1 className="text-[15vw] md:text-[8rem] font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-[#333] tracking-tighter uppercase leading-[0.85] mb-2 drop-shadow-2xl">
            DTHRIFT
          </h1>
          <h2 className="text-[8vw] md:text-[4rem] font-black text-[#c5a059] tracking-tighter uppercase leading-none -mt-4 md:-mt-8 mb-6 mix-blend-screen">
            Unlocked
          </h2>
        </div>

        {/* Abstract Tech / Barcode Element */}
        <div className="flex gap-1 md:gap-1.5 my-8 opacity-40">
            {barcodePattern.map((width, i) => (
              <div 
                key={i} 
                className="h-10 md:h-12 bg-white" 
                style={{ width: `${width * 4}px` }} 
              />
            ))}
        </div>

        {/* Subtitle */}
        <p className="text-gray-400 text-xs md:text-sm tracking-[0.3em] text-center max-w-lg uppercase mb-12 leading-relaxed">
          The archive is open. <br/> Exclusive vintage pieces. No restocks.
        </p>

        {/* Brutalist Fill-Hover Button */}
        <button
          onClick={() => setShowModal(false)}
          className="group relative px-10 py-5 bg-transparent border border-[#c5a059] overflow-hidden transition-all hover:scale-105 active:scale-95"
        >
          {/* Background fill that slides up on hover */}
          <div className="absolute inset-0 bg-[#c5a059] translate-y-[101%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          
          <span className="relative z-10 text-[#c5a059] group-hover:text-black font-bold tracking-[0.4em] text-xs md:text-sm uppercase transition-colors duration-300">
            Enter The Vault
          </span>
        </button>

      </div>

      {/* Decorative Corner Borders */}
      <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-[#c5a059]/30 pointer-events-none" />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-[#c5a059]/30 pointer-events-none" />
    </div>
  );
};

export default LaunchCelebration;