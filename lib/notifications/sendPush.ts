import webPush from "web-push";

webPush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL!}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export interface PushSubscriptionKeys {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Sends a push notification to a single subscription.
 * Returns true on success, false on failure (never throws).
 */
export async function sendPush(
  subscription: PushSubscriptionKeys,
  payload: PushPayload
): Promise<boolean> {
  try {
    await webPush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload)
    );
    return true;
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode;
    // 404 / 410 = subscription expired or unsubscribed — safe to ignore
    if (status === 404 || status === 410) {
      console.log("Push subscription expired:", subscription.endpoint);
    } else {
      console.error("Push send failed:", err);
    }
    return false;
  }
}