import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'staff','client'], default: 'client' }
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
