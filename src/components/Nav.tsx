"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/invoices", label: "Invoices" },
  { href: "/clients", label: "Clients" },
  { href: "/reminders", label: "Reminders" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="bg-sky-700 text-white shadow-sm">
      <div className="max-w-5xl mx-auto px-4 flex items-center gap-1 h-14">
        <span className="font-bold text-lg mr-4 whitespace-nowrap">⚡ Invoice Chaser</span>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              pathname === l.href
                ? "bg-white/20"
                : "hover:bg-white/10"
            }`}
          >
            {l.label}
          </Link>
        ))}
        <span className="ml-auto text-xs bg-amber-400 text-amber-900 font-semibold px-2 py-0.5 rounded">
          DEMO
        </span>
      </div>
    </nav>
  );
}
