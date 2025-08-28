"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import Spinner from "@/components/shared/Spinner";
import toast from "react-hot-toast";

export default function Verify(){
  const params = useSearchParams();
  const token = params.get('token');
  const router = useRouter();
  const [status,setStatus]=useState<'checking'|'ok'|'error'>( token ? 'checking' : 'ok');

  useEffect(()=>{
    if(!token){ return; }
    api.get('/auth/verify',{ params:{ token } })
      .then(()=>{ toast.success("Email verified!"); const u=localStorage.getItem('user'); const role = u? JSON.parse(u).role : 'client'; router.replace(role==='client'?'/client':'/dashboard'); })
      .catch(()=>{ toast.error("Verification failed"); setStatus('error'); });
  },[token,router]);

  if(status==='checking') return <div className="min-h-[70vh] grid place-items-center"><Spinner/></div>;
  return (
    <div className="min-h-[70vh] grid place-items-center p-6">
      <div className="card w-full max-w-md">
        <div className="text-lg font-semibold mb-2">Verification</div>
        {!token ? <p className="text-slate-300">We have sent a verification link to your email.</p> :
          <p className="text-slate-300">Processing verification…</p>}
      </div>
    </div>
  );
}
