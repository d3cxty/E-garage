"use client";

import Link from "next/link";

export default function Landing() {
  return (
    <main className="relative overflow-hidden space-y-24">
      {/* decorative background blobs (no extra libs) */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-10 h-[380px] w-[380px] rounded-full bg-sky-400/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-10 h-[300px] w-[300px] rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 py-24 text-center">
        <div className="mx-auto max-w-5xl px-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs text-slate-300 backdrop-blur">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Trusted by 5k+ car owners
          </span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-white md:text-6xl">
            Reliable Car Service <span className="text-brand-500">Made Easy</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            Manage repairs, track jobs, and chat with our team — all in one place.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link href="/signup" className="btn group">
              <span className="inline-flex items-center">Get Started
                <svg className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
              </span>
            </Link>
            <Link href="/login" className="px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition">Login</Link>
          </div>

          {/* subtle floating car outline */}
          <div className="pointer-events-none relative mx-auto mt-12 h-36 w-full max-w-2xl opacity-70">
            <div className="absolute inset-0 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-sm" style={{maskImage:"radial-gradient(white,transparent 70%)"}}></div>
            <svg className="absolute left-1/2 top-1/2 h-20 w-[520px] -translate-x-1/2 -translate-y-1/2 animate-float" viewBox="0 0 512 128" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M40 88c8-28 44-44 92-44h120c48 0 84 16 92 44h36c10 0 20 8 20 18s-10 18-20 18H64c-10 0-20-8-20-18s10-18 20-18h-4z" strokeOpacity=".5"/>
            </svg>
          </div>

          {/* KPIs */}
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Avg. repair time", value: "24h" },
              { label: "Customer rating", value: "4.9/5" },
              { label: "Jobs completed", value: "12k+" },
              { label: "Active garages", value: "18" },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border border-white/10 bg-white/5 p-4 text-left">
                <div className="text-2xl font-bold text-white">{k.value}</div>
                <div className="text-xs text-slate-400">{k.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="mx-auto max-w-5xl space-y-6 px-6">
        <h2 className="text-3xl font-bold">About Us</h2>
        <p className="text-slate-300">
          E-Garage is your trusted partner in keeping your vehicle in top shape. Our certified staff provide diagnostics,
          repairs, and maintenance with full transparency and communication.
        </p>
      </section>

      {/* SERVICES */}
      <section className="mx-auto max-w-5xl space-y-6 px-6">
        <h2 className="text-3xl font-bold">Our Services</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[{
            title: "Diagnostics",
            desc: "Advanced scanning and troubleshooting of car issues.",
          },{
            title: "Repairs",
            desc: "Mechanical, electrical, and bodywork repairs handled by experts.",
          },{
            title: "Maintenance",
            desc: "Oil change, tire service, inspections, and preventive care.",
          }].map((s) => (
            <div key={s.title} className="card group transition hover:-translate-y-0.5 hover:border-brand-500/40">
              <h3 className="mb-2 text-lg font-semibold flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                  {/* minimal inline icon */}
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
                </span>
                {s.title}
              </h3>
              <p className="text-sm text-slate-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-5xl space-y-8 px-6">
        <h2 className="text-3xl font-bold">How it works</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[{step:1,title:"Book & describe",desc:"Create a job in minutes. Tell us what’s wrong or select from presets."},{step:2,title:"Track in real‑time",desc:"Get status updates, approvals, and photos while we work."},{step:3,title:"Drive away happy",desc:"Review the work, pay securely, and get maintenance reminders."}].map((i)=> (
            <div key={i.step} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/10 text-sm font-semibold text-brand-500">{i.step}</div>
              <h3 className="font-semibold">{i.title}</h3>
              <p className="mt-1 text-sm text-slate-400">{i.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mx-auto max-w-5xl space-y-6 px-6">
        <h2 className="text-3xl font-bold">What drivers say</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { quote: "Booked an oil change in 2 minutes. Loved the live updates and photos!", name: "Anita, Kigali" },
            { quote: "Transparent pricing and fast diagnostics. No surprises at pickup.", name: "Eric, Remera" },
            { quote: "They fixed my electrical issue the same day. Five stars!", name: "Yvan, Kacyiru" },
          ].map((t, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-slate-300">“{t.quote}”</p>
              <p className="mt-3 text-sm text-slate-500">{t.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="mx-auto max-w-5xl space-y-4 px-6 pb-20">
        <h2 className="text-3xl font-bold">Contact Us</h2>
        <ul className="space-y-2 text-slate-400">
          <li>Email: <a className="underline decoration-dotted underline-offset-4" href="mailto:service@egarage.com">service@egarage.com</a></li>
          <li>Phone: <a className="underline decoration-dotted underline-offset-4" href="tel:+250123456789">+250 123 456 789</a></li>
          <li>Address: Kigali, Rwanda</li>
        </ul>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-slate-950/60 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} E‑Garage. All rights reserved.</p>
          <div className="flex items-center gap-5 text-sm text-slate-400">
            <Link href="#" className="hover:text-white">Privacy</Link>
            <Link href="#" className="hover:text-white">Terms</Link>
            <Link href="#" className="hover:text-white">Support</Link>
          </div>
        </div>
      </footer>

      {/* simple keyframes without extra imports */}
      <style jsx global>{`
        @keyframes float { 0%,100%{ transform: translate(-50%, -52%);} 50%{ transform: translate(-50%, -48%);} }
        .animate-float { animation: float 6s ease-in-out infinite; }
      `}</style>
    </main>
  );
}
