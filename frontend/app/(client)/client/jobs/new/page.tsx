"use client";
import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function NewJob(){
  const [form,setForm]=useState<any>({ names:'', carType:'', carMake:'', plateNumber:'', issues:'', recoveredBy:'owner' });
  const [photos,setPhotos]=useState<File[]>([]);
  const [previews,setPreviews]=useState<string[]>([]);
  const [proforma,setProforma]=useState<File|null>(null);
  const [busy,setBusy]=useState(false);
  const [progress,setProgress]=useState(0);
  const [dragging,setDragging]=useState(false);
  const [errors,setErrors]=useState<Record<string,string>>({});

  const required = ['names','carType','carMake','plateNumber'] as const;

  function validate(){
    const e: Record<string,string> = {};
    required.forEach((k)=>{ if(!String(form[k]||'').trim()) e[k] = 'Required'; });
    if(form.plateNumber && String(form.plateNumber).trim().length < 4) e.plateNumber = 'Plate looks too short';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function addPhotos(files: FileList | null){
    const fs = Array.from(files||[]);
    const MAX = 8; const MAXSIZE = 5*1024*1024;
    const accepted: File[] = [];
    for(const f of fs){
      if(!f.type.startsWith('image/')) { toast.error(`Skip ${f.name}: not an image`); continue; }
      if(f.size > MAXSIZE) { toast.error(`Skip ${f.name}: >5MB`); continue; }
      accepted.push(f);
    }
    const merged = [...photos, ...accepted].slice(0, MAX);
    setPhotos(merged);
    // generate previews
    merged.forEach((file, i)=>{
      const reader = new FileReader();
      reader.onload = ()=>{
        setPreviews((prev)=>{ const copy = [...prev]; copy[i] = String(reader.result||''); return copy; });
      };
      reader.readAsDataURL(file);
    });
  }

  function removePhoto(i:number){
    setPhotos((arr)=> arr.filter((_,idx)=> idx!==i));
    setPreviews((arr)=> arr.filter((_,idx)=> idx!==i));
  }

  function onDrop(e: React.DragEvent){
    e.preventDefault(); setDragging(false);
    addPhotos(e.dataTransfer.files);
  }

  function onFilesInput(e: React.ChangeEvent<HTMLInputElement>){
    addPhotos(e.target.files);
    // reset input to allow re-selecting the same file names
    e.currentTarget.value = '';
  }

  function onProformaChange(file: File | null){
    if(!file){ setProforma(null); return; }
    const ok = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if(!ok){ toast.error('Proforma must be a PDF'); return; }
    if(file.size > 10*1024*1024){ toast.error('Proforma too large (>10MB)'); return; }
    setProforma(file);
  }

  async function submit(e:React.FormEvent){
    e.preventDefault();
    if(!validate()){ toast.error('Please fix form errors'); return; }
    setBusy(true); setProgress(0);
    try{
      const fd = new FormData();
      Object.entries(form).forEach(([k,v])=>fd.append(k,String(v??'')));
      photos.forEach(p=>fd.append('photos', p));
      if (proforma) fd.append('proforma', proforma);
      await api.post('/clients', fd, {
        headers:{ 'Content-Type':'multipart/form-data' },
        // @ts-ignore axios style progress (your api likely supports this)
        onUploadProgress: (evt:any)=>{ if(evt?.total){ setProgress(Math.round((evt.loaded/evt.total)*100)); } },
      });
      toast.success('Job submitted');
      setForm({ names:'', carType:'', carMake:'', plateNumber:'', issues:'', recoveredBy:'owner' });
      setPhotos([]); setPreviews([]); setProforma(null); setErrors({});
    }catch(err:any){
      toast.error(err?.response?.data?.message || 'Failed to submit');
    }finally{ setBusy(false); setProgress(0); }
  }

  const canSubmit = !busy && Object.keys(errors).length===0 && required.every(k=>String(form[k]||'').trim());

  return (
    <form onSubmit={submit} className="card max-w-3xl space-y-4 border border-white/10 bg-white/5 p-5 md:p-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">New Job</h2>
        <p className="text-sm text-slate-400">Create a client ticket and upload photos & documents.</p>
      </div>

      {/* required fields */}
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Client name" error={errors.names}>
          <input className="input" value={form.names} onChange={e=>setForm({...form, names:e.target.value})} placeholder="e.g. Anita N." required aria-invalid={!!errors.names} />
        </Field>
        <Field label="Car type" error={errors.carType}>
          <input className="input" value={form.carType} onChange={e=>setForm({...form, carType:e.target.value})} placeholder="e.g. SUV" required aria-invalid={!!errors.carType} />
        </Field>
        <Field label="Car make" error={errors.carMake}>
          <input className="input" value={form.carMake} onChange={e=>setForm({...form, carMake:e.target.value})} placeholder="e.g. Toyota" required aria-invalid={!!errors.carMake} />
        </Field>
        <Field label="Plate number" error={errors.plateNumber}>
          <input className="input uppercase tracking-wider" value={form.plateNumber} onChange={e=>setForm({...form, plateNumber:e.target.value.toUpperCase()})} placeholder="e.g. RAD 123 A" required aria-invalid={!!errors.plateNumber} />
        </Field>
      </div>

      {/* issues */}
      <Field label="Describe issues">
        <textarea value={form.issues} onChange={e=>setForm({...form,issues:e.target.value})} placeholder="What seems to be the problem?" className="input h-28" />
      </Field>

      {/* recovered by */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-slate-300" htmlFor="recoveredBy">Recovered by</label>
        <select id="recoveredBy" value={form.recoveredBy} onChange={e=>setForm({...form,recoveredBy:e.target.value})} className="select">
          <option value="owner">owner</option>
          <option value="insurance">insurance</option>
        </select>
      </div>

      {/* Photos uploader */}
      <div>
        <div
          onDragOver={(e)=>{ e.preventDefault(); setDragging(true); }}
          onDragLeave={()=>setDragging(false)}
          onDrop={onDrop}
          className={`rounded-xl border border-dashed p-4 transition ${dragging ? 'border-brand-500 bg-brand-500/5' : 'border-white/15 bg-white/5'}`}
        >
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <svg className="h-6 w-6 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <p className="text-sm text-slate-400">Drag & drop photos here, or <label className="text-brand-500 underline-offset-4 hover:underline cursor-pointer"><input type="file" className="sr-only" accept="image/*" multiple onChange={onFilesInput} />browse</label></p>
            <p className="text-xs text-slate-500">Up to 8 images, 5MB each</p>
          </div>
        </div>
        {photos.length>0 && (
          <div className="mt-3 grid grid-cols-3 gap-3 md:grid-cols-4">
            {photos.map((f, i)=> (
              <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-white/10">
                {previews[i] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previews[i]} alt={f.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-xs text-slate-400">{f.name}</div>
                )}
                <button type="button" onClick={()=>removePhoto(i)} className="absolute right-1 top-1 rounded-md bg-black/50 p-1 opacity-0 transition hover:bg-black/70 group-hover:opacity-100" aria-label={`Remove ${f.name}`}>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Proforma */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-slate-300">Proforma (PDF)</label>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm hover:bg-slate-800">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
          <span>{proforma ? proforma.name : 'Choose file'}</span>
          <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={e=>onProformaChange(e.target.files?.[0]||null)} />
        </label>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button className="btn inline-flex items-center gap-2" disabled={!canSubmit || busy}>
          {busy ? (
            <span className="inline-flex items-center gap-2"><span className="loader h-4 w-4"/> Uploading…</span>
          ) : 'Submit'}
        </button>
        {busy && progress>0 && (
          <div className="h-2 w-40 overflow-hidden rounded bg-slate-800">
            <div className="h-full bg-brand-500" style={{width: `${progress}%`}} />
          </div>
        )}
      </div>

      {/* helper styles */}
      <style jsx global>{`
        .loader { border: 2px solid rgba(255,255,255,.2); border-top-color: rgba(255,255,255,.9); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </form>
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
