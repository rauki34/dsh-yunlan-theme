/**
 * dsh-yunlan-theme — host half.
 *
 * Serves the packaged stylesheet and its artwork from the DSH HTTP server so the
 * client half can link them with plain same-origin URLs. Nothing is written to
 * disk and nothing leaves the machine.
 */
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const inject = ['webServer'];

const HERE = dirname(fileURLToPath(import.meta.url));
const STYLESHEET = join(HERE, 'theme.css');
const GUEST_CSS = join(HERE, 'guest.css');
const ARTWORK = join(HERE, 'assets', 'portrait-corner.webp');
const GUEST_ART = join(HERE, 'assets', 'guest', 'dafeiyu.webp');

const ROUTES = {
  '/dsh-yunlan/theme.css': { file: STYLESHEET, type: 'text/css; charset=utf-8' },
  '/dsh-yunlan/guest.css': { file: GUEST_CSS, type: 'text/css; charset=utf-8' },
  // 两个扩展名指向同一份 WebP，改素材时不必重启宿主
  '/dsh-yunlan/portrait.webp': { file: ARTWORK, type: 'image/webp' },
  '/dsh-yunlan/portrait.png': { file: ARTWORK, type: 'image/webp' },
  '/dsh-yunlan/guest/dafeiyu.webp': { file: GUEST_ART, type: 'image/webp' },
};

export function apply(ctx) {
  const webServer = ctx.webServer;
  if (!webServer || typeof webServer.register !== 'function') return;

  const offs = [];
  for (const [route, spec] of Object.entries(ROUTES)) {
    offs.push(webServer.register({
      kind: 'exact',
      path: route,
      handler: async (req, res) => {
        if ((req.method || 'GET').toUpperCase() !== 'GET') {
          res.statusCode = 405;
          res.setHeader('Allow', 'GET');
          res.end();
          return;
        }
        try {
          const body = await readFile(spec.file);
          res.statusCode = 200;
          res.setHeader('Content-Type', spec.type);
          res.setHeader('Cache-Control', 'no-cache');
          res.end(body);
        } catch {
          res.statusCode = 404;
          res.end();
        }
      },
    }));
  }

  if (typeof ctx.effect === 'function') {
    ctx.effect(() => () => {
      for (const off of offs) if (typeof off === 'function') off();
    });
  }
}
