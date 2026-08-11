export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { SelectionMap } from "@/lib/types";

// POST { locked: Partial<SelectionMap>, enabledKeys?: string[] }
// enabledKeysが指定された場合はそのカテゴリのみ対象にする(任意カテゴリのON/OFF対応)。
// 省略された場合は必須カテゴリのみを対象にする。
// LOCKされていないカテゴリだけ有効な単語からランダム選択し、新しい組み合わせを作る
export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const { locked = {}, enabledKeys } = (await req.json()) as {
    locked: Partial<SelectionMap>;
    enabledKeys?: string[];
  };

  const { data: allCategories, error: catErr } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (catErr) return NextResponse.json({ error: catErr.message }, { status: 500 });

  const targetCategories = enabledKeys
    ? allCategories.filter((c) => enabledKeys.includes(c.key))
    : allCategories.filter((c) => c.is_required);

  const { data: words, error: wordErr } = await supabase
    .from("words")
    .select("*")
    .eq("enabled", true);
  if (wordErr) return NextResponse.json({ error: wordErr.message }, { status: 500 });

  const selection: SelectionMap = {};
  for (const [key, value] of Object.entries(locked)) {
    if (value) selection[key] = value;
  }

  for (const cat of targetCategories) {
    if (selection[cat.key]) continue; // ロック済みはそのまま
    const pool = words.filter((w) => w.category_id === cat.id);
    if (pool.length === 0) continue;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    selection[cat.key] = pick.word;
  }

  const { data: combination, error: comboErr } = await supabase
    .from("combinations")
    .insert({ selection })
    .select()
    .single();
  if (comboErr) return NextResponse.json({ error: comboErr.message }, { status: 500 });

  return NextResponse.json({ combination });
}
