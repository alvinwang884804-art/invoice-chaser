import { getDashboardStats, getMostOverdue, getRecentActivity } from "@/lib/db/invoices";
import { formatCents } from "@/lib/money";
import { calendarDaysOverdue } from "@/lib/reminders/schedule";
import KpiCard from "@/components/KpiCard";
import StatusBadge from "@/components/StatusBadge";
import ReminderBadge from "@/components/ReminderBadge";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const today = new Date();
  const stats = getDashboardStats(today);
  const mostOverdue = getMostOverdue(5, today);
  const recentActivity = getRecentActivity(10);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Your receivables at a glance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          label="Total Outstanding"
          value={formatCents(stats.totalOutstandingCents)}
          color="default"
        />
        <KpiCard
          label="Total Overdue"
          value={formatCents(stats.totalOverdueCents)}
          sub={`${stats.overdueCount} invoice${stats.overdueCount !== 1 ? "s" : ""}`}
          color={stats.overdueCount > 0 ? "red" : "default"}
        />
        <KpiCard
          label="Recovered This Month"
          value={formatCents(stats.recoveredThisMonthCents)}
          color={stats.recoveredThisMonthCents > 0 ? "green" : "default"}
        />
        <KpiCard
          label="Overdue Invoices"
          value={String(stats.overdueCount)}
          color={stats.overdueCount > 0 ? "amber" : "default"}
        />
      </div>

      {/* Most Overdue */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-800">Most Overdue</h2>
          <Link href="/invoices?status=overdue" className="text-xs text-sky-600 hover:underline">
            View all →
          </Link>
        </div>

        {mostOverdue.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
            <p className="text-2xl mb-2">🎉</p>
            <p className="font-semibold text-green-800">Nothing outstanding!</p>
            <p className="text-sm text-green-600 mt-1">All invoices are paid. Great work.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
            {mostOverdue.map((inv) => (
              <Link
                key={inv.id}
                href={`/invoices/${inv.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{inv.clientName}</p>
                  <p className="text-sm text-slate-500">{inv.number}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-slate-900">{formatCents(inv.balanceCents)}</p>
                  <p className="text-sm text-red-600 font-medium">{inv.daysOverdue}d overdue</p>
                </div>
                {inv.daysOverdue >= 30 && (
                  <span
                    className="text-xs bg-red-600 text-white font-bold px-2 py-0.5 rounded ml-1"
                    title="Needs personal follow-up"
                  >
                    ⚠ Follow up
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="font-semibold text-slate-800 mb-3">Recent Reminder Activity</h2>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-xl p-4">
            No reminders sent yet. Go to{" "}
            <Link href="/reminders" className="text-sky-600 hover:underline">
              Reminders
            </Link>{" "}
            to run them.
          </p>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
            {recentActivity.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-slate-800 mr-2">{r.clientName}</span>
                  <span className="text-sm text-slate-500">{r.invoiceNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span>Day {r.step}</span>
                  <span className="capitalize">{r.channel}</span>
                  <ReminderBadge status={r.status as "sent" | "skipped" | "failed"} />
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0">
                  {new Date(r.sentAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
