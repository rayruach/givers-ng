"use client";

import { useState, useCallback, useEffect } from "react";
import CoverPage  from "@/components/CoverPage";
import Header     from "@/components/Header";
import BottomNav  from "@/components/BottomNav";
import SwipeStack from "@/components/SwipeStack";
import WishesFeed from "@/components/WishesFeed";
import ProfileTab from "@/components/ProfileTab";
import ClaimModal from "@/components/ClaimModal";
import GiveModal  from "@/components/GiveModal";
import WishModal  from "@/components/WishModal";
import GrantModal from "@/components/GrantModal";
import InfoModal  from "@/components/InfoModal";
import Toast, { ToastMessage } from "@/components/Toast";
import { Gift, Wish, Tab, ThankNote } from "@/lib/types";
import { SAMPLE_GIFTS } from "@/lib/constants";

export default function Home() {
  const [coverVisible, setCoverVisible] = useState(true);
  const [tab, setTab]                   = useState<Tab>("gifts");
  const [category, setCategory]         = useState("All");
  const [activeState, setActiveState]   = useState("all");
  const [gifts, setGifts]               = useState<Gift[]>(SAMPLE_GIFTS);
  const [wishes, setWishes]             = useState<Wish[]>([]);
  const [claimTarget, setClaimTarget]   = useState<Gift | null>(null);
  const [infoTarget, setInfoTarget]     = useState<Gift | null>(null);
  const [grantTarget, setGrantTarget]   = useState<Wish | null>(null);
  const [giveOpen, setGiveOpen]         = useState(false);
  const [wishOpen, setWishOpen]         = useState(false);
  const [claimCount, setClaimCount]     = useState(0);
  const [thankNotes, setThankNotes]     = useState<ThankNote[]>([]);
  const [toasts, setToasts]             = useState<ToastMessage[]>([]);

  /* Load wishes from API on mount */
  useEffect(() => {
    fetch("/api/wishes")
      .then((r) => r.json())
      .then((d) => setWishes(d.wishes ?? []))
      .catch(() => {});
  }, []);

  function addToast(text: string, type: ToastMessage["type"] = "success") {
    setToasts((t) => [...t, { id: Date.now(), text, type }]);
  }
  const removeToast = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  /* filtered gifts — only show available ones in the public feed */
  const filteredGifts = gifts.filter((g) => {
    if (g.status !== "available") return false;
    const catOk   = category === "All" || g.category === category;
    const stateOk = activeState === "all" || g.city === activeState;
    return catOk && stateOk;
  });

  /* ── handlers ── */
  function handleClaimSuccess(note: ThankNote) {
    setClaimCount((c) => c + 1);
    setGifts((prev) => prev.filter((g) => g.id !== claimTarget?.id));
    setThankNotes((n) => [note, ...n]);
    addToast("Request sent! The Giver will contact you within 24h. 🎁");
  }

  function handlePublishGift(gift: Omit<Gift, "id" | "timeAgo">) {
    const newGift: Gift = { ...gift, id: Date.now(), timeAgo: "just now", status: "available", createdAt: Date.now() };
    setGifts((prev) => [newGift, ...prev]);
    fetch("/api/gifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(gift),
    }).catch(() => {});
    addToast("Item published to the swipe stack! 🎉");
  }

  function handlePublishWish(wish: Wish) {
    setWishes((w) => [wish, ...w]);
    addToast("Your wish has been posted! 🌟");
  }

  function handleGrantSuccess() {
    if (!grantTarget) return;
    setWishes((prev) =>
      prev.map((w) => w.id === grantTarget.id ? { ...w, granted: true } : w)
    );
    addToast(`You offered to grant: "${grantTarget.item}" 🌟`);
  }

  function handleReload() {
    setGifts(SAMPLE_GIFTS.map((g) => ({ ...g, status: "available" as const })));
    addToast("Stack refreshed!", "info");
  }

  return (
    <>
      {coverVisible && <CoverPage onDismiss={() => setCoverVisible(false)} />}

      <Toast toasts={toasts} onRemove={removeToast} />

      <Header
        activeCategory={category}
        onCategory={setCategory}
        activeState={activeState}
        onState={setActiveState}
      />

      <main
        className="flex-1 flex flex-col items-center justify-center px-3 py-2 sm:p-4 relative"
        style={{ paddingBottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}
      >
        <div className="w-full max-w-md flex flex-col items-center justify-center gap-4 sm:gap-5">

          {tab === "gifts" && (
            <SwipeStack
              gifts={filteredGifts}
              onClaim={(g) => setClaimTarget(g)}
              onReload={handleReload}
              onInfo={(g) => setInfoTarget(g)}
              onGive={() => setGiveOpen(true)}
            />
          )}

          {tab === "wishes" && (
            <WishesFeed
              wishes={wishes}
              onMakeWish={() => setWishOpen(true)}
              onGrant={(w) => setGrantTarget(w)}
            />
          )}

          {tab === "profile" && (
            <ProfileTab claimCount={claimCount} thankNotes={thankNotes} />
          )}

        </div>
      </main>

      <BottomNav
        tab={tab}
        onTab={setTab}
        wishCount={wishes.filter((w) => !w.granted).length}
        claimCount={claimCount}
        onGive={() => setGiveOpen(true)}
        onWish={() => { setTab("wishes"); setWishOpen(true); }}
      />

      {/* ── Modals ── */}
      {infoTarget && (
        <InfoModal
          gift={infoTarget}
          onClose={() => setInfoTarget(null)}
          onClaim={(g) => { setInfoTarget(null); setClaimTarget(g); }}
        />
      )}

      {claimTarget && (
        <ClaimModal
          gift={claimTarget}
          onClose={() => setClaimTarget(null)}
          onSuccess={(note) => { handleClaimSuccess(note); setClaimTarget(null); }}
        />
      )}

      {giveOpen && (
        <GiveModal
          onClose={() => setGiveOpen(false)}
          onPublish={handlePublishGift}
        />
      )}

      {wishOpen && (
        <WishModal
          onClose={() => setWishOpen(false)}
          onPublish={handlePublishWish}
        />
      )}

      {grantTarget && (
        <GrantModal
          wish={grantTarget}
          onClose={() => setGrantTarget(null)}
          onSuccess={handleGrantSuccess}
        />
      )}
    </>
  );
}
