import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { PAYMENT_MODES, PAYMENT_STATUSES } from "@/lib/voucher";

const vendorSchema = new Schema(
  {
    refId: { type: Schema.Types.ObjectId, ref: "Vendor", default: null },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    company: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    gstin: { type: String, trim: true, uppercase: true, default: "" },
  },
  { _id: false },
);

const allocationSchema = new Schema(
  {
    invoice: {
      type: Schema.Types.ObjectId,
      ref: "PurchaseInvoice",
      required: true,
    },
    invoiceNumber: { type: String, trim: true, default: "" },
    amount: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false },
);

const paymentSchema = new Schema(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    number: { type: String, required: true, trim: true, maxlength: 32 },
    vendor: { type: vendorSchema, required: true },
    currency: { type: String, required: true, trim: true, default: "INR" },
    paymentDate: { type: Date, required: true, default: Date.now },
    amount: { type: Number, required: true, min: 0, default: 0 },
    paymentMode: {
      type: String,
      enum: PAYMENT_MODES,
      required: true,
      default: "bank",
    },
    reference: { type: String, trim: true, default: "", maxlength: 120 },
    allocations: { type: [allocationSchema], default: [] },
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      required: true,
      default: "cleared",
      index: true,
    },
    notes: { type: String, trim: true, default: "", maxlength: 2000 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
  },
  { timestamps: true },
);

paymentSchema.index({ workspace: 1, number: 1 }, { unique: true });
paymentSchema.index({ workspace: 1, status: 1 });
paymentSchema.index({ workspace: 1, updatedAt: -1 });
paymentSchema.index({ workspace: 1, "vendor.refId": 1 });
paymentSchema.index({ workspace: 1, "allocations.invoice": 1 });

export type IPayment = InferSchemaType<typeof paymentSchema>;

if (process.env.NODE_ENV !== "production" && mongoose.models.Payment) {
  mongoose.deleteModel("Payment");
}

const Payment: Model<IPayment> =
  (mongoose.models.Payment as Model<IPayment> | undefined) ??
  mongoose.model<IPayment>("Payment", paymentSchema);

export default Payment;
