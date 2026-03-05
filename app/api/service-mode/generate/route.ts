import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/lib/models/Product";
import QrToken from "@/lib/models/QrToken";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    await connectToDatabase();

    // Verify product exists and belongs to this user
    const product = await Product.findOne({ _id: productId, userId });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Deactivate any existing active tokens for this product
    await QrToken.updateMany(
      { productId, userId, isActive: true },
      { $set: { isActive: false } }
    );

    // Generate secure unguessable token
    const token = crypto.randomUUID() + "-" + crypto.randomBytes(16).toString("hex");

    // Expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await QrToken.create({ token, productId, userId, expiresAt, isActive: true });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;
    const qrUrl = `${baseUrl}/service/view/${token}`;

    return NextResponse.json({ token, expiresAt, qrUrl });
  } catch (err) {
    console.error("Generate QR error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}