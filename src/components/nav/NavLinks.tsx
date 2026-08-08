"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const ITEMS = [
  { href: "/create", label: "作成" },
  { href: "/library", label: "ライブラリ" },
  { href: "/words", label: "単語" },
  { href: "/dashboard", label: "ダッシュボード" },
];

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden md:flex md:flex-col md:w-56 md:shrink-0 border-r border-ink/10 min-h-screen p-6">
      <div className="mb-10">
        <div className="h-8 w-8 rounded-full bg-ink mb-3" />
        <div className="text-sm font-semibold tracking-tight">AI IP Factory</div>
      </div>
      <nav className="flex flex-col gap-1">
        {ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                active ? "bg-ink text-paper" : "text-ink/70 hover:bg-ink/5"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={handleLogout}
        className="mt-auto text-xs text-ink/40 hover:text-ink/70 text-left"
      >
        ログアウト
      </button>
    </aside>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-ink/10 bg-white/95 backdrop-blur flex z-40">
      {ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 text-center py-3 text-xs font-medium ${
              active ? "text-accent" : "text-ink/50"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
