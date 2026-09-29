# Versioning

Il versioning semantico manuale è stato dismesso (ROADMAP **M36**, 2026-09-29).

## Stato attuale

- `lib/version.ts` resta come **archivio**: `APP_VERSION` fermo a `1.77.0` (2026-01-25) e `VERSION_HISTORY` con lo
  storico fino a quella versione. Non va più aggiornato.
- `/changelog` legge `VERSION_HISTORY` dal bundle e mostra il commit della build corrente.
- `CHANGELOG.md` è lo storico testuale fino alla stessa data.
- Il nodo Firebase `changelog/` non è più letto né scritto dall'app.

## Identificazione dei rilasci

Ogni deploy è identificato dal commit della build (ROADMAP **M17**):

- `lib/buildVersion.ts`: `FRONTEND_BUILD_ID` da `NEXT_PUBLIC_BUILD_ID` (= `VERCEL_GIT_COMMIT_SHA` al build);
- `GET /api/version`: commit del frontend che risponde e del backend sul Pi (`/health`);
- `lib/hooks/useNewVersion.ts` + `NewVersionBanner`: se il commit deployato cambia, propone il reload.

La storia delle modifiche è quella dei commit (Conventional Commits con id della voce di `ROADMAP.md`).

## Cosa è stato rimosso

- `VersionContext`, `VersionEnforcer`, `ForceUpdateModal` (modal bloccante che confrontava `APP_VERSION` con Firebase);
- `lib/changelogService.ts`, route `/api/admin/sync-changelog`, `scripts/sync-changelog.sh`;
- il parametro `checkVersion` di `useStoveData`.
