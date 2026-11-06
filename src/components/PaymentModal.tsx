"use client";

import { useState } from "react";
import { Application, AppNotification } from "@/lib/types";
import { CLAIM_FEE_KOBO } from "@/lib/constants";

interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface Props {
  notification: AppNotification | null;
  application: Application | null;
  user: AuthUser;
  onClose: () => void;
  onSuccess: () => void;
}

declare const PaystackPop: {
  setup: (opts: Record<string, unknown>) => { openIframe: () => void };
};

export default function PaymentModal({ notification, application, user, onClose, onSuccess }: Props) {
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  if (!notification || !application) return null;

  function launchPaystack() {
    setError("");
    const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_KEY ?? "";
    if (!paystackKey) {
      setError("Payment not configured. Add NEXT_PUBLIC_PAYSTACK_KEY to your environment.");
      return;
    }

    const paymentRef = `givers_${Date.now()}`;
    const handler = PaystackPop.setup({
      key: paystackKey,
      email: user.email,
      amount: CLAIM_FEE_KOBO,
      currency: "NGN",
      ref: paymentRef,
      metadata: { name: user.name, appId: application!.id, giftId: application!.giftId },
      onClose: () => setError("Payment window closed. Please try again."),
      callback: async (_res: { reference: string }) => {
        setLoading(true);
        try {
          // Verify payment server-side and record the claim
          const res = await fetch("/api/claims", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              paystackRef: paymentRef,
              giftId: application!.giftId,
              appId: application!.id,
              delivery: application!.delivery,
            }),
          });

          const data = await res.json();
          if (!res.ok) {
            setError(data.error ?? "Claim failed. Contact support if you were charged.");
            setLoading(false);
            return;
          }

          // Mark notification as read
          await fetch("/api/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ id: notification!.id }),
          });

          onSuccess();
        } catch {
          setError("Network error. Contact support if you were charged.");
        }
        setLoading(false);
      },
    });
    handler.openIframe();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 relative shadow-2xl border border-charity-100">

        <button onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-warm-100 text-gray-500 hover:text-charity-500">
          <i className="fa-solid fa-xmark text-sm" />
        </button>

        {/* Celebration header */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-16 h-16 rounded-full bg-charity-50 border-2 border-charity-200 flex items-center justify-center text-charity-500 text-2xl mb-3">
            <i className="fa-solid fa-gift animate-bounce" />
          </div>
          <h3 className="text-base font-bold text-gray-800">You were selected!</h3>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-[260px]">
            The Giver chose your application for <strong className="text-gray-600">{application.giftTitle}</strong>. Complete the ₦1,000 verification payment to claim your gift.
          </p>
        </div>

        {/* Fee breakdown */}
        <div className="rounded-2xl border border-charity-100 bg-charity-50 overflow-hidden mb-4">
          <div className="px-4 py-3 flex items-center gap-3 border-b border-charity-100">
            <div className="w-9 h-9 rounded-xl bg-white border border-charity-200 flex items-center justify-center shrink-0">
              <i className="fa-solid fa-shield-heart text-charity-500 text-sm" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-800">Platform Verification Fee</div>
              <div className="text-[10px] text-gray-400 mt-0.5">One-time fee to complete your claim</div>
            </div>
            <div className="ml-auto text-base font-black text-charity-500">₦1,000</div>
          </div>
          <ul className="px-4 py-3 space-y-1.5 text-[10px] text-gray-500">
            <li className="flex items-center gap-2"><i className="fa-solid fa-circle-check text-charity-400 w-3" /> Confirms your commitment to the Giver</li>
            <li className="flex items-center gap-2"><i className="fa-solid fa-circle-check text-charity-400 w-3" /> Keeps Givers.ng running and spam-free</li>
            <li className="flex items-center gap-2"><i className="fa-solid fa-circle-check text-charity-400 w-3" /> Paid securely via Paystack</li>
          </ul>
        </div>

        {/* Summary */}
        <div className="rounded-xl bg-warm-100 border border-warm-200 px-3 py-2.5 text-[10px] text-gray-500 mb-4 space-y-1">
          <div className="flex justify-between"><span className="font-semibold text-gray-600">Name</span><span className="text-gray-700 font-medium">{user.name}</span></div>
          <div className="flex justify-between"><span className="font-semibold text-gray-600">Email</span><span className="text-gray-700 font-medium truncate ml-4">{user.email}</span></div>
          <div className="flex justify-between"><span className="font-semibold text-gray-600">Delivery</span><span className="text-gray-700 font-medium capitalize">{application.delivery === "pickup" ? "Self Pickup" : "Dispatch Rider"}</span></div>
        </div>

        {error && (
          <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation shrink-0" /> {error}
          </div>
        )}

        <button
          onClick={launchPaystack}
          disabled={loading}
          className="w-full py-3 bg-charity-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading
            ? <><i className="fa-solid fa-spinner animate-spin" /> Processing...</>
            : <><i className="fa-solid fa-lock text-[10px]" /> Pay ₦1,000 to Claim Gift</>}
        </button>
        <p className="text-center text-[9px] text-gray-400 mt-2 flex items-center justify-center gap-1">
          <i className="fa-solid fa-shield text-gray-300" /> Secured by Paystack · SSL encrypted
        </p>
      </div>
    </div>
  );
}
