import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Users, 
  Layers, 
  Zap, 
  Car, 
  Dumbbell, 
  Sparkles, 
  Trees, 
  Menu,
  Compass
} from 'lucide-react';

interface HomePageProps {
  onOpenMenu: () => void;
}

const FULL_TITLE = "VAISHNAVI PRIDE";

export const HomePage: React.FC<HomePageProps> = ({ onOpenMenu }) => {
  const [typedText, setTypedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const currentLength = typedText.length;

    if (!isDeleting && currentLength < FULL_TITLE.length) {
      // Typing next character
      timer = setTimeout(() => {
        setTypedText(FULL_TITLE.slice(0, currentLength + 1));
      }, 140);
    } else if (!isDeleting && currentLength === FULL_TITLE.length) {
      // Pause at full text for 3.5 seconds
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, 3500);
    } else if (isDeleting && currentLength > 0) {
      // Deleting character
      timer = setTimeout(() => {
        setTypedText(FULL_TITLE.slice(0, currentLength - 1));
      }, 70);
    } else if (isDeleting && currentLength === 0) {
      // Restart typing loop after 500ms pause
      timer = setTimeout(() => {
        setIsDeleting(false);
      }, 500);
    }

    return () => clearTimeout(timer);
  }, [typedText, isDeleting]);

  return (
    <div className="space-y-12 pb-12">
      {/* HERO SECTION WITH DYNAMIC ANIMATED BACKGROUND & TYPEWRITER TITLE */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950/80 to-slate-900 border border-sky-500/40 p-8 md:p-14 text-center shadow-2xl animate-hero-bg hover-glow-card">
        {/* Floating Glowing Background Particles */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-sky-500/20 rounded-full blur-3xl pointer-events-none animate-particle-1"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none animate-particle-2"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-inner animate-bounce">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            Vaishnavi Pride Residential Landmark • 22 Floors | 154 Units
          </div>

          {/* STYLISH ANIMATED TYPEWRITER TITLE WRAPPER */}
          <div className="relative py-4 inline-block min-h-[90px] md:min-h-[120px] flex items-center justify-center">
            {/* Glowing Neon Backdrop Aura */}
            <div className="absolute inset-0 bg-gradient-to-r from-sky-500/30 via-indigo-500/30 to-purple-500/30 blur-2xl rounded-3xl animate-pulse"></div>

            {/* TYPEWRITER VAISHNAVI PRIDE TITLE WITH BLINKING CURSOR */}
            <h1 className="relative z-10 text-4xl sm:text-5xl md:text-7xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-sky-200 via-indigo-100 to-sky-300 animate-text-shimmer animate-title-glow flex items-center justify-center gap-1.5">
              <span>{typedText}</span>
              <span className="w-1.5 h-10 md:h-16 bg-sky-400 animate-pulse rounded-full shadow-[0_0_15px_#38bdf8] shrink-0"></span>
            </h1>
          </div>

          {/* BUILDING SLOGAN */}
          <p className="text-base md:text-lg text-slate-200 font-medium max-w-2xl mx-auto leading-relaxed drop-shadow-md">
            "Elevating Luxury Living, Seamless Community Governance & 100% Financial Transparency for Every Resident."
          </p>

          {/* LOCATION LINK & NAVIGATION TRIGGER */}
          <div className="flex flex-wrap justify-center items-center gap-4 pt-4">
            <a
              href="https://maps.app.goo.gl/bBeW2bkZ1zAFHgMKA"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-sky-500/30 transition-all hover:scale-105 hover:shadow-sky-500/50"
            >
              <MapPin className="w-4 h-4 text-sky-200 animate-pulse" />
              Open Live Location on Google Maps
            </a>

            <button
              onClick={onOpenMenu}
              className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900/90 hover:bg-slate-800 border border-indigo-500/40 text-slate-200 hover:text-white rounded-2xl text-xs font-bold shadow-md transition-all hover:scale-105 hover:border-sky-400"
            >
              <Menu className="w-4 h-4 text-sky-400" />
              Explore Society Modules via Hamburger Menu ☰
            </button>
          </div>
        </div>
      </section>

      {/* DYNAMIC BUILDING VECTOR ARCHITECTURAL ILLUSTRATION & SIMPLIFIED STATS (HEADINGS ONLY) */}
      <section className="glass-panel p-8 space-y-6 border-sky-500/30 hover-glow-card">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-200 to-indigo-200 animate-text-shimmer flex items-center gap-2">
              <Building2 className="w-6 h-6 text-sky-400" />
              22-Floor Architectural Tower Layout & Elevator Dynamics
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Interactive structural overview mapping all 22 residential floors and 3 high-speed KONE elevators.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span> Active Lighted Floors</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span> 3 Elevators Running</span>
          </div>
        </div>

        {/* Vector Building Graphic Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center py-4">
          {/* Visual Building Diagram */}
          <div className="lg:col-span-1 bg-slate-950 p-6 rounded-3xl border border-slate-800 flex flex-col items-center space-y-2 shadow-inner hover:border-sky-500/50 transition-all duration-300 hover:scale-[1.02]">
            <div className="w-full text-center pb-2 border-b border-slate-800 text-[11px] font-bold text-sky-400 tracking-wider uppercase">
              Tower A Structure (Floors 22 → 1)
            </div>

            {/* Roof Deck */}
            <div className="w-40 h-8 bg-gradient-to-r from-sky-800 to-indigo-800 rounded-t-xl flex items-center justify-center text-[10px] font-bold text-white border-b border-sky-400 shadow-lg">
              Sky Deck & Terrace Garden
            </div>

            {/* 22 Floors Stack Simulation */}
            <div className="w-48 bg-slate-900 border-x-2 border-indigo-500/60 p-2 space-y-1.5 rounded-b-xl shadow-2xl">
              {[22, 20, 15, 10, 5, 1].map((floorNum) => (
                <div key={floorNum} className="flex justify-between items-center px-2 py-1 bg-slate-950/80 rounded border border-slate-800 text-[10px] hover:border-sky-400/60 transition-colors">
                  <span className="font-bold text-sky-300">F-{floorNum}</span>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400/80 animate-pulse"></span>
                    <span className="w-2 h-2 rounded-full bg-amber-400/80"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400/80"></span>
                    <span className="w-2 h-2 rounded-full bg-sky-400/80"></span>
                  </div>
                  <span className="text-slate-500 font-mono">7 Units</span>
                </div>
              ))}
            </div>

            {/* Entrance Lobby */}
            <div className="w-56 h-10 bg-slate-900 border border-sky-500/50 rounded-lg flex items-center justify-center text-xs font-bold text-sky-300 shadow-md">
              Ground Entrance & Security Desk
            </div>
          </div>

          {/* Core Building Statistics Grid (HEADINGS ONLY) */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center gap-4 hover-glow-card">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold shrink-0 border border-sky-500/30">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">22 High-Rise Floors</h3>
              </div>
            </div>

            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center gap-4 hover-glow-card">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shrink-0 border border-indigo-500/30">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">154 Residing Families</h3>
              </div>
            </div>

            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center gap-4 hover-glow-card">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold shrink-0 border border-purple-500/30">
                <Layers className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">7 Rooms / Units Per Floor</h3>
              </div>
            </div>

            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center gap-4 hover-glow-card">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 border border-emerald-500/30">
                <Zap className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">3 High-Speed Elevators</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AMENITIES SUITE SHOWCASE WITH HOVER ANIMATIONS */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-white to-indigo-300 animate-text-shimmer tracking-tight">
            World-Class Society Amenities
          </h2>
          <p className="text-xs text-slate-400 max-w-xl mx-auto">
            Designed for comfort, security, and community well-being across all 154 flat owners.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Amenity 1: Parking */}
          <div className="glass-panel p-6 space-y-3 hover-glow-card cursor-pointer">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Car className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Multi-Level Covered Parking</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Basement B1 & B2 parking slots allocated to all 154 flats with EV charging stations and 24/7 CCTV vigilance.
            </p>
          </div>

          {/* Amenity 2: Gym */}
          <div className="glass-panel p-6 space-y-3 hover-glow-card cursor-pointer">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Dumbbell className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Modern Fitness Gym</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              State-of-the-art strength training equipment, treadmill cardio zone, and yoga studio reserved for residents.
            </p>
          </div>

          {/* Amenity 3: Dedicated Meeting Hall */}
          <div className="glass-panel p-6 space-y-3 hover-glow-card cursor-pointer">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Dedicated Meeting & Banquet Hall</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Acoustic soundproof community assembly hall for society AGMs, private birthdays, and cultural festivities.
            </p>
          </div>

          {/* Amenity 4: Garden & Play Area */}
          <div className="glass-panel p-6 space-y-3 hover-glow-card cursor-pointer">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Trees className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Green Landscaped Garden</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Lush green walking tracks, children's safety play park, and senior citizen seating gazebo.
            </p>
          </div>

          {/* Amenity 5: Terrace Open Spaces */}
          <div className="glass-panel p-6 space-y-3 hover-glow-card cursor-pointer">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Terrace Sky Lounge & Open Spaces</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              22nd-floor sky lounge offering panoramic skyline views, stargazing decks, and open-air relaxation zones.
            </p>
          </div>

          {/* Amenity 6: 3 High-Speed Elevators */}
          <div className="glass-panel p-6 space-y-3 hover-glow-card cursor-pointer">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">3 Smart KONE Elevators</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              3 high-speed lifts with 24/7 power backup generator, servicing all 22 floors with zero downtime.
            </p>
          </div>
        </div>
      </section>

      {/* QUICK INSTRUCTION FOOTER CARD WITH HOVER ANIMATION */}
      <div className="p-6 bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border border-sky-500/30 rounded-3xl flex flex-wrap items-center justify-between gap-4 hover-glow-card">
        <div>
          <h4 className="font-bold text-white text-base">Ready to Access Society Operations?</h4>
          <p className="text-xs text-slate-300 mt-0.5">
            Click the Hamburger menu icon in the top header to manage tickets, view announcements, verify UPI payments, book amenities, or view the Admin Hierarchy.
          </p>
        </div>
        <button
          onClick={onOpenMenu}
          className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/30 flex items-center gap-2 transition-transform hover:scale-105"
        >
          <Menu className="w-4 h-4 text-white" />
          Open Navigation Menu ☰
        </button>
      </div>
    </div>
  );
};
