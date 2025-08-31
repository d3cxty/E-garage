"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

type PaymentRow = {
  _id: string;
  jobId: string;
  amount: number;
  currency: string;
  status: "requested"|"paid"|"cancelled"|"failed"|"pending";
  provider: "mtnmomo";
  providerRef?: string;
  payer?: { partyId?: string };
  createdAt?: string;
};

export default function ClientMomoPay({
  jobId,
  defaultAmount,
  defaultCurrency = "RWF",
}: {
  jobId: string;
  defaultAmount: number;
  defaultCurrency?: string;
}) {
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [msisdn, setMsisdn] = useState<string>("2507"); // hint for Rwanda format
  const [loading, setLoading] = useState(false);
  const [refId, setRefId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  // poll status if we have a reference id
  useEffect(() => {
    if (!refId) return;
    setStatus("pending");
    const t = setInterval(async () => {
      try {
        const { data } = await api.get(`/payments/momo/${encodeURIComponent(refId)}/status`);
        setStatus(data?.status || "pending");
        if (data?.status === "paid" || data?.status === "failed") {
          clearInterval(t);
          toast.success(`Payment ${data?.status}`);
        }
      } catch (e:any) {
        console.error(e);
      }
    }, 5000);
    return () => clearInterval(t);
  }, [refId]);

  async function startPayment() {
    if (!amount || amount <= 0) return toast.error("Enter a valid amount");
    if (!/^\d{12}$/.test(msisdn)) {
      return toast.error("Phone must be 12 digits (e.g., 2507XXXXXXXX)");
    }
    setLoading(true);
    try {
      const { data } = await api.post("/payments/momo/request", {
        jobId,
        amount,
        phone: msisdn,
        currency: defaultCurrency,
        note: "E-Garage payment",
      });
      setRefId(data.referenceId);
      setStatus("pending");
      toast("USSD/App prompt sent to your phone. Complete the payment.");
    } catch (e:any) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card space-y-4">
      <div>
        <div className="text-lg font-semibold">Pay with MTN MoMo</div>
        <p className="text-slate-400 text-sm">Enter your mobile number and confirm on your phone.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <div className="text-xs text-slate-400 mb-1">Amount</div>
          <input
            className="input"
            type="number"
            value={amount}
            min={1}
            onChange={(e)=>setAmount(Number(e.target.value))}
          />
        </div>
        <div className="md:col-span-2">
          <div className="text-xs text-slate-400 mb-1">MSISDN (e.g., 2507XXXXXXX)</div>
          <input
            className="input"
            value={msisdn}
            onChange={(e)=>setMsisdn(e.target.value.replace(/[^\d]/g,''))}
            placeholder="2507XXXXXXXX"
            maxLength={12}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={startPayment} className="btn disabled:opacity-50" disabled={loading}>
          {loading ? "Sending…" : "Pay now"}
        </button>

        {refId && (
          <div className="text-sm">
            Status:{" "}
            <span className={
              status==="paid" ? "text-emerald-400" :
              status==="failed" ? "text-rose-400" :
              "text-yellow-300"
            }>
              {status || "pending"}
            </span>
          </div>
        )}
      </div>

      <div className="text-xs text-slate-400">
        You’ll receive a MoMo prompt. Confirm to complete payment.
      </div>
    </div>
  );
}
