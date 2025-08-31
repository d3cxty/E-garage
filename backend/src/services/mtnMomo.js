import axios from "axios";
import crypto from "crypto";

const BASE = process.env.MOMO_BASE_URL || "https://sandbox.momodeveloper.mtn.com";
const SUB_KEY = process.env.MOMO_COLLECTION_SUB_KEY;
const API_USER = process.env.MOMO_COLLECTION_API_USER; // UUID
const API_KEY  = process.env.MOMO_COLLECTION_API_KEY;
const TARGET   = process.env.MOMO_TARGET_ENV || "sandbox";
const CALLBACK = process.env.MOMO_CALLBACK_URL; // public https URL (recommended)

if (!SUB_KEY || !API_USER || !API_KEY) {
  console.warn("[MoMo] Missing credentials: set MOMO_COLLECTION_SUB_KEY, MOMO_COLLECTION_API_USER, MOMO_COLLECTION_API_KEY");
}

export function uuidv4() {
  return crypto.randomUUID();
}

export async function getAccessToken() {
  // Basic base64(apiUser:apiKey)
  const basic = Buffer.from(`${API_USER}:${API_KEY}`).toString("base64");
  const { data } = await axios.post(
    `${BASE}/collection/token/`,
    null,
    {
      headers: {
        Authorization: `Basic ${basic}`,
        "Ocp-Apim-Subscription-Key": SUB_KEY,
      },
    }
  );
  return data?.access_token;
}

/**
 * RequestToPay: push a payment to customer's MoMo wallet.
 * msisdn format for Rwanda: "2507XXXXXXXX" (no +).
 */
export async function requestToPay({ amount, currency="RWF", payerMsisdn, referenceId, payerMessage="Payment", payeeNote="E-Garage" }) {
  const token = await getAccessToken();
  const refId = referenceId || uuidv4();

  const body = {
    amount: String(amount),
    currency,
    externalId: refId, // your correlation id
    payer: { partyIdType: "MSISDN", partyId: payerMsisdn },
    payerMessage,
    payeeNote,
  };

  const headers = {
    Authorization: `Bearer ${token}`,
    "X-Reference-Id": refId,
    "X-Target-Environment": TARGET,
    "Ocp-Apim-Subscription-Key": SUB_KEY,
    "Content-Type": "application/json",
  };

  if (CALLBACK) headers["X-Callback-Url"] = CALLBACK;

  await axios.post(`${BASE}/collection/v1_0/requesttopay`, body, { headers });
  return refId; // async accepted; status will be "pending" until checked/callback
}

export async function getRequestStatus(referenceId) {
  const token = await getAccessToken();
  const { data } = await axios.get(
    `${BASE}/collection/v1_0/requesttopay/${referenceId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Target-Environment": TARGET,
        "Ocp-Apim-Subscription-Key": SUB_KEY,
      },
    }
  );
  // data example: { amount,currency,financialTransactionId,payerMessage,payeeNote, status: "PENDING|SUCCESSFUL|FAILED", reason }
  return data;
}
