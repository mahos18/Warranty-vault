"use client";

import Link from "next/link";
import { format } from "date-fns";

interface ProductCardProps {
  product: {
    _id: string;
    productName: string;
    brand: string;
    category: string;
    warrantyExpiryDate: string;
    warrantyStatus: "active" | "expiring" | "expired";
  };
}

const CATEGORY_EMOJI: Record<string, string> = {
  Electronics: "📱", Appliances: "🏠", Vehicles: "🚗",
  Furniture: "🛋️", Tools: "🔧", Other: "📦",
};

const STATUS_CHIP = {
  active:   { label: "Active",   color: "#16A34A", bg: "#F0FDF4" },
  expiring: { label: "Expiring", color: "#D97706", bg: "#FFFBEB" },
  expired:  { label: "Expired",  color: "#DC2626", bg: "#FEF2F2" },
};

function getDaysRemaining(expiryDate: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate); expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDays(days: number): string {
  if (days < 0) return `${Math.abs(days)}d ago`;
  if (days === 0) return "Today";
  return `${days}d left`;
}

export default function ProductCard({ product }: ProductCardProps) {
  const chip = STATUS_CHIP[product.warrantyStatus];
  const days = getDaysRemaining(product.warrantyExpiryDate);
  const emoji = CATEGORY_EMOJI[product.category] ?? "📦";

  const daysColor =
    product.warrantyStatus === "expired" ? "#DC2626"
    : product.warrantyStatus === "expiring" ? "#D97706"
    : "var(--text-muted)";

  return (
    <Link href={`/product/${product._id}`}>
      <div
        className="flex items-center gap-3.5 p-4 rounded-2xl active:scale-[0.98] transition-transform"
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        {/* Icon */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: "var(--surface)" }}
        >
          {emoji}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
            {product.productName}
          </p>
          <p className="text-xs font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>
            {product.brand || product.category}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            {/* Status chip */}
            <span
              className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
              style={{ background: chip.bg, color: chip.color }}
            >
              {chip.label}
            </span>
            <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
              · {format(new Date(product.warrantyExpiryDate), "dd MMM yyyy")}
            </span>
          </div>
        </div>

        {/* Right */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className="text-xs font-bold" style={{ color: daysColor }}>
            {formatDays(days)}
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </div>
    </Link>
  );
}