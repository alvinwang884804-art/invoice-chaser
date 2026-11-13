interface ReminderBadgeProps {
  status: "sent" | "skipped" | "failed";
}

const styles = {
  sent: "bg-green-100 text-green-800",
  skipped: "bg-slate-100 text-slate-600",
  failed: "bg-red-100 text-red-800",
};

export default function ReminderBadge({ status }: ReminderBadgeProps) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
}
