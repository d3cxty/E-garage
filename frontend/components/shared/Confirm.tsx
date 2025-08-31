"use client";
export default function Confirm({
  open, title, message, confirmText="OK", confirmTone="default",
  onCancel, onConfirm
}:{
  open:boolean;
  title:string;
  message:string;
  confirmText?:string;
  confirmTone?: "default"|"danger";
  onCancel:()=>void;
  onConfirm:()=>void;
}) {
  if(!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-sm card">
        <div className="text-lg font-semibold mb-2">{title}</div>
        <div className="text-slate-300 text-sm">{message}</div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700">Cancel</button>
          <button
            onClick={onConfirm}
            className={`px-3 py-2 rounded-md ${confirmTone==='danger'?'bg-rose-600 hover:bg-rose-700':'bg-brand-600 hover:bg-brand-700'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
