"use client";

import { useEffect, useState } from "react";
import { ClaimRecord } from "@/lib/types";

const STATUS_BADGE: Record<ClaimRecord["status"], { label: string; cls: string }> = {
  paid:      { label: "Paid",      cls: "bg-amber-100 text-amber-700"  },
  connected: { label: "Connected", cls: "bg-blue-100 text-blue-700"    },
  completed: { label: "Completed", cls: "bg-green-100 text-green-700"  },
  refunded:  { label: "Refunded",  cls: "bg-red-100 text-red-500"      },
};

const NEXT_STATUS: Record<ClaimRecord["status"], ClaimRecord["status"] | null> = {
  paid:      "connected",
  connected: "completed",
  completed: null,
  refunded:  null,
};

export default function AdminClaims() {
  const [claims, setClaims]   = useState<ClaimRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/claims?admin=1")
      .then((r) => r.json())
      .then((d) => { setClaims(d.claims ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function updateStatus(id: number, status: ClaimRecord["status"]) {
    setSaving(id);
    await fetch("/api/claims", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setClaims((prev) => prev.map((c) => c.id === id ? { ...c, status } : c));
    setSaving(null);
  }

  const revenue = claims.filter((c) => c.status !== "refunded").length * 500;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-gray-800">Claims</h1>
          <p className="text-xs text-gray-400">{claims.length} total · ₦{revenue.toLocaleString()} revenue</p>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 text-[11px] text-blue-700 space-y-1">
        <p className="font-bold">Claim lifecycle:</p>
        <p><span className="font-semibold">Paid</span> — Payment received. Gift locked. Contact donor and connect them.</p>
        <p><span className="font-semibold">Connected</span> — Donor and recipient introduced. Awaiting physical handoff.</p>
        <p><span className="font-semibold">Completed</span> — Item physically handed over. Done.</p>
        <p><span className="font-semibold">Refunded</span> — Handoff failed. Refund issued. Gift reset to Available.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-gray-300">
          <i className="fa-solid fa-spinner animate-spin text-2xl" />
        </div>
      ) : claims.length === 0 ? (
        <div className="text-center py-20 text-sm text-gray-400">No claims yet.</div>
      ) : (
        <div className="space-y-3">
          {claims.map((claim) => (
            <div key={claim.id} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-gray-800">{claim.giftTitle}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Ref: <span className="font-mono">{claim.paystackRef}</span>
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${STATUS_BADGE[claim.status].cls}`}>
                  {STATUS_BADGE[claim.status].label}
                </span>
              </div>

              {/* Claimer info */}
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-gray-50 rounded-xl p-3">
                <div><span className="text-gray-400">Name</span><br /><strong className="text-gray-700">{claim.claimerName}</strong></div>
                <div><span className="text-gray-400">Email</span><br /><strong className="text-gray-700 break-all">{claim.claimerEmail}</strong></div>
                <div><span className="text-gray-400">Phone</span><br /><strong className="text-gray-700">{claim.claimerPhone || "N/A"}</strong></div>
                <div><span className="text-gray-400">Delivery</span><br /><strong className="text-gray-700 capitalize">{claim.delivery}</strong></div>
              </div>

              <div className="text-[10px] text-gray-400">
                {new Date(claim.createdAt).toLocaleString("en-NG")}
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                {NEXT_STATUS[claim.status] && (
                  <button
                    disabled={saving === claim.id}
                    onClick={() => updateStatus(claim.id, NEXT_STATUS[claim.status]!)}
                    className="flex-1 py-2 bg-charity-500 text-white text-xs font-bold rounded-xl disabled:opacity-50">
                    {saving === claim.id
                      ? <i className="fa-solid fa-spinner animate-spin" />
                      : `Mark as ${STATUS_BADGE[NEXT_STATUS[claim.status]!].label}`}
                  </button>
                )}
                {claim.status !== "refunded" && claim.status !== "completed" && (
                  <button
                    disabled={saving === claim.id}
                    onClick={() => updateStatus(claim.id, "refunded")}
                    className="px-4 py-2 border border-red-200 text-red-400 text-xs font-bold rounded-xl hover:bg-red-50 disabled:opacity-50">
                    Refund
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
