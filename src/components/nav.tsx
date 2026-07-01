"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/expenses", label: "Expenses" },
  { href: "/income", label: "Income" },
  { href: "/budgets", label: "Budgets" },
  { href: "/insights", label: "Insights" },
  { href: "/settings", label: "Settings" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur">
      <ul className="mx-auto grid max-w-3xl grid-cols-5">
        {links.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`block px-2 py-3 text-center text-xs font-semibold ${
                  active ? "text-blue-600" : "text-zinc-500"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
