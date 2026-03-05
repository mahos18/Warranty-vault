import { NextResponse } from "next/server";
import { checkWarrantyExpirations } from "@/lib/automation/checkWarrantyExpirations";

// Manual trigger for testing — only runs in non-production or with dev secret
export async function GET() {
  try {
    console.log("Manual warranty check triggered via /api/dev/test-reminders");
    const result = await checkWarrantyExpirations();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: "Warranty check completed",
      ...result,
    });
  } catch (err) {
    console.error("Test reminders error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}