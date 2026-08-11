export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

const EDITABLE_FIELDS = [
  "name",
  "concept",
  "personality",
  "world",
  "philosophy",
  "story_seed",
  "visual_keywords",
  "visual_prompt",
  "visual_style",
  "status",
  "memo",
];

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("character_seeds")
    .select("*, images:character_images(*)")
    .eq("id", params.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) {
    return NextResponse.json(
      { error: "指定されたCharacter Seedは見つかりませんでした(既に削除されている可能性があります)" },
      { status: 404 }
    );
  }
  return NextResponse.json(
    { seed: data },
    { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" } }
  );
}

// PATCH: 全項目を人間が自由編集可能
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabase();
  const body = await req.json();

  const update: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) update[field] = body[field];
  }

  const { data, error } = await supabase
    .from("character_seeds")
    .update(update)
    .eq("id", params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ seed: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabase();
  const { error } = await supabase.from("character_seeds").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
