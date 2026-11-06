"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Gift } from "@/lib/types";

interface Props {
  gifts: Gift[];
  onClaim: (gift: Gift) => void;
  onReload: () => void;
  onInfo: (gift: Gift) => void;
  onGive: () => void;
}

export default function SwipeStack({ gifts, onClaim, onReload, onInfo, onGive }: Props) {
  const [stack, setStack] = useState<Gift[]>([...gifts].reverse());

  // Sync local stack when parent gifts array changes (new gift published, reload, etc.)
  useEffect(() => {
    setStack([...gifts].reverse());
  }, [gifts]);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const startX  = useRef(0);
  const currentX = useRef(0);
  const dragging  = useRef(false);

  const top = stack[stack.length - 1];

  const removeTop = useCallback(() => {
    setStack((s) => s.slice(0, -1));
  }, []);

  /* ── touch / mouse handlers ── */
  function onPointerDown(e: React.PointerEvent) {
    dragging.current = true;
    startX.current   = e.clientX;
    cardRef.current?.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current || !cardRef.current) return;
    const dx = e.clientX - startX.current;
    currentX.current = dx;
    const rotate = dx / 12;
    cardRef.current.style.transform = `translateX(${dx}px) rotate(${rotate}deg)`;
    // stamps
    const claim = cardRef.current.querySelector<HTMLElement>(".stamp-claim");
    const pass  = cardRef.current.querySelector<HTMLElement>(".stamp-pass");
    if (claim) claim.style.opacity = String(Math.min(Math.max(dx / 80, 0), 1));
    if (pass)  pass.style.opacity  = String(Math.min(Math.max(-dx / 80, 0), 1));
  }

  function onPointerUp() {
    if (!dragging.current || !cardRef.current) return;
    dragging.current = false;
    const dx = currentX.current;
    if (dx > 100 && top) {
      flyOut("right");
    } else if (dx < -100) {
      flyOut("left");
    } else {
      cardRef.current.style.transform = "";
      cardRef.current.style.transition = "transform 0.3s cubic-bezier(0.175,0.885,0.32,1.275)";
      setTimeout(() => { if (cardRef.current) cardRef.current.style.transition = ""; }, 300);
    }
  }

  function flyOut(dir: "left" | "right") {
    if (!cardRef.current) return;
    const x = dir === "right" ? window.innerWidth + 200 : -(window.innerWidth + 200);
    cardRef.current.style.transition = "transform 0.4s ease";
    cardRef.current.style.transform  = `translateX(${x}px) rotate(${dir === "right" ? 30 : -30}deg)`;
    setTimeout(() => {
      if (dir === "right" && top) onClaim(top);
      removeTop();
    }, 380);
  }

  function triggerRight() { flyOut("right"); }
  function triggerLeft()  { flyOut("left"); }

  if (stack.length === 0) {
    return (
      <div
        className="glass-card w-full max-w-[380px] rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-4"
        style={{ height: "clamp(340px, calc(100vh - 310px), 500px)" }}
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-charity-50 text-charity-400 flex items-center justify-center text-2xl sm:text-3xl mb-2">
          <i className="fa-solid fa-gift animate-bounce" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-800">No items left to swipe!</h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          You've reached the end. Check back soon or list an item to bless others.
        </p>
        <div className="flex flex-col gap-2 w-full pt-4">
          <button
            onClick={onReload}
            className="w-full py-3 bg-charity-500 text-white font-bold text-xs rounded-xl"
          >
            <i className="fa-solid fa-rotate-right mr-2" />Reload All Gifts
          </button>
          <button
            onClick={onGive}
            className="w-full py-3 bg-warm-100 text-gray-600 border border-charity-100 font-semibold text-xs rounded-xl"
          >
            <i className="fa-solid fa-plus mr-2 text-charity-400" />Give an Item Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Card stack — max-w-[380px] matches original exactly */}
      <div className="card-stack">
        {stack.map((gift, i) => {
          const isTop     = i === stack.length - 1;
          const offset    = stack.length - 1 - i;
          const scale     = 1 - offset * 0.04;
          const translateY = offset * 8;

          return (
            <div
              key={gift.id}
              ref={isTop ? cardRef : null}
              className="swipe-card glass-card overflow-hidden flex flex-col"
              style={{
                transform: `scale(${scale}) translateY(${translateY}px)`,
                zIndex: i + 10,
                transition: isTop ? undefined : "transform 0.3s ease",
              }}
              onPointerDown={isTop ? onPointerDown : undefined}
              onPointerMove={isTop ? onPointerMove : undefined}
              onPointerUp={isTop ? onPointerUp : undefined}
            >
              {/* Stamps */}
              {isTop && (
                <>
                  <div className="stamp-overlay stamp-claim">CLAIM</div>
                  <div className="stamp-overlay stamp-pass">PASS</div>
                </>
              )}

              {/* Image area */}
              <div className="card-img-area relative w-full overflow-hidden bg-warm-200 pointer-events-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={gift.image}
                  alt={gift.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://placehold.co/600x400/f9f0eb/f02d6a?text=Givers";
                  }}
                />
                {/* Location pill bottom-left */}
                <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-6"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.45), transparent)" }}>
                  <div className="flex items-center justify-between text-white text-[11px]">
                    <span className="flex items-center gap-1 truncate">
                      <i className="fa-solid fa-location-dot text-charity-300 text-xs shrink-0" />
                      <span className="truncate">{gift.area}, {gift.city}</span>
                    </span>
                    <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg border border-gray-100 text-gray-400 shrink-0 ml-2">
                      {gift.timeAgo}
                    </span>
                  </div>
                </div>
                {/* Category + condition badges top */}
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-1 bg-white/90 rounded-full text-[10px] font-bold text-charity-600 border border-charity-100">
                    {gift.category}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-1 bg-white/90 rounded-full text-[10px] font-bold text-gray-600">
                    {gift.condition}
                  </span>
                </div>
              </div>

              {/* Info section — matches original p-4 sm:p-5 flex-1 layout */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between pointer-events-none overflow-hidden">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-charity-500 mb-1">
                    {gift.category}
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-gray-800 leading-snug line-clamp-1">
                    {gift.title}
                  </h3>
                  <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                    {gift.description}
                  </p>
                </div>
                <div className="pt-2 sm:pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium truncate mr-2">
                    Giver: <strong className="text-gray-700">{gift.donor}</strong>
                  </span>
                  <span className="text-charity-500 font-semibold shrink-0">Verified ★</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-4 sm:gap-5 mt-4 sm:mt-6 z-30">
        <button
          onClick={triggerLeft}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white border border-red-200 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center text-lg sm:text-xl shadow-md active:scale-95 transition-all"
        >
          <i className="fa-solid fa-xmark" />
        </button>

        <button
          onClick={() => top && onInfo(top)}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white border border-blue-200 text-blue-400 hover:bg-blue-500 hover:text-white flex items-center justify-center text-base sm:text-lg shadow-md active:scale-95 transition-all"
        >
          <i className="fa-solid fa-info" />
        </button>

        <button
          onClick={onReload}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-charity-500 hover:border-charity-300 flex items-center justify-center text-xs sm:text-sm shadow-md active:scale-95 transition-all"
        >
          <i className="fa-solid fa-rotate-right" />
        </button>

        <button
          onClick={triggerRight}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-charity-500 text-white hover:scale-105 flex items-center justify-center text-xl sm:text-2xl shadow-lg active:scale-95 transition-all"
        >
          <i className="fa-solid fa-heart" />
        </button>
      </div>
    </>
  );
}
