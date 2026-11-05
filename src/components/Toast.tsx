"use client";

import { useEffect } from "react";

export interface ToastMessage {
  id: number;
  text: string;
  type?: "success" | "error" | "info";
}

interface Props {
  toasts: ToastMessage[];
  onRemove: (id: number) => void;
}

const ICONS = { success: "fa-circle-check", error: "fa-circle-exclamation", info: "fa-circle-info" };
const COLORS = { success: "#16a34a", error: "#dc2626", info: "#f02d6a" };

export default function Toast({ toasts, onRemove }: Props) {
  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none w-full max-w-xs px-4">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: number) => void }) {
  const type = toast.type ?? "info";

  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div
      className="pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl text-white text-xs font-semibold shadow-lg"
      style={{ background: COLORS[type] }}
    >
      <i className={`fa-solid ${ICONS[type]} text-sm`} />
      {toast.text}
    </div>
  );
}
