"use client";

import { ThankNote } from "@/lib/types";
import { getRemainingClaims } from "@/lib/claims";

interface Props {
  claimCount: number;
  thankNotes: ThankNote[];
}

export default function ProfileTab({ claimCount, thankNotes }: Props) {
  const avgRating =
    thankNotes.length > 0
      ? (thankNotes.reduce((s, n) => s + n.rating, 0) / thankNotes.length).toFixed(1)
      : "N/A";

  const remaining = getRemainingClaims();

  return (
    <div className="w-full max-w-[420px] pb-6">
      {/* Avatar + name */}
      <div className="flex flex-col items-center pt-2 pb-5 border-b border-warm-200 mb-5">
        <div className="w-20 h-20 rounded-full bg-charity-500 flex items-center justify-center text-white text-3xl shadow-lg mb-3">
          <i className="fa-solid fa-user" />
        </div>
        <h2 className="font-extrabold text-gray-800 text-lg">My Givers Profile</h2>
        <p className="text-xs text-gray-400 mt-0.5">Making a difference, one gift at a time 🇳🇬</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="flex flex-col items-center p-3 rounded-2xl bg-charity-50 border border-charity-100">
          <i className="fa-solid fa-gift text-charity-500 text-lg mb-1" />
          <span className="font-extrabold text-charity-500 text-xl leading-none">{claimCount}</span>
          <span className="text-[10px] text-gray-400 mt-1 font-medium text-center">Claimed</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-2xl bg-warm-100 border border-warm-200">
          <i className="fa-solid fa-heart text-charity-400 text-lg mb-1" />
          <span className="font-extrabold text-gray-700 text-xl leading-none">{thankNotes.length}</span>
          <span className="text-[10px] text-gray-400 mt-1 font-medium text-center">Thank-yous</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-2xl bg-warm-100 border border-warm-200">
          <i className="fa-solid fa-star text-amber-400 text-lg mb-1" />
          <span className="font-extrabold text-gray-700 text-xl leading-none">{avgRating}</span>
          <span className="text-[10px] text-gray-400 mt-1 font-medium text-center">Avg Rating</span>
        </div>
      </div>

      {/* Daily claim status */}
      <div className="mb-5 p-3 rounded-2xl bg-warm-100 border border-warm-200 flex items-center justify-between">
        <div className="text-xs">
          <div className="font-bold text-gray-700 flex items-center gap-1.5">
            <i className="fa-solid fa-clock text-charity-400" /> Daily Claims
          </div>
          <div className="text-gray-400 mt-0.5">Resets every 24 hours</div>
        </div>
        <div className="text-right">
          <span className={`text-lg font-black ${remaining > 0 ? "text-charity-500" : "text-gray-400"}`}>
            {remaining}
          </span>
          <span className="text-xs text-gray-400 ml-1">/ 2 left</span>
        </div>
      </div>

      {/* Thank-you notes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-extrabold text-gray-800 flex items-center gap-1.5">
            <i className="fa-solid fa-heart text-charity-400" /> Thank-you Notes
          </h3>
          <span className="text-xs font-bold text-charity-500 bg-charity-50 border border-charity-100 px-2 py-0.5 rounded-full">
            {thankNotes.length}
          </span>
        </div>

        {thankNotes.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400 bg-warm-50 rounded-2xl border border-warm-200">
            <i className="fa-solid fa-heart text-charity-200 text-2xl mb-2 block" />
            No thank-you notes yet.<br />Claim a gift and leave one!
          </div>
        ) : (
          <div className="space-y-2">
            {thankNotes.map((note) => (
              <div
                key={note.id}
                className="p-3 rounded-2xl bg-warm-50 border border-warm-200"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-charity-500 flex items-center justify-center text-white text-[9px] font-black shrink-0">
                      {note.donor.charAt(0)}
                    </div>
                    <span className="text-[11px] font-bold text-gray-700 truncate">{note.donor}</span>
                  </div>
                  <span className="text-[9px] text-gray-400 shrink-0">{note.time}</span>
                </div>
                {note.rating > 0 && (
                  <div className="flex gap-0.5 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <i
                        key={i}
                        className={`fa-solid fa-star text-[10px] ${i < note.rating ? "text-amber-400" : "text-gray-200"}`}
                      />
                    ))}
                  </div>
                )}
                {note.msg && (
                  <p className="text-[10px] text-gray-500 leading-relaxed italic">"{note.msg}"</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
