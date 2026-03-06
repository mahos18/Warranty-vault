import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/lib/models/Product";
import PushSubscription from "@/lib/models/PushSubscription";
import { sendPush } from "@/lib/notifications/sendPush";

export async function checkWarrantyExpirations(): Promise<{
  checked: number;
  notified: number;
  errors: number;
}> {
  await connectToDatabase();

  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);

  const in30Days = new Date(now);
  in30Days.setUTCDate(now.getUTCDate() + 30);
  in30Days.setUTCHours(23, 59, 59, 999);

  const in7Days = new Date(now);
  in7Days.setUTCDate(now.getUTCDate() + 7);
  in7Days.setUTCHours(23, 59, 59, 999);

  // ── 30-day reminder ──
  // Products expiring within the next 30 days, reminder not yet sent
  // This catches newly added products that are already close to expiry
  const expiring30 = await Product.find({
    warrantyExpiryDate: { $gte: now, $lte: in30Days },
    reminder30Sent: false,
  });

  // ── 7-day reminder ──
  // Products expiring within the next 7 days, reminder not yet sent
  const expiring7 = await Product.find({
    warrantyExpiryDate: { $gte: now, $lte: in7Days },
    reminder7Sent: false,
  });

  let notified = 0;
  let errors = 0;
  const checked = expiring30.length + expiring7.length;

  console.log(`Warranty check: ${expiring30.length} need 30d reminder, ${expiring7.length} need 7d reminder`);

  async function notify(
    product: (typeof expiring30)[0],
    payload: { title: string; body: string; url: string; tag: string },
    flag: "reminder30Sent" | "reminder7Sent"
  ) {
    try {
      const subscriptions = await PushSubscription.find({ userId: product.userId });

      // Always mark as sent — even if no subscription, prevents endless re-checking
      await Product.findByIdAndUpdate(product._id, { [flag]: true });

      if (subscriptions.length === 0) {
        console.log(`No push subscription for user ${product.userId} — marked sent`);
        return;
      }

      let sent = false;
      for (const sub of subscriptions) {
        const ok = await sendPush(sub, payload);
        if (ok) sent = true;
      }

      if (sent) notified++;
    } catch (err) {
      console.error(`Error sending ${flag} for product ${product._id}:`, err);
      errors++;
    }
  }

  // Process 30-day reminders
  for (const product of expiring30) {
    const daysLeft = Math.ceil(
      (new Date(product.warrantyExpiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    await notify(
      product,
      {
        title: "Warranty Expiring Soon ⏰",
        body: `Your ${product.productName} warranty expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}.`,
        url: `/product/${product._id}`,
        tag: `warranty-30-${product._id}`,
      },
      "reminder30Sent"
    );
  }

  // Process 7-day reminders
  for (const product of expiring7) {
    const daysLeft = Math.ceil(
      (new Date(product.warrantyExpiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    await notify(
      product,
      {
        title: "Warranty Expires in 7 Days 🚨",
        body: `Your ${product.productName} warranty expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}. Act now!`,
        url: `/product/${product._id}`,
        tag: `warranty-7-${product._id}`,
      },
      "reminder7Sent"
    );
  }

  console.log(`Done: checked=${checked}, notified=${notified}, errors=${errors}`);
  return { checked, notified, errors };
}