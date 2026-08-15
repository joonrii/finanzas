"use client";

import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { guessCategoryName } from "@/lib/importers/categorize";
import { buildDedupeHash } from "@/lib/importers/dedupe";
import type { Account, Category } from "@/types";

type Step = "cargando" | "subir" | "mapear" | "revisar";

type ParsedRow = {
  key: number;
  date: string;
  description: string;
  amount: number;
  isDuplicate: boolean;
  include: boolean;
  categoryId: string | null;
};

export default function ImportarPage() {
  const supabase = createClient();
  const router = useRouter();

  const [step, setStep] = useState<Step>("cargando");
  const [accounts, setAccounts] = useState<
    Pick<Account, "id" | "name">[]
  >([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accountId, setAccountId] = useState("");

  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [dateCol, setDateCol] = useState("");
  const [descCol, setDescCol] = useState("");
  const [amountCol, setAmountCol] = useState("");

  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const [{ data: acc }, { data: cats }] = await Promise.all([
        supabase
          .from("accounts")
          .select("id, name")
          .eq("is_archived", false)
          .order("created_at"),
        supabase
          .from("categories")
          .select("id, name, icon, kind")
          .eq("is_archived", false),
      ]);
      setAccounts(acc ?? []);
      setCategories((cats as Category[]) ?? []);
      if (acc && acc.length > 0) setAccountId(acc[0].id);
      setStep("subir");
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFile(file: File) {
    setError(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const cols = results.meta.fields ?? [];
        if (cols.length === 0 || results.data.length === 0) {
          setError("No se ha podido leer el CSV. Comprueba el archivo.");
          return;
        }
        setHeaders(cols);
        setRawRows(results.data);
        setDateCol(guessColumn(cols, ["fecha", "date", "f. valor"]));
        setDescCol(
          guessColumn(cols, ["concepto", "descripción", "descripcion", "detalle"])
        );
        setAmountCol(guessColumn(cols, ["importe", "amount", "cantidad"]));
        setStep("mapear");
      },
      error: () => setError("No se ha podido leer el CSV."),
    });
  }

  async function handleContinueFromMapping() {
    if (!dateCol || !descCol || !amountCol) {
      setError("Selecciona las 3 columnas antes de continuar.");
      return;
    }
    setError(null);

    const parsed = rawRows
      .map((r, i) => {
        const rawAmount = (r[amountCol] ?? "")
          .replace(/\./g, "")
          .replace(",", ".")
          .replace(/[^\d.-]/g, "");
        const amount = parseFloat(rawAmount);
        const date = normalizeDate(r[dateCol] ?? "");
        const description = (r[descCol] ?? "").trim();

        return {
          key: i,
          date,
          description,
          amount,
        };
      })
      .filter((r) => r.date && !isNaN(r.amount) && r.description);

    if (parsed.length === 0) {
      setError(
        "No se ha podido interpretar ninguna fila. Revisa las columnas seleccionadas."
      );
      return;
    }

    // Comprueba duplicados contra lo ya importado antes
    const { data: existing } = await supabase
      .from("imported_transactions")
      .select("dedupe_hash");
    const existingHashes = new Set((existing ?? []).map((e) => e.dedupe_hash));

    const withDuplicates: ParsedRow[] = parsed.map((r) => {
      const hash = buildDedupeHash({
        accountId,
        date: r.date,
        amount: r.amount,
        description: r.description,
      });
      const isDuplicate = existingHashes.has(hash);
      const guessedName = guessCategoryName(r.description);
      const guessedCategory = guessedName
        ? categories.find((c) => c.name === guessedName)?.id ?? null
        : null;

      return {
        ...r,
        isDuplicate,
        include: !isDuplicate,
        categoryId: guessedCategory,
      };
    });

    setRows(withDuplicates);
    setStep("revisar");
  }

  const newCount = rows.filter((r) => !r.isDuplicate).length;
  const duplicateCount = rows.filter((r) => r.isDuplicate).length;
  const includedCount = rows.filter((r) => r.include).length;

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.kind === "expense"),
    [categories]
  );
  const incomeCategories = useMemo(
    () => categories.filter((c) => c.kind === "income"),
    [categories]
  );

  async function handleConfirmImport() {
    setSaving(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Sesión no válida, vuelve a entrar.");
      setSaving(false);
      return;
    }

    const { data: batch, error: batchError } = await supabase
      .from("import_batches")
      .insert({
        user_id: user.id,
        account_id: accountId,
        importer: "generic",
        total_rows: rows.length,
        new_rows: newCount,
        duplicate_rows: duplicateCount,
        status: "reviewing",
      })
      .select()
      .single();

    if (batchError || !batch) {
      setError(batchError?.message ?? "No se pudo crear el lote de importación.");
      setSaving(false);
      return;
    }

    const toImport = rows.filter((r) => r.include);
    let balanceDelta = 0;

    for (const row of toImport) {
      const type = row.amount < 0 ? "expense" : "income";
      const absoluteAmount = Math.abs(row.amount);

      const hash = buildDedupeHash({
        accountId,
        date: row.date,
        amount: row.amount,
        description: row.description,
      });

      const { data: importedRow } = await supabase
        .from("imported_transactions")
        .insert({
          batch_id: batch.id,
          user_id: user.id,
          raw_date: row.date,
          raw_description: row.description,
          raw_amount: row.amount,
          dedupe_hash: hash,
          is_duplicate: false,
          suggested_category_id: row.categoryId,
          suggested_type: type,
          status: "confirmed",
        })
        .select()
        .single();

      const { data: transaction } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          account_id: accountId,
          type,
          category_id: row.categoryId,
          amount: absoluteAmount,
          description: row.description,
          merchant: row.description,
          occurred_on: row.date,
          source: "import",
          imported_transaction_id: importedRow?.id ?? null,
        })
        .select()
        .single();

      if (importedRow && transaction) {
        await supabase
          .from("imported_transactions")
          .update({ resulting_transaction_id: transaction.id })
          .eq("id", importedRow.id);
      }

      balanceDelta += type === "income" ? absoluteAmount : -absoluteAmount;
    }

    if (toImport.length > 0) {
      const { data: account } = await supabase
        .from("accounts")
        .select("calculated_balance")
        .eq("id", accountId)
        .single();
      if (account) {
        await supabase
          .from("accounts")
          .update({
            calculated_balance: Number(account.calculated_balance) + balanceDelta,
          })
          .eq("id", accountId);
      }
    }

    await supabase
      .from("import_batches")
      .update({ status: "completed" })
      .eq("id", batch.id);

    setSaving(false);
    router.push("/movimientos");
    router.refresh();
  }

  if (step === "cargando") {
    return <p className="text-muted text-sm">Cargando…</p>;
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-medium">Importar movimientos</h1>
        <div className="bg-surface border border-border rounded-2xl p-6 text-center">
          <p className="text-muted text-sm mb-4">
            Necesitas al menos una cuenta antes de importar.
          </p>
          <Link
            href="/cuentas/nueva"
            className="inline-block bg-positive text-base font-medium rounded-xl px-5 py-2.5 text-sm"
          >
            Añadir una cuenta
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-medium">Importar movimientos</h1>

      {step === "subir" && (
        <>
          <div>
            <label className="text-sm text-muted mb-1 block">Cuenta</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-base text-white outline-none focus:border-positive"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <label className="bg-surface border border-dashed border-border rounded-2xl p-8 text-center cursor-pointer">
            <p className="text-sm mb-1">Sube el CSV descargado del banco</p>
            <p className="text-muted text-xs">Toca para elegir el archivo</p>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </label>

          {error && <p className="text-negative text-sm">{error}</p>}
        </>
      )}

      {step === "mapear" && (
        <>
          <p className="text-muted text-sm">
            {rawRows.length} filas detectadas. Confirma qué columna es cada
            cosa (lo hemos adivinado, pero revísalo).
          </p>

          <ColumnSelect
            label="Columna de fecha"
            headers={headers}
            value={dateCol}
            onChange={setDateCol}
          />
          <ColumnSelect
            label="Columna de descripción / concepto"
            headers={headers}
            value={descCol}
            onChange={setDescCol}
          />
          <ColumnSelect
            label="Columna de importe"
            headers={headers}
            value={amountCol}
            onChange={setAmountCol}
          />

          <p className="text-muted text-xs">
            Se asume que los importes negativos son gastos y los positivos
            ingresos (formato habitual de los bancos).
          </p>

          {error && <p className="text-negative text-sm">{error}</p>}

          <button
            onClick={handleContinueFromMapping}
            className="bg-positive text-base font-medium rounded-xl py-3"
          >
            Continuar
          </button>
        </>
      )}

      {step === "revisar" && (
        <>
          <div className="bg-surface border border-border rounded-2xl p-4 flex gap-4">
            <div className="flex-1">
              <p className="money text-lg font-semibold">{newCount}</p>
              <p className="text-muted text-xs">nuevos</p>
            </div>
            <div className="flex-1">
              <p className="money text-lg font-semibold text-muted">
                {duplicateCount}
              </p>
              <p className="text-muted text-xs">posibles duplicados</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
            {rows.map((row) => (
              <div
                key={row.key}
                className={
                  "bg-surface border rounded-xl px-4 py-3 " +
                  (row.isDuplicate ? "border-border opacity-50" : "border-border")
                }
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate">{row.description}</p>
                    <p className="text-muted text-xs">
                      {row.date}
                      {row.isDuplicate && " · posible duplicado"}
                    </p>
                  </div>
                  <p
                    className={
                      "money text-sm font-medium shrink-0 " +
                      (row.amount >= 0 ? "text-positive" : "text-white")
                    }
                  >
                    {row.amount >= 0 ? "+" : ""}
                    {row.amount.toFixed(2)} €
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <select
                    value={row.categoryId ?? ""}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r) =>
                          r.key === row.key
                            ? { ...r, categoryId: e.target.value || null }
                            : r
                        )
                      )
                    }
                    className="flex-1 bg-surface2 border border-border rounded-lg px-2 py-1.5 text-xs text-white outline-none"
                  >
                    <option value="">Sin categoría</option>
                    {(row.amount >= 0 ? incomeCategories : expenseCategories).map(
                      (c) => (
                        <option key={c.id} value={c.id}>
                          {c.icon} {c.name}
                        </option>
                      )
                    )}
                  </select>

                  <label className="flex items-center gap-1.5 text-xs text-muted shrink-0">
                    <input
                      type="checkbox"
                      checked={row.include}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r) =>
                            r.key === row.key
                              ? { ...r, include: e.target.checked }
                              : r
                          )
                        )
                      }
                    />
                    Importar
                  </label>
                </div>
              </div>
            ))}
          </div>

          {error && <p className="text-negative text-sm">{error}</p>}

          <button
            onClick={handleConfirmImport}
            disabled={saving || includedCount === 0}
            className="bg-positive text-base font-medium rounded-xl py-3 disabled:opacity-50"
          >
            {saving
              ? "Importando…"
              : `Importar ${includedCount} movimiento(s)`}
          </button>
        </>
      )}
    </div>
  );
}

function ColumnSelect({
  label,
  headers,
  value,
  onChange,
}: {
  label: string;
  headers: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-sm text-muted mb-1 block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-base text-white outline-none focus:border-positive"
      >
        <option value="">Selecciona una columna</option>
        {headers.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
    </div>
  );
}

function guessColumn(cols: string[], candidates: string[]) {
  const found = cols.find((c) =>
    candidates.some((cand) => c.toLowerCase().includes(cand))
  );
  return found ?? "";
}

function normalizeDate(raw: string): string {
  const trimmed = raw.trim();
  // Ya viene en formato ISO (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  // Formato español habitual DD/MM/YYYY o DD-MM-YYYY
  const match = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (match) {
    const [, d, m, y] = match;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return "";
}
