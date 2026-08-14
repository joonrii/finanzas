"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const items = [
  { href: "/resumen", label: "Resumen", icon: "◎" },
  { href: "/movimientos", label: "Movimientos", icon: "≡" },
  { href: "/analizar", label: "Analizar", icon: "◈" },
  { href: "/cuentas", label: "Cuentas", icon: "▦" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur border-t border-border safe-bottom z-40">
      <div className="max-w-md mx-auto flex items-center justify-between px-2 relative">
        {items.slice(0, 2).map((item) => (
          <NavLink key={item.href} item={item} active={pathname === item.href} />
        ))}

        <Link
          href="/movimientos/nuevo"
          aria-label="Añadir movimiento"
          className="flex items-center justify-center w-14 h-14 rounded-full bg-positive text-base text-2xl font-semibold -mt-6 shadow-lg shadow-positive/20 shrink-0"
        >
          +
        </Link>

        {items.slice(2).map((item) => (
          <NavLink key={item.href} item={item} active={pathname === item.href} />
        ))}
      </div>
    </nav>
  );
}

function NavLink({
  item,
  active,
}: {
  item: { href: string; label: string; icon: string };
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={clsx(
        "flex flex-col items-center gap-0.5 py-3 px-4 text-xs",
        active ? "text-positive" : "text-muted"
      )}
    >
      <span className="text-lg leading-none">{item.icon}</span>
      {item.label}
    </Link>
  );
}
