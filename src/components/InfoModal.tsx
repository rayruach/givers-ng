"use client";

import { useState, useEffect } from "react";
import { Gift } from "@/lib/types";

interface Props {
  gift: Gift | null;
  onClose: () => void;
  onClaim: (gift: Gift) => void;
}

export default function InfoModal({ gift, onClose, onClaim }: Props) {
  const [imgIndex, setImgIndex] = useState(0);

  // Reset gallery index whenever the gift changes
  const giftId = gift?.id;
  useEffect(() => { setImgIndex(0); }, [giftId]);

  if (!gift) return null;

  const images = gift.images?.length ? gift.images : [gift.image];

  function prev() { setImgIndex((i) => Math.max(0, i - 1)); }
  function next() { setImgIndex((i) => Math.min(images.length - 1, i + 1)); }

  function handleClaim() {
    onClose();
    onClaim(gift!);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 relative shadow-2xl border border-charity-100 max-h-[90vh] overflow-y-auto">

        {/* Close */}
        <button onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-warm-100 text-gray-500 hover:text-charity-500 z-10">
          <i className="fa-solid fa-xmark text-sm" />
        </button>

        <div className="space-y-4">
          {/* Gallery */}
          <div className="gallery-wrap">
            <div
              className="gallery-track"
              style={{ transform: `translateX(-${imgIndex * 100}%)` }}
            >
              {images.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={src}
                  alt={gift.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://placehold.co/600x400/f9f0eb/f02d6a?text=Givers";
                  }}
                />
              ))}
            </div>

            {/* Prev / Next */}
            <button
              className="gallery-prev"
              onClick={prev}
              disabled={imgIndex === 0}
              style={{ position: "absolute", top: "50%", left: 8, transform: "translateY(-50%)", width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.85)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 5 }}
            >
              <i className="fa-solid fa-chevron-left text-xs text-gray-700" />
            </button>
            <button
              className="gallery-next"
              onClick={next}
              disabled={imgIndex === images.length - 1}
              style={{ position: "absolute", top: "50%", right: 8, transform: "translateY(-50%)", width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.85)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 5 }}
            >
              <i className="fa-solid fa-chevron-right text-xs text-gray-700" />
            </button>
          </div>

          {/* Dots */}
          {images.length > 1 && (
            <div className="flex justify-center gap-1.5 pt-1">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setImgIndex(i)}
                  className={`gallery-dot ${i === imgIndex ? "active" : ""}`}
                />
              ))}
            </div>
          )}

          {/* Info */}
          <div>
            <span className="text-[10px] uppercase font-bold text-charity-500 tracking-wider">
              {gift.category}
            </span>
            <h3 className="text-lg font-bold text-gray-800 mt-1">{gift.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-charity-50 text-charity-600 border border-charity-200">
                {gift.condition}
              </span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <i className="fa-solid fa-location-dot text-charity-400" />
                {gift.area}, {gift.city}
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed">{gift.description}</p>

          {/* Donor */}
          <div className="p-3 rounded-xl bg-warm-100 border border-warm-200 flex items-center justify-between">
            <div className="text-xs">
              <div className="text-gray-400">Giver / Donor</div>
              <div className="font-bold text-gray-800 mt-0.5">{gift.donor}</div>
            </div>
            <span className="text-xs text-charity-500 font-semibold">Verified Giver ★</span>
          </div>

          {/* CTA */}
          <button
            onClick={handleClaim}
            className="w-full py-3 bg-charity-500 text-white font-bold text-xs rounded-xl"
          >
            <i className="fa-solid fa-heart mr-2" />Claim This Gift
          </button>
        </div>
      </div>
    </div>
  );
}
