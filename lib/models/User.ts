import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  clerkUserId: string;
  email: string;
  name: string;
  phone:string,
  notificationsEnabled:boolean,
  notificationsSetup:boolean,
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    clerkUserId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, default: "" },
    notificationsEnabled: { type: Boolean, default: false },
    notificationsSetup: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);

export default User;