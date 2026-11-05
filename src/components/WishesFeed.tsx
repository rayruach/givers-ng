"use client";

import { Wish } from "@/lib/types";

interface Props {
  wishes: Wish[];
  onMakeWish: () => void;
  onGrant: (wish: Wish) => void;
}

const URGENCY_CLASS: Record<string, string> = {
  high:   "urgency-high",
  medium: "urgency-medium",
  low:    "urgency-low",
};
const URGENCY_LABEL: Record<string, string> = {
  high:   "Urgent",
  medium: "Moderate",
  low:    "Not Urgent",
};

export default function WishesFeed({ wishes, onMakeWish, onGrant }: Props) {
  return (
    <div className="w-full max-w-[420px] pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h2 className="text-sm font-extrabold text-gray-800">Community Wishes</h2>
          <p className="text-[10px] text-gray-400 mt-0.5">Grant a wish, bless someone today</p>
        </div>
        <button
          onClick={onMakeWish}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-charity-500 text-white text-xs font-bold rounded-xl active:scale-95 transition-all"
        >
          <i className="fa-solid fa-wand-magic-sparkles text-[10px]" /> Make a Wish
        </button>
      </div>

      {wishes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-charity-50 text-charity-300 flex items-center justify-center text-3xl mb-3">
            <i className="fa-solid fa-wand-magic-sparkles" />
          </div>
          <h3 className="text-sm font-bold text-gray-700">No wishes yet</h3>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-[220px]">
            Be the first to make a wish. Someone may grant it.
          </p>
          <button
            onClick={onMakeWish}
            className="mt-4 px-5 py-2.5 bg-charity-500 text-white font-bold text-xs rounded-xl"
          >
            <i className="fa-solid fa-plus mr-1.5" />Make a Wish
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {wishes.map((w) => (
            <div key={w.id} className="wish-card">
              <div className="p-4">
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-violet-500 flex items-center justify-center text-white font-extrabold text-sm shrink-0">
                    {w.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-gray-800 truncate">{w.name}</div>
                    <div className="text-[10px] text-gray-400 flex items-center gap-1">
                      <i className="fa-solid fa-location-dot text-violet-400 text-[9px]" />
                      {w.city} · {w.timeAgo}
                    </div>
                  </div>
                  <span
                    className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold border ${URGENCY_CLASS[w.urgency]}`}
                  >
                    {URGENCY_LABEL[w.urgency]}
                  </span>
                </div>

                <h3 className="text-xs font-extrabold text-gray-800 mb-1">{w.item}</h3>
                <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">{w.story}</p>

                <div className="mt-3">
                  {w.granted ? (
                    <div className="flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                      <i className="fa-solid fa-circle-check" /> Wish Granted!
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onGrant(w)}
                        className="flex-1 py-2 bg-violet-600 text-white font-bold text-xs rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5"
                      >
                        <i className="fa-solid fa-heart text-[10px]" /> Grant this Wish
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
