"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";

interface Product {
  _id: string;
  productName: string;
  brand: string;
  category: string;
  warrantyStatus: "active" | "expiring" | "expired";
}

interface QrResult {
  token: string;
  expiresAt: string;
  qrUrl: string;
}

const CATEGORY_EMOJI: Record<string, string> = {
  Electronics: "📱", Appliances: "🏠", Vehicles: "🚗",
  Furniture: "🛋️", Tools: "🔧", Other: "📦",
};

const MOCK_CENTERS = [
  { id: "1", name: "Apple Authorized Service", area: "Andheri West", distance: "1.2 km", rating: "4.8" },
  { id: "2", name: "iCare Service Center",     area: "Bandra East",  distance: "2.4 km", rating: "4.5" },
  { id: "3", name: "TechFix Solutions",         area: "Juhu",         distance: "3.7 km", rating: "4.3" },
];

export default function ServiceModePage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [qrResult, setQrResult] = useState<QrResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${productId}`)
      .then((r) => { if (!r.ok) router.push("/service"); return r.json(); })
      .then((d) => setProduct(d.product))
      .catch(() => router.push("/service"))
      .finally(() => setLoading(false));
  }, [productId, router]);

  async function handleGenerate() {
    setError("");
    setGenerating(true);
    setQrResult(null);
    try {
      const res = await fetch("/api/service-mode/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setQrResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate QR");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    if (!qrResult) return;
    await navigator.clipboard.writeText(qrResult.qrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return (
    <div className="px-5 pt-12 flex flex-col gap-3">
      {[1,2,3].map((i) => (
        <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "var(--surface)" }} />
      ))}
    </div>
  );

  if (!product) return null;

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center px-5 pt-12 pb-3 bg-white"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xl font-bold mr-3 active:scale-90 transition-transform"
          style={{ background: "var(--surface)", color: "var(--text-primary)" }}
        >
          ‹
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg">{CATEGORY_EMOJI[product.category] ?? "📦"}</span>
          <div className="min-w-0">
            <h1 className="text-base font-bold tracking-tight truncate" style={{ color: "var(--text-primary)" }}>
              {product.productName}
            </h1>
            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Service Mode
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-5 pb-6">

        {/* ── SmartScan Card ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, #4F46E5, #3730A3)" }}
        >
          <div className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                style={{ background: "rgba(255,255,255,0.15)" }}>
                ⬡
              </div>
              <p className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.6)" }}>
                SmartScan
              </p>
            </div>

            <h2 className="text-lg font-extrabold text-white mt-2 mb-1">
              Generate Secure QR
            </h2>
            <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
              Service staff can scan this QR to view warranty details without logging in.
            </p>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
              style={{ background: "#fff", color: "var(--primary)" }}
            >
              {generating ? (
                <>
                  <span className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                  Generating...
                </>
              ) : qrResult ? (
                "↺ Regenerate QR"
              ) : (
                "⬡ Generate QR Code"
              )}
            </button>

            {error && (
              <p className="text-xs mt-2 text-center font-medium" style={{ color: "#FCA5A5" }}>
                {error}
              </p>
            )}

            <p className="text-center text-xs mt-2" style={{ color: "rgba(255,255,255,0.45)" }}>
              Access expires automatically in 1 hour
            </p>
          </div>

          {/* QR Display — inside card, below button */}
          {qrResult && (
            <div
              className="mx-4 mb-4 rounded-xl p-4 flex flex-col items-center gap-3"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              {/* QR Code */}
              <div className="p-3 rounded-xl bg-white">
                <QRCodeSVG
                  value={qrResult.qrUrl}
                  size={180}
                  bgColor="#ffffff"
                  fgColor="#4F46E5"
                  level="H"
                  includeMargin={false}
                />
              </div>

              <p className="text-xs font-medium text-center" style={{ color: "rgba(255,255,255,0.65)" }}>
                Expires at {format(new Date(qrResult.expiresAt), "hh:mm a, dd MMM")}
              </p>

              {/* Copy link */}
              <button
                onClick={handleCopy}
                className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                style={{
                  background: copied ? "#F0FDF4" : "rgba(255,255,255,0.15)",
                  color: copied ? "#16A34A" : "#fff",
                  border: `1px solid ${copied ? "#BBF7D0" : "rgba(255,255,255,0.2)"}`,
                }}
              >
                {copied ? "✓ Link Copied!" : "🔗 Copy Shareable Link"}
              </button>

              <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
                🔒 Read-only · No login required for technician
              </p>
            </div>
          )}
        </div>

        {/* ── Nearby Service Centers ── */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: "var(--text-muted)" }}>
            Nearby Service Centers
          </p>
          <div className="flex flex-col gap-2.5">
            {MOCK_CENTERS.map((center) => (
              <div
                key={center.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-white"
                style={{ border: "1px solid var(--border)" }}
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
                      {center.area} · {center.distance} · ★ {center.rating}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0 ml-3">
                  <button
                    className="px-3 py-1.5 rounded-lg text-xs font-bold active:scale-95 transition-transform"
                    style={{ border: "1.5px solid var(--primary)", color: "var(--primary)" }}
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
            ))}
          </div>
        </div>

        <div className="h-2" />
      </div>
    </div>
  );
}