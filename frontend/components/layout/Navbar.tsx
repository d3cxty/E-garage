"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function Navbar() {
  const { user, logout } = useAuth();
  const isClient = user?.role === "client";
  const avatar = (user?.email || "?").slice(0, 1).toUpperCase();

  return (
    <nav className="sticky top-0 z-30 bg-slate-900/70 backdrop-blur">
      {/* subtle gradient border */}
      <div className="h-px w-full bg-gradient-to-r from-brand-500/40 via-sky-400/20 to-emerald-400/20" />

      {/* skip link */}
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:rounded-md focus:bg-slate-800 focus:px-3 focus:py-1.5 focus:text-white">Skip to content</a>

      {/* IMPORTANT: make checkbox a sibling of the mobile menu so peer-checked works */}
      <input id="nav-toggle" type="checkbox" className="peer sr-only md:hidden" aria-hidden />

      <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
        {/* Brand */}
        <div className="text-xl font-bold text-brand-500">
          <Link href="/">E-Garage</Link>
        </div>

        {/* Desktop nav */}
        <div className="ml-auto hidden items-center gap-6 text-sm md:flex">
          <Link href="/#about" className="navlink">About</Link>
          <Link href="/#contact" className="navlink">Contact</Link>

          {!user && (
            <>
              <Link href="/login" className="navlink">Login</Link>
              <Link href="/signup" className="btn-sm">Sign up</Link>
            </>
          )}

          {user && isClient && (
            <>
              <Link href="/client/jobs" className="navlink">My Jobs</Link>
              <Link href="/client/jobs/new" className="navlink">Fix My Car</Link>
              <UserMini avatar={avatar} />
              <button onClick={logout} className="navlink text-rose-300 hover:text-rose-400">Logout</button>
            </>
          )}

          {user && !isClient && (
            <>
              <Link href="/dashboard" className="navlink">Dashboard</Link>
              <Link href="/jobs" className="navlink">Jobs</Link>
              <UserMini avatar={avatar} />
              <button onClick={logout} className="navlink text-rose-300 hover:text-rose-400">Logout</button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <label htmlFor="nav-toggle" className="ml-auto cursor-pointer rounded-md p-2 text-slate-300 hover:bg-white/5 md:hidden" aria-label="Toggle menu">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </label>
      </div>

      {/* Click-away overlay for mobile menu (closes when tapping outside) */}
      <label htmlFor="nav-toggle" className="fixed inset-0 z-20 hidden bg-black/20 peer-checked:block md:hidden" aria-hidden></label>

      {/* Mobile menu (now sibling to the checkbox, so peer-checked works on all browsers) */}
      <div className="relative z-30 mx-4 origin-top scale-y-0 opacity-0 transition-all duration-200 ease-out peer-checked:scale-y-100 peer-checked:opacity-100 md:hidden">
        <div className="mb-3 rounded-xl border border-white/10 bg-slate-900/90 p-3 text-sm shadow-xl">
          <div className="grid gap-1">
            <Link href="/#about" className="item">About</Link>
            <Link href="/#contact" className="item">Contact</Link>
            {!user && (
              <>
                <Link href="/login" className="item">Login</Link>
                <Link href="/signup" className="item font-medium text-brand-400">Sign up</Link>
              </>
            )}
            {user && isClient && (
              <>
                <Link href="/client/jobs" className="item">My Jobs</Link>
                <Link href="/client/jobs/new" className="item">Fix My Car</Link>
                <button onClick={logout} className="item text-left text-rose-300">Logout</button>
              </>
            )}
            {user && !isClient && (
              <>
                <Link href="/dashboard" className="item">Dashboard</Link>
                <Link href="/jobs" className="item">Jobs</Link>
                <button onClick={logout} className="item text-left text-rose-300">Logout</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* local styles */}
      <style jsx>{`
        .navlink { @apply hover:text-brand-500; }
        .btn-sm { @apply rounded-md bg-brand-600 px-3 py-1.5 hover:bg-brand-700; }
        .item { @apply rounded-md px-3 py-2 hover:bg-white/5; }
      `}</style>
    </nav>
  );
}

function UserMini({ avatar }: { avatar: string }){
  return (
    <div className="ml-1 inline-flex items-center gap-2">
      <div className="grid h-7 w-7 place-items-center rounded-full bg-brand-500/15 text-xs font-semibold text-brand-300 ring-1 ring-white/10">
        {avatar}
      </div>
    </div>
  );
}
