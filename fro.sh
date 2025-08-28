#!/usr/bin/env bash
set -euo pipefail

APP="frontend"
mkdir -p "$APP"
cd "$APP"

# ---------- package/config ----------
cat > package.json <<'EOF'
{
  "name": "e-garage-frontend",
  "version": "4.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001"
  },
  "dependencies": {
    "axios": "^1.7.7",
    "clsx": "^2.1.1",
    "lucide-react": "^0.454.0",
    "next": "14.2.5",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-hot-toast": "^2.4.1",
    "socket.io-client": "^4.7.5",
    "timeago.js": "^4.0.2"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.41",
    "tailwindcss": "^3.4.10",
    "typescript": "^5.5.4"
  }
}
EOF

cat > next.config.mjs <<'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = { reactStrictMode: true };
export default nextConfig;
EOF

cat > postcss.config.js <<'EOF'
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };
EOF

cat > tailwind.config.ts <<'EOF'
import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT:'#0ea5e9', 600:'#0284c7', 700:'#0369a1' }
      },
      boxShadow: { soft:'0 8px 30px rgba(2,8,23,0.35)' }
    }
  },
  plugins: []
}
export default config
EOF

cat > tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "ES2022"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] },
    "resolveJsonModule": true,
    "esModuleInterop": true
  },
  "include": ["app", "components", "lib", "next-env.d.ts"]
}
EOF

cat > next-env.d.ts <<'EOF'
/// <reference types="next" />
EOF

cat > .env.local.example <<'EOF'
NEXT_PUBLIC_API_URL=http://localhost:5000
EOF

# ---------- folders (quoted) ----------
mkdir -p "app" \
         "app/(public)" \
         "app/(public)/login" \
         "app/(public)/signup" \
         "app/(public)/forgot" \
         "app/(public)/reset" \
         "app/(public)/verify" \
         "app/(client)" \
         "app/(client)/client" \
         "app/(client)/client/jobs" \
         "app/(client)/client/jobs/[id]" \
         "app/(client)/client/jobs/new" \
         "app/(staff)" \
         "app/(staff)/dashboard" \
         "app/(staff)/jobs" \
         "app/(staff)/jobs/[id]" \
         "app/(staff)/emails" \
         "app/(staff)/chat" \
         "app/(staff)/account" \
         "components/layout" \
         "components/chat" \
         "components/shared" \
         "lib"

# ---------- global styles ----------
cat > "app/globals.css" <<'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root { color-scheme: dark; }
body { background:#0b1220; color:white; }

.btn { @apply px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 transition; }
.card { @apply rounded-2xl bg-slate-900/70 border border-slate-800 p-5 shadow-soft; }
.input { @apply px-3 py-2 rounded-md bg-slate-800 outline-none w-full; }
.select { @apply px-3 py-2 rounded-md bg-slate-800 outline-none; }
EOF

# ---------- root layout (no navbar/sidebar; groups handle shells) ----------
cat > "app/layout.tsx" <<'EOF'
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "react-hot-toast";

export const metadata = { title: "E-Garage", description: "Garage Management" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <Toaster position="top-right" toastOptions={{ style: { background: '#1f2937', color: 'white' } }} />
        </AuthProvider>
      </body>
    </html>
  );
}
EOF
# ---------- lib ----------
cat > "lib/api.ts" <<'EOF'
import axios from "axios";
const base = process.env.NEXT_PUBLIC_API_URL;
if (!base) console.error("❌ Missing NEXT_PUBLIC_API_URL in .env.local");
const api = axios.create({ baseURL: base || "/" });
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = "Bearer " + token;
  }
  return config;
});
export default api;
EOF

cat > "lib/socket.ts" <<'EOF'
import { io } from "socket.io-client";
const base = process.env.NEXT_PUBLIC_API_URL;
if (!base) console.error("❌ Missing NEXT_PUBLIC_API_URL for socket");
export const socket = io(base || "/", { autoConnect: false });
EOF

cat > "lib/auth.tsx" <<'EOF'
"use client";
import { createContext, useContext, useEffect, useState } from "react";
import api from "./api";
import toast from "react-hot-toast";

type Role = "admin" | "staff" | "client";
type User = { email: string; role: Role; verified?: boolean } | null;
type AuthCtx = {
  user: User;
  loading: boolean;
  login: (e: string, p: string) => Promise<void>;
  signup: (e: string, p: string) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    if (t && u) setUser(JSON.parse(u));
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      const u: User = { email, role: data.role, verified: data.verified };
      localStorage.setItem("user", JSON.stringify(u));
      setUser(u);
      if (!data.verified) toast.error("Please verify your email first.");
    } catch {
      toast.error("Invalid credentials");
    }
  }

  async function signup(email: string, password: string) {
    try {
      const { data } = await api.post("/auth/register", { email, password });
      localStorage.setItem("token", data.token);
      const u: User = { email, role: data.role, verified: data.verified };
      localStorage.setItem("user", JSON.stringify(u));
      setUser(u);
      toast.success("Signup successful. Check your email for verification.");
    } catch {
      toast.error("Signup failed");
    }
  }

  function logout() {
    localStorage.clear();
    setUser(null);
    window.location.href = "/";
  }

  return <Ctx.Provider value={{ user, loading, login, signup, logout }}>{children}</Ctx.Provider>;
}
export function useAuth(){ const v = useContext(Ctx); if(!v) throw new Error("useAuth outside provider"); return v; }
EOF

cat > "lib/guards.tsx" <<'EOF'
"use client";
import { useAuth } from "./auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [loading, user, router]);
  if (!user) return null;
  return <>{children}</>;
}

export function StaffOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    if (!user) return router.replace("/login");
    if (user.role === "client") router.replace("/client");
  }, [loading, user, router]);
  if (!user || user.role === "client") return null;
  return <>{children}</>;
}

export function ClientOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    if (!user) return router.replace("/login");
    if (user.role !== "client") router.replace("/dashboard");
  }, [loading, user, router]);
  if (!user || user.role !== "client") return null;
  return <>{children}</>;
}
EOF

# ---------- shells (navbar + staff sidebar) ----------
cat > "components/layout/Navbar.tsx" <<'EOF'
"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <nav className="h-16 border-b border-slate-800 bg-slate-900/70 backdrop-blur flex items-center px-6 justify-between sticky top-0 z-30">
      <div className="text-xl font-bold text-brand-500">
        <Link href="/">E-Garage</Link>
      </div>
      <div className="flex items-center gap-6 text-sm">
        <Link href="/#about" className="hover:text-brand-500">About</Link>
        <Link href="/#contact" className="hover:text-brand-500">Contact</Link>
        {!user && (
          <>
            <Link href="/login" className="hover:text-brand-500">Login</Link>
            <Link href="/signup" className="bg-brand-600 px-3 py-1.5 rounded-md hover:bg-brand-700">Sign up</Link>
          </>
        )}
        {user?.role === "client" && (
          <>
            <Link href="/client/jobs" className="hover:text-brand-500">My Jobs</Link>
            <Link href="/client/jobs/new" className="hover:text-brand-500">Fix My Car</Link>
            <button onClick={logout} className="hover:text-rose-400">Logout</button>
          </>
        )}
        {user && user.role !== "client" && (
          <>
            <Link href="/dashboard" className="hover:text-brand-500">Dashboard</Link>
            <Link href="/jobs" className="hover:text-brand-500">Jobs</Link>
            <button onClick={logout} className="hover:text-rose-400">Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}
EOF

cat > "components/layout/SidebarStaff.tsx" <<'EOF'
"use client";
import Link from 'next/link';
import { Car, LayoutDashboard, MessagesSquare, Mail, Settings, LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import clsx from 'clsx';

const Item = ({href,icon:Icon,label}:{href:string;icon:any;label:string})=>{
  const path = usePathname();
  const active = path===href || (href!=='/dashboard' && path.startsWith(href));
  return (
    <Link href={href} className={clsx("flex items-center gap-3 px-4 py-3 rounded-xl transition",
      active? "bg-brand-600/30 text-white shadow-soft" : "text-slate-300 hover:bg-slate-700/40")}>
      <Icon size={18}/> <span>{label}</span>
    </Link>
  );
}

export default function SidebarStaff(){
  const { logout } = useAuth();
  return (
    <aside className="w-72 shrink-0 h-screen sticky top-0 bg-slate-900/70 backdrop-blur border-r border-slate-800 p-4 flex flex-col gap-2">
      <div className="px-2 py-3 text-2xl font-semibold tracking-wide">E-Garage</div>
      <Item href="/dashboard" icon={LayoutDashboard} label="Dashboard"/>
      <Item href="/jobs" icon={Car} label="Jobs"/>
      <Item href="/emails" icon={Mail} label="Emails"/>
      <Item href="/chat" icon={MessagesSquare} label="Global Chat"/>
      <Item href="/account" icon={Settings} label="Account"/>
      <div className="flex-1"/>
      <button onClick={logout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-700/40">
        <LogOut size={18}/> Logout
      </button>
    </aside>
  );
}
EOF

cat > "components/layout/Topbar.tsx" <<'EOF'
"use client";
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function Topbar(){
  const [brand,setBrand]=useState<{name?:string,logoPath?:string}|null>(null);
  useEffect(()=>{ api.get('/account').then(r=>setBrand(r.data)).catch(()=>{}); },[]);
  const logo = brand?.logoPath && (brand.logoPath.startsWith('http') ? brand.logoPath : `${process.env.NEXT_PUBLIC_API_URL}${brand.logoPath}`);
  return (
    <div className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur flex items-center px-6 justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {logo && (<img src={logo} className="w-9 h-9 rounded-lg object-cover" alt="logo"/>) }
        <div className="text-slate-200 text-sm">{brand?.name || 'E-Garage'}</div>
      </div>
      <div className="text-slate-400 text-xs">Staff Dashboard</div>
    </div>
  );
}
EOF

# ---------- route-group layouts (QUOTED) ----------
cat > "app/(public)/layout.tsx" <<'EOF'
import Navbar from "@/components/layout/Navbar";
export default function PublicLayout({children}:{children:React.ReactNode}){
  return (
    <>
      <Navbar/>
      <div className="min-h-[calc(100vh-64px)]">{children}</div>
    </>
  );
}
EOF

cat > "app/(client)/layout.tsx" <<'EOF'
import Navbar from "@/components/layout/Navbar";
import { ClientOnly } from "@/lib/guards";

export default function ClientLayout({children}:{children:React.ReactNode}){
  return (
    <ClientOnly>
      <Navbar/>
      <div className="min-h-[calc(100vh-64px)] p-6 max-w-6xl mx-auto">{children}</div>
    </ClientOnly>
  );
}
EOF

cat > "app/(staff)/layout.tsx" <<'EOF'
import SidebarStaff from "@/components/layout/SidebarStaff";
import Topbar from "@/components/layout/Topbar";
import { StaffOnly } from "@/lib/guards";

export default function StaffLayout({children}:{children:React.ReactNode}){
  return (
    <StaffOnly>
      <div className="flex">
        <SidebarStaff/>
        <main className="flex-1 min-h-screen">
          <Topbar/>
          <div className="p-6 max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </StaffOnly>
  );
}
EOF

# ---------- shared bits ----------
cat > "components/shared/Badges.tsx" <<'EOF'
export function StatusBadge({value}:{value:string}){
  const map:Record<string,string>={
    pending:'bg-yellow-500/20 text-yellow-300',
    repairing:'bg-blue-500/20 text-blue-300',
    completed:'bg-emerald-500/20 text-emerald-300'
  }
  return <span className={`px-2 py-1 rounded-md text-xs ${map[value]||'bg-slate-700 text-slate-300'}`}>{value}</span>
}
export function PaymentBadge({value}:{value:string}){
  const map:Record<string,string>={
    unpaid:'bg-rose-500/20 text-rose-300',
    paid:'bg-emerald-500/20 text-emerald-300'
  }
  return <span className={`px-2 py-1 rounded-md text-xs ${map[value]||'bg-slate-700 text-slate-300'}`}>{value}</span>
}
EOF

cat > "components/shared/JobCard.tsx" <<'EOF'
"use client";
import Link from 'next/link';
import { StatusBadge, PaymentBadge } from './Badges';

export default function JobCard({job,hrefBase='/jobs'}:{job:any;hrefBase?:string}){
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">{job.names || 'Unknown Client'}</div>
        <div className="flex gap-2"><StatusBadge value={job.status}/><PaymentBadge value={job.payment}/></div>
      </div>
      <div className="text-sm text-slate-300">{job.carMake} • {job.carType} • <span className="text-slate-400">{job.plateNumber}</span></div>
      <div className="text-xs text-slate-400 line-clamp-2 mt-1">{job.issues || '-'}</div>
      <div className="mt-3 flex gap-3">
        <Link href={`${hrefBase}/${job._id}`} className="px-3 py-1.5 rounded-md bg-brand-600 hover:bg-brand-700 text-sm">Open</Link>
        <a href={`${process.env.NEXT_PUBLIC_API_URL}/clients/${job._id}/pdf`} className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-sm" target="_blank">Export PDF</a>
      </div>
    </div>
  );
}
EOF

cat > "components/shared/Spinner.tsx" <<'EOF'
export default function Spinner(){
  return <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white/70"></div>
}
EOF

# ---------- chat ----------
cat > "components/chat/Chat.tsx" <<'EOF'
"use client";
import { useEffect, useRef, useState } from 'react';
import { socket } from '@/lib/socket';
import api from '@/lib/api';
import { format } from 'timeago.js';
import clsx from 'clsx';

type Msg = { _id?:string; room:string; sender:string; text:string; at?:string; createdAt?:string; };

export default function Chat({room}:{room:string}){
  const [messages,setMessages]=useState<Msg[]>([]);
  const [text,setText]=useState('');
  const [loading,setLoading]=useState(true);
  const boxRef = useRef<HTMLDivElement>(null);
  const me = (typeof window!=='undefined' && localStorage.getItem('user')) ? JSON.parse(localStorage.getItem('user')!) : null;
  const myName = me?.email || 'guest';

  useEffect(()=>{
    let mounted = true;
    socket.connect();
    socket.emit('chat:join',{ room });

    api.get(`/chat/${encodeURIComponent(room)}/messages?limit=50`)
      .then(r=>{ if(!mounted) return; setMessages(r.data.messages); setLoading(false); });

    const onMsg = (msg:Msg)=>{ if(msg.room===room){ setMessages(prev=>[msg,...prev]); } };
    socket.on('chat:message', onMsg);

    return ()=>{ mounted=false; socket.off('chat:message', onMsg); socket.disconnect(); };
  },[room]);

  useEffect(()=>{ if(boxRef.current){ boxRef.current.scrollTop = boxRef.current.scrollHeight; } },[messages,loading]);

  function send(){
    if(!text.trim()) return;
    socket.emit('chat:message', { room, sender:myName, text }, (ack:any)=>{
      if(!ack?.ok){ console.error(ack?.error); }
    });
    setText('');
  }

  return (
    <div className="h-full flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60">
      <div className="px-4 py-2 border-b border-slate-800 text-sm text-slate-300">Room: {room}</div>
      <div ref={boxRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading && <div className="text-slate-500 text-sm">Loading messages…</div>}
        {!loading && messages.slice().reverse().map((m)=> {
          const mine = m.sender === myName;
          const when = m.at || m.createdAt;
          return (
            <div key={m._id || (m.sender+m.text+(when||''))} className={clsx("flex", mine?'justify-end':'justify-start')}>
              <div className={clsx(
                "max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow",
                mine ? "bg-brand-600 text-white rounded-br-sm" : "bg-slate-800 text-slate-100 rounded-bl-sm"
              )}>
                <div className="text-[11px] mb-0.5 opacity-80">{m.sender}</div>
                <div>{m.text}</div>
                {when && <div className="text-[10px] mt-1 opacity-70">{format(when)}</div>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="p-3 border-t border-slate-800 flex gap-2">
        <input
          value={text}
          onChange={e=>setText(e.target.value)}
          onKeyDown={e=>{if(e.key==='Enter') send();}}
          placeholder="Type a message…"
          className="flex-1 px-3 py-2 rounded-xl bg-slate-800 outline-none"
        />
        <button onClick={send} className="px-4 rounded-xl bg-brand-600 hover:bg-brand-700">Send</button>
      </div>
    </div>
  );
}
EOF

# ---------- landing & auth (public) ----------
cat > "app/(public)/page.tsx" <<'EOF'
import Link from "next/link";

export default function Landing() {
  return (
    <main className="space-y-24">
      <section className="text-center py-20 bg-gradient-to-b from-slate-900 to-slate-950">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          Reliable Car Service <span className="text-brand-500">Made Easy</span>
        </h1>
        <p className="mt-4 text-lg text-slate-300">
          Manage repairs, track jobs, and chat with our team — all in one place.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Link href="/signup" className="btn">Get Started</Link>
          <Link href="/login" className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg">Login</Link>
        </div>
      </section>
      <section id="about" className="max-w-5xl mx-auto px-6 space-y-6">
        <h2 className="text-3xl font-bold">About Us</h2>
        <p className="text-slate-300">E-Garage is your trusted partner in keeping your vehicle in top shape.
        Our certified staff provide diagnostics, repairs, and maintenance with full transparency and communication.</p>
      </section>
      <section className="max-w-5xl mx-auto px-6 space-y-6">
        <h2 className="text-3xl font-bold">Our Services</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card"><h3 className="font-semibold text-lg mb-2">Diagnostics</h3><p className="text-slate-400 text-sm">Advanced scanning and troubleshooting of car issues.</p></div>
          <div className="card"><h3 className="font-semibold text-lg mb-2">Repairs</h3><p className="text-slate-400 text-sm">Mechanical, electrical, and bodywork repairs handled by experts.</p></div>
          <div className="card"><h3 className="font-semibold text-lg mb-2">Maintenance</h3><p className="text-slate-400 text-sm">Oil change, tire service, inspections, and preventive care.</p></div>
        </div>
      </section>
      <section id="contact" className="max-w-5xl mx-auto px-6 space-y-4 pb-20">
        <h2 className="text-3xl font-bold">Contact Us</h2>
        <ul className="space-y-2 text-slate-400">
          <li>Email: service@egarage.com</li>
          <li>Phone: +250 123 456 789</li>
          <li>Address: Kigali, Rwanda</li>
        </ul>
      </section>
    </main>
  );
}
EOF

cat > "app/(public)/login/page.tsx" <<'EOF'
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Spinner from "@/components/shared/Spinner";

export default function Login(){
  const { login } = useAuth();
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [busy,setBusy]=useState(false);
  const router=useRouter();
  async function submit(e:React.FormEvent){ e.preventDefault(); setBusy(true);
    await login(email,password);
    setBusy(false);
    const u = localStorage.getItem('user'); const role = u ? JSON.parse(u).role : null;
    if(role==='client') router.push('/client'); else router.push('/dashboard');
  }
  return (
    <div className="min-h-[70vh] grid place-items-center p-6">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-3">
        <div className="text-lg font-semibold">Sign In</div>
        <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="input" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="btn w-full" disabled={busy}>{busy ? <Spinner/> : "Login"}</button>
        <div className="text-sm text-slate-400">Forgot your password? <a className="text-brand-500" href="/forgot">Reset</a></div>
      </form>
    </div>
  );
}
EOF

cat > "app/(public)/signup/page.tsx" <<'EOF'
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Spinner from "@/components/shared/Spinner";

export default function Signup(){
  const { signup } = useAuth();
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [busy,setBusy]=useState(false);
  const router=useRouter();
  async function submit(e:React.FormEvent){ e.preventDefault(); setBusy(true); await signup(email,password); setBusy(false); router.push('/verify'); }
  return (
    <div className="min-h-[70vh] grid place-items-center p-6">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-3">
        <div className="text-lg font-semibold">Create Account</div>
        <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="input" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="btn w-full" disabled={busy}>{busy ? <Spinner/> : "Sign up"}</button>
        <div className="text-sm text-slate-400">Already have an account? <a className="text-brand-500" href="/login">Login</a></div>
      </form>
    </div>
  );
}
EOF

cat > "app/(public)/forgot/page.tsx" <<'EOF'
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
EOF

cat > "app/(public)/reset/page.tsx" <<'EOF'
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
EOF

cat > "app/(public)/verify/page.tsx" <<'EOF'
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
EOF
# ---------- client (navbar shell) ----------
cat > "app/(client)/client/page.tsx" <<'EOF'
"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function ClientHome(){
  const [brand,setBrand]=useState<any>(null);
  useEffect(()=>{ api.get('/account').then(r=>setBrand(r.data)).catch(()=>{}); },[]);
  return (
    <div className="space-y-3">
      <div className="text-xl font-semibold">Welcome to your client portal</div>
      <div className="text-slate-300">Track your jobs, chat with our team, and manage your vehicle service.</div>
      <div className="text-slate-400 text-sm space-y-1">
        {brand?.email && <div>Email: {brand.email}</div>}
        {brand?.phone && <div>Phone: {brand.phone}</div>}
        {brand?.address && <div>Address: {brand.address}</div>}
      </div>
      <div className="flex gap-3 mt-2">
        <a className="btn" href="/client/jobs">My Jobs</a>
        <a className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700" href="/client/jobs/new">Post a Job</a>
      </div>
    </div>
  );
}
EOF

cat > "app/(client)/client/jobs/page.tsx" <<'EOF'
"use client";
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import JobCard from '@/components/shared/JobCard';

export default function ClientJobs(){
  const [jobs,setJobs]=useState<any[]>([]);
  const [q,setQ]=useState('');

  async function load(){
    const params = new URLSearchParams();
    params.set('mine','true'); // STRICT my jobs only
    if(q) params.set('q',q);
    const { data } = await api.get('/clients?'+params.toString());
    setJobs(data);
  }
  useEffect(()=>{ load(); },[]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search my plate or make..." className="input max-w-xs"/>
        <button onClick={load} className="px-4 rounded-md bg-brand-600 hover:bg-brand-700">Search</button>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {jobs.map(j => <JobCard key={j._id} job={j} hrefBase="/client/jobs"/>) }
        {jobs.length===0 && <div className="text-slate-500">No jobs yet.</div>}
      </div>
    </div>
  );
}
EOF

cat > "app/(client)/client/jobs/new/page.tsx" <<'EOF'
"use client";
import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function NewJob(){
  const [form,setForm]=useState<any>({ names:'', carType:'', carMake:'', plateNumber:'', issues:'', recoveredBy:'owner' });
  const [photos,setPhotos]=useState<File[]>([]);
  const [proforma,setProforma]=useState<File|null>(null);

  async function submit(e:React.FormEvent){
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k,v])=>fd.append(k,String(v??'')));
    photos.forEach(p=>fd.append('photos', p));
    if (proforma) fd.append('proforma', proforma);
    await api.post('/clients', fd, { headers:{ 'Content-Type':'multipart/form-data' } })
      .then(()=>toast.success('Job submitted')).catch(()=>toast.error('Failed'));
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        {['names','carType','carMake','plateNumber'].map(k=> (
          <input key={k} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={k} className="input"/>
        ))}
      </div>
      <textarea value={form.issues} onChange={e=>setForm({...form,issues:e.target.value})} placeholder="Describe issues" className="input h-28"/>
      <div className="flex flex-wrap gap-3 items-center">
        <select value={form.recoveredBy} onChange={e=>setForm({...form,recoveredBy:e.target.value})} className="select">
          <option value="owner">owner</option><option value="insurance">insurance</option>
        </select>
        <label className="text-sm">Photos <input type="file" multiple onChange={e=>setPhotos(Array.from(e.target.files||[]))} className="ml-2 text-sm"/></label>
        <label className="text-sm">Proforma <input type="file" onChange={e=>setProforma(e.target.files?.[0]||null)} className="ml-2 text-sm"/></label>
      </div>
      <button className="btn">Submit</button>
    </form>
  );
}
EOF

cat > "app/(client)/client/jobs/[id]/page.tsx" <<'EOF'
"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { StatusBadge, PaymentBadge } from '@/components/shared/Badges';
import Chat from '@/components/chat/Chat';

export default function ClientJobDetail(){
  const { id } = useParams();
  const [job,setJob]=useState<any|null>(null);
  useEffect(()=>{ api.get('/clients/'+id).then(r=>setJob(r.data)); },[id]);
  if(!job) return <div>Loading...</div>;
  const room = `client:${id}`;
  const imgSrc = (p:string)=> p.startsWith('http') ? p : `${process.env.NEXT_PUBLIC_API_URL}${p}`;
  const proforma = job.proformaPath ? (job.proformaPath.startsWith('http')? job.proformaPath : `${process.env.NEXT_PUBLIC_API_URL}${job.proformaPath}`) : null;

  return (
    <div className="grid xl:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="card">
          <div className="text-lg font-semibold mb-2">{job.names}</div>
          <div className="text-sm text-slate-300">{job.carMake} • {job.carType} • {job.plateNumber}</div>
          <div className="mt-3 flex gap-2"><StatusBadge value={job.status}/><PaymentBadge value={job.payment}/></div>
          <div className="mt-4 text-sm text-slate-300 whitespace-pre-wrap">{job.issues || '-'}</div>
          {proforma && <a className="mt-4 inline-block text-brand-400" href={proforma} target="_blank">View Proforma</a>}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {job.photos?.map((p:string)=> <img key={p} alt="photo" src={imgSrc(p)} className="w-full h-28 object-cover rounded-md border border-slate-800"/>) }
          </div>
        </div>
      </div>
      <div className="h-[560px]">
        <Chat room={room}/>
      </div>
    </div>
  );
}
EOF

# ---------- staff (sidebar shell) ----------
cat > "app/(staff)/dashboard/page.tsx" <<'EOF'
"use client";
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Chat from '@/components/chat/Chat';
import JobCard from '@/components/shared/JobCard';

export default function Dashboard(){
  const [jobs,setJobs]=useState<any[]>([]);
  useEffect(()=>{ api.get('/clients?status=pending').then(r=>setJobs(r.data.slice(0,4))).catch(()=>{}); },[]);
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 space-y-4">
        <div className="text-sm text-slate-400">Pending jobs</div>
        <div className="grid md:grid-cols-2 gap-4">
          {jobs.map(j => <JobCard key={j._id} job={j}/>) }
          {jobs.length===0 && <div className="text-slate-500">No pending jobs.</div>}
        </div>
      </div>
      <div className="h-[520px]">
        <Chat room="global"/>
      </div>
    </div>
  );
}
EOF

cat > "app/(staff)/jobs/page.tsx" <<'EOF'
"use client";
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import JobCard from '@/components/shared/JobCard';

export default function Jobs(){
  const [q,setQ]=useState('');
  const [status,setStatus]=useState('');
  const [payment,setPayment]=useState('');
  const [jobs,setJobs]=useState<any[]>([]);

  async function load(){
    const params = new URLSearchParams();
    if(q) params.set('q',q);
    if(status) params.set('status',status);
    if(payment) params.set('payment',payment);
    const { data } = await api.get('/clients'+(params.toString()?`?${params.toString()}`:''));
    setJobs(data);
  }
  useEffect(()=>{ load(); },[]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search name/plate/make..." className="input max-w-xs"/>
        <select value={status} onChange={e=>setStatus(e.target.value)} className="select">
          <option value="">All status</option><option>pending</option><option>repairing</option><option>completed</option>
        </select>
        <select value={payment} onChange={e=>setPayment(e.target.value)} className="select">
          <option value="">All payments</option><option>unpaid</option><option>paid</option>
        </select>
        <button onClick={load} className="btn">Filter</button>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {jobs.map(j => <JobCard key={j._id} job={j}/>) }
        {jobs.length===0 && <div className="text-slate-500">No jobs found.</div>}
      </div>
    </div>
  );
}
EOF

cat > "app/(staff)/jobs/[id]/page.tsx" <<'EOF'
"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { StatusBadge, PaymentBadge } from '@/components/shared/Badges';
import Chat from '@/components/chat/Chat';

export default function JobDetail(){
  const { id } = useParams();
  const [job,setJob]=useState<any|null>(null);
  useEffect(()=>{ api.get('/clients/'+id).then(r=>setJob(r.data)); },[id]);
  if(!job) return <div>Loading...</div>;

  const room = `client:${id}`;
  const imgSrc = (p:string)=> p.startsWith('http') ? p : `${process.env.NEXT_PUBLIC_API_URL}${p}`;
  const proforma = job.proformaPath ? (job.proformaPath.startsWith('http')? job.proformaPath : `${process.env.NEXT_PUBLIC_API_URL}${job.proformaPath}`) : null;

  async function setStatus(status:string){ await api.patch(`/clients/${id}/status`,{ status }); setJob({...job,status}); }
  async function setPayment(payment:string){ await api.patch(`/clients/${id}/status`,{ payment }); setJob({...job,payment}); }

  return (
    <div className="grid xl:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="card">
          <div className="text-lg font-semibold mb-2">{job.names}</div>
          <div className="text-sm text-slate-300">{job.carMake} • {job.carType} • {job.plateNumber}</div>
          <div className="mt-3 flex gap-2 items-center">
            <StatusBadge value={job.status}/><PaymentBadge value={job.payment}/>
            <div className="ml-auto flex gap-2">
              <button onClick={()=>setStatus('pending')} className="px-2 py-1 text-xs bg-slate-800 rounded">Pending</button>
              <button onClick={()=>setStatus('repairing')} className="px-2 py-1 text-xs bg-slate-800 rounded">Repairing</button>
              <button onClick={()=>setStatus('completed')} className="px-2 py-1 text-xs bg-slate-800 rounded">Completed</button>
              <button onClick={()=>setPayment(job.payment==='paid'?'unpaid':'paid')} className="px-2 py-1 text-xs bg-brand-600 rounded">{job.payment==='paid'?'Mark Unpaid':'Mark Paid'}</button>
            </div>
          </div>
          <div className="mt-4 text-sm text-slate-300 whitespace-pre-wrap">{job.issues || '-'}</div>
          {proforma && <a className="mt-4 inline-block text-brand-400" href={proforma} target="_blank">View Proforma</a>}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {job.photos?.map((p:string)=> <img key={p} alt="photo" src={imgSrc(p)} className="w-full h-28 object-cover rounded-md border border-slate-800"/>) }
          </div>
          <div className="mt-4">
            <a className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-sm" href={`${process.env.NEXT_PUBLIC_API_URL}/clients/${job._id}/pdf`} target="_blank">Export PDF</a>
          </div>
        </div>
      </div>
      <div className="h-[560px]">
        <Chat room={room}/>
      </div>
    </div>
  );
}
EOF

cat > "app/(staff)/emails/page.tsx" <<'EOF'
"use client";
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function Emails(){
  const [list,setList]=useState<any[]>([]);
  const [to,setTo]=useState(''); const [subject,setSubject]=useState(''); const [body,setBody]=useState('');

  async function load(){ const {data}=await api.get('/emails'); setList(data); }
  useEffect(()=>{ load(); },[]);

  async function send(){
    if(!to || !subject || !body) return;
    await api.post('/emails/send',{ to,subject,body }).then(()=>{toast.success('Sent'); load();}).catch(()=>toast.error('Failed'));
    setTo(''); setSubject(''); setBody('');
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="card">
        <div className="font-semibold mb-2">Compose</div>
        <div className="grid gap-2">
          <input value={to} onChange={e=>setTo(e.target.value)} placeholder="To" className="input"/>
          <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Subject" className="input"/>
          <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Body" className="input h-40"/>
          <button onClick={send} className="btn w-max">Send</button>
        </div>
      </div>
      <div className="card">
        <div className="font-semibold mb-2">Recent Emails</div>
        <div className="space-y-3 max-h-[520px] overflow-auto pr-2">
          {list.map(m=> (
            <div key={m._id} className="p-3 rounded-md border border-slate-800 bg-slate-900/50">
              <div className="text-sm">{m.subject}</div>
              <div className="text-xs text-slate-400">To: {m.to}</div>
              <div className="text-xs text-slate-300 mt-1 line-clamp-2">{m.body}</div>
            </div>
          ))}
          {list.length===0 && <div className="text-slate-500 text-sm">No emails yet.</div>}
        </div>
      </div>
    </div>
  );
}
EOF

cat > "app/(staff)/chat/page.tsx" <<'EOF'
import Chat from '@/components/chat/Chat';
export default function Page(){ return <div className="h-[70vh]"><Chat room="global"/></div>; }
EOF

cat > "app/(staff)/account/page.tsx" <<'EOF'
"use client";
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AccountPage(){
  const [form,setForm]=useState<any>({ name:'', email:'', phone:'', address:'' });
  const [logo,setLogo]=useState<File|null>(null);

  useEffect(()=>{
    api.get('/account').then(r=>{
      const d = r.data||{};
      setForm({ name:d.name||'', email:d.email||'', phone:d.phone||'', address:d.address||'' });
    }).catch(()=>{});
  },[]);

  async function save(){
    const fd = new FormData();
    Object.entries(form).forEach(([k,v])=>fd.append(k,String(v??'')));
    if (logo) fd.append('logo', logo);
    await api.put('/account', fd, { headers:{ 'Content-Type':'multipart/form-data' } })
      .then(()=>toast.success('Saved')).catch(()=>toast.error('Failed'));
  }

  return (
    <div className="max-w-2xl space-y-3">
      <div className="text-lg font-semibold mb-2">Account</div>
      <div className="grid md:grid-cols-2 gap-3">
        <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Garage name" className="input"/>
        <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="Email" className="input"/>
        <input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="Phone" className="input"/>
        <input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Address" className="input"/>
      </div>
      <div className="flex items-center gap-3">
        <label className="text-sm">Logo <input type="file" onChange={e=>setLogo(e.target.files?.[0]||null)} className="ml-2 text-sm"/></label>
        <button onClick={save} className="btn">Save</button>
      </div>
    </div>
  );
}
EOF

echo "✅ Frontend created at: $(pwd)"
echo "Next:"
echo "1) npm install"
echo "2) cp .env.local.example .env.local  # set NEXT_PUBLIC_API_URL (e.g. http://localhost:5000)"
echo "3) npm run dev   # http://localhost:3001"


