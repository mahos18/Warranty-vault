import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/lib/models/Product";
import User from "@/lib/models/User";
import { calculateWarrantyExpiry, determineWarrantyStatus } from "@/lib/utils";

// GET /api/products — returns all products for authenticated user, sorted by nearest expiry
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Only return this user's products, sorted by warranty expiry (soonest first)
    const products = await Product.find({ userId })
      .sort({ warrantyExpiryDate: 1 })
      .lean();

    return NextResponse.json({ products });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/products — creates a new product with server-side calculated expiry
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Upsert user record on first interaction
    const clerkUser = await auth();
    await User.findOneAndUpdate(
      { clerkUserId: userId },
      { clerkUserId: userId, email: "", name: "" },
      { upsert: true, setDefaultsOnInsert: true }
    );

    const body = await req.json();

    // Validate required fields
    const { productName, category, purchaseDate, warrantyDurationMonths } = body;
    if (!productName || !category || !purchaseDate || !warrantyDurationMonths) {
      return NextResponse.json(
        { error: "Missing required fields: productName, category, purchaseDate, warrantyDurationMonths" },
        { status: 400 }
      );
    }

    const duration = parseInt(warrantyDurationMonths, 10);
    if (isNaN(duration) || duration < 1) {
      return NextResponse.json({ error: "warrantyDurationMonths must be a positive integer" }, { status: 400 });
    }

    const parsedPurchaseDate = new Date(purchaseDate);
    if (isNaN(parsedPurchaseDate.getTime())) {
      return NextResponse.json({ error: "Invalid purchaseDate" }, { status: 400 });
    }

    // SERVER-SIDE ONLY: Calculate expiry date — never trust client-provided values
    const warrantyExpiryDate = calculateWarrantyExpiry(parsedPurchaseDate, duration);

    // Determine status based on calculated expiry
    const warrantyStatus = determineWarrantyStatus(warrantyExpiryDate);

    const product = await Product.create({
      userId,
      productName: productName.trim(),
      brand: body.brand?.trim() || "",
      category: category.trim(),
      serialNumber: body.serialNumber?.trim(),
      purchaseDate: parsedPurchaseDate,
      warrantyDurationMonths: duration,
      warrantyExpiryDate,    // ← Server calculated
      warrantyStatus,        // ← Server determined
      purchaseAmount: body.purchaseAmount ? parseFloat(body.purchaseAmount) : undefined,
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}