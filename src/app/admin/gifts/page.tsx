"use client";

import { useEffect, useState } from "react";
import { Gift, GiftStatus } from "@/lib/types";

const STATUS_BADGE: Record<GiftStatus, { label: string; cls: string }> = {
  available: { label: "Available", cls: "bg-green-100 text-green-700" },
  pending:   { label: "Pending",   cls: "bg-amber-100 text-amber-700" },
  claimed:   { label: "Claimed",   cls: "bg-blue-100 text-blue-700"   },
  removed:   { label: "Removed",   cls: "bg-red-100 text-red-500"     },
};

const STATUS_OPTIONS: GiftStatus[] = ["available", "pending", "claimed", "removed"];

export default function AdminGifts() {
  const [gifts, setGifts]     = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<GiftStatus | "all">("all");
  const [saving, setSaving]   = useState<number | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/gifts?admin=1")
      .then((r) => r.json())
      .then((d) => { setGifts(d.gifts ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function setStatus(id: number, status: GiftStatus) {
    setSaving(id);
    await fetch("/api/gifts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setGifts((prev) => prev.map((g) => g.id === id ? { ...g, status } : g));
    setSaving(null);
  }

  async function deleteGift(id: number) {
    if (!confirm("Remove this gift permanently?")) return;
    await fetch(`/api/gifts?id=${id}`, { method: "DELETE" });
    setGifts((prev) => prev.filter((g) => g.id !== id));
  }

  const filtered = filter === "all" ? gifts : gifts.filter((g) => g.status === filter);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-gray-800">Gift Listings</h1>
          <p className="text-xs text-gray-400">{gifts.length} total gifts</p>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as GiftStatus | "all")}
          className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-charity-400">
          <option value="all">All Statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_BADGE[s].label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-gray-300">
          <i className="fa-solid fa-spinner animate-spin text-2xl" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-sm text-gray-400">No gifts found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((gift) => (
            <div key={gift.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 items-start">
              {/* Thumbnail */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={gift.image} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0 border border-gray-100"
                onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/64x64/f9f0eb/f02d6a?text=G"; }} />

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="text-sm font-bold text-gray-800 truncate">{gift.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {gift.category} · {gift.condition} · {gift.area}, {gift.city}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Donor: <strong>{gift.donor}</strong></p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${STATUS_BADGE[gift.status].cls}`}>
                    {STATUS_BADGE[gift.status].label}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {STATUS_OPTIONS.filter((s) => s !== gift.status).map((s) => (
                    <button key={s} disabled={saving === gift.id}
                      onClick={() => setStatus(gift.id, s)}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:border-charity-400 hover:text-charity-500 transition-colors disabled:opacity-50">
                      {saving === gift.id ? <i className="fa-solid fa-spinner animate-spin" /> : `Set ${STATUS_BADGE[s].label}`}
                    </button>
                  ))}
                  <button onClick={() => deleteGift(gift.id)}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-100 text-red-400 hover:bg-red-50 transition-colors ml-auto">
                    <i className="fa-solid fa-trash mr-1" />Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
