import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import QrToken from "@/lib/models/QrToken";
import Product from "@/lib/models/Product";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    await connectToDatabase();

    const qrToken = await QrToken.findOne({ token });

    // Token not found
    if (!qrToken) {
      return NextResponse.json({ error: "invalid" }, { status: 404 });
    }

    // Token expired — mark inactive and reject
    if (new Date() > qrToken.expiresAt) {
      await QrToken.findByIdAndUpdate(qrToken._id, { isActive: false });
      return NextResponse.json({ error: "expired" }, { status: 410 });
    }

    // Token explicitly deactivated
    if (!qrToken.isActive) {
      return NextResponse.json({ error: "expired" }, { status: 410 });
    }

    // Fetch product — only expose safe read-only fields, never userId
    const product = await Product.findById(qrToken.productId).select(
      "productName brand category serialNumber purchaseDate warrantyExpiryDate warrantyStatus invoiceImageUrl warrantyDurationMonths"
    ).lean();

    if (!product) {
      return NextResponse.json({ error: "invalid" }, { status: 404 });
    }

    return NextResponse.json({
      product,
      expiresAt: qrToken.expiresAt,
    });
  } catch (err) {
    console.error("View token error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}