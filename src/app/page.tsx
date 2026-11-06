"use client";

import { useState, useCallback, useEffect } from "react";
import CoverPage         from "@/components/CoverPage";
import Header            from "@/components/Header";
import BottomNav         from "@/components/BottomNav";
import SwipeStack        from "@/components/SwipeStack";
import WishesFeed        from "@/components/WishesFeed";
import ProfileTab        from "@/components/ProfileTab";
import ApplyModal        from "@/components/ApplyModal";
import GiveModal         from "@/components/GiveModal";
import WishModal         from "@/components/WishModal";
import GrantModal        from "@/components/GrantModal";
import InfoModal         from "@/components/InfoModal";
import AuthModal         from "@/components/AuthModal";
import PaymentModal      from "@/components/PaymentModal";
import NotificationBell  from "@/components/NotificationBell";
import DonorsLeaderboard from "@/components/DonorsLeaderboard";
import Toast, { ToastMessage } from "@/components/Toast";
import { Gift, Wish, Tab, ThankNote, AppNotification, Application } from "@/lib/types";

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
  const [pendingApply, setPendingApply] = useState<Gift | null>(null);
  const [pendingWish, setPendingWish]   = useState(false);

  // notifications
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [focusGiftId, setFocusGiftId]     = useState<number | null>(null);

  // payment — for selected receivers
  const [payNotification, setPayNotification] = useState<AppNotification | null>(null);
  const [payApplication, setPayApplication]   = useState<Application | null>(null);

  // modals
  const [applyTarget, setApplyTarget] = useState<Gift | null>(null);
  const [infoTarget, setInfoTarget]   = useState<Gift | null>(null);
  const [grantTarget, setGrantTarget] = useState<Wish | null>(null);
  const [giveOpen, setGiveOpen]       = useState(false);
  const [wishOpen, setWishOpen]       = useState(false);

  const [claimCount, setClaimCount] = useState(0);
  const [thankNotes, setThankNotes] = useState<ThankNote[]>([]);
  const [toasts, setToasts]         = useState<ToastMessage[]>([]);

  function loadGifts() {
    fetch("/api/gifts")
      .then((r) => r.json())
      .then((d) => setGifts(d.gifts ?? []))
      .catch(() => {});
  }

  function loadNotifications() {
    if (!user) return;
    fetch("/api/notifications", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setNotifications(d.notifications ?? []);
        setUnreadCount(d.unread ?? 0);
      })
      .catch(() => {});
  }

  useEffect(() => {
    loadGifts();
    fetch("/api/wishes").then((r) => r.json()).then((d) => setWishes(d.wishes ?? [])).catch(() => {});
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.user) setUser(d.user); })
      .catch(() => {});
  }, []);

  // Poll notifications every 30s when logged in
  useEffect(() => {
    if (!user) return;
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  function addToast(text: string, type: ToastMessage["type"] = "success") {
    setToasts((t) => [...t, { id: Date.now(), text, type }]);
  }
  const removeToast = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const filteredGifts = gifts.filter((g) => {
    if (g.status !== "available") return false;
    // Don't show the logged-in user's own gifts in the swipe stack
    if (user && g.userId === user.id) return false;
    const catOk   = category === "All" || g.category === category;
    const stateOk = activeState === "all" || g.city === activeState;
    return catOk && stateOk;
  });

  /* ── Apply gate: must be logged in ── */
  function handleApply(gift: Gift) {
    if (!user) {
      setPendingApply(gift);
      setAuthOpen(true);
    } else {
      setApplyTarget(gift);
    }
  }

  /* ── Give gate: must be logged in ── */
  function handleGive() {
    if (!user) {
      setAuthOpen(true);
    } else {
      setGiveOpen(true);
    }
  }

  /* ── Wish gate: must be logged in ── */
  function handleWish() {
    if (!user) {
      setTab("wishes");
      setPendingWish(true);
      setAuthOpen(true);
    } else {
      setTab("wishes");
      setWishOpen(true);
    }
  }

  function handleAuthSuccess(authedUser: AuthUser) {
    setUser(authedUser);
    setAuthOpen(false);
    addToast(`Welcome, ${authedUser.name.split(" ")[0]}! 🎉`);
    if (pendingApply) {
      setApplyTarget(pendingApply);
      setPendingApply(null);
    }
    if (pendingWish) {
      setWishOpen(true);
      setPendingWish(false);
    }
  }

  /* ── Pay: receiver taps Pay from notification bell ── */
  async function handlePayFromNotification(notification: AppNotification) {
    if (!notification.appId || !notification.giftId) return;
    try {
      const res = await fetch(`/api/applications?mine=1`, { credentials: "include" });
      const data = await res.json();
      const app = (data.applications ?? []).find((a: Application) => a.id === notification.appId);
      if (app) {
        setPayNotification(notification);
        setPayApplication(app);
      } else {
        addToast("Application not found", "error");
      }
    } catch {
      addToast("Failed to load application", "error");
    }
  }

  function handlePaymentSuccess() {
    setPayNotification(null);
    setPayApplication(null);
    setClaimCount((c) => c + 1);
    loadGifts();
    loadNotifications();
    addToast("Payment confirmed! The Giver will be in touch to arrange handoff. 🎁");
  }

  async function handlePublishGift(gift: Omit<Gift, "id" | "timeAgo">) {
    try {
      const res = await fetch("/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(gift),
      });
      const data = await res.json();
      if (!res.ok) { addToast(data.error ?? "Failed to publish item", "error"); return; }
      loadGifts();
      addToast("Item published! 🎉");
    } catch {
      addToast("Network error. Please try again.", "error");
    }
  }

  function handlePublishWish(wish: Wish) {
    fetch("/api/wishes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: wish.name, item: wish.item, category: wish.category, city: wish.city, urgency: wish.urgency, story: wish.story }),
    })
      .then(() => fetch("/api/wishes").then((r) => r.json()).then((d) => setWishes(d.wishes ?? [])))
      .catch(() => {});
    addToast("Your wish has been posted! 🌟");
  }

  function handleGrantSuccess() {
    fetch("/api/wishes").then((r) => r.json()).then((d) => setWishes(d.wishes ?? [])).catch(() => {});
    addToast("You offered to grant this wish! 🌟");
  }

  function handleReload() { loadGifts(); addToast("Stack refreshed!", "info"); }

  function handleLogout() {
    fetch("/api/auth/logout", { method: "POST", credentials: "include" })
      .then(() => { setUser(null); setNotifications([]); setUnreadCount(0); addToast("Signed out", "info"); })
      .catch(() => {});
  }

  function markNotificationsRead(id?: number) {
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(id ? { id } : { readAll: true }),
    }).then(() => loadNotifications()).catch(() => {});
  }

  const notificationBell = (
    <NotificationBell
      notifications={notifications}
      unread={unreadCount}
      user={user}
      onMarkRead={markNotificationsRead}
      onPay={handlePayFromNotification}
      onOpenGiverDashboard={(giftId) => {
        setFocusGiftId(giftId);
        setTab("profile");
      }}
    />
  );

  return (
    <>
      {coverVisible && <CoverPage onDismiss={() => setCoverVisible(false)} />}
      <Toast toasts={toasts} onRemove={removeToast} />

      <Header
        activeCategory={category}
        onCategory={setCategory}
        activeState={activeState}
        onState={setActiveState}
        onClaim={handleApply}
        onInfo={(g) => setInfoTarget(g)}
        notificationBell={notificationBell}
      />

      <main
        className="flex-1 flex flex-col items-center justify-center px-3 py-2 sm:p-4 relative"
        style={{ paddingBottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}
      >
        <div className="w-full max-w-md flex flex-col items-center justify-center gap-4 sm:gap-5">
          {tab === "gifts" && (
            <SwipeStack
              gifts={filteredGifts}
              onClaim={handleApply}
              onReload={handleReload}
              onInfo={(g) => setInfoTarget(g)}
              onGive={handleGive}
            />
          )}
          {tab === "wishes" && (
            <WishesFeed
              wishes={wishes}
              onMakeWish={handleWish}
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
              onAuthOpen={() => setAuthOpen(true)}
              focusGiftId={focusGiftId}
              onFocusClear={() => setFocusGiftId(null)}
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
        onWish={handleWish}
      />

      {/* ── Modals ── */}
      {authOpen && (
        <AuthModal
          onClose={() => { setAuthOpen(false); setPendingApply(null); }}
          onAuth={handleAuthSuccess}
        />
      )}

      {infoTarget && (
        <InfoModal
          gift={infoTarget}
          onClose={() => setInfoTarget(null)}
          onClaim={(g) => { setInfoTarget(null); handleApply(g); }}
        />
      )}

      {applyTarget && (
        <ApplyModal
          gift={applyTarget}
          onClose={() => setApplyTarget(null)}
          onSuccess={() => {
            setApplyTarget(null);
            loadGifts();
            addToast("Application submitted! Wait for the Giver to choose. 📬");
          }}
        />
      )}

      {payNotification && payApplication && user && (
        <PaymentModal
          notification={payNotification}
          application={payApplication}
          user={user}
          onClose={() => { setPayNotification(null); setPayApplication(null); }}
          onSuccess={handlePaymentSuccess}
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
          user={user}
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
