import { NextRequest, NextResponse } from "next/server";
import { checkWarrantyExpirations } from "@/lib/automation/checkWarrantyExpirations";

// This endpoint is called by Vercel Cron daily at 9 AM
// Protected by CRON_SECRET to prevent unauthorized triggers
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Verify cron secret if set
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await checkWarrantyExpirations();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (err) {
    console.error("Cron check-warranties error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}