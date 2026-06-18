import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { FBXExporter } from "three/addons/exporters/FBXExporter.js";

const viewport = document.getElementById("viewport");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x181a1f);

const camera = new THREE.PerspectiveCamera(
  60,
  viewport.clientWidth / viewport.clientHeight,
  0.1,
  1000
);

camera.position.set(6, 4, 7);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true
});

renderer.setSize(viewport.clientWidth, viewport.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
viewport.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;

const grid = new THREE.GridHelper(20, 20, 0x444444, 0x2d2d2d);
scene.add(grid);

const axes = new THREE.AxesHelper(3);
scene.add(axes);

const light = new THREE.PointLight(0xffffff, 4);
light.position.set(5, 5, 5);
scene.add(light);

const ambient = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambient);

let currentMode = "3d";
let currentType = "powerball";

let fxGroup = new THREE.Group();
scene.add(fxGroup);

const effects3D = [
  ["powerball", "Power Ball", "Pulsing 3D energy sphere with rings."],
  ["beam", "Beam", "Long anime beam with rings and core."],
  ["lightning", "Lightning", "Jagged 3D lightning bolt."],
  ["aura", "Aura", "Energy aura shell with spikes."],
  ["slash", "Slash Arc", "Curved 3D anime slash arc."],
  ["whip", "Energy Whip", "Curved animated energy whip."],
  ["magiccircle", "Magic Circle", "Floating glowing magic circle."],
  ["domain", "Domain Expansion", "Large barrier sphere and rings."],
  ["bankai", "Bankai Style", "Petal / pressure style energy burst."]
];

const effects2D = [
  ["speedlines", "Speed Lines", "2D speed lines as 3D planes."],
  ["hitspark", "Hit Spark", "2D anime hit spark card."],
  ["impactflash", "Impact Flash", "Sharp flash burst plane."],
  ["mangaburst", "Manga Burst", "Radial manga burst in 3D space."],
  ["explosioncard", "Explosion Card", "Flat explosion shards in 3D space."],
  ["smokecard", "Smoke Card", "Flat smoke puffs in 3D space."],
  ["energyburst", "Energy Burst", "2D energy burst made of planes."],
  ["shockflash", "Shock Flash", "Sharp shock flash card."]
];

const ui = {
  title: document.getElementById("fxTitle"),
  desc: document.getElementById("fxDesc"),
  base: document.getElementById("baseColor"),
  accent: document.getElementById("accentColor"),
  scale: document.getElementById("scale"),
  glow: document.getElementById("glow"),
  speed: document.getElementById("speed"),
  length: document.getElementById("length"),
  density: document.getElementById("density")
};

function makeMaterial(color, opacity = 1) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false
  });
}

function makeRing(radius, color, opacity = 0.9) {
  const geo = new THREE.TorusGeometry(radius, 0.025, 12, 96);
  return new THREE.Mesh(geo, makeMaterial(color, opacity));
}

function makePlane(w, h, color, opacity = 0.85) {
  const geo = new THREE.PlaneGeometry(w, h);
  return new THREE.Mesh(geo, makeMaterial(color, opacity));
}

function makeStarGeometry(points, r1, r2) {
  const shape = new THREE.Shape();

  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? r1 : r2;
    const a = (i / (points * 2)) * Math.PI * 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;

    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }

  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

function clearFX() {
  fxGroup.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();

    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m) => m.dispose && m.dispose());
      } else {
        obj.material.dispose && obj.material.dispose();
      }
    }
  });

  fxGroup.clear();
}

function setTitle() {
  const all = [...effects3D, ...effects2D];
  const found = all.find((e) => e[0] === currentType);

  if (found) {
    ui.title.textContent = found[1];
    ui.desc.textContent = found[2];
  }
}

function rebuild() {
  clearFX();
  setTitle();

  const base = ui.base.value;
  const accent = ui.accent.value;
  const s = Number(ui.scale.value);
  const len = Number(ui.length.value);
  const den = Number(ui.density.value);
  const glow = Number(ui.glow.value);

  if (currentMode === "3d") {
    build3D(currentType, base, accent, s, len, den, glow);
  } else {
    build2D(currentType, base, accent, s, len, den, glow);
  }

  fxGroup.userData.effectType = currentType;
}

function build3D(type, base, accent, s, len, den, glow) {
  if (type === "powerball") {
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.7 * s, 32, 32),
      makeMaterial(base, 0.95)
    );

    fxGroup.add(core);

    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(1.05 * s, 32, 32),
      makeMaterial(base, 0.18 * glow)
    );

    fxGroup.add(shell);

    for (let i = 0; i < 3; i++) {
      const ring = makeRing((1 + i * 0.22) * s, accent, 0.9);
      ring.rotation.set(i * 0.7, i * 0.9, i * 0.4);
      fxGroup.add(ring);
    }

    for (let i = 0; i < den; i++) {
      const p = new THREE.Mesh(
        new THREE.SphereGeometry(0.04 * s, 8, 8),
        makeMaterial(accent, 0.8)
      );

      const a = (i / den) * Math.PI * 2;
      p.position.set(
        Math.cos(a) * 1.5 * s,
        Math.sin(a * 2) * 0.4 * s,
        Math.sin(a) * 1.5 * s
      );

      fxGroup.add(p);
    }
  }

  if (type === "beam") {
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22 * s, 0.22 * s, len * s, 32, 1, true),
      makeMaterial(base, 0.55)
    );

    beam.rotation.z = Math.PI / 2;
    fxGroup.add(beam);

    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07 * s, 0.07 * s, len * 1.08 * s, 32),
      makeMaterial(accent, 0.95)
    );

    core.rotation.z = Math.PI / 2;
    fxGroup.add(core);

    for (let i = 0; i < 5; i++) {
      const ring = makeRing(0.45 * s, base, 0.9);
      ring.position.x = (-len * s) / 2 + i * ((len * s) / 4);
      ring.rotation.y = Math.PI / 2;
      fxGroup.add(ring);
    }
  }

  if (type === "lightning" || type === "whip") {
    const pts = [];

    for (let i = 0; i < den; i++) {
      pts.push(
        new THREE.Vector3(
          (i / den - 0.5) * len * s,
          (Math.random() - 0.5) * s,
          (Math.random() - 0.5) * s
        )
      );
    }

    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.TubeGeometry(curve, 100, 0.045 * s, 8, false);
    fxGroup.add(new THREE.Mesh(tube, makeMaterial(base, 0.95)));

    for (let i = 0; i < Math.floor(den / 4); i++) {
      const branchPts = [];
      const start = pts[Math.floor(Math.random() * pts.length)].clone();

      for (let j = 0; j < 5; j++) {
        branchPts.push(
          start
            .clone()
            .add(
              new THREE.Vector3(
                j * 0.2 * s,
                (Math.random() - 0.5) * s,
                (Math.random() - 0.5) * s
              )
            )
        );
      }

      const bCurve = new THREE.CatmullRomCurve3(branchPts);
      const bTube = new THREE.TubeGeometry(bCurve, 20, 0.02 * s, 6, false);
      fxGroup.add(new THREE.Mesh(bTube, makeMaterial(accent, 0.8)));
    }
  }

  if (type === "aura") {
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(1.2 * s, 32, 32),
      makeMaterial(base, 0.22 * glow)
    );

    fxGroup.add(shell);

    const inner = new THREE.Mesh(
      new THREE.SphereGeometry(0.8 * s, 32, 32),
      makeMaterial(accent, 0.16 * glow)
    );

    fxGroup.add(inner);

    for (let i = 0; i < den; i++) {
      const spike = new THREE.Mesh(
        new THREE.ConeGeometry(0.08 * s, 0.8 * s, 8),
        makeMaterial(base, 0.7)
      );

      const a = (i / den) * Math.PI * 2;
      spike.position.set(Math.cos(a) * 1.1 * s, 0, Math.sin(a) * 1.1 * s);
      spike.lookAt(Math.cos(a) * 3 * s, 0, Math.sin(a) * 3 * s);
      fxGroup.add(spike);
    }
  }

  if (type === "slash") {
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(1.3 * s, 0.08 * s, 12, 96, Math.PI * 1.35),
      makeMaterial(base, 0.9)
    );

    arc.scale.y = 0.35;
    arc.rotation.z = -0.5;
    fxGroup.add(arc);

    const arc2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.05 * s, 0.035 * s, 12, 96, Math.PI * 1.2),
      makeMaterial(accent, 0.8)
    );

    arc2.scale.y = 0.28;
    arc2.rotation.z = -0.5;
    fxGroup.add(arc2);
  }

  if (type === "magiccircle") {
    for (let i = 0; i < 4; i++) {
      const r = makeRing((0.7 + i * 0.25) * s, i % 2 ? accent : base, 0.9);
      r.rotation.x = Math.PI / 2;
      fxGroup.add(r);
    }

    for (let i = 0; i < den; i++) {
      const line = new THREE.Mesh(
        new THREE.BoxGeometry(0.025 * s, 0.025 * s, 0.45 * s),
        makeMaterial(accent, 0.8)
      );

      const a = (i / den) * Math.PI * 2;
      line.position.set(Math.cos(a) * 1.3 * s, 0, Math.sin(a) * 1.3 * s);
      line.rotation.y = -a;
      fxGroup.add(line);
    }
  }

  if (type === "domain") {
    const barrier = new THREE.Mesh(
      new THREE.SphereGeometry(2.2 * s, 48, 48),
      makeMaterial(base, 0.12 * glow)
    );

    fxGroup.add(barrier);

    for (let i = 0; i < 6; i++) {
      const ring = makeRing((1 + i * 0.22) * s, i % 2 ? base : accent, 0.85);
      ring.rotation.set(Math.PI / 2, i * 0.3, i * 0.6);
      fxGroup.add(ring);
    }
  }

  if (type === "bankai") {
    for (let i = 0; i < den; i++) {
      const petal = makePlane(0.15 * s, 0.45 * s, base, 0.75);
      const a = (i / den) * Math.PI * 2;

      petal.position.set(
        Math.cos(a) * 1.4 * s,
        Math.sin(i) * 0.7 * s,
        Math.sin(a) * 1.4 * s
      );

      petal.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      fxGroup.add(petal);
    }

    fxGroup.add(makeRing(1.6 * s, accent, 0.9));
  }
}

function build2D(type, base, accent, s, len, den, glow) {
  if (type === "speedlines") {
    for (let i = 0; i < den; i++) {
      const line = makePlane(len * s * (0.4 + Math.random()), 0.035 * s, base, 0.8);
      line.position.set(
        (Math.random() - 0.5) * 2 * s,
        (Math.random() - 0.5) * 2 * s,
        (Math.random() - 0.5) * 0.2
      );
      fxGroup.add(line);
    }
  }

  if (
    type === "hitspark" ||
    type === "impactflash" ||
    type === "mangaburst" ||
    type === "shockflash"
  ) {
    const points = type === "mangaburst" ? 18 : 10;

    const outer = new THREE.Mesh(
      makeStarGeometry(points, 1.2 * s, 0.25 * s),
      makeMaterial(base, 0.9)
    );

    const inner = new THREE.Mesh(
      makeStarGeometry(10, 0.65 * s, 0.12 * s),
      makeMaterial(accent, 0.9)
    );

    fxGroup.add(outer);
    fxGroup.add(inner);
  }

  if (type === "explosioncard" || type === "energyburst") {
    for (let i = 0; i < den; i++) {
      const tri = new THREE.Mesh(
        new THREE.ConeGeometry(0.12 * s, 0.9 * s, 3),
        makeMaterial(i % 2 ? base : accent, 0.85)
      );

      const a = (i / den) * Math.PI * 2;
      tri.position.set(Math.cos(a) * 0.5 * s, Math.sin(a) * 0.5 * s, 0);
      tri.rotation.z = a - Math.PI / 2;
      fxGroup.add(tri);
    }
  }

  if (type === "smokecard") {
    for (let i = 0; i < den; i++) {
      const puff = new THREE.Mesh(
        new THREE.CircleGeometry((0.15 + Math.random() * 0.35) * s, 24),
        makeMaterial(base, 0.35 * glow)
      );

      puff.position.set(
        (Math.random() - 0.5) * 2 * s,
        (Math.random() - 0.5) * 1.2 * s,
        (Math.random() - 0.5) * 0.2
      );

      fxGroup.add(puff);
    }
  }
}

function buildButtons() {
  const list = document.getElementById("effectList");
  list.innerHTML = "";

  const arr = currentMode === "3d" ? effects3D : effects2D;

  arr.forEach(([id, name]) => {
    const btn = document.createElement("button");
    btn.className = "effect-btn";
    btn.textContent = name;

    btn.onclick = () => {
      currentType = id;
      rebuild();
    };

    list.appendChild(btn);
  });
}

document.getElementById("tab3d").onclick = () => {
  currentMode = "3d";
  currentType = "powerball";

  document.getElementById("tab3d").classList.add("active");
  document.getElementById("tab2d").classList.remove("active");

  buildButtons();
  rebuild();
};

document.getElementById("tab2d").onclick = () => {
  currentMode = "2d";
  currentType = "speedlines";

  document.getElementById("tab2d").classList.add("active");
  document.getElementById("tab3d").classList.remove("active");

  buildButtons();
  rebuild();
};

Object.values(ui).forEach((el) => {
  if (el instanceof HTMLInputElement) {
    el.addEventListener("input", rebuild);
  }
});

document.getElementById("resetCam").onclick = () => {
  camera.position.set(6, 4, 7);
  controls.target.set(0, 0, 0);
  controls.update();
};

function downloadBlob(blob, name) {
  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);

  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

document.getElementById("exportGLB").onclick = () => {
  const exporter = new GLTFExporter();

  exporter.parse(
    fxGroup,
    (result) => {
      const blob =
        result instanceof ArrayBuffer
          ? new Blob([result], { type: "model/gltf-binary" })
          : new Blob([JSON.stringify(result)], { type: "application/json" });

      downloadBlob(blob, `${currentType}.glb`);
    },
    (error) => {
      alert("GLB export failed: " + error);
    },
    { binary: true }
  );
};

document.getElementById("exportFBX").onclick = () => {
  try {
    const exporter = new FBXExporter();
    const data = exporter.parse(fxGroup);

    downloadBlob(
      new Blob([data], { type: "application/octet-stream" }),
      `${currentType}.fbx`
    );
  } catch (error) {
    alert("FBX export failed. Try GLB instead. Error: " + error.message);
  }
};

let t = 0;

function animate() {
  requestAnimationFrame(animate);

  const speed = Number(ui.speed.value);
  t += 0.016 * speed;

  fxGroup.rotation.y += 0.005 * speed;

  fxGroup.children.forEach((obj, i) => {
    if (
      currentType === "powerball" ||
      currentType === "magiccircle" ||
      currentType === "domain"
    ) {
      obj.rotation.x += 0.01 * (i % 3 + 1) * speed;
      obj.rotation.y += 0.008 * (i % 2 + 1) * speed;
    }

    if (currentMode === "2d") {
      const pulse = 1 + Math.sin(t * 2 + i) * 0.08;
      obj.scale.setScalar(pulse);
    }

    if (currentType === "bankai") {
      obj.rotation.y += 0.01 * speed;
      obj.position.y += Math.sin(t + i) * 0.001;
    }
  });

  controls.update();
  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = viewport.clientWidth / viewport.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(viewport.clientWidth, viewport.clientHeight);
});

buildButtons();
rebuild();
animate();
