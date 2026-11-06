"use client";

import { useState, useEffect } from "react";
import { ThankNote, Application } from "@/lib/types";
import GiverDashboard from "./GiverDashboard";
interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface Props {
  claimCount: number;
  thankNotes: ThankNote[];
  user: AuthUser | null;
  onLogout: () => void;
  onAuthOpen: () => void;
}

type SubTab = "giver" | "receiver" | "notes";

const APP_STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending:  { label: "Pending Review", cls: "bg-amber-100 text-amber-700" },
  selected: { label: "Selected! Pay Now", cls: "bg-charity-100 text-charity-600 animate-pulse" },
  rejected: { label: "Not Selected",   cls: "bg-gray-100 text-gray-500" },
  paid:     { label: "Claimed",         cls: "bg-green-100 text-green-600" },
};

export default function ProfileTab({ claimCount, thankNotes, user, onLogout, onAuthOpen }: Props) {
  const [subTab, setSubTab] = useState<SubTab>("giver");
  const [myApps, setMyApps] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [refundAppId, setRefundAppId] = useState<number | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundError, setRefundError] = useState("");
  const [refundSuccess, setRefundSuccess] = useState<number | null>(null);

  useEffect(() => {
    if (user && subTab === "receiver") loadMyApplications();
  }, [user, subTab]);

  async function loadMyApplications() {
    setLoadingApps(true);
    try {
      const res = await fetch("/api/applications?mine=1", { credentials: "include" });
      const data = await res.json();
      setMyApps(data.applications ?? []);
    } catch {
      setMyApps([]);
    }
    setLoadingApps(false);
  }

  async function submitRefund(appId: number) {
    setRefundLoading(true);
    setRefundError("");
    try {
      const res = await fetch("/api/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ appId, reason: refundReason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRefundError(data.error ?? "Failed to submit refund request");
        setRefundLoading(false);
        return;
      }
      setRefundSuccess(appId);
      setRefundAppId(null);
      setRefundReason("");
    } catch {
      setRefundError("Network error. Please try again.");
    }
    setRefundLoading(false);
  }

  /* ── Not logged in ── */
  if (!user) {
    return (
      <div className="w-full max-w-[420px] flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-24 h-24 rounded-full bg-charity-50 border-2 border-charity-100 flex items-center justify-center text-charity-300 text-4xl mb-5">
          <i className="fa-solid fa-user" />
        </div>
        <h2 className="text-xl font-extrabold text-gray-800 mb-1">Your Profile</h2>
        <p className="text-sm text-gray-400 leading-relaxed mb-8 max-w-[260px]">
          Sign in to post gifts, apply for items, and track everything in one place.
        </p>
        <div className="w-full space-y-3">
          <button onClick={onAuthOpen} className="w-full py-3.5 bg-charity-500 text-white font-bold text-sm rounded-2xl active:scale-95 transition-all">
            Sign In
          </button>
          <button onClick={onAuthOpen} className="w-full py-3.5 bg-warm-100 border border-warm-200 text-gray-700 font-bold text-sm rounded-2xl active:scale-95 transition-all hover:border-charity-300">
            Create a Free Account
          </button>
        </div>
        <div className="mt-8 w-full text-left space-y-2.5">
          {[
            { icon: "fa-gift",         text: "Post gifts and manage applications" },
            { icon: "fa-hand-holding-heart", text: "Apply for gifts with your story" },
            { icon: "fa-bell",         text: "Get notified when selected" },
            { icon: "fa-trophy",       text: "Appear on the Donors leaderboard" },
          ].map((item) => (
            <div key={item.icon} className="flex items-center gap-3 text-xs text-gray-500">
              <div className="w-7 h-7 rounded-lg bg-charity-50 flex items-center justify-center text-charity-400 shrink-0">
                <i className={`fa-solid ${item.icon} text-[11px]`} />
              </div>
              {item.text}
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Logged in ── */
  return (
    <div className="w-full max-w-[420px] pb-6">
      {/* Avatar + name */}
      <div className="flex flex-col items-center pt-2 pb-4 border-b border-warm-200 mb-4">
        <div className="w-16 h-16 rounded-full bg-charity-500 flex items-center justify-center text-white text-2xl shadow-lg mb-2">
          <span className="font-black">{user.name.charAt(0).toUpperCase()}</span>
        </div>
        <h2 className="font-extrabold text-gray-800 text-base">{user.name}</h2>
        <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
        <button onClick={onLogout}
          className="mt-2 px-4 py-1 bg-warm-100 border border-warm-200 text-gray-500 text-xs font-semibold rounded-xl hover:text-charity-500 hover:border-charity-300 transition-colors">
          <i className="fa-solid fa-right-from-bracket mr-1.5" />Sign Out
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex bg-warm-100 rounded-xl p-1 mb-4">
        <button
          onClick={() => setSubTab("giver")}
          className={`flex-1 py-2 rounded-lg text-[11px] font-bold transition-colors ${subTab === "giver" ? "bg-white text-charity-500 shadow-sm" : "text-gray-400"}`}
        >
          <i className="fa-solid fa-gift mr-1" />My Gifts
        </button>
        <button
          onClick={() => setSubTab("receiver")}
          className={`flex-1 py-2 rounded-lg text-[11px] font-bold transition-colors ${subTab === "receiver" ? "bg-white text-charity-500 shadow-sm" : "text-gray-400"}`}
        >
          <i className="fa-solid fa-hand-holding-heart mr-1" />Applied For
        </button>
        <button
          onClick={() => setSubTab("notes")}
          className={`flex-1 py-2 rounded-lg text-[11px] font-bold transition-colors ${subTab === "notes" ? "bg-white text-charity-500 shadow-sm" : "text-gray-400"}`}
        >
          <i className="fa-solid fa-heart mr-1" />Notes
          {thankNotes.length > 0 && <span className="ml-1 bg-charity-500 text-white text-[8px] font-black rounded-full px-1.5 py-0.5">{thankNotes.length}</span>}
        </button>
      </div>

      {/* ── Giver tab: posted gifts + applications ── */}
      {subTab === "giver" && <GiverDashboard />}

      {/* ── Receiver tab: gifts I applied for ── */}
      {subTab === "receiver" && (
        <div>
          {loadingApps ? (
            <div className="flex justify-center py-10 text-gray-300">
              <i className="fa-solid fa-spinner animate-spin text-xl" />
            </div>
          ) : myApps.length === 0 ? (
            <div className="text-center py-10 text-xs text-gray-400 bg-warm-50 rounded-2xl border border-warm-200">
              <i className="fa-solid fa-hand-holding-heart text-charity-200 text-2xl mb-2 block" />
              You haven't applied for any gifts yet.<br />
              Swipe right on a gift to apply!
            </div>
          ) : (
            <div className="space-y-3">
              {myApps.map((app) => (
                <div key={app.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-charity-50 flex items-center justify-center text-charity-400 shrink-0">
                      <i className="fa-solid fa-gift" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{(app as any).giftTitle}</p>
                      <p className="text-[10px] text-gray-400">Applied {new Date(app.createdAt).toLocaleDateString("en-NG")}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${APP_STATUS_BADGE[app.status]?.cls}`}>
                      {APP_STATUS_BADGE[app.status]?.label}
                    </span>
                  </div>

                  <div className="bg-warm-50 rounded-xl px-3 py-2 mb-2">
                    <p className="text-[11px] text-gray-500 leading-relaxed italic">"{app.reason}"</p>
                  </div>

                  <p className="text-[10px] text-gray-400">
                    <i className="fa-solid fa-truck mr-1" />
                    {app.delivery === "pickup" ? "Self Pickup" : "Dispatch Rider"}
                  </p>

                  {app.status === "selected" && (
                    <div className="mt-2 p-2.5 bg-charity-50 border border-charity-200 rounded-xl text-[11px] text-charity-600 font-semibold flex items-center gap-2">
                      <i className="fa-solid fa-star" />
                      You were selected! Go to your notifications to pay and confirm.
                    </div>
                  )}

                  {app.status === "paid" && refundSuccess !== app.id && (
                    <div className="mt-2">
                      {refundAppId === app.id ? (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                          <p className="text-[11px] font-bold text-gray-700">Why are you requesting a refund?</p>
                          <textarea
                            rows={2}
                            value={refundReason}
                            onChange={(e) => setRefundReason(e.target.value)}
                            placeholder="Describe the issue — e.g. Giver did not respond, item not as described..."
                            className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs text-gray-700 focus:outline-none resize-none"
                          />
                          {refundError && (
                            <p className="text-[10px] text-red-500 flex items-center gap-1">
                              <i className="fa-solid fa-circle-exclamation" /> {refundError}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setRefundAppId(null); setRefundError(""); }}
                              className="flex-none px-3 py-1.5 text-gray-400 text-xs font-medium"
                            >
                              Cancel
                            </button>
                            <button
                              disabled={refundLoading || !refundReason.trim()}
                              onClick={() => submitRefund(app.id)}
                              className="flex-1 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                              {refundLoading
                                ? <i className="fa-solid fa-spinner animate-spin" />
                                : <><i className="fa-solid fa-paper-plane text-[9px]" /> Submit Request</>}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setRefundAppId(app.id); setRefundError(""); }}
                          className="text-[10px] text-amber-600 font-semibold flex items-center gap-1 hover:text-amber-700"
                        >
                          <i className="fa-solid fa-rotate-left text-[9px]" /> Apply for Refund
                        </button>
                      )}
                    </div>
                  )}

                  {refundSuccess === app.id && (
                    <div className="mt-2 p-2.5 bg-green-50 border border-green-200 rounded-xl text-[11px] text-green-600 flex items-center gap-2">
                      <i className="fa-solid fa-circle-check" /> Refund request submitted. Admin will review and contact you.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Thank-you notes tab ── */}
      {subTab === "notes" && (
        <div>
          {thankNotes.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400 bg-warm-50 rounded-2xl border border-warm-200">
              <i className="fa-solid fa-heart text-charity-200 text-2xl mb-2 block" />
              No thank-you notes yet.<br />Claim a gift and leave one!
            </div>
          ) : (
            <div className="space-y-2">
              {thankNotes.map((note) => (
                <div key={note.id} className="p-3 rounded-2xl bg-warm-50 border border-warm-200">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-charity-500 flex items-center justify-center text-white text-[9px] font-black shrink-0">
                        {note.donor.charAt(0)}
                      </div>
                      <span className="text-[11px] font-bold text-gray-700 truncate">{note.donor}</span>
                    </div>
                    <span className="text-[9px] text-gray-400 shrink-0">{note.time}</span>
                  </div>
                  {note.rating > 0 && (
                    <div className="flex gap-0.5 mb-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <i key={i} className={`fa-solid fa-star text-[10px] ${i < note.rating ? "text-amber-400" : "text-gray-200"}`} />
                      ))}
                    </div>
                  )}
                  {note.msg && <p className="text-[10px] text-gray-500 leading-relaxed italic">"{note.msg}"</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
