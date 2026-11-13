"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCents } from "@/lib/money";

interface ClientRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  outstanding: number;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchClients(); }, []);

  async function fetchClients() {
    setLoading(true);
    const res = await fetch("/api/clients");
    const data = await res.json();
    setClients(data);
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!name.trim()) return setFormError("Name is required.");
    if (!email.trim() && !phone.trim()) return setFormError("At least one of email or phone is required.");
    setSaving(true);
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim() || null, phone: phone.trim() || null, notes: notes.trim() || null }),
    });
    if (res.ok) {
      setName(""); setEmail(""); setPhone(""); setNotes("");
      setShowAdd(false);
      await fetchClients();
    } else {
      const d = await res.json();
      setFormError(d.error ?? "Failed to add client.");
    }
    setSaving(false);
  }

  const filtered = clients.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-sm text-slate-500 mt-1">{clients.length} total</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-3 py-1.5 text-sm bg-sky-700 text-white rounded-lg hover:bg-sky-800 transition-colors"
        >
          + Add Client
        </button>
      </div>

      {/* Add client form */}
      {showAdd && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">New Client</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith" required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555 010 0000"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Residential, Oakwood"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="px-5 py-2 bg-sky-700 text-white text-sm rounded-lg hover:bg-sky-800 disabled:opacity-50">
                {saving ? "Saving…" : "Add Client"}
              </button>
              <button type="button" onClick={() => setShowAdd(false)}
                className="px-5 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <input type="text" placeholder="Search clients…" value={search} onChange={(e) => setSearch(e.target.value)}
        className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 w-full sm:w-64" />

      {/* List */}
      {loading ? (
        <p className="text-slate-400 text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
          No clients yet. Add your first client above.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
          {filtered.map((c) => (
            <Link key={c.id} href={`/clients/${c.id}`}
              className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{c.name}</p>
                <p className="text-sm text-slate-500 truncate">
                  {[c.email, c.phone].filter(Boolean).join(" · ")}
                </p>
              </div>
              {c.outstanding > 0 && (
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-red-700">{formatCents(c.outstanding)}</p>
                  <p className="text-xs text-slate-400">outstanding</p>
                </div>
              )}
              <span className="text-slate-300">›</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
