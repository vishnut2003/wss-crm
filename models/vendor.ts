import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { VENDOR_STATUSES } from "@/lib/vendor";

// Re-export the pure-data constants so server code can keep importing them
// from this module if it's convenient — but client components MUST import
// from "@/lib/vendor" to avoid pulling Mongoose into the browser bundle.
export {
  VENDOR_STATUSES,
  VENDOR_STATUS_LABEL,
  VENDOR_STATUS_BADGE_CLASS,
  VENDOR_STATUS_DOT_CLASS,
  type VendorStatus,
} from "@/lib/vendor";

const addressSchema = new Schema(
  {
    line1: { type: String, trim: true, default: "" },
    line2: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "" },
    postalCode: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const vendorSchema = new Schema(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    displayName: { type: String, trim: true, default: "" },
    email: { type: String, lowercase: true, trim: true, default: null },
    phone: { type: String, trim: true, default: null },
    contactPerson: { type: String, trim: true, default: "" },
    address: { type: addressSchema, default: () => ({}) },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 15,
      default: "",
    },
    pan: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 10,
      default: "",
    },
    status: {
      type: String,
      enum: VENDOR_STATUSES,
      required: true,
      default: "active",
      index: true,
    },
    notes: { type: String, trim: true, default: "", maxlength: 4000 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

vendorSchema.index({ workspace: 1, status: 1 });
vendorSchema.index({ workspace: 1, name: 1 });
vendorSchema.index({ workspace: 1, gstin: 1 });

export type IVendor = InferSchemaType<typeof vendorSchema>;

if (process.env.NODE_ENV !== "production" && mongoose.models.Vendor) {
  mongoose.deleteModel("Vendor");
}

const Vendor: Model<IVendor> =
  (mongoose.models.Vendor as Model<IVendor> | undefined) ??
  mongoose.model<IVendor>("Vendor", vendorSchema);

export default Vendor;
