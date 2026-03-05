"use client";

import { useState, useRef } from "react";

interface Props {
  onUploaded: (url: string, fileType: "image" | "pdf") => void;
  existingUrl?: string;
}

export default function InvoiceUploader({ onUploaded, existingUrl }: Props) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<{ url: string; type: "image" | "pdf"; name: string } | null>(
    existingUrl
      ? {
          url: existingUrl,
          type: existingUrl.includes(".pdf") ? "pdf" : "image",
          name: "Uploaded file",
        }
      : null
  );
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    // Validate type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      setError("Only JPG, PNG, WebP or PDF files allowed.");
      return;
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum size is 10MB.");
      return;
    }

    const fileType = file.type === "application/pdf" ? "pdf" : "image";

    // Show local preview for images immediately
    if (fileType === "image") {
      const localUrl = URL.createObjectURL(file);
      setPreview({ url: localUrl, type: "image", name: file.name });
    } else {
      setPreview({ url: "", type: "pdf", name: file.name });
    }

    // Upload to Cloudinary
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("receipt", file);

      const res = await fetch("/api/upload-receipt", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      setPreview({ url: data.imageUrl, type: fileType, name: file.name });
      onUploaded(data.imageUrl, fileType);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    setPreview(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    onUploaded("", "image");
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#fff", border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
            style={{ background: "var(--primary-light)" }}
          >
            📎
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              Invoice / Warranty Card
            </p>
            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              JPG, PNG, WebP or PDF · Max 10MB
            </p>
          </div>
        </div>
        {preview && (
          <button
            onClick={handleRemove}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{ background: "var(--surface)", color: "var(--text-secondary)" }}
          >
            Remove
          </button>
        )}
      </div>

      <div style={{ height: "1px", background: "var(--border)" }} />

      <div className="p-4">
        {/* Empty state */}
        {!preview && !uploading && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-3 py-7 rounded-xl transition-all active:scale-[0.98]"
            style={{ border: "2px dashed var(--border)", background: "var(--surface)" }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
            >
              📄
            </div>
            <div className="text-center">
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                Upload Invoice or Warranty Card
              </p>
              <p className="text-xs font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>
                Tap to choose from your device
              </p>
            </div>
          </button>
        )}

        {/* Uploading state */}
        {uploading && (
          <div
            className="flex items-center gap-3 p-4 rounded-xl"
            style={{ background: "var(--surface)" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--primary-light)" }}
            >
              {preview?.type === "pdf" ? "📄" : "🖼️"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
                {preview?.name ?? "Uploading..."}
              </p>
              <div
                className="mt-1.5 h-1 rounded-full overflow-hidden"
                style={{ background: "var(--border)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    background: "var(--primary)",
                    width: "60%",
                    animation: "pulse 1s ease-in-out infinite",
                  }}
                />
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: "var(--primary)",
                    animation: `dotPulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Preview state */}
        {preview && !uploading && (
          <div className="flex flex-col gap-3">
            {preview.type === "image" ? (
              <div
                className="relative rounded-xl overflow-hidden"
                style={{ border: "1px solid var(--border)" }}
              >
                <img
                  src={preview.url}
                  alt="Invoice preview"
                  className="w-full object-cover"
                  style={{ maxHeight: "180px", objectFit: "cover" }}
                />
                {/* Success badge */}
                <div
                  className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold"
                  style={{ background: "var(--green-bg)", color: "var(--green)" }}
                >
                  ✓ Saved
                </div>
              </div>
            ) : (
              <div
                className="flex items-center gap-3 p-4 rounded-xl"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: "#fff", border: "1px solid var(--border)" }}
                >
                  📄
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
                    {preview.name}
                  </p>
                  <p className="text-xs font-medium mt-0.5" style={{ color: "var(--green)" }}>
                    ✓ PDF uploaded successfully
                  </p>
                </div>
                <a
                  href={preview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0"
                  style={{ background: "var(--primary-light)", color: "var(--primary)" }}
                >
                  View
                </a>
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
              style={{
                background: "var(--surface)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              Replace File
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs font-semibold mt-2" style={{ color: "var(--red)" }}>
            ⚠️ {error}
          </p>
        )}
      </div>

      {/* Hidden input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}