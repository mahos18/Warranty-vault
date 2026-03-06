import mongoose, { Schema, Document, Model } from "mongoose";

export interface IManufacturer extends Document {
  name: string;
  brandSlug: string;
  supportPhone: string;
  supportWebsite: string;
  supportEmail: string;
  defaultWarrantyMonths: number;
  extendedWarrantyAvailable: boolean;
  onlineClaimUrl: string;
  requiredDocuments: string[];
  claimSteps: string[];
  supportedCategories: string[];
}

const ManufacturerSchema = new Schema<IManufacturer>({
  name:                     { type: String, required: true },
  brandSlug:                { type: String, required: true, unique: true, index: true },
  supportPhone:             { type: String, default: "" },
  supportWebsite:           { type: String, default: "" },
  supportEmail:             { type: String, default: "" },
  defaultWarrantyMonths:    { type: Number, default: 12 },
  extendedWarrantyAvailable:{ type: Boolean, default: false },
  onlineClaimUrl:           { type: String, default: "" },
  requiredDocuments:        [{ type: String }],
  claimSteps:               [{ type: String }],
  supportedCategories:      [{ type: String }],
});

const Manufacturer: Model<IManufacturer> =
  mongoose.models.Manufacturer ??
  mongoose.model<IManufacturer>("Manufacturer", ManufacturerSchema);

export default Manufacturer;