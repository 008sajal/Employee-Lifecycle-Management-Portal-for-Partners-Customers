"use client";

import { useEffect, useState } from "react";
import { apiUrl, authHeaders } from "../../../lib/api";

function IconBadge({ children }) {
  return <div className="h-9 w-9 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">{children}</div>;
}

function DevicesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-700">
      <path
        d="M4 6.5C4 5.67157 4.67157 5 5.5 5H18.5C19.3284 5 20 5.67157 20 6.5V15.5C20 16.3284 19.3284 17 18.5 17H5.5C4.67157 17 4 16.3284 4 15.5V6.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M9 20H15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 17V20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function Pill({ children, tone = "neutral" }) {
  const cls =
    tone === "success"
      ? "bg-green-50 text-green-700 border-green-200"
      : tone === "warn"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : tone === "info"
          ? "bg-blue-50 text-blue-700 border-blue-200"
          : "bg-slate-50 text-slate-700 border-slate-200";
  return <span className={`inline-flex items-center px-2 py-1 border rounded-full text-xs ${cls}`}>{children}</span>;
}

function Shield({ enabled }) {
  return (
    <span
      className={`inline-flex items-center justify-center h-7 w-7 border rounded ${
        enabled ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"
      }`}
      aria-label={enabled ? "Cybersecurity enabled" : "Cybersecurity disabled"}
      title={enabled ? "Cybersecurity enabled" : "Cybersecurity disabled"}
    >
      <span className={`h-3 w-3 rounded-full ${enabled ? "bg-green-600" : "bg-slate-400"}`} />
    </span>
  );
}

function Lock({ enabled }) {
  return (
    <span
      className={`inline-flex items-center justify-center h-7 w-7 border rounded ${
        enabled ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"
      }`}
      aria-label={enabled ? "Encryption enabled" : "Encryption disabled"}
      title={enabled ? "Encryption enabled" : "Encryption disabled"}
    >
      <span className={`h-3 w-3 rounded-full ${enabled ? "bg-green-600" : "bg-slate-400"}`} />
    </span>
  );
}

function deviceThumbStyle(os) {
  if (os === "macos") return "bg-slate-900";
  if (os === "windows") return "bg-blue-600";
  if (os === "linux") return "bg-emerald-600";
  return "bg-slate-400";
}

function DeviceThumb({ os, name }) {
  const initials = String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("")
    .slice(0, 2);

  return (
    <div
      className={`h-9 w-12 rounded-md ${deviceThumbStyle(os)} flex items-center justify-center text-white text-xs font-semibold`}
      aria-hidden="true"
    >
      {initials || "DV"}
    </div>
  );
}

function osLabel(os) {
  if (os === "macos") return "macOS";
  if (os === "windows") return "Windows";
  if (os === "linux") return "Linux";
  return "Other";
}

function statusLabel(status) {
  if (status === "available") return { label: "In stock", tone: "info" };
  if (status === "assigned") return { label: "Active", tone: "success" };
  return { label: String(status || "—"), tone: "neutral" };
}

export default function DevicesPage() {
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [assigningId, setAssigningId] = useState(null);
  const [assignEmployeeId, setAssignEmployeeId] = useState("");

  const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [osFilter, setOsFilter] = useState("all");

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    os: "other",
    cyberProtectionEnabled: false,
    encryptionEnabled: false
  });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    os: "other",
    cyberProtectionEnabled: false,
    encryptionEnabled: false
  });

  async function load() {
    setError(null);
    const [devicesRes, employeesRes] = await Promise.all([
      fetch(apiUrl("/devices"), { headers: authHeaders() }),
      fetch(apiUrl("/employees"), { headers: authHeaders() })
    ]);

    const devicesBody = await devicesRes.json().catch(() => ({}));
    const employeesBody = await employeesRes.json().catch(() => ({}));

    if (!devicesRes.ok) throw new Error(devicesBody?.message || "Failed to load devices");
    if (!employeesRes.ok) throw new Error(employeesBody?.message || "Failed to load employees");

    setItems(devicesBody.items || []);
    setEmployees(employeesBody.items || []);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message || "Failed to load"));
  }, []);

  const employeeById = employees.reduce((acc, e) => {
    acc[e._id] = e;
    return acc;
  }, {});

  const assignableEmployees = employees
    .filter((e) => e.status !== "archived" && e.status !== "offboarding")
    .sort((a, b) => String(a.lastName || "").localeCompare(String(b.lastName || "")));

  async function assignDevice(deviceId) {
    if (!assignEmployeeId) return;
    setBusy(true);
    try {
      setError(null);
      const res = await fetch(apiUrl(`/devices/${deviceId}/assign`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({ employeeId: assignEmployeeId })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || "Failed to assign device");
      setAssigningId(null);
      setAssignEmployeeId("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function unassignDevice(deviceId) {
    const ok = window.confirm("Unassign this device?");
    if (!ok) return;
    setBusy(true);
    try {
      setError(null);
      const res = await fetch(apiUrl(`/devices/${deviceId}/unassign`), {
        method: "PATCH",
        headers: authHeaders()
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || "Failed to unassign device");
      await load();
    } finally {
      setBusy(false);
    }
  }

  const filtered = items.filter((d) => {
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (osFilter !== "all" && d.os !== osFilter) return false;

    const assigned = d.assignedEmployeeId ? employeeById[String(d.assignedEmployeeId)] : null;
    const assignedName = assigned ? `${assigned.firstName || ""} ${assigned.lastName || ""}`.trim() : "";

    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      String(d.name || "").toLowerCase().includes(q) ||
      String(osLabel(d.os)).toLowerCase().includes(q) ||
      String(assignedName).toLowerCase().includes(q) ||
      String(assigned?.location || "").toLowerCase().includes(q)
    );
  });

  async function createDevice() {
    setBusy(true);
    try {
      setError(null);
      const res = await fetch(apiUrl("/devices"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({
          name: createForm.name,
          os: createForm.os,
          cyberProtectionEnabled: !!createForm.cyberProtectionEnabled,
          encryptionEnabled: !!createForm.encryptionEnabled
        })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || "Failed to register device");
      setCreateForm({ name: "", os: "other", cyberProtectionEnabled: false, encryptionEnabled: false });
      setShowCreate(false);
      await load();
    } finally {
      setBusy(false);
    }
  }

  function beginEdit(d) {
    setEditingId(d._id);
    setEditForm({
      name: d.name || "",
      os: d.os || "other",
      cyberProtectionEnabled: !!d.cyberProtectionEnabled,
      encryptionEnabled: !!d.encryptionEnabled
    });
  }

  async function saveEdit(id) {
    setBusy(true);
    try {
      setError(null);
      const res = await fetch(apiUrl(`/devices/${id}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({
          name: editForm.name,
          os: editForm.os,
          cyberProtectionEnabled: !!editForm.cyberProtectionEnabled,
          encryptionEnabled: !!editForm.encryptionEnabled
        })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || "Failed to update device");
      setEditingId(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function removeDevice(d) {
    const ok = window.confirm("Delete this device? This cannot be undone.");
    if (!ok) return;
    setBusy(true);
    try {
      setError(null);
      const res = await fetch(apiUrl(`/devices/${d._id}`), {
        method: "DELETE",
        headers: authHeaders()
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || "Failed to delete device");
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  function canEditOrDelete(d) {
    if (role === "superadmin") return true;
    if (role !== "customer") return false;
    return d.ownerType === "customer" && d.status === "available";
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Devices</h1>
          <IconBadge>
            <DevicesIcon />
          </IconBadge>
        </div>
        {(role === "customer" || role === "superadmin") ? (
          <button
            className="px-4 py-2 text-sm border rounded-lg bg-white hover:bg-slate-50 border-slate-200 disabled:opacity-50"
            onClick={() => setShowCreate((v) => !v)}
            disabled={busy}
          >
            + Register device
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="inline-flex items-center gap-2">
            <label className="text-sm text-slate-600">Filter</label>
            <select
              className="border rounded-lg bg-white px-3 py-2 text-sm border-slate-200"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="available">In stock</option>
              <option value="assigned">Active</option>
            </select>
            <select
              className="border rounded-lg bg-white px-3 py-2 text-sm border-slate-200"
              value={osFilter}
              onChange={(e) => setOsFilter(e.target.value)}
            >
              <option value="all">All OS</option>
              <option value="macos">macOS</option>
              <option value="windows">Windows</option>
              <option value="linux">Linux</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <input
          className="border rounded-lg bg-white px-3 py-2 text-sm w-full md:w-80 border-slate-200"
          placeholder="Search by device, OS, user, location"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {showCreate ? (
        <section className="mt-4 border rounded-lg bg-white p-4 border-slate-200">
          <div className="font-medium">Register device</div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="border rounded-lg px-3 py-2 text-sm border-slate-200"
              placeholder="Device name"
              value={createForm.name}
              onChange={(e) => setCreateForm((s) => ({ ...s, name: e.target.value }))}
            />
            <select
              className="border rounded-lg bg-white px-3 py-2 text-sm border-slate-200"
              value={createForm.os}
              onChange={(e) => setCreateForm((s) => ({ ...s, os: e.target.value }))}
            >
              <option value="macos">macOS</option>
              <option value="windows">Windows</option>
              <option value="linux">Linux</option>
              <option value="other">Other</option>
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!createForm.cyberProtectionEnabled}
                onChange={(e) => setCreateForm((s) => ({ ...s, cyberProtectionEnabled: e.target.checked }))}
              />
              Cybersecurity enabled
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!createForm.encryptionEnabled}
                onChange={(e) => setCreateForm((s) => ({ ...s, encryptionEnabled: e.target.checked }))}
              />
              Encryption enabled
            </label>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              className="px-4 py-2 text-sm border rounded-lg bg-white hover:bg-slate-50 border-slate-200 disabled:opacity-50"
              onClick={createDevice}
              disabled={busy || !createForm.name.trim()}
            >
              Save
            </button>
            <button
              className="px-4 py-2 text-sm border rounded-lg bg-white hover:bg-slate-50 border-slate-200"
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </button>
          </div>
        </section>
      ) : null}

      <section className="mt-6 border rounded-lg bg-white overflow-hidden border-slate-200">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b bg-slate-50/50 text-[11px] font-semibold tracking-wide text-slate-600">
          <div className="col-span-4">DEVICE</div>
          <div className="col-span-2">STATUS</div>
          <div className="col-span-2">OPERATING SYSTEM</div>
          <div className="col-span-2">ASSIGNED TO</div>
          <div className="col-span-1">LOCATION</div>
          <div className="col-span-1 text-right">SECURITY</div>
        </div>

        {filtered.map((d) => {
          const assigned = d.assignedEmployeeId ? employeeById[String(d.assignedEmployeeId)] : null;
          const assignedName = assigned ? `${assigned.firstName || ""} ${assigned.lastName || ""}`.trim() : "Unassigned";
          const location = assigned?.location ? assigned.location : "—";
          const statusMeta = statusLabel(d.status);
          const isEditing = editingId === d._id;
          const isAssigning = assigningId === d._id;
          return (
            <div key={d._id} className="grid grid-cols-12 gap-2 px-4 py-3 border-b items-center hover:bg-slate-50/50">
              <div className="col-span-4">
                <div className="flex items-center gap-3">
                  <DeviceThumb os={d.os} name={d.name} />
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{d.name}</div>
                    <div className="text-xs text-slate-500 truncate">
                      {d.ownerType === "belzir" ? "Belzir-owned" : "Customer-owned"}
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-span-2">
                <Pill tone={statusMeta.tone}>{statusMeta.label}</Pill>
              </div>
              <div className="col-span-2 text-sm">{osLabel(d.os)}</div>
              <div className="col-span-2 text-sm truncate">{assignedName || "Unassigned"}</div>
              <div className="col-span-1 text-sm truncate">{location}</div>
              <div className="col-span-1 flex items-center justify-end gap-2">
                <Shield enabled={!!d.cyberProtectionEnabled} />
                <Lock enabled={(d.os === "windows" || d.os === "macos") ? !!d.encryptionEnabled : false} />
              </div>

              {(role === "customer" || role === "superadmin") ? (
                <div className="col-span-12 mt-2">
                  {d.status === "available" ? (
                    isAssigning ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border rounded-lg bg-slate-50 border-slate-200">
                        <select
                          className="border rounded-lg bg-white px-3 py-2 text-sm border-slate-200 md:col-span-2"
                          value={assignEmployeeId}
                          onChange={(e) => setAssignEmployeeId(e.target.value)}
                        >
                          <option value="">Select employee…</option>
                          {assignableEmployees.map((e) => (
                            <option key={e._id} value={e._id}>
                              {e.firstName} {e.lastName} — {e.status}
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center gap-2">
                          <button
                            className="px-3 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                            onClick={() => assignDevice(d._id)}
                            disabled={busy || !assignEmployeeId}
                          >
                            Assign
                          </button>
                          <button
                            className="px-3 py-2 text-sm border rounded-lg bg-white hover:bg-slate-50 border-slate-200"
                            onClick={() => {
                              setAssigningId(null);
                              setAssignEmployeeId("");
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="px-3 py-2 text-sm border rounded-lg bg-white hover:bg-slate-50 border-slate-200 disabled:opacity-50"
                        onClick={() => setAssigningId(d._id)}
                        disabled={busy}
                      >
                        Assign to employee
                      </button>
                    )
                  ) : (
                    <button
                      className="px-3 py-2 text-sm border rounded-lg bg-white hover:bg-slate-50 border-slate-200 disabled:opacity-50"
                      onClick={() => unassignDevice(d._id)}
                      disabled={busy}
                    >
                      Unassign
                    </button>
                  )}
                </div>
              ) : null}

              {canEditOrDelete(d) ? (
                <div className="col-span-12 mt-2">
                  {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 border rounded-lg bg-slate-50 border-slate-200">
                      <input
                        className="border rounded-lg px-3 py-2 text-sm bg-white border-slate-200"
                        value={editForm.name}
                        onChange={(e) => setEditForm((s) => ({ ...s, name: e.target.value }))}
                      />
                      <select
                        className="border rounded-lg bg-white px-3 py-2 text-sm border-slate-200"
                        value={editForm.os}
                        onChange={(e) => setEditForm((s) => ({ ...s, os: e.target.value }))}
                      >
                        <option value="macos">macOS</option>
                        <option value="windows">Windows</option>
                        <option value="linux">Linux</option>
                        <option value="other">Other</option>
                      </select>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={!!editForm.cyberProtectionEnabled}
                          onChange={(e) => setEditForm((s) => ({ ...s, cyberProtectionEnabled: e.target.checked }))}
                        />
                        Cybersecurity enabled
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={!!editForm.encryptionEnabled}
                          onChange={(e) => setEditForm((s) => ({ ...s, encryptionEnabled: e.target.checked }))}
                        />
                        Encryption enabled
                      </label>

                      <div className="md:col-span-2 flex items-center gap-2">
                        <button
                          className="px-3 py-2 text-sm border rounded-lg bg-white hover:bg-slate-50 border-slate-200 disabled:opacity-50"
                          onClick={() => saveEdit(d._id)}
                          disabled={busy || !editForm.name.trim()}
                        >
                          Save changes
                        </button>
                        <button
                          className="px-3 py-2 text-sm border rounded-lg bg-white hover:bg-slate-50 border-slate-200"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        className="px-3 py-2 text-sm border rounded-lg bg-white hover:bg-slate-50 border-slate-200 disabled:opacity-50"
                        onClick={() => beginEdit(d)}
                        disabled={busy}
                      >
                        Edit
                      </button>
                      <button
                        className="px-3 py-2 text-sm border rounded-lg bg-white hover:bg-slate-50 border-slate-200 disabled:opacity-50"
                        onClick={() => removeDevice(d)}
                        disabled={busy}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}

        {filtered.length === 0 ? (
          <div className="p-6 text-sm text-slate-600">No devices found.</div>
        ) : null}
      </section>
    </div>
  );
}
