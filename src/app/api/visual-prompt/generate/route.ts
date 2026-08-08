export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { generateVisualPrompt } from "@/lib/ai/provider";
import { createServerSupabase } from "@/lib/supabase/server";
import { VisualStyle } from "@/lib/types";

// POST { seed_id, style } -> Visual Promptを生成しSeedに保存して返す
export async function POST(req: NextRequest) {
  const { seed_id, style } = (await req.json()) as {
    seed_id: string;
    style: VisualStyle;
  };
  if (!seed_id) {
    return NextResponse.json({ error: "seed_id は必須です" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data: seed, error: fetchErr } = await supabase
    .from("character_seeds")
    .select("*")
    .eq("id", seed_id)
    .single();
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

  try {
    const prompt = await generateVisualPrompt({
      name: seed.name,
      concept: seed.concept,
      personality: seed.personality,
      world: seed.world,
      visualKeywords: seed.visual_keywords,
      style: style ?? "DEFAULT",
    });

    const { data: updated, error: updateErr } = await supabase
      .from("character_seeds")
      .update({ visual_prompt: prompt, visual_style: style ?? "DEFAULT" })
      .eq("id", seed_id)
      .select()
      .single();
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    return NextResponse.json({ seed: updated });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Visual Prompt生成に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
