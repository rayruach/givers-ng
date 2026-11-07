"use client";

import { useState } from "react";
import { Wish } from "@/lib/types";

interface Props {
  wish: Wish | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function GrantModal({ wish, onClose, onSuccess }: Props) {
  const [name, setName]         = useState("");
  const [phone, setPhone]       = useState("");
  const [condition, setCondition] = useState("Like New");
  const [area, setArea]         = useState("");
  const [message, setMessage]   = useState("");
  const [success, setSuccess]   = useState(false);

  if (!wish) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(true);
    onSuccess();
  }

  function handleClose() {
    setSuccess(false);
    setName(""); setPhone(""); setArea(""); setMessage("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl relative shadow-2xl border border-charity-100 overflow-hidden">

        <button onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-warm-100 text-gray-500 hover:text-charity-500 z-10">
          <i className="fa-solid fa-xmark text-sm" />
        </button>

        {!success ? (
          <>
            <div className="px-5 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-charity-500 flex items-center justify-center text-white shrink-0">
                  <i className="fa-solid fa-star text-sm" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-bold text-charity-500 tracking-wider">Granting Wish</div>
                  <h3 className="text-sm font-bold text-black leading-tight truncate">{wish.item}</h3>
                  <p className="text-xs text-gray-600 mt-0.5">by {wish.name} · {wish.city}</p>
                </div>
              </div>
              <div className="mt-3 p-2.5 rounded-xl bg-warm-100 border border-warm-200">
                <p className="text-[10px] text-gray-700 leading-relaxed italic line-clamp-3">"{wish.story}"</p>
              </div>
            </div>

            <div className="px-5 pb-5 pt-4 max-h-[60vh] overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Your Name (Giver) *</label>
                  <input required value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tunde Bakare"
                    className="w-full px-3.5 py-2.5 bg-warm-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-charity-400" />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Phone Number *</label>
                  <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="08012345678"
                    className="w-full px-3.5 py-2.5 bg-warm-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-charity-400" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-600 font-medium mb-1">Item Condition *</label>
                    <select required value={condition} onChange={(e) => setCondition(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-warm-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-charity-400">
                      <option>Like New</option>
                      <option>Gently Used</option>
                      <option>Fair</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-600 font-medium mb-1">Your Area *</label>
                    <input required value={area} onChange={(e) => setArea(e.target.value)}
                      placeholder="e.g. Ikeja"
                      className="w-full px-3.5 py-2.5 bg-warm-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-charity-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">
                    Message to Wisher <span className="text-gray-500 font-normal">(optional)</span>
                  </label>
                  <textarea rows={2} value={message} onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. I have this item ready, let's arrange pickup..."
                    className="w-full px-3.5 py-2.5 bg-warm-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-charity-400" />
                </div>
                <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                  <button type="button" onClick={handleClose} className="px-4 py-2 text-gray-500 font-medium">Cancel</button>
                  <button type="submit"
                    className="px-5 py-2.5 bg-charity-500 text-white font-bold rounded-xl flex items-center gap-2">
                    <i className="fa-solid fa-heart text-[10px]" /> Grant this Wish
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="px-5 pb-6 pt-5 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-charity-50 border-2 border-charity-200 flex items-center justify-center text-charity-500 text-2xl mb-3">
              <i className="fa-solid fa-star animate-bounce" />
            </div>
            <h3 className="text-base font-bold text-black">You are a Star!</h3>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              Your offer to grant this wish has been sent. The wisher will be in touch with you soon.
            </p>
            <button onClick={handleClose}
              className="mt-5 w-full py-3 bg-charity-500 text-white font-bold text-xs rounded-xl">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
