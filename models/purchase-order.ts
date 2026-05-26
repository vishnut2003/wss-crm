import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { PURCHASE_ORDER_STATUSES } from "@/lib/voucher";

const itemSchema = new Schema(
  {
    description: { type: String, required: true, trim: true, maxlength: 500 },
    quantity: { type: Number, required: true, min: 0, default: 1 },
    unitPrice: { type: Number, required: true, min: 0, default: 0 },
    taxRate: { type: Number, required: true, min: 0, max: 100, default: 0 },
    lineTotal: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false },
);

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

const purchaseOrderSchema = new Schema(
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
    orderDate: { type: Date, required: true, default: Date.now },
    expectedDate: { type: Date, default: null },
    items: { type: [itemSchema], default: [] },
    subtotal: { type: Number, required: true, min: 0, default: 0 },
    taxTotal: { type: Number, required: true, min: 0, default: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0, default: 0 },
    status: {
      type: String,
      enum: PURCHASE_ORDER_STATUSES,
      required: true,
      default: "draft",
      index: true,
    },
    notes: { type: String, trim: true, default: "", maxlength: 4000 },
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

purchaseOrderSchema.index({ workspace: 1, number: 1 }, { unique: true });
purchaseOrderSchema.index({ workspace: 1, status: 1 });
purchaseOrderSchema.index({ workspace: 1, updatedAt: -1 });
purchaseOrderSchema.index({ workspace: 1, "vendor.refId": 1 });

export type IPurchaseOrder = InferSchemaType<typeof purchaseOrderSchema>;

if (process.env.NODE_ENV !== "production" && mongoose.models.PurchaseOrder) {
  mongoose.deleteModel("PurchaseOrder");
}

const PurchaseOrder: Model<IPurchaseOrder> =
  (mongoose.models.PurchaseOrder as Model<IPurchaseOrder> | undefined) ??
  mongoose.model<IPurchaseOrder>("PurchaseOrder", purchaseOrderSchema);

export default PurchaseOrder;
