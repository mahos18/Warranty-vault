"use client";

import { useState, useEffect } from "react";

interface Props {
  onComplete: () => void;
}

type Step = "intro" | "phone" | "done";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function NotificationSetupModal({ onComplete }: Props) {
  const [step, setStep] = useState<Step>("intro");
  const [phone, setPhone] = useState("");
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if ("Notification" in window) setNotifPermission(Notification.permission);
  }, []);

  async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return null;
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      return reg;
    } catch (err) {
      console.error("SW registration failed:", err);
      return null;
    }
  }

  // async function subscribeToPush(registration: ServiceWorkerRegistration) {
  //   try {
  //     const subscription = await registration.pushManager.subscribe({
  //       userVisibleOnly: true,
  //       applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  //     });

  //     const sub = subscription.toJSON();

  //     await fetch("/api/notifications/subscribe", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         endpoint: sub.endpoint,
  //         keys: { p256dh: sub.keys?.p256dh, auth: sub.keys?.auth },
  //       }),
  //     });

  //     return true;
  //   } catch (err) {
  //     console.error("Push subscribe failed:", err);
  //     return false;
  //   }
  // }

  async function subscribeToPush(registration: ServiceWorkerRegistration) {
  try {
    if (!VAPID_PUBLIC_KEY) {
      console.error("VAPID public key is not set");
      return false;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as ArrayBuffer,
    });

    const sub = subscription.toJSON();

    if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
      console.error("Incomplete subscription object");
      return false;
    }

    const res = await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Subscribe API error:", err);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Push subscribe failed:", err);
    return false;
  }
}

  async function requestNotificationPermission() {
    if (!("Notification" in window)) {
      setStep("phone");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotifPermission(permission);

    if (permission === "granted") {
      const reg = await registerServiceWorker();
      if (reg) await subscribeToPush(reg);
    }

    setStep("phone");
  }

  async function handleSubmit() {
    setError("");

    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      setError("Enter a valid 10-digit Indian mobile number");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/setup", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          notificationsEnabled: notifPermission === "granted",
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      setStep("done");
      setTimeout(() => onComplete(), 1200);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSkip() {
    fetch("/api/user/setup", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "", notificationsEnabled: false }),
    });
    onComplete();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-md rounded-t-3xl px-6 pt-6 pb-10 animate-fade-up"
        style={{ background: "#fff" }}>
        <div className="w-10 h-1 rounded-full mx-auto mb-6" style={{ background: "#E5E7EB" }} />

        {/* ── INTRO ── */}
        {step === "intro" && (
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: "var(--primary-light)" }}>
              🔔
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
                Stay Ahead of Expiries
              </h2>
              <p className="text-sm font-medium mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Enable notifications so we can alert you before your warranties expire.
              </p>
            </div>

            <div className="w-full flex flex-col gap-2 mt-1">
              {[
                { icon: "⏰", text: "30-day expiry reminder" },
                { icon: "🚨", text: "7-day urgent alert" },
                { icon: "✅", text: "Claim step guidance" },
              ].map((b) => (
                <div key={b.text}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-left"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <span className="text-lg">{b.icon}</span>
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {b.text}
                  </span>
                </div>
              ))}
            </div>

            <button onClick={requestNotificationPermission}
              className="w-full py-4 rounded-2xl font-bold text-white text-base mt-2 active:scale-95 transition-transform"
              style={{ background: "var(--primary)" }}>
              Enable Notifications
            </button>
            <button onClick={handleSkip}
              className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
              Skip for now
            </button>
          </div>
        )}

        {/* ── PHONE ── */}
        {step === "phone" && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
              style={{
                background: notifPermission === "granted" ? "var(--green-bg)" : "var(--amber-bg)",
                border: `1px solid ${notifPermission === "granted" ? "#BBF7D0" : "#FDE68A"}`,
              }}>
              <span className="text-lg">{notifPermission === "granted" ? "✅" : "⚠️"}</span>
              <p className="text-sm font-semibold"
                style={{ color: notifPermission === "granted" ? "var(--green)" : "var(--amber)" }}>
                {notifPermission === "granted"
                  ? "Push notifications enabled"
                  : "Notifications blocked — enable in browser settings"}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
                Add Your Mobile Number
              </h2>
              <p className="text-sm font-medium mt-1" style={{ color: "var(--text-secondary)" }}>
                For future SMS reminders when warranties are about to expire.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--text-secondary)" }}>
                Mobile Number
              </label>
              <div className="flex items-center rounded-xl overflow-hidden"
                style={{ border: "1.5px solid var(--border)", background: "var(--surface)" }}>
                <span className="px-4 py-3.5 text-sm font-bold border-r"
                  style={{ color: "var(--text-secondary)", borderColor: "var(--border)", background: "var(--bg)" }}>
                  +91
                </span>
                <input type="tel" value={phone}
                  onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setError(""); }}
                  placeholder="9876543210"
                  className="flex-1 px-4 py-3.5 text-sm font-medium outline-none bg-transparent"
                  style={{ color: "var(--text-primary)" }} maxLength={10} />
              </div>
              {error && <p className="text-xs font-semibold" style={{ color: "var(--red)" }}>{error}</p>}
              <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                Optional — skip if you prefer only browser notifications
              </p>
            </div>

            <button onClick={handleSubmit} disabled={loading}
              className="w-full py-4 rounded-2xl font-bold text-white text-base active:scale-95 transition-transform disabled:opacity-60"
              style={{ background: "var(--primary)" }}>
              {loading ? "Saving..." : "Save & Continue →"}
            </button>
            <button onClick={handleSubmit}
              className="text-sm font-semibold text-center" style={{ color: "var(--text-muted)" }}>
              Skip mobile number
            </button>
          </div>
        )}

        {/* ── DONE ── */}
        {step === "done" && (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
              style={{ background: "var(--green-bg)" }}>
              ✅
            </div>
            <h2 className="text-xl font-extrabold" style={{ color: "var(--text-primary)" }}>
              You&apos;re all set!
            </h2>
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              We&apos;ll notify you before your warranties expire.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}