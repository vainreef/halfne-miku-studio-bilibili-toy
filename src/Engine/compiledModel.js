import {registerModelIndex,beginModelRead,endModelRead} from './modelUtils';
/** Reuse a compiled tree. Preserve the legacy parser's synchronous dependency rounds. */
export function compileModel(model){
 const fields=[],functions=[],nodes=[];
 function clone(value){
  if(value===null||typeof value!=='object')return value;
  if(Array.isArray(value))return value.map(clone);
  const out={};
  if(value.id!==undefined)nodes.push({out,keys:new Set(Object.keys(value))});
  for(const [key,v] of Object.entries(value)){
   if(v!==null&&typeof v==='object')out[key]=clone(v);
   else{out[key]=v;fields.push({out,key,value:v});if(typeof v==='function')functions.push({out,key,fn:v});}
  }
  return out;
 }
 const result=clone(model);registerModelIndex(model);registerModelIndex(result);
 const active=new Int32Array(functions.length),remaining=new Int32Array(functions.length),resolved=new Array(functions.length);
 return {evaluate(control,physics={}){
  // Secondary motion changes geometry on the tree; restore its authored defaults.
  for(const {out,keys} of nodes)for(const key of ['mesh','x','y','rotation','scaleX','scaleY'])if(!keys.has(key))delete out[key];
  for(let i=0;i<fields.length;i++){const f=fields[i];f.out[f.key]=f.value;}
  let root=model,count=functions.length;
  for(let i=0;i<count;i++)active[i]=i;
  while(count){
   let pending=0,done=0;beginModelRead(root);
   try{
    for(let i=0;i<count;i++){
     const index=active[i],f=functions[index],value=f.fn(control,root,physics);
     if(value===undefined||typeof value==='function')remaining[pending++]=index;
     else{resolved[index]=value;done++;}
    }
   }finally{endModelRead(root);}
   if(!done)throw Error('Infinite Loop In Config File');
   // Apply together: later functions in a round must not see earlier writes.
   for(let i=0;i<count;i++){const index=active[i],f=functions[index];if(resolved[index]!==undefined){f.out[f.key]=resolved[index];resolved[index]=undefined;}}
   active.set(remaining.subarray(0,pending));count=pending;root=result;
  }
  return result;
 },nodeCount:nodes.length,functionCount:functions.length};
}

/** React may retain an older frame while rendering. Snapshot node properties, not the live rig. */
export function snapshotRenderTree(node){
 const result={...node};
 if(node.components)result.components=node.components.map(snapshotRenderTree);
 return result;
}
