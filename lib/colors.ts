// Asigna un color estable a cada categoría/comercio a partir de su nombre,
// para que los iconos tengan un fondo de color reconocible en vez de ir
// todos igual sobre gris.

const PALETTE = [
  { bg: "bg-emerald-500/15", text: "text-emerald-400", bar: "bg-emerald-400" },
  { bg: "bg-sky-500/15", text: "text-sky-400", bar: "bg-sky-400" },
  { bg: "bg-amber-500/15", text: "text-amber-400", bar: "bg-amber-400" },
  { bg: "bg-fuchsia-500/15", text: "text-fuchsia-400", bar: "bg-fuchsia-400" },
  { bg: "bg-rose-500/15", text: "text-rose-400", bar: "bg-rose-400" },
  { bg: "bg-violet-500/15", text: "text-violet-400", bar: "bg-violet-400" },
  { bg: "bg-orange-500/15", text: "text-orange-400", bar: "bg-orange-400" },
  { bg: "bg-cyan-500/15", text: "text-cyan-400", bar: "bg-cyan-400" },
];

export function colorForLabel(label: string) {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash << 5) - hash + label.charCodeAt(i);
    hash |= 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
