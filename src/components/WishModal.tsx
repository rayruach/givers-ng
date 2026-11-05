"use client";

import { useState } from "react";
import { CATEGORIES, NG_STATES } from "@/lib/constants";
import { Wish } from "@/lib/types";

interface Props {
  onClose: () => void;
  onPublish: (wish: Wish) => void;
}

export default function WishModal({ onClose, onPublish }: Props) {
  const [name, setName]         = useState("");
  const [item, setItem]         = useState("");
  const [category, setCategory] = useState<string>("Other");
  const [city, setCity]         = useState<string>(NG_STATES[24]); // Lagos
  const [urgency, setUrgency]   = useState<"high" | "medium" | "low">("medium");
  const [story, setStory]       = useState("");
  const [agreed, setAgreed]     = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const wish: Wish = {
      id: Date.now(),
      name, item, category, city, urgency, story,
      timeAgo: "just now",
      granted: false,
    };
    onPublish(wish);
    // also persist to API
    fetch("/api/wishes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, item, category, city, urgency, story }),
    }).catch(() => {});
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto relative shadow-2xl border border-violet-100">

        {/* Close */}
        <button onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-violet-50 text-gray-500 hover:text-violet-500">
          <i className="fa-solid fa-xmark text-sm" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white mb-3">
            <i className="fa-solid fa-wand-magic-sparkles" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Make a Wish</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Tell the community what you need. A generous Giver may fulfil it for free.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {/* Name */}
          <div>
            <label className="block text-gray-600 font-medium mb-1">Your Name *</label>
            <input required value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chiamaka Obi"
              className="w-full px-3.5 py-2.5 bg-warm-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-violet-400" />
          </div>

          {/* Item + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-600 font-medium mb-1">Item Needed *</label>
              <input required value={item} onChange={(e) => setItem(e.target.value)}
                placeholder="e.g. School Bag"
                className="w-full px-3.5 py-2.5 bg-warm-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-violet-400" />
            </div>
            <div>
              <label className="block text-gray-600 font-medium mb-1">Category *</label>
              <select required value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-warm-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-violet-400">
                {[...CATEGORIES, "Other"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* City + Urgency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-600 font-medium mb-1">State/City *</label>
              <select required value={city} onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-warm-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-violet-400">
                {NG_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-gray-600 font-medium mb-1">Urgency *</label>
              <select required value={urgency} onChange={(e) => setUrgency(e.target.value as "high"|"medium"|"low")}
                className="w-full px-3.5 py-2.5 bg-warm-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-violet-400">
                <option value="high">Urgent</option>
                <option value="medium">Moderate</option>
                <option value="low">When Possible</option>
              </select>
            </div>
          </div>

          {/* Story */}
          <div>
            <label className="block text-gray-600 font-medium mb-1">Your Story: Why do you need this? *</label>
            <textarea required rows={3} value={story} onChange={(e) => setStory(e.target.value)}
              placeholder="Share your story. The more heartfelt, the more likely a Giver will help."
              className="w-full px-3.5 py-2.5 bg-warm-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-violet-400 leading-relaxed" />
            <p className="text-[10px] text-gray-400 mt-1">This is shown publicly to potential Givers.</p>
          </div>

          {/* Agreement */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input required type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-3.5 h-3.5 accent-violet-500 shrink-0" />
              <span className="text-[10px] text-gray-600 leading-relaxed">
                <strong className="text-gray-800">I confirm this is a genuine need.</strong>{" "}
                Making false wishes to exploit Givers violates community rules and may result in a permanent ban.
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 font-medium">Cancel</button>
            <button type="submit"
              className="px-5 py-2.5 bg-violet-600 text-white font-bold rounded-xl flex items-center gap-2">
              <i className="fa-solid fa-wand-magic-sparkles text-[10px]" /> Post Wish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
