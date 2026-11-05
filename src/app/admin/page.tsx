"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  gifts:  { total: number; available: number; pending: number; claimed: number; removed: number };
  claims: { total: number; paid: number; completed: number; refunded: number };
  revenue: number;
  wishes: { total: number; granted: number };
}

function StatCard({ icon, label, value, sub, color }: {
  icon: string; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm ${color}`}>
          <i className={`fa-solid ${icon}`} />
        </div>
      </div>
      <div className="text-2xl font-extrabold text-gray-800 leading-none mb-1">{value}</div>
      <div className="text-xs font-semibold text-gray-500">{label}</div>
      {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <i className="fa-solid fa-spinner animate-spin text-2xl" />
      </div>
    );
  }

  if (!stats) return <p className="text-red-500 text-sm">Failed to load stats.</p>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-gray-800">Dashboard</h1>
        <p className="text-xs text-gray-400 mt-0.5">Platform overview for Givers.ng</p>
      </div>

      {/* Revenue highlight */}
      <div className="bg-charity-500 rounded-2xl p-6 text-white">
        <p className="text-sm font-semibold opacity-80 mb-1">Total Revenue (Verification Fees)</p>
        <p className="text-4xl font-black">
          ₦{stats.revenue.toLocaleString()}
        </p>
        <p className="text-xs opacity-70 mt-1">
          {stats.claims.total} claims &times; ₦500 &minus; {stats.claims.refunded} refunds
        </p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon="fa-gift" label="Total Gifts" value={stats.gifts.total}
          sub={`${stats.gifts.available} available`} color="bg-charity-500" />
        <StatCard icon="fa-hourglass-half" label="Pending" value={stats.gifts.pending}
          sub="Locked, awaiting handoff" color="bg-amber-400" />
        <StatCard icon="fa-circle-check" label="Claimed" value={stats.gifts.claimed}
          sub="Successfully handed over" color="bg-green-500" />
        <StatCard icon="fa-receipt" label="Total Claims" value={stats.claims.total}
          sub={`${stats.claims.completed} completed`} color="bg-blue-500" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard icon="fa-wand-magic-sparkles" label="Wishes" value={stats.wishes.total}
          sub={`${stats.wishes.granted} granted`} color="bg-violet-600" />
        <StatCard icon="fa-rotate-left" label="Refunds" value={stats.claims.refunded}
          sub="Returned to available" color="bg-red-400" />
        <StatCard icon="fa-ban" label="Removed" value={stats.gifts.removed}
          sub="Admin removed" color="bg-gray-400" />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-bold text-gray-700 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { href: "/admin/gifts",  icon: "fa-gift",    label: "Manage Gifts",  desc: "Approve, lock or remove gift listings" },
            { href: "/admin/claims", icon: "fa-receipt", label: "View Claims",   desc: "Track payments and connect parties" },
            { href: "/admin/wishes", icon: "fa-wand-magic-sparkles", label: "Manage Wishes", desc: "Review and moderate community wishes" },
          ].map((a) => (
            <Link key={a.href} href={a.href}
              className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-charity-300 hover:shadow-sm transition-all group">
              <i className={`fa-solid ${a.icon} text-charity-500 mb-2 block`} />
              <div className="text-sm font-bold text-gray-800 group-hover:text-charity-500 transition-colors">{a.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{a.desc}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* How the platform works — reminder */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 space-y-1.5">
        <p className="font-bold flex items-center gap-1.5"><i className="fa-solid fa-circle-info" /> Platform Flow Reminder</p>
        <p><span className="font-semibold">Available</span> — Gift visible in swipe stack</p>
        <p><span className="font-semibold">Pending</span> — Someone paid ₦500, gift locked for 24h. Connect them with the donor.</p>
        <p><span className="font-semibold">Claimed</span> — Handoff confirmed. Mark once item physically delivered.</p>
        <p><span className="font-semibold">Refund</span> — If handoff fails, refund the ₦500 and reset gift to Available.</p>
      </div>
    </div>
  );
}
