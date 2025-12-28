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

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-700">
      <path
        d="M12 3L19 6.5V12.2C19 16.3 16.1 20 12 21C7.9 20 5 16.3 5 12.2V6.5L12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M9.5 12.2L11.1 13.8L14.8 10.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-700">
      <path
        d="M7 11V8.5C7 5.462 9.462 3 12.5 3C15.538 3 18 5.462 18 8.5V11"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M6.5 11H18.5C19.328 11 20 11.672 20 12.5V19.5C20 20.328 19.328 21 18.5 21H6.5C5.672 21 5 20.328 5 19.5V12.5C5 11.672 5.672 11 6.5 11Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-700">
      <path d="M7 3V6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M17 3V6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path
        d="M5.5 6H18.5C19.328 6 20 6.672 20 7.5V19.5C20 20.328 19.328 21 18.5 21H5.5C4.672 21 4 20.328 4 19.5V7.5C4 6.672 4.672 6 5.5 6Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M4 10H20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function clampPct(p) {
  if (!Number.isFinite(p)) return 0;
  return Math.max(0, Math.min(100, p));
}

function formatMonthDay(d) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return {
    day: dt.getDate(),
    month: dt.toLocaleString(undefined, { month: "short" })
  };
}

function DonutCard({ title, total, segments, footerLeft, footerRight, icon }) {
  const safeTotal = Math.max(0, Number(total || 0));
  const normalized = (segments || []).map((s) => ({ ...s, value: Math.max(0, Number(s.value || 0)) }));

  const size = 120;
  const cx = 60;
  const cy = 60;
  const r = 46;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const arcs = safeTotal
    ? normalized
        .filter((s) => s.value > 0)
        .map((s) => {
          const len = (s.value / safeTotal) * circumference;
          const dash = `${len} ${Math.max(0, circumference - len)}`;
          const arc = {
            label: s.label,
            dash,
            offset,
            toneClass: s.toneClass || "text-slate-700"
          };
          offset += len;
          return arc;
        })
    : [];

  return (
    <div className="border rounded-lg bg-white p-4 border-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-medium">{title}</div>
        {icon ? <IconBadge>{icon}</IconBadge> : null}
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="relative h-28 w-28 shrink-0">
          <svg className="absolute inset-0" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
            <g transform={`rotate(-90 ${cx} ${cy})`}>
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke="currentColor"
                className="text-slate-200"
                strokeWidth={strokeWidth}
              />
              {arcs.map((a) => (
                <circle
                  key={a.label}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke="currentColor"
                  className={a.toneClass}
                  strokeWidth={strokeWidth}
                  strokeDasharray={a.dash}
                  strokeDashoffset={-a.offset}
                  strokeLinecap="round"
                />
              ))}
            </g>
          </svg>
          <div className="absolute inset-3 rounded-full bg-white border border-slate-200" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-semibold leading-none">{safeTotal}</div>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          {(segments || []).map((s) => (
            <div key={s.label} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`h-2 w-2 rounded-full ${s.dotClass || "bg-slate-400"}`} />
                <span className="text-slate-600 truncate">{s.label}</span>
              </div>
              <span className="font-medium">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {footerLeft || footerRight ? (
        <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
          <span>{footerLeft}</span>
          <span>{footerRight}</span>
        </div>
      ) : null}
    </div>
  );
}

function ProgressCard({ title, subtitle, valueText, pct, helper, icon }) {
  const p = clampPct(pct);
  return (
    <div className="border rounded-lg bg-white p-4 border-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{title}</div>
          {subtitle ? <div className="mt-1 text-xs text-slate-600">{subtitle}</div> : null}
        </div>
        {icon ? <IconBadge>{icon}</IconBadge> : valueText ? <div className="text-xs text-slate-600">{valueText}</div> : null}
      </div>
      <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full bg-green-500" style={{ width: `${p}%` }} />
      </div>
      {helper ? (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span>{helper}</span>
        </div>
      ) : null}
    </div>
  );
}

function CalendarCard({ items }) {
  const year = new Date().getFullYear();
  return (
    <div className="border rounded-lg bg-white p-4 border-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="font-medium">Calendar</div>
          <div className="text-xs text-slate-600">{year}</div>
        </div>
        <IconBadge>
          <CalendarIcon />
        </IconBadge>
      </div>
      <div className="mt-3 space-y-3">
        {(items || []).length ? (
          items.map((it) => (
            <div key={it.key} className="flex items-start gap-3">
              <div className="w-10 text-center">
                <div className="text-sm font-semibold">{it.day}</div>
                <div className="text-[11px] text-slate-600">{it.month}</div>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{it.title}</div>
                <div className="text-xs text-slate-600">{it.subtitle}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-slate-600">No upcoming activity.</div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;
  const userEmail = typeof window !== "undefined" ? localStorage.getItem("userEmail") : null;
  const [partnerSummary, setPartnerSummary] = useState(null);
  const [devices, setDevices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        const [devicesRes, employeesRes, partnerRes] = await Promise.all([
          fetch(apiUrl("/devices"), { headers: authHeaders() }),
          fetch(apiUrl("/employees"), { headers: authHeaders() }),
          role === "partner" ? fetch(apiUrl("/partners/me/dashboard"), { headers: authHeaders() }) : Promise.resolve(null)
        ]);

        const devicesBody = await devicesRes.json().catch(() => ({}));
        const employeesBody = await employeesRes.json().catch(() => ({}));
        if (!devicesRes.ok) throw new Error(devicesBody?.message || "Failed to load devices");
        if (!employeesRes.ok) throw new Error(employeesBody?.message || "Failed to load employees");
        setDevices(devicesBody.items || []);
        setEmployees(employeesBody.items || []);

        if (role === "partner" && partnerRes) {
          const partnerBody = await partnerRes.json().catch(() => ({}));
          if (!partnerRes.ok) throw new Error(partnerBody?.message || "Failed to load partner dashboard");
          setPartnerSummary(partnerBody);
        }
      } catch (e) {
        setError(e.message || "Failed to load");
      }
    }
    load();
  }, [role]);

  const deviceOsCounts = devices.reduce(
    (acc, d) => {
      acc[d.os || "other"] = (acc[d.os || "other"] || 0) + 1;
      return acc;
    },
    { windows: 0, macos: 0, linux: 0, other: 0 }
  );

  const employeeStatusCounts = employees.reduce(
    (acc, e) => {
      acc[e.status || "unknown"] = (acc[e.status || "unknown"] || 0) + 1;
      return acc;
    },
    { active: 0, onboarding: 0, offboarding: 0, archived: 0, unknown: 0 }
  );

  const protectedCount = devices.filter((d) => !!d.cyberProtectionEnabled).length;
  const encryptionEligible = devices.filter((d) => d.os === "windows" || d.os === "macos").length;
  const encryptedCount = devices.filter((d) => !!d.encryptionEnabled && (d.os === "windows" || d.os === "macos")).length;

  const displayName = (() => {
    const email = String(userEmail || "").trim();
    if (!email) return "";
    const local = email.split("@")[0] || "";
    if (!local) return "";
    return local
      .split(/[._-]+/)
      .filter(Boolean)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
  })();

  const activity = employees
    .filter((e) => e.status === "onboarding" || e.status === "offboarding")
    .map((e) => {
      const when = formatMonthDay(e.updatedAt || e.createdAt);
      return {
        key: e._id,
        day: when?.day ?? "—",
        month: when?.month ?? "",
        title: `${e.firstName || ""} ${e.lastName || ""}`.trim() || e.email,
        subtitle: e.status === "onboarding" ? "Onboarding" : "Offboarding"
      };
    })
    .slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-600">Hi{displayName ? "," : ""}</div>
          <h1 className="text-2xl font-semibold">{displayName || "Dashboard"}</h1>
        </div>

        <div className="inline-flex items-center gap-2">
          <a className="px-3 py-2 text-sm border rounded-lg bg-white hover:bg-slate-50 border-slate-200" href="/employees">
            Quick Actions
          </a>
        </div>
      </div>

      <p className="mt-2 text-sm text-slate-600">Signed in as: {userEmail || role || "unknown"}</p>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      <section className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <DonutCard
            title="Devices"
            total={devices.length}
            icon={<DevicesIcon />}
            segments={[
              { label: "macOS", value: deviceOsCounts.macos, toneClass: "text-slate-900", dotClass: "bg-slate-900" },
              { label: "Windows", value: deviceOsCounts.windows, toneClass: "text-blue-600", dotClass: "bg-blue-600" },
              { label: "Linux", value: deviceOsCounts.linux, toneClass: "text-emerald-600", dotClass: "bg-emerald-600" },
              { label: "Other", value: deviceOsCounts.other, toneClass: "text-slate-400", dotClass: "bg-slate-400" }
            ]}
          />
          <DonutCard
            title="Employees"
            total={employees.length}
            icon={<UsersIcon />}
            segments={[
              { label: "Active", value: employeeStatusCounts.active, toneClass: "text-emerald-600", dotClass: "bg-emerald-600" },
              { label: "Onboarding", value: employeeStatusCounts.onboarding, toneClass: "text-amber-500", dotClass: "bg-amber-500" },
              { label: "Offboarding", value: employeeStatusCounts.offboarding, toneClass: "text-blue-600", dotClass: "bg-blue-600" }
            ]}
          />
        </div>

        <div className="lg:col-span-4 grid grid-rows-2 gap-4">
          <ProgressCard
            title="Cybersecurity"
            subtitle="Protected Devices"
            valueText={`${protectedCount}/${devices.length}`}
            icon={<ShieldIcon />}
            pct={devices.length ? (protectedCount / devices.length) * 100 : 0}
            helper={protectedCount === devices.length && devices.length ? "All devices are protected" : "Improve protection coverage"}
          />
          <ProgressCard
            title="Encryption"
            subtitle="Encrypted Devices"
            valueText={`${encryptedCount}/${encryptionEligible || 0}`}
            icon={<LockIcon />}
            pct={encryptionEligible ? (encryptedCount / encryptionEligible) * 100 : 0}
            helper={encryptionEligible && encryptedCount === encryptionEligible ? "All eligible devices are encrypted" : "Enable encryption where possible"}
          />
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4">
          <CalendarCard items={activity} />
        </div>
        <div className="lg:col-span-8 border rounded-lg bg-white p-4 border-slate-200">
          <div className="font-medium">Quick links</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <a className="px-4 py-2 text-sm border rounded-lg bg-white hover:bg-slate-50 border-slate-200" href="/employees?start=onboarding">
              Start onboarding
            </a>
            <a className="px-4 py-2 text-sm border rounded-lg bg-white hover:bg-slate-50 border-slate-200" href="/employees?start=offboarding">
              Start offboarding
            </a>
            <a className="px-4 py-2 text-sm border rounded-lg bg-white hover:bg-slate-50 border-slate-200" href="/devices">
              Inventory
            </a>
          </div>
        </div>
      </section>

      {role === "partner" && partnerSummary ? (
        <section className="mt-6 border rounded-lg bg-white p-4 border-slate-200">
          <div className="font-medium">Partner summary</div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="border rounded-lg bg-white p-4 border-slate-200">
              <div className="text-xs text-slate-600">Customers</div>
              <div className="mt-2 text-3xl font-semibold">{partnerSummary.customers?.length || 0}</div>
            </div>
            <div className="border rounded-lg bg-white p-4 border-slate-200">
              <div className="text-xs text-slate-600">Total commissions</div>
              <div className="mt-2 text-3xl font-semibold">{partnerSummary.totalCommissions || 0}</div>
            </div>
            <div className="border rounded-lg bg-white p-4 border-slate-200">
              <div className="text-xs text-slate-600">Lifecycle counts</div>
              <div className="mt-3 space-y-1 text-sm">
                {(partnerSummary.counts || []).map((c) => (
                  <div key={c._id} className="flex items-center justify-between">
                    <span className="text-slate-600">{c._id}</span>
                    <span className="font-medium">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
