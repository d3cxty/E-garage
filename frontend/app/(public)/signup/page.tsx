"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Spinner from "@/components/shared/Spinner";

export default function Signup(){
  const { signup } = useAuth();
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [busy,setBusy]=useState(false);
  const [showPw,setShowPw]=useState(false);
  const [error,setError]=useState<string|undefined>();
  const router=useRouter();

  const emailValid = /.+@.+\..+/.test(email.trim());
  const pwScore = passwordScore(password);
  const pwValid = pwScore >= 2; // at least medium
  const canSubmit = emailValid && pwValid && !busy;

  async function submit(e:React.FormEvent){
    e.preventDefault();
    if(!canSubmit) return;
    setBusy(true);
    setError(undefined);
    try{
      await signup(email.trim(),password);
      router.push('/dashoard');
    }catch(err:any){
      setError(err?.message || 'Could not create account. Please try again.');
    }finally{
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[70vh] grid place-items-center p-6">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4 border border-white/10 bg-white/5">
        <div className="text-center space-y-1">
          <div className="text-xl md:text-2xl font-semibold">Create Account</div>
          <p className="text-sm text-slate-400">Start managing your repairs and service history.</p>
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
          <p className="text-xs text-amber-300">Please enter a valid email.</p>
        )}

        {/* Password */}
        <label className="block text-sm font-medium text-slate-300">Password</label>
        <div className="relative">
          <input
            className="input pl-10 pr-12"
            type={showPw ? 'text' : 'password'}
            placeholder="Minimum 8 characters"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            required
            aria-invalid={!pwValid && password.length>0}
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

        {/* Strength meter */}
        <StrengthMeter score={pwScore} password={password} />
        {!pwValid && password.length>0 && (
          <p className="text-xs text-amber-300">Use 8+ chars including a number and a letter.</p>
        )}

        <button className="btn w-full relative disabled:opacity-60" disabled={!canSubmit}>
          {busy ? <Spinner/> : "Sign up"}
          {/* subtle glow */}
          {!busy && canSubmit && <span className="pointer-events-none absolute inset-0 rounded-lg shadow-[0_0_20px_2px_rgba(14,165,233,0.25)] animate-glow" />}
        </button>

        <p className="text-xs text-slate-500">
          By signing up you agree to our <a className="text-brand-500 hover:underline" href="#">Terms</a> and <a className="text-brand-500 hover:underline" href="#">Privacy</a>.
        </p>

        <div className="text-sm text-slate-400">
          Already have an account? <a className="text-brand-500 hover:underline" href="/login">Login</a>
        </div>
      </form>

      {/* styles + animations without new imports */}
      <style jsx global>{`
        @keyframes glow { 0%,100%{ opacity:.3 } 50%{ opacity:1 } }
        .animate-glow { animation: glow 2.4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

// --- helpers (no new imports) ---
function passwordScore(pw:string){
  let score = 0;
  if(pw.length >= 8) score++;
  if(/[a-z]/.test(pw)) score++;
  if(/[A-Z]/.test(pw)) score++;
  if(/\d/.test(pw) || /[^\w\s]/.test(pw)) score++;
  return Math.min(score, 4);
}

function StrengthMeter({ score, password }:{ score:number; password:string }){
  const labels = ['Too weak','Weak','Okay','Strong'];
  const active = Math.max(0, Math.min(3, score-1));
  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {Array.from({length:4}).map((_,i)=> (
          <div key={i} className={`h-1.5 w-full rounded-full ${i<=active ? strengthColor(score) : 'bg-slate-700'}`} />
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Password strength</span>
        <span className="text-slate-300">{password ? labels[active] : '—'}</span>
      </div>
    </div>
  );
}

function strengthColor(score:number){
  switch(score){
    case 1: return 'bg-red-500';
    case 2: return 'bg-amber-500';
    case 3: return 'bg-lime-500';
    case 4: return 'bg-emerald-500';
    default: return 'bg-slate-700';
  }
}
