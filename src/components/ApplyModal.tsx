"use client";

import { useState } from "react";
import { Gift } from "@/lib/types";

interface Props {
  gift: Gift | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ApplyModal({ gift, onClose, onSuccess }: Props) {
  const [reason, setReason]     = useState("");
  const [delivery, setDelivery] = useState<"pickup" | "dispatch">("pickup");
  const [agreed, setAgreed]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [done, setDone]         = useState(false);

  if (!gift) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          giftId: gift!.id,
          reason: reason.trim(),
          delivery,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to submit application");
        setLoading(false);
        return;
      }

      setDone(true);
      onSuccess();
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl relative shadow-2xl border border-charity-100 overflow-hidden">

        <button onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-warm-100 text-gray-500 hover:text-charity-500 z-10">
          <i className="fa-solid fa-xmark text-sm" />
        </button>

        {/* Gift header */}
        <div className="flex items-center gap-3 p-5 pb-4 border-b border-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={gift.image} alt="" className="w-14 h-14 object-cover rounded-xl border border-gray-100 shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/56x56/f9f0eb/f02d6a?text=G"; }} />
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-charity-500 tracking-wider">Express Interest</span>
            <h3 className="text-sm font-bold text-gray-800 leading-tight truncate">{gift.title}</h3>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <i className="fa-solid fa-location-dot text-charity-400 text-[10px]" />
              {gift.area}, {gift.city}
            </p>
          </div>
        </div>

        {!done ? (
          <div className="px-5 pb-5 pt-4 max-h-[65vh] overflow-y-auto">

            {/* How it works */}
            <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-100 text-[11px] text-blue-700 space-y-1">
              <p className="font-bold flex items-center gap-1.5"><i className="fa-solid fa-circle-info" /> How this works</p>
              <p>1. Submit your reason. It is free</p>
              <p>2. The Giver reviews all applicants and picks the most compelling story</p>
              <p>3. If selected, you get a notification and proceed to pay ₦1,000</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              {/* Reason */}
              <div>
                <label className="block text-gray-600 font-medium mb-1">
                  Why do you need this gift? *
                </label>
                <textarea
                  required
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Share your story genuinely. The Giver will read this and decide. Be honest and heartfelt."
                  className="w-full px-3.5 py-2.5 bg-warm-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-charity-400 leading-relaxed resize-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  <i className="fa-solid fa-eye text-gray-300 mr-1" />
                  Only the Giver sees this. Write from the heart.
                </p>
              </div>

              {/* Delivery */}
              <div>
                <label className="block text-gray-600 font-medium mb-1.5">Preferred Delivery *</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["pickup", "dispatch"] as const).map((opt) => (
                    <label key={opt} className={`cursor-pointer border p-2.5 rounded-xl flex items-start gap-2 ${delivery === opt ? "border-charity-500 bg-charity-50" : "border-gray-200 bg-warm-50"}`}>
                      <input type="radio" name="delivery" checked={delivery === opt} onChange={() => setDelivery(opt)} className="mt-0.5 accent-[#f02d6a]" />
                      <div>
                        <div className="font-bold text-gray-700 text-xs">{opt === "pickup" ? "Self Pickup" : "Dispatch Rider"}</div>
                        <div className="text-[10px] text-gray-400">{opt === "pickup" ? "Free · Meetup" : "₦1,500–₦2,500"}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* No-resell agreement */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input required type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 w-3.5 h-3.5 accent-[#f02d6a] shrink-0" />
                  <span className="text-[10px] text-gray-600 leading-relaxed">
                    <strong className="text-gray-800">I agree not to resell or trade this gift.</strong> This is a free gift from a community member. Reselling violates Givers.ng rules.
                  </span>
                </label>
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
                  <i className="fa-solid fa-circle-exclamation shrink-0" /> {error}
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 font-medium text-xs">Cancel</button>
                <button type="submit" disabled={loading}
                  className="px-5 py-2.5 bg-charity-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 disabled:opacity-50">
                  {loading
                    ? <><i className="fa-solid fa-spinner animate-spin" /> Submitting...</>
                    : <><i className="fa-solid fa-paper-plane text-[10px]" /> Submit Application</>}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Success state */
          <div className="px-5 pb-6 pt-5 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-charity-50 border-2 border-charity-200 flex items-center justify-center text-charity-500 text-2xl mb-3 animate-bounce">
              <i className="fa-solid fa-paper-plane" />
            </div>
            <h3 className="text-base font-bold text-gray-800">Application Sent!</h3>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-[260px]">
              Your reason has been sent to the Giver. You will receive a notification in your Profile tab if you are selected.
            </p>
            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-700 text-left w-full">
              <p className="font-bold mb-1"><i className="fa-solid fa-bell mr-1" /> What happens next?</p>
              <p>The Giver reads all applications and selects the most compelling story. If selected, you will see a notification and a "Pay ₦1,000" button to complete your claim.</p>
            </div>
            <button onClick={onClose} className="mt-4 w-full py-2.5 bg-charity-500 text-white font-bold text-xs rounded-xl">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
