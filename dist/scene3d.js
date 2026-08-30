/**
 * Hero WebGL scene — a slowly rising spiral of bricks.
 * Progressive enhancement: if WebGL is unavailable or the user prefers reduced
 * motion, the static hero image stays visible and this module bails out early.
 */
import {
  ACESFilmicToneMapping,
  AmbientLight,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  PCFShadowMap,
  Scene,
  ShadowMaterial,
  Shape,
  SRGBColorSpace,
  Vector2,
  WebGLRenderer,
} from './assets/vendor/three.module.min.js';

const mount = document.querySelector('[data-hero-3d]');
if (mount) init(mount);

function init(mount) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (error) {
    return; // No WebGL — the fallback image is already on screen.
  }
  if (!renderer.getContext()) return;

  const palette = {
    blue: 0x2433a7,
    blueDeep: 0x151f78,
    cyan: 0x45bce4,
    sky: 0xdff4fb,
    paper: 0xf7fbfe,
  };

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.domElement.classList.add('hero-canvas');
  renderer.domElement.setAttribute('aria-hidden', 'true');
  mount.appendChild(renderer.domElement);
  mount.classList.add('is-live');
  document.documentElement.classList.add('has-webgl-hero');

  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 1.4, 12.2);
  camera.lookAt(0, 0.35, 0);

  // ---- Lighting: bright key, cool fill, cyan rim ----------------------------
  scene.add(new AmbientLight(0xffffff, 1.45));

  const key = new DirectionalLight(0xffffff, 2.5);
  key.position.set(5.5, 8.5, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 30;
  key.shadow.camera.left = -8;
  key.shadow.camera.right = 8;
  key.shadow.camera.top = 8;
  key.shadow.camera.bottom = -8;
  key.shadow.bias = -0.0012;
  key.shadow.radius = 3;
  scene.add(key);

  const fill = new DirectionalLight(palette.sky, 1.1);
  fill.position.set(-6, 2, 4);
  scene.add(fill);

  const rim = new PointLight(palette.cyan, 26, 22, 2);
  rim.position.set(-3.4, 3.2, -4.2);
  scene.add(rim);

  // ---- Geometry -------------------------------------------------------------
  const brickGeometry = createBrickGeometry(1.5, 0.74, 0.68, 0.1);

  const materials = [
    new MeshStandardMaterial({ color: palette.blue, roughness: 0.34, metalness: 0.16 }),
    new MeshStandardMaterial({ color: palette.blueDeep, roughness: 0.3, metalness: 0.22 }),
    new MeshStandardMaterial({ color: palette.cyan, roughness: 0.26, metalness: 0.12 }),
    new MeshStandardMaterial({ color: palette.paper, roughness: 0.42, metalness: 0.05 }),
  ];

  const tower = new Group();
  scene.add(tower);

  const BRICK_COUNT = 15;
  const bricks = [];

  for (let i = 0; i < BRICK_COUNT; i += 1) {
    const t = i / (BRICK_COUNT - 1);
    // Weight the palette so cyan and white bricks read as occasional accents.
    const material = materials[i % 4 === 3 ? (i % 8 === 7 ? 3 : 2) : i % 2];
    const brick = new Mesh(brickGeometry, material);

    const angle = t * Math.PI * 2.4;
    const radius = MathUtils.lerp(2.1, 1.15, t);

    brick.position.set(Math.cos(angle) * radius, MathUtils.lerp(-2.6, 2.9, t), Math.sin(angle) * radius);
    brick.rotation.y = -angle + Math.PI / 2;
    brick.castShadow = true;
    brick.receiveShadow = true;

    bricks.push({
      mesh: brick,
      baseY: brick.position.y,
      baseRotZ: MathUtils.randFloatSpread(0.08),
      phase: i * 0.55,
      drift: 0.05 + Math.random() * 0.05,
    });

    tower.add(brick);
  }

  // Soft contact shadow so the tower feels grounded rather than pasted on.
  const ground = new Mesh(new PlaneGeometry(26, 26), new ShadowMaterial({ opacity: 0.07 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -3.25;
  ground.receiveShadow = true;
  scene.add(ground);

  // ---- Interaction ----------------------------------------------------------
  const pointer = new Vector2(0, 0);
  const targetPointer = new Vector2(0, 0);
  let scrollProgress = 0;

  const onPointerMove = (event) => {
    const rect = mount.getBoundingClientRect();
    targetPointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      ((event.clientY - rect.top) / rect.height) * 2 - 1,
    );
  };

  const onPointerLeave = () => targetPointer.set(0, 0);

  const track = mount.closest('.hero-track') || mount.closest('.hero') || mount;

  const onScroll = () => {
    const rect = track.getBoundingClientRect();
    // 0 at the top of the track, 1 once the pinned section has scrolled through.
    const travel = Math.max(rect.height - window.innerHeight, 1);
    scrollProgress = MathUtils.clamp(-rect.top / travel, 0, 1);
  };

  if (!reduceMotion) {
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    mount.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---- Sizing ---------------------------------------------------------------
  let dollyNear = 8.5;
  let dollyFar = 15.5;

  const resize = () => {
    const width = mount.clientWidth;
    const height = mount.clientHeight;
    if (!width || !height) return;

    renderer.setSize(width, height, false);
    camera.aspect = width / height;

    // Full-bleed canvas: offset the tower into the empty right-hand side so it
    // never sits under the headline, and give narrow screens more distance.
    const wide = width >= 900;
    tower.position.x = wide ? MathUtils.clamp(camera.aspect * 1.9, 2.5, 4.4) : 0;
    dollyFar = wide ? 15.5 : 17.5;
    dollyNear = wide ? 8.5 : 11;

    camera.updateProjectionMatrix();
  };

  resize();
  new ResizeObserver(resize).observe(mount);

  // ---- Render loop (paused when off-screen or in a hidden tab) --------------
  let frame = null;
  let inView = true;
  let elapsed = 0;
  let last = performance.now();

  const render = (now) => {
    frame = requestAnimationFrame(render);
    const delta = Math.min((now - last) / 1000, 0.05);
    last = now;
    elapsed += delta;

    pointer.lerp(targetPointer, 0.055);

    // Ease the push-in so the start of the scroll feels unhurried.
    const dolly = 1 - Math.pow(1 - scrollProgress, 2);
    camera.position.z = MathUtils.lerp(dollyFar, dollyNear, dolly);
    camera.position.y = MathUtils.lerp(1.4, 2.6, dolly) + pointer.y * 0.35;
    camera.lookAt(tower.position.x * 0.12, 0.35 - dolly * 0.8, 0);

    tower.rotation.y = elapsed * 0.16 + pointer.x * 0.42 + scrollProgress * 2.1;
    tower.rotation.x = pointer.y * 0.1;
    tower.position.y = -scrollProgress * 1.6;

    for (const brick of bricks) {
      brick.mesh.position.y = brick.baseY + Math.sin(elapsed * 0.85 + brick.phase) * brick.drift;
      brick.mesh.rotation.z = brick.baseRotZ + Math.sin(elapsed * 0.6 + brick.phase) * 0.022;
    }

    renderer.render(scene, camera);
  };

  const start = () => {
    if (frame === null && inView && !document.hidden) {
      last = performance.now();
      frame = requestAnimationFrame(render);
    }
  };

  const stop = () => {
    if (frame !== null) {
      cancelAnimationFrame(frame);
      frame = null;
    }
  };

  if (reduceMotion) {
    renderer.render(scene, camera); // One static frame, no loop.
  } else {
    new IntersectionObserver((entries) => {
      inView = entries[0].isIntersecting;
      if (inView) start();
      else stop();
    }, { threshold: 0 }).observe(mount);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else start();
    });

    start();
  }

  renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    stop();
    mount.classList.remove('is-live');
  });
}

/** Bevelled brick — ExtrudeGeometry keeps this in the core build (no addons). */
function createBrickGeometry(width, height, depth, radius) {
  const shape = new Shape();
  const w = width / 2 - radius;
  const h = height / 2 - radius;

  shape.moveTo(-w - radius, -h);
  shape.lineTo(-w - radius, h);
  shape.quadraticCurveTo(-w - radius, h + radius, -w, h + radius);
  shape.lineTo(w, h + radius);
  shape.quadraticCurveTo(w + radius, h + radius, w + radius, h);
  shape.lineTo(w + radius, -h);
  shape.quadraticCurveTo(w + radius, -h - radius, w, -h - radius);
  shape.lineTo(-w, -h - radius);
  shape.quadraticCurveTo(-w - radius, -h - radius, -w - radius, -h);

  const geometry = new ExtrudeGeometry(shape, {
    depth: depth - radius,
    bevelEnabled: true,
    bevelThickness: radius * 0.9,
    bevelSize: radius * 0.7,
    bevelSegments: 4,
    curveSegments: 8,
  });

  geometry.center();
  return geometry;
}
