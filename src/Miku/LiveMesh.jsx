import React,{useLayoutEffect,useRef} from 'react';
/** Update triangle transforms without rebuilding the SVG tree each animation frame. */
export default function LiveMesh({mesh,width=800,height=600,resourceCenterX=400,resourceCenterY=300}){
 const ref=useRef(null),elements=useRef(null);
 useLayoutEffect(()=>{
  elements.current={clips:[...ref.current.querySelectorAll('[data-mesh-clip]')],uses:[...ref.current.querySelectorAll('[data-mesh-use]')]};
 },[mesh.markup]);
 useLayoutEffect(()=>{
  mesh.triangles.forEach((t,i)=>{elements.current.clips[i].setAttribute('points',t.points);elements.current.uses[i].setAttribute('transform',t.transform)});
 },[mesh.markup,mesh.revision]);
 return <svg ref={ref} className="live-mesh" xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 800 600" style={{position:'absolute',transform:`translate(${-resourceCenterX}px,${-resourceCenterY}px)`}} dangerouslySetInnerHTML={{__html:mesh.markup}}/>;
}
