import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

/**
 * Offline support without a plugin dependency: after the build, writes sw.js
 * with the list of every built file and a version hash of their contents. The
 * service worker precaches that list and serves it cache-first.
 */
function offline(): Plugin {
  let publicDir = '';
  return {
    name: 'nearly-offline',
    apply: 'build',
    configResolved(c) {
      publicDir = c.publicDir;
    },
    generateBundle(_, bundle) {
      const hash = createHash('sha256');
      const files: string[] = [];
      for (const [name, out] of Object.entries(bundle)) {
        if (name.endsWith('.map')) continue;
        // Only the latin font subset; the rest (latin-ext) loads on demand.
        if (name.endsWith('.woff2') && !name.includes('-latin-wght')) continue;
        files.push('/' + name);
        hash.update(name);
        hash.update(out.type === 'chunk' ? out.code : typeof out.source === 'string' ? out.source : Buffer.from(out.source));
      }
      const walk = (dir: string): string[] =>
        readdirSync(dir).flatMap((f) => {
          const p = join(dir, f);
          return statSync(p).isDirectory() ? walk(p) : [p];
        });
      for (const p of walk(publicDir)) {
        const rel = relative(publicDir, p).replace(/\\/g, '/');
        if (rel.startsWith('.') || rel === 'version.txt') continue;
        files.push('/' + rel);
        hash.update(rel);
        hash.update(readFileSync(p));
      }
      files.sort();
      const version = hash.digest('hex').slice(0, 12);
      const template = readFileSync('src/sw.template.js', 'utf8');
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: template.replace('__VERSION__', version).replace('__FILES__', JSON.stringify(files)),
      });
    },
  };
}

export default defineConfig({
  worker: { format: 'es' },
  build: {
    target: 'es2022',
    // The .wasm and the worklet must stay separate files.
    assetsInlineLimit: 0,
  },
  plugins: [offline()],
});
