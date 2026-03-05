import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQrToken extends Document {
  token: string;
  productId: mongoose.Types.ObjectId;
  userId: string;
  expiresAt: Date;
  isActive: boolean; 
  createdAt: Date;
}

const QrTokenSchema = new Schema<IQrToken>(
  {
    token: { type: String, required: true, unique: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    userId: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const QrToken: Model<IQrToken> =
  mongoose.models.QrToken ?? mongoose.model<IQrToken>("QrToken", QrTokenSchema);

export default QrToken;