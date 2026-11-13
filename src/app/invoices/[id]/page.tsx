"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import ReminderBadge from "@/components/ReminderBadge";
import { formatCents } from "@/lib/money";

interface InvoiceDetail {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  amountCents: number;
  dueDate: string;
  status: "sent" | "overdue" | "paid";
  paymentLink: string | null;
  createdAt: string;
}

interface Payment {
  id: string;
  amountCents: number;
  method: string | null;
  paidAt: string;
}

interface Reminder {
  id: string;
  step: number;
  channel: string;
  status: "sent" | "skipped" | "failed";
  note: string | null;
  sentAt: string;
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payError, setPayError] = useState("");
  const [payLoading, setPayLoading] = useState(false);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  async function fetchData() {
    setLoading(true);
    const [invRes, payRes, remRes] = await Promise.all([
      fetch(`/api/invoices/${id}`),
      fetch(`/api/invoices/${id}/payments`),
      fetch(`/api/invoices/${id}/reminders`),
    ]);
    if (invRes.ok) setInvoice(await invRes.json());
    if (payRes.ok) setPayments(await payRes.json());
    if (remRes.ok) setReminders(await remRes.json());
    setLoading(false);
  }

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    setPayError("");
    const amountNum = parseFloat(payAmount.replace(/[$,]/g, ""));
    if (isNaN(amountNum) || amountNum <= 0) return setPayError("Enter a valid amount.");

    setPayLoading(true);
    const res = await fetch(`/api/invoices/${id}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountCents: Math.round(amountNum * 100), method: payMethod }),
    });
    if (res.ok) {
      setPayAmount("");
      await fetchData();
    } else {
      const d = await res.json();
      setPayError(d.error ?? "Payment failed.");
    }
    setPayLoading(false);
  }

  if (loading) return <p className="text-slate-400 text-sm mt-8">Loading…</p>;
  if (!invoice) return <p className="text-red-600 mt-8">Invoice not found.</p>;

  const totalPaid = payments.reduce((sum, p) => sum + p.amountCents, 0);
  const balance = Math.max(0, invoice.amountCents - totalPaid);
  const daysOverdue = (() => {
    const [y, m, d] = invoice.dueDate.split("-").map(Number);
    const due = new Date(y, m - 1, d);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.floor((today.getTime() - due.getTime()) / 86400000);
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">{invoice.number}</h1>
            <StatusBadge status={invoice.status} />
            {invoice.status === "overdue" && daysOverdue >= 30 && (
              <span className="text-xs bg-red-600 text-white font-bold px-2 py-0.5 rounded">
                ⚠ Follow up personally
              </span>
            )}
          </div>
          <Link href={`/clients/${invoice.clientId}`} className="text-sm text-sky-600 hover:underline mt-1 block">
            {invoice.clientName}
          </Link>
        </div>
        <Link href="/invoices" className="text-sm text-slate-500 hover:underline">
          ← Back
        </Link>
      </div>

      {/* Invoice details */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500">Invoice Amount</p>
          <p className="text-xl font-bold text-slate-900">{formatCents(invoice.amountCents)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500">Paid</p>
          <p className="text-xl font-bold text-green-700">{formatCents(totalPaid)}</p>
        </div>
        <div className={`rounded-xl p-4 shadow-sm border ${balance > 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
          <p className="text-xs text-slate-500">Balance Due</p>
          <p className={`text-xl font-bold ${balance > 0 ? "text-red-700" : "text-green-700"}`}>{formatCents(balance)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500">Due Date</p>
          <p className="text-xl font-bold text-slate-900">{invoice.dueDate}</p>
          {invoice.status === "overdue" && daysOverdue > 0 && (
            <p className="text-xs text-red-600">{daysOverdue} days ago</p>
          )}
        </div>
      </div>

      {invoice.paymentLink && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-sm">
          <span className="text-slate-600">Payment link: </span>
          <a href={invoice.paymentLink} target="_blank" rel="noopener noreferrer" className="text-sky-700 hover:underline break-all">
            {invoice.paymentLink}
          </a>
        </div>
      )}

      {/* Record Payment */}
      {invoice.status !== "paid" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Record Payment</h2>
          <form onSubmit={handlePayment} className="flex gap-3 flex-wrap items-end">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Amount (USD)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="0.00"
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Method</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="e-transfer">E-transfer</option>
                <option value="other">Other</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={payLoading}
              className="px-4 py-2 bg-green-700 text-white text-sm rounded-lg hover:bg-green-800 disabled:opacity-50 transition-colors"
            >
              {payLoading ? "Recording…" : "Record Payment"}
            </button>
            {payError && <p className="text-sm text-red-600 w-full">{payError}</p>}
          </form>
        </div>
      )}

      {/* Payment history */}
      {payments.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <h2 className="font-semibold text-slate-800 px-5 py-4 border-b border-slate-100">Payment History</h2>
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Date</th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-slate-500">Amount</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-2 text-slate-600">{new Date(p.paidAt).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-right font-medium text-green-700">{formatCents(p.amountCents)}</td>
                  <td className="px-4 py-2 text-slate-500 capitalize">{p.method ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reminder timeline */}
      {reminders.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <h2 className="font-semibold text-slate-800 px-5 py-4 border-b border-slate-100">Reminder Timeline</h2>
          <div className="divide-y divide-slate-100">
            {reminders.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                <span className="text-slate-400 w-20">{new Date(r.sentAt).toLocaleDateString()}</span>
                <span className="font-medium text-slate-700">Day {r.step}</span>
                <span className="capitalize text-slate-500">{r.channel}</span>
                <ReminderBadge status={r.status} />
                {r.note && <span className="text-xs text-slate-400 ml-auto max-w-xs truncate">{r.note}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
