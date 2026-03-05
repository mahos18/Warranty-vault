"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Product {
  _id: string;
  productName: string;
  brand: string;
  category: string;
  warrantyStatus: "active" | "expiring" | "expired";
}

const CATEGORY_EMOJI: Record<string, string> = {
  Electronics: "📱", Appliances: "🏠", Vehicles: "🚗",
  Furniture: "🛋️", Tools: "🔧", Other: "📦",
};

const STATUS_STYLE = {
  active:   { color: "#16A34A", bg: "#F0FDF4", label: "Active" },
  expiring: { color: "#D97706", bg: "#FFFBEB", label: "Expiring" },
  expired:  { color: "#DC2626", bg: "#FEF2F2", label: "Expired" },
};

export default function ServicePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center px-5 pt-12 pb-3 bg-white"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <a
          href="/dashboard"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xl font-bold mr-3 active:scale-90 transition-transform"
          style={{ background: "var(--surface)", color: "var(--text-primary)" }}
        >
          ‹
        </a>
        <div>
          <h1 className="text-base font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Service Mode
          </h1>
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Select a product to manage service
          </p>
        </div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-3 pb-6">
        <p className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}>
          Your Products
        </p>

        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl animate-pulse"
              style={{ background: "var(--surface)" }} />
          ))
        ) : products.length === 0 ? (
          <div className="text-center py-12 rounded-2xl"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
              No products yet
            </p>
            <a href="/add-product"
              className="inline-block mt-3 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: "var(--primary)" }}>
              Add a Product
            </a>
          </div>
        ) : (
          products.map((p) => {
            const st = STATUS_STYLE[p.warrantyStatus];
            return (
              <button
                key={p._id}
                onClick={() => router.push(`/service/${p._id}/service-mode`)}
                className="flex items-center gap-3.5 p-4 rounded-2xl text-left w-full active:scale-[0.98] transition-all"
                style={{ background: "#fff", border: "1.5px solid var(--border)" }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: "var(--primary-light)" }}
                >
                  {CATEGORY_EMOJI[p.category] ?? "📦"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
                    {p.productName}
                  </p>
                  <p className="text-xs font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {p.brand || "Unknown brand"}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: st.bg, color: st.color }}>
                    {st.label}
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}