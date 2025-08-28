"use client";
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Chat from '@/components/chat/Chat';
import JobCard from '@/components/shared/JobCard';

export default function Dashboard(){
  const [jobs,setJobs]=useState<any[]>([]);
  const [loading,setLoading]=useState<boolean>(true);
  const [error,setError]=useState<string|undefined>();

  async function load(signal?: AbortSignal){
    try{
      setLoading(true); setError(undefined);
      const { data } = await api.get('/clients?status=pending', { signal: signal as any });
      setJobs(Array.isArray(data) ? data.slice(0,4) : []);
    }catch(err:any){
      if((signal as any)?.aborted) return;
      setError(err?.response?.data?.message || 'Failed to load pending jobs');
    }finally{
      if(!(signal as any)?.aborted) setLoading(false);
    }
  }

  useEffect(()=>{
    const ctrl = new AbortController();
    load(ctrl.signal);
    return ()=> ctrl.abort();
  },[]);

  const refresh = ()=> load();

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      {/* Left: Pending jobs */}
      <div className="xl:col-span-2 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-400">Pending jobs</div>
          <div className="flex items-center gap-2">
            <button onClick={refresh} className="rounded-md border border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800">Refresh</button>
            <a href="/jobs?status=pending" className="text-xs text-brand-400 hover:underline">View all</a>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
            <button onClick={refresh} className="ml-3 rounded-md border border-red-500/30 px-2 py-0.5 text-xs hover:bg-red-500/10">Retry</button>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2" aria-live="polite">
          {loading && !error && (
            Array.from({length:4}).map((_,i)=>(
              <div key={i} className="card h-[180px] animate-pulse space-y-3">
                <div className="h-5 w-40 rounded bg-slate-700/40"/>
                <div className="h-4 w-56 rounded bg-slate-700/30"/>
                <div className="h-4 w-28 rounded bg-slate-700/20"/>
                <div className="h-8 w-32 rounded bg-slate-700/20"/>
              </div>
            ))
          )}

          {!loading && !error && jobs.length>0 && jobs.map(j => (
            <JobCard key={j._id} job={j}/>
          ))}

          {!loading && !error && jobs.length===0 && (
            <div className="col-span-full grid place-items-center rounded-xl border border-white/10 bg-white/5 py-12 text-center text-slate-400">
              <div className="text-sm">No pending jobs.</div>
              <div className="mt-1 text-xs text-slate-500">Create a job to see it here.</div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Chat */}
      <div className="space-y-3">
        <div className="text-sm text-slate-400">Team chat</div>
        <div className="card p-0">
          <div className="h-[560px]">
            <Chat room="ops:dashboard"/>
          </div>
        </div>
      </div>
    </div>
  );
}
