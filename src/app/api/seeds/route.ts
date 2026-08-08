export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

// GET ?status=KEEP&q=検索語 一覧取得(画像も含める)
export async function GET(req: NextRequest) {
  const supabase = createServerSupabase();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q");

  let query = supabase
    .from("character_seeds")
    .select("*, character_images(*)")
    .order("created_at", { ascending: false });

  if (status && status !== "ALL") {
    query = query.eq("status", status);
  }
  if (q) {
    // name / memo / source_words(テキスト検索) を横断
    query = query.or(
      `name.ilike.%${q}%,memo.ilike.%${q}%,concept.ilike.%${q}%`
    );
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(
    { seeds: data },
    { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" } }
  );
}

// POST 新規Character Seed作成(コンセプト選択 or Mutation選択の両方で使用)
export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const body = await req.json();

  const insertPayload = {
    name: body.name ?? "",
    source_words: body.source_words ?? {},
    combination_id: body.combination_id ?? null,
    concept: body.concept ?? "",
    personality: body.personality ?? "",
    world: body.world ?? "",
    philosophy: body.philosophy ?? "",
    story_seed: body.story_seed ?? "",
    visual_keywords: body.visual_keywords ?? "",
    status: body.status ?? "MAYBE",
    parent_seed_id: body.parent_seed_id ?? null,
  };

  const { data, error } = await supabase
    .from("character_seeds")
    .insert(insertPayload)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (body.parent_seed_id) {
    await supabase.from("seed_relationships").insert({
      parent_seed_id: body.parent_seed_id,
      child_seed_id: data.id,
      relation_type: "mutation",
    });
  }

  return NextResponse.json({ seed: data });
}
