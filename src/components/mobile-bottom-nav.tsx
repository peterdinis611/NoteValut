"use client";

import { CalendarClock, Home, Menu, Search, Zap } from "lucide-react";

type Tab = "home" | "search" | "capture" | "due" | "menu";

type Props = {
  active: Tab;
  onHome: () => void;
  onSearch: () => void;
  onCapture: () => void;
  onDue: () => void;
  onMenu: () => void;
};

/** Fixed mobile tab bar — replaces relying only on the slide-over sidebar. */
export function MobileBottomNav({ active, onHome, onSearch, onCapture, onDue, onMenu }: Props) {
  return (
    <nav className="mobile-bottom-nav" aria-label="Primary">
      <button
        type="button"
        className={`mobile-bottom-nav-item ${active === "home" ? "mobile-bottom-nav-active" : ""}`}
        onClick={onHome}
        aria-current={active === "home" ? "page" : undefined}
      >
        <Home className="size-5" />
        <span>Home</span>
      </button>
      <button
        type="button"
        className={`mobile-bottom-nav-item ${active === "search" ? "mobile-bottom-nav-active" : ""}`}
        onClick={onSearch}
      >
        <Search className="size-5" />
        <span>Search</span>
      </button>
      <button
        type="button"
        className="mobile-bottom-nav-capture"
        onClick={onCapture}
        aria-label="Quick capture"
        data-tour="quick-capture-mobile"
      >
        <Zap className="size-5" />
      </button>
      <button
        type="button"
        className={`mobile-bottom-nav-item ${active === "due" ? "mobile-bottom-nav-active" : ""}`}
        onClick={onDue}
      >
        <CalendarClock className="size-5" />
        <span>Due</span>
      </button>
      <button
        type="button"
        className={`mobile-bottom-nav-item ${active === "menu" ? "mobile-bottom-nav-active" : ""}`}
        onClick={onMenu}
      >
        <Menu className="size-5" />
        <span>Menu</span>
      </button>
    </nav>
  );
}
