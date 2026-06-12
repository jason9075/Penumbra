import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';

/* ── Shared geometry ── */
const GROUND_GEO = new THREE.PlaneGeometry(14, 14);

/* ── Demo subject: castle assembled from primitives ── */
const STONE_MAT = new THREE.MeshStandardMaterial({ color: '#C0CAD8', roughness: 0.55, metalness: 0.05 });
const ROOF_MAT = new THREE.MeshStandardMaterial({ color: '#7B85A8', roughness: 0.45, metalness: 0.1 });
const GATE_MAT = new THREE.MeshStandardMaterial({ color: '#2A2D3A', roughness: 0.9, metalness: 0 });

function mkCastle() {
  const castle = new THREE.Group();
  // The group origin stays at world (0, 0, 0) so lights keep aiming at the
  // origin; children are offset down so the castle base rests on the ground.
  const BASE = -1.2;

  const add = (geo, mat, x, y, z) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, BASE + y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    castle.add(m);
    return m;
  };

  const R = 1.05; // corner-tower offset from centre

  // Corner towers with conical roofs
  const towerGeo = new THREE.CylinderGeometry(0.2, 0.24, 1.2, 16);
  const towerRoofGeo = new THREE.ConeGeometry(0.3, 0.5, 16);
  [[-R, -R], [R, -R], [-R, R], [R, R]].forEach(([x, z]) => {
    add(towerGeo, STONE_MAT, x, 0.6, z);
    add(towerRoofGeo, ROOF_MAT, x, 1.45, z);
  });

  // Curtain walls between the towers
  const wallGeo = new THREE.BoxGeometry(2 * R, 0.65, 0.16);
  [[0, -R, 0], [0, R, 0], [-R, 0, Math.PI / 2], [R, 0, Math.PI / 2]].forEach(([x, z, ry]) => {
    add(wallGeo, STONE_MAT, x, 0.325, z).rotation.y = ry;
  });

  // Merlons along each wall top
  const merlonGeo = new THREE.BoxGeometry(0.12, 0.14, 0.18);
  for (let i = -2; i <= 2; i++) {
    const t = i * 0.38;
    add(merlonGeo, STONE_MAT, t, 0.72, -R);
    add(merlonGeo, STONE_MAT, t, 0.72, R);
    add(merlonGeo, STONE_MAT, -R, 0.72, t).rotation.y = Math.PI / 2;
    add(merlonGeo, STONE_MAT, R, 0.72, t).rotation.y = Math.PI / 2;
  }

  // Central keep with a pyramid roof (4-sided cone, rotated to align with the box)
  add(new THREE.BoxGeometry(0.9, 1.4, 0.9), STONE_MAT, 0, 0.7, 0);
  add(new THREE.ConeGeometry(0.7, 0.6, 4), ROOF_MAT, 0, 1.7, 0).rotation.y = Math.PI / 4;

  // Gate recess on the front wall
  add(new THREE.BoxGeometry(0.36, 0.5, 0.22), GATE_MAT, 0, 0.25, R);

  return castle;
}

/* ── Emission direction indicator ── */
function mkArrow(dir, origin, length, color = 0xFFC878, opacity = 0.55) {
  const a = new THREE.ArrowHelper(
    dir.clone().normalize(), origin, length, color,
    Math.min(length * 0.22, 0.35), Math.min(length * 0.12, 0.18),
  );
  a.line.material.transparent = true;
  a.line.material.opacity = opacity;
  a.cone.material.transparent = true;
  a.cone.material.opacity = opacity;
  a.setColor = (c) => { a.line.material.color.set(c); a.cone.material.color.set(c); };
  return a;
}

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

  // Bright matte floor: shadows are the absence of light, so penumbra
  // gradients only read against a high-albedo diffuse surface.
  const ground = new THREE.Mesh(
    GROUND_GEO,
    new THREE.MeshStandardMaterial({ color: '#6E7890', roughness: 0.95, metalness: 0 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Faint grid — kept subtle so its lines don't compete with shadow edges
  const grid = new THREE.GridHelper(14, 20, 0x39415A, 0x232938);
  grid.position.y = -1.19;
  grid.material.transparent = true;
  grid.material.opacity = 0.25;
  scene.add(grid);

  const castle = mkCastle();
  scene.add(castle);

  scene.add(new THREE.AmbientLight('#2A2D3A', 0.5));

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(0, 0, 0);
  controls.minDistance = 2;
  controls.maxDistance = 14;
  controls.maxPolarAngle = Math.PI * 0.52;

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
    renderer, scene, camera, castle, ground, controls, resize,
    dispose() {
      window.removeEventListener('resize', resize);
      controls.dispose();
      renderer.dispose();
    },
  };
}

/* ── Render-loop wrapper: static scenes, render while active ── */
function mkRunner(base, onParam) {
  const { renderer, scene, camera, controls, resize } = base;
  let raf = null;
  let running = false;

  function tick() {
    if (!running) return;
    raf = requestAnimationFrame(tick);
    controls.update();
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

  const light = new THREE.DirectionalLight('#FFFFFF', 3);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  Object.assign(light.shadow.camera, { near: 0.5, far: 20, left: -4, right: 4, top: 4, bottom: -4 });
  scene.add(light);

  // Parallel emission arrows. In group-local space they point straight down
  // (light at angle 0 sits directly overhead); rotating the group by the same
  // angle as the light keeps arrows exactly anti-parallel to light.position.
  const DOWN = new THREE.Vector3(0, -1, 0);
  const rayGroup = new THREE.Group();
  for (let i = -3; i <= 3; i++) {
    rayGroup.add(mkArrow(DOWN, new THREE.Vector3(i * 1.1, 4.2, -1), 4.4));
  }
  scene.add(rayGroup);

  function setAngle(deg) {
    const r = (deg * Math.PI) / 180;
    light.position.set(-Math.sin(r) * 5, Math.cos(r) * 5, 2);
    rayGroup.rotation.z = r;
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

  // Spherical emitter approximated by sample lights on the sphere surface
  // (centre + octahedron vertices). Spreading the samples apart makes their
  // shadow maps overlap into a real penumbra: radius 0 collapses to a hard
  // point light, larger radii soften edges and show contact hardening.
  const OFFSETS = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1),
  ];
  const emitter = new THREE.Group();
  scene.add(emitter);

  const lights = OFFSETS.map(() => {
    // Low-res maps blur each sub-shadow just enough to blend the samples
    const l = new THREE.PointLight('#FFFFFF', 5 / OFFSETS.length, 14, 2);
    l.castShadow = true;
    l.shadow.mapSize.set(256, 256);
    emitter.add(l);
    return l;
  });

  const bulbMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1, 24, 24),
    new THREE.MeshBasicMaterial({ color: '#FFFFFF' }),
  );
  emitter.add(bulbMesh);

  // SpriteMaterial without a map renders as a solid square — bake a radial
  // gradient texture so the glow falls off to fully transparent edges.
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = glowCanvas.height = 128;
  const ctx = glowCanvas.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.5)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(glowCanvas),
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  emitter.add(glow);

  // Omnidirectional emission arrows around the bulb — repositioned by
  // setRadius so they always start just outside the emitter surface
  const arrows = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const dir = new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
    const arrow = mkArrow(dir, dir, 0.65);
    arrow.userData.dir = dir;
    arrows.push(arrow);
    emitter.add(arrow);
  }

  function setRadius(r) {
    lights.forEach((l, i) => l.position.copy(OFFSETS[i]).multiplyScalar(r));
    bulbMesh.scale.setScalar(Math.max(r, 0.1));
    glow.scale.set(1.2 + r * 2.5, 1.2 + r * 2.5, 1);
    arrows.forEach(a => a.position.copy(a.userData.dir).multiplyScalar(Math.max(r, 0.1) + 0.18));
  }
  setRadius(0.2);

  emitter.position.set(1.6, 1.4, 1.4);

  return mkRunner(base, (id, val) => {
    if (id === 'intensity') lights.forEach(l => { l.intensity = val / lights.length; });
    if (id === 'radius') setRadius(val);
    if (id === 'posX') emitter.position.x = val;
  });
}

/* ── Rect Area Light ── */
function mkRect(canvas) {
  const base = mkBase(canvas);
  const { scene } = base;

  const light = new THREE.RectAreaLight('#FFFFFF', 8, 2.5, 2);
  light.position.set(-2.5, 1, 1.5);
  light.lookAt(0, 0, 0);
  scene.add(light);

  scene.add(new RectAreaLightHelper(light));

  // Forward emission arrows — RectAreaLight shines along its local -Z,
  // so the group copies the light's post-lookAt orientation.
  const FWD = new THREE.Vector3(0, 0, -1);
  const rayGroup = new THREE.Group();
  rayGroup.position.copy(light.position);
  rayGroup.quaternion.copy(light.quaternion);
  [[0, 0], [-0.7, -0.45], [0.7, -0.45], [-0.7, 0.45], [0.7, 0.45]].forEach(([x, y]) => {
    rayGroup.add(mkArrow(FWD, new THREE.Vector3(x, y, -0.12), 1.2));
  });
  scene.add(rayGroup);

  return mkRunner(base, (id, val) => {
    if (id === 'width') light.width = val;
    if (id === 'height') light.height = val;
  });
}

/* ── Cylinder (Tube Light) ── */
function mkCylinder(canvas) {
  const base = mkBase(canvas);
  const { scene } = base;

  // Centre height + length chosen so the tube clears the castle (keep roof
  // tip at y ≈ 0.8) at every rotation angle.
  const tubeH = 2.2;
  const tubeY = 2.0;

  // The whole lamp (tube + glow layers) lives in one group so rotation stays in sync
  const lamp = new THREE.Group();
  lamp.position.set(0, tubeY, 0);
  scene.add(lamp);

  // Tube + glow are unit-radius cylinders scaled in x/z by setRadius
  const tubeMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, tubeH, 20),
    new THREE.MeshBasicMaterial({ color: '#FFFFFF' }),
  );
  lamp.add(tubeMesh);

  // Layered additive glow — inner tight halo + outer soft falloff,
  // each padded outward from the tube surface
  const glows = [[0.08, 0.22], [0.25, 0.07]].map(([pad, opacity]) => {
    const g = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, tubeH, 20),
      new THREE.MeshBasicMaterial({
        color: '#FFFFFF',
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    g.userData.pad = pad;
    lamp.add(g);
    return g;
  });

  // Shadow-mapped samples approximating the fluorescent tube: spread along
  // the axis (a line emitter is soft along its length even at radius 0) and
  // pushed outward radially by setRadius, so a thicker tube also softens
  // shadows across the axis. Staggered angles keep the 5 samples covering
  // the whole cross-section instead of one side.
  const halfSpan = tubeH / 2 - 0.2;
  const lights = [];
  for (let i = -2; i <= 2; i++) {
    const l = new THREE.PointLight('#FFFFFF', 1.2, 6, 1.5);
    l.castShadow = true;
    l.shadow.mapSize.set(256, 256);
    const a = (i + 2) * ((Math.PI * 2) / 5);
    l.userData.axialY = (i / 2) * halfSpan;
    l.userData.dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    lamp.add(l);
    lights.push(l);
  }

  // Radial emission arrows — perpendicular to the tube axis, none at the ends
  const arrows = [];
  [-0.7, 0, 0.7].forEach(y => {
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dz]) => {
      const dir = new THREE.Vector3(dx, 0, dz);
      const arrow = mkArrow(dir, dir, 0.55, 0xFFC878, 0.5);
      arrow.userData.dir = dir;
      arrow.userData.axialY = y;
      lamp.add(arrow);
      arrows.push(arrow);
    });
  });

  function setRadius(r) {
    const visR = Math.max(r, 0.02); // keep the tube visible at radius 0
    tubeMesh.scale.set(visR, 1, visR);
    glows.forEach(g => g.scale.set(visR + g.userData.pad, 1, visR + g.userData.pad));
    lights.forEach(l => {
      l.position.copy(l.userData.dir).multiplyScalar(r);
      l.position.y = l.userData.axialY;
    });
    arrows.forEach(a => {
      a.position.copy(a.userData.dir).multiplyScalar(visR + 0.12);
      a.position.y = a.userData.axialY;
    });
  }
  setRadius(0.05);

  function applyRotation(deg) {
    lamp.rotation.z = (deg * Math.PI) / 180;
  }
  applyRotation(0);

  return mkRunner(base, (id, val) => {
    if (id === 'radius') setRadius(val);
    if (id === 'rotation') applyRotation(val);
    if (id === 'posX') lamp.position.x = val;
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

  // Wrap the hemisphere light in a group so we can tilt the sky/ground axis
  // without affecting scene geometry.
  const domeGroup = new THREE.Group();
  scene.add(domeGroup);

  const hemi = new THREE.HemisphereLight('#CCDDF0', '#2A2D3C', 2.0);
  domeGroup.add(hemi);

  // Wireframe dome follows the same group so its orientation always matches
  const domeGeo = new THREE.SphereGeometry(2.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const domeMat = new THREE.MeshBasicMaterial({ color: '#88AAFF', wireframe: true, transparent: true, opacity: 0.07 });
  const domeMesh = new THREE.Mesh(domeGeo, domeMat);
  domeMesh.position.y = -1.2;
  domeGroup.add(domeMesh);

  // Arrow indicating sky-light direction (top of the dome)
  const skyArrow = mkArrow(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 2.2, 0), 1.0, 0x88AAFF, 0.6);
  domeGroup.add(skyArrow);

  function applyPreset(name) {
    const p = DOME_PRESETS[name];
    if (!p) return;
    hemi.color.set(p.sky);
    hemi.groundColor.set(p.ground);
    scene.background.set(p.bg);
    domeMat.color.set(p.sky);
    skyArrow.setColor(new THREE.Color(p.sky));
  }
  applyPreset('neutral');

  return mkRunner(base, (id, val) => {
    if (id === 'preset') applyPreset(val);
    if (id === 'intensity') hemi.intensity = val;
    if (id === 'tilt') domeGroup.rotation.z = (val * Math.PI) / 180;
  });
}

/* ── Public factory ── */
const FACTORIES = {
  distant: mkDistant,
  sphere: mkSphere,
  rect: mkRect,
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
