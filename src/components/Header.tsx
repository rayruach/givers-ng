"use client";

import { useState, useRef, useCallback } from "react";
import { CATEGORIES, NG_STATES } from "@/lib/constants";
import { Gift } from "@/lib/types";

interface Props {
  activeCategory: string;
  onCategory: (cat: string) => void;
  activeState: string;
  onState: (s: string) => void;
  onClaim: (gift: Gift) => void;
  onInfo: (gift: Gift) => void;
  notificationBell?: React.ReactNode;
}

export default function Header({ activeCategory, onCategory, activeState, onState, onClaim, onInfo, notificationBell }: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Gift[]>([]);
  const [searching, setSearching] = useState(false);
  const trackRef  = useRef<HTMLDivElement>(null);
  const dragState = useRef({ isDown: false, startX: 0, scrollLeft: 0, moved: false });
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── drag-to-scroll ── */
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const s = dragState.current;
    s.isDown = true; s.moved = false;
    s.startX = e.pageX;
    s.scrollLeft = trackRef.current?.scrollLeft ?? 0;
    if (trackRef.current) trackRef.current.style.cursor = "grabbing";
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const s = dragState.current;
    if (!s.isDown || !trackRef.current) return;
    const dx = e.pageX - s.startX;
    if (Math.abs(dx) > 4) s.moved = true;
    trackRef.current.scrollLeft = s.scrollLeft - dx;
  }, []);

  const onMouseUp = useCallback(() => {
    dragState.current.isDown = false;
    if (trackRef.current) trackRef.current.style.cursor = "grab";
  }, []);

  /* prevent click from firing on pills when we dragged */
  const onPillClick = useCallback((cat: string) => {
    if (dragState.current.moved) return;
    onCategory(cat);
  }, [onCategory]);

  /* mouse-wheel horizontal scroll on desktop */
  const onWheel = useCallback((e: React.WheelEvent) => {
    if (!trackRef.current) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      trackRef.current.scrollLeft += e.deltaY;
    }
  }, []);

  /* arrow buttons */
  function scrollCats(amount: number) {
    trackRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  }

  /* ── live search ── */
  function handleSearch(value: string) {
    setQuery(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (!value.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/gifts`);
        const data = await res.json();
        const all: Gift[] = data.gifts ?? [];
        const q = value.toLowerCase().trim();
        const filtered = all.filter(
          (g) =>
            g.title.toLowerCase().includes(q) ||
            g.category.toLowerCase().includes(q) ||
            g.city.toLowerCase().includes(q) ||
            g.area.toLowerCase().includes(q) ||
            g.donor.toLowerCase().includes(q) ||
            g.description.toLowerCase().includes(q)
        );
        setResults(filtered);
      } catch {
        setResults([]);
      }
      setSearching(false);
    }, 250);
  }

  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
    setResults([]);
  }

  return (
    <>
      <header className="sticky top-0 z-40 glass-nav">
        <div className="max-w-md mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-3 min-w-0">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0 select-none">
            <div
              className="flex items-center justify-center text-white"
              style={{ width: 30, height: 30, background: "#f02d6a", borderRadius: 9, flexShrink: 0 }}
            >
              <i className="fa-solid fa-gift" style={{ fontSize: "0.85rem" }} />
            </div>
            <span
              className="font-extrabold tracking-tight text-xl sm:text-2xl"
              style={{ color: "#f02d6a", letterSpacing: "-0.03em", lineHeight: 1 }}
            >
              Givers<span style={{ color: "#d91758" }}>.ng</span>
            </span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={activeState}
              onChange={(e) => onState(e.target.value)}
              className="bg-warm-100 text-xs font-semibold text-gray-600 border border-charity-100 rounded-xl px-2 py-1.5 focus:outline-none focus:border-charity-400 max-w-[108px] sm:max-w-none"
            >
              <option value="all">All Nigeria</option>
              {NG_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {notificationBell}

            <button onClick={() => setSearchOpen(true)} className="nav-icon-btn" title="Search">
              <i className="fa-solid fa-magnifying-glass" />
            </button>
          </div>
        </div>

        {/* Category pills row */}
        <div className="max-w-md mx-auto border-t border-charity-50 relative">

          {/* Left arrow (desktop only) */}
          <button
            onClick={() => scrollCats(-120)}
            className="hidden sm:flex absolute left-0 top-0 bottom-0 z-10 items-center justify-center w-7 bg-white pl-1 text-gray-400 hover:text-charity-500 transition-colors"
          >
            <i className="fa-solid fa-chevron-left text-xs" />
          </button>

          {/* Scrollable track */}
          <div
            ref={trackRef}
            className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs py-2.5 px-4 sm:px-8 select-none"
            style={{ cursor: "grab" }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onWheel={onWheel}
          >
            {["All", ...CATEGORIES].map((cat) => (
              <button
                key={cat}
                onClick={() => onPillClick(cat)}
                className={`px-3 py-1 rounded-full font-semibold whitespace-nowrap transition-colors ${
                  activeCategory === cat ? "cat-pill-active" : "cat-pill-inactive"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Right arrow (desktop only) */}
          <button
            onClick={() => scrollCats(120)}
            className="hidden sm:flex absolute right-0 top-0 bottom-0 z-10 items-center justify-center w-7 bg-white pr-1 text-gray-400 hover:text-charity-500 transition-colors"
          >
            <i className="fa-solid fa-chevron-right text-xs" />
          </button>

        </div>
      </header>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white/95 backdrop-blur-md p-4">
          <div className="max-w-md mx-auto w-full pt-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 flex items-center gap-2 bg-warm-100 border border-charity-200 rounded-2xl px-4 py-3">
                <i className="fa-solid fa-magnifying-glass text-charity-400 text-sm" />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search gifts, items, donors…"
                  className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
                />
                {query && (
                  <button onClick={() => handleSearch("")} className="text-gray-400 hover:text-charity-500">
                    <i className="fa-solid fa-xmark text-xs" />
                  </button>
                )}
              </div>
              <button onClick={closeSearch} className="text-sm font-semibold text-charity-500 shrink-0">
                Cancel
              </button>
            </div>

            {/* Search results */}
            {query.trim() ? (
              searching ? (
                <div className="flex justify-center py-12 text-gray-300">
                  <i className="fa-solid fa-spinner animate-spin text-xl" />
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-2 overflow-y-auto max-h-[70vh]">
                  {results.map((gift) => (
                    <div
                      key={gift.id}
                      className="flex items-center gap-3 p-2.5 bg-white border border-gray-100 rounded-2xl hover:border-charity-200 transition-colors cursor-pointer"
                      onClick={() => { closeSearch(); onInfo(gift); }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={gift.image} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0 border border-gray-100"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/48x48/f9f0eb/f02d6a?text=G"; }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-800 truncate">{gift.title}</p>
                        <p className="text-[11px] text-gray-400 truncate">
                          {gift.category} · {gift.area}, {gift.city}
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); closeSearch(); onClaim(gift); }}
                        className="px-3 py-1.5 bg-charity-500 text-white text-[10px] font-bold rounded-xl shrink-0"
                      >
                        Claim
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-full bg-charity-50 flex items-center justify-center text-charity-300 text-2xl mb-3">
                    <i className="fa-solid fa-magnifying-glass" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500">No results found</p>
                  <p className="text-xs text-gray-400 mt-1">Try a different keyword</p>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-charity-50 flex items-center justify-center text-charity-300 text-2xl mb-3">
                  <i className="fa-solid fa-heart-pulse" />
                </div>
                <p className="text-sm font-semibold text-gray-500">Find a gift near you</p>
                <p className="text-xs text-gray-400 mt-1">Search by item name, category or location</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
