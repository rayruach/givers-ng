"use client";

import { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

/* ── Auth context ── */
const AuthCtx = createContext<{ authed: boolean; logout: () => void }>({
  authed: false,
  logout: () => {},
});
export const useAdminAuth = () => useContext(AuthCtx);

const NAV = [
  { href: "/admin",          icon: "fa-gauge-high",          label: "Dashboard" },
  { href: "/admin/gifts",    icon: "fa-gift",                label: "Gifts" },
  { href: "/admin/claims",   icon: "fa-receipt",             label: "Claims" },
  { href: "/admin/wishes",   icon: "fa-wand-magic-sparkles", label: "Wishes" },
  { href: "/admin/users",    icon: "fa-users",               label: "Users" },
  { href: "/admin/refunds",  icon: "fa-rotate-left",         label: "Refunds" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed]     = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [sideOpen, setSideOpen] = useState(false);
  const pathname = usePathname();
  const router   = useRouter();

  // Persist auth in sessionStorage
  useEffect(() => {
    if (sessionStorage.getItem("givers-admin") === "1") setAuthed(true);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res  = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      sessionStorage.setItem("givers-admin", "1");
      setAuthed(true);
    } else {
      setError("Wrong password. Try again.");
    }
  }

  function logout() {
    sessionStorage.removeItem("givers-admin");
    setAuthed(false);
    router.push("/admin");
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-charity-500 flex items-center justify-center text-white">
              <i className="fa-solid fa-lock" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-gray-800">Givers.ng Admin</h1>
              <p className="text-xs text-gray-400">BallHard Charities</p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Admin Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-charity-400"
              />
            </div>
            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1.5">
                <i className="fa-solid fa-circle-exclamation" /> {error}
              </p>
            )}
            <button type="submit" className="w-full py-2.5 bg-charity-500 text-white font-bold rounded-xl text-sm">
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <AuthCtx.Provider value={{ authed, logout }}>
      <div className="min-h-screen flex bg-gray-50">

        {/* Sidebar backdrop (mobile) */}
        {sideOpen && (
          <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSideOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`fixed top-0 left-0 h-full w-56 bg-gray-950 flex flex-col z-40 transition-transform duration-200
          ${sideOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static`}>
          {/* Logo */}
          <div className="px-5 py-5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-charity-500 flex items-center justify-center text-white text-xs">
                <i className="fa-solid fa-gift" />
              </div>
              <span className="text-white font-extrabold tracking-tight">Givers.ng</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-0.5 ml-9">Admin Panel</p>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={() => setSideOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors
                    ${active ? "bg-charity-500 text-white" : "text-gray-400 hover:text-white hover:bg-white/10"}`}>
                  <i className={`fa-solid ${item.icon} w-4 text-center`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Bottom */}
          <div className="px-3 pb-5">
            <Link href="/" target="_blank"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
              <i className="fa-solid fa-arrow-up-right-from-square w-4 text-center" />
              View App
            </Link>
            <button onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-red-400 hover:bg-white/10 transition-colors">
              <i className="fa-solid fa-right-from-bracket w-4 text-center" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
          {/* Top bar */}
          <header className="bg-white border-b border-gray-200 px-4 h-14 flex items-center gap-3 sticky top-0 z-20">
            <button className="lg:hidden text-gray-500 hover:text-gray-800" onClick={() => setSideOpen(true)}>
              <i className="fa-solid fa-bars text-lg" />
            </button>
            <h2 className="text-sm font-bold text-gray-700 flex-1">
              {NAV.find((n) => n.href === pathname)?.label ?? "Admin"}
            </h2>
            <span className="text-xs text-gray-400 hidden sm:block">BallHard Charities</span>
          </header>

          <main className="flex-1 p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthCtx.Provider>
  );
}
