"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { formatCents } from "@/lib/money";

interface ClientDetail {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: string;
}

interface InvoiceRow {
  id: string;
  number: string;
  amountCents: number;
  dueDate: string;
  status: "sent" | "overdue" | "paid";
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [outstanding, setOutstanding] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => { if (id) fetchData(); }, [id]);

  async function fetchData() {
    setLoading(true);
    const [clientRes, invRes] = await Promise.all([
      fetch(`/api/clients/${id}`),
      fetch(`/api/clients/${id}/invoices`),
    ]);
    if (clientRes.ok) {
      const c = await clientRes.json();
      setClient(c.client);
      setOutstanding(c.outstanding);
      setName(c.client.name);
      setEmail(c.client.email ?? "");
      setPhone(c.client.phone ?? "");
      setNotes(c.client.notes ?? "");
    }
    if (invRes.ok) setInvoices(await invRes.json());
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setEditError("");
    if (!name.trim()) return setEditError("Name is required.");
    if (!email.trim() && !phone.trim()) return setEditError("At least one of email or phone is required.");
    setSaving(true);
    const res = await fetch(`/api/clients/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim() || null, phone: phone.trim() || null, notes: notes.trim() || null }),
    });
    if (res.ok) {
      setEditing(false);
      await fetchData();
    } else {
      const d = await res.json();
      setEditError(d.error ?? "Failed to save.");
    }
    setSaving(false);
  }

  if (loading) return <p className="text-slate-400 text-sm mt-8">Loading…</p>;
  if (!client) return <p className="text-red-600 mt-8">Client not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{client.name}</h1>
          {outstanding > 0 && (
            <p className="text-sm text-red-600 font-medium mt-1">
              {formatCents(outstanding)} outstanding
            </p>
          )}
        </div>
        <Link href="/clients" className="text-sm text-slate-500 hover:underline">← Back</Link>
      </div>

      {/* Client info */}
      {editing ? (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
            </div>
            {editError && <p className="text-sm text-red-600">{editError}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="px-5 py-2 bg-sky-700 text-white text-sm rounded-lg hover:bg-sky-800 disabled:opacity-50">
                {saving ? "Saving…" : "Save"}
              </button>
              <button type="button" onClick={() => setEditing(false)}
                className="px-5 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
              {client.email && (
                <div>
                  <dt className="text-xs text-slate-500">Email</dt>
                  <dd className="text-sm text-slate-800">{client.email}</dd>
                </div>
              )}
              {client.phone && (
                <div>
                  <dt className="text-xs text-slate-500">Phone</dt>
                  <dd className="text-sm text-slate-800">{client.phone}</dd>
                </div>
              )}
              {client.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-slate-500">Notes</dt>
                  <dd className="text-sm text-slate-800">{client.notes}</dd>
                </div>
              )}
              {!client.email && !client.phone && (
                <div className="sm:col-span-2">
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                    ⚠ No contact details — reminders cannot be sent.
                  </p>
                </div>
              )}
            </dl>
            <button onClick={() => setEditing(true)}
              className="ml-4 px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
              Edit
            </button>
          </div>
        </div>
      )}

      {/* Invoices */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-800">Invoices</h2>
          <Link href={`/invoices/new`}
            className="text-xs text-sky-600 hover:underline">
            + Add invoice →
          </Link>
        </div>
        {invoices.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-slate-500 text-sm">
            No invoices for this client yet.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Invoice #</th>
                  <th className="text-right px-4 py-2 text-xs font-semibold text-slate-500">Amount</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Due</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2">
                      <Link href={`/invoices/${inv.id}`} className="font-mono text-sky-700 hover:underline">
                        {inv.number}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-right font-medium">{formatCents(inv.amountCents)}</td>
                    <td className="px-4 py-2 text-slate-500">{inv.dueDate}</td>
                    <td className="px-4 py-2"><StatusBadge status={inv.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
