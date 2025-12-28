"use client";

import { useEffect, useMemo, useState } from "react";
import { apiUrl, authHeaders } from "../../../lib/api";

function IconBadge({ children }) {
  return <div className="h-9 w-9 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">{children}</div>;
}

function ReceiptIcon() {
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

function formatMoney(n) {
  const v = Number(n || 0);
  return v.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export default function CommissionsPage() {
  const role = useMemo(() => getRole(), []);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setError(null);

    const endpoint = role === "partner" ? "/commissions/me" : "/commissions";
    const res = await fetch(apiUrl(endpoint), { headers: authHeaders() });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body?.message || "Failed to load commissions");

    setItems(body.items || []);
    setTotal(body.total || 0);
  }

  async function remove(id) {
    const ok = window.confirm("Delete this commission record?");
    if (!ok) return;
    setBusy(true);
    try {
      setError(null);
      const res = await fetch(apiUrl(`/commissions/${id}`), {
        method: "DELETE",
        headers: authHeaders()
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || "Failed to delete commission");
      }
      await load();
    } catch (e) {
      setError(e.message || "Failed to delete commission");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (role !== "partner" && role !== "superadmin") {
      setError("Forbidden");
      return;
    }
    load().catch((e) => setError(e.message || "Failed to load"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Commissions</h1>
          <IconBadge>
            <ReceiptIcon />
          </IconBadge>
        </div>
        <div className="text-sm text-slate-600">Total: {formatMoney(total)}</div>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <section className="mt-6 border rounded-lg overflow-hidden bg-white border-slate-200">
        <div className="grid grid-cols-12 gap-2 p-3 border-b font-medium border-slate-200 bg-slate-50">
          <div className="col-span-3">Customer</div>
          <div className="col-span-3">Employee</div>
          <div className="col-span-3">Device</div>
          <div className="col-span-1">Kind</div>
          <div className={`text-right ${role === "superadmin" ? "col-span-2" : "col-span-3"}`}>Amount</div>
          {role === "superadmin" ? <div className="col-span-1 text-right">Actions</div> : null}
        </div>

        {items.map((c) => (
          <div key={c._id} className="grid grid-cols-12 gap-2 p-3 border-b border-slate-200">
            <div className="col-span-3 truncate">{typeof c.customerId === "object" ? c.customerId?.name : String(c.customerId)}</div>
            <div className="col-span-3 truncate">
              {typeof c.employeeId === "object"
                ? `${c.employeeId?.firstName || ""} ${c.employeeId?.lastName || ""}`.trim() || c.employeeId?.email
                : String(c.employeeId)}
            </div>
            <div className="col-span-3 truncate text-slate-700">
              {c.deviceId
                ? typeof c.deviceId === "object"
                  ? `${c.deviceId?.name || ""}${c.deviceId?.os ? ` (${String(c.deviceId.os).toUpperCase()})` : ""}`.trim() || "—"
                  : String(c.deviceId)
                : "—"}
            </div>
            <div className="col-span-1">{c.kind}</div>
            <div className={`text-right font-medium ${role === "superadmin" ? "col-span-2" : "col-span-3"}`}>{formatMoney(c.amount)}</div>
            {role === "superadmin" ? (
              <div className="col-span-1 flex justify-end">
                <button
                  className="px-3 py-1 border rounded-lg bg-white hover:bg-slate-50 border-slate-200 disabled:opacity-50"
                  onClick={() => remove(c._id)}
                  disabled={busy}
                >
                  Delete
                </button>
              </div>
            ) : null}
          </div>
        ))}

        {!items.length && !error ? <div className="p-4 text-sm text-slate-600">No commissions found.</div> : null}
      </section>

      {role === "superadmin" ? (
        <div className="mt-3 text-xs text-slate-600">This view shows all commissions. (Partner scope uses /commissions/me.)</div>
      ) : null}
    </div>
  );
}
