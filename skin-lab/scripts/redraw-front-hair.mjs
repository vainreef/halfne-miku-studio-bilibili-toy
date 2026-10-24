// Front-hair repair only. Rebuild complete temple contours from the reference,
// retaining editable vectors, independent bangs and hidden joint overlap.
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {traceContours,curvePath} from './vector-contours.mjs';
const base=new URL('../',import.meta.url),file=new URL('art/source/whale-master.svg',base);
const b=await chromium.launch({channel:'chrome',headless:true});let pixels;
try{const p=await b.newPage();const src='data:image/png;base64,'+(await fs.readFile(new URL('../public/assets/whale-girl.png',base))).toString('base64');pixels=Buffer.from(await p.evaluate(async src=>{const i=new Image();i.src=src;await i.decode();const c=document.createElement('canvas');c.width=c.height=1254;const g=c.getContext('2d');g.drawImage(i,0,0);const d=g.getImageData(0,0,1254,1254).data;let raw='';for(let k=0;k<d.length;k+=32768)raw+=String.fromCharCode(...d.subarray(k,k+32768));return btoa(raw)},src),'base64')}finally{await b.close()}
const inside=(x,y,p)=>{let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes}return yes};
const area=p=>Math.abs(p.reduce((s,v,i)=>{const q=p[(i+1)%p.length];return s+v[0]*q[1]-q[0]*v[1]},0)/2);
const blue=(r,g,b,a)=>a>120&&b>150&&b>r*1.3&&b>g*1.06;
const cyan=(r,g,b,a)=>a>120&&r>60&&g>145&&b>210&&g>r*1.5;
const report=[];
function trace(name,box,polygon,test,fill,largest=false){const [ox,oy,w,h]=box;const mask=Uint8Array.from({length:w*h},(_,i)=>{const x=ox+i%w,y=oy+Math.floor(i/w),o=(y*1254+x)*4;return inside(x,y,polygon)&&test(...pixels.subarray(o,o+4))?1:0});let loops=traceContours(mask,w,h,ox,oy,{epsilon:name==='bangs-left-complete-contour'?2.8:1.15,minArea:12});if(largest)loops=loops.sort((a,b)=>area(b)-area(a)).slice(0,1);report.push({name,loops:loops.length,points:loops.map(p=>p.length)});return `<path data-art="${name}" d="${curvePath(loops,.13)}" fill="${fill}" fill-rule="evenodd"/>`}
let master=await fs.readFile(file,'utf8');
function group(id,body){const re=new RegExp(`(<g id="${id}" data-node="[^"]+"[^>]*>)[\\s\\S]*?(</g><!-- /part -->)`);if(!re.test(master))throw Error(id);master=master.replace(re,(_,a,b)=>a+body+b)}
// Partition seams run inside overlapping blue masses. The bottom/outer contours
// now follow visible reference tips instead of closing across y=574/604.
const specs=[
 ['bangs-left',[215,185,285,515],[[345,185],[488,185],[478,300],[448,369],[419,415],[391,457],[370,493],[348,548],[348,581],[360,613],[383,644],[394,676],[360,690],[320,680],[300,661],[272,646],[240,620],[215,608],[219,555],[237,455],[267,345]]],
 ['bangs-center',[420,185,235,390],[[420,185],[655,185],[650,330],[630,375],[617,438],[604,482],[596,528],[578,574],[478,574],[440,541],[427,460],[420,390]]],
 ['bangs-right',[553,185,330,515],[[553,185],[801,185],[855,290],[870,400],[861,514],[844,570],[831,609],[805,641],[771,661],[740,679],[698,693],[681,675],[699,650],[713,610],[732,570],[741,530],[695,512],[673,475],[649,426],[625,373],[610,331],[585,270]]],
];
for(const [id,box,poly] of specs){
 let body=trace(id+'-complete-contour',box,poly,blue,id==='bangs-center'?'url(#hair)':'url(#templeHair)',true)+trace(id+'-highlight',box,poly,cyan,'url(#bangLight)');
 if(id==='bangs-center')body+='<path d="M437 268 Q490 214 531 233 Q484 242 437 268Z" fill="url(#bangShade)"/>';
 if(id==='bangs-right')body+='<path d="M557 234 Q603 192 670 302 Q613 246 557 234Z" fill="url(#bangShade)"/>';
 group(id,body);
}
// Match the sampled blue of the crown; a separate lower-temple wash follows
// the reference's warmer/lighter lower curls, rather than a flat dark side slab.
master=master.replace(/<radialGradient id="hair"[\s\S]*?<\/radialGradient>/,'<radialGradient id="hair" gradientUnits="userSpaceOnUse" cx="535" cy="360" r="430"><stop stop-color="#2c66e3"/><stop offset=".65" stop-color="#2c65e1"/><stop offset="1" stop-color="#2b60da"/></radialGradient>');
// Side material: bright lower turns, and narrow, reference-derived occlusion
// shadows. Clip overlays to the repaired contours, never across the face.
const defs=`<linearGradient id="templeHair" x1="500" y1="260" x2="500" y2="700" gradientUnits="userSpaceOnUse"><stop stop-color="#2c66e3"/><stop offset=".52" stop-color="#2c66e3"/><stop offset=".78" stop-color="#2d6fe9"/><stop offset="1" stop-color="#3586ef"/></linearGradient>
<linearGradient id="frontCurlRootFade" x1="0" y1="490" x2="0" y2="610" gradientUnits="userSpaceOnUse"><stop stop-color="black"/><stop offset=".3" stop-color="black"/><stop offset="1" stop-color="white"/></linearGradient>
<mask id="frontCurlRootMask" maskUnits="userSpaceOnUse" x="0" y="0" width="1254" height="1254"><rect width="1254" height="1254" fill="url(#frontCurlRootFade)"/></mask>`;
for(const id of ['templeHair','frontCurlRootFade'])master=master.replace(new RegExp('<linearGradient id="'+id+'"[\\s\\S]*?</linearGradient>'),'');
master=master.replace(/<mask id="frontCurlRootMask"[\s\S]*?<\/mask>/,'');
master=master.replace('</defs>',defs+'</defs>');
for(const [id,d] of [
 ['bangs-left','M281 470 C270 522 266 561 274 604 L280 622 C273 580 276 541 288 505Z'],
 ['bangs-right','M741 368 C756 403 762 452 760 486 Q758 511 752 515 C759 487 751 422 741 368Z']]){
 const re=new RegExp(`(<g id="${id}" data-node="[^"]+"[^>]*>)([\\s\\S]*?)(</g><!-- /part -->)`);
 master=master.replace(re,(_,a,body,z)=>a+body+`<path data-shading="temple-depth" d="${d}" fill="#2454c5" opacity=".65"/>`+z);
}
// Trace only the lighter foreground material, not the dark rear curtain.
// The threshold closes inside the hidden upper attachment, which is feathered
// into the static temple and therefore never becomes a visible cut edge.
for(const [side,box,poly] of [
 ['left',[265,565,140,225],[[270,565],[338,565],[345,620],[365,650],[400,675],[369,683],[391,710],[386,745],[356,775],[293,779],[291,738],[270,687],[265,620]]],
 ['right',[660,565,175,235],[[785,565],[832,565],[825,628],[805,675],[789,715],[756,767],[734,794],[679,793],[661,763],[663,718],[681,681],[724,650],[752,614]]],
]){
 const sideId=side==='left'?'L':'R';
 const art=trace('front-curl-'+side,box,poly,(r,g,b,a)=>blue(r,g,b,a)&&g>110&&r<95,`url(#curlPaint${sideId})`,true);
 group('side-lock-'+side,art);
 const g=`<linearGradient id="curlPaint${sideId}" x1="500" y1="570" x2="500" y2="790" gradientUnits="userSpaceOnUse"><stop stop-color="#2d6ce5"/><stop offset=".4" stop-color="#3186ee"/><stop offset="1" stop-color="#369bf7"/></linearGradient>`;
 master=master.replace(new RegExp('<linearGradient id="curlPaint'+sideId+'"[\\s\\S]*?</linearGradient>'),'');master=master.replace('</defs>',g+'</defs>');
}
// Repaint the left curl as a clean authored Bezier, with its two tapered tips.
// A colour-threshold contour had included an unrelated bright fragment below it.
group('side-lock-left','<path data-art="front-curl-left-clean" d="M281 541 C265 578 262 620 274 651 Q280 666 289 676 L286 646 C298 672 329 686 332 712 C338 737 321 752 302 757 C331 762 351 746 361 732 L357 757 C381 746 384 719 374 698 L366 677 Q382 680 395 674 C369 661 349 648 341 620 Q331 584 336 560Z" fill="url(#curlPaintL)"/>');
// Clean right curl: broad S-turn and the separate narrow outward tip; no
// threshold-traced pixel staircases at its upper root or along its inner edge.
group('side-lock-right','<path data-art="front-curl-right-clean" d="M800 550 C815 594 807 634 797 670 C794 701 779 729 759 748 C765 731 768 713 765 697 C748 718 727 724 710 740 C695 755 696 774 714 784 C690 789 670 775 666 756 C659 729 681 704 706 684 L692 684 C729 664 751 638 764 605Z" fill="url(#curlPaintR)"/>');
// The short wisps under the two front curls are complete overlapping shapes,
// not polygon-clipped pieces of the reference's surrounding blue pixels.
group('rear-under-left','<path data-art="under-left-clean" d="M333 550 C341 601 362 633 390 650 Q411 661 431 664 Q415 677 389 679 L404 692 Q377 687 362 673 C357 706 347 726 329 738 L309 741 Q331 711 328 692 C304 658 311 590 333 550Z" fill="url(#underLockL)"/>');
group('rear-under-right','<path data-art="under-right-clean" d="M797 550 C810 592 789 630 761 652 Q733 675 692 681 L660 675 Q675 692 708 696 L695 709 Q737 703 764 689 C758 714 752 740 760 758 Q782 738 791 710 Q798 690 788 681 C816 650 833 610 826 566Z" fill="url(#underLockR)"/>');
for(const side of ['L','R']){
 master=master.replace(new RegExp('<linearGradient id="underLock'+side+'"[\\s\\S]*?</linearGradient>'),`<linearGradient id="underLock${side}" x1="500" y1="570" x2="500" y2="770" gradientUnits="userSpaceOnUse"><stop stop-color="#2b63d8"/><stop offset="1" stop-color="#3078e2"/></linearGradient>`);
}
for(const id of ['side-lock-left','side-lock-right']){
 const re=new RegExp(`(<g id="${id}" data-node="[^"]+"[^>]*>)([\\s\\S]*?)(</g><!-- /part -->)`);
 master=master.replace(re,(_,a,body,z)=>a+'<g mask="url(#frontCurlRootMask)">'+body.replace(/^<g mask="url\(#frontCurlRootMask\)">([\s\S]*)<\/g>$/,'$1')+'</g>'+z);
}
await fs.writeFile(file,master);
await fs.writeFile(new URL('art/rig/front-hair-review.json',base),JSON.stringify({source:'public/assets/whale-girl.png',referenceArtboard:[1254,1254],editableVectors:true,scope:'complete left/center/right fringe contours; preserve other artwork',report},null,2)+'\n');
console.log(report);
