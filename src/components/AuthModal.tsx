"use client";

import { useState } from "react";

interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface Props {
  onClose: () => void;
  onAuth: (user: AuthUser) => void;
}

type Screen = "login" | "signup" | "forgot" | "forgot-sent";

export default function AuthModal({ onClose, onAuth }: Props) {
  const [screen, setScreen]     = useState<Screen>("signup");
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [phone, setPhone]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  function switchScreen(s: Screen) { setScreen(s); setError(""); }

  /* ── Sign up / Log in ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const isSignup = screen === "signup";
      const res = await fetch(isSignup ? "/api/auth/signup" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(isSignup ? { name, email, phone, password } : { email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong"); setLoading(false); return; }
      onAuth(data.user);
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  /* ── Forgot password ── */
  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong"); setLoading(false); return; }
      switchScreen("forgot-sent");
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  /* ── Forgot password sent confirmation ── */
  if (screen === "forgot-sent") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white w-full max-w-md rounded-2xl p-6 relative shadow-2xl border border-charity-100">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-warm-100 text-gray-500 hover:text-charity-500">
            <i className="fa-solid fa-xmark text-sm" />
          </button>
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 rounded-full bg-charity-50 border-2 border-charity-200 flex items-center justify-center text-charity-500 text-2xl mb-4">
              <i className="fa-solid fa-envelope" />
            </div>
            <h3 className="text-base font-bold text-gray-800">Check your email</h3>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed max-w-[260px]">
              If an account exists for <strong>{email}</strong>, a password reset link has been sent.
            </p>
            <p className="text-[10px] text-gray-300 mt-3">Didn't get it? Check your spam folder.</p>
            <button onClick={() => switchScreen("login")} className="mt-5 w-full py-2.5 bg-charity-500 text-white font-bold text-xs rounded-xl">
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Forgot password form ── */
  if (screen === "forgot") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white w-full max-w-md rounded-2xl p-6 relative shadow-2xl border border-charity-100">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-warm-100 text-gray-500 hover:text-charity-500">
            <i className="fa-solid fa-xmark text-sm" />
          </button>

          <div className="mb-5">
            <div className="w-10 h-10 rounded-xl bg-charity-500 flex items-center justify-center text-white mb-3">
              <i className="fa-solid fa-key" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Forgot Password?</h3>
            <p className="text-xs text-gray-400 mt-0.5">Enter your email and we'll send you a reset link.</p>
          </div>

          <form onSubmit={handleForgot} className="space-y-3 text-xs">
            <div>
              <label className="block text-gray-600 font-medium mb-1">Email *</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 bg-warm-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-charity-400" />
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation shrink-0" /> {error}
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
              <button type="button" onClick={() => switchScreen("login")} className="px-4 py-2.5 text-gray-400 font-medium text-xs">
                Back
              </button>
              <button type="submit" disabled={loading}
                className="px-5 py-2.5 bg-charity-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 disabled:opacity-50">
                {loading ? <i className="fa-solid fa-spinner animate-spin" /> : "Send Reset Link"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  /* ── Login / Signup ── */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto relative shadow-2xl border border-charity-100">

        <button onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-warm-100 text-gray-500 hover:text-charity-500">
          <i className="fa-solid fa-xmark text-sm" />
        </button>

        <div className="mb-5">
          <div className="w-10 h-10 rounded-xl bg-charity-500 flex items-center justify-center text-white mb-3">
            <i className="fa-solid fa-user-lock" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">
            {screen === "signup" ? "Create Your Account" : "Welcome Back"}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {screen === "signup"
              ? "You need an account to give or claim gifts. It's free."
              : "Sign in to continue."}
          </p>
        </div>

        {/* Tab toggle */}
        <div className="flex bg-warm-100 rounded-xl p-1 mb-4">
          <button onClick={() => switchScreen("signup")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${screen === "signup" ? "bg-white text-charity-500 shadow-sm" : "text-gray-400"}`}>
            Sign Up
          </button>
          <button onClick={() => switchScreen("login")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${screen === "login" ? "bg-white text-charity-500 shadow-sm" : "text-gray-400"}`}>
            Log In
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {screen === "signup" && (
            <div>
              <label className="block text-gray-600 font-medium mb-1">Full Name *</label>
              <input required value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Chiamaka Obi"
                className="w-full px-3.5 py-2.5 bg-warm-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-charity-400" />
            </div>
          )}

          <div>
            <label className="block text-gray-600 font-medium mb-1">Email *</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 bg-warm-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-charity-400" />
          </div>

          {screen === "signup" && (
            <div>
              <label className="block text-gray-600 font-medium mb-1">Phone Number</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="08012345678"
                className="w-full px-3.5 py-2.5 bg-warm-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-charity-400" />
            </div>
          )}

          {/* Password with reveal toggle */}
          <div>
            <label className="block text-gray-600 font-medium mb-1">Password *</label>
            <div className="relative">
              <input
                required
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={screen === "signup" ? "Choose a password (min 6 chars)" : "Enter your password"}
                minLength={6}
                className="w-full px-3.5 py-2.5 pr-10 bg-warm-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-charity-400"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-charity-500 transition-colors"
                tabIndex={-1}
              >
                <i className={`fa-solid ${showPw ? "fa-eye-slash" : "fa-eye"}`} />
              </button>
            </div>
          </div>

          {/* Forgot password link — login only */}
          {screen === "login" && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => switchScreen("forgot")}
                className="text-[11px] text-charity-500 font-semibold hover:text-charity-600"
              >
                Forgot password?
              </button>
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation shrink-0" /> {error}
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-gray-400 font-medium text-xs">Cancel</button>
            <button type="submit" disabled={loading}
              className="px-5 py-2.5 bg-charity-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 disabled:opacity-50">
              {loading
                ? <i className="fa-solid fa-spinner animate-spin" />
                : screen === "signup" ? "Create Account" : "Sign In"}
            </button>
          </div>
        </form>

        {screen === "signup" && (
          <p className="text-center text-[10px] text-gray-400 mt-4">
            <i className="fa-solid fa-lock text-gray-300 mr-1" />
            Your password is encrypted. We never share your data.
          </p>
        )}
      </div>
    </div>
  );
}
