import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { extractWarrantyFields } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    // const { userId } = await auth();
    // if (!userId) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return NextResponse.json({ error: "No image URL provided" }, { status: 400 });
    }

    const ocrServerUrl = process.env.OCR_SERVER_URL;
    const ocrSecret = process.env.OCR_SECRET;
    

    if (!ocrServerUrl || !ocrSecret) {
      return NextResponse.json({ error: "OCR server not configured." }, { status: 500 });
    }

    // Step 1: Call Railway OCR server (Tesseract.js)
    let rawText = "";
    try {
      const ocrRes = await fetch(`${ocrServerUrl}/ocr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ocr-secret": ocrSecret,
        },
        body: JSON.stringify({ imageUrl }),
      });
      

      const ocrData = await ocrRes.json();
      if (!ocrRes.ok) throw new Error(ocrData.error ?? "OCR failed");
      rawText = ocrData.data.rawText ?? "";
    } catch (ocrErr) {
      console.error("OCR server error:", ocrErr);
      return NextResponse.json(
        { error: "Could not read text from image. Try a clearer photo." },
        { status: 422 }
      );
    }

    if (!rawText || rawText.length < 10) {
      return NextResponse.json(
        { error: "No readable text found. Try a clearer photo." },
        { status: 422 }
      );
    }

    // Step 2: Gemini extracts structured fields from OCR text
    try {
      const extracted = await extractWarrantyFields(rawText);
      return NextResponse.json({ ...extracted, rawText });
    } catch (geminiErr) {
      console.error("Gemini extraction failed:", geminiErr);
      return NextResponse.json({
        productName: null, brand: null, purchaseDate: null,
        purchaseAmount: null, warrantyDurationMonths: null,
        rawText,
        warning: "AI extraction failed. Please fill in manually.",
      });
    }
  } catch (err) {
    console.error("Extract receipt error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}