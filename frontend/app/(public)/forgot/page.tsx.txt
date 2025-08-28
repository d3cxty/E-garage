"use client";
import { useState } from "react";
import api from "@/lib/api";
import Spinner from "@/components/shared/Spinner";
import toast from "react-hot-toast";

export default function Forgot(){
  const [email,setEmail]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(e:React.FormEvent){ e.preventDefault(); setBusy(true); await api.post('/auth/forgot',{ email }).then(()=>toast.success("Reset link sent")).catch(()=>toast.error("Failed")); setBusy(false); }
  return (
    <div className="min-h-[70vh] grid place-items-center p-6">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-3">
        <div className="text-lg font-semibold">Forgot Password</div>
        <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <button className="btn w-full" disabled={busy}>{busy? <Spinner/> : "Send reset link"}</button>
      </form>
    </div>
  );
}
