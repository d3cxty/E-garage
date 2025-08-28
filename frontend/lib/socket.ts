import { io } from "socket.io-client";
const base = process.env.NEXT_PUBLIC_API_URL;
if (!base) console.error("❌ Missing NEXT_PUBLIC_API_URL for socket");
export const socket = io(base || "/", { autoConnect: false });
