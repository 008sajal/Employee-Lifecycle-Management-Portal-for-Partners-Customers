"use client";

import { useEffect, useState } from "react";
import { apiUrl, authHeaders } from "../../../../lib/api";

function IconBadge({ children }) {
  return <div className="h-9 w-9 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">{children}</div>;
}

function AuditIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-700">
      <path
        d="M7 3H17C18.105 3 19 3.895 19 5V21L16.5 19.5L14 21L11.5 19.5L9 21L6.5 19.5L5 21V5C5 3.895 5.895 3 7 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M8 8H16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8 12H16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8 16H13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function getRole() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("role");
}

function fmt(d) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleString();
}

export default function AdminAuditLogsPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);

  async function load() {
    const res = await fetch(apiUrl("/audit-logs?limit=100"), { headers: authHeaders() });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body?.message || "Failed to load audit logs");
    setItems(body.items || []);
  }

  useEffect(() => {
    if (getRole() !== "superadmin") {
      setError("Forbidden");
      return;
    }
    load().catch((e) => setError(e.message || "Failed to load"));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Audit logs</h1>
          <IconBadge>
            <AuditIcon />
          </IconBadge>
        </div>
        <div className="text-sm text-slate-600">Latest 100</div>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <section className="mt-6 border rounded-lg overflow-hidden bg-white border-slate-200">
        <div className="grid grid-cols-12 gap-2 p-3 border-b font-medium border-slate-200 bg-slate-50">
          <div className="col-span-2">When</div>
          <div className="col-span-2">Actor</div>
          <div className="col-span-3">Action</div>
          <div className="col-span-3">Entity</div>
          <div className="col-span-2">Entity ID</div>
        </div>

        {items.map((a) => (
          <div key={a._id} className="grid grid-cols-12 gap-2 p-3 border-b border-slate-200 text-sm">
            <div className="col-span-2 text-xs text-slate-600">{fmt(a.createdAt)}</div>
            <div className="col-span-2">{a.actorRole || "—"}</div>
            <div className="col-span-3 truncate">{a.action}</div>
            <div className="col-span-3 truncate">{a.entityType}</div>
            <div className="col-span-2 truncate text-slate-600">{a.entityId || "—"}</div>
          </div>
        ))}

        {!items.length && !error ? <div className="p-4 text-sm text-slate-600">No audit events yet.</div> : null}
      </section>
    </div>
  );
}
