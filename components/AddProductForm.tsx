"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ReceiptUploader from "@/components/ReceiptUploader";
import InvoiceUploader from "@/components/InvoiceUploader";

const CATEGORIES = ["Electronics", "Appliances", "Vehicles", "Furniture", "Tools", "Other"];

interface FormState {
  productName: string;
  brand: string;
  category: string;
  serialNumber: string;
  purchaseDate: string;
  warrantyDurationMonths: string;
  purchaseAmount: string;
  invoiceImageUrl: string;
}

const EMPTY: FormState = {
  productName: "", brand: "", category: "", serialNumber: "",
  purchaseDate: "", warrantyDurationMonths: "", purchaseAmount: "",
  invoiceImageUrl: "",
};

const baseInputStyle = {
  background: "var(--surface)",
  border: "1.5px solid var(--border)",
  color: "var(--text-primary)",
};

const highlightInputStyle = {
  background: "var(--primary-light)",
  border: "1.5px solid var(--primary)",
  color: "var(--text-primary)",
};

const inputClass = "w-full px-4 py-3.5 rounded-xl text-sm font-medium outline-none transition-all placeholder:font-normal focus:bg-white";

export default function AddProductForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [autofillActive, setAutofillActive] = useState(false);
  const [autofillFields, setAutofillFields] = useState<Set<string>>(new Set());

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name } = e.target;
    setForm((prev) => ({ ...prev, [name]: e.target.value }));
    setAutofillFields((prev) => { const n = new Set(prev); n.delete(name); return n; });
    setError("");
  }

  // Called by ReceiptUploader when OCR + AI extraction completes
  function handleExtracted(
    fields: {
      productName: string | null;
      brand: string | null;
      purchaseDate: string | null;
      purchaseAmount: number | null;
      warrantyDurationMonths: number | null;
    },
    imageUrl: string
  ) {
    const filled = new Set<string>();

    setForm((prev) => {
      const next = { ...prev };
      if (imageUrl) { next.invoiceImageUrl = imageUrl; }
      if (fields.productName) { next.productName = fields.productName; filled.add("productName"); }
      if (fields.brand) { next.brand = fields.brand; filled.add("brand"); }
      if (fields.purchaseDate) {
        const d = normalizeDate(fields.purchaseDate);
        if (d) { next.purchaseDate = d; filled.add("purchaseDate"); }
      }
      if (fields.purchaseAmount != null) {
        next.purchaseAmount = String(fields.purchaseAmount);
        filled.add("purchaseAmount");
      }
      if (fields.warrantyDurationMonths != null) {
        next.warrantyDurationMonths = String(fields.warrantyDurationMonths);
        filled.add("warrantyDurationMonths");
      }
      return next;
    });

    setAutofillFields(filled);
    setAutofillActive(true);
    setTimeout(() => setAutofillActive(false), 3000);
    setError("");
  }

  // Called by InvoiceUploader when file is uploaded (without OCR)
  function handleInvoiceUploaded(url: string) {
    setForm((prev) => ({ ...prev, invoiceImageUrl: url }));
  }

  function normalizeDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "";
      return d.toISOString().split("T")[0];
    } catch { return ""; }
  }

  function getFieldStyle(name: string) {
    return autofillActive && autofillFields.has(name) ? highlightInputStyle : baseInputStyle;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.productName.trim()) { setError("Product name is required"); return; }
    if (!form.category) { setError("Please select a category"); return; }
    if (!form.purchaseDate) { setError("Purchase date is required"); return; }
    if (!form.warrantyDurationMonths || parseInt(form.warrantyDurationMonths) < 1) {
      setError("Warranty duration must be at least 1 month"); return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add product");
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="px-5 flex flex-col gap-5">

      {/* ── Receipt Scanner (OCR + autofill) ── */}
      <ReceiptUploader onExtracted={handleExtracted} />

      {/* ── Invoice / Warranty Card Upload (just save to vault) ── */}
      <InvoiceUploader
        onUploaded={handleInvoiceUploaded}
        existingUrl={form.invoiceImageUrl}
        />

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        <span className="text-xs font-semibold px-2" style={{ color: "var(--text-muted)" }}>
          product details
        </span>
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
      </div>

      {/* Autofill notice */}
      {autofillActive && autofillFields.size > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
          style={{ background: "var(--primary-light)", border: "1px solid #C7D2FE" }}>
          <span>✨</span>
          <p className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
            {autofillFields.size} field{autofillFields.size > 1 ? "s" : ""} auto-filled — review and edit if needed
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-xl text-sm font-medium"
          style={{ background: "var(--red-bg)", color: "var(--red)", border: "1px solid #FECACA" }}>
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Product Name" required>
          <input name="productName" value={form.productName} onChange={handleChange}
            placeholder="e.g. iPhone 15 Pro Max"
            className={inputClass} style={getFieldStyle("productName")} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Brand">
            <input name="brand" value={form.brand} onChange={handleChange}
              placeholder="e.g. Apple"
              className={inputClass} style={getFieldStyle("brand")} />
          </Field>
          <Field label="Category" required>
            <select name="category" value={form.category} onChange={handleChange}
              className={inputClass}
              style={{ ...baseInputStyle, color: form.category ? "var(--text-primary)" : "var(--text-muted)" }}>
              <option value="">Select</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Serial Number">
          <input name="serialNumber" value={form.serialNumber} onChange={handleChange}
            placeholder="Optional" className={inputClass} style={baseInputStyle} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Purchase Date" required>
            <input type="date" name="purchaseDate" value={form.purchaseDate}
              onChange={handleChange} max={new Date().toISOString().split("T")[0]}
              className={inputClass} style={getFieldStyle("purchaseDate")} />
          </Field>
          <Field label="Warranty (Months)" required>
            <input type="number" name="warrantyDurationMonths"
              value={form.warrantyDurationMonths}
              onChange={handleChange} placeholder="e.g. 12" min="1" max="600"
              className={inputClass} style={getFieldStyle("warrantyDurationMonths")} />
          </Field>
        </div>

        <Field label="Purchase Amount (₹)">
          <input type="number" name="purchaseAmount" value={form.purchaseAmount}
            onChange={handleChange} placeholder="e.g. 89999" min="0"
            className={inputClass} style={getFieldStyle("purchaseAmount")} />
        </Field>

        

        <button type="submit" disabled={loading}
          className="w-full py-4 rounded-2xl text-base font-bold text-white mt-2 active:scale-95 transition-transform disabled:opacity-60"
          style={{ background: "var(--primary)" }}>
          {loading ? "Saving..." : "Save to Vault →"}
        </button>

        <div className="h-4" />
      </form>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
        {label}{required && <span style={{ color: "var(--red)" }}> *</span>}
      </label>
      {children}
    </div>
  );
}