"use client";
import { useEffect, useState } from "react";

type Role = "admin" | "staff" | "client";

export default function UserFormModal({
  open, onClose, onSubmit, adminOnly=false
}:{
  open:boolean;
  onClose:()=>void;
  onSubmit:(p:{email:string; password:string; role:Role})=>void;
  adminOnly?: boolean;
}) {
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [role,setRole]=useState<Role>("staff");

  useEffect(()=>{ if(open){ setEmail(""); setPassword(""); setRole("staff"); } },[open]);

  if(!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-md card">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold">Create User</div>
          <button onClick={onClose} className="px-2 py-1 rounded-md hover:bg-slate-800">✕</button>
        </div>

        {adminOnly && (
          <div className="mb-3 text-sm text-rose-300">
            You are not an admin — creation is disabled.
          </div>
        )}

        <div className="space-y-3">
          <div>
            <div className="text-xs mb-1 text-slate-400">Email</div>
            <input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="user@example.com"/>
          </div>
          <div>
            <div className="text-xs mb-1 text-slate-400">Password</div>
            <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/>
          </div>
          <div>
            <div className="text-xs mb-1 text-slate-400">Role</div>
            <select className="select w-full" value={role} onChange={e=>setRole(e.target.value as Role)}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
              <option value="client">Client</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700">Cancel</button>
            <button
              onClick={()=>onSubmit({ email, password, role })}
              className="btn disabled:opacity-50"
              disabled={adminOnly || !email || !password}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
