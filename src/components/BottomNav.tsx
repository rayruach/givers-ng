"use client";

import { useState } from "react";
import { Tab } from "@/lib/types";

interface Props {
  tab: Tab;
  onTab: (t: Tab) => void;
  wishCount: number;
  claimCount: number;
  onGive: () => void;
  onWish: () => void;
}

export default function BottomNav({ tab, onTab, wishCount, claimCount, onGive, onWish }: Props) {
  const [fabOpen, setFabOpen] = useState(false);

  function toggleFab() { setFabOpen((v) => !v); }
  function closeFab()  { setFabOpen(false); }

  return (
    <>
      {/* FAB backdrop */}
      {fabOpen && (
        <div
          className="fixed inset-0 bg-black/25 backdrop-blur-sm"
          style={{ zIndex: 44 }}
          onClick={closeFab}
        />
      )}

      {/* FAB fan menu */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 flex flex-col items-center gap-2.5 ${fabOpen ? "fab-menu-open" : ""}`}
        style={{
          bottom: 72,
          zIndex: 45,
          paddingBottom: "env(safe-area-inset-bottom)",
          pointerEvents: fabOpen ? "auto" : "none",
        }}
      >
        <button className="fab-option" onClick={() => { closeFab(); onGive(); }}>
          <span className="fab-icon" style={{ background: "#f02d6a" }}>
            <i className="fa-solid fa-gift" />
          </span>
          Give an Item
        </button>
        <button className="fab-option" onClick={() => { closeFab(); onTab("wishes"); onWish(); }}>
          <span className="fab-icon" style={{ background: "#7c3aed" }}>
            <i className="fa-solid fa-wand-magic-sparkles" />
          </span>
          Make a Wish
        </button>
      </div>

      {/* Nav bar */}
      <nav
        className="bottom-nav fixed bottom-0 left-0 right-0 z-40"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="max-w-md mx-auto flex items-stretch">
          <button
            className={`bnav-btn ${tab === "gifts" ? "active-gifts" : ""}`}
            onClick={() => onTab("gifts")}
          >
            <i className="fa-solid fa-gift" />
            <span>Gifts</span>
          </button>

          <button
            className={`bnav-btn ${tab === "wishes" ? "active-wishes" : ""}`}
            onClick={() => onTab("wishes")}
          >
            <i className="fa-solid fa-wand-magic-sparkles" />
            <span>Wishes</span>
            {wishCount > 0 && <span className="bnav-badge">{wishCount}</span>}
          </button>

          <button className="bnav-center" onClick={toggleFab}>
            <div className={`bnav-center-btn ${fabOpen ? "open" : ""}`}>
              <i className="fa-solid fa-plus" />
            </div>
            <span className="bnav-center-label">Post</span>
          </button>

          <button
            className={`bnav-btn ${tab === "profile" ? "active-profile" : ""}`}
            onClick={() => onTab("profile")}
          >
            <i className="fa-solid fa-user" />
            <span>Profile</span>
            {claimCount > 0 && <span className="bnav-badge">{claimCount}</span>}
          </button>
        </div>
      </nav>
    </>
  );
}
