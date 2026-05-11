"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const adminNavItems = [
  {
    label: "Services / Pricing",
    href: "/admin/services",
    icon: "⚙️",
    match: ["/admin/services"]
  },
  {
    label: "Clients",
    href: "/admin/clients",
    icon: "👥",
    match: ["/admin/clients"]
  },
  {
    label: "Admin Home",
    href: "/admin",
    icon: "🏠",
    match: ["/admin"]
  },
  {
    label: "Messenger",
    href: "/admin/messages",
    icon: "💬",
    match: ["/admin/messages"]
  },
  {
    label: "Blog Editor",
    href: "/admin/blog",
    icon: "✎",
    match: ["/admin/blog"]
  }
];

function isActive(pathname: string, item: (typeof adminNavItems)[number]) {
  if (item.href === "/admin") return pathname === "/admin";
  return item.match.some((route) => pathname.startsWith(route));
}

export default function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-mobile-bottom-nav" aria-label="Admin mobile navigation">
      {adminNavItems.map((item) => {
        const active = isActive(pathname, item);

        return (
          <Link
            className={`admin-mobile-nav-item ${active ? "active" : ""} ${
              item.href === "/admin" ? "home" : ""
            }`}
            href={item.href}
            key={item.href}
            aria-current={active ? "page" : undefined}
          >
            <span aria-hidden="true">{item.icon}</span>
            <span className="sr-only">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
