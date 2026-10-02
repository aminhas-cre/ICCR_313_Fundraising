"use client";
import { useState } from "react";

export default function Login() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/login", { method: "POST", body: JSON.stringify({ password: pw }) });
    if (r.ok) window.location.href = "/admin";
    else setErr("Wrong password");
  }
  return (
    <main className="mx-auto max-w-sm px-4 py-20">
      <h1 className="font-serif text-3xl font-bold text-emerald">313 Admin</h1>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <label className="block text-sm font-semibold" htmlFor="pw">Password</label>
        <input id="pw" type="password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
        {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
        <button className="btn-primary w-full" type="submit">Sign in</button>
      </form>
    </main>
  );
}
