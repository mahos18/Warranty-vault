import mongoose, { Schema, Document, Model } from "mongoose";

export type WarrantyStatus = "active" | "expiring" | "expired";

export interface IProduct extends Document {
  userId: string;             // Clerk userId
  productName: string;
  brand: string;
  category: string;
  serialNumber?: string;
  purchaseDate: Date;
  warrantyDurationMonths: number;
  warrantyExpiryDate: Date;   // Always calculated server-side
  purchaseAmount?: number;
  invoiceImageUrl?: string;
  warrantyStatus: WarrantyStatus;
  reminder30Sent: boolean;
  reminder7Sent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    userId: { type: String, required: true, index: true },    // Index for per-user queries
    productName: { type: String, required: true, trim: true },
    brand: { type: String, trim: true, default: "" },
    category: { type: String, required: true, trim: true },
    serialNumber: { type: String, trim: true },
    purchaseDate: { type: Date, required: true },
    warrantyDurationMonths: { type: Number, required: true, min: 1 },
    warrantyExpiryDate: { type: Date, required: true, index: true },  // Index for sorting
    purchaseAmount: { type: Number, min: 0 },
    invoiceImageUrl: { type: String, default: "" },
    warrantyStatus: {
      type: String,
      enum: ["active", "expiring", "expired"],
      required: true,
    },
    reminder30Sent: { type: Boolean, default: false },
    reminder7Sent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Product: Model<IProduct> =
  mongoose.models.Product ?? mongoose.model<IProduct>("Product", ProductSchema);

export default Product;