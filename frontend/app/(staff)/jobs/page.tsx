"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import JobCard from '@/components/shared/JobCard';

export default function Jobs(){
  const { user } = useAuth();
  const router = useRouter();

  const [q,setQ]=useState('');
  const [status,setStatus]=useState('');
  const [payment,setPayment]=useState('');
  const [jobs,setJobs]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|undefined>();

  // redirect clients away from admin list
  useEffect(()=>{
    if(!user) return;
    if((user.role||'').toLowerCase()==='client'){
      router.replace('/client/jobs');
    }
  },[user,router]);

  async function load(){
    try{
      setLoading(true); setError(undefined);
      const params = new URLSearchParams();
      if(q) params.set('q', q.trim());
      if(status) params.set('status', status);
      if(payment) params.set('payment', payment);
      // staff/admin: server returns ALL; clients would be scoped anyway
      const { data } = await api.get('/clients'+(params.toString()?`?${params.toString()}`:''));
      const arr = Array.isArray(data) ? data : (data?.items || []);
      setJobs(arr);
    }catch(err:any){
      setError(err?.response?.data?.message || 'Failed to load jobs');
    }finally{
      setLoading(false);
    }
  }
  useEffect(()=>{ load(); /* eslint-disable-next-line */ },[]);

  return (
    <div className="space-y-4">
      {/* Filters */}
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

      {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}

      {/* Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-live="polite">
        {loading && !error && Array.from({length:6}).map((_,i)=>(
          <div key={i} className="card h-[180px] animate-pulse space-y-3">
            <div className="h-5 w-40 rounded bg-slate-700/40"/>
            <div className="h-4 w-56 rounded bg-slate-700/30"/>
            <div className="h-4 w-28 rounded bg-slate-700/20"/>
            <div className="h-8 w-32 rounded bg-slate-700/20"/>
          </div>
        ))}

        {!loading && !error && jobs.map(j => <JobCard key={j._id} job={j}/>)}

        {!loading && !error && jobs.length===0 && (
          <div className="col-span-full text-slate-500">No jobs found.</div>
        )}
      </div>
    </div>
  );
}
