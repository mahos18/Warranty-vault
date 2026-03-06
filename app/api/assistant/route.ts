import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/lib/models/Product";
import Manufacturer from "@/lib/models/Manufacturer";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: { message: "Unauthorized", code: 401 } }, { status: 401 });
    }

    const body = await req.json();
    const { messages: clientMessages, ...groqParams } = body;

    // ── Fetch real user products from MongoDB ──
    await connectToDatabase();

    const products = await Product.find({ userId })
      .sort({ warrantyExpiryDate: 1 })
      .lean();

    // ── Fetch manufacturers for brands user owns ──
    const brandSlugs = [...new Set(
      products.map((p) =>
        (p as { brand?: string }).brand
          ?.toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "") ?? ""
      ).filter(Boolean)
    )];

    const manufacturers = await Manufacturer.find({
      brandSlug: { $in: brandSlugs },
    }).lean();

    const today = new Date().toISOString().split("T")[0];

    // ── Build system prompt with real data ──
    const systemPrompt = `You are a Smart Warranty Assistant for a warranty tracking app called Warranty Vault.
You help users manage their product warranties. Be concise, warm, and helpful. Use emojis tastefully.

Today's date: ${today}

USER'S REGISTERED PRODUCTS (live from database):
${products.length > 0 ? JSON.stringify(products, null, 2) : "No products registered yet."}

MANUFACTURER SUPPORT POLICIES (for brands the user owns):
${manufacturers.length > 0 ? JSON.stringify(manufacturers, null, 2) : "No manufacturer data available."}

Rules:
- Always answer based on the user's actual products above
- Calculate days remaining from today's date: ${today}
- For warranty expiry questions, find the exact product and compute days left
- For claim guidance, give numbered step-by-step instructions from manufacturer claimSteps
- Format dates as human-readable (e.g. 13 February 2027)
- If user asks about a product not in their list, tell them it's not registered
- Use ** for bold text, keep responses concise
- Never make up product or warranty data`;

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY ?? ""}`,
      },
      body: JSON.stringify({
        ...groqParams,
        messages: [
          { role: "system", content: systemPrompt },
          ...clientMessages,
        ],
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Assistant route error:", err);
    return NextResponse.json(
      { error: { message: "Failed to reach Groq API", code: 500 } },
      { status: 500 }
    );
  }
}