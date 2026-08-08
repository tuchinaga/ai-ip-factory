export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

// PATCH { is_main: true } -> このSeed内の他画像のis_mainを解除し、この画像をMainにする
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabase();
  const { is_main } = await req.json();

  const { data: image, error: fetchErr } = await supabase
    .from("character_images")
    .select("seed_id")
    .eq("id", params.id)
    .single();
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

  if (is_main) {
    await supabase
      .from("character_images")
      .update({ is_main: false })
      .eq("seed_id", image.seed_id);
  }

  const { data, error } = await supabase
    .from("character_images")
    .update({ is_main: !!is_main })
    .eq("id", params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ image: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabase();
  const { error } = await supabase.from("character_images").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
