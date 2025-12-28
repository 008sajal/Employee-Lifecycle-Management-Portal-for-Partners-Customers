"use client";

import { useState } from "react";
import { apiUrl } from "../../../lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);

    const res = await fetch(apiUrl("/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body?.message || "Login failed");
      return;
    }

    const body = await res.json();
    localStorage.setItem("accessToken", body.accessToken);
    localStorage.setItem("role", body.user.role);
    if (body?.user?.email) localStorage.setItem("userEmail", body.user.email);
    window.location.href = "/dashboard";
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="border rounded-lg bg-white p-6 border-slate-200">
          <div className="text-sm text-slate-600">Belzir Portal</div>
          <h1 className="mt-1 text-2xl font-semibold">Login</h1>

          <form className="mt-6 space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm">Email</label>
          <input
            className="w-full border rounded-lg px-3 py-2 border-slate-200"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
        </div>
        <div>
          <label className="block text-sm">Password</label>
          <input
            className="w-full border rounded-lg px-3 py-2 border-slate-200"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button className="w-full px-4 py-2 border rounded-lg bg-white hover:bg-slate-50 border-slate-200" type="submit">
          Sign in
        </button>
          </form>
        </div>

        <div className="mt-3 text-center text-xs text-slate-600">
          Use the seeded demo accounts from the README.
        </div>
      </div>
    </main>
  );
}
