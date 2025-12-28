"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiUrl, authHeaders } from "../../../lib/api";

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

export default function CustomersPage() {
  const role = useMemo(() => getRole(), []);
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [countsByCustomer, setCountsByCustomer] = useState({});
  const [employeesByCustomer, setEmployeesByCustomer] = useState({});
  const [commissionByCustomer, setCommissionByCustomer] = useState({});
  const [totalCommissions, setTotalCommissions] = useState(0);
  const [overallCounts, setOverallCounts] = useState({ onboarding: 0, active: 0, offboarding: 0 });
  const [error, setError] = useState(null);

  function formatMoney(n) {
    const v = Number(n || 0);
    return v.toLocaleString(undefined, { style: "currency", currency: "USD" });
  }

  const load = useCallback(async () => {
    setError(null);

    if (role === "partner") {
      const [dashRes, empRes] = await Promise.all([
        fetch(apiUrl("/partners/me/dashboard"), { headers: authHeaders() }),
        fetch(apiUrl("/employees"), { headers: authHeaders() })
      ]);

      const dashBody = await dashRes.json().catch(() => ({}));
      const empBody = await empRes.json().catch(() => ({}));

      if (!dashRes.ok) throw new Error(dashBody?.message || "Failed to load partner dashboard");
      if (!empRes.ok) throw new Error(empBody?.message || "Failed to load employees");

      const customers = Array.isArray(dashBody.customers) ? dashBody.customers : [];
      const employeeItems = Array.isArray(empBody.items) ? empBody.items : [];
      setItems(customers);
      setEmployees(employeeItems);

      const commMap = {};
      (Array.isArray(dashBody.commissions) ? dashBody.commissions : []).forEach((x) => {
        const key = String(x?._id || "");
        if (!key) return;
        commMap[key] = Number(x.total || 0);
      });
      setCommissionByCustomer(commMap);
      setTotalCommissions(Number(dashBody.totalCommissions || 0));

      const empByCust = {};
      employeeItems.forEach((e) => {
        const cid = String(e.customerId || "");
        if (!cid) return;
        if (!empByCust[cid]) empByCust[cid] = [];
        empByCust[cid].push(e);
      });
      setEmployeesByCustomer(empByCust);

      const cbc = {};
      customers.forEach((c) => {
        const cid = String(c._id);
        const list = empByCust[cid] || [];
        const onboarding = list.filter((x) => x.status === "onboarding").length;
        const active = list.filter((x) => x.status === "active" || x.status === "leave").length;
        const offboarding = list.filter((x) => x.status === "offboarding").length;
        cbc[cid] = { onboarding, active, offboarding };
      });
      setCountsByCustomer(cbc);

      const overall = {
        onboarding: employeeItems.filter((x) => x.status === "onboarding").length,
        active: employeeItems.filter((x) => x.status === "active" || x.status === "leave").length,
        offboarding: employeeItems.filter((x) => x.status === "offboarding").length
      };
      setOverallCounts(overall);
      return;
    }

    const res = await fetch(apiUrl("/customers"), { headers: authHeaders() });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body?.message || "Failed to load customers");
    setItems(body.items || []);
  }, [role]);

  useEffect(() => {
    if (role !== "partner" && role !== "superadmin") {
      setError("Forbidden");
      return;
    }
    load().catch((e) => setError(e.message || "Failed to load"));
  }, [load, role]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Customers</h1>
          <IconBadge>
            <CustomersIcon />
          </IconBadge>
        </div>
        <div className="text-sm text-slate-600">
          {role === "partner" ? `Partner • Total commissions: ${formatMoney(totalCommissions)}` : role === "superadmin" ? "Superadmin" : ""}
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {role === "partner" ? (
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-1 border rounded-full bg-amber-50 text-amber-700 border-amber-200">Onboarding: {overallCounts.onboarding}</span>
          <span className="px-2 py-1 border rounded-full bg-green-50 text-green-700 border-green-200">Active: {overallCounts.active}</span>
          <span className="px-2 py-1 border rounded-full bg-violet-50 text-violet-700 border-violet-200">Offboarding: {overallCounts.offboarding}</span>
        </div>
      ) : null}

      <section className="mt-6 border rounded-lg overflow-hidden bg-white border-slate-200">
        <div className="grid grid-cols-12 gap-2 p-3 border-b font-medium border-slate-200 bg-slate-50">
          <div className={role === "partner" ? "col-span-4" : "col-span-6"}>Name</div>
          {role === "partner" ? (
            <>
              <div className="col-span-1 text-center">Onb</div>
              <div className="col-span-1 text-center">Act</div>
              <div className="col-span-1 text-center">Off</div>
              <div className="col-span-3 text-right">Commissions</div>
            </>
          ) : (
            <div className="col-span-4">Partner</div>
          )}
          <div className="col-span-2">Status</div>
        </div>

        {items.map((c) => {
          if (role !== "partner") {
            return (
              <div key={c._id} className="grid grid-cols-12 gap-2 p-3 border-b border-slate-200">
                <div className="col-span-6">{c.name}</div>
                <div className="col-span-4 text-slate-700 truncate">{typeof c.partnerId === "object" ? c.partnerId?.name : String(c.partnerId || "—")}</div>
                <div className="col-span-2 text-slate-700">{c.status || "active"}</div>
              </div>
            );
          }

          const cid = String(c._id);
          const counts = countsByCustomer[cid] || { onboarding: 0, active: 0, offboarding: 0 };
          const comm = Number(commissionByCustomer[cid] || 0);
          const list = employeesByCustomer[cid] || [];

          return (
            <details key={c._id} className="border-b border-slate-200">
              <summary className="grid grid-cols-12 gap-2 p-3 cursor-pointer hover:bg-slate-50">
                <div className="col-span-4 font-medium">{c.name}</div>
                <div className="col-span-1 text-center text-slate-700">{counts.onboarding}</div>
                <div className="col-span-1 text-center text-slate-700">{counts.active}</div>
                <div className="col-span-1 text-center text-slate-700">{counts.offboarding}</div>
                <div className="col-span-3 text-right font-medium">{formatMoney(comm)}</div>
                <div className="col-span-2 text-slate-700">{c.status || "active"}</div>
              </summary>
              <div className="px-3 pb-3">
                <div className="text-xs text-slate-600">Employees ({list.length})</div>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {list.map((e) => (
                    <div key={e._id} className="border rounded-lg p-2 bg-white border-slate-200">
                      <div className="text-sm font-medium truncate">{`${e.firstName || ""} ${e.lastName || ""}`.trim() || e.email}</div>
                      <div className="text-xs text-slate-600 truncate">{e.email}</div>
                      <div className="mt-1 text-xs text-slate-700">Status: {e.status}</div>
                    </div>
                  ))}
                </div>
                {!list.length ? <div className="mt-2 text-sm text-slate-600">No employees for this customer.</div> : null}
              </div>
            </details>
          );
        })}

        {!items.length && !error ? <div className="p-4 text-sm text-slate-600">No customers found.</div> : null}
      </section>

      {role === "superadmin" ? (
        <div className="mt-3 text-xs text-slate-600">Create/edit customers in Admin → Customers.</div>
      ) : null}
    </div>
  );
}
