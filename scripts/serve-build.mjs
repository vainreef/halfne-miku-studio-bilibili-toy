import http from 'node:http';import fs from 'node:fs/promises';import path from 'node:path';
export async function serveBuild(port,dir='build-toy'){
 const root=path.resolve(dir),server=http.createServer(async(req,res)=>{try{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
  if(!file.startsWith(root+path.sep))throw Error('Invalid path');
  res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));
 }catch{res.writeHead(404).end()}});
 await new Promise(r=>server.listen(port,'127.0.0.1',r));return()=>new Promise(r=>server.close(r));
}
