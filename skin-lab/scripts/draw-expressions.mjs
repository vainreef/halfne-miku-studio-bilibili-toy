// Rebuild expression layers in source-art coordinates. No classic art is copied.
import fs from 'node:fs';
const file=new URL('../art/source/whale-master.svg',import.meta.url);
let master=fs.readFileSync(file,'utf8');
const approvedEye=master.match(/<g id="eyes-happyo"[^>]*>([\s\S]*?)<\/g><!-- \/part -->/)[1];
const ink='#303768',lip='#ee6b73',tongue='#ff909b';
const path=(d,fill=ink,extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
const line=(d,color=ink,width=9)=>path(d,'none',`stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`);
const ellipse=(cx,cy,rx,ry,fill)=>`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}"/>`;
const brow={happy:'M428 444 Q437 454 446 458 M604 477 Q625 473 641 462',jaded:'M414 461 L449 463 M604 484 L642 485',oo:'M418 442 Q435 429 451 446 M604 461 Q622 447 642 461',xx:'M419 444 Q436 431 452 443 M603 464 Q624 450 642 462',aa:'M421 449 L450 458 M605 481 L642 468',sideglance:'M416 450 Q434 455 450 450 M606 470 Q624 477 643 471',eheh:'M419 459 Q437 475 454 459 M604 482 Q623 498 644 482',pumped:'M418 444 L451 469 M603 489 L644 466'};
function eye(type,closed){
 let out='';
 for(const [i,[cx,cy]] of [[409,530],[650,552]].entries()){
 let s='';
 if(closed){
  s=type==='xx'?path('M0 -19 Q4 -3 20 0 Q4 4 0 20 Q-4 4 -20 0 Q-4 -4 0 -19Z','#55b9fa'):
    type==='aa'?line(i?'M-23 -14 L23 0 L-23 14':'M23 -14 L-23 0 L23 14'):
    type==='pumped'?line(i?'M23 -15 L-24 5 L21 8':'M-23 -15 L24 5 L-21 8'):
    type==='jaded'?line('M-28 8 L28 9',ink,11):
    type==='sideglance'?line('M-28 0 Q0 23 28 0'):
    line('M-29 10 Q0 -15 30 10');
 }else switch(type){
 case 'happy':s=path('M-22 -42 L28 -37 L24 32 Q22 54 0 53 Q-23 52 -22 32Z')+line('M-35 -45 L37 -36',ink,12);break;
 case 'jaded':s=path('M-23 0 L25 0 L23 31 Q21 48 0 48 Q-22 47 -23 29Z')+line('M-34 -3 L35 -1',ink,12);break;
 case 'oo':s=ellipse(0,0,31,37,'#fff9f3')+`<ellipse cx="0" cy="0" rx="31" ry="37" fill="none" stroke="${ink}" stroke-width="7"/>`+line('M-27 -27 L-34 -35',ink,4);break;
 case 'xx':s=path('M0 -55 Q5 -8 38 0 Q5 8 0 55 Q-5 8 -38 0 Q-5 -8 0 -55Z','#4caaf4')+path('M0 -41 Q4 -6 28 0 Q4 6 0 41 Q-4 6 -28 0 Q-4 -6 0 -41Z','#fff');break;
 case 'aa':s=line('M-29 -5 C-29 -48 36 -42 33 3 C31 45 -30 41 -27 7 C-25 -20 16 -22 16 3 C16 22 -10 23 -11 5',ink,8);break;
 case 'sideglance':s=ellipse(9,3,24,43,ink)+line('M-34 -30 Q-11 -48 17 -35',ink,6);break;
 case 'eheh':s=path('M-39 17 Q-35 -23 0 -21 Q34 -22 38 18 Q28 40 12 21 Q0 12 -12 25 Q-34 44 -39 17Z','#fff')+path('M-20 -19 Q0 -28 21 -17 L18 -2 Q0 20 -18 -2Z');break;
 case 'pumped':s=ellipse(0,6,17,43,ink)+line(i?'M-29 -12 L29 -42':'M-29 -42 L29 -12',ink,8);break;
 }
 out+=`<g transform="translate(${cx} ${cy})">${s}</g>`;
 }
 // Keep the approved asymmetric eyes untouched for the reference expression.
 if(type==='happy'&&!closed)return approvedEye;
 return out+line(brow[type],'#2d88e7',3);
}
function mouth(type,n){
 const sizes={2:[29,49],3:[36,15],4:[15,29],5:[34,26],6:[22,40],7:[32,13]};
 let s='';
 const stroke=d=>line(d,'#ed8c8b',5.5);
 if(n===1){
 s={happy:stroke('M-26 0 Q0 26 26 0'),neutral:stroke('M-23 8 L23 8'),cat:stroke('M-24 10 L0 -8 L24 10'),angry:stroke('M-28 11 L-17 -5 L0 8 L21 -5 L31 8'),pout:stroke('M-24 7 L24 7 M25 -3 L23 18'),drool:stroke('M-25 0 Q0 22 25 0')+ellipse(15,18,7,10,'#fff8f1'),duck:stroke('M9 -18 C-24 -27 -27 -6 -3 0 C-29 6 -25 26 9 20'),tongue:path('M-12 0 Q0 -9 12 1 L10 22 Q0 38 -12 24Z',tongue)+ellipse(-5,15,4,4,'#fff7ef')}[type];
 }else if(type==='duck'){
 const ducks={2:'M4 -34 C-19 -43 -27 -11 -6 -3 L-7 26 Q-26 42 5 41',3:'M-37 -9 C-55 18 30 -14 42 6 Q44 33 -28 26',4:'M6 -21 C-20 -31 -25 -6 -6 0 C-24 12 -17 27 8 23',5:'M-29 -4 C-53 -29 -28 -39 2 -38 Q35 -29 34 4 Q31 33 0 31 Q-28 33 -29 -4Z',6:'M-31 -22 C-51 -49 -25 -49 -3 -40 Q34 -36 31 3 Q30 41 -4 43 Q-40 44 -31 -22Z',7:'M9 -27 C-25 -37 -30 -7 -3 0 C27 9 17 35 -10 33'};
 s=n===5||n===6?path(ducks[n],lip)+stroke(n===5?'M-29 -4 Q5 -29 31 -17':'M-31 -22 Q-10 -47 14 -35'):stroke(ducks[n]);
 if(n===3)s+=path('M-25 20 Q5 31 31 14 Q17 33 -25 20Z','#fff9f0');
 }else{
 const [rawW,rawH]=sizes[n],w=type==='cat'&&n===4?rawW*.9:rawW,h=type==='tongue'?rawH*.72:type==='neutral'?rawH*.85:rawH;
 let d=`M-${w} 0 Q0 6 ${w} -3 Q${w+6} ${h} 0 ${h} Q-${w+4} ${h} -${w} 0Z`;
 if(n===4||n===6)d=`M0 -5 C${w} -6 ${w+5} ${h} 0 ${h} C-${w+4} ${h} -${w+2} -3 0 -5Z`;
 if(type==='cat')d=n===4?d:`M-${w} 3 L0 -11 L${w} 3 Q${w-2} ${h} 0 ${h} Q-${w} ${h} -${w} 3Z`;
 if(type==='angry')d=`M-${w} ${h} L-${w*.8} -5 Q-${w*.5} -9 0 2 Q${w*.7} -17 ${w} -2 L${w+4} ${h}Z`;
 if(type==='pout')d=`M-${w} -1 Q-${w*.4} -12 ${w*.6} -5 Q${w+7} ${h*.5} ${w} ${h} L-${w*.9} ${h}Z`;
 s=path(d,(n===3||n===7)?'#fffaf4':lip);
 if(![3,7].includes(n))s+=path(`M-${w*.63} ${h*.74} Q0 ${h*.3} ${w*.66} ${h*.64} Q${w*.56} ${h} 0 ${h} Q-${w*.48} ${h} -${w*.63} ${h*.74}Z`,tongue);
 if(type==='drool')s+=path(`M${w*.5} ${h-3} Q${w*.9+9} ${h+16} ${w*.35} ${h+15} Q${w*.1} ${h+14} ${w*.5} ${h-3}Z`,'#fffaf4');
 if(type==='tongue')s+=path(`M-13 ${h*.5} Q1 ${h*.25} 15 ${h*.55} L12 ${h+12} Q-2 ${h+20} -17 ${h+12}Z`,tongue)+ellipse(-9,h+8,4,4,'#fff7ef');
 if(type==='pout'&&n===7)s+=stroke(`M${w-1} -4 L${w-3} ${h+9}`);
 }
 return `<g transform="translate(520 620)">${s}</g>`;
}
master=master.replace(/<g id="(?:eyes|mouth)-[^"]+" data-node="[^"]+"[^>]*>[\s\S]*?<\/g><!-- \/part -->/g,'');
let layers='';const add=(id,node,state,body)=>layers+=`\n<g id="${id}" data-node="${node}" data-state="${state}"${['happyo','happy1'].includes(state)?'':' style="display:none"'}>${body}</g><!-- /part -->`;
// Read approved eye from original source, eye() closure uses master; preserve before stripping.

for(const type of ['happy','jaded','oo','xx','aa','sideglance','eheh','pumped'])for(const closed of [false,true]){const state=type+(closed?'c':'o');add('eyes-'+state,'head.face.eyes',state,eye(type,closed));}
for(const type of ['happy','neutral','cat','angry','pout','drool','duck','tongue'])for(let n=1;n<=7;n++){const state=type+n;add('mouth-'+state,'head.face.mouth',state,mouth(type,n));}
master=master.replace('</svg>',layers+'\n</svg>');fs.writeFileSync(file,master);console.log('Drew 16 eyes + 56 mouth states in whale source coordinates.');
