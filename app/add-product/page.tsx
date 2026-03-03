import AddProductForm from "@/components/AddProductForm";

export default function AddProductPage() {
  return (
    <div className="animate-fade-up">
      {/* Page Header */}
      <div className="flex items-center gap-3.5 px-5 pt-12 pb-5">
        <a
          href="/dashboard"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xl font-bold active:scale-90 transition-transform"
          style={{ background: "var(--surface)", color: "var(--text-primary)" }}
        >
          ‹
        </a>
        <h1 className="text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Add Warranty
        </h1>
      </div>

      <AddProductForm />
    </div>
  );
}