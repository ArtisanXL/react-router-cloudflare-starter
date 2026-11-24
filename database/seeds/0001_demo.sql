-- Demo data for local development. Idempotent (INSERT OR IGNORE).
-- Login: demo@example.com / password123
INSERT OR IGNORE INTO "user" (id, name, email, email_verified)
VALUES ('seed-user-demo', 'Demo User', 'demo@example.com', 1);

INSERT OR IGNORE INTO account (id, account_id, provider_id, user_id, password)
VALUES ('seed-account-demo', 'seed-user-demo', 'credential', 'seed-user-demo',
        'pbkdf2$100000$U0GBKKgIwCLs8c2dGtCjKA==$gINHmEE1B2MAWPuSet+oIomhQy76G9fSWN4YaaJhaf4=');

INSERT OR IGNORE INTO posts (id, user_id, title, body, created_at, updated_at) VALUES
  ('00000000-0000-4000-8000-000000000001', 'seed-user-demo', 'Welcome to the starter',
   'This post was created by database/seeds/0001_demo.sql.', unixepoch() * 1000 - 2000, unixepoch() * 1000 - 2000),
  ('00000000-0000-4000-8000-000000000002', 'seed-user-demo', 'A second post',
   'Edit or delete me.', unixepoch() * 1000 - 1000, unixepoch() * 1000 - 1000);
