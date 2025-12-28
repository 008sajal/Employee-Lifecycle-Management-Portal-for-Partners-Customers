import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-xl border rounded-lg bg-white p-6 border-slate-200">
        <div className="text-sm text-slate-600">Belzir</div>
        <h1 className="mt-1 text-2xl font-semibold">Employee Lifecycle Portal</h1>
        <p className="mt-2 text-sm text-slate-600">Sign in to manage onboarding/offboarding workflows, inventory, and audit logs.</p>

        <div className="mt-6 flex gap-3">
          <Link className="px-4 py-2 border rounded-lg bg-white hover:bg-slate-50 border-slate-200" href="/login">
            Login
          </Link>
        </div>
      </div>
    </main>
  );
}
