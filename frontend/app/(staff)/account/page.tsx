"use client";
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AccountPage(){
  type FormT = { name:string; email:string; phone:string; address:string };

  const [form,setForm]=useState<FormT>({ name:'', email:'', phone:'', address:'' });
  const [initial,setInitial]=useState<FormT>({ name:'', email:'', phone:'', address:'' });
  const [errors,setErrors]=useState<Partial<Record<keyof FormT,string>>>({});

  const [logo,setLogo]=useState<File|null>(null);
  const [logoPreview,setLogoPreview]=useState<string>('');
  const [logoUrl,setLogoUrl]=useState<string>(''); // existing on server

  const [loading,setLoading]=useState<boolean>(true);
  const [saving,setSaving]=useState<boolean>(false);
  const [progress,setProgress]=useState<number>(0);

  const base = process.env.NEXT_PUBLIC_API_URL || '';

  function validate(){
    const e: Partial<Record<keyof FormT,string>> = {};
    if(!form.name.trim()) e.name = 'Required';
    if(form.email && !/.+@.+\..+/.test(form.email)) e.email = 'Invalid email';
    if(form.phone && form.phone.replace(/\D/g,'').length < 7) e.phone = 'Too short';
    setErrors(e);
    return Object.keys(e).length===0;
  }

  useEffect(()=>{ validate(); },[form]);

  useEffect(()=>{
    const ctrl = new AbortController();
    setLoading(true);
    api.get('/account', { signal: ctrl.signal as any })
      .then(r=>{
        const d = r.data||{};
        const next = { name:d.name||'', email:d.email||'', phone:d.phone||'', address:d.address||'' } as FormT;
        setForm(next); setInitial(next);
        const lu = d.logoUrl || d.logo || d.logoPath || '';
        setLogoUrl(lu ? (String(lu).startsWith('http') ? lu : base + lu) : '');
      })
      .catch(()=>{})
      .finally(()=> setLoading(false));
    return ()=> ctrl.abort();
  },[]);

  function onLogoChange(file: File | null){
    if(!file){ setLogo(null); setLogoPreview(''); return; }
    if(!file.type.startsWith('image/')){ toast.error('Logo must be an image'); return; }
    if(file.size > 2*1024*1024){ toast.error('Logo too large (>2MB)'); return; }
    setLogo(file);
    const reader = new FileReader();
    reader.onload = ()=> setLogoPreview(String(reader.result||''));
    reader.readAsDataURL(file);
  }

  const isDirty = JSON.stringify(form) !== JSON.stringify(initial) || !!logo;
  const canSave = Object.keys(errors).length===0 && isDirty && !saving;

  async function save(){
    if(!canSave) return;
    setSaving(true); setProgress(0);
    try{
      const fd = new FormData();
      Object.entries(form).forEach(([k,v])=>fd.append(k,String(v??'')));
      if (logo) fd.append('logo', logo);
      await api.put('/account', fd, {
        headers:{ 'Content-Type':'multipart/form-data' },
        // @ts-ignore (axios style)
        onUploadProgress: (evt:any)=>{ if(evt?.total) setProgress(Math.round((evt.loaded/evt.total)*100)); }
      });
      toast.success('Saved');
      // Refresh from server to get canonical values/URL
      const { data } = await api.get('/account');
      const d = data||{};
      const next = { name:d.name||'', email:d.email||'', phone:d.phone||'', address:d.address||'' } as FormT;
      setForm(next); setInitial(next);
      const lu = d.logoUrl || d.logo || d.logoPath || '';
      setLogoUrl(lu ? (String(lu).startsWith('http') ? lu : base + lu) : '');
      setLogo(null); setLogoPreview('');
    }catch(err:any){
      toast.error(err?.response?.data?.message || 'Failed to save');
    }finally{ setSaving(false); setProgress(0); }
  }

  if(loading){
    return (
      <div className="max-w-2xl space-y-3">
        <div className="h-6 w-40 animate-pulse rounded bg-slate-700/40"/>
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({length:4}).map((_,i)=> <div key={i} className="h-10 animate-pulse rounded bg-slate-700/30" />)}
        </div>
        <div className="h-9 w-28 animate-pulse rounded bg-slate-700/30"/>
      </div>
    );
  }

  return (
    <div className="card max-w-3xl space-y-4 border border-white/10 bg-white/5 p-5 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">Account</div>
          <p className="text-xs text-slate-400">Update business details and logo.</p>
        </div>
        <button onClick={save} className={`btn inline-flex items-center gap-2 disabled:opacity-60 ${!canSave ? 'cursor-not-allowed' : ''}`} disabled={!canSave}>
          {saving ? (<span className="inline-flex items-center gap-2"><span className="loader h-4 w-4"/> Saving…</span>) : 'Save'}
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Garage name" error={errors.name}>
          <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="E‑Garage Ltd" className="input" required aria-invalid={!!errors.name} />
        </Field>
        <Field label="Email" error={errors.email}>
          <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@garage.com" className="input" type="email" aria-invalid={!!errors.email} />
        </Field>
        <Field label="Phone" error={errors.phone}>
          <input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+250 7XX XXX XXX" className="input" type="tel" aria-invalid={!!errors.phone} />
        </Field>
        <Field label="Address">
          <input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Kigali, Rwanda" className="input" />
        </Field>
      </div>

      {/* Logo */}
      <div className="space-y-2">
        <span className="block text-sm font-medium text-slate-300">Logo</span>
        <div className="flex flex-wrap items-center gap-3">
          <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-lg border border-white/10 bg-slate-900">
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPreview} className="h-full w-full object-cover" alt="Logo preview" />
            ) : logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} className="h-full w-full object-cover" alt="Current logo" />
            ) : (
              <svg className="h-6 w-6 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 16l5-5 4 4 5-6 4 5"/></svg>
            )}
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm hover:bg-slate-800">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
            <span>{logo ? 'Change logo' : (logoUrl ? 'Replace logo' : 'Upload logo')}</span>
            <input type="file" accept="image/*" className="sr-only" onChange={e=>onLogoChange(e.target.files?.[0]||null)} />
          </label>

          {logo && (
            <button type="button" onClick={()=>{ setLogo(null); setLogoPreview(''); }} className="rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-xs hover:bg-slate-800">
              Remove
            </button>
          )}
        </div>
        <p className="text-xs text-slate-500">PNG/SVG/JPG up to 2MB. Square images look best.</p>
      </div>

      {saving && progress>0 && (
        <div className="h-2 w-full overflow-hidden rounded bg-slate-800">
          <div className="h-full bg-brand-500" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* helper styles */}
      <style jsx global>{`
        .loader { border: 2px solid rgba(255,255,255,.2); border-top-color: rgba(255,255,255,.9); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function Field({ label, error, children }:{ label:string; error?:string; children: React.ReactNode }){
  return (
    <label className="space-y-1">
      <span className="block text-sm font-medium text-slate-300">{label}</span>
      {children}
      {error && <span className="block text-xs text-amber-300">{error}</span>}
    </label>
  );
}
