import {buildSync} from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const lab=fileURLToPath(new URL('..',import.meta.url));process.chdir(path.dirname(lab));
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'whale-test-'));
try{
 const out=path.join(dir,'test.mjs');
 buildSync({entryPoints:[path.join(lab,'scripts/validate-rig-entry.js')],bundle:true,platform:'node',format:'esm',outfile:out});
 execFileSync(process.execPath,[out],{stdio:'inherit'});
 execFileSync('python3',['-c',`import xml.etree.ElementTree as E\nfrom pathlib import Path\nfiles=list(Path('skin-lab/art/generated').glob('*.svg'))+[Path('skin-lab/art/source/whale-master.svg')]\nfor f in files:E.parse(f)\nprint(f'✓ {len(files)} SVG files parsed successfully')`],{stdio:'inherit'});
}finally{fs.rmSync(dir,{recursive:true,force:true})}
