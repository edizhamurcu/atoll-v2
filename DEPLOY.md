# Atoll v2 — deploy (172.18.0.247)

Stack: Next.js 16 (standalone) · PostgreSQL 17 · Redis 7 · Docker Compose. nginx (aaPanel) proxies `new.atollrentacar.com` → `127.0.0.1:3100`.

## First deploy
```bash
cd /srv/atoll/app && cp .env.example .env && chmod 600 .env   # set POSTGRES_PASSWORD
docker compose build
docker compose up -d db redis
docker compose run --rm tools npx prisma migrate deploy
docker compose run --rm tools npx tsx scripts/import-wp.ts /import/wp-export.json   # idempotent
docker compose up -d app
curl -s 127.0.0.1:3100/api/v1/health
```

## Update
```bash
git pull && docker compose build app tools && docker compose run --rm tools npx prisma migrate deploy && docker compose up -d app
```
Rollback: `git checkout <prev>` and repeat (migrations are additive; take `pg_dump` before destructive ones).

## Backup
`docker compose exec -T db pg_dump -U atoll atoll | gzip > /srv/atoll/backups/atoll-$(date +%F).sql.gz`

## Partner API key
Insert sha256 of the key into `ApiKey` (only the hash is stored), scopes e.g. `{fleet:read}`; clients send `Authorization: Bearer atl_<key>`.
