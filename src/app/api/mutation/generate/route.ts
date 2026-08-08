export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { generateMutationCombinations } from "@/lib/ai/provider";
import { SelectionMap } from "@/lib/types";

// POST { seed_id, locked_keys: string[] } -> 一部要素を固定して新しい組み合わせ候補を生成
export async function POST(req: NextRequest) {
  const { seed_id, locked_keys } = (await req.json()) as {
    seed_id: string;
    locked_keys: string[];
  };
  if (!seed_id) {
    return NextResponse.json({ error: "seed_id は必須です" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data: seed, error: seedErr } = await supabase
    .from("character_seeds")
    .select("source_words")
    .eq("id", seed_id)
    .single();
  if (seedErr) return NextResponse.json({ error: seedErr.message }, { status: 500 });

  const sourceWords = (seed.source_words ?? {}) as SelectionMap;
  const allKeys = Object.keys(sourceWords);
  const lockedSet = new Set(locked_keys ?? []);
  const freeKeys = allKeys.filter((k) => !lockedSet.has(k));
  const lockedSelection: Partial<SelectionMap> = {};
  for (const k of allKeys) {
    if (lockedSet.has(k)) lockedSelection[k] = sourceWords[k];
  }

  const { data: categories, error: catErr } = await supabase
    .from("categories")
    .select("*");
  if (catErr) return NextResponse.json({ error: catErr.message }, { status: 500 });

  const { data: words, error: wordErr } = await supabase
    .from("words")
    .select("*")
    .eq("enabled", true);
  if (wordErr) return NextResponse.json({ error: wordErr.message }, { status: 500 });

  const wordPool: Record<string, string[]> = {};
  for (const key of freeKeys) {
    const cat = categories.find((c) => c.key === key);
    if (!cat) continue;
    wordPool[key] = words.filter((w) => w.category_id === cat.id).map((w) => w.word);
  }

  try {
    const combinations = await generateMutationCombinations({
      lockedSelection,
      freeCategoryKeys: freeKeys,
      wordPool,
      count: 3,
    });
    // 固定要素をマージして完全な組み合わせにする
    const full = combinations.map((c) => ({ ...lockedSelection, ...c }) as SelectionMap);
    return NextResponse.json({ combinations: full });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Mutation生成に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
