-- character-images バケットの作成(Public読み取り許可)
insert into storage.buckets (id, name, public)
values ('character-images', 'character-images', true)
on conflict (id) do nothing;

-- Service Role Keyでのアップロードのみを想定するため、
-- 匿名からの書き込みは許可せず、公開読み取りのみ許可する
create policy "public read character-images"
  on storage.objects for select
  using (bucket_id = 'character-images');
