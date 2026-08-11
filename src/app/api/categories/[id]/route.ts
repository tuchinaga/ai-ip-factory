export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

// PATCH { is_required?: boolean, label?: string }
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabase();
  const body = await req.json();

  const update: Record<string, unknown> = {};
  if (typeof body.is_required === "boolean") update.is_required = body.is_required;
  if (typeof body.label === "string") update.label = body.label;

  const { data, error } = await supabase
    .from("categories")
    .update(update)
    .eq("id", params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data });
}
