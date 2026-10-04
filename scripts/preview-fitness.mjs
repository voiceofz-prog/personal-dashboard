// Local demo preview. Deliberately never serves runtime config or credentials.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';
const root = fileURLToPath(new URL('../app/', import.meta.url));
const qa = process.argv.includes('--qa');
const port = qa ? 5205 : 5204;
const types = {'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml'};
createServer(async (req,res) => {
  const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if (pathname === '/config.json') { res.writeHead(200,{'Content-Type':'application/json'}); res.end('{}'); return; }
  if (qa && pathname === '/qa-fixtures.js') {
    res.writeHead(200,{'Content-Type':'application/javascript','Cache-Control':'no-store'});
    res.end(await readFile(new URL('../tests/helpers/fitness-preview-fixtures.js',import.meta.url)));return;
  }
  const file = resolve(root,`.` + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root.endsWith(sep) ? root : root+sep) || pathname.split('/').some(p => p.startsWith('.'))) {res.writeHead(403);res.end();return;}
  try {
    let data = await readFile(file);
    if (qa && file === resolve(root,'index.html')) data=Buffer.from(data.toString().replace('</body>','<script src="qa-fixtures.js" defer></script></body>'));
    res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
  }
  catch {res.writeHead(404);res.end();}
}).listen(port,'127.0.0.1',() => console.log(`Demo preview: http://127.0.0.1:${port}/ (runtime config excluded${qa?', synthetic QA controls':''})`));
