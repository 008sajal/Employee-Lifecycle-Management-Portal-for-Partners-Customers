"use client";

import { useEffect, useState } from "react";
import { apiUrl, authHeaders } from "../../../../lib/api";

function IconBadge({ children }) {
  return <div className="h-9 w-9 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">{children}</div>;
}

function PartnersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-700">
      <path
        d="M8.5 10.5C10.1569 10.5 11.5 9.15685 11.5 7.5C11.5 5.84315 10.1569 4.5 8.5 4.5C6.84315 4.5 5.5 5.84315 5.5 7.5C5.5 9.15685 6.84315 10.5 8.5 10.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M15.5 10.5C17.1569 10.5 18.5 9.15685 18.5 7.5C18.5 5.84315 17.1569 4.5 15.5 4.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M3.8 19.2C4.5 16.9 6.3 15.5 8.5 15.5C10.7 15.5 12.5 16.9 13.2 19.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M14.2 19.2C14.6 17.6 15.6 16.5 17 16.1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function getRole() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("role");
}

export default function AdminPartnersPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: "", commissionRate: 0.05 });
  const [busy, setBusy] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", commissionRate: 0.05 });

  async function load() {
    const res = await fetch(apiUrl("/partners"), { headers: authHeaders() });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body?.message || "Failed to load partners");
    setItems(body.items);
  }

  useEffect(() => {
    if (getRole() !== "superadmin") {
      setError("Forbidden");
      return;
    }
    load().catch((e) => setError(e.message));
  }, []);

  async function create() {
    setBusy(true);
    const res = await fetch(apiUrl("/partners"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders()
      },
      body: JSON.stringify({
        name: form.name,
        commissionRate: Number(form.commissionRate)
      })
    });
    const body = await res.json().catch(() => ({}));
    try {
      setError(null);
      if (!res.ok) throw new Error(body?.message || "Failed to create partner");
      setForm({ name: "", commissionRate: 0.05 });
      await load();
    } catch (e) {
      setError(e.message || "Failed to create partner");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id, status) {
    setBusy(true);
    const res = await fetch(apiUrl(`/partners/${id}`), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders()
      },
      body: JSON.stringify({ status })
    });
    const body = await res.json().catch(() => ({}));
    try {
      setError(null);
      if (!res.ok) throw new Error(body?.message || "Failed to update partner");
      await load();
    } catch (e) {
      setError(e.message || "Failed to update partner");
    } finally {
      setBusy(false);
    }
  }

  function beginEdit(p) {
    setEditingId(p._id);
    setEditForm({ name: p.name || "", commissionRate: Number(p.commissionRate ?? 0.05) });
  }

  async function saveEdit(id) {
    setBusy(true);
    try {
      setError(null);
      const res = await fetch(apiUrl(`/partners/${id}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({
          name: editForm.name,
          commissionRate: Number(editForm.commissionRate)
        })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || "Failed to update partner");
      setEditingId(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    const ok = window.confirm("Delete this partner? This will mark it as deleted.");
    if (!ok) return;
    setBusy(true);
    try {
      setError(null);
      const res = await fetch(apiUrl(`/partners/${id}`), {
        method: "DELETE",
        headers: authHeaders()
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || "Failed to delete partner");
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Partners</h1>
          <IconBadge>
            <PartnersIcon />
          </IconBadge>
        </div>
        <div className="text-sm text-slate-600">Superadmin</div>
      </div>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <section className="mt-6 border rounded-lg bg-white p-4 border-slate-200">
        <div className="font-medium">Create partner</div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <input
            className="border rounded-lg px-3 py-2 col-span-2 border-slate-200"
            placeholder="Partner name"
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
          />
          <input
            className="border rounded-lg px-3 py-2 border-slate-200"
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={form.commissionRate}
            onChange={(e) => setForm((s) => ({ ...s, commissionRate: e.target.value }))}
          />
          <button className="px-4 py-2 border rounded-lg bg-white hover:bg-slate-50 border-slate-200 disabled:opacity-50" onClick={create} disabled={busy || !form.name.trim()}>
            Create
          </button>
        </div>
      </section>

      <section className="mt-6 border rounded-lg overflow-hidden bg-white border-slate-200">
        <div className="grid grid-cols-12 gap-2 p-3 border-b font-medium border-slate-200 bg-slate-50">
          <div className="col-span-5">Name</div>
          <div className="col-span-2">Rate</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-3">Actions</div>
        </div>
        {items.map((p) => (
          <div key={p._id} className="p-3 border-b border-slate-200">
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-5">{p.name}</div>
              <div className="col-span-2">{p.commissionRate}</div>
              <div className="col-span-2">{p.status}</div>
              <div className="col-span-3 flex flex-wrap gap-2 justify-end">
                <button className="px-3 py-1 border rounded-lg bg-white hover:bg-slate-50 border-slate-200 disabled:opacity-50" onClick={() => setStatus(p._id, "active")} disabled={busy}>
                  Activate
                </button>
                <button className="px-3 py-1 border rounded-lg bg-white hover:bg-slate-50 border-slate-200 disabled:opacity-50" onClick={() => setStatus(p._id, "inactive")} disabled={busy}>
                  Deactivate
                </button>
                <button className="px-3 py-1 border rounded-lg bg-white hover:bg-slate-50 border-slate-200 disabled:opacity-50" onClick={() => beginEdit(p)} disabled={busy}>
                  Edit
                </button>
                <button className="px-3 py-1 border rounded-lg bg-white hover:bg-slate-50 border-slate-200 disabled:opacity-50" onClick={() => remove(p._id)} disabled={busy}>
                  Delete
                </button>
              </div>
            </div>

            {editingId === p._id ? (
              <div className="mt-3 border rounded-lg bg-white p-3 border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    className="border rounded-lg px-3 py-2 text-sm border-slate-200"
                    placeholder="Partner name"
                    value={editForm.name}
                    onChange={(e) => setEditForm((s) => ({ ...s, name: e.target.value }))}
                  />
                  <input
                    className="border rounded-lg px-3 py-2 text-sm border-slate-200"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={editForm.commissionRate}
                    onChange={(e) => setEditForm((s) => ({ ...s, commissionRate: e.target.value }))}
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <button className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm disabled:opacity-50" onClick={() => saveEdit(p._id)} disabled={busy || !editForm.name.trim()}>
                      Save
                    </button>
                    <button className="px-3 py-2 border rounded-lg bg-white hover:bg-slate-50 border-slate-200 text-sm" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </section>
    </div>
  );
}
