"use client";
import Link from 'next/link';
import { StatusBadge, PaymentBadge } from './Badges';

export default function JobCard({ job, hrefBase = '/jobs' }:{ job:any; hrefBase?:string }){
  const name = (job?.names || 'Unknown Client').toString();
  const carBits = [job?.carMake, job?.carType].filter(Boolean).join(' • ');
  const plate = job?.plateNumber || '—';
  const issues = job?.issues || '-';
  const id = job?._id ? String(job._id) : '';

  const api = process.env.NEXT_PUBLIC_API_URL || '';
  const pdfHref = id && api ? `${api}/clients/${id}/pdf` : '#';
  const openHref = id ? `${hrefBase}/${id}` : '#';
  const openDisabled = !id;

  return (
    <article
      className="group card relative min-h-[180px] overflow-hidden p-5 md:p-6 transition hover:-translate-y-0.5 hover:border-brand-500/40 focus-within:border-brand-500/60"
      data-status={job?.status}
      data-payment={job?.payment}
    >
      {/* Accent bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500/40 via-sky-400/30 to-emerald-400/30" />

      {/* Header: badges under the name on all screen sizes */}
      <div className="mb-3 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 md:mb-4">
        <Avatar name={name} className="row-span-2" />
        {/* Name */}
        <div className="min-w-0 leading-tight col-start-2">
          <span
            className="block max-w-full text-base font-semibold md:text-lg line-clamp-2 md:line-clamp-1 md:truncate"
            title={name}
          >
            {name}
          </span>
        </div>
        {/* Badges aligned with the name column */}
        <div className="col-start-2 flex flex-wrap gap-2">
          <StatusBadge value={job?.status} />
          <PaymentBadge value={job?.payment} />
        </div>
      </div>

      {/* Meta */}
      <div className="min-w-0 text-base text-slate-200">
        <span className="truncate">
          {carBits || 'Vehicle —'}
        </span>
        {" "}•{" "}
        <span className="text-slate-400" title="Plate number">{plate}</span>
      </div>

      {/* Issues */}
      <p className="mt-2 line-clamp-3 text-sm text-slate-300" title={String(issues)}>
        {issues}
      </p>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-3 md:gap-4">
        <Link
          href={openHref}
          className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-base transition focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${openDisabled ? 'bg-slate-700/60 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700'}`}
          aria-disabled={openDisabled}
          tabIndex={openDisabled ? -1 : 0}
        >
          {/* arrow icon */}
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
          Open
        </Link>
        <a
          href={pdfHref}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2 text-base transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          target="_blank"
          rel="noreferrer noopener"
          aria-disabled={!id || !api}
          onClick={(e)=>{ if(!id || !api) e.preventDefault(); }}
        >
          {/* pdf icon */}
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="M9 15h6"/></svg>
          Export PDF
        </a>
      </div>

      {/* Hover sheen */}
      <div className="pointer-events-none absolute -inset-1 opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden>
        <div className="absolute -top-24 left-0 h-24 w-full bg-gradient-to-r from-white/5 to-transparent blur-xl" />
      </div>
    </article>
  );
}

function Avatar({ name, className }:{ name:string; className?: string }){
  const initials = name.split(/\s+/).filter(Boolean).slice(0,2).map(s=>s[0]?.toUpperCase()).join('') || '?';
  return (
    <div className={`grid h-12 w-12 place-items-center rounded-full bg-brand-500/15 text-brand-400 ring-1 ring-white/10 ${className || ''}`}>
      <span className="text-base font-semibold">{initials}</span>
    </div>
  );
}
