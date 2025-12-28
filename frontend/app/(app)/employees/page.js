"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiUrl, authHeaders } from "../../../lib/api";

function IconBadge({ children }) {
  return <div className="h-9 w-9 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">{children}</div>;
}

function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-700">
      <path
        d="M16 18.5C16 16.567 14.433 15 12.5 15H8.5C6.567 15 5 16.567 5 18.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M10.5 12.5C12.1569 12.5 13.5 11.1569 13.5 9.5C13.5 7.84315 12.1569 6.5 10.5 6.5C8.84315 6.5 7.5 7.84315 7.5 9.5C7.5 11.1569 8.84315 12.5 10.5 12.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M19 18.5C19 17.018 18.143 15.737 16.9 15.13"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M15.9 6.8C16.729 7.304 17.3 8.215 17.3 9.26C17.3 10.305 16.729 11.216 15.9 11.72"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function statusTone(status) {
  if (status === "active") return "success";
  if (status === "onboarding") return "warn";
  if (status === "offboarding") return "purple";
  if (status === "leave") return "info";
  if (status === "archived") return "neutral";
  return "neutral";
}

function Pill({ children, tone = "neutral" }) {
  const cls =
    tone === "success"
      ? "bg-green-50 text-green-700 border-green-200"
      : tone === "warn"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : tone === "info"
          ? "bg-blue-50 text-blue-700 border-blue-200"
          : tone === "purple"
            ? "bg-violet-50 text-violet-700 border-violet-200"
            : "bg-slate-50 text-slate-700 border-slate-200";
  return <span className={`inline-flex items-center px-2 py-1 border rounded-full text-xs ${cls}`}>{children}</span>;
}

function ChevronDownIcon({ className = "" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckCircleIcon({ className = "" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M9.5 12.5l1.7 1.7 3.8-4.2"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function getInitials(firstName, lastName, fallback) {
  const a = (firstName || "").trim();
  const b = (lastName || "").trim();
  const i1 = a ? a[0] : "";
  const i2 = b ? b[0] : "";
  const out = `${i1}${i2}`.toUpperCase();
  if (out) return out;
  const f = (fallback || "").trim();
  return f ? f[0].toUpperCase() : "?";
}

function buildTimeline(employee) {
  if (!employee) return [];
  const items = [];

  if (employee.status === "onboarding") {
    const step = Number(employee.onboardingStep || 1);
    const fullName = `${employee.firstName || ""} ${employee.lastName || ""}`.trim() || "Employee";

    items.push({
      title: "Onboarding started",
      subtitle: `${fullName} is on platform`,
      done: true,
      icon: "doc"
    });
    items.push({
      title: "Device procurement",
      subtitle: "You have requested to procure hardware through Belzir. We will provide the checkout link via email.",
      done: step >= 2,
      icon: "box"
    });
    items.push({
      title: "Work Email",
      subtitle: "A workspace account will be created, and credentials will be sent to the employee.",
      done: step >= 2,
      icon: "mail"
    });
    items.push({
      title: "Accounts",
      subtitle: "Application accounts will be created, and access information will be sent to the employee.",
      done: step >= 2,
      icon: "user"
    });
    items.push({
      title: "Device Setup",
      subtitle: "The employee will receive instructions to register their device on the Belzir platform.",
      done: step >= 2,
      icon: "device"
    });
    items.push({
      title: "First Day",
      subtitle: "Employee can start on the planned start date.",
      done: step >= 3,
      icon: "party"
    });
    return items;
  }

  if (employee.status === "offboarding") {
    const step = Number(employee.offboardingStep || 1);
    items.push({ title: "Offboarding started", subtitle: "Access disabled and process initiated", done: true });
    items.push({ title: "Device return", subtitle: "Receive device and update inventory", done: step >= 2 });
    items.push({ title: "Completion", subtitle: "Finalize and archive", done: step >= 3 });
    return items;
  }

  if (employee.status === "active") {
    items.push({ title: "Active", subtitle: "Employee is active", done: true });
    return items;
  }

  return items;
}

function Timeline({ employee }) {
  const items = buildTimeline(employee);
  if (!items.length) return null;

  function iconFor(key, done) {
    const cls = done ? "text-slate-700" : "text-slate-500";
    if (key === "mail") {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cls}>
          <path d="M4 7.5l8 5.5 8-5.5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M5 6h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    }
    if (key === "box") {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cls}>
          <path d="M21 8.5l-9 5-9-5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M12 13.5v8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M20 7.5l-8-4-8 4v9.5l8 4 8-4V7.5Z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    }
    if (key === "device") {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cls}>
          <path d="M7 4h10a2 2 0 0 1 2 2v10H5V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M4 18h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    }
    if (key === "user") {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cls}>
          <path d="M20 21a8 8 0 1 0-16 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    }
    if (key === "party") {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cls}>
          <path d="M4 20l8-4 8 4" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M12 16V4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M9 6l3-2 3 2" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </svg>
      );
    }
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cls}>
        <path d="M7 3h10v18H7z" stroke="currentColor" strokeWidth="1.7" />
        <path d="M9 7h6M9 11h6M9 15h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <div className="border rounded-xl bg-white p-4 border-slate-200">
      <div className="font-medium">Timeline</div>
      <div className="mt-3 space-y-4">
        {items.map((it) => (
          <div key={it.title} className="flex items-start gap-3">
            <div className="mt-0.5 h-8 w-8 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">
              {iconFor(it.icon, it.done)}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-900">{it.title}</div>
              <div className="text-xs text-slate-600 line-clamp-2">{it.subtitle}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmployeesPageInner() {
  const searchParams = useSearchParams();
  const start = searchParams.get("start");

  const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;
  const [employees, setEmployees] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [partnerCustomers, setPartnerCustomers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [openSection, setOpenSection] = useState(null); // 'info' | 'device' | null
  const [createMode, setCreateMode] = useState(false);

  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    location: "",
    jobTitle: "",
    department: "",
    startDate: "",
    status: ""
  });

  const [createForm, setCreateForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    location: "",
    customerId: ""
  });

  const [step2Form, setStep2Form] = useState({
    deviceAcquisitionOption: 1,
    deviceId: "",
    deviceApproved: false,
    setupApproved: false,
    viaPartner: false
  });

  const selected = useMemo(
    () => employees.find((e) => e._id === selectedId) || null,
    [employees, selectedId]
  );

  useEffect(() => {
    if (!selected) return;
    setEditForm({
      firstName: selected.firstName || "",
      lastName: selected.lastName || "",
      email: selected.email || "",
      location: selected.location || "",
      jobTitle: selected.jobTitle || "",
      department: selected.department || "",
      startDate: selected.startDate ? String(selected.startDate).slice(0, 10) : "",
      status: selected.status || ""
    });
  }, [selected]);

  async function refreshEmployees() {
    const res = await fetch(apiUrl("/employees"), { headers: authHeaders() });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.message || "Failed to load employees");
    }
    const body = await res.json();
    setEmployees(body.items);
    setSelectedId((prev) => prev || body.items[0]?._id || null);
  }

  async function refreshDevices() {
    const res = await fetch(apiUrl("/devices"), { headers: authHeaders() });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.message || "Failed to load devices");
    }
    const body = await res.json();
    setDevices(body.items);
  }

  async function refreshPartnerCustomers() {
    if (role !== "partner") return;
    const res = await fetch(apiUrl("/partners/me/customers"), { headers: authHeaders() });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.message || "Failed to load partner customers");
    }
    const body = await res.json();
    setPartnerCustomers(body.items);
    setCreateForm((s) => ({ ...s, customerId: s.customerId || body.items[0]?._id || "" }));
  }

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        await Promise.all([refreshEmployees(), refreshDevices(), refreshPartnerCustomers()]);
      } catch (e) {
        setError(e.message || "Failed to load");
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createEmployee() {
    setBusy(true);
    try {
      setError(null);
      const payload = {
        firstName: createForm.firstName,
        lastName: createForm.lastName,
        email: createForm.email,
        location: createForm.location
      };

      if (role === "partner") {
        payload.customerId = createForm.customerId;
      }

      const res = await fetch(apiUrl("/employees"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify(payload)
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || "Failed to create employee");
      await refreshEmployees();
      setCreateForm((s) => ({ ...s, firstName: "", lastName: "", email: "", location: "" }));
    } finally {
      setBusy(false);
    }
  }

  async function submitOnboardingStep2() {
    if (!selected) return;
    setBusy(true);
    try {
      setError(null);
      const payload = {
        deviceAcquisitionOption: Number(step2Form.deviceAcquisitionOption),
        deviceId: step2Form.deviceId ? step2Form.deviceId : null,
        deviceApproved: !!step2Form.deviceApproved,
        setupApproved: !!step2Form.setupApproved,
        viaPartner: !!step2Form.viaPartner
      };

      const res = await fetch(
        apiUrl(`/employees/${selected._id}/onboarding/step2`),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders()
          },
          body: JSON.stringify(payload)
        }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || "Failed to submit step 2");
      await Promise.all([refreshEmployees(), refreshDevices()]);
    } finally {
      setBusy(false);
    }
  }

  async function completeOnboardingStep3() {
    if (!selected) return;
    setBusy(true);
    try {
      setError(null);
      const res = await fetch(
        apiUrl(`/employees/${selected._id}/onboarding/step3/complete`),
        {
          method: "PATCH",
          headers: authHeaders()
        }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || "Failed to complete step 3");
      await refreshEmployees();
    } finally {
      setBusy(false);
    }
  }

  async function startOffboarding() {
    if (!selected) return;
    setBusy(true);
    try {
      setError(null);
      const res = await fetch(
        apiUrl(`/employees/${selected._id}/offboarding/start`),
        {
          method: "POST",
          headers: authHeaders()
        }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || "Failed to start offboarding");
      await refreshEmployees();
    } finally {
      setBusy(false);
    }
  }

  async function receiveDevice() {
    if (!selected) return;
    setBusy(true);
    try {
      setError(null);
      const res = await fetch(
        apiUrl(`/employees/${selected._id}/offboarding/step2/receive-device`),
        {
          method: "PATCH",
          headers: authHeaders()
        }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || "Failed to receive device");
      await Promise.all([refreshEmployees(), refreshDevices()]);
    } finally {
      setBusy(false);
    }
  }

  async function completeOffboarding() {
    if (!selected) return;
    setBusy(true);
    try {
      setError(null);
      const res = await fetch(
        apiUrl(`/employees/${selected._id}/offboarding/step3/complete`),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders()
          },
          body: JSON.stringify({ archive: true })
        }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || "Failed to complete offboarding");
      await refreshEmployees();
    } finally {
      setBusy(false);
    }
  }

  async function saveEmployeeProfile() {
    if (!selected) return;
    setBusy(true);
    try {
      setError(null);
      const payload = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        location: editForm.location,
        jobTitle: editForm.jobTitle ? editForm.jobTitle : null,
        department: editForm.department ? editForm.department : null,
        startDate: editForm.startDate ? new Date(editForm.startDate).toISOString() : null
      };

      // Only allow status edits when rules allow it (server enforces too)
      if (editForm.status && editForm.status !== selected.status) {
        payload.status = editForm.status;
      }

      const res = await fetch(apiUrl(`/employees/${selected._id}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify(payload)
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || "Failed to update employee");
      await refreshEmployees();
    } finally {
      setBusy(false);
    }
  }

  const selectedTitleLine = useMemo(() => {
    if (!selected) return "";
    const jobTitle = (selected.jobTitle || "").trim();
    const department = (selected.department || "").trim();
    if (jobTitle && department) return `${jobTitle} | ${department}`;
    if (jobTitle) return jobTitle;
    if (selected.location) return selected.location;
    return selected.email || "";
  }, [selected]);

  const onboardingInfoDone = !!selected && selected.status === "onboarding";
  const onboardingDeviceDone = !!selected && selected.status === "onboarding" && Number(selected.onboardingStep || 1) >= 2;
  const showBottomSubmitBar =
    !!selected &&
    selected.status === "onboarding" &&
    role === "customer" &&
    Number(selected.onboardingStep || 1) === 1;

  return (
    <div>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {start === "onboarding" && (role === "customer" || role === "partner") ? (
        <section className="mt-6 border rounded-lg bg-white p-4 border-slate-200">
          <div className="font-medium">Start onboarding</div>
          <div className="mt-1 text-sm text-slate-600">Step 1 of 3 — Employee information</div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {role === "partner" ? (
              <select
                className="border rounded-lg px-3 py-2 col-span-2 border-slate-200"
                value={createForm.customerId}
                onChange={(e) => setCreateForm((s) => ({ ...s, customerId: e.target.value }))}
              >
                {partnerCustomers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : null}
            <input
              className="border rounded-lg px-3 py-2 border-slate-200"
              placeholder="First name"
              value={createForm.firstName}
              onChange={(e) => setCreateForm((s) => ({ ...s, firstName: e.target.value }))}
            />
            <input
              className="border rounded-lg px-3 py-2 border-slate-200"
              placeholder="Last name"
              value={createForm.lastName}
              onChange={(e) => setCreateForm((s) => ({ ...s, lastName: e.target.value }))}
            />
            <input
              className="border rounded-lg px-3 py-2 col-span-2 border-slate-200"
              placeholder="Email"
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm((s) => ({ ...s, email: e.target.value }))}
            />
            <input
              className="border rounded-lg px-3 py-2 col-span-2 border-slate-200"
              placeholder="Location"
              value={createForm.location}
              onChange={(e) => setCreateForm((s) => ({ ...s, location: e.target.value }))}
            />
          </div>
          <button
            className="mt-4 px-4 py-2 border rounded-lg bg-white hover:bg-slate-50 border-slate-200 disabled:opacity-50"
            onClick={createEmployee}
            disabled={busy}
          >
            Create employee
          </button>
        </section>
      ) : null}

      <div className="mt-6 border rounded-2xl bg-white border-slate-200 overflow-hidden">
        <div className="grid grid-cols-12">
          <aside className="col-span-12 lg:col-span-5 border-b lg:border-b-0 lg:border-r border-slate-200">
            <div className="px-6 pt-6 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold">Employees</h1>
                <IconBadge>
                  <UsersIcon />
                </IconBadge>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-slate-600 hidden sm:block">
                  {role === "customer" ? "Customer" : role === "partner" ? "Partner" : role === "superadmin" ? "Belzir" : ""}
                </div>
                {(role === "customer" || role === "partner") ? (
                  <button
                    className="px-3 py-2 border rounded-lg bg-white hover:bg-slate-50 border-slate-200 text-sm"
                    onClick={() => {
                      setCreateMode((v) => !v);
                      setOpenSection("info");
                    }}
                  >
                    {createMode ? "Close" : "New"}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="px-6 pb-3">
              <div className="grid grid-cols-12 text-xs text-slate-500 uppercase tracking-wide">
                <div className="col-span-9">Name</div>
                <div className="col-span-3 text-right">Status</div>
              </div>
            </div>

            <ul className="divide-y max-h-[68vh] overflow-auto">
              {employees.map((e) => {
                const initials = getInitials(e.firstName, e.lastName, e.email);
                const isSelected = selectedId === e._id;
                return (
                  <li key={e._id}>
                    <button
                      className={`w-full text-left px-6 py-4 hover:bg-slate-50 ${isSelected ? "bg-slate-50" : ""}`}
                      onClick={() => setSelectedId(e._id)}
                    >
                      <div className="grid grid-cols-12 items-center gap-3">
                        <div className="col-span-9 flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300"
                            checked={isSelected}
                            onChange={() => setSelectedId(e._id)}
                            aria-label="Select employee"
                          />
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-fuchsia-200 to-indigo-200 flex items-center justify-center text-sm font-semibold text-slate-700">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">
                              {e.firstName} {e.lastName}
                            </div>
                            <div className="text-xs text-slate-500 truncate">{e.email}</div>
                          </div>
                        </div>
                        <div className="col-span-3 flex justify-end">
                          <Pill tone={statusTone(e.status)}>{(e.status || "").charAt(0).toUpperCase() + (e.status || "").slice(1)}</Pill>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <section className="col-span-12 lg:col-span-7">
            <div className="px-6 pt-6 pb-4">
              {createMode && (role === "customer" || role === "partner") ? (
                <div className="text-center">
                  <div className="text-xl font-semibold text-slate-900">New employee</div>
                  <div className="mt-1 text-xs text-slate-500">Start onboarding (Step 1)</div>
                </div>
              ) : !selected ? (
                <p className="text-slate-700">Select an employee.</p>
              ) : (
                <div className="text-center">
                  <div className="text-xl font-semibold text-slate-900">
                    {selected.firstName} {selected.lastName}
                  </div>
                  {selectedTitleLine ? <div className="mt-1 text-xs text-slate-500">{selectedTitleLine}</div> : null}
                  <div className="mt-2">
                    <Pill tone={statusTone(selected.status)}>
                      {(selected.status || "").charAt(0).toUpperCase() + (selected.status || "").slice(1)}
                    </Pill>
                  </div>
                </div>
              )}
            </div>

            {createMode && (role === "customer" || role === "partner") ? (
              <div className="px-6 pb-6 space-y-4">
                <div className="border rounded-xl p-4 border-slate-200 bg-white">
                  <div className="font-medium">Employee Information</div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {role === "partner" ? (
                      <select
                        className="border rounded-lg px-3 py-2 col-span-2 border-slate-200"
                        value={createForm.customerId}
                        onChange={(e) => setCreateForm((s) => ({ ...s, customerId: e.target.value }))}
                      >
                        {partnerCustomers.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    ) : null}
                    <input
                      className="border rounded-lg px-3 py-2 border-slate-200"
                      placeholder="First name"
                      value={createForm.firstName}
                      onChange={(e) => setCreateForm((s) => ({ ...s, firstName: e.target.value }))}
                    />
                    <input
                      className="border rounded-lg px-3 py-2 border-slate-200"
                      placeholder="Last name"
                      value={createForm.lastName}
                      onChange={(e) => setCreateForm((s) => ({ ...s, lastName: e.target.value }))}
                    />
                    <input
                      className="border rounded-lg px-3 py-2 col-span-2 border-slate-200"
                      placeholder="Email"
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm((s) => ({ ...s, email: e.target.value }))}
                    />
                    <input
                      className="border rounded-lg px-3 py-2 col-span-2 border-slate-200"
                      placeholder="Location"
                      value={createForm.location}
                      onChange={(e) => setCreateForm((s) => ({ ...s, location: e.target.value }))}
                    />
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm disabled:opacity-50"
                      onClick={async () => {
                        await createEmployee();
                        setCreateMode(false);
                      }}
                      disabled={busy}
                    >
                      Create
                    </button>
                  </div>
                </div>
              </div>
            ) : selected ? (
              <div className="px-6 pb-6 space-y-4">
                <button
                  type="button"
                  className="w-full border rounded-xl px-4 py-3 border-slate-200 bg-white flex items-center justify-between hover:bg-slate-50"
                  onClick={() => setOpenSection((s) => (s === "info" ? null : "info"))}
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span>Employee Information</span>
                    {onboardingInfoDone ? <CheckCircleIcon className="text-green-600" /> : null}
                  </div>
                  <ChevronDownIcon className={`text-slate-500 ${openSection === "info" ? "rotate-180" : ""}`} />
                </button>

                {openSection === "info" ? (
                  <div className="border rounded-xl p-4 border-slate-200 bg-white">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-500">First name</label>
                        <input
                          className="mt-1 w-full border rounded-lg px-3 py-2 border-slate-200"
                          value={editForm.firstName}
                          onChange={(e) => setEditForm((s) => ({ ...s, firstName: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500">Last name</label>
                        <input
                          className="mt-1 w-full border rounded-lg px-3 py-2 border-slate-200"
                          value={editForm.lastName}
                          onChange={(e) => setEditForm((s) => ({ ...s, lastName: e.target.value }))}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs text-slate-500">Email</label>
                        <input
                          className="mt-1 w-full border rounded-lg px-3 py-2 border-slate-200"
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm((s) => ({ ...s, email: e.target.value }))}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs text-slate-500">Location</label>
                        <input
                          className="mt-1 w-full border rounded-lg px-3 py-2 border-slate-200"
                          value={editForm.location}
                          onChange={(e) => setEditForm((s) => ({ ...s, location: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500">Job title</label>
                        <input
                          className="mt-1 w-full border rounded-lg px-3 py-2 border-slate-200"
                          value={editForm.jobTitle}
                          onChange={(e) => setEditForm((s) => ({ ...s, jobTitle: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500">Department</label>
                        <input
                          className="mt-1 w-full border rounded-lg px-3 py-2 border-slate-200"
                          value={editForm.department}
                          onChange={(e) => setEditForm((s) => ({ ...s, department: e.target.value }))}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs text-slate-500">Start date</label>
                        <input
                          className="mt-1 w-full border rounded-lg px-3 py-2 border-slate-200"
                          type="date"
                          value={editForm.startDate}
                          onChange={(e) => setEditForm((s) => ({ ...s, startDate: e.target.value }))}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs text-slate-500">Status</label>
                        <select
                          className="mt-1 w-full border rounded-lg px-3 py-2 border-slate-200"
                          value={editForm.status}
                          onChange={(e) => setEditForm((s) => ({ ...s, status: e.target.value }))}
                          disabled={
                            role !== "superadmin" &&
                            !(selected.status === "active" || selected.status === "leave")
                          }
                        >
                          {role === "superadmin" ? (
                            <>
                              <option value="onboarding">onboarding</option>
                              <option value="active">active</option>
                              <option value="offboarding">offboarding</option>
                              <option value="leave">leave</option>
                              <option value="archived">archived</option>
                            </>
                          ) : (
                            <>
                              <option value={selected.status}>{selected.status}</option>
                              {(selected.status === "active" || selected.status === "leave") ? (
                                <>
                                  <option value="active">active</option>
                                  <option value="leave">leave</option>
                                </>
                              ) : null}
                            </>
                          )}
                        </select>
                        {role !== "superadmin" && !(selected.status === "active" || selected.status === "leave") ? (
                          <div className="mt-1 text-xs text-slate-500">Use onboarding/offboarding actions to change this status.</div>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        {(selected.status === "active" && (role === "customer" || role === "partner" || role === "superadmin")) ? (
                          <button
                            className="px-4 py-2 border rounded-lg bg-white hover:bg-slate-50 border-slate-200 disabled:opacity-50"
                            onClick={startOffboarding}
                            disabled={busy}
                          >
                            Start offboarding
                          </button>
                        ) : null}
                      </div>
                      <button
                        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm disabled:opacity-50"
                        onClick={saveEmployeeProfile}
                        disabled={busy}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : null}

                <button
                  type="button"
                  className="w-full border rounded-xl px-4 py-3 border-slate-200 bg-white flex items-center justify-between hover:bg-slate-50"
                  onClick={() => setOpenSection((s) => (s === "device" ? null : "device"))}
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span>Device Assignment</span>
                    {onboardingDeviceDone ? <CheckCircleIcon className="text-green-600" /> : null}
                  </div>
                  <ChevronDownIcon className={`text-slate-500 ${openSection === "device" ? "rotate-180" : ""}`} />
                </button>

                {openSection === "device" ? (
                  <div className="border rounded-xl p-4 border-slate-200 bg-white">
                    {(() => {
                      const d = selected.deviceId ? devices.find((x) => String(x._id) === String(selected.deviceId)) : null;
                      if (!selected.deviceId) return <div className="text-sm text-slate-600">No device assigned.</div>;
                      return (
                        <div className="text-sm text-slate-700">
                          Assigned device: <span className="font-medium">{d ? `${d.name} (${d.os})` : String(selected.deviceId)}</span>
                        </div>
                      );
                    })()}

                    {role === "customer" && selected.status === "onboarding" && selected.onboardingStep === 1 ? (
                      <div className="mt-4">
                        <div className="font-medium">Onboarding step 2</div>
                        <div className="mt-3 space-y-3">
                          <div>
                            <label className="block text-sm">Device acquisition option</label>
                            <select
                              className="mt-1 w-full border rounded-lg px-3 py-2 border-slate-200"
                              value={step2Form.deviceAcquisitionOption}
                              onChange={(e) => setStep2Form((s) => ({ ...s, deviceAcquisitionOption: Number(e.target.value) }))}
                            >
                              <option value={1}>Select device from own inventory</option>
                              <option value={2}>Buy device (Belzir catalog)</option>
                              <option value={3}>Lease device (Belzir or third-party)</option>
                              <option value={4}>Buy/lease independently</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm">Assign device (optional)</label>
                            <select
                              className="mt-1 w-full border rounded-lg px-3 py-2 border-slate-200"
                              value={step2Form.deviceId}
                              onChange={(e) => setStep2Form((s) => ({ ...s, deviceId: e.target.value }))}
                            >
                              <option value="">No device</option>
                              {devices
                                .filter((d) => d.status === "available")
                                .map((d) => (
                                  <option key={d._id} value={d._id}>
                                    {d.name} ({d.ownerType}, {d.os})
                                  </option>
                                ))}
                            </select>
                          </div>

                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={step2Form.deviceApproved}
                              onChange={(e) => setStep2Form((s) => ({ ...s, deviceApproved: e.target.checked }))}
                            />
                            Approve device assignment
                          </label>

                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={step2Form.setupApproved}
                              onChange={(e) => setStep2Form((s) => ({ ...s, setupApproved: e.target.checked }))}
                            />
                            Approve setup configuration
                          </label>

                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={step2Form.viaPartner}
                              onChange={(e) => setStep2Form((s) => ({ ...s, viaPartner: e.target.checked }))}
                            />
                            Purchased/leased via partner (creates commission)
                          </label>

                          <div className="flex items-center justify-end">
                            <button
                              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm disabled:opacity-50"
                              onClick={submitOnboardingStep2}
                              disabled={busy}
                            >
                              Submit
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <Timeline employee={selected} />

                {selected.status === "onboarding" && selected.onboardingStep === 2 ? (
                  <div className="border rounded-xl p-4 border-slate-200 bg-white">
                    <div className="font-medium">Step 3 — Execution by Belzir</div>
                    <p className="mt-1 text-sm text-slate-700">Belzir prepares device configuration, setup completion, and validation.</p>
                    {role === "superadmin" ? (
                      <button
                        className="mt-3 px-4 py-2 border rounded-lg bg-white hover:bg-slate-50 border-slate-200 disabled:opacity-50"
                        onClick={completeOnboardingStep3}
                        disabled={busy}
                      >
                        Mark step 3 complete
                      </button>
                    ) : (
                      <p className="mt-3 text-sm text-slate-600">Waiting for Belzir completion.</p>
                    )}
                  </div>
                ) : null}

                {selected.status === "offboarding" ? (
                  <div className="space-y-3">
                    {selected.offboardingStep === 1 ? (
                      <div className="border rounded-xl p-4 border-slate-200 bg-white">
                        <div className="font-medium">Step 2 — Device return</div>
                        <p className="mt-1 text-sm text-slate-700">Device must be received and inventory updated before completion.</p>
                        <button
                          className="mt-3 px-4 py-2 border rounded-lg bg-white hover:bg-slate-50 border-slate-200 disabled:opacity-50"
                          onClick={receiveDevice}
                          disabled={busy}
                        >
                          Mark device received
                        </button>
                      </div>
                    ) : null}

                    {selected.offboardingStep === 2 ? (
                      <div className="border rounded-xl p-4 border-slate-200 bg-white">
                        <div className="font-medium">Step 3 — Completion</div>
                        <button
                          className="mt-3 px-4 py-2 border rounded-lg bg-white hover:bg-slate-50 border-slate-200 disabled:opacity-50"
                          onClick={completeOffboarding}
                          disabled={busy}
                        >
                          Complete offboarding (archive)
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {selected && showBottomSubmitBar ? (
              <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex items-center justify-between">
                <div className="text-xs text-slate-600">Step 3 of 3</div>
                <div className="flex items-center gap-4">
                  <div className="text-xs text-slate-600">
                    <span className="text-slate-500">Next step:</span> We will start preparing your order for shipment
                  </div>
                  <button
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm disabled:opacity-50"
                    onClick={submitOnboardingStep2}
                    disabled={busy}
                  >
                    Submit
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

export default function EmployeesPage() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-600">Loading…</div>}>
      <EmployeesPageInner />
    </Suspense>
  );
}
