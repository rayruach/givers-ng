"use client";

import { useState } from "react";
import { Gift } from "@/lib/types";

interface Props {
  gift: Gift;
  onClose: () => void;
  onSaved: (updated: Gift) => void;
}

export default function EditGiftModal({ gift, onClose, onSaved }: Props) {
  const [title, setTitle]       = useState(gift.title);
  const [description, setDesc]  = useState(gift.description);
  const [condition, setCondition] = useState(gift.condition);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/gifts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: gift.id,
          title: title.trim(),
          description,
          condition,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update gift");
        setLoading(false);
        return;
      }

      onSaved({ ...gift, title: title.trim(), description, condition });
      onClose();
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 relative shadow-2xl border border-charity-100">

        <button onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-warm-100 text-gray-500 hover:text-charity-500">
          <i className="fa-solid fa-xmark text-sm" />
        </button>

        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <i className="fa-solid fa-pen text-charity-500" /> Edit Gift
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            You can edit the title, description, and condition. Category and location cannot be changed as people may have applied based on them.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-gray-600 font-medium mb-1">Title *</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-warm-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-charity-400" />
          </div>

          <div>
            <label className="block text-gray-600 font-medium mb-1">Description *</label>
            <textarea required rows={3} value={description} onChange={(e) => setDesc(e.target.value)}
              placeholder="Describe condition, any defects, and pickup terms..."
              className="w-full px-3.5 py-2.5 bg-warm-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-charity-400 resize-none" />
          </div>

          <div>
            <label className="block text-gray-600 font-medium mb-1">Condition *</label>
            <select required value={condition} onChange={(e) => setCondition(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-warm-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-charity-400">
              <option>Like New</option>
              <option>Gently Used</option>
              <option>Fair</option>
            </select>
          </div>

          {/* Locked fields notice */}
          <div className="p-3 bg-warm-50 border border-warm-200 rounded-xl text-[10px] text-gray-400 flex items-start gap-2">
            <i className="fa-solid fa-lock text-gray-300 mt-0.5 shrink-0" />
            Category, state, and area are locked. Applicants chose based on those details.
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation shrink-0" /> {error}
            </div>
          )}

          <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 font-medium">Cancel</button>
            <button type="submit" disabled={loading}
              className="px-5 py-2.5 bg-charity-500 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-50">
              {loading ? <i className="fa-solid fa-spinner animate-spin" /> : <><i className="fa-solid fa-check text-[10px]" /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
