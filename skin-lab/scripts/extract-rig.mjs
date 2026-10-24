import fs from 'node:fs';
import crypto from 'node:crypto';
const source=fs.readFileSync(new URL('../../src/defaultModel.js',import.meta.url),'utf8');
const skeleton=source.replaceAll(/"data:image\/svg\+xml[^"\n]*"/g,'""')
 .replace('from "./Engine/modelUtils"','from "../../../src/Engine/modelUtils.js"')
 .replace('export default mikuConfig();','export default mikuConfig;');
fs.writeFileSync(new URL('../src/whale/baseRig.js',import.meta.url),'// GENERATED: independent original motion factory; images omitted.\n'+skeleton);
fs.writeFileSync(new URL('../art/rig/baseline.json',import.meta.url),JSON.stringify({source:'src/defaultModel.js',sha256:crypto.createHash('sha256').update(source).digest('hex'),policy:'Existing particle constants preserved. Geometry-only changes in rig.js.'},null,2)+'\n');
