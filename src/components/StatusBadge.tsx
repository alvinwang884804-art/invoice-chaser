interface StatusBadgeProps {
  status: "sent" | "overdue" | "paid";
}

const styles = {
  sent: "bg-sky-100 text-sky-800",
  overdue: "bg-red-100 text-red-800",
  paid: "bg-green-100 text-green-800",
};

const labels = {
  sent: "Sent",
  overdue: "Overdue",
  paid: "Paid",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
