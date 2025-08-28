"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Spinner from "@/components/shared/Spinner";

export default function Login(){
  const { login } = useAuth();

  // preload last used email if available (no extra imports)
  const [email,setEmail]=useState<string>(()=>{
    if (typeof window !== 'undefined') return localStorage.getItem('lastEmail') || "";
    return "";
  });
  const [password,setPassword]=useState("");
  const [busy,setBusy]=useState(false);
  const [showPw,setShowPw]=useState(false);
  const [remember,setRemember]=useState(true);
  const [error,setError]=useState<string|undefined>();

  const router=useRouter();

  const emailValid = /.+@.+\..+/.test(email.trim());
  const canSubmit = emailValid && password.length>0 && !busy;

  async function submit(e:React.FormEvent){
    e.preventDefault();
    if(!canSubmit) return;
    setBusy(true);
    setError(undefined);
    try{
      await login(email.trim(),password);
      // remember email convenience
      if (remember) localStorage.setItem('lastEmail', email.trim());
      else localStorage.removeItem('lastEmail');
      // redirect after successful login
      router.push('/dashboard');
    }catch(err:any){
      setError(err?.message || 'Login failed. Please check your credentials and try again.');
    }finally{
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[70vh] grid place-items-center p-6">
      <form onSubmit={submit} className={`card w-full max-w-sm space-y-4 border border-white/10 bg-white/5 ${error ? 'animate-shake' : ''}`}>
        <div className="text-center space-y-1">
          <div className="text-xl font-semibold">Sign In</div>
          <p className="text-sm text-slate-400">Welcome back! Please enter your details.</p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Email */}
        <label className="block text-sm font-medium text-slate-300">Email</label>
        <div className="relative">
          <input
            className="input pl-10"
            placeholder="name@example.com"
            type="email"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            required
            aria-invalid={!emailValid && email.length>0}
          />
          {/* mail icon */}
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16v16H4z"/>
            <path d="M22 6l-10 7L2 6"/>
          </svg>
        </div>
        {!emailValid && email.length>0 && (
          <p className="-mt-2 text-xs text-amber-300">Please enter a valid email.</p>
        )}

        {/* Password */}
        <label className="block text-sm font-medium text-slate-300">Password</label>
        <div className="relative">
          <input
            className="input pl-10 pr-12"
            type={showPw ? 'text' : 'password'}
            placeholder="Your password"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            required
          />
          {/* lock icon */}
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="11" width="14" height="10" rx="2"/>
            <path d="M7 11V8a5 5 0 0110 0v3"/>
          </svg>
          {/* show/hide */}
          <button type="button" onClick={()=>setShowPw(v=>!v)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs text-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40">
            {showPw ? 'Hide' : 'Show'}
          </button>
        </div>

        {/* Remember + Forgot */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-900 align-middle" />
            Remember me
          </label>
          <a className="text-brand-500 hover:underline" href="/forgot">Forgot password?</a>
        </div>

        <button className="btn w-full relative disabled:opacity-60" disabled={!canSubmit}>
          {busy ? <Spinner/> : "Login"}
          {!busy && canSubmit && <span className="pointer-events-none absolute inset-0 rounded-lg shadow-[0_0_20px_2px_rgba(14,165,233,0.25)] animate-glow" />}
        </button>

        <div className="text-sm text-slate-400">
          New here? <a className="text-brand-500 hover:underline" href="/signup">Create an account</a>
        </div>
      </form>

      {/* styles + animations without new imports */}
      <style jsx global>{`
        @keyframes glow { 0%,100%{ opacity:.3 } 50%{ opacity:1 } }
        .animate-glow { animation: glow 2.4s ease-in-out infinite; }
        @keyframes shake { 10%, 90% { transform: translateX(-1px); } 20%, 80% { transform: translateX(2px); } 30%, 50%, 70% { transform: translateX(-4px); } 40%, 60% { transform: translateX(4px); } }
        .animate-shake { animation: shake .45s ease-in-out; }
      `}</style>
    </div>
  );
}
