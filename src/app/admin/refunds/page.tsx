"use client";

import { useEffect, useState } from "react";

interface RefundRequest {
  id: number;
  userId: number;
  claimId?: number;
  appId?: number;
  giftTitle: string;
  reason: string;
  paystackRef?: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "completed";
  adminNote?: string;
  createdAt: number;
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending:   { label: "Pending",   cls: "bg-amber-100 text-amber-700" },
  approved:  { label: "Approved",  cls: "bg-blue-100 text-blue-700"   },
  rejected:  { label: "Rejected",  cls: "bg-red-100 text-red-500"     },
  completed: { label: "Completed", cls: "bg-green-100 text-green-700" },
};

const NEXT_STATUS: Record<string, string[]> = {
  pending:  ["approved", "rejected"],
  approved: ["completed"],
  rejected: [],
  completed: [],
};

export default function AdminRefunds() {
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState<number | null>(null);
  const [noteMap, setNoteMap] = useState<Record<number, string>>({});

  useEffect(() => {
    fetch("/api/refunds?admin=1")
      .then((r) => r.json())
      .then((d) => { setRefunds(d.refunds ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function updateStatus(id: number, status: string) {
    setSaving(id);
    const res = await fetch("/api/refunds", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, adminNote: noteMap[id] }),
    });
    const data = await res.json();
    if (res.ok) {
      setRefunds((prev) => prev.map((r) => r.id === id ? { ...r, ...data.refund } : r));
    }
    setSaving(null);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-gray-800">Refund Requests</h1>
        <p className="text-xs text-gray-400">
          {refunds.length} total · {refunds.filter(r => r.status === "pending").length} pending
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-[11px] text-amber-800 space-y-1">
        <p className="font-bold flex items-center gap-1.5"><i className="fa-solid fa-circle-info" /> Refund Process</p>
        <p><span className="font-semibold">1. Approve</span> — Contact Paystack to initiate the ₦1,000 refund manually</p>
        <p><span className="font-semibold">2. Completed</span> — Mark once money has been returned to the receiver</p>
        <p><span className="font-semibold">3. Rejected</span> — If the request is fraudulent or invalid</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-gray-300">
          <i className="fa-solid fa-spinner animate-spin text-2xl" />
        </div>
      ) : refunds.length === 0 ? (
        <div className="text-center py-20 text-sm text-gray-400">No refund requests yet.</div>
      ) : (
        <div className="space-y-3">
          {refunds.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-gray-800">{r.giftTitle}</p>
                  <p className="text-[11px] text-gray-400">
                    ₦{r.amount.toLocaleString()} ·{" "}
                    Ref: <span className="font-mono">{r.paystackRef ?? "N/A"}</span>
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_BADGE[r.status].cls}`}>
                  {STATUS_BADGE[r.status].label}
                </span>
              </div>

              <div className="bg-warm-50 rounded-xl px-3 py-2">
                <p className="text-[11px] text-gray-500 leading-relaxed">{r.reason}</p>
              </div>

              {r.adminNote && (
                <div className="bg-blue-50 rounded-xl px-3 py-2 text-[11px] text-blue-600">
                  <strong>Admin note:</strong> {r.adminNote}
                </div>
              )}

              <div className="text-[10px] text-gray-400">
                {new Date(r.createdAt).toLocaleString("en-NG")}
              </div>

              {NEXT_STATUS[r.status].length > 0 && (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Add admin note (optional)"
                    value={noteMap[r.id] ?? ""}
                    onChange={(e) => setNoteMap((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-charity-400 bg-warm-50"
                  />
                  <div className="flex gap-2">
                    {NEXT_STATUS[r.status].map((nextStatus) => (
                      <button key={nextStatus}
                        disabled={saving === r.id}
                        onClick={() => updateStatus(r.id, nextStatus)}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl disabled:opacity-50 ${
                          nextStatus === "rejected"
                            ? "border border-red-200 text-red-400 hover:bg-red-50"
                            : "bg-charity-500 text-white"
                        }`}
                      >
                        {saving === r.id
                          ? <i className="fa-solid fa-spinner animate-spin" />
                          : `Mark ${STATUS_BADGE[nextStatus].label}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
