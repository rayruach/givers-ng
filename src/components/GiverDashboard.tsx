"use client";

import { useEffect, useState } from "react";
import { Gift, Application } from "@/lib/types";
import EditGiftModal from "./EditGiftModal";

interface GiftWithApps extends Gift {
  applications: Application[];
  expanded: boolean;
}

interface Props {
  focusGiftId: number | null;
  onFocusClear?: () => void;
}

export default function GiverDashboard({ focusGiftId, onFocusClear }: Props) {
  const [items, setItems] = useState<GiftWithApps[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<number | null>(null);
  const [editGift, setEditGift] = useState<Gift | null>(null);
  const [deleteError, setDeleteError] = useState<{ id: number; msg: string } | null>(null);

  useEffect(() => {
    loadMyGifts();
  }, []);

  // Auto-expand the gift that was clicked from notification
  useEffect(() => {
    if (focusGiftId && items.length > 0) {
      setItems(prev => prev.map(g =>
        g.id === focusGiftId ? { ...g, expanded: true } : g
      ));
      // Scroll to the gift after a brief tick
      setTimeout(() => {
        const el = document.getElementById(`gift-card-${focusGiftId}`);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      if (onFocusClear) onFocusClear();
    }
  }, [focusGiftId, items.length]);

  async function loadMyGifts() {
    setLoading(true);
    try {
      const res = await fetch("/api/gifts?mine=1", { credentials: "include" });
      const data = await res.json();
      const myGifts: Gift[] = (data.gifts ?? []);

      // For each gift, load its applications
      const withApps = await Promise.all(
        myGifts.map(async (g) => {
          try {
            const appRes = await fetch(`/api/applications?giftId=${g.id}`, { credentials: "include" });
            const appData = await appRes.json();
            return { ...g, applications: appData.applications ?? [], expanded: false };
          } catch {
            return { ...g, applications: [], expanded: false };
          }
        })
      );

      setItems(withApps);
    } catch {
      setItems([]);
    }
    setLoading(false);
  }

  function toggleExpand(id: number) {
    setItems(prev => prev.map(g => g.id === id ? { ...g, expanded: !g.expanded } : g));
  }

  async function handleAction(appId: number, action: "select" | "reject") {
    setActing(appId);
    try {
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ appId, action }),
      });
      if (res.ok) await loadMyGifts();
    } catch {
      // silent
    }
    setActing(null);
  }

  async function handleDelete(giftId: number) {
    setDeleteError(null);
    if (!confirm("Delete this gift? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/gifts?id=${giftId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError({ id: giftId, msg: data.error ?? "Failed to delete" });
        return;
      }
      setItems(prev => prev.filter(g => g.id !== giftId));
    } catch {
      setDeleteError({ id: giftId, msg: "Network error. Please try again." });
    }
  }

  function handleEdited(updated: Gift) {
    setItems(prev => prev.map(g =>
      g.id === updated.id ? { ...g, ...updated } : g
    ));
  }

  const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
    available: { label: "Open",    cls: "bg-green-100 text-green-700" },
    pending:   { label: "Pending", cls: "bg-amber-100 text-amber-700" },
    claimed:   { label: "Claimed", cls: "bg-blue-100 text-blue-700"   },
    removed:   { label: "Removed", cls: "bg-red-100 text-red-500"     },
  };

  const APP_BADGE: Record<string, string> = {
    pending:  "bg-gray-100 text-gray-500",
    selected: "bg-charity-100 text-charity-600",
    rejected: "bg-red-50 text-red-400",
    paid:     "bg-green-100 text-green-600",
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-gray-400">
        <i className="fa-solid fa-spinner animate-spin text-2xl" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-charity-50 text-charity-300 flex items-center justify-center text-2xl mb-3">
          <i className="fa-solid fa-gift" />
        </div>
        <h3 className="text-sm font-bold text-gray-700">No gifts posted yet</h3>
        <p className="text-xs text-gray-600 mt-1 max-w-[220px] leading-relaxed">
          Post your first item using the + button and it will appear here with all its applications.
        </p>
      </div>
    );
  }

  return (
    <>
    <div className="w-full space-y-3">
      {items.map((gift) => (
        <div key={gift.id} id={`gift-card-${gift.id}`} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Gift header row */}
          <div className="flex items-center gap-3 p-4">
            <button
              onClick={() => toggleExpand(gift.id)}
              className="flex items-center gap-3 flex-1 text-left min-w-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={gift.image} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0 border border-gray-100"
                onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/48x48/f9f0eb/f02d6a?text=G"; }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-black truncate">{gift.title}</p>
                <p className="text-[11px] text-gray-700">{gift.area}, {gift.city} · {gift.timeAgo}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_BADGE[gift.status]?.cls}`}>
                  {STATUS_BADGE[gift.status]?.label}
                </span>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <i className="fa-solid fa-users text-[10px]" />
                  <span className="font-bold">{gift.applications.length}</span>
                </div>
                <i className={`fa-solid fa-chevron-${gift.expanded ? "up" : "down"} text-gray-300 text-xs`} />
              </div>
            </button>

            {/* Edit + Delete — only show for non-claimed gifts */}
            {gift.status !== "claimed" && gift.status !== "removed" && (
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => setEditGift(gift)}
                  title="Edit gift"
                  className="w-8 h-8 rounded-lg bg-warm-100 border border-warm-200 flex items-center justify-center text-gray-400 hover:text-charity-500 hover:border-charity-300 transition-colors"
                >
                  <i className="fa-solid fa-pen text-[11px]" />
                </button>
                {gift.status === "available" && (
                  <button
                    onClick={() => handleDelete(gift.id)}
                    title="Delete gift"
                    className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-300 hover:text-red-500 hover:border-red-300 transition-colors"
                  >
                    <i className="fa-solid fa-trash text-[11px]" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Delete error inline */}
          {deleteError?.id === gift.id && (
            <div className="mx-4 mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation shrink-0" />
              {deleteError.msg}
              <button onClick={() => setDeleteError(null)} className="ml-auto text-red-400 hover:text-red-600">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
          )}

          {/* Applications list */}
          {gift.expanded && (
            <div className="border-t border-gray-100">
              {gift.applications.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-gray-600">
                  <i className="fa-solid fa-inbox text-gray-300 text-xl block mb-2" />
                  No applications yet. Share your gift post to get more interest!
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {gift.applications.map((app) => (
                    <div key={app.id} className="px-4 py-3">
                      {/* Applicant info */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-charity-100 flex items-center justify-center text-charity-600 font-extrabold text-xs shrink-0">                            {app.applicantName?.charAt(0).toUpperCase() ?? "?"}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-black">{app.applicantName}</p>
                            <p className="text-[10px] text-gray-600">{app.applicantPhone || app.applicantEmail}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize shrink-0 ${APP_BADGE[app.status]}`}>
                          {app.status}
                        </span>
                      </div>

                      {/* Reason */}
                      <div className="bg-warm-50 rounded-xl px-3 py-2 mb-3">
                        <p className="text-[11px] text-gray-500 leading-relaxed italic">"{app.reason}"</p>
                      </div>

                      {/* Delivery preference */}
                      <p className="text-[10px] text-gray-600 mb-2">
                        <i className="fa-solid fa-truck mr-1" />
                        Prefers: {app.delivery === "pickup" ? "Self Pickup" : "Dispatch Rider"}
                      </p>

                      {/* Actions — only show for pending applications on available gifts */}
                      {app.status === "pending" && gift.status === "available" && (
                        <div className="flex gap-2">
                          <button
                            disabled={acting === app.id}
                            onClick={() => handleAction(app.id, "select")}
                            className="flex-1 py-2 bg-charity-500 text-white text-[11px] font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-1.5"
                          >
                            {acting === app.id
                              ? <i className="fa-solid fa-spinner animate-spin" />
                              : <><i className="fa-solid fa-check text-[9px]" /> Select This Person</>}
                          </button>
                          <button
                            disabled={acting === app.id}
                            onClick={() => handleAction(app.id, "reject")}
                            className="px-3 py-2 border border-gray-200 text-gray-400 text-[11px] font-bold rounded-xl hover:bg-red-50 hover:text-red-400 hover:border-red-200 disabled:opacity-50"
                          >
                            Pass
                          </button>
                        </div>
                      )}

                      {app.status === "selected" && (
                        <div className="flex items-center gap-2 text-[11px] text-charity-500 font-bold bg-charity-50 rounded-xl px-3 py-2">
                          <i className="fa-solid fa-star" /> Selected — waiting for payment
                        </div>
                      )}

                      {app.status === "paid" && (
                        <div className="flex items-center gap-2 text-[11px] text-green-600 font-bold bg-green-50 rounded-xl px-3 py-2">
                          <i className="fa-solid fa-circle-check" /> Paid — arrange handoff with {app.applicantName}
                          {app.applicantPhone && <span className="ml-1 text-gray-500">({app.applicantPhone})</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>

    {/* Edit modal */}
    {editGift && (
      <EditGiftModal
        gift={editGift}
        onClose={() => setEditGift(null)}
        onSaved={(updated) => { handleEdited(updated); setEditGift(null); }}
      />
    )}
    </>
  );
}
