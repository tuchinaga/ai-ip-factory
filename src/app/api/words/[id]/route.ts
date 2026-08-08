export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

// PATCH: 単語の編集 / enabled切り替え { word?, enabled? }
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabase();
  const body = await req.json();

  const update: Record<string, unknown> = {};
  if (typeof body.word === "string") update.word = body.word;
  if (typeof body.enabled === "boolean") update.enabled = body.enabled;

  const { data, error } = await supabase
    .from("words")
    .update(update)
    .eq("id", params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ word: data });
}

// DELETE: 単語削除
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabase();
  const { error } = await supabase.from("words").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
