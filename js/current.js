// Shared parts for CurrentClear: physics constants, number formatting, chart boards, wires as paths
// with flowing dots, cells and batteries, bulbs, meters, switches, fuses and small helpers.
// Wires, electrons and meters follow OhmsLawClear; boards and stage helpers follow TorqueClear,
// so the physics boxes look alike. Scenes are built in "model units" (about 10 cm each) unless a
// chapter says otherwise: +x to the right, +y up, +z towards you.
import { THREE, M, rod, box, sphere, spring, canvasTexture, clamp } from './kit.js';

// ---------------------------------------------------------------- physics
// Elementary charge, exact since the 2019 SI redefinition (BIPM SI Brochure, 9th ed.).
export const QE = 1.602176634e-19;                      // C
export const PER_C = 1 / QE;                             // electrons in one coulomb, about 6.24 × 10¹⁸
// Copper: resistivity 1.72e-8 Ω·m at 20 °C (IACS annealed copper); one free electron per atom,
// n = 8.49e28 per m³ (density 8.96 g/cm³, molar mass 63.55 g/mol).
export const CU = { rho: 1.72e-8, n: 8.49e28 };
// Drift speed v = I ÷ (n A e). 0.3 A in a 0.25 mm² torch wire is about 0.09 mm/s.
export const driftSpeed = (I, areaMm2) => I / (CU.n * areaMm2 * 1e-6 * QE);
// India's mains: 230 V ± 10 %, 50 Hz (Central Electricity Authority supply regulations, IS 12360).
// United States: 120 V, 60 Hz (ANSI C84.1).
export const MAINS = { in: { V: 230, f: 50, name: 'India' }, us: { V: 120, f: 60, name: 'USA' } };

// Numbers with sensible units: 0.0023 A → "2.3 mA", 12000 Ω → "12 kΩ".
export function si(v, unit, sig = 2) {
  const a = Math.abs(v);
  if (!isFinite(v)) return '∞ ' + unit;
  if (a === 0) return '0 ' + unit;
  const pre = a >= 1e9 ? [1e9, 'G'] : a >= 1e6 ? [1e6, 'M'] : a >= 1e3 ? [1e3, 'k'] : a >= 1 ? [1, ''] : a >= 1e-3 ? [1e-3, 'm'] : a >= 1e-6 ? [1e-6, 'µ'] : [1e-9, 'n'];
  const x = v / pre[0], ax = Math.abs(x);
  const d = ax >= 100 ? 0 : ax >= 10 ? Math.max(0, sig - 2) : Math.max(0, sig - 1);
  return `${x.toFixed(d)} ${pre[1]}${unit}`;
}
export const fmtA = (I) => (Math.abs(I) >= 1 || I === 0 ? `${I >= 100 ? Math.round(I).toLocaleString('en-IN') : I.toFixed(Math.abs(I) >= 10 ? 1 : 2)} A` : si(I, 'A', 2));
export const fmtW = (P) => (P >= 1e3 ? `${(P / 1e3).toFixed(P >= 1e4 ? 0 : 2).replace(/\.?0+$/, '')} kW` : P >= 10 ? `${Math.round(P)} W` : `${P.toFixed(P >= 1 ? 1 : 2)} W`);
export const fmtWh = (E) => (E >= 1e3 ? `${(E / 1e3).toFixed(E >= 1e4 ? 0 : 1)} kWh` : E >= 10 ? `${Math.round(E)} Wh` : `${E.toFixed(1)} Wh`);
export const fmtR = (r) => (r < 1 ? r.toFixed(r < 0.01 ? 4 : 3) + ' Ω' : si(r, 'Ω', 3));
// "1.9 × 10¹⁸"
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
export function sci(v, d = 1) {
  if (!v) return '0';
  const e = Math.floor(Math.log10(Math.abs(v))), m = v / Math.pow(10, e);
  return `${m.toFixed(d)} × 10${String(e).split('').map((c) => SUP[c]).join('')}`;
}
export const fmtDur = (s) => (!isFinite(s) ? 'never' : s < 60 ? `${s.toFixed(0)} s` : s < 3600 ? `${(s / 60).toFixed(0)} min` : s < 86400 * 2 ? `${(s / 3600).toFixed(1)} hours` : s < 86400 * 365 ? `${(s / 86400).toFixed(0)} days` : `${(s / 86400 / 365).toFixed(0)} years`);

// ---------------------------------------------------------------- boards
export function panelBg(g, w, h) { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.9)'; g.fillRect(0, 0, w, h); }
export function board(root, w, h, pxW, pxH, draw, pos) {
  const tex = canvasTexture(pxW, pxH, draw);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex.tex, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
  m.position.set(...pos); root.add(m);
  return Object.assign(tex, { mesh: m });
}
export function title(g, text, sub = '') {
  g.fillStyle = '#e8eef8'; g.font = 'bold 24px sans-serif'; g.fillText(text, 20, 34);
  if (sub) { const x = 34 + g.measureText(text).width; g.font = '17px sans-serif'; g.fillStyle = 'rgba(255,255,255,.6)'; g.fillText(sub, x, 34); }
}
// Axes with a grid. Returns X(x) and Y(y) mapping functions for the plot area. logY for currents.
export function axes(g, w, h, { x0 = 84, x1 = w - 28, y0 = h - 64, y1 = 70, xMax, yMax, xMin = 0, yMin = 0, xTicks, yTicks, xFmt = String, yFmt = String, xLabel = '', yLabel = '', logY = false }) {
  const X = (x) => x0 + ((x - xMin) / (xMax - xMin)) * (x1 - x0);
  const Y = logY ? (y) => y0 - ((Math.log10(Math.max(1e-12, y)) - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin))) * (y0 - y1) : (y) => y0 - ((y - yMin) / (yMax - yMin)) * (y0 - y1);
  g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '19px sans-serif';
  for (const t of xTicks) { g.beginPath(); g.moveTo(X(t), y1); g.lineTo(X(t), y0); g.stroke(); const s = xFmt(t); g.fillText(s, X(t) - g.measureText(s).width / 2, y0 + 26); }
  for (const t of yTicks) { g.beginPath(); g.moveTo(x0, Y(t)); g.lineTo(x1, Y(t)); g.stroke(); const s = yFmt(t); g.fillText(s, x0 - 10 - g.measureText(s).width, Y(t) + 6); }
  g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0); g.lineTo(x1, y0); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '18px sans-serif';
  if (xLabel) g.fillText(xLabel, x1 - g.measureText(xLabel).width, y0 + 52);
  if (yLabel) g.fillText(yLabel, x0 + 8, y1 - 10);
  return { X, Y, x0, x1, y0, y1 };
}
export function dot(g, x, y, col, r = 10) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); }
export const COL = { e: '#8ef0ff', conv: '#ffb547', volt: '#c49bff', hot: '#ff7a59', ok: '#5ce1a9', bad: '#ff5a8a', live: '#b5651d', neutral: '#4f9dff', earth: '#7be08c', soft: 'rgba(255,255,255,.55)' };
export const HEX = { e: 0x8ef0ff, conv: 0xffb547, volt: 0xc49bff, hot: 0xff7a59, ok: 0x5ce1a9, bad: 0xff5a8a, live: 0xb5651d, neutral: 0x2f6fd6, earth: 0x3fae4f };

// ---------------------------------------------------------------- stage helpers
export const inReel = () => document.body.classList.contains('gb-reel');
// On a phone-width stage: hide the minor labels and nudge the picture down, clear of the readout.
export function fitNarrow(stage, minor = []) {
  const narrow = stage.host.clientWidth < 560;
  minor.forEach((l) => { if (l) l.visible = !narrow; });
  const y = narrow && !inReel() ? -0.12 : 0;
  if (!stage.shift || stage.shift[1] !== y) stage.setShift(0, y);
  return narrow;
}
// Boards sit beside the model on a wide screen. In the tall reel video they move to another spot.
export function placeBoard(b, wide, reel) {
  const [p, r = 0, s = 1] = inReel() && reel ? reel : wide;
  b.mesh.position.set(...p); b.mesh.rotation.set(0, r, 0); b.mesh.scale.setScalar(s);
}
// Show one scene group of a chapter and fly the camera to it (not in the reel, which sets its own views).
export function focusSwitch(stage, groups, views) {
  let cur = '';
  return (id) => {
    if (id === cur) return false;
    cur = id;
    Object.entries(groups).forEach(([k, g]) => { g.visible = k === id; });
    if (!inReel() && views[id]) stage.setView(views[id].pos, views[id].target, 1.0);
    return true;
  };
}
// Deterministic pseudo-random numbers so every run (and every video frame) looks the same.
export function rng(seed = 1) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// ---------------------------------------------------------------- wires
// A polyline you can walk along by distance. Used for wires, pipes and the dots that flow in them.
export function makePath(points, closed = true) {
  const pts = points.map((p) => new THREE.Vector3(...p));
  if (closed) pts.push(pts[0].clone());
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const L = cum[cum.length - 1];
  const seg = (d) => { d = closed ? ((d % L) + L) % L : clamp(d, 0, L); let i = 1; while (i < cum.length - 1 && cum[i] < d) i++; return [i, d]; };
  const at = (d, out = new THREE.Vector3()) => { const [i, dd] = seg(d); const k = (dd - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1]); return out.copy(pts[i - 1]).lerp(pts[i], k); };
  const dir = (d, out = new THREE.Vector3()) => { const [i] = seg(d); return out.copy(pts[i]).sub(pts[i - 1]).normalize(); };
  return { pts, cum, L, at, dir, closed };
}
// A round wire along a path, with balls at the corners so the joints look soldered.
export function wireMesh(path, r, mat) {
  const g = new THREE.Group();
  for (let i = 1; i < path.pts.length; i++) {
    const a = path.pts[i - 1], b = path.pts[i], len = a.distanceTo(b);
    if (len < 1e-4) continue;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 14), mat);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    m.castShadow = true; g.add(m);
    const j = sphere(r, mat, 14); j.position.copy(b); g.add(j);
  }
  return g;
}
// Dots that flow along a path. update(dt, speed, gate) moves them (speed in units per second, + along
// the path); gate(d) can hold some still. wobble(d) (0..1) can jiggle them sideways instead (AC).
export function flow(path, n, r, color, opts = {}) {
  const mat = opts.mat || M.glow(color);
  const geo = opts.geo || new THREE.SphereGeometry(r, 10, 8);
  const mesh = new THREE.InstancedMesh(geo, mat, n);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  const o = new THREE.Object3D(), p = new THREE.Vector3(), t = new THREE.Vector3(), up = new THREE.Vector3(), n1 = new THREE.Vector3(), n2 = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
  const rad = opts.radius || 0;
  const dots = Array.from({ length: n }, (_, i) => ({ d: (i / n) * path.L + ((i * 0.618) % 1) * (path.L / n) * 0.8, a: (i * 2.39996) % (Math.PI * 2), rr: Math.sqrt((i * 0.7548) % 1) }));
  const api = {
    mesh, dots, hide: opts.hide || null,
    update(dt, speed, gate, shift = 0) {
      for (let i = 0; i < n; i++) {
        const q = dots[i];
        if (!gate || gate(q.d)) q.d = (((q.d + speed * dt) % path.L) + path.L) % path.L;
        const d = q.d + shift;
        path.at(d, p); path.dir(d, t);
        up.set(0, 0, 1); if (Math.abs(t.z) > 0.9) up.set(0, 1, 0);
        n1.crossVectors(t, up).normalize(); n2.crossVectors(t, n1);
        p.addScaledVector(n1, Math.cos(q.a) * q.rr * rad).addScaledVector(n2, Math.sin(q.a) * q.rr * rad);
        o.position.copy(p);
        if (api.hide && api.hide(q.d)) o.position.set(0, -60, 0);
        if (opts.orient) o.quaternion.setFromUnitVectors(Y, t.clone().multiplyScalar(speed < 0 ? -1 : 1));
        o.updateMatrix(); mesh.setMatrixAt(i, o.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
  return api;
}
// Little cones for conventional current: point them with flow(..., { geo: coneGeo(r), orient: true }).
export const coneGeo = (r) => new THREE.ConeGeometry(r, r * 2.6, 12);

// ---------------------------------------------------------------- parts
// An AA-style cell lying along X, + terminal (the button) at +x. len about 5 cm scaled.
export function makeCell(len = 0.5, r = 0.07, color = 0x2a2e37, band = 0xd98b2b) {
  const g = new THREE.Group();
  g.add(rod(-len / 2, len / 2 - 0.02, r, r, M.plastic(color, { roughness: 0.35 })));
  g.add(rod(len * 0.05, len / 2 - 0.02, r + 0.003, r + 0.003, M.metal(band, { roughness: 0.35 })));
  g.add(rod(len / 2 - 0.02, len / 2 + 0.02, r * 0.35, r * 0.35, M.metal(0xd8dde6)));
  g.add(rod(-len / 2 - 0.01, -len / 2, r * 0.85, r * 0.85, M.metal(0xb9bec8)));
  return g;
}
// A clear bulb with a coiled filament, standing up with its cap at the origin. setGlow(k) 0..1+.
export function makeBulb(r = 0.3) {
  const g = new THREE.Group();
  const glassMat = M.clear(0xfff6e0, 0.16, { depthWrite: false });
  const glass = sphere(r, glassMat, 36); glass.position.y = r * 1.25; glass.castShadow = false; g.add(glass);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.42, r * 0.55, r * 0.5, 28), glassMat); neck.position.y = r * 0.35; g.add(neck);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.42, r * 0.42, r * 0.5, 28), M.metal(0xc9ced8)); cap.position.y = -r * 0.1; g.add(cap);
  const filMat = new THREE.MeshStandardMaterial({ color: 0x55504a, emissive: new THREE.Color(0, 0, 0), roughness: 0.4, metalness: 0.6 });
  const fil = spring(-r * 0.35, r * 0.35, r * 0.07, r * 0.022, 12, filMat); fil.position.y = r * 1.3; g.add(fil);
  for (const x of [-r * 0.35, r * 0.35]) { const s = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.02, r * 0.02, r * 1.2, 8), M.metal(0x9aa3b2)); s.position.set(x, r * 0.72, 0); g.add(s); }
  const halo = sphere(r * 1.02, M.ghost(0xffc46b, 0), 24); halo.position.y = r * 1.25; halo.castShadow = false; g.add(halo);
  const light = new THREE.PointLight(0xffc27a, 0, r * 14, 1.6); light.position.y = r * 1.3; g.add(light);
  g.setGlow = (k) => {
    k = Math.max(0, k);
    const a = clamp(k * 1.6, 0, 1.6), b = clamp(k * 1.3 - 0.15, 0, 1.3), c = clamp(k - 0.45, 0, 0.9);
    filMat.emissive.setRGB(a * 2.4, b * 1.9, c * 1.2);
    light.intensity = clamp(k, 0, 1.6) * 3.5;
    halo.material.opacity = clamp(k, 0, 1.4) * 0.28;
  };
  g.setGlow(0);
  return g;
}
// A meter with a round dial drawn on a canvas. set(value, text, fullScale) moves the needle.
export function makeMeter(unit = 'A', max = 1, { w = 0.62, h = 0.5, color = '#b3261e' } = {}) {
  const g = new THREE.Group();
  const body = box(w, h, 0.18, M.plastic(0x1f232b, { roughness: 0.5 })); g.add(body);
  let val = 0, fullScale = max, text = '';
  const dial = canvasTexture(320, 260, (c, W, H) => {
    c.fillStyle = '#f4efe2'; c.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H * 0.86, R = H * 0.66, a0 = Math.PI * 1.18, a1 = Math.PI * 1.82;
    c.strokeStyle = '#222'; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, R, a0, a1); c.stroke();
    c.fillStyle = '#222'; c.font = '20px sans-serif';
    for (let i = 0; i <= 10; i++) { const a = a0 + (a1 - a0) * (i / 10), L = i % 5 ? 12 : 22; c.lineWidth = i % 5 ? 2 : 3; c.beginPath(); c.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); c.lineTo(cx + Math.cos(a) * (R - L), cy + Math.sin(a) * (R - L)); c.stroke(); }
    for (const i of [0, 5, 10]) { const a = a0 + (a1 - a0) * (i / 10), s = +(fullScale * i / 10).toPrecision(3) + ''; c.fillText(s, cx + Math.cos(a) * (R - 44) - c.measureText(s).width / 2, cy + Math.sin(a) * (R - 44) + 8); }
    c.font = 'bold 40px sans-serif'; c.fillStyle = color; c.fillText(unit, 18, 44);
    c.font = 'bold 28px monospace'; c.fillStyle = '#222'; c.fillText(text, W - 18 - c.measureText(text).width, 40);
    const k = clamp(val / fullScale, -0.02, 1.04), a = a0 + (a1 - a0) * k;
    c.strokeStyle = color; c.lineWidth = 4; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * (R - 8), cy + Math.sin(a) * (R - 8)); c.stroke();
    c.fillStyle = '#222'; c.beginPath(); c.arc(cx, cy, 9, 0, Math.PI * 2); c.fill();
  });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.88, h * 0.82), new THREE.MeshBasicMaterial({ map: dial.tex, toneMapped: false }));
  face.position.z = 0.091; g.add(face);
  let last = '';
  g.set = (v, label, fs = fullScale) => { const key = v.toFixed(4) + label + fs; if (key === last) return; last = key; val = v; text = label; fullScale = fs; dial.redraw(); };
  return g;
}
// Pick a round full-scale value for a meter: 0.1, 0.25, 0.5, 1, 2.5, 5, 10 … × 10ⁿ.
export function range(v) {
  const p = Math.pow(10, Math.floor(Math.log10(Math.max(1e-9, v))));
  for (const k of [1, 2.5, 5, 10]) if (k * p >= v * 1.02) return k * p;
  return 10 * p;
}
// A slide switch like a torch's: a base with a sliding knob. set(on).
export function makeSlideSwitch(w = 0.36) {
  const g = new THREE.Group();
  const base = box(w, 0.08, 0.2, M.plastic(0x2a2e37)); g.add(base);
  const slot = box(w * 0.7, 0.02, 0.06, M.matte(0x0c0d10)); slot.position.y = 0.045; g.add(slot);
  const knob = box(w * 0.28, 0.1, 0.12, M.plastic(0xb3261e)); knob.position.y = 0.09; g.add(knob);
  g.set = (on) => { knob.position.x = (on ? 1 : -1) * w * 0.2; };
  g.set(true);
  return g;
}
// A glass cartridge fuse along X with a thin wire inside. setState(heat 0..1, blown).
export function makeFuse(len = 0.44, r = 0.06) {
  const g = new THREE.Group();
  const glass = rod(-len / 2 + 0.07, len / 2 - 0.07, r, r, M.clear(0xe6f6ff, 0.22)); glass.castShadow = false; g.add(glass);
  g.add(rod(-len / 2, -len / 2 + 0.08, r + 0.008, r + 0.008, M.metal(0xd8dde6)), rod(len / 2 - 0.08, len / 2, r + 0.008, r + 0.008, M.metal(0xd8dde6)));
  const wMat = new THREE.MeshStandardMaterial({ color: 0xb0b6c0, metalness: 0.7, roughness: 0.3, emissive: new THREE.Color(0, 0, 0) });
  const a = len / 2 - 0.07;
  const w1 = rod(-a, -a / 3, 0.008, 0.008, wMat), mid = rod(-a / 3, a / 3, 0.008, 0.008, wMat), w2 = rod(a / 3, a, 0.008, 0.008, wMat);
  g.add(w1, mid, w2);
  const blob = sphere(0.016, M.matte(0x3a3a3a), 10); blob.position.set(-a / 3, -r * 0.2, 0); blob.visible = false; g.add(blob);
  g.setState = (heat, blown) => {
    const k = clamp(heat, 0, 1);
    wMat.emissive.setRGB(k * 2.2, k * 0.7, k * 0.1);
    mid.visible = !blown; blob.visible = blown;
    glass.material.color.setHex(blown ? 0x8a8f96 : 0xe6f6ff);
  };
  g.setState(0, false);
  return g;
}
// A person standing with feet at the origin, facing +x (from TorqueClear). pose({ arm, lean }).
export function makePerson({ shirt = 0x3b6fd8, pants = 0x2b3242, skin = 0xc68b64, hair = 0x1b1410, s = 1 } = {}) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const cloth = M.matte(shirt), jeans = M.matte(pants), sk = M.matte(skin);
  const hipY = 0.92 * s;
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.16 * s, 0.38 * s, 6, 14), cloth); torso.position.y = 0.3 * s; torso.scale.z = 1.25; torso.castShadow = true; body.add(torso);
  const head = sphere(0.11 * s, sk, 24); head.position.y = 0.74 * s; body.add(head);
  const hairM = new THREE.Mesh(new THREE.SphereGeometry(0.115 * s, 20, 10, 0, Math.PI * 2, 0, 1.3), M.matte(hair)); hairM.position.copy(head.position); hairM.rotation.z = 0.35; body.add(hairM);
  const limb = (len, r, mat) => { const p = new THREE.Group(); const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len - 2 * r, 4, 10), mat); m.position.y = -len / 2; m.castShadow = true; p.add(m); return p; };
  const arms = [-1, 1].map((z) => { const a = limb(0.62 * s, 0.05 * s, cloth); a.position.set(0, 0.52 * s, z * 0.22 * s); body.add(a); const hand = sphere(0.05 * s, sk, 12); hand.position.y = -0.62 * s; a.add(hand); return a; });
  const legs = [-1, 1].map((z) => { const l = limb(0.88 * s, 0.065 * s, jeans); l.position.set(0, hipY, z * 0.1 * s); g.add(l); const shoe = box(0.22 * s, 0.07 * s, 0.1 * s, M.matte(0x1b1d22)); shoe.position.set(0.05 * s, -0.88 * s, 0); l.add(shoe); return l; });
  body.position.y = hipY;
  g.pose = ({ arm = 0, arm2 = null, lean = 0 } = {}) => { arms[0].rotation.z = arm; arms[1].rotation.z = arm2 ?? arm; body.rotation.z = -lean; };
  g.arms = arms; g.legs = legs; g.body = body;
  return g;
}

export { clamp, THREE, M, box, rod, sphere };
