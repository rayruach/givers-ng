"use client";

import { useState } from "react";
import { AppNotification, Application } from "@/lib/types";

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
}

const TYPE_ICON: Record<string, string> = {
  selected: "fa-star",
  rejected: "fa-xmark-circle",
  applied:  "fa-user-plus",
  paid:     "fa-circle-check",
};

const TYPE_COLOR: Record<string, string> = {
  selected: "text-charity-500 bg-charity-50",
  rejected: "text-gray-400 bg-gray-50",
  applied:  "text-violet-500 bg-violet-50",
  paid:     "text-green-500 bg-green-50",
};

export default function NotificationBell({ notifications, unread, user, onMarkRead, onPay }: Props) {
  const [open, setOpen] = useState(false);

  if (!user) return null;

  function toggle() {
    setOpen((v) => !v);
    if (!open && unread > 0) onMarkRead(); // mark all read when opened
  }

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className="nav-icon-btn relative"
        title="Notifications"
      >
        <i className="fa-solid fa-bell" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-charity-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="absolute right-0 top-10 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-40 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800">Notifications</h3>
              {unread > 0 && (
                <button onClick={() => onMarkRead()}
                  className="text-[10px] text-charity-500 font-semibold hover:text-charity-600">
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center text-gray-400">
                  <i className="fa-solid fa-bell-slash text-2xl mb-2" />
                  <p className="text-xs">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-gray-50 flex gap-3 items-start transition-colors ${!n.read ? "bg-charity-50/50" : ""}`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 ${TYPE_COLOR[n.type]}`}>
                      <i className={`fa-solid ${TYPE_ICON[n.type]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800">{n.title}</p>
                      <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-gray-300 mt-1">
                        {new Date(n.createdAt).toLocaleDateString("en-NG")}
                      </p>
                      {/* Pay button for selected notifications */}
                      {n.type === "selected" && (
                        <button
                          onClick={() => { setOpen(false); onPay(n); }}
                          className="mt-2 px-3 py-1.5 bg-charity-500 text-white text-[10px] font-bold rounded-lg flex items-center gap-1"
                        >
                          <i className="fa-solid fa-lock text-[8px]" /> Pay ₦1,000 to Claim
                        </button>
                      )}
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-charity-500 shrink-0 mt-1.5" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
