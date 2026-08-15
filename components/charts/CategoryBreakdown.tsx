"use client";

type CategoryTotal = {
  name: string;
  icon: string;
  total: number;
};

export function CategoryBreakdown({
  categories,
}: {
  categories: CategoryTotal[];
}) {
  if (categories.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-5">
        <p className="text-sm font-medium mb-1">Gastos por categoría</p>
        <p className="text-muted text-sm">
          Todavía no hay gastos este mes.
        </p>
      </div>
    );
  }

  const max = Math.max(...categories.map((c) => c.total));

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <p className="text-sm font-medium mb-4">Gastos por categoría</p>
      <div className="flex flex-col gap-3">
        {categories.map((c) => (
          <div key={c.name}>
            <div className="flex justify-between text-sm mb-1">
              <span className="flex items-center gap-1.5">
                <span>{c.icon}</span>
                {c.name}
              </span>
              <span className="money text-muted">{c.total.toFixed(2)} €</span>
            </div>
            <div className="h-1.5 bg-surface2 rounded-full overflow-hidden">
              <div
                className="h-full bg-positive rounded-full"
                style={{ width: `${(c.total / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
