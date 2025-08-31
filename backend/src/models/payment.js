import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", index: true, required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  amount: { type: Number, required: true },
  currency: { type: String, default: process.env.DEFAULT_CURRENCY || "RWF" },

  method: { type: String, enum: ["cash","momo","bank","card","mtnmomo","stripe"], default: "mtnmomo" },
  status: { type: String, enum: ["requested","paid","cancelled","failed","pending"], default: "requested", index: true },
  note: { type: String, default: "" },

  provider: { type: String, default: "mtnmomo" },
  providerRef: { type: String, default: "" }, // X-Reference-Id (UUID v4)
  link: { type: String, default: "" },        // not used by MoMo, kept for parity
  payer: {
    partyIdType: { type: String, default: "MSISDN" }, // per MoMo spec
    partyId: { type: String, default: "" },            // msisdn (e.g. 2507xxxxxxx)
  },

  raw: { type: Object, default: {} }, // last provider response for debug
}, { timestamps: true });

paymentSchema.index({ jobId: 1, createdAt: -1 });

export default mongoose.model("Payment", paymentSchema);
