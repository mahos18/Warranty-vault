"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";

interface Product {
  _id: string;
  productName: string;
  brand: string;
  category: string;
  serialNumber?: string;
  purchaseDate: string;
  warrantyDurationMonths: number;
  warrantyExpiryDate: string;
  purchaseAmount?: number;
  warrantyStatus: "active" | "expiring" | "expired";
  invoiceImageUrl?: string;
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

function getDaysRemaining(expiryDate: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate); expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function isPdfUrl(url: string): boolean {
  return url.toLowerCase().includes(".pdf") || url.toLowerCase().includes("/raw/");
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${params.id}`)
      .then((r) => { if (!r.ok) router.push("/dashboard"); return r.json(); })
      .then((d) => setProduct(d.product))
      .catch(() => router.push("/dashboard"))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  async function handleDelete() {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    setDeleting(true);
    await fetch(`/api/products/${params.id}`, { method: "DELETE" });
    router.push("/dashboard");
  }

  if (loading) return (
    <div className="px-5 pt-12 space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-14 rounded-2xl animate-pulse" style={{ background: "var(--surface)" }} />
      ))}
    </div>
  );

  if (!product) return null;

  const days = getDaysRemaining(product.warrantyExpiryDate);
  const status = STATUS_CONFIG[product.warrantyStatus];
  const emoji = CATEGORY_EMOJI[product.category] ?? "📦";
  const hasPdf = product.invoiceImageUrl && isPdfUrl(product.invoiceImageUrl);
  const hasImage = product.invoiceImageUrl && !hasPdf;

  const rows = [
    { label: "Brand",         value: product.brand || "—" },
    { label: "Category",      value: product.category },
    { label: "Serial No.",    value: product.serialNumber || "—" },
    { label: "Purchase Date", value: format(new Date(product.purchaseDate), "dd MMM yyyy") },
    { label: "Warranty",      value: `${product.warrantyDurationMonths} months` },
    { label: "Expires On",    value: format(new Date(product.warrantyExpiryDate), "dd MMM yyyy") },
    { label: "Amount Paid",   value: product.purchaseAmount ? `₹${product.purchaseAmount.toLocaleString("en-IN")}` : "—" },
  ];

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-3.5 px-5 pt-12 pb-5">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xl font-bold active:scale-90 transition-transform"
          style={{ background: "var(--surface)", color: "var(--text-primary)" }}
        >
          ‹
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl">{emoji}</span>
          <h1 className="text-lg font-bold tracking-tight truncate" style={{ color: "var(--text-primary)" }}>
            {product.productName}
          </h1>
        </div>
      </div>

      <div className="px-5 flex flex-col gap-3 pb-6">
        {/* Status Banner */}
        <div
          className="rounded-2xl px-4 py-4 flex items-center justify-between"
          style={{ background: status.bg, border: `1px solid ${status.border}` }}
        >
          <div>
            <p className="text-sm font-bold" style={{ color: status.color }}>
              ● {status.label}
            </p>
            <p className="text-xs mt-0.5 font-medium" style={{ color: "var(--text-secondary)" }}>
              {days > 0 ? `${days} days remaining` : days === 0 ? "Expires today" : `Expired ${Math.abs(days)} days ago`}
            </p>
          </div>
          <p className="text-2xl font-extrabold" style={{ color: status.color }}>
            {days > 0 ? `${days}d` : "—"}
          </p>
        </div>

        {/* Info Table */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          {rows.map((row, i) => (
            <div
              key={row.label}
              className="flex items-center justify-between px-4 py-3.5"
              style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none" }}
            >
              <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{row.label}</span>
              <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* ── Invoice / Warranty Card Section ── */}
        {product.invoiceImageUrl && (
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            {/* Section header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{hasPdf ? "📄" : "🖼️"}</span>
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  {hasPdf ? "Invoice PDF" : "Invoice Photo"}
                </p>
              </div>
              <a
                href={product.invoiceImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                style={{ background: "var(--primary-light)", color: "var(--primary)" }}
              >
                {hasPdf ? "Open PDF" : "Full Size"}
              </a>
            </div>

            {/* Image preview */}
            {hasImage && (
              <img
                src={product.invoiceImageUrl}
                alt="Invoice"
                className="w-full object-cover"
                style={{ maxHeight: "280px", objectFit: "cover" }}
              />
            )}

            {/* PDF tile */}
            {hasPdf && (
              <a
                href={product.invoiceImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 px-4 py-5 active:opacity-70 transition-opacity"
                style={{ background: "#fff" }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ background: "var(--red-bg)", border: "1px solid #FECACA" }}
                >
                  📄
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                    Warranty / Invoice Document
                  </p>
                  <p className="text-xs font-medium mt-0.5" style={{ color: "var(--primary)" }}>
                    Tap to open PDF →
                  </p>
                </div>
              </a>
            )}
          </div>
        )}

        {/* No invoice uploaded */}
        {!product.invoiceImageUrl && (
          <div
            className="flex items-center gap-3 px-4 py-4 rounded-2xl"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <span className="text-xl">📎</span>
            <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
              No invoice or warranty card uploaded
            </p>
          </div>
        )}

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="w-full py-4 rounded-2xl text-sm font-bold active:scale-95 transition-transform disabled:opacity-50"
          style={{ background: "var(--red-bg)", color: "var(--red)" }}
        >
          {deleting ? "Deleting..." : "Delete Product"}
        </button>
      </div>
    </div>
  );
}