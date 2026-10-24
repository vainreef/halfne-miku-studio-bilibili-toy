// Temporary visual selection only. Original SVG palettes and motion are untouched.
export const rearHairPaths=new Set(['hairBackCenter','hairOuterL','hairOuterR','hairInnerL','hairInnerR','hairScalp','hairFlyL','hairFlyR']);
export const frontHairPaths=new Set(['frontLockL','frontLockR','head.momiL','head.momiR','head.bangs.L','head.bangs.M','head.bangs.R','head.ahoge']);
export const rearHairGreenFilter='brightness(0) saturate(100%) invert(79%) sepia(95%) saturate(4559%) hue-rotate(73deg) brightness(118%) contrast(127%) drop-shadow(0 0 4px #00ff44)';
// Fin ornament contains no hair; rear sections are separate vector meshes.
export function highlightMixedHair(path,resource){return resource;}
