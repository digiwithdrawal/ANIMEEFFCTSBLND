import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { FBXExporter } from 'three/addons/exporters/FBXExporter.js';

const FX3D = [
  ['powerball','Power Ball','Pulsing 3D energy sphere with rings and glow shells.'],
  ['beam','Beam','Long animated energy beam with core and outer glow.'],
  ['lightning','Lightning','Branching 3D electric bolts with flicker.'],
  ['aura','Aura','Character-style rising energy shell and spikes.'],
  ['slash','Slash','Curved 3D sword slash arc.'],
  ['whip','Energy Whip','Segmented curved energy whip.'],
  ['magicCircle','Magic Circle','Rotating rune-like circles and symbols.'],
  ['domain','Domain Expansion','Large barrier sphere with rings and fracture lines.'],
  ['bankai','Bankai Style','Spiritual pressure rings, petals, and dark aura.']
];
const FX2D = [
  ['speedLines','Speed Lines','2D anime speed cards placed in 3D space.'],
  ['hitSpark','Hit Spark','Flat starburst spark mesh in 3D space.'],
  ['impactFlash','Impact Flash','Bright animated flash card.'],
  ['explosionCard','Explosion Card','Layered 2D explosion burst planes.'],
  ['smokeCard','Smoke Card','Soft transparent smoke puff cards.'],
  ['mangaBurst','Manga Burst','Comic-style radial action burst.'],
  ['energyBurst','Energy Burst','2D energy flare made from transparent cards.'],
  ['shockFlash','Shock Flash','Circular flash shock card.']
];

const $ = id => document.getElementById(id);
let currentTab = '3d';
let currentFx = 'powerball';
let currentDesc = FX3D[0][2];
let effectGroup = null;
let exportClips = [];
const clock = new THREE.Clock();

const viewport = $('viewport');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1b1c20);
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 2000);
camera.position.set(7,5,9);
const renderer = new THREE.WebGLRenderer({antialias:true, preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
viewport.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0,1,0);

scene.add(new THREE.GridHelper(30, 30, 0x4b4f58, 0x30333a));
scene.add(new THREE.AxesHelper(4));
const hemi = new THREE.HemisphereLight(0xffffff, 0x222233, 1.8);
scene.add(hemi);
const dir = new THREE.DirectionalLight(0xffffff, 1.5);
dir.position.set(5,10,6);
scene.add(dir);

function settings(){return{
  colorA:$('colorA').value,colorB:$('colorB').value,
  scale:+$('scale').value, glow:+$('glow').value, speed:+$('speed').value,
  density:+$('density').value, length:+$('length').value, thickness:+$('thickness').value
};}
function mat(color, opacity=1, side=THREE.DoubleSide){return new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity,side,depthWrite:opacity>.6});}
function emissive(color, opacity=1){return mat(color,opacity,THREE.DoubleSide);}
function nameObj(obj,name){obj.name=name.replace(/\s+/g,'_'); return obj;}
function clearEffect(){if(effectGroup){scene.remove(effectGroup); dispose(effectGroup);} effectGroup=null; exportClips=[];}
function dispose(o){o.traverse(c=>{if(c.geometry)c.geometry.dispose(); if(c.material){if(Array.isArray(c.material))c.material.forEach(m=>m.dispose()); else c.material.dispose();}})}

function makeGlowSphere(r,color,opacity){return new THREE.Mesh(new THREE.SphereGeometry(r,48,24), emissive(color,opacity));}
function makePlaneStar(points, r1, r2, color, opacity){
  const shape = new THREE.Shape();
  for(let i=0;i<points*2;i++){const r=i%2?r2:r1; const a=i*Math.PI/points; const x=Math.cos(a)*r, y=Math.sin(a)*r; i?shape.lineTo(x,y):shape.moveTo(x,y);}
  shape.closePath();
  return new THREE.Mesh(new THREE.ShapeGeometry(shape), emissive(color,opacity));
}
function makeBolt(points, len, spread, color, thickness){
  const g = new THREE.Group();
  let prev = new THREE.Vector3(-len/2,0,0);
  for(let i=1;i<points;i++){
    const t=i/(points-1); const p=new THREE.Vector3(-len/2+t*len,(Math.random()-.5)*spread,(Math.random()-.5)*spread);
    const mid=prev.clone().lerp(p,.5); const dist=prev.distanceTo(p);
    const cyl=new THREE.Mesh(new THREE.CylinderGeometry(thickness,thickness,dist,8), emissive(color,.9));
    cyl.position.copy(mid); cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), p.clone().sub(prev).normalize());
    g.add(cyl); prev=p;
  }
  return g;
}

function rebuild(){
  clearEffect();
  const s=settings();
  effectGroup = new THREE.Group();
  effectGroup.name = `AnimeFX_${currentFx}`;
  effectGroup.userData = {fx:currentFx, settings:s};
  scene.add(effectGroup);
  const A=s.colorA, B=s.colorB, sc=s.scale;
  const glowOpacity = Math.min(0.7, 0.08 + s.glow/18);
  const softGlow = Math.min(0.45, 0.04 + s.glow/30);

  if(currentFx==='powerball'){
    const core=nameObj(makeGlowSphere(sc*.55,A,.95),'PowerBall_Core'); effectGroup.add(core);
    effectGroup.add(nameObj(makeGlowSphere(sc*.8,A,glowOpacity),'PowerBall_Glow'));
    effectGroup.add(nameObj(makeGlowSphere(sc*1.08,A,softGlow),'PowerBall_OuterGlow'));
    for(let i=0;i<3;i++){const tor=nameObj(new THREE.Mesh(new THREE.TorusGeometry(sc*(.8+i*.18), s.thickness*.035, 12, 96), emissive(i%2?B:A,.75)),`PowerBall_Ring_${i}`); tor.rotation.set(Math.PI/2*(i%2), Math.PI/3*i, 0); effectGroup.add(tor);}
    for(let i=0;i<s.density*8;i++){const p=new THREE.Mesh(new THREE.SphereGeometry(sc*.035,8,8), emissive(B,.9)); const a=i*.8; p.position.set(Math.cos(a)*sc*1.2, Math.sin(i)*sc*.5, Math.sin(a)*sc*1.2); p.name=`Particle_${i}`; effectGroup.add(p);}
  }
  if(currentFx==='beam'){
    const core=nameObj(new THREE.Mesh(new THREE.CylinderGeometry(s.thickness*.45,s.thickness*.45,s.length,32,1,true), emissive(A,.85)),'Beam_Core'); core.rotation.z=Math.PI/2; effectGroup.add(core);
    const outer=nameObj(new THREE.Mesh(new THREE.CylinderGeometry(s.thickness*.85,s.thickness*.85,s.length,32,1,true), emissive(A,softGlow)),'Beam_Glow'); outer.rotation.z=Math.PI/2; effectGroup.add(outer);
    for(let i=0;i<s.density;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(s.thickness*.95,.025,8,48), emissive(B,.75)); ring.position.x=-s.length/2+i*(s.length/(s.density-1||1)); ring.rotation.y=Math.PI/2; ring.name=`Beam_Ring_${i}`; effectGroup.add(ring);}
  }
  if(currentFx==='lightning'){
    effectGroup.add(nameObj(makeBolt(10+s.density*3,s.length,s.scale,A,s.thickness*.035),'Lightning_Main'));
    for(let i=0;i<s.density;i++){const br=makeBolt(4, s.length*.25, s.scale*.6, B, s.thickness*.02); br.position.x=(Math.random()-.5)*s.length; br.rotation.z=(Math.random()-.5)*2; br.name=`Lightning_Branch_${i}`; effectGroup.add(br);}
  }
  if(currentFx==='aura'){
    effectGroup.add(nameObj(makeGlowSphere(sc*1.1,A,softGlow),'Aura_Shell'));
    for(let i=0;i<s.density*3;i++){const cone=new THREE.Mesh(new THREE.ConeGeometry(sc*.11,sc*(.9+Math.random()),10), emissive(i%2?B:A,.6)); const a=i/s.density*2.1; cone.position.set(Math.cos(a)*sc*.75,Math.random()*sc*.9,Math.sin(a)*sc*.75); cone.lookAt(cone.position.clone().multiplyScalar(2).add(new THREE.Vector3(0,sc,0))); cone.name=`Aura_Spike_${i}`; effectGroup.add(cone);}
  }
  if(currentFx==='slash'){
    const arc=new THREE.Mesh(new THREE.TorusGeometry(sc*1.5,s.thickness*.12,12,128,Math.PI*1.25), emissive(A,.85)); arc.name='Slash_Arc'; arc.rotation.set(0,0,-.6); effectGroup.add(arc);
    const arc2=new THREE.Mesh(new THREE.TorusGeometry(sc*1.75,s.thickness*.06,8,128,Math.PI*.8), emissive(B,.45)); arc2.name='Slash_Trail'; arc2.rotation.set(.2,0,-.9); effectGroup.add(arc2);
  }
  if(currentFx==='whip'){
    for(let i=0;i<18;i++){const seg=new THREE.Mesh(new THREE.SphereGeometry(s.thickness*(.22-i*.006),12,8), emissive(i%2?B:A,.85)); const t=i/17; seg.position.set((t-.5)*s.length, Math.sin(t*Math.PI*2)*sc*.5, Math.cos(t*Math.PI*1.5)*sc*.3); seg.name=`Whip_Segment_${i}`; effectGroup.add(seg);}
  }
  if(currentFx==='magicCircle'){
    for(let i=0;i<4;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(sc*(.8+i*.28),.025+(.01*i),8,128), emissive(i%2?B:A,.9)); ring.name=`Magic_Ring_${i}`; ring.rotation.x=Math.PI/2; effectGroup.add(ring);}
    for(let i=0;i<Math.max(8,s.density*3);i++){const box=new THREE.Mesh(new THREE.BoxGeometry(sc*.08,sc*.02,sc*.35), emissive(B,.85)); const a=i/(s.density*3)*Math.PI*2; box.position.set(Math.cos(a)*sc*1.25,0,Math.sin(a)*sc*1.25); box.rotation.y=-a; box.name=`Rune_${i}`; effectGroup.add(box);}
  }
  if(currentFx==='domain'){
    effectGroup.add(nameObj(makeGlowSphere(sc*2.5,A,Math.max(0.06, softGlow*.55)),'Domain_Barrier'));
    for(let i=0;i<5;i++){const r=new THREE.Mesh(new THREE.TorusGeometry(sc*(1.2+i*.35),.02,8,128), emissive(i%2?B:A,.55)); r.name=`Domain_Ring_${i}`; r.rotation.set(Math.random()*Math.PI,Math.random()*Math.PI,0); effectGroup.add(r);}
    for(let i=0;i<s.density*3;i++){const crack=makeBolt(4,sc*1.1,sc*.5,B,.015); crack.name=`Domain_Fracture_${i}`; crack.position.set((Math.random()-.5)*sc*3,(Math.random()-.5)*sc*3,(Math.random()-.5)*sc*3); crack.rotation.set(Math.random()*3,Math.random()*3,Math.random()*3); effectGroup.add(crack);}
  }
  if(currentFx==='bankai'){
    effectGroup.add(nameObj(makeGlowSphere(sc*1.2,A,softGlow),'Bankai_Aura'));
    for(let i=0;i<s.density*12;i++){const petal=new THREE.Mesh(new THREE.PlaneGeometry(sc*.12,sc*.28), emissive(i%2?A:B,.75)); const a=Math.random()*Math.PI*2; petal.position.set(Math.cos(a)*sc*(.5+Math.random()*1.5),Math.random()*sc*2,Math.sin(a)*sc*(.5+Math.random()*1.5)); petal.rotation.set(Math.random()*3,Math.random()*3,Math.random()*3); petal.name=`Bankai_Petal_${i}`; effectGroup.add(petal);}
    for(let i=0;i<3;i++){const r=new THREE.Mesh(new THREE.TorusGeometry(sc*(1+i*.4),.035,8,128), emissive(A,.5)); r.rotation.x=Math.PI/2; r.name=`Pressure_Ring_${i}`; effectGroup.add(r);}
  }

  // 2D card based FX, still placed in 3D space
  if(['hitSpark','impactFlash','energyBurst','shockFlash','mangaBurst'].includes(currentFx)){
    const pts=currentFx==='mangaBurst'?24:12; const star=nameObj(makePlaneStar(pts,sc*1.5,sc*.35,A,.86),currentFx+'_Card'); star.position.y=sc*.6; effectGroup.add(star);
    const star2=nameObj(makePlaneStar(pts,sc*.9,sc*.15,B,.55),currentFx+'_CoreCard'); star2.position.z=.03; star2.position.y=sc*.6; effectGroup.add(star2);
  }
  if(currentFx==='speedLines'){
    for(let i=0;i<s.density*7;i++){const line=new THREE.Mesh(new THREE.PlaneGeometry(s.thickness*.12, s.length*(.3+Math.random()*.7)), emissive(i%2?A:B,.75)); line.position.set((Math.random()-.5)*sc*5,(Math.random()-.5)*sc*3, (Math.random()-.5)*sc*3); line.rotation.set(Math.random()*Math.PI,Math.random()*Math.PI,Math.random()*Math.PI); line.name=`SpeedLine_${i}`; effectGroup.add(line);}
  }
  if(currentFx==='explosionCard'){
    for(let i=0;i<4;i++){const star=makePlaneStar(10,sc*(1.6-i*.25),sc*(.5-i*.1),i%2?B:A,.35+i*.12); star.position.z=i*.03; star.position.y=sc*.5; star.rotation.z=i*.4; star.name=`Explosion_Layer_${i}`; effectGroup.add(star);}
  }
  if(currentFx==='smokeCard'){
    for(let i=0;i<s.density*3;i++){const puff=new THREE.Mesh(new THREE.CircleGeometry(sc*(.25+Math.random()*.45),24), emissive(A,.18)); puff.position.set((Math.random()-.5)*sc*2,Math.random()*sc*1.4,(Math.random()-.5)*sc*.5); puff.rotation.y=(Math.random()-.5)*.8; puff.name=`Smoke_Puff_${i}`; effectGroup.add(puff);}
  }

  exportClips = buildClips(effectGroup, s);
}

function buildClips(group,s){
  const tracks=[]; const dur=2;
  group.children.forEach((o,i)=>{
    if(o.type==='Group') return;
    const nm=o.name;
    tracks.push(new THREE.NumberKeyframeTrack(`${nm}.rotation[y]`, [0,dur], [o.rotation.y, o.rotation.y + Math.PI*2*s.speed*(i%2?1:-1)]));
    if(i%3===0) tracks.push(new THREE.VectorKeyframeTrack(`${nm}.scale`, [0,dur/2,dur], [1,1,1, 1.15,1.15,1.15, 1,1,1]));
  });
  return [new THREE.AnimationClip('AnimeFX_Loop', dur, tracks)];
}

function animate(){
  requestAnimationFrame(animate);
  const t=clock.getElapsedTime(); const s=settings();
  if(effectGroup){
    effectGroup.children.forEach((o,i)=>{
      o.rotation.y += 0.004*s.speed*(i%2?1:-1);
      if(o.material && o.material.opacity !== undefined && o.material.transparent){o.material.opacity = Math.max(.06, Math.min(.95, o.material.opacity + Math.sin(t*s.speed*3+i)*.002));}
      if(o.name.includes('Lightning')) o.visible = Math.sin(t*20*s.speed+i) > -.4;
      if(o.name.includes('SpeedLine')) o.position.x += .035*s.speed; if(o.name.includes('SpeedLine') && o.position.x>s.scale*3) o.position.x=-s.scale*3;
      if(o.name.includes('Bankai_Petal')) {o.position.y += .01*s.speed; o.rotation.z += .02*s.speed; if(o.position.y>s.scale*2.2)o.position.y=0;}
      if(o.name.includes('Smoke_Puff')) {o.scale.setScalar(1+Math.sin(t*s.speed+i)*.12);}
    });
    effectGroup.scale.setScalar(1+Math.sin(t*s.speed*2)*.025);
  }
  controls.update(); renderer.render(scene,camera);
}
function resize(){const w=viewport.clientWidth,h=viewport.clientHeight; camera.aspect=w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h,false);} window.addEventListener('resize',resize);

function renderList(){
  const list=currentTab==='3d'?FX3D:FX2D; $('fxList').innerHTML='';
  list.forEach(([id,title,desc])=>{const b=document.createElement('button'); b.className='fx-btn'+(id===currentFx?' active':''); b.textContent=title; b.onclick=()=>{currentFx=id; currentDesc=desc; $('effectTitle').textContent=title; $('effectDesc').textContent=desc; renderList(); rebuild();}; $('fxList').appendChild(b);});
}
$('tab3d').onclick=()=>{currentTab='3d'; $('tab3d').classList.add('active'); $('tab2d').classList.remove('active'); currentFx=FX3D[0][0]; $('effectTitle').textContent=FX3D[0][1]; $('effectDesc').textContent=FX3D[0][2]; renderList(); rebuild();};
$('tab2d').onclick=()=>{currentTab='2d'; $('tab2d').classList.add('active'); $('tab3d').classList.remove('active'); currentFx=FX2D[0][0]; $('effectTitle').textContent=FX2D[0][1]; $('effectDesc').textContent=FX2D[0][2]; renderList(); rebuild();};
['colorA','colorB','scale','glow','speed','density','length','thickness'].forEach(id=>$(id).addEventListener('input',rebuild));
$('resetCam').onclick=()=>{camera.position.set(7,5,9); controls.target.set(0,1,0); controls.update();};

function cleanClone(){
  const root=effectGroup.clone(true); root.name=`AnimeFX_${currentFx}`;
  root.traverse(o=>{ if(o.material) o.material=o.material.clone(); if(o.geometry) o.geometry=o.geometry.clone(); });
  return root;
}
function download(blob,filename){const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
$('exportGlb').onclick=()=>{
  const root=cleanClone();
  const exporter=new GLTFExporter();
  exporter.parse(root,(res)=>{const blob=res instanceof ArrayBuffer?new Blob([res],{type:'model/gltf-binary'}):new Blob([JSON.stringify(res)],{type:'application/json'}); download(blob,`${currentFx}.glb`);},(err)=>alert('GLB export failed: '+err.message),{binary:true,animations:exportClips});
};
$('exportFbx').onclick=()=>{
  try{
    const root=cleanClone();
    const exporter=new FBXExporter();
    let didSave=false;
    const saveData=(data)=>{
      if(didSave || data===undefined || data===null) return;
      didSave=true;
      const blob=data instanceof ArrayBuffer
        ? new Blob([data],{type:'application/octet-stream'})
        : new Blob([data],{type:'text/plain;charset=utf-8'});
      download(blob,`${currentFx}.fbx`);
    };
    const result=exporter.parse(root, saveData, {animations:exportClips, binary:false});
    saveData(result);
  }catch(e){alert('FBX export failed in this browser. Try GLB or use Chrome desktop. Error: '+e.message);}
};

resize(); renderList(); rebuild(); animate();
