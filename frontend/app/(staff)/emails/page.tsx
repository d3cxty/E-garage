"use client";
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function Emails(){
  type Mail = { _id?: string; to: string | string[]; subject: string; body: string; createdAt?: string };

  const [list,setList]=useState<Mail[]>([]);
  const [to,setTo]=useState('');
  const [subject,setSubject]=useState('');
  const [body,setBody]=useState('');

  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|undefined>();
  const [sending,setSending]=useState(false);

  // helpers
  const splitRecipients = (s:string)=> s.split(/[\s,;]+/).map(x=>x.trim()).filter(Boolean);
  const isEmail = (s:string)=> /.+@.+\..+/.test(s);
  const recipients = splitRecipients(to);
  const canSend = recipients.length>0 && recipients.every(isEmail) && subject.trim().length>0 && body.trim().length>0 && !sending;

  async function load(){
    try{
      setLoading(true); setError(undefined);
      const {data}=await api.get('/emails');
      setList(Array.isArray(data) ? data : []);
    }catch(err:any){
      setError(err?.response?.data?.message || 'Failed to load emails');
    }finally{
      setLoading(false);
    }
  }
  useEffect(()=>{ load(); },[]);

  async function send(){
    if(!canSend){ toast.error('Please complete the fields correctly'); return; }
    try{
      setSending(true);
      await api.post('/emails/send',{
        to: recipients.join(', '), // backend expects a string; join multiple recipients
        subject: subject.trim(),
        body: body.trim()
      });
      toast.success('Sent');
      setTo(''); setSubject(''); setBody('');
      await load();
    }catch(err:any){
      toast.error(err?.response?.data?.message || 'Failed');
    }finally{ setSending(false); }
  }

  const clear = ()=>{ setTo(''); setSubject(''); setBody(''); };

  return (
    <div className="space-y-4 px-4 sm:px-6">
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Compose */}
        <div className="card">
          <div className="mb-2 flex items-center justify-between">
            <div className="font-semibold">Compose</div>
            <div className="text-xs text-slate-500">Use commas to add multiple recipients</div>
          </div>
          <div className="grid gap-2">
            <Field label="To" hint={recipients.length>1 ? `${recipients.length} recipients` : undefined} error={to && !recipients.every(isEmail) ? 'Invalid email format' : undefined}>
              <input
                value={to}
                onChange={e=>setTo(e.target.value)}
                placeholder="client@example.com, another@domain.com"
                className="input"
                type="email"
                multiple
                inputMode="email"
              />
            </Field>
            <Field label="Subject" error={!subject.trim() && subject!=='' ? 'Required' : undefined}>
              <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Quick update on your vehicle" className="input" />
            </Field>
            <Field label="Body">
              <textarea
                value={body}
                onChange={e=>setBody(e.target.value)}
                onKeyDown={(e)=>{ if((e.ctrlKey||e.metaKey) && e.key==='Enter') send(); }}
                placeholder={`Hi [Name],\n\nYour car is ...`}
                className="input h-44"
              />
              <div className="mt-1 text-right text-[11px] text-slate-500">{body.length} chars</div>
            </Field>
            <div className="flex items-center gap-2 pt-1">
              <button onClick={send} disabled={!canSend} className={`btn inline-flex items-center gap-2 disabled:opacity-60 ${!canSend ? 'cursor-not-allowed' : ''}`}>
                {sending ? (<span className="inline-flex items-center gap-2"><span className="loader h-4 w-4"/> Sending…</span>) : 'Send'}
              </button>
              <button onClick={clear} type="button" className="rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm hover:bg-slate-800">Clear</button>
              <span className="ml-auto hidden text-[11px] text-slate-500 sm:block">Press ⌘/Ctrl + Enter to send</span>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="card">
          <div className="mb-2 flex items-center justify-between">
            <div className="font-semibold">Recent Emails</div>
            <div className="flex items-center gap-2">
              <button onClick={load} className="rounded-md border border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800">Refresh</button>
            </div>
          </div>

          {error && (
            <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-200">
              {error}
            </div>
          )}

          <div className="max-h-[50vh] overflow-auto pr-2 md:max-h-[520px]">
            {loading ? (
              <div className="space-y-3">
                {Array.from({length:6}).map((_,i)=> (
                  <div key={i} className="rounded-md border border-slate-800 bg-slate-900/50 p-3">
                    <div className="h-4 w-40 animate-pulse rounded bg-slate-700/40" />
                    <div className="mt-2 h-3 w-24 animate-pulse rounded bg-slate-700/30" />
                    <div className="mt-2 h-3 w-full animate-pulse rounded bg-slate-700/20" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {list.map((m)=>{
                  const toStr = Array.isArray(m.to) ? m.to.join(', ') : m.to;
                  const when = m.createdAt ? new Date(m.createdAt).toLocaleString() : '';
                  return (
                    <div key={m._id || m.subject+String(m.createdAt)} className="rounded-md border border-slate-800 bg-slate-900/50 p-3">
                      <div className="text-sm font-medium text-slate-200 line-clamp-1" title={m.subject}>{m.subject}</div>
                      <div className="text-xs text-slate-400">To: {toStr}{when && <span className="ml-2 text-slate-500">• {when}</span>}</div>
                      <div className="mt-1 line-clamp-2 text-xs text-slate-300" title={m.body}>{m.body}</div>
                    </div>
                  );
                })}
                {list.length===0 && !error && (
                  <div className="text-sm text-slate-500">No emails yet.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* helper styles */}
      <style jsx global>{`
        .loader { border: 2px solid rgba(255,255,255,.2); border-top-color: rgba(255,255,255,.9); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function Field({ label, children, hint, error }:{ label:string; children: React.ReactNode; hint?:string; error?:string }){
  return (
    <label className="space-y-1">
      <span className="block text-sm font-medium text-slate-300">{label}</span>
      {children}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{hint}</span>
        {error && <span className="text-xs text-amber-300">{error}</span>}
      </div>
    </label>
  );
}
