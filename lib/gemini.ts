import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface ExtractedWarrantyFields {
  productName: string | null;
  brand: string | null;
  purchaseDate: string | null;
  purchaseAmount: number | null;
  warrantyDurationMonths: number | null;
}

export async function extractWarrantyFields(
  ocrText: string
): Promise<ExtractedWarrantyFields> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

  const prompt = `You are an invoice data extraction system.
Extract the following fields from the receipt text below.
Return ONLY valid JSON with no markdown, no code blocks, no explanation.

Fields:
- productName: main product name (string or null)
- brand: brand/manufacturer name (string or null)
- purchaseDate: date of purchase in YYYY-MM-DD format (string or null)
- purchaseAmount: total amount paid as plain number without currency symbols (number or null)
- warrantyDurationMonths: warranty period in months as integer (number or null). Convert years to months if needed. Return null if not mentioned.

Rules:
- Return ONLY the JSON object, nothing else
- Use null if value cannot be determined
- purchaseAmount must be a plain number (e.g. 89999 not "89,999")

Receipt Text:
${ocrText}

JSON:`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned);

  return {
    productName: typeof parsed.productName === "string" ? parsed.productName : null,
    brand: typeof parsed.brand === "string" ? parsed.brand : null,
    purchaseDate: typeof parsed.purchaseDate === "string" ? parsed.purchaseDate : null,
    purchaseAmount: typeof parsed.purchaseAmount === "number" ? parsed.purchaseAmount : null,
    warrantyDurationMonths: typeof parsed.warrantyDurationMonths === "number" ? Math.round(parsed.warrantyDurationMonths) : null,
  };
}