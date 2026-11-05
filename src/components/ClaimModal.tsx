"use client";

import { useState, useEffect } from "react";
import { Gift, ThankNote } from "@/lib/types";
import { isClaimBlocked, cooldownMs, recordClaim, getRemainingClaims } from "@/lib/claims";
import { DAILY_CLAIM_LIMIT } from "@/lib/constants";

interface Props {
  gift: Gift | null;
  onClose: () => void;
  onSuccess: (note: ThankNote) => void;
}

declare const PaystackPop: {
  setup: (opts: Record<string, unknown>) => { openIframe: () => void };
};

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent!"];

export default function ClaimModal({ gift, onClose, onSuccess }: Props) {
  const [step, setStep]           = useState<1 | 2 | 3>(1); // 3 = success/thank-you
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [reason, setReason]       = useState("");
  const [delivery, setDelivery]   = useState<"pickup" | "dispatch">("pickup");
  const [agreed, setAgreed]       = useState(false);
  const [blocked, setBlocked]     = useState(false);
  const [countdown, setCountdown] = useState("");
  const [payError, setPayError]   = useState("");
  const [remaining, setRemaining] = useState(DAILY_CLAIM_LIMIT);
  // thank-you state
  const [rating, setRating]       = useState(0);
  const [thankMsg, setThankMsg]   = useState("");

  useEffect(() => {
    if (!gift) return;
    setStep(1);
    setName(""); setEmail(""); setPhone(""); setReason("");
    setDelivery("pickup"); setAgreed(false); setPayError("");
    setRating(0); setThankMsg("");
    setBlocked(isClaimBlocked());
    setRemaining(getRemainingClaims());
  }, [gift]);

  /* cooldown countdown */
  useEffect(() => {
    if (!blocked) return;
    const tick = () => {
      const ms = cooldownMs();
      if (ms <= 0) { setBlocked(false); return; }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setCountdown(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [blocked]);

  if (!gift) return null;

  function launchPaystack() {
    setPayError("");
    const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_KEY ?? "";
    if (!paystackKey) {
      setPayError("Payment not configured. Add NEXT_PUBLIC_PAYSTACK_KEY to .env.local");
      return;
    }
    const currentGift = gift!;
    const handler = PaystackPop.setup({
      key: paystackKey,
      email,
      amount: 50000,
      currency: "NGN",
      ref: `givers_${Date.now()}`,
      metadata: { name, phone, giftId: currentGift.id, delivery },
      onClose: () => setPayError("Payment window closed. Please try again."),
      callback: (_response: { reference: string }) => {
        recordClaim();
        setStep(3); // show thank-you step
      },
    });
    handler.openIframe();
  }

  function submitThankYou() {
    const note: ThankNote = {
      id: Date.now(),
      donor: gift!.donor,
      msg: thankMsg,
      rating,
      time: "just now",
    };
    onSuccess(note);
    onClose();
  }

  function skipThankYou() {
    const note: ThankNote = {
      id: Date.now(),
      donor: gift!.donor,
      msg: "",
      rating: 0,
      time: "just now",
    };
    onSuccess(note);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl relative shadow-2xl border border-charity-100 overflow-hidden">

        {/* Close */}
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
            <span className="text-[10px] uppercase font-bold text-charity-500 tracking-wider">Claiming Gift</span>
            <h3 className="text-sm font-bold text-gray-800 leading-tight truncate">{gift.title}</h3>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <i className="fa-solid fa-location-dot text-charity-400 text-[10px]" />
              {gift.area}, {gift.city}
            </p>
          </div>
        </div>

        {/* Step indicator — only show for steps 1 & 2 */}
        {step !== 3 && (
          <div className="flex items-center gap-2 px-5 pt-4 pb-1">
            <div className={`flex items-center gap-1.5 text-[10px] font-bold ${step === 1 ? "text-charity-500" : "text-gray-400"}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${step === 1 ? "bg-charity-500 text-white" : "bg-gray-200 text-gray-400"}`}>1</div>
              Your Details
            </div>
            <div className="flex-1 h-px bg-gray-200 mx-1" />
            <div className={`flex items-center gap-1.5 text-[10px] font-bold ${step === 2 ? "text-charity-500" : "text-gray-300"}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${step === 2 ? "bg-charity-500 text-white" : "bg-gray-200 text-gray-400"}`}>2</div>
              Payment
            </div>
          </div>
        )}

        {/* ── STEP 1: Details ── */}
        {step === 1 && (
          <div className="px-5 pb-5 pt-3 max-h-[65vh] overflow-y-auto">
            {blocked ? (
              <div className="flex flex-col items-center text-center py-4 px-2 space-y-3">
                <div className="w-14 h-14 rounded-full bg-charity-50 border-2 border-charity-200 flex items-center justify-center text-charity-400 text-xl">
                  <i className="fa-solid fa-clock" />
                </div>
                <h4 className="text-sm font-bold text-gray-800">Daily Limit Reached</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  You can only claim <strong className="text-gray-600">{DAILY_CLAIM_LIMIT} gifts per day</strong>. Next slot opens in:
                </p>
                <div className="px-4 py-2.5 rounded-xl bg-warm-100 border border-warm-200 font-mono text-lg font-black text-charity-500 tracking-widest">
                  {countdown || "--:--:--"}
                </div>
                <button onClick={onClose} className="w-full py-2.5 bg-warm-100 border border-warm-200 text-gray-500 font-semibold text-xs rounded-xl">Got it</button>
              </div>
            ) : (
              <form className="space-y-3 text-xs" onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
                {remaining < DAILY_CLAIM_LIMIT && (
                  <p className="text-center text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                    <i className="fa-solid fa-circle-info mr-1" />{remaining} of {DAILY_CLAIM_LIMIT} daily claims remaining
                  </p>
                )}
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Your Name *</label>
                  <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter full name"
                    className="w-full px-3.5 py-2.5 bg-warm-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-charity-400" />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Email Address *</label>
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 bg-warm-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-charity-400" />
                  <p className="text-[10px] text-gray-400 mt-1">Used to send your payment receipt</p>
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Phone Number *</label>
                  <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08012345678"
                    className="w-full px-3.5 py-2.5 bg-warm-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-charity-400" />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Why do you need this gift? *</label>
                  <textarea required rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Share a short note..."
                    className="w-full px-3.5 py-2.5 bg-warm-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-charity-400" />
                </div>

                {/* Delivery */}
                <div>
                  <label className="block text-gray-600 font-medium mb-1.5">Delivery Option *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["pickup","dispatch"] as const).map((opt) => (
                      <label key={opt} className={`cursor-pointer border p-2.5 rounded-xl flex items-start gap-2 ${delivery === opt ? "border-charity-500 bg-charity-50" : "border-gray-200 bg-warm-50"}`}>
                        <input type="radio" name="delivery" checked={delivery === opt} onChange={() => setDelivery(opt)} className="mt-0.5 accent-[#f02d6a]" />
                        <div>
                          <div className="font-bold text-gray-700 text-xs">{opt === "pickup" ? "Self Pickup" : "Dispatch Rider"}</div>
                          <div className="text-[10px] text-gray-400">{opt === "pickup" ? "Free · Meetup Hub" : "₦1,500–₦2,500"}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* No-resell */}
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input required type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 w-3.5 h-3.5 accent-[#f02d6a] shrink-0" />
                    <span className="text-[10px] text-gray-600 leading-relaxed">
                      <strong className="text-gray-800">I agree not to resell or trade this gift.</strong> Violating this bans you permanently from Givers.ng.
                    </span>
                  </label>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                  <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 font-medium text-xs">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 bg-charity-500 text-white font-bold rounded-xl text-xs flex items-center gap-2">
                    Continue <i className="fa-solid fa-arrow-right text-[10px]" />
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ── STEP 2: Payment ── */}
        {step === 2 && (
          <div className="px-5 pb-5 pt-3">
            <div className="rounded-2xl border border-charity-100 bg-charity-50 overflow-hidden mb-4">
              <div className="px-4 py-3 flex items-center gap-3 border-b border-charity-100">
                <div className="w-9 h-9 rounded-xl bg-white border border-charity-200 flex items-center justify-center shrink-0">
                  <i className="fa-solid fa-shield-heart text-charity-500 text-sm" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-800">Platform Verification Fee</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">One-time fee to connect you with the Giver</div>
                </div>
                <div className="ml-auto text-base font-black text-charity-500">₦500</div>
              </div>
              <ul className="px-4 py-3 space-y-1.5 text-[10px] text-gray-500">
                <li className="flex items-center gap-2"><i className="fa-solid fa-circle-check text-charity-400 w-3" /> Verifies your request is genuine</li>
                <li className="flex items-center gap-2"><i className="fa-solid fa-circle-check text-charity-400 w-3" /> Keeps Givers.ng running & spam-free</li>
                <li className="flex items-center gap-2"><i className="fa-solid fa-circle-check text-charity-400 w-3" /> Paid securely via Paystack</li>
              </ul>
            </div>

            <div className="rounded-xl bg-warm-100 border border-warm-200 px-3 py-2.5 text-[10px] text-gray-500 mb-4 space-y-1">
              <div className="flex justify-between"><span className="font-semibold text-gray-600">Name</span><span className="text-gray-700 font-medium">{name}</span></div>
              <div className="flex justify-between"><span className="font-semibold text-gray-600">Email</span><span className="text-gray-700 font-medium truncate ml-4">{email}</span></div>
              <div className="flex justify-between"><span className="font-semibold text-gray-600">Delivery</span><span className="text-gray-700 font-medium">{delivery === "pickup" ? "Self Pickup" : "Dispatch Rider"}</span></div>
            </div>

            {payError && (
              <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation shrink-0" /> {payError}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="px-4 py-2.5 bg-warm-100 border border-warm-200 text-gray-500 font-semibold rounded-xl text-xs flex items-center gap-1.5">
                <i className="fa-solid fa-arrow-left text-[10px]" /> Back
              </button>
              <button onClick={launchPaystack} className="flex-1 py-2.5 bg-charity-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-all">
                <i className="fa-solid fa-lock text-[10px]" /> Pay ₦500 Securely
              </button>
            </div>
            <p className="text-center text-[9px] text-gray-400 mt-2.5 flex items-center justify-center gap-1">
              <i className="fa-solid fa-shield text-gray-300" /> Secured by Paystack · SSL encrypted
            </p>
          </div>
        )}

        {/* ── STEP 3: Success + Thank-you ── */}
        {step === 3 && (
          <div className="px-5 pb-6 pt-4 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-charity-50 border-2 border-charity-200 flex items-center justify-center text-charity-500 text-2xl mb-3 animate-bounce">
              <i className="fa-solid fa-gift" />
            </div>
            <h3 className="text-base font-bold text-gray-800">Request Sent!</h3>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              Your ₦500 verification fee was received. The Giver will contact you within 24 hours.
            </p>

            {/* Thank-you prompt */}
            <div className="w-full mt-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left">
              <p className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                <i className="fa-solid fa-heart text-charity-400" />
                Leave a thank-you for{" "}
                <span className="text-charity-500">{gift.donor}</span>
              </p>

              {/* Star rating */}
              <div className="flex items-center gap-1.5 mb-3">
                {[1,2,3,4,5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="text-2xl transition-colors"
                    style={{ color: star <= rating ? "#f59e0b" : "#e5e7eb", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    <i className="fa-solid fa-star" />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="text-[10px] text-gray-400 ml-1 font-semibold">{RATING_LABELS[rating]}</span>
                )}
              </div>

              {/* Message */}
              <textarea
                rows={2}
                value={thankMsg}
                onChange={(e) => setThankMsg(e.target.value)}
                placeholder="e.g. Got the item in perfect condition. God bless you!"
                className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-charity-400 resize-none"
              />

              <div className="flex gap-2 mt-3">
                <button onClick={skipThankYou} className="flex-none px-4 py-2 text-gray-400 font-medium text-xs">Skip</button>
                <button onClick={submitThankYou} className="flex-1 py-2 bg-charity-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5">
                  <i className="fa-solid fa-paper-plane text-[10px]" /> Send Thank-you
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
