"use client";

import { useEffect, useState } from "react";
import { apiUrl, authHeaders } from "../../../../lib/api";

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

function getRole() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("role");
}

export default function AdminEmployeesPage() {
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const [createForm, setCreateForm] = useState({
    customerId: "",
    firstName: "",
    lastName: "",
    email: "",
    location: "",
    jobTitle: "",
    department: "",
    startDate: ""
  });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    location: "",
    jobTitle: "",
    department: "",
    startDate: "",
    status: "active",
    onboardingStep: "",
    offboardingStep: "",
    accountDisabled: false,
    deviceId: ""
  });

  async function loadAll() {
    const [employeesRes, customersRes, devicesRes] = await Promise.all([
      fetch(apiUrl("/employees"), { headers: authHeaders() }),
      fetch(apiUrl("/customers"), { headers: authHeaders() }),
      fetch(apiUrl("/devices"), { headers: authHeaders() })
    ]);

    const employeesBody = await employeesRes.json().catch(() => ({}));
    const customersBody = await customersRes.json().catch(() => ({}));
    const devicesBody = await devicesRes.json().catch(() => ({}));

    if (!employeesRes.ok) throw new Error(employeesBody?.message || "Failed to load employees");
    if (!customersRes.ok) throw new Error(customersBody?.message || "Failed to load customers");
    if (!devicesRes.ok) throw new Error(devicesBody?.message || "Failed to load devices");

    const employees = Array.isArray(employeesBody.items) ? employeesBody.items : [];
    const customersList = Array.isArray(customersBody.items) ? customersBody.items : [];
    const devicesList = Array.isArray(devicesBody.items) ? devicesBody.items : [];

    setItems(employees);
    setCustomers(customersList);
    setDevices(devicesList);

    setCreateForm((s) => ({
      ...s,
      customerId: s.customerId || customersList[0]?._id || ""
    }));
  }

  useEffect(() => {
    if (getRole() !== "superadmin") {
      setError("Forbidden");
      return;
    }
    loadAll().catch((e) => setError(e.message));
  }, []);

  function beginEdit(e) {
    setEditingId(e._id);
    setEditForm({
      firstName: e.firstName || "",
      lastName: e.lastName || "",
      email: e.email || "",
      location: e.location || "",
      jobTitle: e.jobTitle || "",
      department: e.department || "",
      startDate: e.startDate ? new Date(e.startDate).toISOString().slice(0, 10) : "",
      status: e.status || "active",
      onboardingStep: e.onboardingStep == null ? "" : String(e.onboardingStep),
      offboardingStep: e.offboardingStep == null ? "" : String(e.offboardingStep),
      accountDisabled: Boolean(e.accountDisabled),
      deviceId: e.deviceId?._id || e.deviceId || ""
    });
  }

  async function create() {
    setBusy(true);
    try {
      setError(null);
      const res = await fetch(apiUrl("/employees"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({
          customerId: createForm.customerId,
          firstName: createForm.firstName,
          lastName: createForm.lastName,
          email: createForm.email,
          location: createForm.location,
          jobTitle: createForm.jobTitle || undefined,
          department: createForm.department || undefined,
          startDate: createForm.startDate ? new Date(createForm.startDate).toISOString() : undefined
        })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || "Failed to create employee");
      setCreateForm((s) => ({
        ...s,
        firstName: "",
        lastName: "",
        email: "",
        location: "",
        jobTitle: "",
        department: "",
        startDate: ""
      }));
      await loadAll();
    } catch (e) {
      setError(e.message || "Failed to create employee");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(id) {
    setBusy(true);
    try {
      setError(null);
      const res = await fetch(apiUrl(`/employees/${id}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          email: editForm.email,
          location: editForm.location,
          jobTitle: editForm.jobTitle || null,
          department: editForm.department || null,
          startDate: editForm.startDate ? new Date(editForm.startDate).toISOString() : null,
          status: editForm.status,
          onboardingStep: editForm.onboardingStep === "" ? null : Number(editForm.onboardingStep),
          offboardingStep: editForm.offboardingStep === "" ? null : Number(editForm.offboardingStep),
          accountDisabled: Boolean(editForm.accountDisabled),
          deviceId: editForm.deviceId === "" ? null : editForm.deviceId
        })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || "Failed to update employee");
      setEditingId(null);
      await loadAll();
    } catch (e) {
      setError(e.message || "Failed to update employee");
    } finally {
      setBusy(false);
    }
  }

  async function archive(id) {
    setBusy(true);
    try {
      setError(null);
      const res = await fetch(apiUrl(`/employees/${id}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({ status: "archived" })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || "Failed to archive");
      await loadAll();
    } catch (e) {
      setError(e.message || "Failed to archive");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    const ok = window.confirm("Delete this employee?");
    if (!ok) return;
    setBusy(true);
    try {
      setError(null);
      const res = await fetch(apiUrl(`/employees/${id}`), {
        method: "DELETE",
        headers: authHeaders()
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || "Failed to delete");
      }
      await loadAll();
    } catch (e) {
      setError(e.message || "Failed to delete");
    } finally {
      setBusy(false);
    }
  }

  const availableDevices = devices.filter((d) => d.status === "available");

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Employees</h1>
          <IconBadge>
            <UsersIcon />
          </IconBadge>
        </div>
        <div className="text-sm text-slate-600">Superadmin</div>
      </div>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <section className="mt-6 border rounded-lg bg-white p-4 border-slate-200">
        <div className="font-medium">Create employee</div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-sm">
            <div className="text-xs text-slate-600">Customer</div>
            <select
              className="mt-1 w-full border rounded-lg px-3 py-2 bg-white border-slate-200"
              value={createForm.customerId}
              onChange={(e) => setCreateForm((s) => ({ ...s, customerId: e.target.value }))}
            >
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <div />

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
            className="border rounded-lg px-3 py-2 border-slate-200"
            placeholder="Email"
            value={createForm.email}
            onChange={(e) => setCreateForm((s) => ({ ...s, email: e.target.value }))}
          />
          <input
            className="border rounded-lg px-3 py-2 border-slate-200"
            placeholder="Location"
            value={createForm.location}
            onChange={(e) => setCreateForm((s) => ({ ...s, location: e.target.value }))}
          />
          <input
            className="border rounded-lg px-3 py-2 border-slate-200"
            placeholder="Job title (optional)"
            value={createForm.jobTitle}
            onChange={(e) => setCreateForm((s) => ({ ...s, jobTitle: e.target.value }))}
          />
          <input
            className="border rounded-lg px-3 py-2 border-slate-200"
            placeholder="Department (optional)"
            value={createForm.department}
            onChange={(e) => setCreateForm((s) => ({ ...s, department: e.target.value }))}
          />
          <label className="text-sm">
            <div className="text-xs text-slate-600">Start date (optional)</div>
            <input
              className="mt-1 w-full border rounded-lg px-3 py-2 border-slate-200"
              type="date"
              value={createForm.startDate}
              onChange={(e) => setCreateForm((s) => ({ ...s, startDate: e.target.value }))}
            />
          </label>
          <div className="flex items-end justify-end">
            <button
              className="px-4 py-2 border rounded-lg bg-white hover:bg-slate-50 border-slate-200 disabled:opacity-50"
              onClick={create}
              disabled={
                busy ||
                !createForm.customerId ||
                !createForm.firstName.trim() ||
                !createForm.lastName.trim() ||
                !createForm.email.trim() ||
                !createForm.location.trim()
              }
            >
              Create
            </button>
          </div>
        </div>
      </section>

      <section className="mt-6 border rounded-lg overflow-hidden bg-white border-slate-200">
        <div className="grid grid-cols-12 gap-2 p-3 border-b font-medium border-slate-200 bg-slate-50">
          <div className="col-span-4">Name</div>
          <div className="col-span-4">Email</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Actions</div>
        </div>
        {items.map((e) => (
          <div key={e._id} className="p-3 border-b border-slate-200">
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-4">
                {e.firstName} {e.lastName}
              </div>
              <div className="col-span-4">{e.email}</div>
              <div className="col-span-2">{e.status}</div>
              <div className="col-span-2 flex flex-wrap gap-2 justify-end">
                <button
                  className="px-3 py-1 border rounded-lg bg-white hover:bg-slate-50 border-slate-200 disabled:opacity-50"
                  onClick={() => beginEdit(e)}
                  disabled={busy}
                >
                  Edit
                </button>
                <button
                  className="px-3 py-1 border rounded-lg bg-white hover:bg-slate-50 border-slate-200 disabled:opacity-50"
                  onClick={() => archive(e._id)}
                  disabled={busy}
                >
                  Archive
                </button>
                <button
                  className="px-3 py-1 border rounded-lg bg-white hover:bg-slate-50 border-slate-200 disabled:opacity-50"
                  onClick={() => remove(e._id)}
                  disabled={busy}
                >
                  Delete
                </button>
              </div>
            </div>

            {editingId === e._id ? (
              <div className="mt-3 border rounded-lg bg-white p-3 border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    className="border rounded-lg px-3 py-2 text-sm border-slate-200"
                    placeholder="First name"
                    value={editForm.firstName}
                    onChange={(ev) => setEditForm((s) => ({ ...s, firstName: ev.target.value }))}
                  />
                  <input
                    className="border rounded-lg px-3 py-2 text-sm border-slate-200"
                    placeholder="Last name"
                    value={editForm.lastName}
                    onChange={(ev) => setEditForm((s) => ({ ...s, lastName: ev.target.value }))}
                  />
                  <input
                    className="border rounded-lg px-3 py-2 text-sm border-slate-200"
                    placeholder="Email"
                    value={editForm.email}
                    onChange={(ev) => setEditForm((s) => ({ ...s, email: ev.target.value }))}
                  />
                  <input
                    className="border rounded-lg px-3 py-2 text-sm border-slate-200"
                    placeholder="Location"
                    value={editForm.location}
                    onChange={(ev) => setEditForm((s) => ({ ...s, location: ev.target.value }))}
                  />
                  <input
                    className="border rounded-lg px-3 py-2 text-sm border-slate-200"
                    placeholder="Job title"
                    value={editForm.jobTitle}
                    onChange={(ev) => setEditForm((s) => ({ ...s, jobTitle: ev.target.value }))}
                  />
                  <input
                    className="border rounded-lg px-3 py-2 text-sm border-slate-200"
                    placeholder="Department"
                    value={editForm.department}
                    onChange={(ev) => setEditForm((s) => ({ ...s, department: ev.target.value }))}
                  />

                  <label className="text-sm">
                    <div className="text-xs text-slate-600">Start date</div>
                    <input
                      className="mt-1 w-full border rounded-lg px-3 py-2 text-sm border-slate-200"
                      type="date"
                      value={editForm.startDate}
                      onChange={(ev) => setEditForm((s) => ({ ...s, startDate: ev.target.value }))}
                    />
                  </label>

                  <label className="text-sm">
                    <div className="text-xs text-slate-600">Status (workflow override)</div>
                    <select
                      className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white border-slate-200"
                      value={editForm.status}
                      onChange={(ev) => setEditForm((s) => ({ ...s, status: ev.target.value }))}
                    >
                      <option value="onboarding">onboarding</option>
                      <option value="active">active</option>
                      <option value="leave">leave</option>
                      <option value="offboarding">offboarding</option>
                      <option value="archived">archived</option>
                    </select>
                  </label>

                  <label className="text-sm">
                    <div className="text-xs text-slate-600">Onboarding step (optional override)</div>
                    <input
                      className="mt-1 w-full border rounded-lg px-3 py-2 text-sm border-slate-200"
                      type="number"
                      min="1"
                      max="2"
                      value={editForm.onboardingStep}
                      onChange={(ev) => setEditForm((s) => ({ ...s, onboardingStep: ev.target.value }))}
                    />
                  </label>

                  <label className="text-sm">
                    <div className="text-xs text-slate-600">Offboarding step (optional override)</div>
                    <input
                      className="mt-1 w-full border rounded-lg px-3 py-2 text-sm border-slate-200"
                      type="number"
                      min="1"
                      max="3"
                      value={editForm.offboardingStep}
                      onChange={(ev) => setEditForm((s) => ({ ...s, offboardingStep: ev.target.value }))}
                    />
                  </label>

                  <label className="text-sm">
                    <div className="text-xs text-slate-600">Device (superadmin assignment)</div>
                    <select
                      className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white border-slate-200"
                      value={editForm.deviceId}
                      onChange={(ev) => setEditForm((s) => ({ ...s, deviceId: ev.target.value }))}
                    >
                      <option value="">(none)</option>
                      {editForm.deviceId && !availableDevices.find((d) => d._id === editForm.deviceId) ? (
                        <option value={editForm.deviceId}>Current device (assigned)</option>
                      ) : null}
                      {availableDevices.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-sm flex items-center gap-2 mt-6">
                    <input
                      type="checkbox"
                      checked={Boolean(editForm.accountDisabled)}
                      onChange={(ev) => setEditForm((s) => ({ ...s, accountDisabled: ev.target.checked }))}
                    />
                    <span>Account disabled</span>
                  </label>

                  <div className="flex items-end justify-end gap-2">
                    <button
                      className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm disabled:opacity-50"
                      onClick={() => saveEdit(e._id)}
                      disabled={busy || !editForm.firstName.trim() || !editForm.lastName.trim() || !editForm.email.trim() || !editForm.location.trim()}
                    >
                      Save
                    </button>
                    <button
                      className="px-3 py-2 border rounded-lg bg-white hover:bg-slate-50 border-slate-200 text-sm"
                      onClick={() => setEditingId(null)}
                      disabled={busy}
                    >
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
