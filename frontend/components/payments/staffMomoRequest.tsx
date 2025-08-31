"use client";
import { useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function StaffMomoRequest() {
  const [jobId, setJobId] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [msisdn, setMsisdn] = useState("2507");
  const [refId, setRefId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  async function createReq() {
    if (!jobId) return toast.error("Enter jobId");
    if (!amount || amount <= 0) return toast.error("Amount must be > 0");
    if (!/^\d{12}$/.test(msisdn)) return toast.error("MSISDN must be 12 digits (2507...)");
    try {
      const { data } = await api.post("/payments/momo/request", {
        jobId, amount, phone: msisdn, currency: "RWF", note: "Service fee",
      });
      setRefId(data.referenceId);
      setStatus("pending");
      toast.success("Request sent");
    } catch (e:any) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Failed");
    }
  }

  async function check() {
    if (!refId) return;
    const { data } = await api.get(`/payments/momo/${encodeURIComponent(refId)}/status`);
    setStatus(data?.status || "pending");
  }

  return (
    <div className="card space-y-3">
      <div className="text-lg font-semibold">Create MoMo Request</div>
      <input className="input" placeholder="jobId (ObjectId)" value={jobId} onChange={e=>setJobId(e.target.value)} />
      <input className="input" type="number" placeholder="Amount" value={amount || ""} onChange={e=>setAmount(Number(e.target.value))} />
      <input className="input" placeholder="MSISDN e.g. 2507XXXXXXX" value={msisdn} onChange={e=>setMsisdn(e.target.value.replace(/[^\d]/g,''))} />
      <div className="flex gap-2">
        <button onClick={createReq} className="btn">Request to Pay</button>
        {refId && <button onClick={check} className="px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700">Check status</button>}
      </div>
      {refId && (
        <div className="text-sm text-slate-300">
          Ref: <span className="font-mono">{refId}</span> — Status:{" "}
          <span className={
            status==="paid" ? "text-emerald-400" :
            status==="failed" ? "text-rose-400" :
            "text-yellow-300"
          }>{status || "pending"}</span>
        </div>
      )}
    </div>
  );
}
