"use client";

import { useEffect, useState } from "react";

interface DonorStat {
  rank: number;
  name: string;
  count: number;
  verified: boolean;
}

const RANK_STYLE = [
  { bg: "#fcd34d", color: "#92400e", badge: "Top Giver",  cardCls: "bg-amber-50 border-amber-200" },
  { bg: "#d1d5db", color: "#374151", badge: "Silver",     cardCls: "bg-gray-50 border-gray-200"   },
  { bg: "#fb923c", color: "#fff",    badge: "Bronze",     cardCls: "bg-orange-50 border-orange-200" },
];

export default function DonorsLeaderboard() {
  const [donors, setDonors] = useState<DonorStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/donors")
      .then((r) => r.json())
      .then((d) => { setDonors(d.donors ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="w-full max-w-[420px] pb-24">

      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h2 className="text-sm font-extrabold text-gray-800">Top Donors</h2>
          <p className="text-[10px] text-gray-400 mt-0.5">Community members giving the most</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-500 text-lg shrink-0">
          <i className="fa-solid fa-trophy" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-gray-300">
          <i className="fa-solid fa-spinner animate-spin text-2xl" />
        </div>

      ) : donors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-300 flex items-center justify-center text-3xl mb-3">
            <i className="fa-solid fa-trophy" />
          </div>
          <h3 className="text-sm font-bold text-gray-700">No donors yet</h3>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-[220px]">
            Be the first to give an item and top the leaderboard!
          </p>
        </div>

      ) : (
        <div className="space-y-2">
          {donors.map((donor) => {
            const i = donor.rank - 1;
            const style = RANK_STYLE[i];
            const isTop3 = i < 3;

            return (
              <div
                key={donor.rank}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                  isTop3 ? style.cardCls : "bg-white border-gray-100"
                }`}
              >
                {/* Rank bubble */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0"
                  style={{
                    background: isTop3 ? style.bg : "#f3e2d8",
                    color:      isTop3 ? style.color : "#6b7280",
                  }}
                >
                  {donor.rank}
                </div>

                {/* Avatar initial */}
                <div className="w-9 h-9 rounded-xl bg-charity-500 flex items-center justify-center text-white font-extrabold text-sm shrink-0">
                  {donor.name.charAt(0).toUpperCase()}
                </div>

                {/* Name + gift count */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-gray-800 truncate">{donor.name}</p>
                    {donor.verified && (
                      <i className="fa-solid fa-circle-check text-charity-400 text-[10px] shrink-0" title="Verified account" />
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400">
                    {donor.count} {donor.count === 1 ? "gift" : "gifts"} given
                  </p>
                </div>

                {/* Top 3 badge */}
                {isTop3 && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                    style={{
                      background: i === 0 ? "#fef3c7" : i === 1 ? "#f3f4f6" : "#ffedd5",
                      color:      i === 0 ? "#92400e" : i === 1 ? "#4b5563" : "#c2410c",
                    }}
                  >
                    {style.badge}
                  </span>
                )}
              </div>
            );
          })}

          {/* Footer note */}
          <p className="text-center text-[10px] text-gray-300 pt-2">
            Top 10 · Updated in real time · Removed gifts not counted
          </p>
        </div>
      )}
    </div>
  );
}
