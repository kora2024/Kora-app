import { TERRITORIES } from '../store/useKoraStore';

// Convert lat/lng to 3D sphere coordinates
function latLngToXYZ(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return {
    x: -(radius * Math.sin(phi) * Math.cos(theta)),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  };
}

const ARCS = [
  { from: 'ftf', to: 'par' },
  { from: 'ftf', to: 'lag' },
  { from: 'ftf', to: 'lon' },
  { from: 'ftf', to: 'dak' },
  { from: 'par', to: 'lag' },
  { from: 'nyc', to: 'lon' },
];

function generateTerritoryData() {
  return TERRITORIES.map((t) => {
    const pos = latLngToXYZ(t.lat, t.lng, 1.01);
    return `{ id:"${t.id}", name:"${t.name}", color:"${t.color}", x:${pos.x.toFixed(4)}, y:${pos.y.toFixed(4)}, z:${pos.z.toFixed(4)}, size:${t.size / 300}, pop:"${t.population}", desc:"${t.description}" }`;
  });
}

function generateArcData() {
  return ARCS.map((a) => {
    const from = TERRITORIES.find((t) => t.id === a.from)!;
    const to = TERRITORIES.find((t) => t.id === a.to)!;
    return `{ fromColor:"${from.color}", toColor:"${to.color}", fromLat:${from.lat}, fromLng:${from.lng}, toLat:${to.lat}, toLng:${to.lng} }`;
  });
}

export function getGlobeHTML(): string {
  const territoryData = generateTerritoryData().join(',\n      ');
  const arcData = generateArcData().join(',\n      ');

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#0D0D0D;overflow:hidden;touch-action:none}
  canvas{display:block;width:100vw;height:100vh}
</style>
</head>
<body>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
(function(){
  const W=window.innerWidth, H=window.innerHeight;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(45,W/H,0.1,100);
  camera.position.set(0,0,3.2);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setSize(W,H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setClearColor(0x0D0D0D,1);
  document.body.appendChild(renderer.domElement);

  // Globe group for rotation
  const globeGroup=new THREE.Group();
  globeGroup.rotation.x=0.4; // 23° axial tilt
  scene.add(globeGroup);

  // Sphere
  const sphereGeo=new THREE.SphereGeometry(1,64,64);
  const sphereMat=new THREE.ShaderMaterial({
    uniforms:{
      color1:{value:new THREE.Color(0x0a1829)},
      color2:{value:new THREE.Color(0x060d17)},
      glowColor:{value:new THREE.Color(0x1a3a5c)}
    },
    vertexShader:\`
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main(){
        vNormal=normalize(normalMatrix*normal);
        vPosition=position;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
      }
    \`,
    fragmentShader:\`
      uniform vec3 color1;
      uniform vec3 color2;
      uniform vec3 glowColor;
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main(){
        float intensity=pow(0.65-dot(vNormal,vec3(0,0,1.0)),2.0);
        vec3 base=mix(color1,color2,vPosition.y*0.5+0.5);
        vec3 glow=glowColor*intensity*0.5;
        gl_FragColor=vec4(base+glow,1.0);
      }
    \`
  });
  const sphere=new THREE.Mesh(sphereGeo,sphereMat);
  globeGroup.add(sphere);

  // Atmosphere glow
  const atmosGeo=new THREE.SphereGeometry(1.08,64,64);
  const atmosMat=new THREE.ShaderMaterial({
    uniforms:{glowColor:{value:new THREE.Color(0x1a3a5c)}},
    vertexShader:\`
      varying vec3 vNormal;
      void main(){
        vNormal=normalize(normalMatrix*normal);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
      }
    \`,
    fragmentShader:\`
      uniform vec3 glowColor;
      varying vec3 vNormal;
      void main(){
        float intensity=pow(0.7-dot(vNormal,vec3(0,0,1.0)),3.0);
        gl_FragColor=vec4(glowColor,intensity*0.4);
      }
    \`,
    blending:THREE.AdditiveBlending,
    side:THREE.BackSide,
    transparent:true
  });
  globeGroup.add(new THREE.Mesh(atmosGeo,atmosMat));

  // Grid lines
  function addGridLine(points,opacity){
    const geo=new THREE.BufferGeometry().setFromPoints(points);
    const mat=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:opacity||0.08});
    globeGroup.add(new THREE.Line(geo,mat));
  }
  // Latitude lines
  for(let lat=-60;lat<=60;lat+=30){
    const pts=[];
    const phi=(90-lat)*Math.PI/180;
    for(let i=0;i<=64;i++){
      const theta=i/64*Math.PI*2;
      pts.push(new THREE.Vector3(
        -1.002*Math.sin(phi)*Math.cos(theta),
        1.002*Math.cos(phi),
        1.002*Math.sin(phi)*Math.sin(theta)
      ));
    }
    addGridLine(pts,0.06);
  }
  // Longitude lines
  for(let lng=0;lng<360;lng+=30){
    const pts=[];
    const theta=(lng+180)*Math.PI/180;
    for(let i=0;i<=64;i++){
      const phi=i/64*Math.PI;
      pts.push(new THREE.Vector3(
        -1.002*Math.sin(phi)*Math.cos(theta),
        1.002*Math.cos(phi),
        1.002*Math.sin(phi)*Math.sin(theta)
      ));
    }
    addGridLine(pts,0.05);
  }

  // Territory dots
  const territories=[
      ${territoryData}
  ];
  const dotMeshes=[];
  const pulseMeshes=[];
  territories.forEach(t=>{
    // Core dot
    const dotGeo=new THREE.SphereGeometry(t.size,16,16);
    const dotMat=new THREE.MeshBasicMaterial({color:new THREE.Color(t.color)});
    const dot=new THREE.Mesh(dotGeo,dotMat);
    dot.position.set(t.x,t.y,t.z);
    dot.userData=t;
    globeGroup.add(dot);
    dotMeshes.push(dot);
    // Pulse ring
    const ringGeo=new THREE.RingGeometry(t.size,t.size*2.5,32);
    const ringMat=new THREE.MeshBasicMaterial({color:new THREE.Color(t.color),transparent:true,opacity:0.5,side:THREE.DoubleSide});
    const ring=new THREE.Mesh(ringGeo,ringMat);
    ring.position.copy(dot.position);
    ring.lookAt(0,0,0);
    ring.userData={baseScale:1,phase:Math.random()*Math.PI*2};
    globeGroup.add(ring);
    pulseMeshes.push(ring);
  });

  // Arcs
  const arcs=[
      ${arcData}
  ];
  const arcLines=[];
  function latLngTo3D(lat,lng,r){
    const phi=(90-lat)*Math.PI/180;
    const theta=(lng+180)*Math.PI/180;
    return new THREE.Vector3(-r*Math.sin(phi)*Math.cos(theta),r*Math.cos(phi),r*Math.sin(phi)*Math.sin(theta));
  }
  arcs.forEach(a=>{
    const start=latLngTo3D(a.fromLat,a.fromLng,1.01);
    const end=latLngTo3D(a.toLat,a.toLng,1.01);
    const mid=start.clone().add(end).multiplyScalar(0.5);
    const dist=start.distanceTo(end);
    mid.normalize().multiplyScalar(1.01+dist*0.35);
    const curve=new THREE.QuadraticBezierCurve3(start,mid,end);
    const pts=curve.getPoints(48);
    const geo=new THREE.BufferGeometry().setFromPoints(pts);
    const mat=new THREE.LineDashedMaterial({
      color:new THREE.Color(a.fromColor),
      transparent:true,opacity:0.5,
      dashSize:0.02,gapSize:0.02
    });
    const line=new THREE.Line(geo,mat);
    line.computeLineDistances();
    line.userData={offset:0};
    globeGroup.add(line);
    arcLines.push(line);
  });

  // Interaction
  let isDragging=false,prevX=0,rotVelX=0,autoRotate=true;
  let lastTap=0,selectedId=null;
  const raycaster=new THREE.Raycaster();
  const mouse=new THREE.Vector2();

  // Long press
  let longPressTimer=null,isLongPress=false,startY=0;

  renderer.domElement.addEventListener('pointerdown',e=>{
    isDragging=true;
    prevX=e.clientX;
    startY=e.clientY;
    autoRotate=false;
    isLongPress=false;
    longPressTimer=setTimeout(()=>{isLongPress=true;},500);
  });
  renderer.domElement.addEventListener('pointermove',e=>{
    if(!isDragging)return;
    if(longPressTimer&&Math.abs(e.clientX-prevX)>10){clearTimeout(longPressTimer);longPressTimer=null;}
    if(isLongPress){
      const dy=startY-e.clientY;
      if(dy>80){
        // Trigger dissolve navigation
        sendMsg({type:'longpress_navigate',territory:selectedId||'ftf'});
        isLongPress=false;
      }
      return;
    }
    const dx=e.clientX-prevX;
    rotVelX=dx*0.005;
    globeGroup.rotation.y+=rotVelX;
    prevX=e.clientX;
  });
  renderer.domElement.addEventListener('pointerup',e=>{
    if(longPressTimer){clearTimeout(longPressTimer);longPressTimer=null;}
    isDragging=false;
    setTimeout(()=>{autoRotate=true;},3000);
    // Detect tap (no drag)
    if(Math.abs(e.clientX-prevX)<5&&!isLongPress){
      mouse.x=(e.clientX/W)*2-1;
      mouse.y=-(e.clientY/H)*2+1;
      raycaster.setFromCamera(mouse,camera);
      const hits=raycaster.intersectObjects(dotMeshes);
      if(hits.length>0){
        const t=hits[0].object.userData;
        const now=Date.now();
        if(selectedId===t.id&&now-lastTap<400){
          // Double tap
          sendMsg({type:'doubletap',territory:t.id});
        }else{
          selectedId=t.id;
          sendMsg({type:'select',territory:t});
        }
        lastTap=now;
      }
    }
    isLongPress=false;
  });

  // Animate
  const clock=new THREE.Clock();
  function animate(){
    requestAnimationFrame(animate);
    const t=clock.getElapsedTime();
    // Auto rotate
    if(autoRotate) globeGroup.rotation.y+=0.001;
    // Momentum
    if(!isDragging){rotVelX*=0.95;globeGroup.rotation.y+=rotVelX;}
    // Pulse rings
    pulseMeshes.forEach(ring=>{
      const phase=ring.userData.phase;
      const s=1+0.8*((Math.sin(t*2+phase)+1)/2);
      ring.scale.set(s,s,s);
      ring.material.opacity=0.5*(1-((s-1)/0.8));
    });
    // Arc dash animation
    arcLines.forEach(line=>{
      line.userData.offset+=0.001;
      line.material.dashOffset=-line.userData.offset;
    });
    renderer.render(scene,camera);
  }
  animate();

  // Resize
  window.addEventListener('resize',()=>{
    const w=window.innerWidth,h=window.innerHeight;
    camera.aspect=w/h;
    camera.updateProjectionMatrix();
    renderer.setSize(w,h);
  });

  // Messaging helper (works on both native and web iframe)
  function sendMsg(data){
    var msg=JSON.stringify(data);
    if(window.ReactNativeWebView){window.ReactNativeWebView.postMessage(msg);}
    else{window.parent.postMessage(msg,'*');}
  }
  // Signal ready
  sendMsg({type:'ready'});
})();
</script>
</body>
</html>`;
}
