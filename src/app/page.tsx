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
import AuthModal  from "@/components/AuthModal";
import DonorsLeaderboard from "@/components/DonorsLeaderboard";
import Toast, { ToastMessage } from "@/components/Toast";
import { Gift, Wish, Tab, ThankNote } from "@/lib/types";

interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export default function Home() {
  const [coverVisible, setCoverVisible] = useState(true);
  const [tab, setTab]                   = useState<Tab>("gifts");
  const [category, setCategory]         = useState("All");
  const [activeState, setActiveState]   = useState("all");
  const [gifts, setGifts]               = useState<Gift[]>([]);
  const [wishes, setWishes]             = useState<Wish[]>([]);

  // auth
  const [user, setUser]                 = useState<AuthUser | null>(null);
  const [authOpen, setAuthOpen]         = useState(false);
  const [pendingClaim, setPendingClaim] = useState<Gift | null>(null);

  const [claimTarget, setClaimTarget]   = useState<Gift | null>(null);
  const [infoTarget, setInfoTarget]     = useState<Gift | null>(null);
  const [grantTarget, setGrantTarget]   = useState<Wish | null>(null);
  const [giveOpen, setGiveOpen]         = useState(false);
  const [wishOpen, setWishOpen]         = useState(false);
  const [claimCount, setClaimCount]     = useState(0);
  const [thankNotes, setThankNotes]     = useState<ThankNote[]>([]);
  const [toasts, setToasts]             = useState<ToastMessage[]>([]);

  /* Load gifts, wishes, and check auth on mount */
  function loadGifts() {
    fetch("/api/gifts")
      .then((r) => {
        if (!r.ok) throw new Error(`API returned ${r.status}`);
        return r.json();
      })
      .then((d) => {
        console.log("loadGifts response:", d);
        setGifts(d.gifts ?? []);
      })
      .catch((err) => console.error("loadGifts failed:", err));
  }

  useEffect(() => {
    loadGifts();
    fetch("/api/wishes")
      .then((r) => r.json())
      .then((d) => setWishes(d.wishes ?? []))
      .catch(() => {});
    // Check if already logged in
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.user) setUser(d.user); })
      .catch(() => {});
  }, []);

  function addToast(text: string, type: ToastMessage["type"] = "success") {
    setToasts((t) => [...t, { id: Date.now(), text, type }]);
  }
  const removeToast = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  /* filtered gifts */
  const filteredGifts = gifts.filter((g) => {
    if (g.status !== "available") return false;
    const catOk   = category === "All" || g.category === category;
    const stateOk = activeState === "all" || g.city === activeState;
    return catOk && stateOk;
  });

  /* ── claim gate: check auth before opening claim modal ── */
  function handleClaim(gift: Gift) {
    if (!user) {
      setPendingClaim(gift);
      setAuthOpen(true);
    } else {
      setClaimTarget(gift);
    }
  }

  /* ── give gate: no account required, but if logged in we pre-fill their name ── */
  function handleGive() {
    setGiveOpen(true);
  }

  function handleAuthSuccess(authedUser: AuthUser) {
    setUser(authedUser);
    setAuthOpen(false);
    addToast(`Welcome, ${authedUser.name.split(" ")[0]}! 🎉`);
    // If they were trying to claim a gift, open the claim modal now
    if (pendingClaim) {
      setClaimTarget(pendingClaim);
      setPendingClaim(null);
    }
  }

  /* ── handlers ── */
  function handleClaimSuccess(note: ThankNote) {
    setClaimCount((c) => c + 1);
    setThankNotes((n) => [note, ...n]);
    loadGifts();
    addToast("Request sent! The Giver will contact you within 24h. 🎁");
  }

  async function handlePublishGift(gift: Omit<Gift, "id" | "timeAgo">) {
    try {
      const res = await fetch("/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gift),
      });

      if (!res.ok) {
        const data = await res.json();
        addToast(data.error ?? "Failed to publish item", "error");
        return;
      }

      await loadGifts();
      addToast("Item published to the swipe stack! 🎉");
    } catch {
      addToast("Network error. Please try again.", "error");
    }
  }

  function handlePublishWish(wish: Wish) {
    fetch("/api/wishes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: wish.name, item: wish.item, category: wish.category,
        city: wish.city, urgency: wish.urgency, story: wish.story,
      }),
    })
      .then(() => {
        fetch("/api/wishes")
          .then((r) => r.json())
          .then((d) => setWishes(d.wishes ?? []))
          .catch(() => {});
      })
      .catch(() => {});
    addToast("Your wish has been posted! 🌟");
  }

  function handleGrantSuccess() {
    fetch("/api/wishes")
      .then((r) => r.json())
      .then((d) => setWishes(d.wishes ?? []))
      .catch(() => {});
    addToast("You offered to grant this wish! 🌟");
  }

  function handleReload() {
    loadGifts();
    addToast("Stack refreshed!", "info");
  }

  function handleLogout() {
    fetch("/api/auth/logout", { method: "POST" })
      .then(() => { setUser(null); addToast("Signed out", "info"); })
      .catch(() => {});
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
        onClaim={handleClaim}
        onInfo={(g) => setInfoTarget(g)}
      />

      <main
        className="flex-1 flex flex-col items-center justify-center px-3 py-2 sm:p-4 relative"
        style={{ paddingBottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}
      >
        <div className="w-full max-w-md flex flex-col items-center justify-center gap-4 sm:gap-5">

          {tab === "gifts" && (
            <SwipeStack
              gifts={filteredGifts}
              onClaim={handleClaim}
              onReload={handleReload}
              onInfo={(g) => setInfoTarget(g)}
              onGive={handleGive}
            />
          )}

          {tab === "wishes" && (
            <WishesFeed
              wishes={wishes}
              onMakeWish={() => setWishOpen(true)}
              onGrant={(w) => setGrantTarget(w)}
            />
          )}

          {tab === "donors" && <DonorsLeaderboard />}

          {tab === "profile" && (
            <ProfileTab
              claimCount={claimCount}
              thankNotes={thankNotes}
              user={user}
              onLogout={handleLogout}
            />
          )}

        </div>
      </main>

      <BottomNav
        tab={tab}
        onTab={setTab}
        wishCount={wishes.filter((w) => !w.granted).length}
        claimCount={claimCount}
        isLoggedIn={!!user}
        onGive={handleGive}
        onWish={() => { setTab("wishes"); setWishOpen(true); }}
      />

      {/* ── Modals ── */}
      {authOpen && (
        <AuthModal
          onClose={() => { setAuthOpen(false); setPendingClaim(null); }}
          onAuth={handleAuthSuccess}
        />
      )}

      {infoTarget && (
        <InfoModal
          gift={infoTarget}
          onClose={() => setInfoTarget(null)}
          onClaim={(g) => { setInfoTarget(null); handleClaim(g); }}
        />
      )}

      {claimTarget && (
        <ClaimModal
          gift={claimTarget}
          user={user}
          onClose={() => setClaimTarget(null)}
          onSuccess={(note) => { handleClaimSuccess(note); setClaimTarget(null); }}
        />
      )}

      {giveOpen && (
        <GiveModal
          user={user}
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
