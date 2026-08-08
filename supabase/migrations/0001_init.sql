-- AI IP Factory: initial schema

create extension if not exists "pgcrypto";

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,          -- 'theme' | 'trait' | 'motif' | 将来追加の 'place' 等
  label text not null,               -- 表示名 (例: THEME)
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists words (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  word text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_words_category on words(category_id);
create unique index if not exists idx_words_category_word_unique on words(category_id, word);

create table if not exists combinations (
  id uuid primary key default gen_random_uuid(),
  -- カテゴリkey -> 選ばれた単語 のJSON ( 例: {"theme":"環境破壊","trait":"泣き虫","motif":"ネコ"} )
  selection jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists character_seeds (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  -- 生成元の単語組み合わせ(カテゴリkey -> word)
  source_words jsonb not null default '{}'::jsonb,
  combination_id uuid references combinations(id) on delete set null,
  concept text not null default '',
  personality text not null default '',
  world text not null default '',
  philosophy text not null default '',
  story_seed text not null default '',
  visual_keywords text not null default '',
  visual_prompt text not null default '',
  visual_style text not null default 'DEFAULT',
  status text not null default 'MAYBE' check (status in ('KEEP','MAYBE','KILL')),
  memo text not null default '',
  parent_seed_id uuid references character_seeds(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_seeds_status on character_seeds(status);
create index if not exists idx_seeds_parent on character_seeds(parent_seed_id);

create table if not exists character_images (
  id uuid primary key default gen_random_uuid(),
  seed_id uuid not null references character_seeds(id) on delete cascade,
  image_url text not null,
  is_main boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_images_seed on character_images(seed_id);

-- Mutationの親子関係を明示的にも記録(character_seeds.parent_seed_idと併用可能な将来拡張用)
create table if not exists seed_relationships (
  id uuid primary key default gen_random_uuid(),
  parent_seed_id uuid not null references character_seeds(id) on delete cascade,
  child_seed_id uuid not null references character_seeds(id) on delete cascade,
  relation_type text not null default 'mutation',
  created_at timestamptz not null default now()
);

-- 内部ツール・少人数チーム利用のため、アプリ側のパスワード認証を前提にRLSは匿名フルアクセスを許可
alter table categories enable row level security;
alter table words enable row level security;
alter table combinations enable row level security;
alter table character_seeds enable row level security;
alter table character_images enable row level security;
alter table seed_relationships enable row level security;

create policy "anon full access" on categories for all using (true) with check (true);
create policy "anon full access" on words for all using (true) with check (true);
create policy "anon full access" on combinations for all using (true) with check (true);
create policy "anon full access" on character_seeds for all using (true) with check (true);
create policy "anon full access" on character_images for all using (true) with check (true);
create policy "anon full access" on seed_relationships for all using (true) with check (true);

-- updated_at自動更新
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_seeds_updated_at on character_seeds;
create trigger trg_seeds_updated_at before update on character_seeds
  for each row execute function set_updated_at();

-- 初期カテゴリ
insert into categories (key, label, sort_order) values
  ('theme', 'テーマ', 1),
  ('trait', '性格', 2),
  ('motif', 'モチーフ', 3)
on conflict (key) do nothing;
