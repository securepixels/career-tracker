create table certs (
  id uuid default gen_random_uuid() primary key,
  name text not null, issuer text, earned date, expires date,
  status text default 'active', score text, note text,
  created_at timestamptz default now()
);
create table training (
  id uuid default gen_random_uuid() primary key,
  name text not null, provider text, type text default 'course',
  completed date, note text, created_at timestamptz default now()
);
create table accomplishments (
  id uuid default gen_random_uuid() primary key,
  title text not null, date date, description text,
  created_at timestamptz default now()
);
alter table certs enable row level security;
create policy "Public read" on certs for select using (true);
create policy "Auth write" on certs for all using (auth.role() = 'authenticated');
alter table training enable row level security;
create policy "Public read" on training for select using (true);
create policy "Auth write" on training for all using (auth.role() = 'authenticated');
alter table accomplishments enable row level security;
create policy "Public read" on accomplishments for select using (true);
create policy "Auth write" on accomplishments for all using (auth.role() = 'authenticated');

-- Seed data (run after creating tables)
INSERT INTO certs (name, issuer, earned, expires, status) VALUES
  ('CompTIA CySA+', 'CompTIA', '2025-03-01', '2028-03-01', 'active'),
  ('CompTIA PenTest+', 'CompTIA', '2026-05-01', '2029-05-01', 'active'),
  ('(ISC)² CC', '(ISC)²', '2025-01-01', '2028-01-01', 'active'),
  ('GIAC GFACT', 'GIAC', '2025-02-01', '2029-02-01', 'active'),
  ('SC-500', 'Microsoft', NULL, NULL, 'scheduled');
UPDATE certs SET score = '815' WHERE name = 'CompTIA PenTest+';
UPDATE certs SET note = 'Oct 17, 2026' WHERE name = 'SC-500';

INSERT INTO training (name, provider, completed, type) VALUES
  ('D488 - Cybersecurity Architecture and Engineering', 'WGU', '2026-03-01', 'course'),
  ('D485 - Cybersecurity Management', 'WGU', '2026-06-01', 'course'),
  ('CertMaster Labs - Advanced Exploitation', 'CompTIA', '2026-03-01', 'lab'),
  ('MS Cybersecurity Capstone', 'WGU', NULL, 'course');

INSERT INTO accomplishments (title, date, description) VALUES
  ('Passed PenTest+ with 815', '2026-05-01', 'First attempt, no extensions needed.'),
  ('Built SourceSecured site', '2026-01-01', 'Next.js, TypeScript, and Tailwind.'),
  ('Nucleus Security coding challenge', '2026-03-01', 'Containerized Flask web service. Most technical candidate interviewed.'),
  ('SecurePixels portfolio launch', '2026-02-01', 'Jekyll, Chirpy theme, custom pixel branding.');
