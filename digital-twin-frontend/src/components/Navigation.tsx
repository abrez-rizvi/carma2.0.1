"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Microscope, Lightbulb, Heart, Menu, X } from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const links = [
    { href: "/", label: "Policy Simulator", icon: <Microscope className="w-4 h-4" /> },
    { href: "/solutions", label: "Solutions", icon: <Lightbulb className="w-4 h-4" /> },
    { href: "/health-impact", label: "Health Impact", icon: <Heart className="w-4 h-4" /> },
  ];

  return (
    <nav className="sticky top-0 z-60 bg-black/60 backdrop-blur-md border-b border-white/10 transition-all">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-full overflow-hidden shadow-[0_0_15px_rgba(74,222,128,0.5)]">
            <img src="/carma-logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight group-hover:text-green-200 transition-colors">
              <span className="text-green-500">CARMA</span>
            </span>
            <span className="text-sm font-medium text-slate-400">Urban CO₂ digital twin</span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-2 text-sm font-medium transition-all duration-300 ${isActive ? "text-green-400" : "text-slate-400 hover:text-white"
                  }`}
              >
                {/* Glow dot for active state */}
                {isActive && (
                  <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_10px_#4ade80]" />
                )}

                <span className={isActive ? "text-green-400" : "opacity-70 group-hover:opacity-100"}>
                  {link.icon}
                </span>
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="md:hidden flex items-center justify-center w-10 h-10 text-white/70 hover:text-white transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-black/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-2">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-white/10 text-green-400"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span className={isActive ? "text-green-400" : "opacity-70"}>
                    {link.icon}
                  </span>
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
