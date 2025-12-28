"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";

function NavIcon({ children }) {
  return <span className="text-slate-700">{children}</span>;
}

function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 13.5C4 12.672 4.672 12 5.5 12H10.5C11.328 12 12 12.672 12 13.5V18.5C12 19.328 11.328 20 10.5 20H5.5C4.672 20 4 19.328 4 18.5V13.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M12 5.5C12 4.672 12.672 4 13.5 4H18.5C19.328 4 20 4.672 20 5.5V10.5C20 11.328 19.328 12 18.5 12H13.5C12.672 12 12 11.328 12 10.5V5.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M4 5.5C4 4.672 4.672 4 5.5 4H10.5C11.328 4 12 4.672 12 5.5V10.5C12 11.328 11.328 12 10.5 12H5.5C4.672 12 4 11.328 4 10.5V5.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M12 13.5C12 12.672 12.672 12 13.5 12H18.5C19.328 12 20 12.672 20 13.5V18.5C20 19.328 19.328 20 18.5 20H13.5C12.672 20 12 19.328 12 18.5V13.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function EmployeesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 18.5C16 16.567 14.433 15 12.5 15H8.5C6.567 15 5 16.567 5 18.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M10.5 12.5C12.1569 12.5 13.5 11.1569 13.5 9.5C13.5 7.84315 12.1569 6.5 10.5 6.5C8.84315 6.5 7.5 7.84315 7.5 9.5C7.5 11.1569 8.84315 12.5 10.5 12.5Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M19 18.5C19 17.018 18.143 15.737 16.9 15.13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M15.9 6.8C16.729 7.304 17.3 8.215 17.3 9.26C17.3 10.305 16.729 11.216 15.9 11.72" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function DevicesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6.5C4 5.67157 4.67157 5 5.5 5H18.5C19.3284 5 20 5.67157 20 6.5V15.5C20 16.3284 19.3284 17 18.5 17H5.5C4.67157 17 4 16.3284 4 15.5V6.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9 20H15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 17V20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function CustomersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.5 19.5V8.5C4.5 7.672 5.172 7 6 7H18C18.828 7 19.5 7.672 19.5 8.5V19.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M3.5 19.5H20.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8 19.5V14.5C8 13.672 8.672 13 9.5 13H14.5C15.328 13 16 13.672 16 14.5V19.5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9 7V5.5C9 4.672 9.672 4 10.5 4H13.5C14.328 4 15 4.672 15 5.5V7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function CommissionsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 3H17C18.105 3 19 3.895 19 5V21L16.5 19.5L14 21L11.5 19.5L9 21L6.5 19.5L5 21V5C5 3.895 5.895 3 7 3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M8 8H16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8 12H16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8 16H13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function getAuth() {
  if (typeof window === "undefined") return { token: null, role: null };
  return {
    token: localStorage.getItem("accessToken"),
    role: localStorage.getItem("role")
  };
}

export default function AppLayout({ children }) {
  const { token, role } = useMemo(() => getAuth(), []);
  const pathname = usePathname();

  useEffect(() => {
    const a = getAuth();
    if (!a.token) window.location.href = "/login";
  }, []);

  function logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("role");
    window.location.href = "/login";
  }

  function navLink(href, label) {
    const active = pathname === href;
    return (
      <Link
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
          active ? "bg-white border-slate-200" : "bg-transparent border-transparent hover:bg-white hover:border-slate-200"
        }`}
        href={href}
      >
        {label}
      </Link>
    );
  }

  function navLinkWithIcon(href, label, icon) {
    const active = pathname === href;
    return (
      <Link
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
          active ? "bg-white border-slate-200" : "bg-transparent border-transparent hover:bg-white hover:border-slate-200"
        }`}
        href={href}
      >
        <NavIcon>{icon}</NavIcon>
        {label}
      </Link>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <aside className="w-60 shrink-0 border-r border-slate-200 bg-slate-100/60">
          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-semibold">
                A
              </div>
              <div>
                <div className="text-sm font-semibold">Belzir</div>
                <div className="text-xs text-slate-600">Role: {role || "unknown"}</div>
              </div>
            </div>

            <nav className="mt-6 flex flex-col gap-1">
              {navLinkWithIcon("/dashboard", "Dashboard", <DashboardIcon />)}
              {navLinkWithIcon("/employees", "Employees", <EmployeesIcon />)}
              {navLinkWithIcon("/devices", "Inventory", <DevicesIcon />)}
              {role === "partner" || role === "superadmin" ? navLinkWithIcon("/customers", "Customers", <CustomersIcon />) : null}
              {role === "partner" || role === "superadmin" ? navLinkWithIcon("/commissions", "Commissions", <CommissionsIcon />) : null}
              {role === "superadmin" ? navLinkWithIcon("/admin", "Admin", <DashboardIcon />) : null}
            </nav>
          </div>

          <div className="mt-auto p-6">
            <button
              className="w-full px-3 py-2 text-sm border rounded-lg bg-white hover:bg-slate-50 border-slate-200"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1">
          <div className="max-w-6xl mx-auto px-6 py-6">{children}</div>
        </main>
      </div>

      <span className="hidden">{token ? "" : ""}</span>
    </div>
  );
}
