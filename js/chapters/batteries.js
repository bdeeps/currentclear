// Chapter 4: cells, batteries and power.
// A cell turns chemical energy into electrical energy. Inside, ions carry the charge through the
// electrolyte; outside, electrons flow through the wire from the negative electrode to the positive one.
// Its voltage is set by its chemistry; cells in series add their voltages.
// Typical figures (rounded, from maker datasheets and spec sheets):
//  - alkaline AA: 1.5 V, about 2,500 mAh at low drain (Energizer E91: 2,500–3,000 mAh at 25 mA),
//    so about 3.75 Wh; not rechargeable.
//  - phone: one Li-ion cell, 3.7 V nominal (3.85 V on many newer phones), 5,000 mAh → 18.5 Wh.
//  - car: lead-acid, 6 cells × about 2.1 V = 12.6 V, 35 Ah (a common small-car size) → about 440 Wh.
//    A starter motor draws about 150 A for a second or two (about 1.8 kW).
//  - small EV: 96 Li-ion cells in series, 3.7 V each → about 355 V nominal, about 400 V (4.2 V per
//    cell) when full; 30 kWh (e.g. Tata Nexon EV, 2020: 30.2 kWh).
// Energy stored E = V × capacity: Wh = V × Ah. Power P = V × I; running time t = E ÷ P (see WorkClear).
// Charging: phone 18 W charger, car alternator about 14.4 V × 30 A, EV 7.4 kW home AC wallbox; about 85–90%
// of the energy makes it into the battery (taken as 88%).
import { THREE, M, box, rod, sphere, clamp, approach } from '../kit.js';
import {
  makePath, wireMesh, flow, makeCell, makeBulb, board, panelBg, title, axes, COL, HEX, fmtA, fmtW, fmtWh, fmtDur, fitNarrow, placeBoard, rng,
} from '../current.js';

export const BATS = {
  aa: { name: 'AA cell', chem: 'alkaline', cellV: 1.5, cells: 1, Ah: 2.5, P: [0.1, 1.5], load: ['a TV remote', 'a bright torch'], charge: 0 },
  phone: { name: 'Phone battery', chem: 'lithium-ion', cellV: 3.7, cells: 1, Ah: 5, P: [0.4, 8], load: ['idle, screen on', 'gaming at full brightness'], charge: 18 },
  car: { name: 'Car battery', chem: 'lead-acid', cellV: 2.1, cells: 6, Ah: 35, P: [110, 1800], load: ['headlights', 'the starter motor'], charge: 14.4 * 30 },
  ev: { name: 'EV battery pack', chem: 'lithium-ion', cellV: 3.7, cells: 96, Ah: 30000 / (96 * 3.7), P: [5000, 60000], load: ['city driving', 'full acceleration'], charge: 7400 },
};
Object.values(BATS).forEach((b) => { b.V = b.cellV * b.cells; b.Wh = b.V * b.Ah; });
const EFF = 0.88;
export function batt(s) {
  const b = BATS[s.bat];
  const P = b.P[0] * Math.pow(b.P[1] / b.P[0], s.drain);
  if (s.charge) { const Pc = b.charge; return { b, P: Pc, I: Pc / b.V, t: Pc ? (b.Wh / (Pc * EFF)) * 3600 : Infinity, charging: true }; }
  return { b, P, I: P / b.V, t: (b.Wh / P) * 3600, charging: false };
}

const CX = 0.9, CY = 1.25, AN = -0.2, CA = 2.0, WY = 2.75;
const XREAL = -2.3;

export default {
  id: 'batteries',
  short: 'Batteries & power',
  title: 'Chemical energy on tap',
  subtitle: 'From an AA cell to an electric car: volts, amp-hours, watt-hours and P = V × I.',
  view: { pos: [-0.25, 2.8, 8.2], target: [-0.25, 2.3, 0] },
  learn: `<p>A <b>cell</b> turns <b>chemical energy</b> into electrical energy. It has two different materials, the <b>electrodes</b>, in a chemical called the <b>electrolyte</b>. Their reaction pushes electrons out of the negative electrode, round the circuit and into the positive one. Inside the cell the loop is closed by <b>ions</b>, charged atoms drifting through the electrolyte. A <b>battery</b> is several cells joined together.</p>
    <p>The <b>chemistry sets the voltage</b>: 1.5 V for an alkaline AA cell, about 3.7 V for a lithium-ion cell, 2.1 V for each lead-acid cell. Join cells in <b>series</b> and the voltages add: six lead-acid cells make a <b>12 V car battery</b>, and about 96 lithium cells make an <b>electric car’s</b> pack of nearly 400 V (see CarClear).</p>
    <p>How long it lasts depends on its <b>capacity</b>. A phone battery might say <b>5,000 mAh</b>: it could give 5 A for one hour, or 0.5 A for ten. Multiply by the voltage and you get the <b>energy</b> it stores in <b>watt-hours</b>: 3.7 V × 5 Ah = 18.5 Wh. An electric car stores about 30,000 Wh, the same as 1,600 phones.</p>
    <p>The rate of using energy is <b>power</b>: <b>P = V × I</b>, in watts (see WorkClear). Divide the energy by the power and you get the running time. Your body runs on electricity too: nerve cells fire tiny voltage pulses of about a tenth of a volt (see NervousClear).</p>
    <p class="tip"><b>Try it:</b> pick each battery and slide the drain from light to heavy. Watch the current, the power and the running time. Then switch to charging and see the ions and electrons run backwards.</p>`,
  terms: [
    { t: 'Cell', d: 'One unit that turns chemical energy into electrical energy, with two electrodes in an electrolyte.' },
    { t: 'Battery', d: 'Two or more cells joined together, usually in series to add up their voltages.' },
    { t: 'Electrolyte', d: 'The chemical inside a cell that lets ions move between the electrodes, closing the loop.' },
    { t: 'mAh / Ah', d: 'Capacity: how many milliamps (or amps) a battery can supply for one hour.' },
    { t: 'Watt-hour (Wh)', d: 'Energy: volts × amp-hours. 1 Wh is 3,600 joules. 1,000 Wh is 1 kWh, one “unit”.' },
    { t: 'Power, P = V × I', d: 'The rate of using or delivering energy, in watts: volts × amps.' },
  ],
  defaults: { bat: 'phone', drain: 0.35, charge: false },
  controls: [
    { key: 'bat', type: 'seg', label: 'Battery', options: [{ v: 'aa', label: 'AA 1.5 V' }, { v: 'phone', label: 'Phone 3.7 V' }, { v: 'car', label: 'Car 12 V' }, { v: 'ev', label: 'EV 355 V' }] },
    { key: 'drain', type: 'range', label: 'How hard it works', min: 0, max: 1, step: 0.01, ends: ['light', 'heavy'], fmt: (v, s) => { const r = batt({ ...s, drain: v, charge: false }); return `${fmtW(r.P)}: ${v < 0.5 ? r.b.load[0] : r.b.load[1]}`; } },
    { key: 'charge', type: 'toggle', label: 'Charge it instead', hint: 'Charging pushes the ions and electrons back, storing chemical energy again.' },
  ],
  onChange(s, key) { if (key === 'drain') s.charge = false; },
  quiz: [
    { q: 'A phone battery is 3.7 V and 5,000 mAh. How much energy does it store?', options: ['18.5 Wh', '5,000 Wh', '1.35 Wh', '8.7 Wh'], answer: 0, why: 'Energy = volts × amp-hours = 3.7 V × 5 Ah = 18.5 watt-hours.' },
    { q: 'How do six 2.1 V lead-acid cells make a 12.6 V car battery?', options: ['They are in parallel', 'They are in series, so their voltages add', 'Each cell makes 12.6 V', 'The acid doubles the voltage'], answer: 1, why: 'Cells in series add their voltages: 6 × 2.1 V = 12.6 V.' },
    { q: 'A car’s 12 V starter motor takes 150 A. What power is that?', options: ['12.5 W', '162 W', '1,800 W', '150 W'], answer: 2, why: 'P = V × I = 12 V × 150 A = 1,800 W, about as much as a split AC.' },
  ],
  reel: [
    { ms: 5400, caption: 'A battery turns chemical energy into electricity. An electric car pulls over 150 amps at nearly 400 volts.', set: { bat: 'ev', charge: false }, anim: { drain: [0.3, 1] }, view: { pos: [-1.0, 2.4, 6.8], target: [-0.6, 1.7, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const bench = box(7.2, 0.1, 2.0, M.matte(0x3a3f4b, { roughness: 0.7 })); bench.position.set(-0.3, 0.05, 0); root.add(bench);

    // ---------------------------------------------------------------- the cutaway cell (a diagram of any cell)
    const tank = box(2.8, 1.5, 0.9, M.clear(0xcfe8ff, 0.14)); tank.position.set(CX, CY, 0); tank.castShadow = false; root.add(tank);
    const liquid = box(2.7, 1.3, 0.8, M.ghost(0x6bd0a0, 0.12)); liquid.position.set(CX, CY - 0.05, 0); root.add(liquid);
    const anode = box(0.32, 1.4, 0.7, M.metal(0x8c95a3, { roughness: 0.6 })); anode.position.set(AN, CY + 0.05, 0); root.add(anode);
    const cathode = box(0.32, 1.4, 0.7, M.matte(0x3a3330)); cathode.position.set(CA, CY + 0.05, 0); root.add(cathode);
    const sep = box(0.02, 1.25, 0.78, M.ghost(0xffffff, 0.25)); sep.position.set(CX, CY - 0.05, 0); root.add(sep);
    const wireMat = M.metal(0xc8773a, { roughness: 0.3 });
    // electrons: out of the − electrode, over the top through the load, into the +
    const ePath = makePath([[AN, CY + 0.75, 0], [AN, WY, 0], [CX - 0.3, WY, 0], [CX - 0.12, WY + 0.52, 0], [CX + 0.12, WY + 0.52, 0], [CX + 0.3, WY, 0], [CA, WY, 0], [CA, CY + 0.75, 0]], false);
    root.add(wireMesh(makePath([[AN, CY + 0.75, 0], [AN, WY, 0], [CX - 0.3, WY, 0]], false), 0.035, wireMat));
    root.add(wireMesh(makePath([[CX + 0.3, WY, 0], [CA, WY, 0], [CA, CY + 0.75, 0]], false), 0.035, wireMat));
    const bulb = makeBulb(0.34); bulb.position.set(CX, WY + 0.08, 0); root.add(bulb);
    const socket = box(0.7, 0.1, 0.3, M.plastic(0x2a2e37)); socket.position.set(CX, WY - 0.02, 0); root.add(socket);
    const eFlow = flow(ePath, 70, 0.045, HEX.e, { radius: 0.02 }); root.add(eFlow.mesh);
    // ions drifting through the electrolyte (positive ions towards the + electrode while discharging)
    const R = rng(7), NI = 46;
    const ions = Array.from({ length: NI }, () => ({ x: R(), y: R(), z: R() }));
    const ionMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 10, 8), M.glow(0xffb547), NI); ionMesh.frustumCulled = false; root.add(ionMesh);
    const o3 = new THREE.Object3D();

    // ---------------------------------------------------------------- the real batteries on the left
    const real = {};
    { const g = new THREE.Group(); const c = makeCell(1.0, 0.15); c.rotation.z = Math.PI / 2; c.position.y = 0.62; g.add(c); real.aa = g; }
    { const g = new THREE.Group(); const ph = box(0.72, 1.5, 0.08, M.plastic(0x1b1d22)); ph.position.y = 0.9; g.add(ph);
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 1.38), new THREE.MeshBasicMaterial({ color: 0x1d4a7a, toneMapped: false })); scr.position.set(0, 0.9, 0.045); g.add(scr);
      const cell = box(0.56, 1.0, 0.03, M.metal(0xc0c6cf, { roughness: 0.5 })); cell.position.set(0, 0.85, -0.06); g.add(cell);
      g.rotation.y = 0.5; g.scr = scr; real.phone = g; }
    { const g = new THREE.Group(); const b = box(1.5, 0.9, 0.8, M.plastic(0x1f232b)); b.position.y = 0.55; g.add(b);
      const lid = box(1.52, 0.1, 0.82, M.plastic(0x2e343f)); lid.position.y = 1.03; g.add(lid);
      for (let i = 0; i < 6; i++) { const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 16), M.plastic(0xd8c050)); cap.position.set(-0.55 + i * 0.22, 1.1, 0); g.add(cap); }
      const tP = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.14, 16), M.metal(0xc9a46a)); tP.position.set(0.55, 1.15, 0.25); g.add(tP);
      const tN = tP.clone(); tN.position.x = -0.55; g.add(tN);
      g.rotation.y = 0.35; real.car = g; }
    { const g = new THREE.Group(); const tray = box(1.9, 0.12, 1.3, M.metal(0x6b7280)); tray.position.y = 0.16; g.add(tray);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const mod = box(0.42, 0.28, 0.36, M.plastic(0x2a5bd7)); mod.position.set(-0.7 + i * 0.47, 0.38, -0.42 + j * 0.42); g.add(mod); }
      const bus = box(1.7, 0.03, 0.05, M.metal(0xc8773a)); bus.position.set(0, 0.55, 0.55); g.add(bus);
      g.rotation.y = 0.35; real.ev = g; }
    Object.values(real).forEach((g) => { g.position.x = XREAL; root.add(g); });

    // ---------------------------------------------------------------- board: energy stored, log scale
    let cur = null;
    const order = ['aa', 'phone', 'car', 'ev'];
    const bd = board(root, 2.9, 1.8, 800, 500, (g, w, h) => {
      panelBg(g, w, h); if (!cur) return;
      title(g, 'Energy stored', 'volts × amp-hours, each step is ×10');
      const { X, Y } = axes(g, w, h, { x0: 100, y1: 76, xMax: 4, yMin: 1, yMax: 1e5, logY: true, xTicks: [], yTicks: [1, 10, 100, 1e3, 1e4, 1e5], yFmt: (v) => (v >= 1e3 ? v / 1e3 + ' kWh' : v + ' Wh') });
      order.forEach((k, i) => {
        const b = BATS[k], x = X(i + 0.18), bw = X(0.64) - X(0), on = k === cur.bat;
        g.fillStyle = on ? COL.conv : 'rgba(142,240,255,.45)'; g.fillRect(x, Y(b.Wh), bw, Y(1) - Y(b.Wh));
        g.fillStyle = '#fff'; g.font = `${on ? 'bold ' : ''}19px sans-serif`; const t = fmtWh(b.Wh); g.fillText(t, x + bw / 2 - g.measureText(t).width / 2, Y(b.Wh) - 10);
        g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '17px sans-serif'; const l = b.name.replace(' battery', '').replace(' pack', ''); g.fillText(l, x + bw / 2 - g.measureText(l).width / 2, Y(1) + 24);
        const v = `${(b.V > 100 ? Math.round(b.V) : +b.V.toFixed(1))} V`; g.fillText(v, x + bw / 2 - g.measureText(v).width / 2, Y(1) + 46);
      });
    }, [0, 0, 0]);

    const lAn = stage.label('', [AN - 0.1, CY - 0.95, 0.5], root), lCa = stage.label('', [CA + 0.1, CY - 0.95, 0.5], root);
    const lIon = stage.label('', [CX, CY + 0.95, 0.5], root, 'hot'); lIon.element.style.setProperty('--c', COL.conv);
    const lE = stage.label('', [CA + 0.35, WY + 0.3, 0.2], root, 'hot'); lE.element.style.setProperty('--c', COL.e);
    const lReal = stage.label('', [XREAL, 2.0, 0.3], root);

    let bat = '', drift = 0, key = '';
    return {
      update(dt, s, time = 0) {
        dt = Math.max(0, dt);
        const narrow = fitNarrow(stage, [lAn, lCa, lIon]);
        placeBoard(bd, [[2.45, 4.25, -0.4], -0.2, 0.85], [[0.2, 5.1, -0.4], 0, 1.25]);
        const B = batt(s), b = B.b;
        if (s.bat !== bat) { bat = s.bat; Object.entries(real).forEach(([k, g]) => { g.visible = k === bat; }); }
        const dir = B.charging ? -1 : 1, level = clamp(0.25 + 0.75 * (Math.log(B.P / b.P[0]) / Math.log(b.P[1] / b.P[0] || 2)), 0.2, 1);
        const lit = !B.charging || b.charge;
        bulb.setGlow(B.charging ? 0 : 0.35 + 0.8 * level);
        eFlow.mesh.visible = !!(lit && B.P);
        eFlow.update(dt, dir * 1.4 * level);
        drift += dt * dir * 0.25 * level;
        ions.forEach((q, i) => {
          const x = AN + 0.25 + (((q.x + drift) % 1) + 1) % 1 * (CA - AN - 0.5);
          o3.position.set(x, CY - 0.6 + q.y * 1.1 + 0.03 * Math.sin(time * 3 + i), -0.3 + q.z * 0.6); o3.updateMatrix(); ionMesh.setMatrixAt(i, o3.matrix);
        });
        ionMesh.instanceMatrix.needsUpdate = true; ionMesh.visible = eFlow.mesh.visible;
        if (real.phone.visible) real.phone.scr.material.color.setHSL(0.58, 0.6, 0.12 + 0.3 * level);
        const chemNames = { alkaline: ['zinc (−)', 'manganese dioxide (+)'], 'lithium-ion': ['graphite (−)', 'lithium metal oxide (+)'], 'lead-acid': ['lead (−)', 'lead dioxide (+)'] };
        const [an, ca] = chemNames[b.chem];
        lAn.element.innerHTML = an; lCa.element.innerHTML = ca;
        lIon.element.innerHTML = B.charging ? (b.charge ? 'charging: ions pushed back' : 'alkaline cells can’t be recharged') : 'ions carry charge inside';
        lE.element.innerHTML = B.charging ? (b.charge ? `electrons pushed back in by a ${fmtW(b.charge)} charger` : 'no charging') : `electrons flow outside: ${fmtA(B.I)}`;
        lReal.element.innerHTML = `${b.name}: <b>${b.cells > 1 ? `${b.cells} × ${b.cellV} V = ` : ''}${(b.V > 100 ? Math.round(b.V) : +b.V.toFixed(1))} V</b>`;
        lReal.position.set(XREAL, s.bat === 'phone' ? 1.95 : s.bat === 'aa' ? 1.45 : 1.45, 0.3);
        const k = s.bat;
        if (k !== key) { key = k; cur = { bat: s.bat }; bd.redraw(); }
      },
      readout: (s) => {
        const B = batt(s), b = B.b;
        const cap = b.Ah < 10 ? `${Math.round(b.Ah * 1000).toLocaleString('en-IN')} mAh` : `${Math.round(b.Ah)} Ah`;
        if (B.charging && !b.charge) return `<div class="big">No charging</div><div class="no">Alkaline AA cells are not rechargeable: charging them can make them leak or burst. Use NiMH rechargeable cells instead.</div>`;
        return `<div class="big">P = V × I = ${fmtW(B.P)}</div>
          <div class="row"><span>${b.name}, ${b.chem}</span><b>${b.cells > 1 ? b.cells + ' cells, ' : ''}${(b.V > 100 ? Math.round(b.V) : +b.V.toFixed(1))} V, ${cap}</b></div>
          <div class="row"><span>Energy stored, V × Ah</span><b>${fmtWh(b.Wh)}</b></div>
          <div class="row"><span>Current, I = P ÷ V</span><b>${fmtA(B.I)}</b></div>
          <div class="row"><span>${B.charging ? 'Full charge in about' : 'Runs for, energy ÷ power'}</span><b>${fmtDur(B.t)}</b></div>
          <small>${B.charging ? `Charging at ${fmtW(b.charge)}; about 88% of it ends up stored.` : `Heavy drain here is ${b.load[1]}; light is ${b.load[0]}.`}</small>`;
      },
    };
  },
};
