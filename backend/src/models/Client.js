// models/Client.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const clientSchema = new Schema(
  {
    // Ownership (used to scope visibility)
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    ownerEmail: { type: String, lowercase: true, trim: true, index: true },

    // Existing fields
    names: String,
    carType: String,
    carMake: String,
    plateNumber: { type: String, index: true },
    issues: String,
    recoveredBy: { type: String, enum: ['owner', 'insurance', ''] },
    payment: { type: String, enum: ['paid', 'unpaid'], default: 'unpaid' },
    status: { type: String, enum: ['pending', 'repairing', 'completed'], default: 'pending' },
    photos: [String],
    proformaPath: { type: String, default: null },
  },
  { timestamps: true }
);

// Helpful indexes
clientSchema.index({ ownerId: 1, createdAt: -1 });
clientSchema.index({ ownerEmail: 1, createdAt: -1 });
clientSchema.index({ status: 1, payment: 1, createdAt: -1 });

export default mongoose.model('Client', clientSchema);
