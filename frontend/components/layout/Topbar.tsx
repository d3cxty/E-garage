"use client";
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function Topbar(){
  const [brand,setBrand]=useState<{name?:string,logoPath?:string}|null>(null);
  useEffect(()=>{ api.get('/account').then(r=>setBrand(r.data)).catch(()=>{}); },[]);
  const logo = brand?.logoPath && (brand.logoPath.startsWith('http') ? brand.logoPath : `${process.env.NEXT_PUBLIC_API_URL}${brand.logoPath}`);
  return (
    <div className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur flex items-center px-6 justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {logo && (<img src={logo} className="w-9 h-9 rounded-lg object-cover" alt="logo"/>) }
        <div className="text-slate-200 text-sm">{brand?.name || 'E-Garage'}</div>
      </div>
      <div className="text-slate-400 text-xs">Staff Dashboard</div>
    </div>
  );
}
