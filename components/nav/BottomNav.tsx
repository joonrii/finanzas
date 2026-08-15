"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Home, ReceiptText, BarChart3, Wallet, Plus } from "lucide-react";

const items = [
  { href: "/resumen", label: "Resumen", icon: Home },
  { href: "/movimientos", label: "Movimientos", icon: ReceiptText },
  { href: "/analizar", label: "Analizar", icon: BarChart3 },
  { href: "/cuentas", label: "Cuentas", icon: Wallet },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 safe-bottom">
      {/* Línea superior sutil */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      
      <div className="bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/[0.04]">
        <div className="max-w-md mx-auto grid grid-cols-5 items-end px-2 pb-2 pt-1">
          {items.slice(0, 2).map((item) => (
            <NavLink key={item.href} item={item} active={pathname === item.href} />
          ))}

          {/* Botón + flotante */}
          <div className="flex justify-center -mt-5">
            <Link
              href="/movimientos/nuevo"
              aria-label="Añadir movimiento"
              className="group relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-black shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all duration-300 hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] hover:scale-110 active:scale-95"
            >
              <Plus className="w-7 h-7 transition-transform duration-300 group-hover:rotate-90" strokeWidth={2.5} />
            </Link>
          </div>

          {items.slice(2).map((item) => (
            <NavLink key={item.href} item={item} active={pathname === item.href} />
          ))}
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  item,
  active,
}: {
  item: { href: string; label: string; icon: React.ElementType };
  active: boolean;
}) {
  const Icon = item.icon;
  
  return (
    <Link
      href={item.href}
      className={clsx(
        "flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl transition-all duration-300",
        active ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300"
      )}
    >
      <div className="relative">
        <Icon 
          className={clsx(
            "w-5 h-5 transition-all duration-300",
            active ? "scale-110" : "scale-100"
          )} 
          strokeWidth={active ? 2.5 : 1.5} 
        />
        {/* Punto indicador cuando está activo */}
        {active && (
          <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400 animate-fade-in-up" />
        )}
      </div>
      <span className={clsx(
        "text-[10px] font-medium transition-all duration-300",
        active ? "font-semibold" : ""
      )}>
        {item.label}
      </span>
    </Link>
  );
}
