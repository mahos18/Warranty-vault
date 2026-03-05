import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

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
  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content:
          "You are an invoice data extraction system. You always return only valid JSON with no markdown, no code blocks, no explanation.",
      },
      {
        role: "user",
        content: `Extract the following fields from this receipt text.
Return ONLY a valid JSON object, nothing else.

Fields:
- productName: main product name (string or null)
- brand: brand or manufacturer name (string or null)
- purchaseDate: date of purchase in YYYY-MM-DD format (string or null)
- purchaseAmount: total amount paid as a plain number without currency symbols (number or null)
- warrantyDurationMonths: warranty period in months as integer (number or null). Convert years to months if needed (1 year = 12). Return null if not mentioned.

Rules:
- Return ONLY the JSON object
- Use null if a value cannot be determined
- purchaseAmount must be a plain number like 89999 not "89,999"

Receipt Text:
${ocrText}`,
      },
    ],
  });

  const text = response.choices[0]?.message?.content?.trim() ?? "";

  // Strip accidental markdown code blocks
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
    warrantyDurationMonths:
      typeof parsed.warrantyDurationMonths === "number"
        ? Math.round(parsed.warrantyDurationMonths)
        : null,
  };
}