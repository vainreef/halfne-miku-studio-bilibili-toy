// Regions in the shared 1254×1254 source artboard, not screen pixels.
export const focusRegions={
 face:[315,365,475,330],
 head:[215,100,735,620],
 headdress:[270,0,640,440],
 ahoge:[395,0,285,225],
 bow:[465,680,155,120],
 apron:[390,815,270,230],
 emblem:[470,900,120,95],
 hands:[350,765,410,140],
 leftHand:[395,805,100,95],
 rightHand:[610,805,105,100],
 legs:[355,1010,430,240],
 hair:[105,275,955,760],
 leftHair:[115,300,300,735],
 rightHair:[675,300,390,735],
 skirt:[275,795,550,300],
 tail:[640,770,605,420],
};
export function comparisonView(params){
 const focus=params.get('focus')||'';
 if(focus&&!focusRegions[focus])throw Error(`Unknown focus: ${focus}. Use ${Object.keys(focusRegions).join(', ')}`);
 const crop=params.has('crop')?params.get('crop').split(',').map(Number):focusRegions[focus];
 if(crop&&(crop.length!==4||!crop.every(Number.isFinite)||crop[2]<=0||crop[3]<=0))throw Error('crop must be x,y,width,height in source pixels; width/height > 0');
 const zoom=Number(params.get('zoom')||1);
 if(!Number.isFinite(zoom)||zoom<=0||zoom>12)throw Error('zoom must be > 0 and <= 12');
 const [x,y,w,h]=crop||[0,0,1254,1254],a=544/1254;
 const height=crop?Math.min(900,Math.round(600*h/w)):600;
 const k=(crop?Math.min(600/(w*a),height/(h*a)):1)*zoom;
 const cx=28+(x+w/2)*a,cy=28+(y+h/2)*a;
 return {focus,crop:crop||null,zoom,height,transform:`translate(${300-k*cx}px,${height/2-k*cy}px) scale(${k})`,hide:(params.get('hide')||'').split(',').map(s=>s.trim()).filter(Boolean)};
}
