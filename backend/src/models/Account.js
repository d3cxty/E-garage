import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema(
  {
    name: { type: String, default: 'AutoCare Garage' },
    email: { type: String, default: 'service@company.com' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    logoPath: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.model('Account', accountSchema);
