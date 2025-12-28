"use client";

import { useEffect, useState } from "react";
import { apiUrl, authHeaders } from "../../../../lib/api";

function IconBadge({ children }) {
  return <div className="h-9 w-9 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">{children}</div>;
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-700">
      <path
        d="M12 15.5C13.933 15.5 15.5 13.933 15.5 12C15.5 10.067 13.933 8.5 12 8.5C10.067 8.5 8.5 10.067 8.5 12C8.5 13.933 10.067 15.5 12 15.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M19.4 15.1L20.3 13.5C20.7 12.8 20.7 11.9 20.3 11.2L19.4 9.6C19.2 9.2 18.8 8.9 18.4 8.9L16.7 8.6C16.4 8.2 16.1 7.9 15.8 7.6L16.1 5.9C16.2 5.4 16 4.9 15.6 4.6L14 3.7C13.3 3.3 12.4 3.3 11.7 3.7L10.1 4.6C9.7 4.9 9.5 5.4 9.6 5.9L9.9 7.6C9.6 7.9 9.3 8.2 9 8.6L7.3 8.9C6.8 8.9 6.4 9.2 6.2 9.6L5.3 11.2C4.9 11.9 4.9 12.8 5.3 13.5L6.2 15.1C6.4 15.5 6.8 15.8 7.3 15.8L9 16.1C9.3 16.4 9.6 16.7 9.9 17L9.6 18.7C9.5 19.2 9.7 19.7 10.1 20L11.7 20.9C12.4 21.3 13.3 21.3 14 20.9L15.6 20C16 19.7 16.2 19.2 16.1 18.7L15.8 17C16.1 16.7 16.4 16.4 16.7 16.1L18.4 15.8C18.8 15.8 19.2 15.5 19.4 15.1Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getRole() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("role");
}

export default function AdminSettingsPage() {
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [item, setItem] = useState(null);

  const [form, setForm] = useState({
    companyName: "",
    supportEmail: "",
    defaultPartnerCommissionRate: 0.05,
    maintenanceMode: false
  });

  async function load() {
    const res = await fetch(apiUrl("/settings"), { headers: authHeaders() });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body?.message || "Failed to load settings");
    const doc = body.item || null;
    setItem(doc);
    setForm({
      companyName: doc?.companyName || "",
      supportEmail: doc?.supportEmail || "",
      defaultPartnerCommissionRate: Number(doc?.defaultPartnerCommissionRate ?? 0.05),
      maintenanceMode: Boolean(doc?.maintenanceMode)
    });
  }

  useEffect(() => {
    if (getRole() !== "superadmin") {
      setError("Forbidden");
      return;
    }
    load().catch((e) => setError(e.message || "Failed to load"));
  }, []);

  async function save() {
    setBusy(true);
    try {
      setError(null);
      const res = await fetch(apiUrl("/settings"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({
          companyName: form.companyName,
          supportEmail: form.supportEmail,
          defaultPartnerCommissionRate: Number(form.defaultPartnerCommissionRate),
          maintenanceMode: Boolean(form.maintenanceMode)
        })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || "Failed to save settings");
      setItem(body.item || null);
    } catch (e) {
      setError(e.message || "Failed to save settings");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Settings</h1>
          <IconBadge>
            <SettingsIcon />
          </IconBadge>
        </div>
        <div className="text-sm text-slate-600">Superadmin</div>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <section className="mt-6 border rounded-lg bg-white p-4 border-slate-200">
        <div className="font-medium">System settings</div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-sm">
            <div className="text-xs text-slate-600">Company name</div>
            <input
              className="mt-1 w-full border rounded-lg px-3 py-2 border-slate-200"
              value={form.companyName}
              onChange={(e) => setForm((s) => ({ ...s, companyName: e.target.value }))}
            />
          </label>

          <label className="text-sm">
            <div className="text-xs text-slate-600">Support email</div>
            <input
              className="mt-1 w-full border rounded-lg px-3 py-2 border-slate-200"
              value={form.supportEmail}
              onChange={(e) => setForm((s) => ({ ...s, supportEmail: e.target.value }))}
            />
          </label>

          <label className="text-sm">
            <div className="text-xs text-slate-600">Default partner commission rate</div>
            <input
              className="mt-1 w-full border rounded-lg px-3 py-2 border-slate-200"
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={form.defaultPartnerCommissionRate}
              onChange={(e) => setForm((s) => ({ ...s, defaultPartnerCommissionRate: e.target.value }))}
            />
          </label>

          <label className="text-sm flex items-center gap-2 mt-6">
            <input
              type="checkbox"
              checked={form.maintenanceMode}
              onChange={(e) => setForm((s) => ({ ...s, maintenanceMode: e.target.checked }))}
            />
            <span>Maintenance mode</span>
          </label>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-slate-600">{item?._id ? `Settings id: ${item._id}` : ""}</div>
          <button
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm disabled:opacity-50"
            onClick={save}
            disabled={busy || !form.companyName.trim() || !form.supportEmail.trim()}
          >
            Save
          </button>
        </div>
      </section>
    </div>
  );
}
