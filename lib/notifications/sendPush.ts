import webPush from "web-push";

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
 * VAPID details set lazily inside the function — not at module load time.
 * This prevents build-time errors when env vars are not available.
 */
export async function sendPush(
  subscription: PushSubscriptionKeys,
  payload: PushPayload
): Promise<boolean> {
  try {
    const publicKey  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const email      = process.env.VAPID_EMAIL;

    if (!publicKey || !privateKey || !email) {
      console.error("VAPID env variables not set — skipping push");
      return false;
    }

    // Set inside the function so it only runs at request time, not build time
    webPush.setVapidDetails(`mailto:${email}`, publicKey, privateKey);

    await webPush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth:   subscription.auth,
        },
      },
      JSON.stringify(payload)
    );

    return true;
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) {
      console.log("Push subscription expired:", subscription.endpoint);
    } else {
      console.error("Push send failed:", err);
    }
    return false;
  }
}