"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "../art/Logo";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/coupons", label: "Coupons" },
];

export function AdminHeader({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const signOut = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/admin" className="flex items-center gap-2.5">
          <Logo className="h-8" />
          <span className="rounded-full bg-ink px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-paper">
            Admin
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-3 text-sm sm:order-last">
          <a href="/" target="_blank" rel="noreferrer" className="hidden font-bold text-ink-soft hover:text-ink sm:inline">
            View shop ↗
          </a>
          <span className="hidden max-w-48 truncate text-ink-soft md:inline" title={email}>{email}</span>
          <button onClick={signOut} className="rounded-full border border-line bg-paper px-4 py-2 font-bold hover:border-ink/40">
            Sign out
          </button>
        </div>

        <nav className="no-scrollbar -mx-1 flex w-full gap-1 overflow-x-auto sm:w-auto">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                active(n.href) ? "bg-ink text-paper" : "text-ink-soft hover:bg-sage/60 hover:text-ink"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
