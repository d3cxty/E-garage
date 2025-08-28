"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { StatusBadge, PaymentBadge } from '@/components/shared/Badges';
import Chat from '@/components/chat/Chat';

export default function JobDetail(){
  const { id } = useParams();
  const jobId = Array.isArray(id) ? id[0] : id;

  const [job,setJob]=useState<any|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|undefined>();

  // lightbox
  const [lightbox, setLightbox] = useState<{open:boolean; index:number}>({open:false, index:0});

  async function load(signal?: AbortSignal){
    if(!jobId){ setError('Missing job id'); setLoading(false); return; }
    try{
      setLoading(true); setError(undefined);
      const { data } = await api.get('/clients/'+jobId, { signal: signal as any });
      setJob(data);
      if (typeof document !== 'undefined') {
        document.title = `Job – ${(data?.names||'Client')} • ${data?.plateNumber||''}`.trim();
      }
    }catch(err:any){
      if((signal as any)?.aborted) return;
      setError(err?.response?.data?.message || 'Failed to load job');
    }finally{
      if(!(signal as any)?.aborted) setLoading(false);
    }
  }

  useEffect(()=>{
    const ctrl = new AbortController();
    load(ctrl.signal);
    return ()=> ctrl.abort();
  },[jobId]);

  if(loading){
    return (
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card space-y-4">
          <div className="h-6 w-48 animate-pulse rounded bg-slate-700/50"/>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({length:8}).map((_,i)=>(
              <div key={i} className="h-12 rounded bg-slate-700/30 animate-pulse"/>
            ))}
          </div>
          <div className="h-24 animate-pulse rounded bg-slate-700/30"/>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({length:6}).map((_,i)=>(<div key={i} className="h-28 animate-pulse rounded bg-slate-700/30"/>))}
          </div>
        </div>
        <div className="card h-[560px] animate-pulse" />
      </div>
    );
  }

  if(error && !job){
    return (
      <div className="card space-y-3">
        <div className="text-lg font-semibold">Could not load job</div>
        <p className="text-sm text-slate-400">{error}</p>
        <button onClick={()=>load()} className="btn w-fit">Retry</button>
      </div>
    );
  }

  if(!job) return null;

  const base = process.env.NEXT_PUBLIC_API_URL || '';
  const imgSrc = (p:string)=> p?.startsWith('http') ? p : `${base}${p}`;
  const proforma = job.proformaPath ? (job.proformaPath.startsWith('http')? job.proformaPath : `${base}${job.proformaPath}`) : null;
  const photos: string[] = Array.isArray(job.photos) ? job.photos : [];

  // lightbox helpers
  const openLightbox = (idx:number)=> setLightbox({open:true, index:idx});
  const closeLightbox = ()=> setLightbox({open:false, index:0});
  const prev = ()=> setLightbox(s=> ({open:true, index: (s.index-1+photos.length)%photos.length }));
  const next = ()=> setLightbox(s=> ({open:true, index: (s.index+1)%photos.length }));

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="space-y-4">
        <div className="card">
          {/* Title */}
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold">{job.names || 'Unknown Client'}</div>
              <div className="text-sm text-slate-300">
                {[job.carMake, job.carType].filter(Boolean).join(' • ') || 'Vehicle'}
                {" "}•{" "}
                <span className="text-slate-400">{job.plateNumber || '—'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={()=>load()} className="rounded-md border border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800">Refresh</button>
              <a
                className={`rounded-md px-3 py-1.5 text-xs ${base && job._id ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-700/60 cursor-not-allowed'}`}
                href={base && job._id ? `${base}/clients/${job._id}/pdf` : '#'}
                target="_blank"
                rel="noreferrer noopener"
                onClick={(e)=>{ if(!base || !job._id) e.preventDefault(); }}
              >
                Export PDF
              </a>
            </div>
          </div>

          {/* DETAILS (read-only) */}
          <section aria-label="Job details" className="rounded-lg border border-white/10 bg-white/5">
            <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-lg sm:grid-cols-2">
              <Row label="Client Name" value={job.names || '—'} />
              <Row label="Car Brand (Make)" value={job.carMake || '—'} />
              <Row label="Car Model / Type" value={job.carType || '—'} />
              <Row label="Plate Number" value={job.plateNumber || '—'} />
              <Row label="Recovered By" value={job.recoveredBy || '—'} />
              <Row label="Status" value={<StatusBadge value={job.status}/>} />
              <Row label="Payment" value={<PaymentBadge value={job.payment}/>} />
              <Row
                label="Proforma"
                value={
                  proforma ? (
                    <a className="text-brand-400 hover:underline" href={proforma} target="_blank" rel="noreferrer noopener">
                      View Proforma
                    </a>
                  ) : '—'
                }
              />
            </dl>
          </section>

          {/* DESCRIPTION */}
          <section className="mt-4">
            <div className="mb-1 text-sm font-semibold text-slate-200">Description</div>
            <div className="whitespace-pre-wrap text-sm text-slate-300 border border-white/10 rounded-lg bg-white/5 p-3">
              {job.issues || '—'}
            </div>
          </section>

          {/* PHOTOS */}
          <section className="mt-4">
            <div className="mb-2 text-sm font-semibold text-slate-200">
              Photos {photos?.length ? <span className="text-slate-500">• {photos.length}</span> : null}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {photos.length>0 ? (
                photos.map((p:string, i:number)=> (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={p+i}
                    alt={`photo-${i+1}`}
                    src={imgSrc(p)}
                    onClick={()=>openLightbox(i)}
                    className="h-28 w-full cursor-zoom-in rounded-md border border-slate-800 object-cover transition hover:opacity-90"
                    onError={(e)=>{ (e.currentTarget as HTMLImageElement).style.visibility='hidden'; }}
                  />
                ))
              ) : (
                <div className="col-span-2 grid place-items-center rounded-md border border-white/10 bg-white/5 py-10 text-sm text-slate-400 sm:col-span-3">No photos</div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Chat */}
      <div className="h-[60vh] min-h-[420px] xl:h-[560px]">
        <Chat room={`client:${jobId}`}/>
      </div>

      {/* LIGHTBOX */}
      {lightbox.open && photos.length>0 && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4" onClick={closeLightbox} role="dialog" aria-modal="true" aria-label="Photo viewer">
          <div className="relative max-h-[90vh] w-full max-w-5xl" onClick={(e)=>e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgSrc(photos[lightbox.index])} alt={`photo-${lightbox.index+1}`} className="mx-auto max-h-[80vh] w-auto rounded-lg object-contain" />
            <button onClick={closeLightbox} className="absolute right-2 top-2 rounded-md bg-black/60 p-2 text-white hover:bg-black/80" aria-label="Close">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            {photos.length>1 && (
              <>
                <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-md bg-black/60 p-2 text-white hover:bg-black/80" aria-label="Previous">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-black/60 p-2 text-white hover:bg-black/80" aria-label="Next">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- tiny helper for detail rows ---------- */
function Row({ label, value }:{ label:string; value:any }){
  return (
    <div className="grid grid-cols-[140px_1fr] items-center gap-2 bg-slate-900/40 px-3 py-2 sm:px-4">
      <dt className="text-xs font-medium text-slate-400">{label}</dt>
      <dd className="truncate text-sm text-slate-200">{value}</dd>
    </div>
  );
}
