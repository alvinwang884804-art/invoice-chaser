"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ReminderBadge from "@/components/ReminderBadge";

interface ReminderRow {
  id: string;
  invoiceNumber: string;
  clientName: string;
  step: number;
  channel: string;
  status: "sent" | "skipped" | "failed";
  note: string | null;
  sentAt: string;
}

interface Template {
  id: string;
  step: number;
  channel: string;
  subject: string | null;
  body: string;
}

interface RunResult {
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
  details: Array<{
    invoiceNumber: string;
    clientName: string;
    step: number;
    channel: string;
    status: string;
    note?: string;
  }>;
}

export default function RemindersPage() {
  const [tab, setTab] = useState<"log" | "templates">("log");
  const [reminders, setReminders] = useState<ReminderRow[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    fetchReminders();
    fetchTemplates();
  }, []);

  async function fetchReminders() {
    setLoading(true);
    const res = await fetch("/api/reminders");
    setReminders(await res.json());
    setLoading(false);
  }

  async function fetchTemplates() {
    const res = await fetch("/api/templates");
    setTemplates(await res.json());
  }

  async function handleRunReminders() {
    setRunning(true);
    setRunResult(null);
    const res = await fetch("/api/reminders/run", { method: "POST" });
    const data = await res.json();
    setRunResult(data);
    setRunning(false);
    await fetchReminders();
  }

  function startEdit(t: Template) {
    setEditingTemplate(t);
    setEditBody(t.body);
    setEditSubject(t.subject ?? "");
    setEditError("");
  }

  async function handleSaveTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTemplate) return;
    setEditError("");
    if (!editBody.trim()) return setEditError("Body cannot be empty.");
    setEditSaving(true);
    const res = await fetch(`/api/templates/${editingTemplate.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: editSubject.trim() || null, body: editBody }),
    });
    if (res.ok) {
      setEditingTemplate(null);
      await fetchTemplates();
    } else {
      const d = await res.json();
      setEditError(d.error ?? "Failed to save template.");
    }
    setEditSaving(false);
  }

  const stepLabels: Record<number, string> = { 1: "Day 1 (friendly)", 7: "Day 7 (nudge)", 14: "Day 14 (firm)", 30: "Day 30 (urgent)" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reminders</h1>
          <p className="text-sm text-slate-500 mt-1">Automatic email & SMS chase sequence</p>
        </div>
        <button
          onClick={handleRunReminders}
          disabled={running}
          className="px-4 py-2 bg-sky-700 text-white text-sm rounded-lg hover:bg-sky-800 disabled:opacity-50 transition-colors"
        >
          {running ? "Running…" : "▶ Run Reminders"}
        </button>
      </div>

      {/* Run result */}
      {runResult && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-sm space-y-2">
          <p className="font-semibold text-sky-800">
            Run complete — {runResult.processed} invoices checked
          </p>
          <div className="flex gap-4">
            <span className="text-green-700">✓ {runResult.sent} sent</span>
            <span className="text-slate-500">↷ {runResult.skipped} skipped</span>
            {runResult.failed > 0 && <span className="text-red-700">✗ {runResult.failed} failed</span>}
          </div>
          {runResult.details.length > 0 && (
            <ul className="text-xs text-slate-600 space-y-0.5 mt-2">
              {runResult.details.map((d, i) => (
                <li key={i}>
                  {d.clientName} · {d.invoiceNumber} · Day {d.step} {d.channel} ·{" "}
                  <span className={d.status === "sent" ? "text-green-700" : d.status === "skipped" ? "text-slate-500" : "text-red-700"}>
                    {d.status}
                  </span>
                  {d.note && <span className="text-slate-400"> ({d.note})</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {(["log", "templates"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${
              tab === t ? "border-sky-700 text-sky-700" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}>
            {t === "log" ? "Reminder Log" : "Templates"}
          </button>
        ))}
      </div>

      {/* Reminder log */}
      {tab === "log" && (
        loading ? (
          <p className="text-slate-400 text-sm">Loading…</p>
        ) : reminders.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
            No reminders sent yet. Click <strong>Run Reminders</strong> to send due reminders.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Date</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Client</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Invoice</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Step</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Channel</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Status</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reminders.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-slate-500 whitespace-nowrap">
                      {new Date(r.sentAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 font-medium text-slate-800">{r.clientName}</td>
                    <td className="px-4 py-2">
                      <span className="font-mono text-sky-700">{r.invoiceNumber}</span>
                    </td>
                    <td className="px-4 py-2 text-slate-600">Day {r.step}</td>
                    <td className="px-4 py-2 capitalize text-slate-600">{r.channel}</td>
                    <td className="px-4 py-2"><ReminderBadge status={r.status} /></td>
                    <td className="px-4 py-2 text-xs text-slate-400 max-w-xs truncate">{r.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Templates */}
      {tab === "templates" && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Placeholders: <code className="bg-slate-100 px-1 rounded text-xs">{"{{clientName}}"}</code>{" "}
            <code className="bg-slate-100 px-1 rounded text-xs">{"{{invoiceNumber}}"}</code>{" "}
            <code className="bg-slate-100 px-1 rounded text-xs">{"{{amount}}"}</code>{" "}
            <code className="bg-slate-100 px-1 rounded text-xs">{"{{dueDate}}"}</code>{" "}
            <code className="bg-slate-100 px-1 rounded text-xs">{"{{paymentLink}}"}</code>
          </p>
          {templates.map((t) => (
            <div key={t.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
                <div>
                  <span className="font-semibold text-slate-800">{stepLabels[t.step] ?? `Day ${t.step}`}</span>
                  <span className="ml-2 text-xs capitalize text-slate-500 bg-slate-200 px-2 py-0.5 rounded">{t.channel}</span>
                </div>
                {editingTemplate?.id !== t.id && (
                  <button onClick={() => startEdit(t)}
                    className="text-xs text-sky-600 hover:underline">
                    Edit
                  </button>
                )}
              </div>
              {editingTemplate?.id === t.id ? (
                <form onSubmit={handleSaveTemplate} className="p-5 space-y-3">
                  {t.channel === "email" && (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Subject</label>
                      <input type="text" value={editSubject} onChange={(e) => setEditSubject(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Body</label>
                    <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={8} required
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500" />
                  </div>
                  {editError && <p className="text-sm text-red-600">{editError}</p>}
                  <div className="flex gap-3">
                    <button type="submit" disabled={editSaving}
                      className="px-4 py-2 bg-sky-700 text-white text-sm rounded-lg hover:bg-sky-800 disabled:opacity-50">
                      {editSaving ? "Saving…" : "Save Template"}
                    </button>
                    <button type="button" onClick={() => setEditingTemplate(null)}
                      className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-5">
                  {t.channel === "email" && t.subject && (
                    <p className="text-sm text-slate-500 mb-2"><strong>Subject:</strong> {t.subject}</p>
                  )}
                  <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">{t.body}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
