export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerSupabase();

  const [combinations, seeds, keep, maybe, kill, recent] = await Promise.all([
    supabase.from("combinations").select("id", { count: "exact", head: true }),
    supabase.from("character_seeds").select("id", { count: "exact", head: true }),
    supabase
      .from("character_seeds")
      .select("id", { count: "exact", head: true })
      .eq("status", "KEEP"),
    supabase
      .from("character_seeds")
      .select("id", { count: "exact", head: true })
      .eq("status", "MAYBE"),
    supabase
      .from("character_seeds")
      .select("id", { count: "exact", head: true })
      .eq("status", "KILL"),
    supabase
      .from("character_seeds")
      .select("*, character_images(*)")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  // CONCEPTS GENERATEDはAI呼び出し回数を厳密に記録していないため、
  // 実用上の近似値としてcombinations件数(=1回のGENERATE CONCEPTSにつき1件)を代用する
  return NextResponse.json(
    {
      totalCombinations: combinations.count ?? 0,
      conceptsGenerated: combinations.count ?? 0,
      characterSeeds: seeds.count ?? 0,
      keep: keep.count ?? 0,
      maybe: maybe.count ?? 0,
      kill: kill.count ?? 0,
      recent: recent.data ?? [],
    },
    { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" } }
  );
}
