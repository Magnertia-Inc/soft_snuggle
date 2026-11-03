import type { PGlite } from "@electric-sql/pglite";

/**
 * The embedded database, used when DATABASE_URL is not set.
 *
 * It lives in its own module so the server can start it before taking any
 * request (see instrumentation.ts) without dragging node-postgres along.
 * Starting this WebAssembly build of Postgres in the middle of rendering a page
 * fails with "ArrayBuffer is not detachable and could not be cloned", because
 * the response is already streaming by then.
 */
const cache = globalThis as unknown as { __softSnugglePglite?: Promise<PGlite> };

// The old .data/pglite folder was corrupted (PGlite aborted on open); it is
// kept untouched as a backup and a fresh database is used instead.
const DB_FOLDER = "pglite-2";

/**
 * PGlite creates its own folder but not the parent, so .data has to exist
 * first. The module name is held in a variable and marked webpackIgnore so the
 * bundler leaves it alone: instrumentation.ts is compiled for the edge runtime
 * as well, and that build refuses node:fs even though this never runs there.
 */
async function ensureDataDir(dir: string) {
  const nodeFs = "node:fs";
  const { mkdirSync, existsSync, unlinkSync } = (await import(/* webpackIgnore: true */ nodeFs)) as typeof import("node:fs");
  mkdirSync(dir, { recursive: true });
  const pidFile = `${dir}/${DB_FOLDER}/postmaster.pid`;
  try {
    if (existsSync(pidFile)) {
      unlinkSync(pidFile);
    }
  } catch {}
}

export function getPglite(): Promise<PGlite> {
  cache.__softSnugglePglite ??= (async () => {
    // Forward slashes are fine on Windows too.
    const dataDir = `${process.cwd()}/.data`;
    await ensureDataDir(dataDir);
    const { PGlite } = await import("@electric-sql/pglite");
    return PGlite.create(`${dataDir}/${DB_FOLDER}`);
  })().catch((err) => {
    cache.__softSnugglePglite = undefined;
    throw err;
  });
  return cache.__softSnugglePglite;
}
