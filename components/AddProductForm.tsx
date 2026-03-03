"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = ["Electronics", "Appliances", "Vehicles", "Furniture", "Tools", "Other"];

interface FormState {
  productName: string;
  brand: string;
  category: string;
  serialNumber: string;
  purchaseDate: string;
  warrantyDurationMonths: string;
  purchaseAmount: string;
}

const EMPTY: FormState = {
  productName: "", brand: "", category: "", serialNumber: "",
  purchaseDate: "", warrantyDurationMonths: "", purchaseAmount: "",
};

const inputClass = `
  w-full px-4 py-3.5 rounded-xl text-sm font-medium outline-none transition-all
  placeholder:font-normal
`;

export default function AddProductForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
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
    <form onSubmit={handleSubmit} className="px-5 flex flex-col gap-4">
      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-xl text-sm font-medium"
          style={{ background: "var(--red-bg)", color: "var(--red)", border: "1px solid #FECACA" }}>
          {error}
        </div>
      )}

      {/* Product Name */}
      <Field label="Product Name" required>
        <input
          name="productName" value={form.productName} onChange={handleChange}
          placeholder="e.g. iPhone 15 Pro Max"
          className={inputClass}
          style={{ background: "var(--surface)", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
        />
      </Field>

      {/* Brand + Category */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Brand">
          <input
            name="brand" value={form.brand} onChange={handleChange}
            placeholder="e.g. Apple"
            className={inputClass}
            style={{ background: "var(--surface)", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
          />
        </Field>
        <Field label="Category" required>
          <select
            name="category" value={form.category} onChange={handleChange}
            className={inputClass}
            style={{ background: "var(--surface)", border: "1.5px solid var(--border)", color: form.category ? "var(--text-primary)" : "var(--text-muted)" }}
          >
            <option value="">Select</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
      </div>

      {/* Serial Number */}
      <Field label="Serial Number">
        <input
          name="serialNumber" value={form.serialNumber} onChange={handleChange}
          placeholder="Optional"
          className={inputClass}
          style={{ background: "var(--surface)", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
        />
      </Field>

      {/* Purchase Date + Warranty Duration */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Purchase Date" required>
          <input
            type="date" name="purchaseDate" value={form.purchaseDate} onChange={handleChange}
            max={new Date().toISOString().split("T")[0]}
            className={inputClass}
            style={{ background: "var(--surface)", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
          />
        </Field>
        <Field label="Warranty (Months)" required>
          <input
            type="number" name="warrantyDurationMonths" value={form.warrantyDurationMonths}
            onChange={handleChange} placeholder="e.g. 12" min="1" max="600"
            className={inputClass}
            style={{ background: "var(--surface)", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
          />
        </Field>
      </div>

      {/* Purchase Amount */}
      <Field label="Purchase Amount (₹)">
        <input
          type="number" name="purchaseAmount" value={form.purchaseAmount}
          onChange={handleChange} placeholder="e.g. 89999" min="0"
          className={inputClass}
          style={{ background: "var(--surface)", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
        />
      </Field>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 rounded-2xl text-base font-bold text-white mt-2 active:scale-95 transition-transform disabled:opacity-60"
        style={{ background: "var(--primary)" }}
      >
        {loading ? "Adding..." : "Add Product →"}
      </button>

      <div className="h-4" />
    </form>
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