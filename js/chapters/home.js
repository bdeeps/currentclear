// Chapter 3: electricity at home.
// Mains: India 230 V, 50 Hz (CEA supply regulations; IS 12360); USA 120 V, 60 Hz (ANSI C84.1). These are
// rms values; the peak of the sine wave is √2 × V_rms: 325 V in India, 170 V in the USA.
// Appliance powers (typical, rounded): LED bulb 9 W; old ceiling fan 75 W (BEE star-labelled fans
// 50–75 W; a BLDC fan about 28 W, see FanClear); LED TV 100 W; 1.5-ton split AC about 1.6 kW while the
// compressor runs (see ACClear); storage geyser 2 kW (see WaterHeaterClear). Current I = P ÷ V, taking
// the power factor as 1 (it is close to 1 for heaters, lower for motors, which only adds a little).
// So at 230 V: fan 0.33 A, AC about 7 A, geyser 8.7 A. At 120 V the same power takes about twice the
// current, which is why US homes run big heaters on 240 V.
// Indian sockets: 6 A for light loads, 16 A for geysers, ACs and heaters (IS 1293: 6 A and 16 A;
// older plugs were called 5 A and 15 A). MCBs (IS/IEC 60898) trip on overload; the B-curve's thermal
// part takes seconds to minutes above 1.13–1.45 × its rating (here: ∫ (I/I_n)² dt above 1.13 × I_n,
// about 2 s of that). An RCCB (IS 12640 / IEC 61008) compares the current in live and neutral; a
// difference of 30 mA or more (current leaking to earth) trips it, within 300 ms at 30 mA and 40 ms
// at 150 mA. Earth leakage through a person: 230 V ÷ about 1,500 Ω ≈ 150 mA (chapter 5).
// Energy: 1 kWh, one "unit" on an Indian bill, is 1,000 W for an hour, 3.6 MJ (see WorkClear).
import { THREE, M, box, rod, sphere, clamp, approach } from '../kit.js';
import {
  makePath, wireMesh, flow, board, panelBg, title, axes, COL, HEX, MAINS, fmtA, fmtW, fitNarrow, placeBoard,
} from '../current.js';

export const APPS = [
  { key: 'light', name: 'LED bulb', P: 9, x: -2.1, y: 2.85, circ: 6 },
  { key: 'fan', name: 'Ceiling fan', P: 75, x: -0.7, y: 3.0, circ: 6 },
  { key: 'tv', name: 'LED TV', P: 100, x: 0.75, y: 2.05, circ: 6 },
  { key: 'ac', name: 'Split AC', P: 1600, x: 2.3, y: 2.95, circ: 16 },
  { key: 'geyser', name: 'Geyser', P: 2000, x: 3.95, y: 1.35, circ: 16 },
];
const YL = 3.95, YN = 3.75, YE = 3.55, XDB = -3.35, XR = 4.6;
const PERSON_R = 1500;

export function home(s) {
  const m = MAINS[s.country], V = m.V;
  const I = {};
  APPS.forEach((a) => { I[a.key] = s[a.key] ? a.P / V : 0; });
  const fault = s.fault !== 'none' && s.geyser;
  const circ = { 6: 0, 16: 0 };
  APPS.forEach((a) => { circ[a.circ] += I[a.key]; });
  const leak = s.fault === 'case' ? V / 2 : s.fault === 'touch' ? V / PERSON_R : 0;   // earth wire ~2 Ω loop; a person ~1.5 kΩ
  const on = { 6: s.trip === '' || s.trip === 'mcb16', 16: s.trip === '' || s.trip === 'mcb6' };
  const live = { 6: on[6] ? circ[6] : 0, 16: on[16] ? circ[16] + (fault ? leak : 0) : 0 };
  APPS.forEach((a) => { if (!on[a.circ]) I[a.key] = 0; });
  const total = live[6] + live[16];
  const P = APPS.reduce((t, a) => t + I[a.key] * V, 0);
  const sock = s.socket === 16 ? 16 : 6;
  return { V, f: m.f, name: m.name, I, circ, live, total, P, leak: fault && on[16] ? leak : 0, sockHot: I.geyser > sock, sock };
}

export default {
  id: 'home',
  short: 'Home electricity',
  title: 'The electricity in your walls',
  subtitle: '230 volts that swap direction 50 times a second: live, neutral and earth, MCBs and RCCBs.',
  view: { pos: [0.7, 3.6, 9.6], target: [0.7, 3.45, 0] },
  learn: `<p>The sockets in an Indian home supply <b>230 V</b> of <b>alternating current</b> (AC) at <b>50 hertz</b>: the push flips direction 50 times a second, so the electrons in the wires just jiggle back and forth. In the USA it is <b>120 V at 60 Hz</b>. A battery gives <b>direct current</b> (DC), a steady push one way. An inverter turns a battery’s DC into AC for your home during power cuts (see UPSClear). AC won because a transformer can easily step its voltage up for long-distance lines and back down for homes (see FaradayClear).</p>
    <p>Three wires come to each socket. <b>Live</b> (brown, or red in older Indian homes) carries the push. <b>Neutral</b> (blue, or black) is the return path. <b>Earth</b> (green, or green and yellow) is a safety wire bolted to metal cases and to a rod in the ground. Everything is wired in <b>parallel</b> (chapter 2), so every appliance gets the full 230 V.</p>
    <p>Each appliance draws <b>I = P ÷ V</b>. A <b>ceiling fan</b> takes about 0.3 A, an <b>AC</b> about 7 A and a 2 kW <b>geyser</b> 8.7 A. That’s why a geyser needs a big <b>16 A socket</b>: its current would overheat a small 6 A one. The same 2 kW in the USA takes 17 A, so big American heaters run on 240 V instead.</p>
    <p>In the <b>distribution board</b>, each circuit has an <b>MCB</b> (miniature circuit breaker): a switch that trips when too much current flows, like a fuse you can reset. The <b>RCCB</b> watches for current leaking to earth. If live and neutral differ by just 30 mA, current is going somewhere it shouldn’t, maybe through a person, and it cuts the power in a few hundredths of a second. What you pay for is energy: one <b>unit</b> on the bill is one <b>kilowatt-hour</b> (see WorkClear).</p>
    <p class="tip"><b>Try it:</b> switch on the AC and the geyser and watch the current climb. Move the geyser to a 6 A socket. Switch to the USA and see every current nearly double. Then put a fault on the geyser, with and without its earth wire.</p>`,
  terms: [
    { t: 'AC (alternating current)', d: 'Current that reverses direction many times a second: 50 times in India, 60 in the USA.' },
    { t: 'DC (direct current)', d: 'Current that flows one way only, as from a battery or a phone charger’s output.' },
    { t: 'Live, neutral, earth', d: 'The supply wire, the return wire, and the safety wire connected to the ground and to metal cases.' },
    { t: 'MCB', d: 'Miniature circuit breaker: a resettable switch that trips when a circuit carries too much current.' },
    { t: 'RCCB', d: 'Residual current circuit breaker: trips when current leaks to earth, 30 mA or more, to prevent shocks.' },
    { t: 'Kilowatt-hour (unit)', d: 'The energy used by 1,000 watts for one hour: 3.6 million joules. Your electricity bill counts these.' },
  ],
  defaults: { country: 'in', light: true, fan: true, tv: false, ac: false, geyser: false, socket: 16, fault: 'none', trip: '' },
  controls: [
    { key: 'country', type: 'seg', label: 'Mains supply', options: [{ v: 'in', label: 'India 230 V, 50 Hz' }, { v: 'us', label: 'USA 120 V, 60 Hz' }] },
    { key: 'light', type: 'toggle', label: 'LED bulb, 9 W' },
    { key: 'fan', type: 'toggle', label: 'Ceiling fan, 75 W' },
    { key: 'tv', type: 'toggle', label: 'LED TV, 100 W' },
    { key: 'ac', type: 'toggle', label: 'Split AC, 1.6 kW' },
    { key: 'geyser', type: 'toggle', label: 'Geyser, 2 kW' },
    { key: 'socket', type: 'seg', label: 'Geyser plugged into', options: [{ v: 6, label: '6 A socket' }, { v: 16, label: '16 A socket' }] },
    { key: 'fault', type: 'seg', label: 'Fault on the geyser', options: [{ v: 'none', label: 'None' }, { v: 'case', label: 'Live touches its case' }, { v: 'touch', label: 'No earth, you touch it' }] },
    { key: 'go', type: 'buttons', label: 'Distribution board', items: [{ label: 'Reset the breakers', act: (s) => { s.trip = ''; } }, { label: 'Everything on', act: (s) => Object.assign(s, { light: true, fan: true, tv: true, ac: true, geyser: true, trip: '' }) }] },
  ],
  onChange(s, key) { if (key === 'fault' && s.fault !== 'none') s.geyser = true; },
  quiz: [
    { q: 'A 2,000 W geyser runs on 230 V. About how much current does it take?', options: ['0.1 A', '8.7 A', '460 A', '230 A'], answer: 1, why: 'I = P ÷ V = 2,000 ÷ 230 ≈ 8.7 A, more than a 6 A socket is built for.' },
    { q: 'What does an RCCB detect?', options: ['Too high a voltage', 'Current leaking to earth, when live and neutral currents differ', 'A blown bulb', 'The mains frequency'], answer: 1, why: 'Normally everything that goes out on live comes back on neutral. A difference of 30 mA means current is escaping, perhaps through a person.' },
    { q: 'India’s mains is “230 V AC at 50 Hz”. What does 50 Hz mean?', options: ['50 volts', 'The current reverses direction 50 times each second', '50 amps', '50 appliances at once'], answer: 1, why: 'Alternating current swings back and forth. 50 hertz means 50 complete cycles every second.' },
  ],
  reel: [
    { ms: 5400, caption: 'Indian mains is 230 volts AC: the push flips direction 50 times every second.', set: { country: 'in', light: true, fan: true, tv: true, ac: false, geyser: false, fault: 'none', trip: '', socket: 16 }, anim: { ac: [false, true] }, view: { pos: [0.8, 3.4, 8.2], target: [0.8, 3.3, 0] }, spin: 0 },
    { ms: 5400, caption: 'A 2 kW geyser draws 8.7 amps. If current leaks to earth, the RCCB cuts it in milliseconds.', set: { country: 'in', light: true, fan: true, tv: false, ac: false, geyser: true, trip: '', socket: 16, fault: 'none' }, anim: { fault: ['none', 'case'] }, view: { pos: [2.6, 2.6, 6.6], target: [2.2, 2.3, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    // Room: a wall, a floor and a ceiling edge.
    const wall = box(9.6, 4.6, 0.12, M.matte(0x5b6270)); wall.position.set(0.6, 2.3, -0.25); root.add(wall);
    const floorR = box(9.6, 0.08, 2.2, M.matte(0x3a3f4b)); floorR.position.set(0.6, 0.04, 0.8); root.add(floorR);
    const part = box(0.08, 4.6, 1.2, M.matte(0x6b7280)); part.position.set(3.2, 2.3, 0.35); root.add(part);

    // Distribution board with an RCCB and two MCBs.
    const db = new THREE.Group(); db.position.set(XDB - 0.2, 2.55, 0); root.add(db);
    db.add(box(1.0, 1.35, 0.2, M.plastic(0xd8dde6)));
    const breaker = (x, w, col, label) => {
      const g = new THREE.Group(); g.position.set(x, 0.05, 0.12); db.add(g);
      g.add(box(w, 0.55, 0.12, M.plastic(0xf2f2f2)));
      const lever = box(w * 0.5, 0.14, 0.08, M.plastic(col)); g.add(lever);
      g.set = (on) => { lever.position.y = on ? 0.1 : -0.1; };
      g.set(true); return g;
    };
    const bR = breaker(-0.28, 0.3, 0x3b6fd8), b6 = breaker(0.06, 0.16, 0x22252c), b16 = breaker(0.3, 0.16, 0x22252c);
    const lDB = stage.label('distribution board', [XDB - 0.2, 3.45, 0.2], root);
    const lR = stage.label('', [XDB - 0.2, 1.62, 0.2], root, 'hot');
    const l6 = stage.label('', [XDB - 0.2, 1.3, 0.2], root);
    const l16 = stage.label('', [XDB - 0.2, 1.0, 0.2], root);

    // Rails: live, neutral, earth along the wall.
    const matL = M.plastic(HEX.live), matN = M.plastic(HEX.neutral), matE = M.plastic(0x7fcf6a);
    root.add(wireMesh(makePath([[XDB + 0.3, YL, 0], [XR, YL, 0]], false), 0.03, matL));
    root.add(wireMesh(makePath([[XDB + 0.3, YN, 0], [XR, YN, 0]], false), 0.03, matN));
    root.add(wireMesh(makePath([[XDB + 0.3, YE, 0], [XR, YE, 0]], false), 0.03, matE));
    const lWires = stage.label('<b style="color:#d08a4a">live</b> · <b style="color:#6aa8ff">neutral</b> · <b style="color:#8fdc7a">earth</b>', [3.7, 4.3, 0], root);

    // Appliances
    const parts = {};
    // LED bulb on a cord
    { const a = APPS[0], g = new THREE.Group(); g.position.set(a.x, 0, 0.25); root.add(g);
      g.add(box(0.02, YE - a.y - 0.2, 0.02, M.matte(0x22252c)).translateY((YE + a.y + 0.2) / 2));
      const shell = sphere(0.17, M.plastic(0xf4f4f4, { emissive: new THREE.Color(0, 0, 0) }), 24); shell.position.y = a.y; g.add(shell);
      const light = new THREE.PointLight(0xfff2d8, 0, 5, 1.6); light.position.y = a.y - 0.2; g.add(light);
      parts.light = (on) => { shell.material.emissive.setRGB(on ? 1.4 : 0, on ? 1.3 : 0, on ? 1.1 : 0); light.intensity = on ? 3 : 0; }; }
    // Ceiling fan hanging in front of the wall
    { const a = APPS[1], g = new THREE.Group(); g.position.set(a.x, 0, 0.9); root.add(g);
      g.add(rod(0, 1, 0.025, 0.025, M.metal(0x9aa3b2)).rotateZ(Math.PI / 2).translateX(0));
      const down = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 4.55 - a.y, 10), M.metal(0x9aa3b2)); down.position.y = (4.55 + a.y) / 2; g.add(down);
      const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.2, 28), M.plastic(0xe8e2d4)); motor.position.y = a.y; g.add(motor);
      const rotor = new THREE.Group(); rotor.position.y = a.y - 0.02; g.add(rotor);
      for (let i = 0; i < 3; i++) { const b = box(1.1, 0.02, 0.2, M.plastic(0xe8e2d4)); b.position.x = 0.7; const arm = new THREE.Group(); arm.rotation.y = (i * Math.PI * 2) / 3; arm.add(b); rotor.add(arm); }
      g.children[0].visible = false;
      let w = 0; parts.fan = (on, dt) => { w = approach(w, on ? 6 : 0, 1.2, dt); rotor.rotation.y += w * dt; }; }
    // LED TV on the wall
    { const a = APPS[2], g = new THREE.Group(); g.position.set(a.x, a.y, -0.12); root.add(g);
      g.add(box(1.5, 0.88, 0.06, M.plastic(0x16181d)));
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.78), new THREE.MeshBasicMaterial({ color: 0x0a0b0e, toneMapped: false })); scr.position.z = 0.035; g.add(scr);
      parts.tv = (on, dt, t) => { scr.material.color.setHSL(on ? (0.55 + 0.05 * Math.sin(t * 0.7)) : 0, on ? 0.6 : 0, on ? 0.45 : 0.04); }; }
    // Split AC indoor unit high on the wall
    { const a = APPS[3], g = new THREE.Group(); g.position.set(a.x, a.y, 0); root.add(g);
      g.add(box(1.4, 0.42, 0.3, M.plastic(0xf2f2f2)));
      const vane = box(1.2, 0.03, 0.1, M.plastic(0xd8dde6)); vane.position.set(0, -0.2, 0.12); g.add(vane);
      const led = sphere(0.025, M.glow(0x5ce1a9), 8); led.position.set(0.55, -0.1, 0.16); g.add(led);
      const air = new THREE.Group(); g.add(air);
      const puffs = Array.from({ length: 10 }, (_, i) => { const p = sphere(0.04, M.ghost(0xbfe6ff, 0.5), 8); air.add(p); p.userData.k = i / 10; return p; });
      parts.ac = (on, dt, t) => { led.visible = on; vane.rotation.x = approach(vane.rotation.x, on ? 0.7 : 0, 3, dt); air.visible = on; puffs.forEach((p, i) => { const k = (t * 0.5 + p.userData.k) % 1; p.position.set(-0.55 + (i % 5) * 0.27, -0.25 - k * 0.8, 0.2 + k * 0.6); p.material.opacity = 0.5 * (1 - k); }); }; }
    // Geyser in the bathroom, plugged into a wall socket below it
    const gey = new THREE.Group(); { const a = APPS[4]; gey.position.set(a.x, 2.35, 0.2); root.add(gey);
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 1.1, 32), M.plastic(0xf4f4f4, { emissive: new THREE.Color(0, 0, 0) })); tank.castShadow = true; gey.add(tank);
      const ind = sphere(0.035, M.glow(0xff5a2a), 8); ind.position.set(0, -0.3, 0.36); gey.add(ind);
      gey.tank = tank; parts.geyser = (on, dt, t) => { ind.visible = on && (Math.sin(t * 6) > -0.5); }; }
    const sock = new THREE.Group(); sock.position.set(APPS[4].x, APPS[4].y, -0.15); root.add(sock);
    const plate = box(0.34, 0.34, 0.05, M.plastic(0xf2f2f2)); sock.add(plate);
    const pins = [0, 1, 2].map(() => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 10), M.matte(0x22252c)); p.rotation.x = Math.PI / 2; p.position.z = 0.03; sock.add(p); return p; });
    const plateMat = plate.material;
    root.add(wireMesh(makePath([[APPS[4].x + 0.05, 1.5, -0.1], [APPS[4].x + 0.05, 1.8, 0.2]], false), 0.02, M.matte(0x22252c)));
    // Drops from the rails to each appliance
    APPS.forEach((a) => {
      const yb = a.key === 'geyser' ? a.y + 0.12 : a.key === 'tv' ? a.y + 0.44 : a.y + 0.2, z = a.key === 'fan' ? 0.9 : 0;
      root.add(wireMesh(makePath([[a.x + 0.08, YL, 0], [a.x + 0.08, yb, z * 0]], false), 0.015, matL));
      root.add(wireMesh(makePath([[a.x - 0.08, YN, 0], [a.x - 0.08, yb, z * 0]], false), 0.015, matN));
      if (['geyser', 'ac', 'tv'].includes(a.key)) root.add(wireMesh(makePath([[a.x - 0.2, YE, 0], [a.x - 0.2, yb, 0]], false), 0.012, matE));
    });
    // Leak path: from the geyser's case down the earth wire (or through a person) to the ground.
    const person = new THREE.Group(); root.add(person);
    { const skin = M.matte(0xc68b64), cloth = M.matte(0x7a4fd8);
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.7, 6, 12), cloth); body.position.set(APPS[4].x - 0.75, 1.05, 0.55); person.add(body);
      const head = sphere(0.12, skin, 16); head.position.set(APPS[4].x - 0.75, 1.72, 0.55); person.add(head);
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.5, 4, 8), skin); arm.position.set(APPS[4].x - 0.5, 1.8, 0.45); arm.rotation.z = -1.1; person.add(arm);
      for (const dz of [-0.08, 0.08]) { const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.5, 4, 8), M.matte(0x2b3242)); leg.position.set(APPS[4].x - 0.75, 0.33, 0.55 + dz); person.add(leg); } }
    const sparkMat = M.glow(0xff5a8a, { transparent: true, opacity: 0.9 });
    const leakE = makePath([[APPS[4].x - 0.2, 2.0, 0.3], [APPS[4].x - 0.2, YE, 0.05], [XDB + 0.3, YE, 0.05]], false);
    const leakP = makePath([[APPS[4].x - 0.3, 2.0, 0.4], [APPS[4].x - 0.55, 1.95, 0.45], [APPS[4].x - 0.75, 1.3, 0.55], [APPS[4].x - 0.75, 0.05, 0.55]], false);
    const spE = flow(leakE, 30, 0.04, 0xff5a8a, { mat: sparkMat }), spP = flow(leakP, 16, 0.04, 0xff5a8a, { mat: sparkMat });
    root.add(spE.mesh, spP.mesh);

    // Electrons jiggling in each appliance's loop: out on live, back on neutral (AC: back and forth).
    const loops = APPS.map((a) => {
      const yb = a.key === 'geyser' ? a.y + 0.12 : a.key === 'tv' ? a.y + 0.44 : a.y + 0.2;
      const P = makePath([[XDB + 0.3, YL, 0], [a.x + 0.08, YL, 0], [a.x + 0.08, yb, 0], [a.x - 0.08, yb, 0], [a.x - 0.08, YN, 0], [XDB + 0.3, YN, 0]]);
      const f = flow(P, Math.round(26 + P.L * 5), 0.035, HEX.e, { radius: 0.012, hide: (d) => d > P.cum[5] - 0.01 });
      root.add(f.mesh); return f;
    });

    // Board: the mains waveform against a battery's steady DC.
    let cur = null;
    const bd = board(root, 3.0, 1.7, 820, 470, (g, w, h) => {
      panelBg(g, w, h); if (!cur) return;
      title(g, 'AC from the wall, DC from a battery', 'voltage over 40 ms');
      const { X, Y } = axes(g, w, h, { x0: 92, y1: 72, xMax: 40, yMin: -350, yMax: 350, xTicks: [0, 10, 20, 30, 40], yTicks: [-325, 0, 325], xFmt: (v) => v + ' ms', yFmt: (v) => (v > 0 ? '+' : '') + v + ' V', xLabel: 'time →' });
      const wave = (Vrms, f, col, lw) => { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); for (let i = 0; i <= 200; i++) { const t = (i / 200) * 40; const v = Vrms * Math.SQRT2 * Math.sin(2 * Math.PI * f * t / 1000); i ? g.lineTo(X(t), Y(v)) : g.moveTo(X(t), Y(v)); } g.stroke(); };
      const other = cur.country === 'in' ? MAINS.us : MAINS.in, me = MAINS[cur.country];
      wave(other.V, other.f, 'rgba(255,255,255,.22)', 2);
      wave(me.V, me.f, COL.conv, 5);
      g.strokeStyle = COL.e; g.lineWidth = 4; g.beginPath(); g.moveTo(X(0), Y(12)); g.lineTo(X(40), Y(12)); g.stroke();
      g.font = 'bold 19px sans-serif'; g.fillStyle = COL.conv; g.fillText(`${me.name}: ${me.V} V, ${me.f} Hz, peak ${Math.round(me.V * Math.SQRT2)} V`, 110, 104);
      g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '17px sans-serif'; g.fillText(`${other.name}: ${other.V} V, ${other.f} Hz`, 110, 128);
      g.fillStyle = COL.e; g.font = 'bold 18px sans-serif'; g.fillText('inverter battery: 12 V DC, one way', X(21), Y(12) - 12);
    }, [0, 0, 0]);

    const lA = APPS.map((a) => stage.label('', [a.x, a.key === 'fan' ? a.y - 0.3 : a.key === 'geyser' ? 3.15 : a.key === 'tv' ? a.y - 0.62 : a.y - 0.42, a.key === 'fan' ? 0.9 : 0.3], root));
    const lSock = stage.label('', [APPS[4].x + 0.1, APPS[4].y - 0.35, 0.3], root, 'hot'); lSock.element.style.setProperty('--c', COL.bad);
    const lLeak = stage.label('', [APPS[4].x - 0.9, 2.3, 0.6], root, 'hot'); lLeak.element.style.setProperty('--c', COL.bad);

    let heat6 = 0, heat16 = 0, rccbT = 0, sockHeat = 0, key = '';
    return {
      update(dt, s, time = 0) {
        dt = Math.max(0, dt);
        const narrow = fitNarrow(stage, [lDB, l6, l16, lWires, ...lA.slice(0, 3)]);
        placeBoard(bd, [[-1.25, 0.95, -0.17], 0, 0.72], [[0.8, 5.9, -0.5], 0, 1.3]);
        let H = home(s);
        // RCCB: trips when leakage ≥ 30 mA, within about 30 ms at big leaks (shown slowed to 0.3 s).
        if (H.leak >= 0.03 && s.trip === '') { rccbT += dt; if (rccbT > 0.3) { s.trip = 'rccb'; rccbT = 0; } } else rccbT = 0;
        // MCBs: overload heating above 1.13 × rating.
        const over = (I, In) => (I > 1.13 * In ? (I / In) * (I / In) : -1);
        if (s.trip === '') {
          const o6 = over(H.live[6], 6), o16 = over(H.live[16], 16);
          heat6 = Math.max(0, heat6 + dt * o6); heat16 = Math.max(0, heat16 + dt * o16);
          if (heat6 > 2) { s.trip = 'mcb6'; heat6 = 0; }
          if (heat16 > 2) { s.trip = 'mcb16'; heat16 = 0; }
        }
        H = home(s);
        bR.set(s.trip !== 'rccb'); b6.set(s.trip !== 'mcb6' && s.trip !== 'rccb'); b16.set(s.trip !== 'mcb16' && s.trip !== 'rccb');
        const w = 2 * Math.PI * 1.0 * (s.country === 'us' ? 1.2 : 1.0);   // 50 Hz shown slowed 50 times
        APPS.forEach((a, i) => {
          const I = H.I[a.key], on = I > 0;
          parts[a.key](on, dt, time);
          loops[i].mesh.visible = on;
          if (on) loops[i].update(dt, 0, null, Math.min(0.5, 0.12 + I * 0.05) * Math.sin(w * time));
          lA[i].element.innerHTML = `${a.name}: <b>${on ? fmtA(I) : 'off'}</b>`;
        });
        sockHeat = approach(sockHeat, H.sockHot ? 1 : 0, 0.8, dt);
        plateMat.color.setRGB(0.95, 0.95 - 0.55 * sockHeat, 0.95 - 0.7 * sockHeat);
        sock.scale.setScalar(s.socket === 16 ? 1.25 : 0.9);
        pins.forEach((p, i) => { const big = s.socket === 16; p.scale.setScalar(big ? 1.6 : 1); p.position.set(i === 2 ? 0 : (i ? 0.07 : -0.07), i === 2 ? 0.08 : -0.04, 0.03); });
        lSock.visible = true; lSock.element.innerHTML = H.sockHot ? `${H.sock} A socket overheating!` : `${s.socket} A socket`;
        lSock.element.style.setProperty('--c', H.sockHot ? COL.bad : COL.ok);
        // Faults
        const fault = s.fault !== 'none' && s.geyser;
        person.visible = s.fault === 'touch';
        spE.mesh.visible = s.fault === 'case' && H.leak > 0; spP.mesh.visible = s.fault === 'touch' && H.leak > 0;
        if (spE.mesh.visible) spE.update(dt, 2.5); if (spP.mesh.visible) spP.update(dt, 1.2);
        gey.tank.material.emissive.setRGB(fault && H.leak > 0 ? 0.5 : 0, 0, 0);
        lLeak.visible = fault;
        lLeak.element.innerHTML = s.trip === 'rccb' ? 'RCCB tripped: power cut' : s.fault === 'case' ? `leak to earth: <b>${fmtA(H.leak)}</b>` : `through you: <b>${fmtA(H.leak)}</b>`;
        lR.element.innerHTML = s.trip === 'rccb' ? 'RCCB <b>tripped</b>' : 'RCCB 30 mA';
        lR.element.style.setProperty('--c', s.trip === 'rccb' ? COL.bad : COL.ok);
        l6.element.innerHTML = `MCB 6 A: light, fan, TV${s.trip === 'mcb6' ? ' · <b>tripped</b>' : ''}`;
        l16.element.innerHTML = `MCB 16 A: AC, geyser${s.trip === 'mcb16' ? ' · <b>tripped</b>' : ''}`;
        const k = s.country;
        if (k !== key) { key = k; cur = { country: s.country }; bd.redraw(); }
      },
      readout: (s) => {
        const H = home(s);
        const on = APPS.filter((a) => H.I[a.key] > 0);
        const msg = s.trip === 'rccb' ? '<div class="no">The RCCB tripped: current was leaking to earth. Fix the fault, then reset.</div>'
          : s.trip ? `<div class="no">The ${s.trip === 'mcb6' ? '6 A' : '16 A'} MCB tripped: too much current on that circuit. Switch something off and reset.</div>`
          : H.sockHot ? `<div class="no">${fmtA(H.I.geyser)} through a ${H.sock} A socket: the plug and socket overheat. Use a 16 A socket.</div>`
          : `<small>Every appliance is in parallel across ${H.V} V. Their currents add up at the board.</small>`;
        return `<div class="big">I = P ÷ V = ${fmtA(H.total)}</div>
          <div class="row"><span>Supply</span><b>${H.V} V AC, ${H.f} Hz (${H.name})</b></div>
          <div class="row"><span>Power, and one hour of it</span><b>${fmtW(H.P)} → ${(H.P / 1000).toFixed(2)} kWh</b></div>
          <div><small>${on.length ? on.map((a) => `${a.name} ${fmtA(H.I[a.key])}`).join(' · ') : 'Everything is off.'}</small></div>
          ${msg}`;
      },
    };
  },
};
