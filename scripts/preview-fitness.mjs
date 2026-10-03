// Local demo preview. Deliberately never serves runtime config or credentials.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';
const root = fileURLToPath(new URL('../app/', import.meta.url));
const types = {'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml'};
createServer(async (req,res) => {
  const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if (pathname === '/config.json') { res.writeHead(200,{'Content-Type':'application/json'}); res.end('{}'); return; }
  const file = resolve(root,`.` + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root.endsWith(sep) ? root : root+sep) || pathname.split('/').some(p => p.startsWith('.'))) {res.writeHead(403);res.end();return;}
  try { const data = await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data); }
  catch {res.writeHead(404);res.end();}
}).listen(5204,'127.0.0.1',() => console.log('Demo preview: http://127.0.0.1:5204/ (runtime config excluded)'));
