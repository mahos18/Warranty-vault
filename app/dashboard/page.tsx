"use client";

import { useState, useEffect } from "react";
import { useUser,UserButton } from "@clerk/nextjs";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import NotificationSetupModal from "@/components/NotificationSetupModal";

type FilterTab = "all" | "active" | "expiring" | "expired";

interface Product {
  _id: string;
  productName: string;
  brand: string;
  category: string;
  warrantyExpiryDate: string;
  warrantyStatus: "active" | "expiring" | "expired";
  purchaseDate: string;
  warrantyDurationMonths: number;
  purchaseAmount?: number;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [showModal, setShowModal] = useState(false);
  const [setupChecked, setSetupChecked] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;

    async function checkSetup() {
      try {
        const res = await fetch("/api/user/setup");
        const data = await res.json();
        console.log("Setup data:", data);
        setShowModal(!data.notificationsSetup);
      } catch (err) {
        console.error("Setup check failed:", err);
        setShowModal(true);
      } finally {
        setSetupChecked(true);
      }
    }

    checkSetup();
  }, [isLoaded, user]);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    total: products.length,
    active: products.filter((p) => p.warrantyStatus === "active").length,
    expiring: products.filter((p) => p.warrantyStatus === "expiring").length,
    expired: products.filter((p) => p.warrantyStatus === "expired").length,
  };

  const totalValue = products.reduce((s, p) => s + (p.purchaseAmount ?? 0), 0);

  const filtered =
    activeTab === "all" ? products : products.filter((p) => p.warrantyStatus === activeTab);

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.total },
    { key: "active", label: "Active", count: counts.active },
    { key: "expiring", label: "Expiring", count: counts.expiring },
    { key: "expired", label: "Expired", count: counts.expired },
  ];

  return (
    <>
      {/* ── Notification Setup Modal — INSIDE return, renders over dashboard ── */}
      {setupChecked && showModal && (
        <NotificationSetupModal onComplete={() => setShowModal(false)} />
      )}

      <div className="animate-fade-up">
        {/* ── Header ── */}
        <div className="flex items-start justify-between px-5 pt-12 pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              {getGreeting()}, {user?.firstName ?? "there"} 👋
            </h2>
            <p className="text-sm mt-0.5 font-medium" style={{ color: "var(--text-muted)" }}>
              Your warranties at a glance
            </p>
          </div>
          <UserButton />
        </div>

        {/* ── Quick Actions ── */}
        <div className="flex gap-2 px-5 pb-5 no-scrollbar overflow-x-auto">
          <Link
            href="/add-product"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold text-white flex-shrink-0 active:scale-95 transition-transform"
            style={{ background: "var(--primary)" }}
          >
            <span className="text-base leading-none">＋</span> Add Warranty
          </Link>
          <Link
            href="/service"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold flex-shrink-0 active:scale-95 transition-transform"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          >
            🔧 Service
          </Link>
          <Link
            href="/assistant"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold flex-shrink-0 active:scale-95 transition-transform"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          >
            🤖 Assistant
          </Link>
        </div>

        {/* ── Summary Card ── */}
        <div className="px-5">
          <div
            className="rounded-2xl p-6 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)" }}
          >
            <div className="absolute w-44 h-44 rounded-full -top-14 -right-10"
              style={{ background: "rgba(255,255,255,0.07)" }} />

            <p className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: "rgba(255,255,255,0.65)" }}>
              Warranty Summary
            </p>

            <div className="flex mb-5">
              {[
                { label: "Active", value: counts.active, color: "#fff" },
                { label: "Expiring", value: counts.expiring, color: "#FCD34D" },
                { label: "Expired", value: counts.expired, color: "#FCA5A5" },
              ].map((s, i, arr) => (
                <div
                  key={s.label}
                  className="flex-1"
                  style={{
                    borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.15)" : "none",
                    paddingRight: i < arr.length - 1 ? "16px" : "0",
                    marginRight: i < arr.length - 1 ? "16px" : "0",
                  }}
                >
                  <p className="text-3xl font-extrabold leading-none tracking-tight" style={{ color: s.color }}>
                    {loading ? "—" : s.value}
                  </p>
                  <p className="text-xs font-medium mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-lg px-4 py-2.5 flex items-center justify-between"
              style={{ background: "rgba(255,255,255,0.12)" }}>
              <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>
                🔒 Total Protected Value
              </span>
              <span className="text-lg font-extrabold text-white tracking-tight">
                {loading ? "—" : `₹${totalValue.toLocaleString("en-IN")}`}
              </span>
            </div>
          </div>
        </div>

        {/* ── Product List Header ── */}
        <div className="flex items-center justify-between px-5 pt-6 pb-3">
          <h3 className="text-base font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Your Products
          </h3>
          <span className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
            {counts.total} total
          </span>
        </div>

        {/* ── Filter Pills ── */}
        <div className="flex gap-2 px-5 pb-4 no-scrollbar overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
              style={
                activeTab === tab.key
                  ? { background: "var(--primary)", color: "#fff", border: "1.5px solid var(--primary)" }
                  : { background: "var(--bg)", color: "var(--text-secondary)", border: "1.5px solid var(--border)" }
              }
            >
              {tab.label} {tab.count > 0 && `(${tab.count})`}
            </button>
          ))}
        </div>

        {/* ── Products ── */}
        <div className="px-5 flex flex-col gap-2.5 pb-4">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "var(--surface)" }} />
            ))
          ) : filtered.length === 0 ? (
            <div className="text-center py-14">
              <p className="text-4xl mb-3">📭</p>
              <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                {activeTab === "all" ? "No products yet" : `No ${activeTab} warranties`}
              </p>
              {activeTab === "all" && (
                <Link
                  href="/add-product"
                  className="inline-block mt-4 px-6 py-3 rounded-2xl text-sm font-bold text-white active:scale-95 transition-transform"
                  style={{ background: "var(--primary)" }}
                >
                  Add your first product
                </Link>
              )}
            </div>
          ) : (
            filtered.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))
          )}
        </div>
      </div>
    </>
  );
}