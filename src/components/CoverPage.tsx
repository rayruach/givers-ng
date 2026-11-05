"use client";

import { useRef } from "react";
import { MOSAIC_IMAGES } from "@/lib/constants";

interface Props {
  onDismiss: () => void;
}

export default function CoverPage({ onDismiss }: Props) {
  const coverRef = useRef<HTMLDivElement>(null);

  function dismiss() {
    const el = coverRef.current;
    if (!el) return onDismiss();
    el.classList.add("cover-exit");
    el.style.transition = "opacity 0.55s ease, transform 0.55s cubic-bezier(0.4,0,0.2,1)";
    el.addEventListener("transitionend", () => onDismiss(), { once: true });
  }

  return (
    <div
      ref={coverRef}
      className="fixed inset-0 z-[9999] overflow-hidden flex flex-col items-center justify-center"
    >
      {/* Mosaic */}
      <div
        className="cover-mosaic absolute inset-0"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gridTemplateRows: "repeat(5, 1fr)",
          gap: "3px",
          transform: "scale(1.04)",
        }}
      >
        {MOSAIC_IMAGES.map((src, i) => (
          <div
            key={i}
            style={{
              backgroundImage: `url('${src}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ))}
      </div>

      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, rgba(15,5,10,0.72) 0%, rgba(180,15,60,0.55) 50%, rgba(15,5,10,0.80) 100%)",
        }}
      />

      {/* Content */}
      <div className="cover-content relative z-10 flex flex-col items-center text-center px-8 pb-12 max-w-sm w-full">
        {/* Icon badge */}
        <div
          className="mb-6 flex items-center justify-center rounded-[22px] text-white"
          style={{
            width: 72, height: 72,
            background: "#f02d6a",
            fontSize: "2rem",
            boxShadow: "0 8px 32px rgba(240,45,106,0.45)",
          }}
        >
          <i className="fa-solid fa-gift" />
        </div>

        {/* Brand */}
        <h1
          className="font-black leading-none mb-1"
          style={{ fontSize: "3rem", letterSpacing: "-0.04em", color: "#fff" }}
        >
          Givers<span style={{ color: "#f02d6a" }}>.ng</span>
        </h1>

        {/* Sub-brand */}
        <p
          className="mb-2 font-bold tracking-widest uppercase"
          style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.55)" }}
        >
          BallHard Charities
        </p>

        {/* Tagline */}
        <p
          className="mb-10 leading-relaxed"
          style={{ fontSize: "1rem", color: "rgba(255,255,255,0.80)", maxWidth: 260 }}
        >
          Swipe. Claim. Bless.<br />
          Give freely, receive gracefully.
        </p>

        {/* CTA */}
        <button
          onClick={dismiss}
          className="w-full flex items-center justify-center gap-2 font-extrabold text-white rounded-2xl transition-all active:scale-95"
          style={{
            padding: "1rem 2rem",
            background: "#f02d6a",
            fontSize: "0.95rem",
            letterSpacing: "0.02em",
            border: "none",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#d91758")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#f02d6a")}
        >
          Get Started <i className="fa-solid fa-arrow-right" style={{ fontSize: "0.85rem" }} />
        </button>

        <p
          className="mt-4 leading-relaxed"
          style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)" }}
        >
          By continuing you agree to our community rules.<br />
          Free to join · No account needed.
        </p>
      </div>
    </div>
  );
}
