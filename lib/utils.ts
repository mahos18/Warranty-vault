export type WarrantyStatus = "active" | "expiring" | "expired";

/**
 * Calculates warranty expiry by adding months to purchase date.
 * Called server-side in API route only — never calculated on client.
 */
export function calculateWarrantyExpiry(purchaseDate: Date, warrantyDurationMonths: number): Date {
  const expiry = new Date(purchaseDate);
  expiry.setMonth(expiry.getMonth() + warrantyDurationMonths);
  return expiry;
}

/**
 * Determines warranty status:
 *   expired  → expiry date is before today
 *   expiring → expiry date is within 30 days from today
 *   active   → expiry date is more than 30 days away
 */
export function determineWarrantyStatus(warrantyExpiryDate: Date): WarrantyStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(warrantyExpiryDate);
  expiry.setHours(0, 0, 0, 0);

  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  if (expiry < today) return "expired";
  if (expiry <= thirtyDaysFromNow) return "expiring";
  return "active";
}

/** Returns days until expiry — negative means already expired */
export function getDaysRemaining(warrantyExpiryDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(warrantyExpiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** Human-readable days remaining string */
export function formatDaysRemaining(days: number): string {
  if (days < 0) return `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`;
  if (days === 0) return "Expires today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}