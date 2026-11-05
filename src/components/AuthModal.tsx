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

export default function AuthModal({ onClose, onAuth }: Props) {
  const [mode, setMode]       = useState<"login" | "signup">("signup");
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [phone, setPhone]     = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const body =
        mode === "signup"
          ? { name, email, phone, password }
          : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setLoading(false);
        return;
      }

      onAuth(data.user);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto relative shadow-2xl border border-charity-100">

        <button onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-warm-100 text-gray-500 hover:text-charity-500">
          <i className="fa-solid fa-xmark text-sm" />
        </button>

        {/* Header */}
        <div className="mb-5">
          <div className="w-10 h-10 rounded-xl bg-charity-500 flex items-center justify-center text-white mb-3">
            <i className="fa-solid fa-user-lock" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">
            {mode === "signup" ? "Create Your Account" : "Welcome Back"}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {mode === "signup"
              ? "You need an account to claim gifts. It's free."
              : "Sign in to continue claiming gifts."}
          </p>
        </div>

        {/* Tab toggle */}
        <div className="flex bg-warm-100 rounded-xl p-1 mb-4">
          <button
            onClick={() => { setMode("signup"); setError(""); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${mode === "signup" ? "bg-white text-charity-500 shadow-sm" : "text-gray-400"}`}
          >
            Sign Up
          </button>
          <button
            onClick={() => { setMode("login"); setError(""); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${mode === "login" ? "bg-white text-charity-500 shadow-sm" : "text-gray-400"}`}
          >
            Log In
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {mode === "signup" && (
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

          {mode === "signup" && (
            <div>
              <label className="block text-gray-600 font-medium mb-1">Phone Number</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="08012345678"
                className="w-full px-3.5 py-2.5 bg-warm-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-charity-400" />
            </div>
          )}

          <div>
            <label className="block text-gray-600 font-medium mb-1">Password *</label>
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "Choose a password (min 6 chars)" : "Enter your password"}
              minLength={6}
              className="w-full px-3.5 py-2.5 bg-warm-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-charity-400" />
          </div>

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
                : mode === "signup" ? "Create Account" : "Sign In"}
            </button>
          </div>
        </form>

        {mode === "signup" && (
          <p className="text-center text-[10px] text-gray-400 mt-4">
            <i className="fa-solid fa-lock text-gray-300 mr-1" />
            Your password is encrypted. We never share your data.
          </p>
        )}
      </div>
    </div>
  );
}
