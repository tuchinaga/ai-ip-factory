export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

// GET: カテゴリ一覧 + 各カテゴリの単語一覧を返す
export async function GET() {
  const supabase = createServerSupabase();

  const { data: categories, error: catErr } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (catErr) return NextResponse.json({ error: catErr.message }, { status: 500 });

  const { data: words, error: wordErr } = await supabase
    .from("words")
    .select("*")
    .order("word", { ascending: true });
  if (wordErr) return NextResponse.json({ error: wordErr.message }, { status: 500 });

  return NextResponse.json({ categories, words });
}

// POST: 単語追加 { category_id, word } もしくはカテゴリ追加 { newCategory: { key, label } }
export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const body = await req.json();

  if (body.newCategory) {
    const { key, label } = body.newCategory;
    const { data: existing } = await supabase
      .from("categories")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1);
    const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1;

    const { data, error } = await supabase
      .from("categories")
      .insert({ key, label, sort_order: nextOrder })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ category: data });
  }

  const { category_id, word } = body;
  if (!category_id || !word) {
    return NextResponse.json({ error: "category_id と word は必須です" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("words")
    .insert({ category_id, word })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ word: data });
}
