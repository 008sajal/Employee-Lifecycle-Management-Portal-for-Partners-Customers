"use client";

import { useEffect, useState } from "react";
import { apiUrl, authHeaders } from "../../../../lib/api";

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

function getRole() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("role");
}

export default function AdminDevicesPage() {
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    os: "other",
    cyberProtectionEnabled: true,
    encryptionEnabled: true
  });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    os: "other",
    cyberProtectionEnabled: false,
    encryptionEnabled: false
  });

  const [assigningId, setAssigningId] = useState(null);
  const [assignEmployeeId, setAssignEmployeeId] = useState("");

  async function load() {
    const [devicesRes, employeesRes] = await Promise.all([
      fetch(apiUrl("/devices"), { headers: authHeaders() }),
      fetch(apiUrl("/employees"), { headers: authHeaders() })
    ]);

    const devicesBody = await devicesRes.json().catch(() => ({}));
    const employeesBody = await employeesRes.json().catch(() => ({}));

    if (!devicesRes.ok) throw new Error(devicesBody?.message || "Failed to load devices");
    if (!employeesRes.ok) throw new Error(employeesBody?.message || "Failed to load employees");

    setItems(devicesBody.items);
    setEmployees(employeesBody.items);
  }

  useEffect(() => {
    if (getRole() !== "superadmin") {
      setError("Forbidden");
      return;
    }
    load().catch((e) => setError(e.message));
  }, []);

  const employeeById = employees.reduce((acc, e) => {
    acc[e._id] = e;
    return acc;
  }, {});

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
      if (!res.ok) throw new Error(body?.message || "Failed to create device");
      setShowCreate(false);
      setCreateForm({ name: "", os: "other", cyberProtectionEnabled: true, encryptionEnabled: true });
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

  async function remove(id) {
    const ok = window.confirm("Delete this device? This cannot be undone.");
    if (!ok) return;
    setBusy(true);
    try {
      setError(null);
      const res = await fetch(apiUrl(`/devices/${id}`), {
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

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Devices</h1>
          <IconBadge>
            <DevicesIcon />
          </IconBadge>
        </div>
        <button
          className="px-4 py-2 text-sm border rounded-lg bg-white hover:bg-slate-50 border-slate-200 disabled:opacity-50"
          onClick={() => setShowCreate((v) => !v)}
          disabled={busy}
        >
          {showCreate ? "Close" : "+ New device"}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {showCreate ? (
        <section className="mt-6 border rounded-lg bg-white p-4 border-slate-200">
          <div className="font-medium">Create device</div>
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
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm disabled:opacity-50"
              onClick={createDevice}
              disabled={busy || !createForm.name.trim()}
            >
              Create
            </button>
          </div>
        </section>
      ) : null}

      <section className="mt-6 border rounded-lg overflow-hidden bg-white border-slate-200">
        <div className="grid grid-cols-12 gap-2 p-3 border-b font-medium border-slate-200 bg-slate-50">
          <div className="col-span-4">Name</div>
          <div className="col-span-2">OS</div>
          <div className="col-span-2">Owner</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Assigned</div>
        </div>
        {items.map((d) => {
          const assigned = d.assignedEmployeeId ? employeeById[String(d.assignedEmployeeId)] : null;
          const assignedName = assigned ? `${assigned.firstName || ""} ${assigned.lastName || ""}`.trim() : "—";
          const isEditing = editingId === d._id;
          const isAssigning = assigningId === d._id;
          return (
            <div key={d._id} className="p-3 border-b border-slate-200">
              <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-4">{d.name}</div>
                <div className="col-span-2">{d.os}</div>
                <div className="col-span-2">{d.ownerType}</div>
                <div className="col-span-2">{d.status}</div>
                <div className="col-span-2">{assignedName}</div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                {d.status === "available" ? (
                  isAssigning ? (
                    <>
                      <select
                        className="border rounded-lg bg-white px-3 py-2 text-sm border-slate-200"
                        value={assignEmployeeId}
                        onChange={(e) => setAssignEmployeeId(e.target.value)}
                      >
                        <option value="">Select employee…</option>
                        {employees
                          .filter((e) => e.status !== "archived" && e.status !== "offboarding")
                          .map((e) => (
                            <option key={e._id} value={e._id}>
                              {e.firstName} {e.lastName} — {e.status}
                            </option>
                          ))}
                      </select>
                      <button
                        className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm disabled:opacity-50"
                        onClick={() => assignDevice(d._id)}
                        disabled={busy || !assignEmployeeId}
                      >
                        Assign
                      </button>
                      <button
                        className="px-3 py-2 border rounded-lg bg-white hover:bg-slate-50 border-slate-200 text-sm"
                        onClick={() => {
                          setAssigningId(null);
                          setAssignEmployeeId("");
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      className="px-3 py-2 border rounded-lg bg-white hover:bg-slate-50 border-slate-200 text-sm disabled:opacity-50"
                      onClick={() => setAssigningId(d._id)}
                      disabled={busy}
                    >
                      Assign
                    </button>
                  )
                ) : (
                  <button
                    className="px-3 py-2 border rounded-lg bg-white hover:bg-slate-50 border-slate-200 text-sm disabled:opacity-50"
                    onClick={() => unassignDevice(d._id)}
                    disabled={busy}
                  >
                    Unassign
                  </button>
                )}

                {isEditing ? (
                  <>
                    <input
                      className="border rounded-lg px-3 py-2 text-sm border-slate-200"
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
                      Cyber
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!editForm.encryptionEnabled}
                        onChange={(e) => setEditForm((s) => ({ ...s, encryptionEnabled: e.target.checked }))}
                      />
                      Encrypt
                    </label>
                    <button
                      className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm disabled:opacity-50"
                      onClick={() => saveEdit(d._id)}
                      disabled={busy || !editForm.name.trim()}
                    >
                      Save
                    </button>
                    <button
                      className="px-3 py-2 border rounded-lg bg-white hover:bg-slate-50 border-slate-200 text-sm"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="px-3 py-2 border rounded-lg bg-white hover:bg-slate-50 border-slate-200 text-sm disabled:opacity-50"
                      onClick={() => beginEdit(d)}
                      disabled={busy}
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-2 border rounded-lg bg-white hover:bg-slate-50 border-slate-200 text-sm disabled:opacity-50"
                      onClick={() => remove(d._id)}
                      disabled={busy}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
