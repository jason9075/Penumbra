import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';

/* ── Shared geometry ── */
const SPHERE_GEO = new THREE.SphereGeometry(0.8, 48, 48);
const GROUND_GEO = new THREE.PlaneGeometry(14, 14);

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

  const ground = new THREE.Mesh(
    GROUND_GEO,
    new THREE.MeshStandardMaterial({ color: '#1A1F2C', roughness: 0.9, metalness: 0 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Subtle grid so the floor plane reads against the dark background
  const grid = new THREE.GridHelper(14, 20, 0x39415A, 0x232938);
  grid.position.y = -1.19;
  grid.material.transparent = true;
  grid.material.opacity = 0.55;
  scene.add(grid);

  const sphere = new THREE.Mesh(
    SPHERE_GEO,
    new THREE.MeshStandardMaterial({ color: '#C0CAD8', roughness: 0.35, metalness: 0.05 }),
  );
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  scene.add(sphere);

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
    renderer, scene, camera, sphere, ground, controls, resize,
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

  const light = new THREE.DirectionalLight('#F0F4FF', 3);
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

  const light = new THREE.PointLight('#FFCC88', 5, 14, 2);
  light.castShadow = true;
  light.shadow.mapSize.set(512, 512);
  scene.add(light);

  const bulbMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 16),
    new THREE.MeshBasicMaterial({ color: '#FFDD99' }),
  );
  scene.add(bulbMesh);

  // SpriteMaterial without a map renders as a solid square — bake a radial
  // gradient texture so the glow falls off to fully transparent edges.
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = glowCanvas.height = 128;
  const ctx = glowCanvas.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255, 200, 120, 1)');
  grad.addColorStop(0.3, 'rgba(255, 170, 68, 0.5)');
  grad.addColorStop(1, 'rgba(255, 170, 68, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(glowCanvas),
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  glow.scale.set(1.8, 1.8, 1);
  scene.add(glow);

  // Omnidirectional emission arrows around the bulb
  const rayGroup = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const dir = new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
    rayGroup.add(mkArrow(dir, dir.clone().multiplyScalar(0.3), 0.65));
  }
  scene.add(rayGroup);

  function setPosition(x) {
    light.position.set(x, 1.4, 1.4);
    bulbMesh.position.copy(light.position);
    glow.position.copy(light.position);
    rayGroup.position.copy(light.position);
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

/* ── Disk (Spot Light) ── */
function mkDisk(canvas) {
  const base = mkBase(canvas);
  const { scene, sphere } = base;

  const light = new THREE.SpotLight('#FFFFFF', 8, 16, Math.PI / 8, 0.45, 1.5);
  light.position.set(0, 2.5, 0.5);
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

  // Downward emission arrows — outer ones splay to match the cone angle
  const rayGroup = new THREE.Group();
  rayGroup.position.copy(light.position);
  scene.add(rayGroup);
  rayGroup.add(mkArrow(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -0.15, 0), 1.1));
  const outerArrows = [[-1, 0], [1, 0], [0, -1], [0, 1]].map(([ux, uz]) => {
    const arrow = mkArrow(new THREE.Vector3(0, -1, 0), new THREE.Vector3(ux * 0.4, -0.15, uz * 0.4), 1.1);
    arrow.userData.out = new THREE.Vector3(ux, 0, uz);
    rayGroup.add(arrow);
    return arrow;
  });

  function setConeAngle(deg) {
    const r = (deg * Math.PI) / 180;
    light.angle = r;
    outerArrows.forEach(arrow => {
      const { out } = arrow.userData;
      arrow.setDirection(
        new THREE.Vector3(out.x * Math.sin(r), -Math.cos(r), out.z * Math.sin(r)).normalize(),
      );
    });
  }
  setConeAngle(22);

  return mkRunner(base, (id, val) => {
    if (id === 'angle') setConeAngle(val);
    if (id === 'height') {
      light.position.y = val;
      diskMesh.position.y = val;
      rayGroup.position.y = val;
    }
    if (id === 'posX') {
      light.position.x = val;
      diskMesh.position.x = val;
      rayGroup.position.x = val;
    }
  });
}

/* ── Cylinder (Tube Light) ── */
function mkCylinder(canvas) {
  const base = mkBase(canvas);
  const { scene } = base;

  // Centre height + length chosen so the tube clears the 0.8-radius sphere
  // at every rotation angle (closest approach ≥ 0.9).
  const tubeH = 2.2;
  const tubeY = 2.0;

  // The whole lamp (tube + glow layers) lives in one group so rotation stays in sync
  const lamp = new THREE.Group();
  lamp.position.set(0, tubeY, 0);
  scene.add(lamp);

  lamp.add(new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, tubeH, 20),
    new THREE.MeshBasicMaterial({ color: '#F4F8FF' }),
  ));

  // Layered additive glow — inner tight halo + outer soft falloff
  [[0.13, 0.22], [0.3, 0.07]].forEach(([radius, opacity]) => {
    lamp.add(new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, tubeH, 20),
      new THREE.MeshBasicMaterial({
        color: '#9FB4FF',
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    ));
  });

  // Point lights distributed along the tube axis to approximate a linear emitter.
  // They stay inside the lamp group so they follow its rotation automatically.
  const halfSpan = tubeH / 2 - 0.2;
  for (let i = -2; i <= 2; i++) {
    const l = new THREE.PointLight('#AABBFF', 1.2, 6, 1.5);
    l.position.y = (i / 2) * halfSpan;
    lamp.add(l);
  }

  // Radial emission arrows — perpendicular to the tube axis, none at the ends
  [-0.7, 0, 0.7].forEach(y => {
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dz]) => {
      const dir = new THREE.Vector3(dx, 0, dz);
      const origin = new THREE.Vector3(dx * 0.38, y, dz * 0.38);
      lamp.add(mkArrow(dir, origin, 0.55, 0x9FB4FF, 0.5));
    });
  });

  function applyRotation(deg) {
    lamp.rotation.z = (deg * Math.PI) / 180;
  }
  applyRotation(0);

  return mkRunner(base, (id, val) => {
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
