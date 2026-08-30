import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'dist');
const files = ['index.html', '404.html', 'styles.css', 'script.js', 'scene3d.js', 'effects.js', '.htaccess', 'robots.txt', 'sitemap.xml', 'assets'];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const file of files) {
  await cp(resolve(root, file), resolve(output, file), { recursive: true });
}

console.log('Namecheap-ready website created in dist/');
