import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import PushSubscription from "@/lib/models/PushSubscription";
import User from "@/lib/models/User";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: "Invalid subscription object" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Upsert — update if endpoint exists, create if not
    await PushSubscription.findOneAndUpdate(
      { userId, endpoint },
      { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
      { upsert: true, new: true }
    );

    // Update user's notification preference
    await User.findOneAndUpdate(
      { clerkUserId: userId },
      { $set: { notificationsEnabled: true, notificationsSetup: true } }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — unsubscribe (user turns off notifications)
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { endpoint } = await req.json();

    await connectToDatabase();

    if (endpoint) {
      await PushSubscription.deleteOne({ userId, endpoint });
    } else {
      // Delete all subscriptions for this user
      await PushSubscription.deleteMany({ userId });
    }

    await User.findOneAndUpdate(
      { clerkUserId: userId },
      { $set: { notificationsEnabled: false } }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}