"use client";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Plus, Trash2, Shield } from "lucide-react";
import UserFormModal from "@/components/users/UserFormModal";
import Confirm from "@/components/shared/Confirm";

type Role = "admin" | "staff" | "client";
type UserRow = { _id: string; email: string; role: Role; createdAt?: string };

export default function UsersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [delId, setDelId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get("/auth/users");
        if (!mounted) return;
        setRows(data || []);
      } catch (e:any) {
        console.error(e);
        toast.error(e?.response?.data?.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r =>
      r.email.toLowerCase().includes(s) || r.role.toLowerCase().includes(s)
    );
  }, [rows, q]);

  async function handleCreate(payload: { email: string; password: string; role: Role }) {
    try {
      await api.post("/auth/create-staff", payload);
      toast.success("User created");
      // re-fetch
      const { data } = await api.get("/auth/users");
      setRows(data || []);
      setOpenCreate(false);
    } catch (e:any) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Create failed");
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/auth/users/${id}`);
      toast.success("User deleted");
      setRows(prev => prev.filter(r => r._id !== id));
      setDelId(null);
    } catch (e:any) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-slate-400 text-sm">Manage staff & admin accounts.</p>
        </div>

        <div className="flex gap-2">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search users…"
            className="input w-64"
          />
          <button
            className="btn flex items-center gap-2 disabled:opacity-50"
            onClick={() => setOpenCreate(true)}
            disabled={!isAdmin}
            title={!isAdmin ? "Admin only" : "Create user"}
          >
            <Plus size={16} /> New user
          </button>
        </div>
      </header>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/60 border-b border-slate-800">
            <tr className="[&>th]:text-left [&>th]:px-4 [&>th]:py-3 text-slate-300">
              <th>Email</th>
              <th className="w-40">Role</th>
              <th className="w-44">Created</th>
              <th className="w-24 text-right pr-4">Action</th>
            </tr>
          </thead>
          <tbody className="[&>tr>td]:px-4 [&>tr>td]:py-3">
            {loading && (
              <tr>
                <td colSpan={4} className="text-slate-400">Loading…</td>
              </tr>
            )}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="text-slate-400">No users found.</td>
              </tr>
            )}

            {!loading && filtered.map(u => (
              <tr key={u._id} className="border-t border-slate-800/60 hover:bg-slate-900/40">
                <td className="font-medium">{u.email}</td>
                <td className="capitalize">
                  <span className={`px-2 py-1 rounded-md text-xs
                    ${u.role === "admin" ? "bg-rose-500/20 text-rose-300"
                    : u.role === "staff" ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-slate-700 text-slate-300"}`}>
                    {u.role}
                  </span>
                </td>
                <td className="text-slate-400">{u.createdAt ? new Date(u.createdAt).toLocaleString() : "-"}</td>
                <td className="text-right">
                  <div className="inline-flex items-center gap-2">
                    {u.role === "admin" && <Shield size={16} className="text-slate-400" title="Admin"/>}
                    <button
                      className="px-2 py-1 rounded-md hover:bg-slate-800 disabled:opacity-50"
                      onClick={() => setDelId(u._id)}
                      disabled={!isAdmin || user?.email === u.email}
                      title={!isAdmin ? "Admin only" : (user?.email === u.email ? "You cannot delete yourself" : "Delete user")}
                    >
                      <Trash2 size={16} className="text-rose-300" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* create modal */}
      <UserFormModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onSubmit={handleCreate}
        adminOnly={!isAdmin}
      />

      {/* delete confirm */}
      <Confirm
        open={!!delId}
        title="Delete user"
        message="This action cannot be undone. Are you sure?"
        confirmText="Delete"
        confirmTone="danger"
        onCancel={() => setDelId(null)}
        onConfirm={() => delId && handleDelete(delId)}
      />
    </div>
  );
}
