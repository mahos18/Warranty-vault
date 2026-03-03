"use client";

import { useState } from "react";

// ── Mock Data ──────────────────────────────────────────────
const MOCK_PRODUCTS = [
  { id: "1", name: "iPhone 15 Pro", emoji: "📱" },
  { id: "2", name: "MacBook Pro M3", emoji: "💻" },
  { id: "3", name: "Samsung Fridge", emoji: "🏠" },
  { id: "4", name: "Sony WH-1000XM5", emoji: "🎧" },
  { id: "5", name: "Sony Bravia 65\"", emoji: "📺" },
];

const MOCK_CENTERS = [
  { id: "1", name: "Apple Authorized Service", area: "Andheri West", distance: "1.2 km", rating: "4.8" },
  { id: "2", name: "iCare Service Center", area: "Bandra East", distance: "2.4 km", rating: "4.5" },
  { id: "3", name: "TechFix Solutions", area: "Juhu", distance: "3.7 km", rating: "4.3" },
];

// ── Sub-components ─────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <p className="text-sm font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
        {title}
      </p>
      {subtitle && (
        <p className="text-xs font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function ProductChip({
  product,
  active,
  onClick,
}: {
  product: (typeof MOCK_PRODUCTS)[0];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3.5 py-2 rounded-full flex-shrink-0 text-sm font-semibold transition-all active:scale-95"
      style={
        active
          ? { background: "var(--primary)", color: "#fff", border: "1.5px solid var(--primary)" }
          : { background: "var(--surface)", color: "var(--text-secondary)", border: "1.5px solid var(--border)" }
      }
    >
      <span className="text-base leading-none">{product.emoji}</span>
      {product.name}
    </button>
  );
}

function ServiceCard({ center }: { center: (typeof MOCK_CENTERS)[0] }) {
  return (
    <div
      className="flex items-center justify-between p-4 rounded-2xl"
      style={{ background: "var(--bg)", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: "var(--primary-light)" }}
        >
          🔧
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
            {center.name}
          </p>
          <p className="text-xs font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>
            {center.area} · {center.distance}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs" style={{ color: "#D97706" }}>★</span>
            <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
              {center.rating}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        <button
          className="px-3 py-1.5 rounded-lg text-xs font-bold active:scale-95 transition-transform"
          style={{ border: "1.5px solid var(--primary)", color: "var(--primary)", background: "var(--bg)" }}
        >
          Call
        </button>
        <button
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white active:scale-95 transition-transform"
          style={{ background: "var(--primary)" }}
        >
          Navigate
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────

export default function ServicePage() {
  const [selectedId, setSelectedId] = useState("1");
  const [qrGenerated, setQrGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);

  const selected = MOCK_PRODUCTS.find((p) => p.id === selectedId)!;

  function handleGenerate() {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setQrGenerated(true);
    }, 1200);
  }

  return (
    <div className="animate-fade-up">
      {/* ── Header ── */}
      <div
        className="sticky top-0 z-10 flex items-center px-5 pt-12 pb-3 bg-white"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <a
          href="/dashboard"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xl font-bold active:scale-90 transition-transform mr-3"
          style={{ background: "var(--surface)", color: "var(--text-primary)" }}
        >
          ‹
        </a>
        <div>
          <h1 className="text-base font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Service Mode
          </h1>
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Instant warranty access for service visits
          </p>
        </div>
      </div>

      <div className="px-5 pt-5 pb-4 flex flex-col gap-6">
        {/* ── Product Selector ── */}
        <div>
          <SectionHeader title="Select Product" subtitle="Choose the product you're getting serviced" />
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
            {MOCK_PRODUCTS.map((p) => (
              <ProductChip
                key={p.id}
                product={p}
                active={selectedId === p.id}
                onClick={() => { setSelectedId(p.id); setQrGenerated(false); }}
              />
            ))}
          </div>
        </div>

        {/* ── Hero Action Card ── */}
        <div
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)" }}
        >
          {/* Decorative circle */}
          <div className="absolute w-40 h-40 rounded-full -top-12 -right-8"
            style={{ background: "rgba(255,255,255,0.07)" }} />

          <div className="flex items-start gap-3 mb-4 relative z-10">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              {selected.emoji}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-0.5"
                style={{ color: "rgba(255,255,255,0.6)" }}>
                Selected Product
              </p>
              <p className="text-base font-bold text-white">{selected.name}</p>
            </div>
          </div>

          <div className="relative z-10">
            <h2 className="text-lg font-extrabold text-white tracking-tight mb-1">
              Generate Secure Access
            </h2>
            <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
              Create a temporary QR code to share warranty details securely with service staff.
            </p>

            <button
              onClick={handleGenerate}
              disabled={generating || qrGenerated}
              className="w-full h-12 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
              style={{ background: "#fff", color: "var(--primary)" }}
            >
              {generating ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                  Generating...
                </>
              ) : qrGenerated ? (
                "✓ QR Code Ready"
              ) : (
                "⬡ Generate QR Code"
              )}
            </button>

            <p className="text-center text-xs mt-2" style={{ color: "rgba(255,255,255,0.5)" }}>
              Access expires in 1 hour for security.
            </p>
          </div>
        </div>

        {/* ── QR Preview ── */}
        <div>
          <SectionHeader title="QR Preview" />
          <div
            className="w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-3 transition-all"
            style={{
              border: qrGenerated ? "2px solid var(--primary)" : "2px dashed var(--border)",
              background: qrGenerated ? "var(--primary-light)" : "var(--surface)",
            }}
          >
            {qrGenerated ? (
              <>
                {/* Mock QR grid */}
                <div className="relative">
                  <svg width="140" height="140" viewBox="0 0 140 140">
                    {/* QR corner squares */}
                    <rect x="8" y="8" width="36" height="36" rx="4" fill="#4F46E5" />
                    <rect x="14" y="14" width="24" height="24" rx="2" fill="white" />
                    <rect x="18" y="18" width="16" height="16" rx="1" fill="#4F46E5" />

                    <rect x="96" y="8" width="36" height="36" rx="4" fill="#4F46E5" />
                    <rect x="102" y="14" width="24" height="24" rx="2" fill="white" />
                    <rect x="106" y="18" width="16" height="16" rx="1" fill="#4F46E5" />

                    <rect x="8" y="96" width="36" height="36" rx="4" fill="#4F46E5" />
                    <rect x="14" y="102" width="24" height="24" rx="2" fill="white" />
                    <rect x="18" y="106" width="16" height="16" rx="1" fill="#4F46E5" />

                    {/* Random data dots */}
                    {[
                      [52,8],[60,8],[68,8],[76,8],[84,8],
                      [52,16],[60,16],[76,16],
                      [52,24],[68,24],[84,24],
                      [52,32],[60,32],[68,32],[84,32],
                      [52,40],[76,40],[84,40],
                      [8,52],[16,52],[32,52],[52,52],[68,52],[84,52],[96,52],[112,52],[128,52],
                      [8,60],[24,60],[52,60],[60,60],[76,60],[96,60],[120,60],
                      [8,68],[16,68],[32,68],[60,68],[68,68],[84,68],[104,68],[112,68],
                      [8,76],[24,76],[52,76],[68,76],[76,76],[96,76],[104,76],[128,76],
                      [8,84],[16,84],[32,84],[52,84],[84,84],[96,84],[112,84],[120,84],
                      [52,96],[60,96],[76,96],[84,96],[96,96],[112,96],[120,96],
                      [52,104],[68,104],[76,104],[96,104],[104,104],[128,104],
                      [52,112],[60,112],[76,112],[84,112],[96,112],[112,112],[120,112],
                      [52,120],[68,120],[84,120],[96,120],[104,120],
                      [52,128],[60,128],[76,128],[96,128],[112,128],[120,128],[128,128],
                    ].map(([x, y], i) => (
                      <rect key={i} x={x} y={y} width="6" height="6" rx="1" fill="#4F46E5" />
                    ))}
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold" style={{ color: "var(--primary)" }}>
                    Secure Warranty QR
                  </p>
                  <p className="text-xs font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {selected.name} · Valid for 1 hour
                  </p>
                </div>
              </>
            ) : (
              <>
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ background: "var(--border)" }}
                >
                  ⬡
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                    QR will appear here
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    after generation
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Nearby Service Centers ── */}
        <div>
          <SectionHeader
            title="Nearby Service Centers"
            subtitle="Authorized centers in your area"
          />
          <div className="flex flex-col gap-2.5">
            {MOCK_CENTERS.map((center) => (
              <ServiceCard key={center.id} center={center} />
            ))}
          </div>
        </div>

        <div className="h-2" />
      </div>
    </div>
  );
}