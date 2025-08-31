import mongoose from "mongoose";
import Payment from "../models/payment.js";
import { requestToPay, getRequestStatus } from "../services/mtnMomo.js";

/**
 * POST /payments/momo/request
 * Body: { jobId, amount, phone, currency?, note? }
 * Staff/Admin only
 */
export async function momoRequest(req, res) {
  try {
    const { jobId, amount, phone, currency = process.env.DEFAULT_CURRENCY || "RWF", note = "" } = req.body;

    if (!mongoose.isValidObjectId(jobId)) return res.status(400).json({ message: "Invalid jobId" });
    if (!amount || Number(amount) <= 0) return res.status(400).json({ message: "Amount must be > 0" });
    if (!phone) return res.status(400).json({ message: "phone (MSISDN) required" });

    // Normalize MSISDN (expect like 2507XXXXXXXX). You can add stricter validation if needed.
    const payerMsisdn = String(phone).replace(/[^\d]/g, "");

    // Create DB record first (pending/requested)
    const doc = await Payment.create({
      jobId,
      clientId: req.body.clientId || undefined,
      createdBy: req.user?.id,
      amount: Number(amount),
      currency,
      method: "mtnmomo",
      status: "pending",
      note,
      provider: "mtnmomo",
      payer: { partyIdType: "MSISDN", partyId: payerMsisdn },
    });

    // Fire MoMo request
    const refId = await requestToPay({
      amount,
      currency,
      payerMsisdn,
      referenceId: undefined,
      payerMessage: "E-Garage payment",
      payeeNote: note || "E-Garage",
    });

    // Save ref
    doc.providerRef = refId;
    await doc.save();

    return res.status(201).json({ ok: true, paymentId: doc._id, referenceId: refId, status: doc.status });
  } catch (e) {
    console.error("[momoRequest]", e?.response?.data || e.message);
    return res.status(500).json({ message: "MoMo request failed", detail: e?.response?.data || e.message });
  }
}

/**
 * GET /payments/momo/:referenceId/status
 * Checks the current status from MoMo and updates our DB.
 */
export async function momoStatus(req, res) {
  try {
    const { referenceId } = req.params;
    const data = await getRequestStatus(referenceId);

    // Map provider status to our status
    let status = "pending";
    if (data.status === "SUCCESSFUL") status = "paid";
    else if (data.status === "FAILED") status = "failed";
    else if (data.status === "PENDING") status = "pending";

    const doc = await Payment.findOneAndUpdate(
      { provider: "mtnmomo", providerRef: referenceId },
      { $set: { status, raw: data } },
      { new: true }
    );

    return res.json({ ok: true, status, payment: doc, provider: data });
  } catch (e) {
    console.error("[momoStatus]", e?.response?.data || e.message);
    return res.status(500).json({ message: "Status check failed", detail: e?.response?.data || e.message });
  }
}

/**
 * POST /payments/momo/webhook
 * Receive async callback from MTN (if you set X-Callback-Url).
 * Body typically mirrors getRequestStatus response + reference id in header/path (implementation varies).
 * We'll accept referenceId via query or body for safety.
 */
export async function momoWebhook(req, res) {
  try {
    const referenceId =
      req.query.referenceId ||
      req.headers["x-reference-id"] ||
      req.body?.referenceId ||
      req.body?.externalId;

    if (!referenceId) {
      // If MoMo doesn't include ref id in body/headers for your env, you can fallback to ignoring webhook.
      console.warn("[momoWebhook] No referenceId in callback");
      return res.status(202).json({ ok: true });
    }

    // Optionally, re-fetch official status to be sure:
    const data = await getRequestStatus(referenceId);

    let status = "pending";
    if (data.status === "SUCCESSFUL") status = "paid";
    else if (data.status === "FAILED") status = "failed";
    else status = "pending";

    await Payment.findOneAndUpdate(
      { provider: "mtnmomo", providerRef: referenceId },
      { $set: { status, raw: data } }
    );

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("[momoWebhook]", e?.response?.data || e.message);
    return res.status(200).json({ ok: true }); // acknowledge anyway to avoid retries storm
  }
}
