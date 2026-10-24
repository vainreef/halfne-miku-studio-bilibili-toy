// One-time semantic split; keeps existing vector contours, gradients and hidden overlaps.
import fs from 'node:fs';
const path=new URL('../art/source/whale-master.svg',import.meta.url);
let source=fs.readFileSync(path,'utf8');
const match=source.match(/<g id="rear-hair" data-node="hairBackCenter">([\s\S]*?)<\/g><!-- \/part -->/);
if(!match)throw Error('Merged rear hair not found (already split?)');
const sections=[['rear-central-curtain','hairBackCenter'],['rear-outer-left','hairOuterL'],['rear-outer-right','hairOuterR'],['rear-under-left','hairInnerL'],['rear-under-right','hairInnerR'],['rear-scalp','hairScalp'],['rear-flyaways-left','hairFlyL'],['rear-flyaways-right','hairFlyR']];
const parts=sections.map(([id,node])=>{
 const start=match[1].indexOf(`<g id="${id}"`);if(start<0)throw Error(id);
 const tags=/<\/?g\b[^>]*>/g;tags.lastIndex=start;let depth=0,end;
 for(let t;(t=tags.exec(match[1]));){depth+=t[0].startsWith('</')?-1:1;if(depth===0){end=tags.lastIndex;break}}
 return `<g id="${id}" data-node="${node}">${match[1].slice(match[1].indexOf('>',start)+1,end-4)}</g><!-- /part -->`;
});
source=source.replace(match[0],parts.join('\n'));
fs.writeFileSync(path,source);
