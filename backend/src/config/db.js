import mongoose from 'mongoose';
import env from './env.js';


export async function connectDB() {
try {
await mongoose.connect(env.MONGO_URI);
console.log('MongoDB connected');
} catch (err) {
console.error('MongoDB connection error:', err.message);
process.exit(1);
}
}