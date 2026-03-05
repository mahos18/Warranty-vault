"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";

interface Product {
  productName: string;
  brand: string;
  category: string;
  serialNumber?: string;
  purchaseDate: string;
  warrantyExpiryDate: string;
  warrantyStatus: "active" | "expiring" | "expired";
  invoiceImageUrl?: string;
  warrantyDurationMonths: number;
}

const CATEGORY_EMOJI: Record<string, string> = {
  Electronics: "📱", Appliances: "🏠", Vehicles: "🚗",
  Furniture: "🛋️", Tools: "🔧", Other: "📦",
};

const STATUS_CONFIG = {
  active:   { label: "Active Warranty",  color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" },
  expiring: { label: "Expiring Soon",    color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  expired:  { label: "Warranty Expired", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
};

function getDaysRemaining(expiryDate: string) {
  const today = new Date(); today.setHours(0,0,0,0);
  const expiry = new Date(expiryDate); expiry.setHours(0,0,0,0);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function isPdf(url: string) {
  return url.toLowerCase().includes(".pdf") || url.toLowerCase().includes("/raw/");
}

export default function ServiceViewPage() {
  const params = useParams();
  const token = params.token as string;

  const [state, setState] = useState<"loading" | "valid" | "expired" | "invalid">("loading");
  const [product, setProduct] = useState<Product | null>(null);
  const [expiresAt, setExpiresAt] = useState<string>("");

  useEffect(() => {
    async function fetchToken() {
      try {
        const res = await fetch(`/api/service-mode/view/${token}`);
        const data = await res.json();

        if (res.status === 410 || data.error === "expired") {
          setState("expired"); return;
        }
        if (!res.ok || data.error) {
          setState("invalid"); return;
        }

        setProduct(data.product);
        setExpiresAt(data.expiresAt);
        setState("valid");
      } catch {
        setState("invalid");
      }
    }
    fetchToken();
  }, [token]);

  // ── Loading ──
  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--surface)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            Verifying access...
          </p>
        </div>
      </div>
    );
  }

  // ── Expired ──
  if (state === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center px-5"
        style={{ background: "var(--surface)" }}>
        <div className="w-full max-w-sm bg-white rounded-3xl p-8 text-center shadow-sm"
          style={{ border: "1px solid var(--border)" }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
            style={{ background: "var(--red-bg)" }}>
            ⏰
          </div>
          <h1 className="text-xl font-extrabold mb-2" style={{ color: "var(--text-primary)" }}>
            QR Code Expired
          </h1>
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            This access link is no longer valid. Ask the product owner to generate a new QR code.
          </p>
          <div className="mt-6 px-4 py-3 rounded-xl text-xs font-semibold"
            style={{ background: "var(--surface)", color: "var(--text-muted)" }}>
            Shared via Warranty Vault Service Mode
          </div>
        </div>
      </div>
    );
  }

  // ── Invalid ──
  if (state === "invalid") {
    return (
      <div className="min-h-screen flex items-center justify-center px-5"
        style={{ background: "var(--surface)" }}>
        <div className="w-full max-w-sm bg-white rounded-3xl p-8 text-center shadow-sm"
          style={{ border: "1px solid var(--border)" }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
            style={{ background: "var(--surface)" }}>
            🔒
          </div>
          <h1 className="text-xl font-extrabold mb-2" style={{ color: "var(--text-primary)" }}>
            Invalid Access
          </h1>
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            This QR code is invalid or does not exist.
          </p>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const days = getDaysRemaining(product.warrantyExpiryDate);
  const status = STATUS_CONFIG[product.warrantyStatus];
  const emoji = CATEGORY_EMOJI[product.category] ?? "📦";
  const hasInvoice = !!product.invoiceImageUrl;
  const invoiceIsPdf = hasInvoice && isPdf(product.invoiceImageUrl!);

  const rows = [
    { label: "Brand",         value: product.brand || "—" },
    { label: "Category",      value: product.category },
    { label: "Serial No.",    value: product.serialNumber || "—" },
    { label: "Purchase Date", value: format(new Date(product.purchaseDate), "dd MMM yyyy") },
    { label: "Warranty",      value: `${product.warrantyDurationMonths} months` },
    { label: "Expires On",    value: format(new Date(product.warrantyExpiryDate), "dd MMM yyyy") },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--surface)" }}>
      <div className="max-w-md mx-auto px-5 py-8 flex flex-col gap-4">

        {/* Shared via badge */}
        <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full mx-auto"
          style={{ background: "var(--primary-light)", border: "1px solid #C7D2FE" }}>
          <span className="text-sm">🛡️</span>
          <p className="text-xs font-bold" style={{ color: "var(--primary)" }}>
            Shared via Warranty Vault Service Mode
          </p>
        </div>

        {/* Product header */}
        <div className="bg-white rounded-2xl p-5 flex items-center gap-4"
          style={{ border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: "var(--primary-light)" }}>
            {emoji}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-extrabold tracking-tight truncate"
              style={{ color: "var(--text-primary)" }}>
              {product.productName}
            </h1>
            <p className="text-sm font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>
              {product.brand || "Unknown Brand"}
            </p>
          </div>
        </div>

        {/* Status banner */}
        <div className="rounded-2xl px-4 py-4 flex items-center justify-between"
          style={{ background: status.bg, border: `1px solid ${status.border}` }}>
          <div>
            <p className="text-sm font-bold" style={{ color: status.color }}>
              ● {status.label}
            </p>
            <p className="text-xs mt-0.5 font-medium" style={{ color: "var(--text-secondary)" }}>
              {days > 0
                ? `${days} days remaining`
                : days === 0
                ? "Expires today"
                : `Expired ${Math.abs(days)} days ago`}
            </p>
          </div>
          <p className="text-2xl font-extrabold" style={{ color: status.color }}>
            {days > 0 ? `${days}d` : "—"}
          </p>
        </div>

        {/* Info table */}
        <div className="bg-white rounded-2xl overflow-hidden"
          style={{ border: "1px solid var(--border)" }}>
          {rows.map((row, i) => (
            <div key={row.label}
              className="flex items-center justify-between px-4 py-3.5"
              style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none" }}>
              <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                {row.label}
              </span>
              <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Invoice */}
        {hasInvoice && (
          <div className="bg-white rounded-2xl overflow-hidden"
            style={{ border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
              <div className="flex items-center gap-2">
                <span>{invoiceIsPdf ? "📄" : "🖼️"}</span>
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  {invoiceIsPdf ? "Invoice PDF" : "Invoice Photo"}
                </p>
              </div>
              <a href={product.invoiceImageUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs font-bold px-3 py-1.5 rounded-lg"
                style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                {invoiceIsPdf ? "Open PDF" : "Full Size"}
              </a>
            </div>
            {!invoiceIsPdf && (
              <img src={product.invoiceImageUrl} alt="Invoice"
                className="w-full object-cover"
                style={{ maxHeight: "240px", objectFit: "cover" }} />
            )}
            {invoiceIsPdf && (
              <a href={product.invoiceImageUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 px-4 py-5">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ background: "var(--red-bg)" }}>📄</div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                    Warranty Document
                  </p>
                  <p className="text-xs font-medium mt-0.5" style={{ color: "var(--primary)" }}>
                    Tap to open →
                  </p>
                </div>
              </a>
            )}
          </div>
        )}

        {/* Expiry notice */}
        {expiresAt && (
          <p className="text-center text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            🔒 Access expires at {format(new Date(expiresAt), "hh:mm a, dd MMM yyyy")}
          </p>
        )}
      </div>
    </div>
  );
}