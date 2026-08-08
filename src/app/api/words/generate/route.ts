export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { generateWords } from "@/lib/ai/provider";

// POST { category_id, count? } -> AIでそのカテゴリの新しい単語候補を提案する(保存はしない)
export async function POST(req: NextRequest) {
  const { category_id, count } = (await req.json()) as {
    category_id: string;
    count?: number;
  };
  if (!category_id) {
    return NextResponse.json({ error: "category_id は必須です" }, { status: 400 });
  }

  const supabase = createServerSupabase();

  const { data: category, error: catErr } = await supabase
    .from("categories")
    .select("*")
    .eq("id", category_id)
    .single();
  if (catErr) return NextResponse.json({ error: catErr.message }, { status: 500 });

  const { data: existing, error: wordErr } = await supabase
    .from("words")
    .select("word")
    .eq("category_id", category_id);
  if (wordErr) return NextResponse.json({ error: wordErr.message }, { status: 500 });

  try {
    const words = await generateWords({
      categoryLabel: category.label,
      existingWords: (existing ?? []).map((w) => w.word),
      count: count ?? 10,
    });
    return NextResponse.json({ words });
  } catch (e) {
    const message = e instanceof Error ? e.message : "単語の生成に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
