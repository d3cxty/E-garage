import mongoose from 'mongoose';

const emailSchema = new mongoose.Schema(
  {
    from: String,
    to: String,
    subject: String,
    body: String,
    date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model('Email', emailSchema);
