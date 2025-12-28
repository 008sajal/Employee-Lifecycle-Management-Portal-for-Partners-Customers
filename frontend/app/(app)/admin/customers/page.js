"use client";

import { useEffect, useState } from "react";
import { apiUrl, authHeaders } from "../../../../lib/api";

function IconBadge({ children }) {
  return <div className="h-9 w-9 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">{children}</div>;
}

function CustomersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-700">
      <path
        d="M4.5 19.5V8.5C4.5 7.672 5.172 7 6 7H18C18.828 7 19.5 7.672 19.5 8.5V19.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path d="M3.5 19.5H20.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path
        d="M8 19.5V14.5C8 13.672 8.672 13 9.5 13H14.5C15.328 13 16 13.672 16 14.5V19.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M9 7V5.5C9 4.672 9.672 4 10.5 4H13.5C14.328 4 15 4.672 15 5.5V7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function getRole() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("role");
}

export default function AdminCustomersPage() {
  const [items, setItems] = useState([]);
  const [partners, setPartners] = useState([]);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: "", partnerId: "" });
  const [busy, setBusy] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", partnerId: "" });

  async function load() {
    const [customersRes, partnersRes] = await Promise.all([
        fetch(apiUrl("/customers"), { headers: authHeaders() }),
        fetch(apiUrl("/partners"), { headers: authHeaders() })
    ]);

    const customersBody = await customersRes.json().catch(() => ({}));
    const partnersBody = await partnersRes.json().catch(() => ({}));

    if (!customersRes.ok) throw new Error(customersBody?.message || "Failed to load customers");
    if (!partnersRes.ok) throw new Error(partnersBody?.message || "Failed to load partners");

    const customers = Array.isArray(customersBody.items) ? customersBody.items : [];
    const partnersList = Array.isArray(partnersBody.items) ? partnersBody.items : [];
    setItems(customers);
    setPartners(partnersList);
    setForm((s) => ({ ...s, partnerId: s.partnerId || partnersList[0]?._id || "" }));
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
    try {
      setError(null);
      const res = await fetch(apiUrl("/customers"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({ name: form.name, partnerId: form.partnerId || null })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || "Failed to create customer");
      setForm((s) => ({ ...s, name: "" }));
      await load();
    } catch (e) {
      setError(e.message || "Failed to create customer");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id, status) {
    setBusy(true);
    try {
      setError(null);
      const res = await fetch(apiUrl(`/customers/${id}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({ status })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || "Failed to update customer");
      await load();
    } catch (e) {
      setError(e.message || "Failed to update customer");
    } finally {
      setBusy(false);
    }
  }

  function beginEdit(c) {
    const partnerId = c.partnerId?._id || c.partnerId || "";
    setEditingId(c._id);
    setEditForm({ name: c.name || "", partnerId: String(partnerId || "") });
  }

  async function saveEdit(id) {
    setBusy(true);
    try {
      setError(null);
      const res = await fetch(apiUrl(`/customers/${id}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({
          name: editForm.name,
          partnerId: editForm.partnerId || null
        })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || "Failed to update customer");
      setEditingId(null);
      await load();
    } catch (e) {
      setError(e.message || "Failed to update customer");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    const ok = window.confirm("Delete this customer? This will mark it as deleted.");
    if (!ok) return;
    setBusy(true);
    try {
      setError(null);
      const res = await fetch(apiUrl(`/customers/${id}`), {
        method: "DELETE",
        headers: authHeaders()
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || "Failed to delete customer");
      }
      await load();
    } catch (e) {
      setError(e.message || "Failed to delete customer");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Customers</h1>
          <IconBadge>
            <CustomersIcon />
          </IconBadge>
        </div>
        <div className="text-sm text-slate-600">Superadmin</div>
      </div>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <section className="mt-6 border rounded-lg bg-white p-4 border-slate-200">
        <div className="font-medium">Create customer</div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <input
            className="border rounded-lg px-3 py-2 col-span-2 border-slate-200"
            placeholder="Customer name"
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
          />
          <select
            className="border rounded-lg px-3 py-2 bg-white border-slate-200"
            value={form.partnerId}
            onChange={(e) => setForm((s) => ({ ...s, partnerId: e.target.value }))}
          >
            {partners.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
          <button className="px-4 py-2 border rounded-lg bg-white hover:bg-slate-50 border-slate-200 disabled:opacity-50" onClick={create} disabled={busy || !form.name.trim()}>
            Create
          </button>
        </div>
      </section>

      <section className="mt-6 border rounded-lg overflow-hidden bg-white border-slate-200">
        <div className="grid grid-cols-12 gap-2 p-3 border-b font-medium border-slate-200 bg-slate-50">
          <div className="col-span-5">Name</div>
          <div className="col-span-4">Partner</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-2">Actions</div>
        </div>
        {items.map((c) => {
          const partnerId = c.partnerId?._id || c.partnerId || "";
          const partnerName = c.partnerId?.name || partners.find((p) => p._id === String(partnerId))?.name || "—";

          return (
            <div key={c._id} className="p-3 border-b border-slate-200">
              <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">{c.name}</div>
                <div className="col-span-4">{partnerName}</div>
                <div className="col-span-1">{c.status}</div>
                <div className="col-span-2 flex flex-wrap gap-2 justify-end">
                  <button className="px-3 py-1 border rounded-lg bg-white hover:bg-slate-50 border-slate-200 disabled:opacity-50" onClick={() => setStatus(c._id, "active")} disabled={busy}>
                    A
                  </button>
                  <button className="px-3 py-1 border rounded-lg bg-white hover:bg-slate-50 border-slate-200 disabled:opacity-50" onClick={() => setStatus(c._id, "inactive")} disabled={busy}>
                    I
                  </button>
                  <button className="px-3 py-1 border rounded-lg bg-white hover:bg-slate-50 border-slate-200 disabled:opacity-50" onClick={() => beginEdit(c)} disabled={busy}>
                    E
                  </button>
                  <button className="px-3 py-1 border rounded-lg bg-white hover:bg-slate-50 border-slate-200 disabled:opacity-50" onClick={() => remove(c._id)} disabled={busy}>
                    D
                  </button>
                </div>
              </div>

              {editingId === c._id ? (
                <div className="mt-3 border rounded-lg bg-white p-3 border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      className="border rounded-lg px-3 py-2 text-sm border-slate-200"
                      placeholder="Customer name"
                      value={editForm.name}
                      onChange={(e) => setEditForm((s) => ({ ...s, name: e.target.value }))}
                    />
                    <select
                      className="border rounded-lg px-3 py-2 text-sm bg-white border-slate-200"
                      value={editForm.partnerId}
                      onChange={(e) => setEditForm((s) => ({ ...s, partnerId: e.target.value }))}
                    >
                      <option value="">(no partner)</option>
                      {partners.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2 justify-end">
                      <button className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm disabled:opacity-50" onClick={() => saveEdit(c._id)} disabled={busy || !editForm.name.trim()}>
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
          );
        })}
      </section>
    </div>
  );
}
