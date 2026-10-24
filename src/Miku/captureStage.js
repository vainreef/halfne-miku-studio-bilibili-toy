import html2canvas from 'html2canvas';
/** html2canvas skips inline SVG meshes. Freeze them as SVG images only in its clone. */
export default async function captureStage(element,options={}){
 await Promise.all([...element.querySelectorAll('img')].map(img=>img.decode()));
 const restorers=[...element.querySelectorAll('canvas[data-renderer="webgl"]')].map(canvas=>canvas.__captureScale?.(options.scale||1));
 const originalOnClone=options.onclone;
 return html2canvas(element,{width:element.offsetWidth,height:element.offsetHeight,...options,onclone:async(documentClone,referenceElement)=>{
  // UI scale belongs to the viewport, not the exported 800×600 stage.
  referenceElement.style.transform='none';
  await originalOnClone?.(documentClone,referenceElement);
  await Promise.all([...referenceElement.querySelectorAll('svg.live-mesh')].map(async svg=>{
   const frozen=svg.cloneNode(true);
   // The image receives the original CSS transform; do not apply it twice inside SVG.
   frozen.removeAttribute('style');
   frozen.setAttribute('xmlns','http://www.w3.org/2000/svg');
   const image=documentClone.createElement('img');
   image.style.cssText=svg.style.cssText;
   image.width=Number(svg.getAttribute('width'))||800;image.height=Number(svg.getAttribute('height'))||600;
   image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(frozen));
   svg.replaceWith(image);await image.decode();
  }));
 }}).finally(()=>restorers.forEach(restore=>restore?.()));
}
