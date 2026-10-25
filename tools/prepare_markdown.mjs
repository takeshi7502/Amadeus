// Vendor the pinned, self-contained browser parser. Production needs no npm/CDN.
import {readFile, readdir, mkdir, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(join(root, 'package.json'));
const output = join(root, 'src/amadeus/static/vendor');
const expected = JSON.parse(await readFile(join(root, 'package.json'), 'utf8')).devDependencies['markdown-it'];
const source = join(root, 'node_modules/markdown-it');
const metadata = JSON.parse(await readFile(join(source, 'package.json'), 'utf8'));
if (metadata.version !== expected) throw new Error('Run npm ci to install the pinned Markdown parser.');
const bundle = (await readFile(join(source, 'dist/browser/markdown-it.umd.min.js'), 'utf8'))
  .replace(/\n?\/\/# sourceMappingURL=.*$/m, '');
const notices = [];
const visited = new Set();
async function license(folder) {
  const pkg = JSON.parse(await readFile(join(folder, 'package.json'), 'utf8'));
  const key = pkg.name + '@' + pkg.version;
  if (visited.has(key)) return;
  visited.add(key);
  const files = (await readdir(folder)).filter(name => /^licen[sc]e(?:[.-].*)?$/i.test(name));
  notices.push(key + '\n' + (await Promise.all(files.map(name => readFile(join(folder, name), 'utf8')))).join('\n'));
  for (const name of Object.keys(pkg.dependencies || {})) {
    let dependency = dirname(require.resolve(name));
    while (JSON.parse(await readFile(join(dependency, 'package.json'), 'utf8').catch(() => '{}')).name !== name) {
      const parent = dirname(dependency);
      if (parent === dependency) throw new Error('Cannot locate license for ' + name);
      dependency = parent;
    }
    await license(dependency);
  }
}
await license(source);
await mkdir(output, {recursive: true});
await writeFile(join(output, 'markdown-it.min.js'), `/*! markdown-it ${metadata.version}; see markdown-it-LICENSE.txt */\n` + bundle);
await writeFile(join(output, 'markdown-it-LICENSE.txt'), notices.join('\n\n--------------------\n\n'));
console.log(`Prepared markdown-it ${metadata.version} and dependency licenses.`);
