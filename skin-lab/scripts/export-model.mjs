import {buildSync} from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
const lab=fileURLToPath(new URL('..',import.meta.url));
const result=buildSync({entryPoints:[path.join(lab,'scripts/standalone-entry.js')],bundle:true,format:'iife',globalName:'WhaleSkin',target:'es2020',minify:true,write:false});
const source='// Generated whale rig + vector assets. Host must invoke config.createSecondaryMotion().step(state, dt, physicsEnabled) for cloth/hair/IK; Skin Lab is the reference host.\n'+result.outputFiles[0].text+'\nconst mikuConfig = () => WhaleSkin.createWhaleModel();\n';
const out=path.join(lab,'art/generated/whale-model.js');fs.writeFileSync(out,source);
// Exercise the actual existing model importer, not a second replacement parser.
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'whale-import-'));
try{
 const check=buildSync({stdin:{contents:`import {parseModelJS} from ${JSON.stringify(path.join(lab,'../src/Engine/modelUtils.js'))}; import fs from 'node:fs'; const config=parseModelJS(fs.readFileSync(${JSON.stringify(out)},'utf8')); if(config.model.components[0].id!=='whaleTail')throw Error('Import mismatch');console.log('✓ Standalone model passes original parseModelJS importer');`,resolveDir:lab},bundle:true,platform:'node',format:'esm',write:false});
 const file=path.join(dir,'test.mjs');fs.writeFileSync(file,check.outputFiles[0].text);
 const {execFileSync}=await import('node:child_process');execFileSync(process.execPath,[file],{stdio:'inherit'});
}finally{fs.rmSync(dir,{recursive:true,force:true})}
console.log(`Wrote ${out} (${source.length} characters)`);
