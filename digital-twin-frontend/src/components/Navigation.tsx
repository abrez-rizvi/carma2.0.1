"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  BarChart3,
  FlaskConical,
  BarChart,
  GitCompare,
  Map,
  Menu,
  X,
} from "lucide-react";

const NAV_SECTIONS = [
  { id: "baseline", label: "Baseline", icon: BarChart3 },
  { id: "policy-lab", label: "Policy Lab", icon: FlaskConical },
  { id: "results", label: "Results", icon: BarChart },
  { id: "comparison", label: "Compare", icon: GitCompare },
  { id: "maps", label: "Maps", icon: Map },
];

function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div>
              <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                CARMA
              </span>
              <span className="block text-[10px] text-white/30 -mt-0.5 tracking-wide">
                Urban CO₂ digital twin
              </span>
            </div>
          </Link>

          {/* Desktop Section Anchors */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-white/50 hover:text-white rounded-lg transition-colors hover:bg-white/5 group"
                >
                  <Icon className="w-4 h-4 text-white/40 group-hover:text-emerald-400 transition-colors" />
                  {section.label}
                </button>
              );
            })}
          </div>

          {/* Page Links (secondary) */}
          <div className="hidden md:flex items-center gap-3 text-xs">
            <Link
              href="/hyper-local-aqi"
              className="text-white/30 hover:text-white/60 transition-colors px-2 py-1"
            >
              AQI Insights
            </Link>
            <Link
              href="/solutions"
              className="text-white/30 hover:text-white/60 transition-colors px-2 py-1"
            >
              Solutions
            </Link>
            <Link
              href="/health-impact"
              className="text-white/30 hover:text-white/60 transition-colors px-2 py-1"
            >
              Health Impact
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-white/60 p-2"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-white/5 animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-1">
              {NAV_SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      scrollToSection(section.id);
                      setMobileOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                  >
                    <Icon className="w-4 h-4" />
                    {section.label}
                  </button>
                );
              })}
              <div className="border-t border-white/5 pt-2 mt-2">
                <Link
                  href="/hyper-local-aqi"
                  className="block px-4 py-3 text-sm text-white/40 hover:text-white/60"
                >
                  AQI Insights
                </Link>
                <Link
                  href="/solutions"
                  className="block px-4 py-3 text-sm text-white/40 hover:text-white/60"
                >
                  Solutions Lab
                </Link>
                <Link
                  href="/health-impact"
                  className="block px-4 py-3 text-sm text-white/40 hover:text-white/60"
                >
                  Health Impact
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
