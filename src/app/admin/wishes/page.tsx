"use client";

import { useEffect, useState } from "react";
import { Wish } from "@/lib/types";

const URGENCY_BADGE: Record<string, string> = {
  high:   "bg-red-100 text-red-600",
  medium: "bg-amber-100 text-amber-700",
  low:    "bg-green-100 text-green-600",
};
const URGENCY_LABEL: Record<string, string> = {
  high: "Urgent", medium: "Moderate", low: "When Possible",
};

export default function AdminWishes() {
  const [wishes, setWishes]   = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/wishes")
      .then((r) => r.json())
      .then((d) => { setWishes(d.wishes ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function toggleGranted(id: number, granted: boolean) {
    setSaving(id);
    await fetch("/api/wishes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, granted }),
    });
    setWishes((prev) => prev.map((w) => w.id === id ? { ...w, granted } : w));
    setSaving(null);
  }

  async function deleteWish(id: number) {
    if (!confirm("Remove this wish permanently?")) return;
    await fetch(`/api/wishes?id=${id}`, { method: "DELETE" });
    setWishes((prev) => prev.filter((w) => w.id !== id));
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-gray-800">Community Wishes</h1>
        <p className="text-xs text-gray-400">{wishes.length} total · {wishes.filter((w) => w.granted).length} granted</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-gray-300">
          <i className="fa-solid fa-spinner animate-spin text-2xl" />
        </div>
      ) : wishes.length === 0 ? (
        <div className="text-center py-20 text-sm text-gray-400">No wishes yet.</div>
      ) : (
        <div className="space-y-3">
          {wishes.map((wish) => (
            <div key={wish.id} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 font-extrabold text-sm shrink-0">
                    {wish.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{wish.name}</p>
                    <p className="text-xs text-gray-400">{wish.city} · {wish.timeAgo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${URGENCY_BADGE[wish.urgency]}`}>
                    {URGENCY_LABEL[wish.urgency]}
                  </span>
                  {wish.granted && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-600">
                      Granted
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-700">{wish.item}
                  <span className="text-gray-400 font-normal ml-1">({wish.category})</span>
                </p>
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{wish.story}</p>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  disabled={saving === wish.id}
                  onClick={() => toggleGranted(wish.id, !wish.granted)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl disabled:opacity-50 transition-colors
                    ${wish.granted
                      ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      : "bg-violet-600 text-white hover:bg-violet-700"}`}>
                  {saving === wish.id
                    ? <i className="fa-solid fa-spinner animate-spin" />
                    : wish.granted ? "Mark as Not Granted" : "Mark as Granted"}
                </button>
                <button onClick={() => deleteWish(wish.id)}
                  className="px-4 py-2 border border-red-100 text-red-400 text-xs font-bold rounded-xl hover:bg-red-50">
                  <i className="fa-solid fa-trash mr-1" />Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
