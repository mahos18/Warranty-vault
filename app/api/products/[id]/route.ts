import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/lib/models/Product";
import Manufacturer from "@/lib/models/Manufacturer";

type Params = { params: Promise<{ id: string }> };

// ── GET /api/products/:id ─────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectToDatabase();

    const product = await Product.findOne({ _id: id, userId }).lean();
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Try to find manufacturer by matching brand name → brandSlug
    const brandSlug = (product as { brand?: string }).brand
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") ?? "";

    const manufacturer = await Manufacturer.findOne({ brandSlug }).lean() ?? null;

    return NextResponse.json({ product, manufacturer });
  } catch (err) {
    console.error("GET /api/products/:id error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── DELETE /api/products/:id ──────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectToDatabase();

    const product = await Product.findOneAndDelete({ _id: id, userId });
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/products/:id error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}