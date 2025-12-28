import Link from "next/link";

function IconBadge({ children }) {
  return <div className="h-9 w-9 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">{children}</div>;
}

function AdminIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-700">
      <path
        d="M4 7.5C4 6.672 4.672 6 5.5 6H10.5C11.328 6 12 6.672 12 7.5V10.5C12 11.328 11.328 12 10.5 12H5.5C4.672 12 4 11.328 4 10.5V7.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M12 13.5C12 12.672 12.672 12 13.5 12H18.5C19.328 12 20 12.672 20 13.5V16.5C20 17.328 19.328 18 18.5 18H13.5C12.672 18 12 17.328 12 16.5V13.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M12 7.5C12 6.672 12.672 6 13.5 6H18.5C19.328 6 20 6.672 20 7.5V10.5C20 11.328 19.328 12 18.5 12H13.5C12.672 12 12 11.328 12 10.5V7.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M4 13.5C4 12.672 4.672 12 5.5 12H10.5C11.328 12 12 12.672 12 13.5V16.5C12 17.328 11.328 18 10.5 18H5.5C4.672 18 4 17.328 4 16.5V13.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AdminIndexPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Admin</h1>
          <IconBadge>
            <AdminIcon />
          </IconBadge>
        </div>
        <div className="text-sm text-slate-600">Superadmin tools</div>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link className="border rounded-lg bg-white p-4 border-slate-200 hover:bg-slate-50" href="/admin/partners">
          <div className="text-sm font-medium">Partners</div>
          <div className="mt-1 text-xs text-slate-600">Manage partner accounts</div>
        </Link>
        <Link className="border rounded-lg bg-white p-4 border-slate-200 hover:bg-slate-50" href="/admin/customers">
          <div className="text-sm font-medium">Customers</div>
          <div className="mt-1 text-xs text-slate-600">Manage customer records</div>
        </Link>
        <Link className="border rounded-lg bg-white p-4 border-slate-200 hover:bg-slate-50" href="/admin/employees">
          <div className="text-sm font-medium">Employees</div>
          <div className="mt-1 text-xs text-slate-600">View and administer employees</div>
        </Link>
        <Link className="border rounded-lg bg-white p-4 border-slate-200 hover:bg-slate-50" href="/admin/devices">
          <div className="text-sm font-medium">Devices</div>
          <div className="mt-1 text-xs text-slate-600">Inventory overview</div>
        </Link>
        <Link className="border rounded-lg bg-white p-4 border-slate-200 hover:bg-slate-50" href="/admin/audit-logs">
          <div className="text-sm font-medium">Audit logs</div>
          <div className="mt-1 text-xs text-slate-600">Track system changes</div>
        </Link>
        <Link className="border rounded-lg bg-white p-4 border-slate-200 hover:bg-slate-50" href="/admin/settings">
          <div className="text-sm font-medium">Settings</div>
          <div className="mt-1 text-xs text-slate-600">System configuration</div>
        </Link>
      </div>
    </div>
  );
}
