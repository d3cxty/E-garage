import { Router } from "express";
import { auth } from "../utils/auth.js";
import { momoRequest, momoStatus, momoWebhook } from "../controllers/paymentController.js";

const r = Router();

// Staff/Admin create a MoMo request to pay
r.post("/momo/request", auth(["admin","staff"]), momoRequest);

// Anyone can check a status if they know the reference (client UI can poll)
r.get("/momo/:referenceId/status", auth(), momoStatus);

// MTN callback (no auth) — make sure your server is public or use a tunneling service in dev
r.post("/momo/webhook", momoWebhook);

export default r;
