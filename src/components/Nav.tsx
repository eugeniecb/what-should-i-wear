"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

const LINKS = [
  { href: "/dashboard", label: "Today" },
  { href: "/closet", label: "Closet" },
  { href: "/settings", label: "Settings" },
];

export default function Nav() {
  const pathname = usePathname();
  const { isSignedIn } = useUser();

  if (!isSignedIn) return null;

  return (
    <nav className="flex gap-1 text-sm">
      {LINKS.map((link) => {
        const active =
          pathname === link.href || pathname?.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-3 py-1.5 transition ${
              active
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "text-gray-600 hover:bg-gray-200/60 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
