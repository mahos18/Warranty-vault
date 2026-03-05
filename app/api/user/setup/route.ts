import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();

    let user = await User.findOne({ clerkUserId: userId });

    // First visit — create user record now, no webhook needed
    if (!user) {
      const clerkUser = await currentUser();
      user = await User.create({
        clerkUserId: userId,
        email: clerkUser?.emailAddresses?.[0]?.emailAddress ?? "",
        name: `${clerkUser?.firstName ?? ""} ${clerkUser?.lastName ?? ""}`.trim(),
        phone: "",
        notificationsEnabled: false,
        notificationsSetup: false,
      });
    }

    return NextResponse.json({
      notificationsSetup: user.notificationsSetup,
      notificationsEnabled: user.notificationsEnabled,
      phone: user.phone ?? "",
    });
  } catch (err) {
    console.error("GET /api/user/setup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { phone, notificationsEnabled } = await req.json();

    await connectToDatabase();
    const clerkUser = await currentUser();

    await User.findOneAndUpdate(
      { clerkUserId: userId },
      {
        $set: {
          email: clerkUser?.emailAddresses?.[0]?.emailAddress ?? "",
          name: `${clerkUser?.firstName ?? ""} ${clerkUser?.lastName ?? ""}`.trim(),
          phone: phone?.trim() ?? "",
          notificationsEnabled: Boolean(notificationsEnabled),
          notificationsSetup: true,
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/user/setup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}