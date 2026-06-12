import * as THREE from 'three';
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';

/* ── Shared geometry ── */
const SPHERE_GEO = new THREE.SphereGeometry(0.8, 48, 48);
const GROUND_GEO = new THREE.PlaneGeometry(14, 14);

/* ── Base scene factory ── */
function mkBase(canvas, bgHex = '#0E1016') {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bgHex);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 60);
  camera.position.set(0, 1.5, 4.8);
  camera.lookAt(0, 0, 0);

  const ground = new THREE.Mesh(
    GROUND_GEO,
    new THREE.MeshStandardMaterial({ color: '#0A0C12', roughness: 0.95, metalness: 0 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.2;
  ground.receiveShadow = true;
  scene.add(ground);

  const sphere = new THREE.Mesh(
    SPHERE_GEO,
    new THREE.MeshStandardMaterial({ color: '#C0CAD8', roughness: 0.35, metalness: 0.05 }),
  );
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  scene.add(sphere);

  scene.add(new THREE.AmbientLight('#2A2D3A', 0.5));

  function resize() {
    const w = canvas.clientWidth || 640;
    const h = canvas.clientHeight || 400;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  return {
    renderer, scene, camera, sphere, ground, resize,
    dispose() { window.removeEventListener('resize', resize); renderer.dispose(); },
  };
}

/* ── Render-loop wrapper: static scenes, render while active ── */
function mkRunner(base, onParam) {
  const { renderer, scene, camera, resize } = base;
  let raf = null;
  let running = false;

  function tick() {
    if (!running) return;
    raf = requestAnimationFrame(tick);
    renderer.render(scene, camera);
  }

  return {
    start() {
      if (running) return;
      running = true;
      resize();
      raf = requestAnimationFrame(tick);
    },
    stop() { running = false; cancelAnimationFrame(raf); },
    setParam(id, val) { onParam(id, val); },
    dispose() { base.dispose(); },
  };
}

/* ── Distant ── */
function mkDistant(canvas) {
  const base = mkBase(canvas);
  const { scene } = base;

  const light = new THREE.DirectionalLight('#F0F4FF', 3);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  Object.assign(light.shadow.camera, { near: 0.5, far: 20, left: -4, right: 4, top: 4, bottom: -4 });
  scene.add(light);

  const rayMat = new THREE.LineBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.1 });
  const rayGroup = new THREE.Group();
  for (let i = -5; i <= 5; i++) {
    const pts = [new THREE.Vector3(i * 1.4 - 2.8, 4.5, -1), new THREE.Vector3(i * 1.4 + 2.8, -4.5, -1)];
    rayGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), rayMat));
  }
  scene.add(rayGroup);

  function setAngle(deg) {
    const r = (deg * Math.PI) / 180;
    light.position.set(-Math.sin(r) * 5, Math.cos(r) * 5, 2);
    rayGroup.rotation.z = -(r - Math.PI / 4);
  }
  setAngle(45);

  return mkRunner(base, (id, val) => {
    if (id === 'angle') setAngle(val);
  });
}

/* ── Sphere (Point Light) ── */
function mkSphere(canvas) {
  const base = mkBase(canvas);
  const { scene } = base;

  const light = new THREE.PointLight('#FFCC88', 5, 14, 2);
  light.castShadow = true;
  light.shadow.mapSize.set(512, 512);
  scene.add(light);

  const bulbMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 16),
    new THREE.MeshBasicMaterial({ color: '#FFDD99' }),
  );
  scene.add(bulbMesh);

  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    color: '#FFAA44',
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  glow.scale.set(1.8, 1.8, 1);
  scene.add(glow);

  function setPosition(x) {
    light.position.set(x, 1.4, 1.4);
    bulbMesh.position.copy(light.position);
    glow.position.copy(light.position);
  }
  setPosition(1.6);

  return mkRunner(base, (id, val) => {
    if (id === 'intensity') light.intensity = val;
    if (id === 'distance') light.distance = val;
    if (id === 'posX') setPosition(val);
  });
}

/* ── Rect Area Light ── */
function mkRect(canvas) {
  const base = mkBase(canvas);
  const { scene } = base;

  const light = new THREE.RectAreaLight('#F0F0FF', 8, 2.5, 2);
  light.position.set(-2.5, 1, 1.5);
  light.lookAt(0, 0, 0);
  scene.add(light);

  scene.add(new RectAreaLightHelper(light));

  return mkRunner(base, (id, val) => {
    if (id === 'width') light.width = val;
    if (id === 'height') light.height = val;
  });
}

/* ── Disk (Spot Light) ── */
function mkDisk(canvas) {
  const base = mkBase(canvas);
  const { scene, sphere } = base;

  const light = new THREE.SpotLight('#FFFFFF', 8, 16, Math.PI / 8, 0.45, 1.5);
  light.position.set(0, 3.5, 0.5);
  light.target = sphere;
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.camera.near = 0.5;
  light.shadow.camera.far = 18;
  scene.add(light);
  scene.add(light.target);

  const diskMesh = new THREE.Mesh(
    new THREE.CircleGeometry(0.6, 48),
    new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.75, side: THREE.DoubleSide }),
  );
  diskMesh.rotation.x = Math.PI / 2;
  diskMesh.position.copy(light.position);
  scene.add(diskMesh);

  return mkRunner(base, (id, val) => {
    if (id === 'angle') light.angle = (val * Math.PI) / 180;
    if (id === 'height') {
      light.position.y = val;
      diskMesh.position.y = val;
    }
  });
}

/* ── Cylinder (Tube Light) ── */
function mkCylinder(canvas) {
  const base = mkBase(canvas);
  const { scene } = base;

  const tubeH = 4;
  const tubeMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, tubeH, 20),
    new THREE.MeshBasicMaterial({ color: '#EEF4FF', transparent: true, opacity: 0.95 }),
  );
  tubeMesh.position.set(0, 1.8, 0);
  scene.add(tubeMesh);

  const glowMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, tubeH, 20),
    new THREE.MeshBasicMaterial({ color: '#8899EE', transparent: true, opacity: 0.14, side: THREE.BackSide, depthWrite: false }),
  );
  glowMesh.position.copy(tubeMesh.position);
  scene.add(glowMesh);

  // Point lights distributed along tube axis to approximate a linear emitter
  const tubeLights = [];
  for (let i = -2; i <= 2; i++) {
    const l = new THREE.PointLight('#AABBFF', 1.0, 5, 1.5);
    l.userData.t = i;
    scene.add(l);
    tubeLights.push(l);
  }

  function applyRotation(deg) {
    const r = (deg * Math.PI) / 180;
    tubeMesh.rotation.z = r;
    glowMesh.rotation.z = r;
    tubeLights.forEach(l => {
      const offset = l.userData.t;
      l.position.set(
        Math.sin(r) * offset * (tubeH / 4),
        1.8 + Math.cos(r) * offset * (tubeH / 4),
        0,
      );
    });
  }
  applyRotation(0);

  return mkRunner(base, (id, val) => {
    if (id === 'rotation') applyRotation(val);
  });
}

/* ── Dome (Hemisphere Light) ── */
const DOME_PRESETS = {
  neutral: { sky: '#CCDDF0', ground: '#2A2D3C', bg: '#0C1220' },
  sunset: { sky: '#FF9944', ground: '#441808', bg: '#160604' },
  night: { sky: '#1A2A55', ground: '#060810', bg: '#030408' },
};

function mkDome(canvas) {
  const base = mkBase(canvas, '#0C1220');
  const { scene } = base;

  scene.children
    .filter(c => c.isAmbientLight)
    .forEach(a => { a.intensity = 0.2; });

  const hemi = new THREE.HemisphereLight('#CCDDF0', '#2A2D3C', 2.0);
  scene.add(hemi);

  const domeGeo = new THREE.SphereGeometry(2.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const domeMat = new THREE.MeshBasicMaterial({ color: '#88AAFF', wireframe: true, transparent: true, opacity: 0.07 });
  const domeMesh = new THREE.Mesh(domeGeo, domeMat);
  domeMesh.position.y = -1.2;
  scene.add(domeMesh);

  function applyPreset(name) {
    const p = DOME_PRESETS[name];
    if (!p) return;
    hemi.color.set(p.sky);
    hemi.groundColor.set(p.ground);
    scene.background.set(p.bg);
    domeMat.color.set(p.sky);
  }
  applyPreset('neutral');

  return mkRunner(base, (id, val) => {
    if (id === 'preset') applyPreset(val);
  });
}

/* ── Public factory ── */
const FACTORIES = {
  distant: mkDistant,
  sphere: mkSphere,
  rect: mkRect,
  disk: mkDisk,
  cylinder: mkCylinder,
  dome: mkDome,
};

export function createScene(id, canvas) {
  const factory = FACTORIES[id];
  if (!factory) return null;
  try {
    return factory(canvas);
  } catch (e) {
    console.error(`Failed to create scene "${id}":`, e);
    return null;
  }
}
