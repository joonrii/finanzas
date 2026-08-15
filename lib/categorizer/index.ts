import { createClient } from "@/lib/supabase/client";
import { guessCategoryName } from "@/lib/importers/categorize";

type SupabaseClient = ReturnType<typeof createClient>;

export type CategorySuggestion = {
  categoryId: string | null;
  accountId: string | null;
  source: "rule" | "keyword" | null;
};

// Convierte un texto libre de movimiento en un "patrón de comercio"
// normalizado y corto, para poder guardarlo/compararlo como regla.
// Ej: "MERCADONA 2451 BILBAO" -> "MERCADONA"
export function extractMerchantPattern(text: string): string {
  const cleaned = text
    .toUpperCase()
    .replace(/[^A-ZÀ-ÚÑ0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = cleaned.split(" ").filter((w) => w.length > 1 && !/^\d+$/.test(w));
  return words.slice(0, 2).join(" ").slice(0, 40);
}

// Orden de prioridad, tal como se pidió:
// 1. Regla personalizada del usuario (merchant_rules)
// 2. Heurística de palabras clave conocidas
// 3. (futuro) IA como fallback
export async function suggestCategory(
  supabase: SupabaseClient,
  text: string,
  categories: { id: string; name: string }[]
): Promise<CategorySuggestion> {
  if (!text.trim()) return { categoryId: null, accountId: null, source: null };

  const normalized = text.toUpperCase();

  const { data: rules } = await supabase
    .from("merchant_rules")
    .select("merchant_pattern, category_id, suggested_account_id, match_count")
    .order("match_count", { ascending: false });

  const matchingRule = (rules ?? []).find((r) =>
    normalized.includes(r.merchant_pattern)
  );

  if (matchingRule) {
    return {
      categoryId: matchingRule.category_id,
      accountId: matchingRule.suggested_account_id,
      source: "rule",
    };
  }

  const guessedName = guessCategoryName(text);
  if (guessedName) {
    const category = categories.find((c) => c.name === guessedName);
    if (category) {
      return { categoryId: category.id, accountId: null, source: "keyword" };
    }
  }

  return { categoryId: null, accountId: null, source: null };
}

// Guarda o refuerza una regla a partir de una categorización confirmada
// por el usuario (manual o al revisar una importación).
export async function learnFromMerchant(
  supabase: SupabaseClient,
  userId: string,
  text: string,
  categoryId: string,
  accountId?: string | null
) {
  const pattern = extractMerchantPattern(text);
  if (!pattern) return;

  const { data: existing } = await supabase
    .from("merchant_rules")
    .select("id, match_count")
    .eq("merchant_pattern", pattern)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("merchant_rules")
      .update({
        category_id: categoryId,
        suggested_account_id: accountId ?? null,
        match_count: existing.match_count + 1,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("merchant_rules").insert({
      user_id: userId,
      merchant_pattern: pattern,
      category_id: categoryId,
      suggested_account_id: accountId ?? null,
      match_count: 1,
    });
  }
}
