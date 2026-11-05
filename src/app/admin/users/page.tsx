"use client";

import { useEffect, useState } from "react";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  blocked: boolean;
  createdAt: string;
  claimCount: number;
}

export default function AdminUsers() {
  const [users, setUsers]     = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => { setUsers(d.users ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function toggleBlock(id: number, blocked: boolean) {
    setSaving(id);
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, blocked: !blocked }),
    });
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, blocked: !blocked } : u));
    setSaving(null);
  }

  async function deleteUser(id: number) {
    if (!confirm("Delete this user permanently? This cannot be undone.")) return;
    await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-gray-800">Users</h1>
        <p className="text-xs text-gray-400">{users.length} registered · {users.filter((u) => u.blocked).length} blocked</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-gray-300">
          <i className="fa-solid fa-spinner animate-spin text-2xl" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 text-sm text-gray-400">No users registered yet.</div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className={`bg-white rounded-2xl border p-4 space-y-3 ${
                user.blocked ? "border-red-200 bg-red-50/30" : "border-gray-100"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 ${
                    user.blocked ? "bg-red-100 text-red-500" : "bg-charity-100 text-charity-600"
                  }`}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{user.name}</p>
                    <p className="text-[11px] text-gray-400">{user.email}</p>
                    {user.phone && <p className="text-[11px] text-gray-400">{user.phone}</p>}
                  </div>
                </div>
                {user.blocked && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600 shrink-0">
                    Blocked
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-[11px] text-gray-400">
                <span><i className="fa-solid fa-gift mr-1" />{user.claimCount} claims</span>
                <span><i className="fa-solid fa-calendar mr-1" />{new Date(user.createdAt).toLocaleDateString("en-NG")}</span>
              </div>

              <div className="flex gap-2">
                <button
                  disabled={saving === user.id}
                  onClick={() => toggleBlock(user.id, user.blocked)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 ${
                    user.blocked
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-red-100 text-red-500 hover:bg-red-200"
                  }`}
                >
                  {saving === user.id
                    ? <i className="fa-solid fa-spinner animate-spin" />
                    : user.blocked ? "Unblock User" : "Block User"}
                </button>
                <button
                  onClick={() => deleteUser(user.id)}
                  className="px-4 py-2 border border-red-100 text-red-400 text-xs font-bold rounded-xl hover:bg-red-50"
                >
                  <i className="fa-solid fa-trash mr-1" />Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
