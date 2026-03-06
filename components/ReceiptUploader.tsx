"use client";

import { useState, useRef } from "react";

interface ExtractedFields {
  productName: string | null;
  brand: string | null;
  purchaseDate: string | null;
  purchaseAmount: number | null;
  warrantyDurationMonths: number | null;
  warning?: string;
}

interface Props {
  onExtracted: (fields: ExtractedFields, imageUrl: string) => void;
}

type ScanState = "empty" | "preview" | "uploading" | "scanning" | "success" | "error";

export default function ReceiptUploader({ onExtracted }: Props) {
  const [state,      setState]      = useState<ScanState>("empty");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isPdf,      setIsPdf]      = useState(false);
  const [fileName,   setFileName]   = useState("");
  const [errorMsg,   setErrorMsg]   = useState<string>("");
  const [warning,    setWarning]    = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileIsPdf = file.type === "application/pdf";
    setIsPdf(fileIsPdf);
    setFileName(file.name);
    setErrorMsg("");
    setWarning("");

    if (fileIsPdf) {
      // PDFs can't be previewed as img — show a tile instead
      setPreviewUrl("");
    } else {
      setPreviewUrl(URL.createObjectURL(file));
    }

    setState("preview");
  }

  async function handleScan() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setErrorMsg("");
    setWarning("");

    // ── Step 1: Upload to Cloudinary ──
    setState("uploading");
    let imageUrl = "";
    try {
      const formData = new FormData();
      formData.append("receipt", file);

      const uploadRes = await fetch("/api/upload-receipt", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error ?? "Upload failed");
      imageUrl = uploadData.imageUrl;
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Upload failed. Please try again.");
      return;
    }

    // ── Step 2: OCR + AI Extraction ──
    setState("scanning");
    try {
      const extractRes = await fetch("/api/extract-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });

      const extractData = await extractRes.json();
      if (!extractRes.ok) throw new Error(extractData.error ?? "Extraction failed");

      if (extractData.warning) setWarning(extractData.warning);

      setState("success");
      onExtracted(extractData, imageUrl);
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Could not read file. Please fill manually.");
    }
  }

  function handleReset() {
    setState("empty");
    setPreviewUrl("");
    setIsPdf(false);
    setFileName("");
    setErrorMsg("");
    setWarning("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const isProcessing = state === "uploading" || state === "scanning";

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: "#fff", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>

      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
            style={{ background: "var(--primary-light)" }}>
            🧾
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              Scan Receipt
            </p>
            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Auto-fill from invoice image or PDF
            </p>
          </div>
        </div>
        {state !== "empty" && (
          <button onClick={handleReset}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
            style={{ background: "var(--surface)", color: "var(--text-secondary)" }}>
            Reset
          </button>
        )}
      </div>

      <div style={{ height: "1px", background: "var(--border)" }} />

      <div className="p-4">

        {/* ── EMPTY ── */}
        {state === "empty" && (
          <button onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-3 py-8 rounded-xl transition-all active:scale-[0.98]"
            style={{ border: "2px dashed var(--border)", background: "var(--surface)" }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                📷
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                📄
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                Upload Invoice or Receipt
              </p>
              <p className="text-xs font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>
                JPG, PNG, WebP or PDF · Max 10MB
              </p>
            </div>
            <span className="px-4 py-2 rounded-full text-xs font-bold"
              style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
              Choose File
            </span>
          </button>
        )}

        {/* ── PREVIEW ── */}
        {state === "preview" && (
          <div className="flex flex-col gap-3">
            {/* Image preview */}
            {!isPdf && previewUrl && (
              <div className="relative rounded-xl overflow-hidden"
                style={{ border: "1px solid var(--border)" }}>
                <img src={previewUrl} alt="Receipt preview"
                  className="w-full object-cover"
                  style={{ maxHeight: "200px", objectFit: "cover" }} />
              </div>
            )}

            {/* PDF tile */}
            {isPdf && (
              <div className="flex items-center gap-3 p-4 rounded-xl"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: "var(--red-bg)" }}>
                  📄
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
                    {fileName}
                  </p>
                  <p className="text-xs font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>
                    PDF · Ready to scan
                  </p>
                </div>
              </div>
            )}

            <button onClick={handleScan}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
              style={{ background: "var(--primary)" }}>
              <span>✨</span> Scan & Extract Details
            </button>

            <button onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
              style={{ background: "var(--surface)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
              Change File
            </button>
          </div>
        )}

        {/* ── UPLOADING / SCANNING ── */}
        {isProcessing && (
          <div className="flex flex-col items-center gap-4 py-6">
            {/* Thumbnail */}
            <div className="relative">
              {isPdf ? (
                <div className="w-20 h-20 rounded-xl flex items-center justify-center text-3xl"
                  style={{ background: "var(--red-bg)", border: "2px solid var(--primary-light)" }}>
                  📄
                </div>
              ) : previewUrl ? (
                <img src={previewUrl} alt="Receipt"
                  className="w-20 h-20 rounded-xl object-cover"
                  style={{ border: "2px solid var(--primary-light)", opacity: 0.7 }} />
              ) : null}

              {/* Scan animation */}
              <div className="absolute inset-0 rounded-xl overflow-hidden"
                style={{ border: "2px solid var(--primary)" }}>
                <div className="absolute w-full h-0.5"
                  style={{
                    background: "linear-gradient(to right, transparent, var(--primary), transparent)",
                    animation: "scanLine 1.5s ease-in-out infinite",
                  }} />
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                {[0, 0.2, 0.4].map((delay, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "var(--primary)", animation: `dotPulse 1.4s ease-in-out ${delay}s infinite` }} />
                ))}
              </div>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                {state === "uploading" ? "Uploading file..." : `Reading ${isPdf ? "PDF" : "image"} with AI...`}
              </p>
              <p className="text-xs font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>
                {state === "uploading" ? "Sending to cloud storage" : "Extracting product details"}
              </p>
            </div>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {state === "success" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "var(--green-bg)", border: "1px solid #BBF7D0" }}>
              <span className="text-xl">✅</span>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--green)" }}>
                  Details extracted successfully
                </p>
                <p className="text-xs font-medium mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  Form has been auto-filled. Review and confirm below.
                </p>
              </div>
            </div>

            {warning && (
              <div className="flex items-start gap-2 p-3 rounded-xl"
                style={{ background: "var(--amber-bg)", border: "1px solid #FDE68A" }}>
                <span className="text-sm">⚠️</span>
                <p className="text-xs font-medium" style={{ color: "var(--amber)" }}>{warning}</p>
              </div>
            )}

            {/* Show thumbnail of scanned file */}
            {isPdf ? (
              <div className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <span className="text-2xl">📄</span>
                <p className="text-xs font-semibold truncate" style={{ color: "var(--text-secondary)" }}>
                  {fileName}
                </p>
              </div>
            ) : previewUrl ? (
              <img src={previewUrl} alt="Receipt"
                className="w-full rounded-xl object-cover"
                style={{ maxHeight: "120px", objectFit: "cover", border: "1px solid var(--border)" }} />
            ) : null}
          </div>
        )}

        {/* ── ERROR ── */}
        {state === "error" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3 p-3 rounded-xl"
              style={{ background: "var(--red-bg)", border: "1px solid #FECACA" }}>
              <span className="text-lg">❌</span>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--red)" }}>Scan failed</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  {errorMsg}
                </p>
              </div>
            </div>
            <button onClick={() => setState("preview")}
              className="w-full py-3 rounded-xl text-sm font-bold active:scale-95 transition-transform"
              style={{ background: "var(--primary)", color: "#fff" }}>
              Try Again
            </button>
            <button onClick={handleReset}
              className="w-full py-2.5 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
              style={{ background: "var(--surface)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
              Fill Manually Instead
            </button>
          </div>
        )}
      </div>

      {/* Accept both images AND PDFs */}
      <input ref={fileInputRef} type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={handleFileSelect} />

      <style jsx>{`
        @keyframes scanLine {
          0% { top: 0%; }
          50% { top: 90%; }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  );
}