import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { SALES_ORDER_STATUSES } from "@/lib/voucher";

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

// Snapshot of the customer at order-creation time, so a later Customer edit
// or delete doesn't rewrite history. refId stays linked for lookups.
const customerSchema = new Schema(
  {
    refId: { type: Schema.Types.ObjectId, ref: "Customer", default: null },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    company: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    gstin: { type: String, trim: true, uppercase: true, default: "" },
  },
  { _id: false },
);

const salesOrderSchema = new Schema(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    number: { type: String, required: true, trim: true, maxlength: 32 },
    customer: { type: customerSchema, required: true },
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
      enum: SALES_ORDER_STATUSES,
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

salesOrderSchema.index({ workspace: 1, number: 1 }, { unique: true });
salesOrderSchema.index({ workspace: 1, status: 1 });
salesOrderSchema.index({ workspace: 1, updatedAt: -1 });
salesOrderSchema.index({ workspace: 1, "customer.refId": 1 });

export type ISalesOrder = InferSchemaType<typeof salesOrderSchema>;

if (process.env.NODE_ENV !== "production" && mongoose.models.SalesOrder) {
  mongoose.deleteModel("SalesOrder");
}

const SalesOrder: Model<ISalesOrder> =
  (mongoose.models.SalesOrder as Model<ISalesOrder> | undefined) ??
  mongoose.model<ISalesOrder>("SalesOrder", salesOrderSchema);

export default SalesOrder;
