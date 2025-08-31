"use client";
import Link from 'next/link';
import { Car, LayoutDashboard, MessagesSquare,Wallet , Mail, Settings, LogOut ,Users, Wallet2Icon} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import clsx from 'clsx';

const Item = ({href,icon:Icon,label}:{href:string;icon:any;label:string})=>{
  const path = usePathname();
  const active = path===href || (href!=='/dashboard' && path.startsWith(href));
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      title={label}
      className={clsx(
        'group relative flex items-center gap-3 rounded-xl px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-brand-500/40',
        active ? 'bg-brand-600/30 text-white shadow-soft' : 'text-slate-300 hover:bg-slate-700/40'
      )}
    >
      {/* active indicator */}
      <span className={clsx(
        'absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-brand-500 transition-opacity',
        active ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
      )} />
      <Icon size={18}/>
      <span className="truncate">{label}</span>
    </Link>
  );
}

function NavList({ onLogout }:{ onLogout: ()=>void }){
  return (
    <div className="flex h-full flex-col gap-2">
      {/* brand */}
      <div className="px-2 py-3">
        <div className="text-xl font-semibold tracking-wide sm:text-2xl">E-Garage</div>
        <div className="mt-0.5 text-[10px] text-slate-500 sm:text-xs">Operations</div>
      </div>

      {/* nav */}
      <nav className="grid gap-1 text-sm">
        <Item href="/dashboard" icon={LayoutDashboard} label="Dashboard"/>
        <Item href="/jobs" icon={Car} label="Jobs"/>
        <Item href="/users" icon={Users} label="Users"/>
        {/* //<Item href="/payments" icon={Wallet} label="Payments"/>  */}

        <Item href="/emails" icon={Mail} label="Emails"/>
        <Item href="/chat" icon={MessagesSquare} label="Global Chat"/>
        <Item href="/account" icon={Settings} label="Account"/>
        
      </nav>

      <div className="flex-1" />

      {/* logout */}
      <button
        onClick={onLogout}
        className="group relative flex items-center gap-3 rounded-xl px-4 py-3 text-left text-slate-300 transition hover:bg-slate-700/40 focus:outline-none focus:ring-2 focus:ring-rose-400/30"
      >
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-rose-400/80 opacity-0 transition-opacity group-hover:opacity-80" />
        <LogOut size={18}/>
        <span>Logout</span>
      </button>

      {/* footer tiny version */}
      <div className="px-2 pt-1 text-[10px] text-slate-500">© {new Date().getFullYear()} E‑Garage</div>
    </div>
  );
}

export default function SidebarStaff(){
  const { logout } = useAuth();

  return (
    <>
      {/* MOBILE: top-right floating FAB that toggles slide-in drawer */}
      <input id="sidebar-toggle" type="checkbox" className="peer sr-only md:hidden" aria-hidden />

      {/* Floating button (visible, high contrast, safe-area aware) */}
      <label
        htmlFor="sidebar-toggle"
        className="fixed z-[60] top-[max(12px,env(safe-area-inset-top))] right-[max(12px,env(safe-area-inset-right))] grid h-12 w-12 cursor-pointer place-items-center rounded-full bg-brand-600 text-white shadow-xl ring-1 ring-white/20 transition hover:bg-brand-700 active:scale-95 md:hidden"
        aria-label="Toggle sidebar"
      >
        {/* hamburger icon */}
        <svg className="h-6 w-6 peer-checked:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        {/* close icon */}
        <svg className="hidden h-6 w-6 peer-checked:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        <span className="sr-only">Toggle sidebar</span>
      </label>

      {/* click-away overlay */}
      <label htmlFor="sidebar-toggle" className="fixed inset-0 z-50 hidden bg-black/40 backdrop-blur-[1px] peer-checked:block md:hidden" aria-hidden></label>

      {/* Off-canvas drawer */}
      <aside
        aria-label="Sidebar drawer"
        className="fixed left-0 top-0 z-[70] h-full w-[85vw] max-w-80 -translate-x-full border-r border-slate-800 bg-slate-900/95 backdrop-blur transition-transform duration-200 ease-out peer-checked:translate-x-0 md:hidden"
      >
        <div className="h-px w-full bg-gradient-to-r from-brand-500/40 via-sky-400/20 to-emerald-400/20" />
        <div className="h-full p-3 sm:p-4">
          <NavList onLogout={logout} />
        </div>
      </aside>

      {/* DESKTOP: static sidebar */}
      <aside aria-label="Sidebar" className="sticky top-0 hidden h-screen shrink-0 border-r border-slate-800 bg-slate-900/70 backdrop-blur md:block md:w-64 lg:w-72">
        {/* subtle top gradient bar */}
        <div className="h-px w-full bg-gradient-to-r from-brand-500/40 via-sky-400/20 to-emerald-400/20" />
        <div className="h-full p-3 sm:p-4">
          <NavList onLogout={logout} />
        </div>
      </aside>
    </>
  );
}
