interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  color?: "default" | "red" | "green" | "amber";
}

const colorMap = {
  default: "bg-white border-slate-200",
  red: "bg-red-50 border-red-200",
  green: "bg-green-50 border-green-200",
  amber: "bg-amber-50 border-amber-200",
};

const valueColorMap = {
  default: "text-sky-700",
  red: "text-red-700",
  green: "text-green-700",
  amber: "text-amber-700",
};

export default function KpiCard({ label, value, sub, color = "default" }: KpiCardProps) {
  return (
    <div className={`rounded-xl border p-5 shadow-sm ${colorMap[color]}`}>
      <p className="text-sm text-slate-500 font-medium">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${valueColorMap[color]}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}
