"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { formatCents } from "@/lib/money";

interface Invoice {
  id: string;
  number: string;
  clientName: string;
  amountCents: number;
  dueDate: string;
  status: "sent" | "overdue" | "paid";
  paidCents?: number;
}

type StatusFilter = "all" | "sent" | "overdue" | "paid";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importCsv, setImportCsv] = useState("");
  const [importResult, setImportResult] = useState<null | {
    imported: number;
    failed: number;
    rows: { rowIndex: number; success: boolean; error?: string }[];
  }>(null);
  const [importing, setImporting] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  async function fetchInvoices() {
    setLoading(true);
    const res = await fetch("/api/invoices");
    const data = await res.json();
    setInvoices(data);
    setLoading(false);
  }

  const filtered = invoices.filter((inv) => {
    if (statusFilter !== "all" && inv.status !== statusFilter) return false;
    if (
      search &&
      !inv.number.toLowerCase().includes(search.toLowerCase()) &&
      !inv.clientName.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  async function handleImport() {
    setImporting(true);
    const res = await fetch("/api/invoices/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: importCsv }),
    });
    const data = await res.json();
    setImportResult(data);
    setImporting(false);
    if (data.imported > 0) await fetchInvoices();
  }

  function daysOverdue(dueDate: string) {
    const [y, m, d] = dueDate.split("-").map(Number);
    const due = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.floor((today.getTime() - due.getTime()) / 86400000);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
          <p className="text-sm text-slate-500 mt-1">{invoices.length} total</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(!showImport)}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Import CSV
          </button>
          <Link
            href="/invoices/new"
            className="px-3 py-1.5 text-sm bg-sky-700 text-white rounded-lg hover:bg-sky-800 transition-colors"
          >
            + Add Invoice
          </Link>
        </div>
      </div>

      {/* CSV Import panel */}
      {showImport && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <h2 className="font-semibold text-slate-800">Import Invoices from CSV</h2>
          <p className="text-xs text-slate-500">
            Required columns: <code className="bg-slate-100 px-1 rounded">clientName, invoiceNumber, amount, dueDate</code>
            <br />
            Optional: <code className="bg-slate-100 px-1 rounded">clientEmail, clientPhone, paymentLink</code>
          </p>
          <textarea
            className="w-full h-32 text-xs font-mono border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
            placeholder={"clientName,invoiceNumber,amount,dueDate\nJane Smith,INV-001,1500.00,2024-01-15"}
            value={importCsv}
            onChange={(e) => setImportCsv(e.target.value)}
          />
          <button
            onClick={handleImport}
            disabled={importing || !importCsv.trim()}
            className="px-4 py-2 bg-sky-700 text-white text-sm rounded-lg hover:bg-sky-800 disabled:opacity-50 transition-colors"
          >
            {importing ? "Importing…" : "Import"}
          </button>
          {importResult && (
            <div className="text-sm space-y-1">
              <p className="text-green-700 font-medium">✓ {importResult.imported} imported</p>
              {importResult.failed > 0 && (
                <p className="text-red-700 font-medium">✗ {importResult.failed} failed</p>
              )}
              {importResult.rows
                .filter((r) => !r.success)
                .map((r) => (
                  <p key={r.rowIndex} className="text-red-600 text-xs">
                    Row {r.rowIndex}: {r.error}
                  </p>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "sent", "overdue", "paid"] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              statusFilter === s
                ? "bg-sky-700 text-white"
                : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <input
          type="text"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-auto px-3 py-1 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      {/* Invoice list */}
      {loading ? (
        <p className="text-slate-400 text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
          No invoices match your filter.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Invoice #</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Client</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Amount</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Due</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((inv) => {
                const days = daysOverdue(inv.dueDate);
                return (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <Link href={`/invoices/${inv.id}`} className="font-mono text-sky-700 hover:underline">
                        {inv.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <Link href={`/invoices/${inv.id}`} className="hover:underline">
                        {inv.clientName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatCents(inv.amountCents)}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {inv.dueDate}
                      {inv.status === "overdue" && days > 0 && (
                        <span className="ml-1 text-red-600 text-xs">({days}d)</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={inv.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
