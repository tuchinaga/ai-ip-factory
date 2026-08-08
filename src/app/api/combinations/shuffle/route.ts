export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { SelectionMap } from "@/lib/types";

// POST { locked: Partial<SelectionMap> }
// LOCKされていないカテゴリだけ有効な単語からランダム選択し、新しい組み合わせを作る
export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const { locked = {} } = (await req.json()) as { locked: Partial<SelectionMap> };

  const { data: categories, error: catErr } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (catErr) return NextResponse.json({ error: catErr.message }, { status: 500 });

  const { data: words, error: wordErr } = await supabase
    .from("words")
    .select("*")
    .eq("enabled", true);
  if (wordErr) return NextResponse.json({ error: wordErr.message }, { status: 500 });

  const selection: SelectionMap = { ...locked } as SelectionMap;

  for (const cat of categories) {
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
