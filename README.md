# PostureDock

PostureDock es un MVP de seguimiento de postura con webcam. Permite iniciar sesiones libres, detectar desviaciones en vivo, guardar historial local o en Supabase, abrir reportes en modal y exportarlos a PDF.

## Stack

- Next.js 16
- React 19
- Tailwind CSS v4
- Supabase opcional para auth e historial remoto
- Vitest para dominio
- Playwright CLI para e2e
- GitHub Actions para CI
- Vercel para deploy gratis

## Scripts

```bash
pnpm dev
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

## Variables de entorno

Configura Supabase solo si quieres auth y sync remoto:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
```

## CI/CD con GitHub Actions y Vercel

1. Crea un proyecto en Vercel conectado a este repo.
2. Obtiene `VERCEL_PROJECT_ID` y `VERCEL_ORG_ID` con `pnpm exec vercel link`.
3. Agrega estos secrets en GitHub:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
4. El pipeline vive en `.github/workflows/pipeline.yml`.
5. El job `quality` corre typecheck, unit tests, Playwright y build.
6. Un push a una rama distinta de `main` crea Preview Deployment en Vercel.
7. Un push a `main` crea Production Deployment en Vercel.

## Playwright

El proyecto usa el CLI de Playwright con un smoke test del workspace principal:

```bash
pnpm playwright:install
pnpm test:e2e
```

## Traducciones

Todo el copy de la app vive en `src/translations/es.ts`.
