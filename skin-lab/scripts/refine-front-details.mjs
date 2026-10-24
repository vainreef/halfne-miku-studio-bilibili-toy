// Rebuild only front garment details from reference-visible contours.
// Independent vector nodes and hidden joint overlaps remain intact.
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {traceContours,curvePath} from './vector-contours.mjs';
const lab=fileURLToPath(new URL('..',import.meta.url));
const src='data:image/png;base64,'+(await fs.readFile(`${lab}/../public/assets/whale-girl.png`)).toString('base64');
const browser=await chromium.launch({channel:'chrome',headless:true});let pixels;
try{const page=await browser.newPage();const encoded=await page.evaluate(async src=>{const i=new Image();i.src=src;await i.decode();const c=document.createElement('canvas');c.width=c.height=1254;const a=c.getContext('2d');a.drawImage(i,0,0);const d=a.getImageData(0,0,1254,1254).data;let raw='';for(let k=0;k<d.length;k+=32768)raw+=String.fromCharCode(...d.subarray(k,k+32768));return btoa(raw)},src);pixels=Buffer.from(encoded,'base64')}finally{await browser.close()}
const inside=(x,y,p)=>{let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes}return yes};
const area=p=>Math.abs(p.reduce((s,v,i)=>{const q=p[(i+1)%p.length];return s+v[0]*q[1]-q[0]*v[1]},0)/2);
const report=[];
function trace(name,box,polygon,test,fill,largest=false){const [ox,oy,w,h]=box;const mask=Array.from({length:w*h},(_,i)=>{const x=ox+i%w,y=oy+Math.floor(i/w),o=(y*1254+x)*4;return inside(x,y,polygon)&&test(...pixels.subarray(o,o+4))?1:0});let loops=traceContours(mask,w,h,ox,oy,{epsilon:.65,minArea:6});if(largest)loops=loops.sort((a,b)=>area(b)-area(a)).slice(0,1);report.push({name,loops:loops.length,points:loops.map(p=>p.length)});return `<path data-art="${name}" d="${curvePath(loops,.12)}" fill="${fill}" fill-rule="evenodd"/>`}
// Reset only this pass's front groups, preserving all subsequent hair/face work.
let master=await fs.readFile(`${lab}/art/source/whale-master.svg`,'utf8');
const baseline=await fs.readFile(`${lab}/art/backups/before-front-detail.svg`,'utf8');
for(const id of ['palm-left','palm-right','apron','waist-ribbon','bodice','bodice-frill-left','bodice-frill-right','sleeve-left','sleeve-right','collar','chest-bow','forearm-left','forearm-right']){
 const re=new RegExp('<g id="'+id+'" data-node="[^"]+"[\\s\\S]*?</g><!-- /part -->');
 master=master.replace(re,baseline.match(re)[0]);
}
master=master.replace(/<linearGradient id="(?:apronPaper|cuffFront|sleeveFront|bowFront)"[\s\S]*?<\/linearGradient>/g,'');
function group(id,body){const re=new RegExp(`(<g id="${id}" data-node="[^"]+"[^>]*>)[\\s\\S]*?(</g><!-- /part -->)`);if(!re.test(master))throw Error(id);master=master.replace(re,(_,a,b)=>a+body+b)}
const blue=(r,g,b,a)=>a>100&&b>150&&b>r*1.3&&b>g*1.1;
const cyan=(r,g,b,a)=>a>100&&r>60&&g>145&&b>210&&g>r*1.5;
// Keep each material attached to its semantic rig node.
const polygonRect=([x,y,w,h])=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const pale=(r,g,b,a)=>a>100&&r>185&&g>185&&b>205&&Math.abs(r-g)<18&&b-r<65;
const paleFold=(r,g,b,a)=>pale(r,g,b,a)&&r<237&&b-r>7;
const rect=polygonRect;
const apronBox=[395,827,249,210],apronPoly=[[475,827],[613,827],[622,857],[635,883],[640,921],[632,975],[607,1009],[570,1024],[484,1022],[426,1007],[398,974],[398,915],[428,871]];
const emblem=master.match(/<g id="whale-emblem-vector">[\s\S]*?<\/g>/)[0];
group('apron',trace('apron-outline',apronBox,apronPoly,pale,'url(#white)',true)+trace('apron-folds',apronBox,apronPoly,paleFold,'#ded9f4')+emblem);
// White bib under the bow; shoulder frills have their own movement nodes.
const bibBox=[452,691,161,111],bibPoly=[[479,691],[600,691],[613,713],[586,799],[467,796],[452,754]];
const oldBodice=master.match(/<g id="bodice"[\s\S]*?<!-- \/part -->/)[0];
const hiddenBody='<path d="M467 705 Q540 692 615 707 L650 771 L622 834 Q541 851 466 828 L438 769Z" fill="url(#navy)"/>';
const gold=(r,g,b,a)=>a>100&&r>195&&g>130&&g<230&&b<180&&r-b>45;
const waist=trace('waist-navy',[464,788,157,49],rect([464,788,157,49]),(r,g,b,a)=>a>100&&r<95&&g<110&&b>70&&b<160,'url(#navy)',true);
group('bodice',hiddenBody+'<path data-art="bib-white" d="M479 699 L605 698 L586 798 L466 793 L456 752Z" fill="url(#white)"/>'+waist+trace('waist-buttons',[480,794,90,40],rect([480,794,90,40]),gold,'#f5ca83'));
for(const [side,box,poly] of [
 ['left',[450,682,56,114],[[479,682],[504,688],[492,713],[477,733],[475,769],[467,797],[450,782],[450,716]]],
 ['right',[602,684,57,111],[[614,684],[656,684],[659,711],[641,735],[635,770],[626,794],[602,789],[608,737]]]
])group('bodice-frill-'+side,trace(side+'-frill',box,poly,pale,'url(#white)',true)+trace(side+'-frill-shadow',box,poly,paleFold,'#ddd8f1'));
// Neck collar sits behind the separate navy bow. Avoid tracing the cheek above it.
const collarBox=[476,681,132,61],collarPoly=[[477,686],[503,681],[533,697],[548,702],[585,681],[603,681],[608,716],[586,741],[547,729],[526,738],[478,710]];
group('collar',trace('collar-edge',collarBox,collarPoly,pale,'#e2dff4')+trace('collar-fold',collarBox,collarPoly,paleFold,'#d2cdeb')+trace('bib-buttons',[516,731,26,53],rect([516,731,26,53]),(r,g,b,a)=>a>100&&r<100&&g<110&&b>65&&b<160,'#343c70'));
const bowBox=[480,697,118,82],bowPoly=rect(bowBox);
const ink=(r,g,b,a)=>a>100&&r<100&&g<110&&b>65&&b<160;
const bowLight=(r,g,b,a)=>ink(r,g,b,a)&&r>48&&g>53;
const bowMid=(r,g,b,a)=>ink(r,g,b,a)&&r>42&&g>47;
const gem=(r,g,b,a)=>a>100&&b>140&&g>100&&r<120&&b>r*1.3;
const leaf=(r,g,b,a)=>a>100&&g>110&&g>r*.9&&r>70&&b<180;
const peach=(r,g,b,a)=>a>100&&r>175&&g>105&&g<200&&b<165&&r-b>45;
let bowOutline=trace('bow-outline',bowBox,bowPoly,ink,'url(#bowNavy)');
// Discard isolated shirt buttons; keep the two actual bow silhouettes.
const outlineLoops=(()=>{const [ox,oy,w,h]=bowBox;const mask=Array.from({length:w*h},(_,i)=>{const o=((oy+Math.floor(i/w))*1254+ox+i%w)*4;return ink(...pixels.subarray(o,o+4))?1:0});return traceContours(mask,w,h,ox,oy,{epsilon:.55,minArea:65})})();
const bowD=curvePath(outlineLoops,.1);
const bowHighlights='<path d="M500 709 Q516 705 533 719 L529 726 Q512 723 499 734Z M551 718 Q570 706 588 710 L582 718 Q569 714 551 726Z" fill="#434976" opacity=".28"/>';
group('chest-bow',`<defs><clipPath id="frontBowClip"><path d="${bowD}"/></clipPath></defs><path data-art="bow-outline" d="${bowD}" fill="url(#bowNavy)"/><g clip-path="url(#frontBowClip)">${bowHighlights}</g>`+trace('bow-blue-pin',[526,700,29,34],rect([526,700,29,34]),gem,'#2a97d0')+trace('bow-leaf',[525,711,22,22],rect([525,711,22,22]),leaf,'#7eaa91')+trace('bow-carrot',[529,711,25,26],rect([529,711,25,26]),peach,'#f1b587'));
// Restore the actual back apron knot/strap, not a cuff attached to the hand.
const belt=master.match(/<g id="waist-ribbon"[\s\S]*?<!-- \/part -->/)[0];
const ties='<path d="M610 825 Q644 814 681 807 L656 836 L635 845Z" fill="#d9d5ef"/><path d="M635 843 L766 910 L755 922 L628 858Z" fill="#bfc3e8"/>'+trace('apron-back-tie',[608,804,166,121],[[609,828],[660,804],[690,809],[668,839],[773,908],[766,925],[635,859],[608,851]],pale,'#d4d1ed')+trace('apron-back-tie-shade',[608,804,166,121],[[609,828],[660,804],[690,809],[668,839],[773,908],[766,925],[635,859],[608,851]],paleFold,'#bfc2e6');
group('waist-ribbon',ties+trace('skirt-gold-bow',[650,898,99,89],rect([650,898,99,89]),(r,g,b,a)=>a>100&&r>170&&g>110&&b>85&&r-b>30&&g<b*1.6,'#e7ae89'));
// Keep forearms, cuffs, palms independent; add only reference-shaped material shadows.
for(const [id,box,poly] of [
 ['sleeve-left',[394,700,90,112],[[433,700],[471,707],[477,744],[448,783],[420,812],[394,782],[398,737]]],
 ['sleeve-right',[625,700,117,119],[[634,700],[680,705],[711,741],[735,783],[710,819],[678,801],[644,775],[625,742]]],
 ['forearm-left',[360,758,113,115],[[400,758],[432,777],[464,827],[459,840],[421,865],[372,823],[360,795]]],
 ['forearm-right',[635,755,130,125],[[695,755],[737,771],[762,789],[762,816],[701,861],[677,867],[635,838],[677,800]]]
]){
 const re=new RegExp('(<g id="'+id+'" data-node="[^"]+">)([\\s\\S]*?)(</g><!-- /part -->)');
 const m=master.match(re);let body=m[2];
 const shade=trace(id+'-fold-shadow',box,poly,(r,g,b,a)=>ink(r,g,b,a)&&r<48&&g<53,'#2f3566');
 // Insert before wrist cuff, never on top of skin/cuff.
 const cuffIndex=body.indexOf('<path data-art="'+(id.endsWith('right')?'right':'left')+'-cuff"');
 body=cuffIndex>=0?body.slice(0,cuffIndex)+shade+body.slice(cuffIndex):body+shade;
 master=master.replace(re,(_,a,b,c)=>a+body+c);
}
// Palm shading stays attached to the hand, beneath the wrist cuff.
for(const [side,box] of [['left',[408,812,75,70]],['right',[612,810,85,78]]]){
 const re=new RegExp('(<g id="palm-'+side+'" data-node="[^"]+">)([\\s\\S]*?)(</g><!-- /part -->)');
 const shade=trace(side+'-palm-shade',box,rect(box),(r,g,b,a)=>a>100&&r>220&&g>140&&b<210&&r-g>59,'#f7c2aa');
 if(!shade.includes('d=""'))master=master.replace(re,(_,a,b,c)=>a+b+shade+c);
}
master=master.replace('</defs>','<linearGradient id="apronPaper" x1="420" y1="850" x2="610" y2="1020" gradientUnits="userSpaceOnUse"><stop stop-color="#fafaff"/><stop offset=".55" stop-color="#f7f6ff"/><stop offset="1" stop-color="#eeebfc"/></linearGradient></defs>');
master=master.replace(/(data-art="apron-outline"[^>]*fill=")url\(#white\)/,'$1url(#apronPaper)');
// Match sampled garment colors without touching hair or skin palettes.
master=master.replace('</defs>','<linearGradient id="cuffFront" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#868ac2"/><stop offset="1" stop-color="#b4b8dc"/></linearGradient><linearGradient id="sleeveFront" x1="0" y1="0" x2=".5" y2="1"><stop stop-color="#373f7c"/><stop offset="1" stop-color="#343c79"/></linearGradient><linearGradient id="bowFront" x1="0" y1="0" x2=".4" y2="1"><stop stop-color="#292e5a"/><stop offset=".35" stop-color="#30376a"/><stop offset="1" stop-color="#32396d"/></linearGradient></defs>');
for(const id of ['sleeve-left','sleeve-right','forearm-left','forearm-right']){
 const re=new RegExp('<g id="'+id+'"[\\s\\S]*?<!-- /part -->');
 master=master.replace(re,g=>g.replaceAll('url(#navy)','url(#sleeveFront)').replaceAll('#a5aed5','url(#cuffFront)'));
}
master=master.replace(/<g id="chest-bow"[\s\S]*?<!-- \/part -->/,g=>g.replaceAll('url(#bowNavy)','url(#bowFront)'));
master=master.replace('stop-color="#fafaff"','stop-color="#f7f7fd"').replace('stop-color="#f7f6ff"','stop-color="#f6f6fc"').replace('stop-color="#eeebfc"','stop-color="#f3f1fb"');
await fs.writeFile(`${lab}/art/source/whale-master.svg`,master);
await fs.writeFile(`${lab}/art/rig/front-detail-review.json`,JSON.stringify({source:'public/assets/whale-girl.png',scope:'front garments only; rear hair untouched',report},null,2)+'\n');
console.log(report);
