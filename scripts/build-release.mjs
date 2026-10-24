import {execFileSync} from 'node:child_process';
const releaseID='unified-hd-'+new Date().toISOString().replace(/[:.]/g,'-');
const env={...process.env,HALFNE_RELEASE_ID:releaseID};
for(const script of ['build','build:toy'])execFileSync('npm',['run',script],{stdio:'inherit',env});
execFileSync(process.execPath,['scripts/package-toy.mjs'],{stdio:'inherit',env});
console.log('Website and Toy release:',releaseID);
