export const TOY_BUILD=import.meta.env.MODE==='toy';
export async function supports(name){try{return !!window.toy&&await window.toy.isSupport(name)}catch{return false}}
export function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000)}
export async function saveCanvas(canvas){
 if(TOY_BUILD&&await supports('saveImageToAlbum')){
  let image=canvas,data=image.toDataURL('image/png');
  while(data.length>2*1024*1024&&image.width>320){const next=document.createElement('canvas');next.width=Math.round(image.width*.8);next.height=Math.round(image.height*.8);next.getContext('2d').drawImage(image,0,0,next.width,next.height);image=next;data=image.toDataURL('image/png')}
  if(data.length>5242880)throw Error('图片过大，请降低截图尺寸');
  await window.toy.saveImageToAlbum({base64Data:data,hintMsg:'保存你的角色表演截图'});return '图片已保存到相册';
 }
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('图片生成失败，请重试');downloadBlob(blob,'Halfne-Toy.png');return '图片已生成，请查看下载';
}
export function relativeToyPath(){return 'index.html'+window.location.search+window.location.hash}
export function readSkin(){try{return localStorage.getItem('halfne-toy-skin')}catch{return null}}
export function rememberSkin(skin){try{localStorage.setItem('halfne-toy-skin',skin)}catch{}}
