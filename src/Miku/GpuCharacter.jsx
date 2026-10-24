import React, {forwardRef, useImperativeHandle, useLayoutEffect, useRef} from 'react';

// Cache decoded SVG bounds separately from screen-resolution raster tiles.
// Scan native bounds once, then paint vectors straight into cropped HD tiles.
const sources=new Map(),rasters=new Map();
function remember(cache,key,value){cache.set(key,value);if(cache.size>160)cache.delete(cache.keys().next().value);return value}
function sourceInfo(url){
 if(!sources.has(url))remember(sources,url,(async()=>{
  const image=new Image();image.src=url;await image.decode();
  const w=image.naturalWidth,h=image.naturalHeight,source=document.createElement('canvas');source.width=w;source.height=h;
  const ctx=source.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
  const pixels=ctx.getImageData(0,0,w,h).data;let x0=w,y0=h,x1=-1,y1=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(pixels[(y*w+x)*4+3]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}
  if(x1<0)x0=y0=x1=y1=0;
  source.width=source.height=1;
  return {image,x:x0-2,y:y0-2,logicalW:x1-x0+5,logicalH:y1-y0+5,sourceW:w,sourceH:h};
 })());
 return sources.get(url);
}
function raster(url,resolution){
 const key=resolution+'|'+url;
 if(!rasters.has(key))remember(rasters,key,(async()=>{
  const info=await sourceInfo(url),canvas=document.createElement('canvas');
  canvas.width=Math.ceil(info.logicalW*resolution);canvas.height=Math.ceil(info.logicalH*resolution);
  const ctx=canvas.getContext('2d');ctx.setTransform(resolution,0,0,resolution,-info.x*resolution,-info.y*resolution);ctx.drawImage(info.image,0,0,info.sourceW,info.sourceH);
  return {...info,canvas,w:canvas.width,h:canvas.height,logicalW:canvas.width/resolution,logicalH:canvas.height/resolution,resolution};
 })());
 return rasters.get(key);
}
const identity=[1,0,0,1,0,0];
const multiply=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
function nodeMatrix(n,parent,out) {
    let m=parent;
    if(n.skewX)m=multiply(m,[1,0,-Math.tan(n.skewX*Math.PI/180),1,0,0]);
    if(n.skewY)m=multiply(m,[1,Math.tan(n.skewY*Math.PI/180),0,1,0,0]);
    const angle=(n.rotation||0)*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle),sx=n.scaleX||1,sy=n.scaleY||1;
    const a=c*sx,b=s*sx,cc=-s*sy,d=c*sy,x=n.x||0,y=n.y||0;
    out[0]=m[0]*a+m[2]*b;out[1]=m[1]*a+m[3]*b;out[2]=m[0]*cc+m[2]*d;out[3]=m[1]*cc+m[3]*d;out[4]=m[0]*x+m[2]*y+m[4];out[5]=m[1]*x+m[3]*y+m[5];return out;
}
function createRenderer(canvas,fail) {
    // Preserve the completed frame for html2canvas/album/GIF capture.
    const gl=canvas.getContext('webgl',{alpha:true,antialias:false,depth:false,stencil:false,premultipliedAlpha:true,preserveDrawingBuffer:true,powerPreference:'low-power'});
    if(!gl)throw Error('WebGL context unavailable');
    const shaders=[];
    function shader(type,source){const s=gl.createShader(type);shaders.push(s);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
    const program=gl.createProgram();
    const precision=gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER,gl.HIGH_FLOAT)?.precision?'highp':'mediump';
    gl.attachShader(program,shader(gl.VERTEX_SHADER,`attribute vec2 a_position;attribute vec2 a_uv;attribute vec4 a_bounds;attribute float a_alpha;varying ${precision} vec2 v_uv;varying ${precision} vec4 v_bounds;varying ${precision} float v_alpha;void main(){gl_Position=vec4(a_position.x/400.0-1.0,1.0-a_position.y/300.0,0.0,1.0);v_uv=a_uv;v_bounds=a_bounds;v_alpha=a_alpha;}`));
    gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`precision ${precision} float;varying ${precision} vec2 v_uv;varying ${precision} vec4 v_bounds;varying ${precision} float v_alpha;uniform sampler2D u_image;void main(){gl_FragColor=texture2D(u_image,clamp(v_uv,v_bounds.xy,v_bounds.zw))*v_alpha;}`));
    gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    const position=gl.getAttribLocation(program,'a_position'),uv=gl.getAttribLocation(program,'a_uv'),bounds=gl.getAttribLocation(program,'a_bounds'),alpha=gl.getAttribLocation(program,'a_alpha');
    gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,36,0);
    gl.enableVertexAttribArray(uv);gl.vertexAttribPointer(uv,2,gl.FLOAT,false,36,8);
    gl.enableVertexAttribArray(bounds);gl.vertexAttribPointer(bounds,4,gl.FLOAT,false,36,16);
    gl.enableVertexAttribArray(alpha);gl.vertexAttribPointer(alpha,1,gl.FLOAT,false,36,32);
    gl.uniform1i(gl.getUniformLocation(program,'u_image'),0);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
    const textures=new Map(),readyTextures=new Map();let disposed=false,pending=0,root=null,density=1,forced=null,bytes=0;
    // Shared atlas batches the complete, ordered character into one draw.
    // Per-vertex sample bounds keep out-of-region mesh UVs on transparent guard pixels.
    const atlasSize=2048;let atlas=null;const freeRects=[{x:0,y:0,w:atlasSize,h:atlasSize}];
    const parameters=()=>{gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR)};
    if(precision==='highp'&&new URLSearchParams(location.search).get('atlas')!=='0'){
        atlas=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,atlas);parameters();gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,atlasSize,atlasSize,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
        if(gl.getError()!==gl.NO_ERROR){gl.deleteTexture(atlas);atlas=null;}else bytes=atlasSize*atlasSize*4;
    }
    // Max-rect packing avoids wasting most of a row when a tall hair tile is
    // followed by tiny face/hand tiles. HD textures still share a 16 MiB atlas.
    function pack(w,h){
        let best=null,score=Infinity;
        for(const r of freeRects)if(w<=r.w&&h<=r.h){const s=Math.min(r.w-w,r.h-h)*100000+Math.max(r.w-w,r.h-h);if(s<score){score=s;best={x:r.x,y:r.y,w,h}}}
        if(!best)return null;
        const next=[];
        for(const r of freeRects){
            if(best.x>=r.x+r.w||best.x+w<=r.x||best.y>=r.y+r.h||best.y+h<=r.y){next.push(r);continue}
            if(best.x>r.x)next.push({...r,w:best.x-r.x});
            if(best.x+w<r.x+r.w)next.push({...r,x:best.x+w,w:r.x+r.w-best.x-w});
            if(best.y>r.y)next.push({...r,h:best.y-r.y});
            if(best.y+h<r.y+r.h)next.push({...r,y:best.y+h,h:r.y+r.h-best.y-h});
        }
        freeRects.length=0;
        next.forEach((r,i)=>{if(!next.some((q,j)=>j!==i&&q.x<=r.x&&q.y<=r.y&&q.x+q.w>=r.x+r.w&&q.y+q.h>=r.y+r.h&&(q.w*q.h>r.w*r.h||j<i)))freeRects.push(r)});
        return best;
    }
    let vertices=new Float32Array(16384),cursor=0,rangeCount=0,measuredRoot=null;const ranges=[],matrices=new WeakMap();
    const data=(name,value)=>{const text=String(value);if(canvas.dataset[name]!==text)canvas.dataset[name]=text;};
    function texture(url,requiredDensity){
        // 确保放大时精细度灵敏提升，并以最高 4x 矢量超采样光栅化切片
        const resolution=Math.max(1,Math.min(4,Math.ceil(requiredDensity*1.15))),key=resolution+'|'+url;
        if(!textures.has(key)){
            const entry={ready:false};textures.set(key,entry);pending++;
            raster(url,resolution).then(info=>{
                if(disposed)return;
                entry.info=info;const slot=atlas?pack(info.w,info.h):null;
                const fits=!!slot,x=slot?.x||0,y=slot?.y||0;
                entry.tx=x;entry.ty=y;entry.tw=fits?atlasSize:info.w;entry.th=fits?atlasSize:info.h;
                if(fits){
                    entry.texture=atlas;gl.bindTexture(gl.TEXTURE_2D,atlas);gl.texSubImage2D(gl.TEXTURE_2D,0,x,y,gl.RGBA,gl.UNSIGNED_BYTE,info.canvas);
                }else{
                    entry.texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,entry.texture);parameters();
                    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,info.canvas);bytes+=info.w*info.h*4;
                }
                entry.bounds=[(entry.tx+.5)/entry.tw,(entry.ty+.5)/entry.th,(entry.tx+info.w-.5)/entry.tw,(entry.ty+info.h-.5)/entry.th];
                entry.ready=true;readyTextures.set(url,entry);data('hdTiles',[...textures.values()].filter(t=>t.ready&&t.info.resolution>1).length);pending--;draw();
            }).catch(error=>{if(!disposed)fail(error)});
        }
        return textures.get(key).ready?textures.get(key):(readyTextures.get(url)||textures.get(key));
    }
    function vertex(m,x,y,u,v,entry,opacity){
        if(cursor+9>vertices.length){const larger=new Float32Array(vertices.length*2);larger.set(vertices);vertices=larger;}
        vertices[cursor++]=m[0]*x+m[2]*y+m[4];vertices[cursor++]=m[1]*x+m[3]*y+m[5];
        vertices[cursor++]=(entry.tx+u*entry.info.w)/entry.tw;vertices[cursor++]=(entry.ty+v*entry.info.h)/entry.th;
        for(let k=0;k<4;k++)vertices[cursor++]=entry.bounds[k];vertices[cursor++]=opacity;
    }
    function walk(n,parent,opacity=1){
        if(n.virtual||n.display==='none')return;
        let m=matrices.get(n);if(!m){m=new Float64Array(6);matrices.set(n,m);}nodeMatrix(n,parent,m);
        const a=opacity*(n.opacity??1),cx=n.resourceCenterX||0,cy=n.resourceCenterY||0;
        const materialMatrix=n.mesh?multiply(m,n.mesh.matrix):m;
        const displayScale=Math.max(Math.hypot(materialMatrix[0],materialMatrix[1]),Math.hypot(materialMatrix[2],materialMatrix[3]));
        const entry=(n.mesh||n.resource)?texture(n.mesh?.texture||n.resource,displayScale*density):null;
        if(entry?.ready){
            const first=cursor/9,t=entry.info;
            if(n.mesh){
                const matrix=multiply(m,[1,0,0,1,-cx,-cy]),world=multiply(matrix,n.mesh.matrix);
                for(const tri of n.mesh.triangles){
                    for(let k=0;k<3;k++){
                        const p=tri.vertices[k],source=tri.source[k];
                        vertex(world,p[0],p[1],(source[0]-t.x)/t.logicalW,(source[1]-t.y)/t.logicalH,entry,a);
                    }
                }
            }else{
                const sx=(n.width||t.sourceW)/t.sourceW,sy=(n.height||t.sourceH)/t.sourceH;
                const x=t.x*sx-cx,y=t.y*sy-cy,w=t.logicalW*sx,h=t.logicalH*sy;
                vertex(m,x,y,0,0,entry,a);vertex(m,x+w,y,1,0,entry,a);vertex(m,x+w,y+h,1,1,entry,a);
                vertex(m,x,y,0,0,entry,a);vertex(m,x+w,y+h,1,1,entry,a);vertex(m,x,y+h,0,1,entry,a);
            }
            const range=ranges[rangeCount]||(ranges[rangeCount]={});range.entry=entry;range.first=first;range.count=cursor/9-first;rangeCount++;
        }
        if(n.components)for(let i=0;i<n.components.length;i++)walk(n.components[i],m,a);
    }
    function draw(){
        if(disposed||!root)return;
        cursor=0;rangeCount=0;walk(root,identity);
        gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,vertices.subarray(0,cursor),gl.DYNAMIC_DRAW);
        let drawCalls=0;
        for(let i=0;i<rangeCount;){
            const range=ranges[i++];let count=range.count;
            while(i<rangeCount&&ranges[i].entry.texture===range.entry.texture)count+=ranges[i++].count;
            gl.bindTexture(gl.TEXTURE_2D,range.entry.texture);gl.drawArrays(gl.TRIANGLES,range.first,count);drawCalls++;
        }
        data('ready',pending===0?'1':'0');data('drawCalls',drawCalls);data('textureBytes',bytes);data('vertices',cursor/9);return drawCalls>0;
    }
    let currentZoom=1.0;
    function resize(explicitZoom){
        if(typeof explicitZoom==='number')currentZoom=explicitZoom;
        const stage=canvas.closest('.stage');
        const scalerBox=canvas.closest('.stage-scaler-box')||stage;
        const baseScale=scalerBox?(scalerBox.clientWidth/800):1;
        const effectiveScale=baseScale*currentZoom;
        const prevDensity=density;
        density=forced??Math.max(.25,Math.min(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)/800,effectiveScale*(window.devicePixelRatio||1)));
        const w=Math.round(800*density),h=Math.round(600*density);
        data('pixelRatio',window.devicePixelRatio||1);data('renderDensity',density.toFixed(3));data('resolutionPolicy','native-screen-hd-tiles');
        // 当缩小导致渲染密度降低时，安全回收超出当前所需精度的独立高分纹理，杜绝显存浪费
        if(density<prevDensity*0.85){
            const maxNeededRes=Math.max(1,Math.ceil(density*1.2));
            for(const [key,entry] of textures.entries()){
                if(entry.ready&&entry.info?.resolution>maxNeededRes&&entry.texture&&entry.texture!==atlas){
                    gl.deleteTexture(entry.texture);
                    bytes-=((entry.info.w*entry.info.h*4)||0);
                    textures.delete(key);
                }
            }
        }
        if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
        draw();
    }
    const lost=e=>{e.preventDefault();if(!disposed)fail(Error('WebGL context lost'));};canvas.addEventListener('webglcontextlost',lost);
    const observer=new ResizeObserver(()=>resize());observer.observe(canvas.closest('.stage-scaler-box')||canvas);resize();
    canvas.__captureScale=scale=>{const previous=forced;forced=Math.max(1,Math.min(3,scale));resize();draw();return()=>{forced=previous;resize();draw();}};
    return {
        render(state){root=state;if(measuredRoot!==state){let count=0;const visit=n=>{if(n.mesh)count++;n.components?.forEach(visit)};visit(state);data('meshCount',count);measuredRoot=state;}return draw();},
        resize,
        dispose(){disposed=true;observer.disconnect();canvas.removeEventListener('webglcontextlost',lost);delete canvas.__captureScale;for(const texture of new Set([atlas,...[...textures.values()].map(t=>t.texture)]))if(texture)gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);shaders.forEach(s=>gl.deleteShader(s));gl.getExtension('WEBGL_lose_context')?.loseContext();}
    };
}
export function preferGpu(){
    const mode=new URLSearchParams(window.location.search).get('renderer');
    return mode!=='dom';
}
export default forwardRef(function GpuCharacter({onFailure,runtime,zoomLevel=1.0},ref){
    const canvas=useRef(null),renderer=useRef(null),latest=useRef(null);
    useImperativeHandle(ref,()=>({
        render(state){latest.current=state;return renderer.current?.render(state)},
        resize(zoom){renderer.current?.resize(zoom);}
    }),[]);
    useLayoutEffect(()=>{
        let active=true;
        const fail=error=>{if(active){console.warn('Character GPU fallback:',error);onFailure();}};
        try{
            renderer.current=createRenderer(canvas.current,fail);
            renderer.current.resize(zoomLevel);
            if(latest.current)renderer.current.render(latest.current);
        }catch(error){fail(error);}
        return()=>{active=false;renderer.current?.dispose();renderer.current=null;};
    },[]);
    useLayoutEffect(()=>{
        if(renderer.current){
            renderer.current.resize(zoomLevel);
        }
    },[zoomLevel]);
    return <canvas ref={canvas} data-renderer="webgl" data-runtime={runtime} style={{position:'absolute',width:800,height:600,pointerEvents:'none'}} aria-label="角色 GPU 动画"/>;
});
