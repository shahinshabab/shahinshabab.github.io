/*
 * 3D background for the portfolio.
 *
 * A "data skyline" (an instanced bar chart rendered as city blocks) with floating
 * wireframe solids, a node network and drifting particles. The camera flies
 * through it as the page scrolls; the pointer lifts nearby bars.
 *
 * Source file: bundled to assets/js/scene.js with `npm run build`.
 */
import {
  AmbientLight, BoxGeometry, BufferGeometry, Color, DirectionalLight, DynamicDrawUsage,
  EdgesGeometry, Float32BufferAttribute, Fog, Group, IcosahedronGeometry, InstancedMesh,
  LineBasicMaterial, LineSegments, MathUtils, MeshLambertMaterial, Object3D, OctahedronGeometry,
  PerspectiveCamera, Plane, Points, PointsMaterial, Raycaster, Scene, SphereGeometry,
  TorusGeometry, Vector2, Vector3, WebGLRenderer, Mesh,
} from 'three';

(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = window.matchMedia('(max-width: 760px)').matches || window.matchMedia('(pointer: coarse)').matches;

  var canvas = document.createElement('canvas');
  canvas.className = 'fx-canvas';
  canvas.setAttribute('aria-hidden', 'true');

  var renderer;
  try {
    renderer = new WebGLRenderer({ canvas: canvas, alpha: true, antialias: !small, powerPreference: 'high-performance' });
  } catch (e) {
    return; // No WebGL: the regular 2D page is already complete.
  }
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.75));
  document.body.insertBefore(canvas, document.body.firstChild);

  // ---------- Palette (follows the site's light / dark theme) ----------
  var PALETTES = {
    dark: { bg: 0x070b14, a: 0x2dd4c8, b: 0x6b93ff, fade: 0.5, amb: 0.85, sun: 1.7, wire: 0.55, dots: 0.75 },
    light: { bg: 0xf7f8fb, a: 0x0e9f9a, b: 0x2f6bff, fade: 0.58, amb: 1.0, sun: 1.15, wire: 0.5, dots: 0.6 },
  };
  var palette = PALETTES.dark;

  // ---------- Scene / camera ----------
  var scene = new Scene();
  scene.fog = new Fog(0x070b14, 14, 62);
  var camera = new PerspectiveCamera(50, 1, 0.1, 120);
  var ambient = new AmbientLight(0xffffff, 1);
  var sun = new DirectionalLight(0xffffff, 1.5);
  sun.position.set(6, 12, 8);
  scene.add(ambient, sun);

  // ---------- Bar-chart skyline ----------
  var COLS = small ? 22 : 34;
  var ROWS = small ? 44 : 70;
  var GAP = 1.15;
  var COUNT = COLS * ROWS;
  var X0 = -((COLS - 1) * GAP) / 2;
  var Z0 = 10;

  var barGeo = new BoxGeometry(0.82, 1, 0.82);
  barGeo.translate(0, 0.5, 0); // pivot at the base so scale.y grows upward
  var barMat = new MeshLambertMaterial({ color: 0xffffff });
  var bars = new InstancedMesh(barGeo, barMat, COUNT);
  bars.instanceMatrix.setUsage(DynamicDrawUsage);
  bars.frustumCulled = false;
  scene.add(bars);

  var seed = new Float32Array(COUNT);
  var px = new Float32Array(COUNT);
  var pz = new Float32Array(COUNT);
  var edge = new Float32Array(COUNT);   // 0 along the centre lane, 1 out on the flanks
  var height = new Float32Array(COUNT);
  var rnd = 1337;
  function rand() { rnd = (rnd * 16807) % 2147483647; return (rnd - 1) / 2147483646; }

  for (var r = 0, i = 0; r < ROWS; r++) {
    for (var c = 0; c < COLS; c++, i++) {
      px[i] = X0 + c * GAP;
      pz[i] = Z0 - r * GAP;
      seed[i] = rand();
      edge[i] = MathUtils.smoothstep(Math.abs(px[i]), 2.4, 13);
      height[i] = 0.2;
    }
  }

  function paintBars() {
    var bg = new Color(palette.bg), a = new Color(palette.a), b = new Color(palette.b);
    var col = new Color();
    for (var n = 0; n < COUNT; n++) {
      col.copy(a).lerp(b, MathUtils.clamp((Z0 - pz[n]) / (ROWS * GAP) * 1.4 + (seed[n] - 0.5) * 0.35, 0, 1));
      col.lerp(bg, palette.fade - seed[n] * 0.18);
      bars.setColorAt(n, col);
    }
    bars.instanceColor.needsUpdate = true;
  }

  // ---------- Floating solids ----------
  var shapes = new Group();
  scene.add(shapes);
  var wireMats = [];
  var floaters = [];

  function wire(geo, color) {
    var m = new LineBasicMaterial({ color: color, transparent: true, opacity: 0.55 });
    wireMats.push({ mat: m, key: color });
    return new LineSegments(new EdgesGeometry(geo), m);
  }

  function addFloater(geo, key, x, y, z, scale, spin) {
    var g = new Group();
    var solid = new Mesh(geo, new MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, flatShading: true }));
    solid.userData.key = key;
    g.add(solid, wire(geo, key));
    g.position.set(x, y, z);
    g.scale.setScalar(scale);
    shapes.add(g);
    floaters.push({ g: g, baseX: x, baseY: y, spin: spin, phase: rand() * 6.28, solid: solid });
  }

  addFloater(new IcosahedronGeometry(1, 1), 'a', 8.5, 5.2, 2, 2.1, [0.12, 0.2]);
  addFloater(new TorusGeometry(1, 0.34, 14, 36), 'b', -9, 4.2, -9, 1.9, [0.2, 0.1]);
  addFloater(new OctahedronGeometry(1, 0), 'a', 9.5, 6.3, -20, 2.2, [0.15, 0.24]);
  addFloater(new IcosahedronGeometry(1, 0), 'b', -8.5, 5.4, -30, 2.0, [0.1, 0.18]);
  addFloater(new TorusGeometry(1, 0.3, 14, 36), 'a', 9, 4.6, -41, 2.0, [0.22, 0.12]);
  addFloater(new OctahedronGeometry(1, 1), 'b', -9, 6.0, -52, 2.3, [0.14, 0.2]);

  // ---------- Node network ----------
  var network = new Group();
  network.position.set(small ? 4 : 10.5, small ? 6.6 : 6.4, -6);
  scene.add(network);
  var nodeGeo = new SphereGeometry(0.11, 10, 10);
  var nodeMat = new MeshLambertMaterial({ color: 0xffffff });
  var nodePts = [];
  for (var k = 0; k < 34; k++) {
    var u = rand() * 6.283, v = Math.acos(2 * rand() - 1), rad = 2.6 * Math.cbrt(rand());
    nodePts.push(new Vector3(rad * Math.sin(v) * Math.cos(u), rad * Math.sin(v) * Math.sin(u), rad * Math.cos(v)));
  }
  var linkPos = [];
  nodePts.forEach(function (p, a) {
    var m = new Mesh(nodeGeo, nodeMat);
    m.position.copy(p);
    network.add(m);
    for (var b = a + 1; b < nodePts.length; b++) {
      if (p.distanceTo(nodePts[b]) < 1.9) linkPos.push(p.x, p.y, p.z, nodePts[b].x, nodePts[b].y, nodePts[b].z);
    }
  });
  var linkGeo = new BufferGeometry();
  linkGeo.setAttribute('position', new Float32BufferAttribute(linkPos, 3));
  var linkMat = new LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
  network.add(new LineSegments(linkGeo, linkMat));

  // ---------- Particles ----------
  var DOTS = small ? 220 : 520;
  var dotPos = new Float32Array(DOTS * 3);
  for (var d = 0; d < DOTS; d++) {
    dotPos[d * 3] = (rand() - 0.5) * 50;
    dotPos[d * 3 + 1] = 0.5 + rand() * 15;
    dotPos[d * 3 + 2] = 18 - rand() * 90;
  }
  var dotGeo = new BufferGeometry();
  dotGeo.setAttribute('position', new Float32BufferAttribute(dotPos, 3));
  var dotMat = new PointsMaterial({ size: 0.09, sizeAttenuation: true, transparent: true, opacity: 0.7, color: 0xffffff, depthWrite: false });
  var dots = new Points(dotGeo, dotMat);
  scene.add(dots);

  // ---------- Theme ----------
  function applyTheme() {
    palette = PALETTES[root.getAttribute('data-theme') === 'light' ? 'light' : 'dark'];
    var a = new Color(palette.a), b = new Color(palette.b);
    scene.fog.color.setHex(palette.bg);
    ambient.intensity = palette.amb;
    sun.intensity = palette.sun;
    wireMats.forEach(function (w) { w.mat.color.copy(w.key === 'a' ? a : b); w.mat.opacity = palette.wire; });
    floaters.forEach(function (f) { f.solid.material.color.copy(f.solid.userData.key === 'a' ? a : b); });
    nodeMat.color.copy(a);
    linkMat.color.copy(b);
    dotMat.color.copy(a);
    dotMat.opacity = palette.dots;
    paintBars();
    requestRender();
  }

  // ---------- Input ----------
  var ptr = new Vector2(0, 0);       // smoothed NDC pointer
  var ptrTarget = new Vector2(0, 0);
  var ptrActive = 0;                 // 0..1 fades the bar lift in/out
  var ptrActiveTarget = 0;
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    ptrTarget.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    ptrActiveTarget = 1;
  }, { passive: true });
  document.addEventListener('pointerleave', function () { ptrActiveTarget = 0; });

  var scrollP = 0, scrollTarget = 0;
  function readScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    scrollTarget = max > 0 ? MathUtils.clamp(window.scrollY / max, 0, 1) : 0;
  }
  window.addEventListener('scroll', readScroll, { passive: true });

  var spread = 1;
  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // Pull floating solids toward the middle on narrow viewports so they stay visible.
    spread = MathUtils.clamp(camera.aspect / 1.7, 0.42, 1);
    floaters.forEach(function (f) { f.g.position.x = f.baseX * spread; });
    readScroll();
    requestRender();
  }
  window.addEventListener('resize', resize);

  // ---------- Frame ----------
  var ray = new Raycaster();
  var floor = new Plane(new Vector3(0, 1, 0), 0);
  var hit = new Vector3();
  var look = new Vector3();
  var dummy = new Object3D();
  var clock = 0, last = 0;
  var running = false, enabled = true, queued = false;

  function frame(now, still) {
    var dt = Math.min((now - last) / 1000 || 0.016, 0.05);
    last = now;
    if (!still) clock += dt;

    // smoothing
    var ease = still ? 1 : 1 - Math.pow(0.001, dt);
    scrollP += (scrollTarget - scrollP) * Math.min(ease * 0.9, 1);
    ptr.lerp(ptrTarget, Math.min(ease * 0.9, 1));
    ptrActive += (ptrActiveTarget - ptrActive) * Math.min(ease, 1);

    // camera flight: forward along the avenue, gentle S-curve, pointer parallax
    var p = scrollP;
    var camZ = 14 - p * 62;
    camera.position.set(
      Math.sin(p * Math.PI * 2) * 2.4 + ptr.x * 1.4,
      6.4 - p * 1.4 + ptr.y * 0.6,
      camZ
    );
    look.set(Math.sin(p * Math.PI * 2 + 0.9) * 2.0 + ptr.x * 0.8, 1.6, camZ - 22);
    camera.lookAt(look);
    camera.updateMatrixWorld();

    // pointer position on the ground plane, for the bar lift
    var lift = false;
    if (ptrActive > 0.02 && !small) {
      ray.setFromCamera(ptr, camera);
      lift = ray.ray.intersectPlane(floor, hit) !== null;
    }

    // update the bars
    var t = clock;
    var follow = still ? 1 : Math.min(dt * 5, 1);
    for (var n = 0; n < COUNT; n++) {
      var x = px[n], z = pz[n];
      var wave = 0.5 + 0.5 * Math.sin(x * 0.45 + t * 0.7) * Math.cos(z * 0.32 - t * 0.55);
      var target = 0.18 + edge[n] * (0.4 + 5.2 * (0.3 * wave + 0.7 * seed[n] * seed[n]));
      if (lift) {
        var dx = x - hit.x, dz = z - hit.z;
        target += 3.4 * ptrActive * Math.exp(-(dx * dx + dz * dz) / 7);
      }
      height[n] += (target - height[n]) * follow;
      dummy.position.set(x, 0, z);
      dummy.scale.set(1, height[n], 1);
      dummy.updateMatrix();
      bars.setMatrixAt(n, dummy.matrix);
    }
    bars.instanceMatrix.needsUpdate = true;

    // floaters, network, particles
    for (var f = 0; f < floaters.length; f++) {
      var fl = floaters[f];
      fl.g.rotation.x = t * fl.spin[0] + fl.phase;
      fl.g.rotation.y = t * fl.spin[1];
      fl.g.position.y = fl.baseY + Math.sin(t * 0.6 + fl.phase) * 0.45;
    }
    network.rotation.y = t * 0.12;
    network.rotation.x = Math.sin(t * 0.2) * 0.25;
    dots.rotation.y = Math.sin(t * 0.05) * 0.06;
    dots.position.y = Math.sin(t * 0.3) * 0.25;

    renderer.render(scene, camera);
  }

  function loop(now) {
    if (!running) return;
    frame(now, false);
    requestAnimationFrame(loop);
  }

  function start() {
    if (running || !enabled || document.hidden || reduceMotion) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
  }
  function stop() { running = false; }

  // Reduced motion (or a paused tab) still gets correct single frames on resize / theme change.
  function requestRender() {
    if (running || queued || !enabled) return;
    queued = true;
    requestAnimationFrame(function (now) {
      queued = false;
      if (!enabled) return;
      if (reduceMotion) { scrollP = scrollTarget; clock = 4; }
      frame(now, true);
    });
  }

  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });

  // ---------- On / off toggle ----------
  var toggle = document.getElementById('fx-toggle');
  var saved = null;
  try { saved = localStorage.getItem('fx3d'); } catch (e) {}

  function setEnabled(on, persist) {
    enabled = on;
    root.classList.toggle('fx3d', on);
    if (toggle) {
      toggle.setAttribute('aria-pressed', on ? 'true' : 'false');
      toggle.title = on ? 'Turn 3D effects off' : 'Turn 3D effects on';
    }
    if (persist) { try { localStorage.setItem('fx3d', on ? '1' : '0'); } catch (e) {} }
    if (on) { start(); requestRender(); } else { stop(); }
  }

  if (toggle) {
    toggle.hidden = false;
    toggle.addEventListener('click', function () { setEnabled(!enabled, true); });
  }

  // Boot
  new MutationObserver(applyTheme).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  resize();
  applyTheme();
  scrollP = scrollTarget;
  setEnabled(saved !== '0', false);
})();
