import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPushSubscription extends Document {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    userId:   { type: String, required: true, index: true },
    endpoint: { type: String, required: true, index: true },
    p256dh:   { type: String, required: true },
    auth:     { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Prevent duplicate subscriptions for same endpoint
PushSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true });

const PushSubscription: Model<IPushSubscription> =
  mongoose.models.PushSubscription ??
  mongoose.model<IPushSubscription>("PushSubscription", PushSubscriptionSchema);

export default PushSubscription;