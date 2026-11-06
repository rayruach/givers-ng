"use client";

import { useState, useRef } from "react";
import { CATEGORIES, CATEGORY_WITH_OTHER, NG_STATES } from "@/lib/constants";
import { Gift } from "@/lib/types";

interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface Props {
  user?: AuthUser | null;
  onClose: () => void;
  onPublish: (gift: Omit<Gift, "id" | "timeAgo">) => void;
}

const MAX_IMAGES = 4;

export default function GiveModal({ user, onClose, onPublish }: Props) {
  const [title, setTitle]         = useState("");
  const [category, setCategory]   = useState<string>(CATEGORIES[0]);
  const [condition, setCondition] = useState("Like New");
  const [city, setCity]           = useState<string>(NG_STATES[24]);
  const [area, setArea]           = useState("");
  const [desc, setDesc]           = useState("");
  const [donor, setDonor]         = useState(user?.name ?? "");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [images, setImages]       = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef              = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remaining = MAX_IMAGES - images.length;
    const toProcess = files.slice(0, remaining);

    setUploading(true);

    // Upload each file to Cloudinary via /api/upload
    for (const file of toProcess) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.url) {
          setImages((prev) => [...prev, data.url].slice(0, MAX_IMAGES));
        }
      } catch (err) {
        console.error("Upload failed:", err);
      }
    }

    setUploading(false);
    e.target.value = "";
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onPublish({
      title, category, condition, city, area,
      donor: isAnonymous ? "Anonymous" : donor,
      isAnonymous,
      description: desc,
      image: images[0] ?? "https://placehold.co/600x400/f9f0eb/f02d6a?text=Givers",
      images: images.length ? images : [],
      status: "available",
      createdAt: Date.now(),
    });
    onClose();
  }

  const canAddMore = images.length < MAX_IMAGES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto relative shadow-2xl border border-charity-100">
        <button onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-warm-100 text-gray-500 hover:text-charity-500">
          <i className="fa-solid fa-xmark text-sm" />
        </button>

        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <i className="fa-solid fa-gift text-charity-500" /> List Item to Give Away
          </h3>
          <p className="text-xs text-gray-400">Post items to the Givers swipe stack.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">

          {/* Item title */}
          <div>
            <label className="block text-gray-600 font-medium mb-1">Item Title *</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. LG Standing Fan 16 Inch"
              className="w-full px-3.5 py-2.5 bg-warm-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-charity-400" />
          </div>

          {/* Category + Condition */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-600 font-medium mb-1">Category *</label>
              <select required value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-warm-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-charity-400">
                {CATEGORY_WITH_OTHER.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
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
          </div>

          {/* State + Area */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-600 font-medium mb-1">State *</label>
              <select required value={city} onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-warm-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-charity-400">
                {NG_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-gray-600 font-medium mb-1">Area / Location *</label>
              <input required value={area} onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Ikeja GRA"
                className="w-full px-3.5 py-2.5 bg-warm-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-charity-400" />
            </div>
          </div>

          {/* Photos */}
          <div>
            <label className="block text-gray-600 font-medium mb-1">
              Item Photos <span className="text-gray-400 font-normal">(up to {MAX_IMAGES})</span> *
            </label>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Preview grid */}
            <div className="grid grid-cols-4 gap-2">
              {/* Existing previews */}
              {images.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`preview ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white"
                    style={{ background: "rgba(0,0,0,0.55)", border: "none", cursor: "pointer", fontSize: 9 }}
                  >
                    <i className="fa-solid fa-xmark" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 bg-charity-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                      Cover
                    </span>
                  )}
                </div>
              ))}

              {/* Add slot */}
              {canAddMore && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="aspect-square rounded-xl border-2 border-dashed border-charity-200 bg-charity-50 flex flex-col items-center justify-center gap-1 text-charity-400 hover:bg-charity-100 transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <i className="fa-solid fa-spinner animate-spin text-lg" />
                      <span className="text-[9px] font-bold">Uploading…</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-camera text-lg" />
                      <span className="text-[9px] font-bold">Add Photo</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <p className="text-[10px] text-gray-400 mt-1.5">
              <i className="fa-solid fa-circle-info text-charity-300 mr-1" />
              First photo shows on the card. Others visible in the item detail view.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-600 font-medium mb-1">Short Description *</label>
            <textarea required rows={2} value={desc} onChange={(e) => setDesc(e.target.value)}
              placeholder="Describe condition and pickup terms..."
              className="w-full px-3.5 py-2.5 bg-warm-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-charity-400" />
          </div>

          {/* Donor name + anonymous toggle */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-gray-600 font-medium">
                Your Name / Donor Alias *
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <span className="text-[10px] text-gray-400 font-medium">Give anonymously</span>
                <div
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${isAnonymous ? "bg-charity-500" : "bg-gray-200"}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${isAnonymous ? "left-4" : "left-0.5"}`} />
                </div>
              </label>
            </div>
            <input
              required={!isAnonymous}
              disabled={isAnonymous}
              value={isAnonymous ? "Anonymous" : donor}
              onChange={(e) => setDonor(e.target.value)}
              placeholder="e.g. Aunty Blessing"
              className={`w-full px-3.5 py-2.5 border rounded-xl text-gray-700 focus:outline-none focus:border-charity-400 transition-colors ${
                isAnonymous
                  ? "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed"
                  : "bg-warm-50 border-gray-200"
              }`}
            />
            {isAnonymous ? (
              <p className="text-[10px] text-charity-400 mt-1 flex items-center gap-1">
                <i className="fa-solid fa-user-secret" />
                Your name will show as "Anonymous" on the gift card and leaderboard. Only you can see your gifts in your dashboard.
              </p>
            ) : (
              <p className="text-[10px] text-gray-400 mt-1">This is how your name appears on the gift card.</p>
            )}
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 font-medium">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-charity-500 text-white font-bold rounded-xl">
              Publish Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
