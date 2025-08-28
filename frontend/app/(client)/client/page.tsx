"use client";
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import JobCard from '@/components/shared/JobCard';

export default function ClientJobs(){
  const [jobs,setJobs]=useState<any[]>([]);
  const [q,setQ]=useState('');
  const [debouncedQ,setDebouncedQ]=useState('');
  const [loading,setLoading]=useState<boolean>(true);
  const [error,setError]=useState<string|undefined>();
  const [updatedAt,setUpdatedAt]=useState<number|undefined>();

  // who am I?
  const me = (typeof window!=='undefined' && localStorage.getItem('user'))
    ? JSON.parse(localStorage.getItem('user')!)
    : null;

  // --- helpers: enforce “mine” on the client as a safety net ---
  const norm = (v:any)=> String(v ?? '').toLowerCase();
  const isMine = (job:any)=>{
    if(!me) return false;
    const myId = String(me._id || me.id || me.userId || '');
    const myEmail = norm(me.email);

    // try common id fields
    const idFields = [
      job.userId, job.ownerId, job.clientId, job.createdById,
      job.user?._id, job.user?.id,
      job.client?._id, job.client?.id,
      job.createdBy?._id, job.createdBy?.id,
      job.accountId, job.customerId
    ].filter(Boolean).map(String);

    if(myId && idFields.includes(myId)) return true;

    // try common email fields
    const emailFields = [
      job.email, job.clientEmail, job.userEmail, job.ownerEmail,
      job.user?.email, job.client?.email, job.createdBy?.email,
      job.contactEmail
    ].filter(Boolean).map(norm);

    if(myEmail && emailFields.includes(myEmail)) return true;

    return false;
  };

  // debounce search input
  useEffect(()=>{
    const t = setTimeout(()=> setDebouncedQ(q.trim()), 400);
    return ()=> clearTimeout(t);
  },[q]);

  async function load(signal?: AbortSignal){
    try{
      setLoading(true); setError(undefined);
      const params = new URLSearchParams();
      params.set('mine','true'); // ask server to restrict
      if(debouncedQ) params.set('q',debouncedQ);
      const { data } = await api.get('/clients?'+params.toString(), { signal: signal as any });

      // defensive filter: show only my jobs even if API misbehaves
      const arr = Array.isArray(data) ? data : [];
      const mineOnly = arr.filter(isMine);
      setJobs(mineOnly);
      setUpdatedAt(Date.now());
    }catch(err:any){
      if((signal as any)?.aborted) return;
      setError(err?.response?.data?.message || 'Failed to load jobs');
    }finally{
      if(!(signal as any)?.aborted) setLoading(false);
    }
  }

  // initial + on debounced query change
  useEffect(()=>{
    const ctrl = new AbortController();
    load(ctrl.signal);
    return ()=> ctrl.abort();
  },[debouncedQ]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmitSearch = (e: React.FormEvent)=>{ e.preventDefault(); setDebouncedQ(q.trim()); };
  const clear = ()=>{ setQ(''); setDebouncedQ(''); };

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <form onSubmit={onSubmitSearch} className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={e=>setQ(e.target.value)}
          placeholder="Search my plate or make..."
          className="input max-w-xs"
        />
        <button type="submit" className="px-4 rounded-md bg-brand-600 hover:bg-brand-700 disabled:opacity-60" disabled={loading}>
          {loading ? <span className="inline-flex items-center gap-2"><span className="loader h-4 w-4"/> Loading</span> : 'Search'}
        </button>
        {q && (
          <button type="button" onClick={clear} className="rounded-md border border-white/10 bg-slate-900 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800">
            Clear
          </button>
        )}
        <span className="ml-auto text-xs text-slate-500">
          {updatedAt ? `Updated ${new Date(updatedAt).toLocaleTimeString()}` : ''}
        </span>
      </form>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
          <button onClick={()=>load()} className="ml-3 rounded-md border border-red-500/30 px-2 py-0.5 text-xs hover:bg-red-500/10">Retry</button>
        </div>
      )}

      {/* Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-live="polite">
        {loading && !error && (
          Array.from({length:6}).map((_,i)=>(
            <div key={i} className="card h-[180px] animate-pulse space-y-3">
              <div className="h-5 w-40 rounded bg-slate-700/40"/>
              <div className="h-4 w-56 rounded bg-slate-700/30"/>
              <div className="h-4 w-28 rounded bg-slate-700/20"/>
              <div className="h-8 w-32 rounded bg-slate-700/20"/>
            </div>
          ))
        )}

        {!loading && !error && jobs.length>0 && jobs.map(j => (
          <JobCard key={j._id} job={j} hrefBase="/client/jobs"/>
        ))}

        {!loading && !error && jobs.length===0 && (
          <div className="col-span-full grid place-items-center rounded-xl border border-white/10 bg-white/5 py-16 text-center text-slate-400">
            <div className="text-sm">No jobs yet.</div>
            <div className="mt-1 text-xs text-slate-500">Create a job from the dashboard to get started.</div>
          </div>
        )}
      </div>

      {/* helper styles */}
      <style jsx global>{`
        .loader { border: 2px solid rgba(255,255,255,.2); border-top-color: rgba(255,255,255,.9); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
