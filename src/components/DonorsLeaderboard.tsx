"use client";

import { useEffect, useState } from "react";

interface DonorStat {
  donor: string;
  count: number;
}

export default function DonorsLeaderboard() {
  const [donors, setDonors] = useState<DonorStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all gifts and aggregate by donor
    fetch("/api/gifts?admin=1")
      .then((r) => r.json())
      .then((d) => {
        const allGifts = d.gifts ?? [];
        const map = new Map<string, number>();
        for (const g of allGifts) {
          map.set(g.donor, (map.get(g.donor) ?? 0) + 1);
        }
        const sorted = Array.from(map.entries())
          .map(([donor, count]) => ({ donor, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 20);
        setDonors(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="w-full max-w-[420px] pb-24">
      <div className="flex items-center justify-between mb-3 px-1">
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
          {donors.map((donor, i) => (
            <div
              key={donor.donor + i}
              className={`flex items-center gap-3 p-3 rounded-2xl border ${
                i < 3 ? "bg-amber-50 border-amber-200" : "bg-white border-gray-100"
              }`}
            >
              {/* Rank */}
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0"
                style={{
                  background: i === 0 ? "#fcd34d" : i === 1 ? "#d1d5db" : i === 2 ? "#fbbf24" : "#f3e2d8",
                  color: i < 3 ? "#fff" : "#6b7280",
                }}
              >
                {i < 3 ? medals[i] : i + 1}
              </div>

              {/* Avatar initial */}
              <div className="w-9 h-9 rounded-xl bg-charity-500 flex items-center justify-center text-white font-extrabold text-sm shrink-0">
                {donor.donor.charAt(0).toUpperCase()}
              </div>

              {/* Name + count */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-800 truncate">{donor.donor}</p>
                <p className="text-[10px] text-gray-400">
                  {donor.count} {donor.count === 1 ? "gift" : "gifts"} given
                </p>
              </div>

              {/* Badge */}
              {i < 3 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    background: i === 0 ? "#fef3c7" : i === 1 ? "#f3f4f6" : "#fef3c7",
                    color: i === 0 ? "#92400e" : i === 1 ? "#4b5563" : "#92400e",
                  }}
                >
                  {i === 0 ? "Top Giver" : i === 1 ? "Silver" : "Bronze"}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
