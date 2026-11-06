"use client";

import { useState } from "react";
import { AppNotification } from "@/lib/types";

interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface Props {
  notifications: AppNotification[];
  unread: number;
  user: AuthUser | null;
  onMarkRead: (id?: number) => void;
  onPay: (notification: AppNotification) => void;
  onOpenGiverDashboard: (giftId: number) => void;
}

const TYPE_ICON: Record<string, string> = {
  selected: "fa-star",
  rejected: "fa-circle-xmark",
  applied:  "fa-users",
  paid:     "fa-circle-check",
};

const TYPE_COLOR: Record<string, string> = {
  selected: "text-charity-500 bg-charity-50 border-charity-200",
  rejected: "text-gray-400 bg-gray-50 border-gray-200",
  applied:  "text-violet-500 bg-violet-50 border-violet-200",
  paid:     "text-green-500 bg-green-50 border-green-200",
};

/** Group "applied" notifications by giftId so the giver sees one entry per gift */
function groupApplied(notifications: AppNotification[]) {
  const result: AppNotification[] = [];
  const appliedByGift = new Map<number, AppNotification[]>();

  for (const n of notifications) {
    if (n.type === "applied" && n.giftId) {
      const arr = appliedByGift.get(n.giftId) ?? [];
      arr.push(n);
      appliedByGift.set(n.giftId, arr);
    } else {
      result.push(n);
    }
  }

  // For each gift, create one merged notification
  for (const [, group] of appliedByGift) {
    const latest = group[0]; // most recent first (already sorted by API)
    const count  = group.length;
    const unread = group.some(n => !n.read);

    // Collect up to 3 reasons as preview
    const reasons = group
      .map(n => {
        // Extract name from message "X applied for your gift..."
        const nameMatch = n.message.match(/^(.+?) applied for/);
        return nameMatch ? nameMatch[1] : "Someone";
      })
      .slice(0, 3);

    result.push({
      ...latest,
      read: !unread,
      title: count === 1
        ? `1 application for "${extractGiftTitle(latest.message)}"`
        : `${count} applications for "${extractGiftTitle(latest.message)}"`,
      message: reasons.join(", ") + (count > 3 ? ` and ${count - 3} more` : "") + " applied.",
    });
  }

  // Re-sort by createdAt descending
  return result.sort((a, b) => b.createdAt - a.createdAt);
}

function extractGiftTitle(message: string): string {
  const match = message.match(/gift: "(.+?)"\. Reason:/);
  if (match) return match[1];
  // fallback for old format
  const old = message.match(/gift: "(.+)"$/);
  return old ? old[1] : "your gift";
}

export default function NotificationBell({
  notifications, unread, user, onMarkRead, onPay, onOpenGiverDashboard,
}: Props) {
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const grouped = groupApplied(notifications);
  const totalUnread = grouped.filter(n => !n.read).length;

  function toggle() {
    setOpen((v) => !v);
    if (!open && unread > 0) onMarkRead();
  }

  function handleAppliedClick(n: AppNotification) {
    setOpen(false);
    if (n.giftId) onOpenGiverDashboard(n.giftId);
  }

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className="nav-icon-btn relative"
        title="Notifications"
      >
        <i className="fa-solid fa-bell" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-charity-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-white">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />

          {/* Panel — full-width on mobile, fixed width on desktop */}
          <div
            className="fixed sm:absolute z-40 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
            style={{
              // Mobile: full width with margin
              left: "8px",
              right: "8px",
              top: "60px",
              // Desktop override via sm: classes below
            }}
          >
            {/* Override for sm+ */}
            <style>{`
              @media (min-width: 640px) {
                .notif-panel {
                  left: auto !important;
                  right: 0 !important;
                  top: 40px !important;
                  width: 340px !important;
                }
              }
            `}</style>
            <div className="notif-panel"
              style={{ position: "relative" }}
            >

            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800">Notifications</h3>
              {totalUnread > 0 && (
                <button onClick={() => onMarkRead()}
                  className="text-[10px] text-charity-500 font-semibold hover:text-charity-600">
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[70vh] sm:max-h-96 overflow-y-auto">
              {grouped.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center text-gray-400">
                  <i className="fa-solid fa-bell-slash text-2xl mb-2" />
                  <p className="text-xs">No notifications yet</p>
                </div>
              ) : (
                grouped.map((n, idx) => (
                  <div
                    key={n.id + "-" + idx}
                    className={`px-4 py-3 border-b border-gray-50 flex gap-3 items-start transition-colors cursor-pointer hover:bg-warm-50 ${!n.read ? "bg-charity-50/40" : ""}`}
                    onClick={() => {
                      if (n.type === "applied") handleAppliedClick(n);
                      else if (n.type === "selected") { setOpen(false); onPay(n); }
                    }}
                  >
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 border ${TYPE_COLOR[n.type]}`}>
                      <i className={`fa-solid ${TYPE_ICON[n.type]}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 leading-snug">{n.title}</p>
                      <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5 line-clamp-2">{n.message}</p>

                      {/* Applied: show "View applications" CTA */}
                      {n.type === "applied" && (
                        <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] text-violet-500 font-semibold">
                          <i className="fa-solid fa-arrow-right text-[8px]" /> View all applications
                        </span>
                      )}

                      {/* Selected: show Pay CTA */}
                      {n.type === "selected" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpen(false); onPay(n); }}
                          className="mt-2 px-3 py-1.5 bg-charity-500 text-white text-[10px] font-bold rounded-lg flex items-center gap-1"
                        >
                          <i className="fa-solid fa-lock text-[8px]" /> Pay ₦1,000 to Claim
                        </button>
                      )}

                      <p className="text-[10px] text-gray-300 mt-1.5">
                        {new Date(n.createdAt).toLocaleDateString("en-NG")}
                      </p>
                    </div>

                    {/* Unread dot */}
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-charity-500 shrink-0 mt-1.5" />
                    )}
                  </div>
                ))
              )}
            </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
