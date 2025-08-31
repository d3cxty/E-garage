// frontend/lib/socket.ts
import { io } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL!; // e.g. http://localhost:5000

export const socket = io(API_URL, {
  path: "/socket.io",
  autoConnect: false,
  transports: ["websocket"], // avoid long-poll + 404 via Next
  withCredentials: true,
});

// helpful logs
socket.on("connect", () => console.log("socket connected", socket.id));
socket.on("connect_error", (err) => console.error("socket connect_error", err));
socket.on("disconnect", (reason) => console.log("socket disconnected", reason));
