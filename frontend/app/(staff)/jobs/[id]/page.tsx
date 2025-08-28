"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { StatusBadge, PaymentBadge } from '@/components/shared/Badges';
import Chat from '@/components/chat/Chat';

export default function JobDetail(){
  const { id } = useParams();
  const jobId = Array.isArray(id) ? id[0] : id; // safety for dynamic route

  const [job,setJob]=useState<any|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|undefined>();
  const [savingStatus,setSavingStatus]=useState(false);
  const [savingPayment,setSavingPayment]=useState(false);

  // Lightbox
  const [lightbox, setLightbox] = useState<{open:boolean; index:number}>({open:false, index:0});

  async function load(signal?: AbortSignal){
    if(!jobId){ setError('Missing job id'); setLoading(false); return; }
    try{
      setLoading(true); setError(undefined);
      const { data } = await api.get('/clients/'+jobId, { signal: signal as any });
      setJob(data);
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

  const refresh = ()=> load();

  async function setStatus(next:string){
    if(!job || savingStatus) return;
    const prev = job.status;
    setSavingStatus(true);
    setJob({ ...job, status: next });
    try{
      await api.patch(`/clients/${jobId}/status`,{ status: next });
    }catch(err:any){
      setJob({ ...job, status: prev });
      setError(err?.response?.data?.message || 'Failed to update status');
    }finally{ setSavingStatus(false); }
  }

  async function setPayment(next:string){
    if(!job || savingPayment) return;
    const prev = job.payment;
    setSavingPayment(true);
    setJob({ ...job, payment: next });
    try{
      await api.patch(`/clients/${jobId}/status`,{ payment: next });
    }catch(err:any){
      setJob({ ...job, payment: prev });
      setError(err?.response?.data?.message || 'Failed to update payment');
    }finally{ setSavingPayment(false); }
  }

  if(loading){
    return (
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card space-y-4">
          <div className="h-6 w-48 animate-pulse rounded bg-slate-700/50"/>
          <div className="h-4 w-64 animate-pulse rounded bg-slate-700/40"/>
          <div className="flex gap-2">
            <div className="h-6 w-24 animate-pulse rounded bg-slate-700/40"/>
            <div className="h-6 w-24 animate-pulse rounded bg-slate-700/40"/>
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
        <button onClick={refresh} className="btn w-fit">Retry</button>
      </div>
    );
  }

  if(!job) return null;

  const base = process.env.NEXT_PUBLIC_API_URL || '';
  const imgSrc = (p:string)=> p?.startsWith('http') ? p : `${base}${p}`;
  const proforma = job.proformaPath ? (job.proformaPath.startsWith('http')? job.proformaPath : `${base}${job.proformaPath}`) : null;
  const photos: string[] = Array.isArray(job.photos) ? job.photos : [];

  const openLightbox = (idx:number)=> setLightbox({open:true, index:idx});
  const closeLightbox = ()=> setLightbox({open:false, index:0});
  const prev = ()=> setLightbox(s=> ({open:true, index: (s.index-1+photos.length)%photos.length }));
  const next = ()=> setLightbox(s=> ({open:true, index: (s.index+1)%photos.length }));

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="space-y-4">
        <div className="card">
          {/* Header */}
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold">{job.names || 'Unknown Client'}</div>
              <div className="text-sm text-slate-300">{[job.carMake, job.carType].filter(Boolean).join(' • ') || 'Vehicle'} • <span className="text-slate-400">{job.plateNumber || '—'}</span></div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={refresh} className="rounded-md border border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800">Refresh</button>
              <a className={`rounded-md px-3 py-1.5 text-xs ${base && job._id ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-700/60 cursor-not-allowed'}`} href={base && job._id ? `${base}/clients/${job._id}/pdf` : '#'} target="_blank" rel="noreferrer noopener">Export PDF</a>
            </div>
          </div>

          {/* Badges + quick actions */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge value={job.status}/>
            <PaymentBadge value={job.payment}/>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {['pending','repairing','completed'].map((s)=> (
                <button key={s} onClick={()=>setStatus(s)} disabled={savingStatus || job.status===s} className={`rounded px-2 py-1 text-xs transition ${job.status===s ? 'bg-brand-600' : 'bg-slate-800 hover:bg-slate-700'} ${savingStatus ? 'opacity-60 cursor-not-allowed' : ''}`}>
                  {s.charAt(0).toUpperCase()+s.slice(1)}
                </button>
              ))}
              <button onClick={()=>setPayment(job.payment==='paid'?'unpaid':'paid')} disabled={savingPayment} className={`rounded px-2 py-1 text-xs transition ${job.payment==='paid' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-brand-600 hover:bg-brand-700'} ${savingPayment ? 'opacity-60 cursor-not-allowed' : ''}`}>
                {savingPayment ? 'Saving…' : (job.payment==='paid' ? 'Mark Unpaid' : 'Mark Paid')}
              </button>
            </div>
          </div>

          {/* Error inline (actions) */}
          {error && (
            <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-200">
              {error}
            </div>
          )}

          {/* Issues */}
          <div className="mt-4 whitespace-pre-wrap text-sm text-slate-300">{job.issues || '-'}</div>

          {/* Proforma */}
          {proforma && (
            <a className="mt-4 inline-flex items-center gap-2 text-brand-400 hover:underline" href={proforma} target="_blank" rel="noreferrer noopener">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
              View Proforma
            </a>
          )}

          {/* Photos */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {photos.length>0 ? (
              photos.map((p:string, i:number)=> (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={p+i} alt={`photo-${i+1}`} src={imgSrc(p)} onClick={()=>openLightbox(i)} className="h-28 w-full cursor-zoom-in rounded-md border border-slate-800 object-cover"/>
              ))
            ) : (
              <div className="col-span-3 grid place-items-center rounded-md border border-white/10 bg-white/5 py-10 text-sm text-slate-400">No photos</div>
            )}
          </div>
        </div>
      </div>

      <div className="h-[560px]">
        <Chat room={`client:${jobId}`}/>
      </div>

      {/* Lightbox */}
      {lightbox.open && photos.length>0 && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4" onClick={closeLightbox}>
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
