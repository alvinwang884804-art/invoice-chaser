"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Client {
  id: string;
  name: string;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [number, setNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [paymentLink, setPaymentLink] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/clients").then((r) => r.json()).then(setClients);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!clientId) return setError("Please select a client.");
    if (!number.trim()) return setError("Invoice number is required.");
    const amountNum = parseFloat(amount.replace(/[$,]/g, ""));
    if (isNaN(amountNum) || amountNum <= 0) return setError("Amount must be greater than zero.");
    if (!dueDate) return setError("Due date is required.");

    setSaving(true);
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        number: number.trim(),
        amountCents: Math.round(amountNum * 100),
        dueDate,
        paymentLink: paymentLink.trim() || null,
      }),
    });
    if (res.ok) {
      const inv = await res.json();
      router.push(`/invoices/${inv.id}`);
    } else {
      const d = await res.json();
      setError(d.error ?? "Failed to create invoice.");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New Invoice</h1>
        <p className="text-sm text-slate-500 mt-1">Add an invoice to start tracking it</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Client *</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            required
          >
            <option value="">Select a client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Invoice Number *</label>
          <input
            type="text"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="INV-001"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Amount (USD) *</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1500.00"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Due Date *</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Payment Link</label>
          <input
            type="url"
            value={paymentLink}
            onChange={(e) => setPaymentLink(e.target.value)}
            placeholder="https://pay.stripe.com/…"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-sky-700 text-white text-sm rounded-lg hover:bg-sky-800 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : "Create Invoice"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
