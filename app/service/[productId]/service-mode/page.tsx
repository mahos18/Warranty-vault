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

interface Manufacturer {
  name: string;
  supportPhone: string;
  supportWebsite: string;
  supportEmail: string;
  extendedWarrantyAvailable: boolean;
  onlineClaimUrl: string;
}

interface ServiceCenter {
  name: string;
  address: string;
  phone: string | null;
  lat: number;
  lng: number;
  placeId: string;
}

const CATEGORY_EMOJI: Record<string, string> = {
  Electronics: "📱", Appliances: "🏠", Vehicles: "🚗",
  Furniture: "🛋️", Tools: "🔧", Other: "📦",
};

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): string {
  const R    = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

export default function ServiceModePage() {
  const params    = useParams();
  const router    = useRouter();
  const productId = params.productId as string;

  const [product,    setProduct]    = useState<Product | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [generating, setGenerating] = useState(false);
  const [qrResult,   setQrResult]   = useState<QrResult | null>(null);
  const [error,      setError]      = useState("");
  const [copied,     setCopied]     = useState(false);

  const [manufacturer,    setManufacturer]    = useState<Manufacturer | null>(null);
  const [centers,         setCenters]         = useState<ServiceCenter[]>([]);
  const [centersLoading,  setCentersLoading]  = useState(false);
  const [centersError,    setCentersError]    = useState("");
  const [userLocation,    setUserLocation]    = useState<{ lat: number; lng: number } | null>(null);
  const [activeTab,       setActiveTab]       = useState(0);

  // Load product
  useEffect(() => {
    fetch(`/api/products/${productId}`)
      .then((r) => { if (!r.ok) router.push("/service"); return r.json(); })
      .then((d) => {
        setProduct(d.product);
        setManufacturer(d.manufacturer ?? null);
      })
      .catch(() => router.push("/service"))
      .finally(() => setLoading(false));
  }, [productId, router]);

  async function fetchServiceCenters(lat: number, lng: number, brand: string) {
    setCentersLoading(true);
    setCentersError("");
    setCenters([]);
    try {
      const res  = await fetch(
        `/api/service-centers?brand=${encodeURIComponent(brand)}&lat=${lat}&lng=${lng}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch");
      setCenters(data);
    } catch (err) {
      setCentersError(err instanceof Error ? err.message : "Could not load service centers");
    } finally {
      setCentersLoading(false);
    }
  }

  function handleGetLocation() {
    if (!navigator.geolocation) {
      setCentersError("Geolocation not supported by your browser.");
      return;
    }
    setCentersLoading(true);
    setCentersError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        if (product?.brand) fetchServiceCenters(coords.lat, coords.lng, product.brand);
      },
      () => {
        setCentersLoading(false);
        setCentersError("Location access denied. Please allow location in browser settings.");
      },
      { timeout: 10000 }
    );
  }

  async function handleGenerate() {
    setError("");
    setGenerating(true);
    setQrResult(null);
    try {
      const res  = await fetch("/api/service-mode/generate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ productId }),
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
        <div key={i} className="h-16 rounded-2xl animate-pulse"
          style={{ background: "var(--surface)" }} />
      ))}
    </div>
  );

  if (!product) return null;

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center px-5 pt-12 pb-3 bg-white"
        style={{ borderBottom: "1px solid var(--border)" }}>
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xl font-bold mr-3 active:scale-90 transition-transform"
          style={{ background: "var(--surface)", color: "var(--text-primary)" }}>
          ‹
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg">{CATEGORY_EMOJI[product.category] ?? "📦"}</span>
          <div className="min-w-0">
            <h1 className="text-base font-bold tracking-tight truncate"
              style={{ color: "var(--text-primary)" }}>
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
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, #4F46E5, #3730A3)" }}>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                style={{ background: "rgba(255,255,255,0.15)" }}>⬡</div>
              <p className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.6)" }}>SmartScan</p>
            </div>
            <h2 className="text-lg font-extrabold text-white mt-2 mb-1">Generate Secure QR</h2>
            <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
              Service staff can scan this QR to view warranty details without logging in.
            </p>
            <button onClick={handleGenerate} disabled={generating}
              className="w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
              style={{ background: "#fff", color: "var(--primary)" }}>
              {generating
                ? <><span className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />Generating...</>
                : qrResult ? "↺ Regenerate QR" : "⬡ Generate QR Code"}
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

          {qrResult && (
            <div className="mx-4 mb-4 rounded-xl p-4 flex flex-col items-center gap-3"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
              <div className="p-3 rounded-xl bg-white">
                <QRCodeSVG value={qrResult.qrUrl} size={180} bgColor="#ffffff" fgColor="#4F46E5" level="H" />
              </div>
              <p className="text-xs font-medium text-center" style={{ color: "rgba(255,255,255,0.65)" }}>
                Expires at {format(new Date(qrResult.expiresAt), "hh:mm a, dd MMM")}
              </p>
              <button onClick={handleCopy}
                className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                style={{
                  background: copied ? "#F0FDF4" : "rgba(255,255,255,0.15)",
                  color:      copied ? "#16A34A" : "#fff",
                  border:     `1px solid ${copied ? "#BBF7D0" : "rgba(255,255,255,0.2)"}`,
                }}>
                {copied ? "✓ Link Copied!" : "🔗 Copy Shareable Link"}
              </button>
              <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
                🔒 Read-only · No login required for technician
              </p>
            </div>
          )}
        </div>

        {/* ── Manufacturer Support ── */}
        {manufacturer && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: "var(--text-muted)" }}>
              Brand Support
            </p>
            <div className="rounded-2xl overflow-hidden bg-white"
              style={{ border: "1px solid var(--border)" }}>

              {/* Header */}
              <div className="flex items-center gap-2 px-4 py-3"
                style={{ background: "var(--primary-light)", borderBottom: "1px solid #C7D2FE" }}>
                <span className="text-base">🏭</span>
                <p className="text-sm font-bold" style={{ color: "var(--primary)" }}>
                  {manufacturer.name} Official Support
                </p>
              </div>

              {/* Phone */}
              {manufacturer.supportPhone && (
                <a href={`tel:${manufacturer.supportPhone}`}
                  className="flex items-center justify-between px-4 py-3.5 active:opacity-70 transition-opacity"
                  style={{ borderBottom: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-2.5">
                    <span>📞</span>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Helpline</p>
                      <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                        {manufacturer.supportPhone}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-lg"
                    style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                    Call
                  </span>
                </a>
              )}

              {/* Website */}
              {manufacturer.supportWebsite && (
                <a href={manufacturer.supportWebsite} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between px-4 py-3.5 active:opacity-70 transition-opacity"
                  style={{ borderBottom: manufacturer.extendedWarrantyAvailable ? "1px solid var(--border)" : "none" }}>
                  <div className="flex items-center gap-2.5">
                    <span>🌐</span>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Support Website</p>
                      <p className="text-sm font-bold" style={{ color: "var(--primary)" }}>
                        {manufacturer.supportWebsite.replace("https://", "")}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-lg"
                    style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                    Open →
                  </span>
                </a>
              )}

              {/* Extend warranty */}
              {manufacturer.extendedWarrantyAvailable && manufacturer.onlineClaimUrl && (
                <a href={manufacturer.onlineClaimUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-4 active:opacity-70 transition-opacity"
                  style={{ background: "var(--green-bg)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: "#fff", border: "1px solid #BBF7D0" }}>
                    🛡️
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold" style={{ color: "var(--green)" }}>
                      Extend Your Warranty
                    </p>
                    <p className="text-xs font-medium mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      Get extended protection from {manufacturer.name}
                    </p>
                  </div>
                  <span>→</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* ── Service Centers Near You ── */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: "var(--text-muted)" }}>
            Service Centers Near You
          </p>

          {/* Prompt to allow location */}
          {!userLocation && !centersLoading && (
            <button onClick={handleGetLocation}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-sm active:scale-95 transition-transform"
              style={{
                background: "var(--primary-light)",
                color: "var(--primary)",
                border: "1.5px dashed #C7D2FE",
              }}>
              <span className="text-lg">📍</span>
              Find {product.brand} Service Centers
            </button>
          )}

          {/* Loading */}
          {centersLoading && (
            <div className="flex flex-col items-center gap-3 py-8 rounded-2xl"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Finding service centers...
              </p>
            </div>
          )}

          {/* Error */}
          {centersError && !centersLoading && (
            <div className="flex items-start gap-3 p-4 rounded-2xl"
              style={{ background: "var(--red-bg)", border: "1px solid #FECACA" }}>
              <span>⚠️</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--red)" }}>
                  {centersError}
                </p>
                <button onClick={handleGetLocation}
                  className="text-xs font-bold mt-1" style={{ color: "var(--primary)" }}>
                  Try again →
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          {userLocation && !centersLoading && (
            <>
              {/* No results */}
              {centers.length === 0 && !centersError && (
                <div className="text-center py-8 rounded-2xl"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <p className="text-2xl mb-2">🔍</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                    No {product.brand} service centers found nearby
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/${encodeURIComponent(product.brand + " service center near me")}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-block mt-3 px-4 py-2 rounded-xl text-xs font-bold"
                    style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                    Search on Google Maps →
                  </a>
                </div>
              )}

              {/* Tabs */}
              {centers.length > 0 && (
                <div className="flex flex-col gap-0 rounded-2xl overflow-hidden"
                  style={{ border: "1px solid var(--border)" }}>

                  {/* Tab pills */}
                  <div className="flex overflow-x-auto no-scrollbar"
                    style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
                    {centers.map((c, i) => (
                      <button key={c.placeId} onClick={() => setActiveTab(i)}
                        className="flex-shrink-0 px-4 py-2.5 text-xs font-bold transition-all"
                        style={{
                          background:   activeTab === i ? "#fff" : "transparent",
                          color:        activeTab === i ? "var(--primary)" : "var(--text-muted)",
                          borderBottom: activeTab === i ? "2px solid var(--primary)" : "2px solid transparent",
                        }}>
                        #{i + 1}
                      </button>
                    ))}
                  </div>

                  {/* Active tab content */}
                  {centers[activeTab] && (() => {
                    const c = centers[activeTab];
                    const dist = getDistanceKm(userLocation.lat, userLocation.lng, c.lat, c.lng);
                    return (
                      <div className="p-5 bg-white flex flex-col gap-4">
                        {/* Name + distance */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-base font-extrabold leading-tight"
                              style={{ color: "var(--text-primary)" }}>
                              {c.name}
                            </p>
                            <p className="text-xs font-medium mt-1"
                              style={{ color: "var(--text-secondary)" }}>
                              📍 {c.address}
                            </p>
                          </div>
                          <span className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold"
                            style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                            {dist}
                          </span>
                        </div>

                        {/* Phone row
                        {c.phone && (
                          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                            <span className="text-base">📞</span>
                            <p className="text-sm font-semibold flex-1"
                              style={{ color: "var(--text-primary)" }}>
                              {c.phone}
                            </p>
                          </div>
                        )} */}

                        {/* Action buttons */}
                        <div className="flex gap-3">
                          {c.phone ? (
                            <a href={`tel:${c.phone}`}
                              className="flex-1 py-3 rounded-xl text-sm font-bold text-center active:scale-95 transition-transform"
                              style={{ border: "1.5px solid var(--primary)", color: "var(--primary)" }}>
                              📞 Call
                            </a>
                          ) : (
                            <a
                              href={`https://www.google.com/search?q=${encodeURIComponent(c.name + " phone number")}`}
                              target="_blank" rel="noopener noreferrer"
                              className="flex-1 py-3 rounded-xl text-sm font-bold text-center active:scale-95 transition-transform"
                              style={{ border: "1.5px solid var(--primary)", color: "var(--primary)" }}>
                              🔍 Find Number
                            </a>
                          )}
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex-1 py-3 rounded-xl text-sm font-bold text-white text-center active:scale-95 transition-transform"
                            style={{ background: "var(--primary)" }}>
                            🗺️ Directions
                          </a>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Refresh button */}
              {centers.length > 0 && (
                <button onClick={() => fetchServiceCenters(userLocation.lat, userLocation.lng, product.brand)}
                  className="w-full mt-2 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-transform"
                  style={{ background: "var(--surface)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                  ↺ Refresh Results
                </button>
              )}
            </>
          )}
        </div>

        <div className="h-2" />
      </div>
    </div>
  );
}