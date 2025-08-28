import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    room: { type: String, default: 'global', index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    sender: { type: String, required: true },
    text: { type: String, required: true },
    meta: { type: Object, default: {} }
  },
  { timestamps: true }
);

messageSchema.index({ room: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);
