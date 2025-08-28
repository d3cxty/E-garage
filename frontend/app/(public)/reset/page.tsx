"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import api from "@/lib/api";
import Spinner from "@/components/shared/Spinner";
import toast from "react-hot-toast";

export default function Reset(){
  const token = useSearchParams().get('token') || '';
  const router = useRouter();
  const [password,setPassword]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(e:React.FormEvent){ e.preventDefault(); setBusy(true);
    await api.post('/auth/reset',{ token, newPassword: password }).then(()=>{toast.success("Password updated"); router.push('/login');}).catch(()=>toast.error("Failed"));
    setBusy(false);
  }
  return (
    <div className="min-h-[70vh] grid place-items-center p-6">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-3">
        <div className="text-lg font-semibold">Set New Password</div>
        <input className="input" type="password" placeholder="New password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="btn w-full" disabled={busy}>{busy? <Spinner/> : "Reset password"}</button>
      </form>
    </div>
  );
}
