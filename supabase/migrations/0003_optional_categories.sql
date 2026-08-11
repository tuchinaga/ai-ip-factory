-- カテゴリを「必須」「任意」に区別できるようにする(ITEM枠などの追加のため)

alter table categories add column if not exists is_required boolean not null default true;

-- ITEMカテゴリーを任意枠として追加(既に存在する場合はスキップ)
insert into categories (key, label, sort_order, is_required) values
  ('item', 'ITEM', 4, false)
on conflict (key) do nothing;
