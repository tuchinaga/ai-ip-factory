export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { v4 as uuid } from "uuid";

const BUCKET = "character-images";

// POST multipart/form-data: file, seed_id, is_main("true"|"false")
export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const form = await req.formData();

  const file = form.get("file") as File | null;
  const seedId = form.get("seed_id") as string | null;
  const isMain = form.get("is_main") === "true";

  if (!file || !seedId) {
    return NextResponse.json({ error: "file と seed_id は必須です" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "png";
  const path = `${seedId}/${uuid()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false });
  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const imageUrl = publicUrlData.publicUrl;

  if (isMain) {
    // 他の画像のis_mainを解除してから、新しい画像をMainに設定
    await supabase.from("character_images").update({ is_main: false }).eq("seed_id", seedId);
  }

  const { data, error } = await supabase
    .from("character_images")
    .insert({ seed_id: seedId, image_url: imageUrl, is_main: isMain })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ image: data });
}
