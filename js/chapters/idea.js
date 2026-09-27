// Chapter 1: current and voltage as quantities, in a torch.
// Current I = Q ÷ t: the charge passing a point each second, in amperes (1 A = 1 C/s). One coulomb is
// 6.24 × 10¹⁸ electrons (e = 1.602176634 × 10⁻¹⁹ C, exact, SI Brochure 9th ed. 2019).
// Voltage V = E ÷ Q: the energy each coulomb carries, in volts (1 V = 1 J/C).
// The torch: 1 to 6 alkaline AA cells in series, 1.5 V each, internal resistance about 0.15 Ω each
// (Energizer E91 datasheet: roughly 150–300 mΩ fresh). Bulbs by their rated voltage and current, using
// the hot filament's resistance R = V ÷ I (a filament's resistance rises as it heats; OhmsLawClear
// explores that): PR2 torch bulb 2.4 V 0.5 A, miniature 3.8 V 0.3 A, lantern bulb 6 V 0.5 A.
// Brightness goes with power P = V I against the rated power. Run a filament at twice its rated power
// and it burns out quickly: here, after about a second.
// Drift speed v = I ÷ (n A e) in 0.25 mm² copper wire (n = 8.49 × 10²⁸ m⁻³): 0.3 A gives about 0.09 mm/s.
// The signal (the electric field) travels along a wire at a large fraction of the speed of light.
import { THREE, M, box, rod, clamp, approach } from '../kit.js';
import {
  makePath, wireMesh, flow, coneGeo, makeCell, makeBulb, makeMeter, makeSlideSwitch, board, panelBg, title, axes, dot, COL, HEX,
  si, sci, fmtA, fmtW, fmtDur, driftSpeed, PER_C, range, fitNarrow, placeBoard,
} from '../current.js';

export const BULBS = {
  pr2: { name: 'PR2 torch bulb', Vr: 2.4, Ir: 0.5 },
  mini: { name: '3.8 V torch bulb', Vr: 3.8, Ir: 0.3 },
  lantern: { name: '6 V lantern bulb', Vr: 6, Ir: 0.5 },
};
Object.values(BULBS).forEach((b) => { b.R = b.Vr / b.Ir; b.P = b.Vr * b.Ir; });
const CELL = { V: 1.5, r: 0.15 };
const WIRE_MM2 = 0.25;
export function torch(s) {
  const n = Math.round(s.cells), b = BULBS[s.bulb], emf = n * CELL.V, rIn = n * CELL.r;
  const closed = s.on && !s.blown;
  const I = closed ? emf / (b.R + rIn) : 0;
  const Vb = I * b.R, P = Vb * I;
  const Pwould = Math.pow(emf / (b.R + rIn), 2) * b.R;
  return { n, b, emf, rIn, I, Vb, P, k: P / b.P, over: Pwould / b.P, v: driftSpeed(I, WIRE_MM2) };
}

const XL = -2.4, XR = 2.2, BOT = 0.55, TOP = 2.55, XB0 = -1.6, XB1 = 1.4, XBULB = 0.4, XS = -1.3, YM = (TOP + BOT) / 2;
const FIL = TOP + 0.52;

export default {
  id: 'idea',
  short: 'Flow and push',
  title: 'Current is a flow, voltage is a push',
  subtitle: 'Build a torch: count the charge flowing each second, and the energy each coulomb carries.',
  view: { pos: [-0.8, 3.1, 8.2], target: [-0.8, 2.85, 0] },
  learn: `<p>Everything is made of atoms, and atoms hold tiny particles with <b>electric charge</b>: positive protons and negative <b>electrons</b>. In a metal wire some electrons are free to wander. Charge is measured in <b>coulombs</b> (C). One coulomb is the charge of about 6.24 billion billion electrons.</p>
    <p><b>Current</b> is how much charge flows past a point each second: <b>I = Q ÷ t</b>. Its unit is the <b>ampere</b> (A), one coulomb per second. An <b>ammeter</b> measures it, placed <b>in the loop</b> so the flow passes through it. A torch bulb takes about 0.3 A.</p>
    <p><b>Voltage</b> is the push: the <b>energy each coulomb carries</b> from the battery to the bulb. Its unit is the <b>volt</b> (V), one joule per coulomb. A <b>voltmeter</b> measures it <b>across</b> a part, one lead on each side. Each AA cell gives 1.5 V; put two in a row and each coulomb picks up 3 joules. How much current that push drives depends on the resistance, which is <b>Ohm’s law</b> (see OhmsLawClear).</p>
    <p>Two surprises. The electrons <b>crawl</b>: about 0.1 mm per second in a torch wire, slower than a snail. But the wire is already full of them, and the push races round the loop at nearly the <b>speed of light</b>, so the bulb lights at once. And the arrows on circuit diagrams point the “wrong” way. <b>Conventional current</b> flows from + to −, a choice Benjamin Franklin made in the 1740s, long before anyone knew electrons exist. Electrons, being negative, really drift from − to +.</p>
    <p>Think of <b>water in a pipe</b>: the battery is a pump, voltage is the pressure, current is the flow. It helps, but it breaks down. Cut a pipe and water pours out; cut a wire and nothing leaks, the current just stops. And the pipe does not need to be a loop, but a circuit does.</p>
    <p class="tip"><b>Try it:</b> add cells one at a time and watch the ammeter, the voltmeter and the slope of the charge line all rise. Flip the switch off and on to see the push race round. Then switch to conventional current, and to water.</p>`,
  terms: [
    { t: 'Charge (Q)', d: 'A property of electrons and protons that makes them push and pull on each other, measured in coulombs (C).' },
    { t: 'Current (I)', d: 'Charge flowing past a point each second, I = Q ÷ t, measured in amperes (A). 1 A = 1 C every second.' },
    { t: 'Voltage (V)', d: 'The energy each coulomb of charge carries, measured in volts. 1 V = 1 joule per coulomb.' },
    { t: 'Ammeter', d: 'Measures current. It goes in the loop, so the current flows through it.' },
    { t: 'Voltmeter', d: 'Measures voltage. It goes across a part, one lead on each side.' },
    { t: 'Conventional current', d: 'The direction from + to − used on diagrams. Electrons actually drift the other way.' },
    { t: 'Drift speed', d: 'The slow average speed of electrons along a wire: a fraction of a millimetre per second.' },
  ],
  defaults: { cells: 2, bulb: 'mini', on: true, show: 'electrons', blown: false },
  controls: [
    { key: 'cells', type: 'range', label: 'AA cells in the battery', min: 1, max: 6, step: 1, ends: ['1 cell, 1.5 V', '6 cells, 9 V'], fmt: (v) => `${v} × 1.5 V = ${(v * 1.5).toFixed(1)} V` },
    { key: 'bulb', type: 'seg', label: 'Bulb', options: [{ v: 'pr2', label: '2.4 V' }, { v: 'mini', label: '3.8 V' }, { v: 'lantern', label: '6 V' }], fmt: (v) => { const b = BULBS[v]; return `${b.Vr} V, ${b.Ir} A, ${b.R.toFixed(1)} Ω hot`; }, hint: 'Run a bulb far above its rated voltage and it burns out.' },
    { key: 'on', type: 'toggle', label: 'Switch on', hint: 'Close it and watch the push race round before the electrons move.' },
    { key: 'show', type: 'seg', label: 'Show', options: [{ v: 'electrons', label: 'Electrons' }, { v: 'conv', label: 'Current' }, { v: 'both', label: 'Both' }, { v: 'water', label: 'Water' }] },
  ],
  onChange(s, key) { if (key === 'cells' || key === 'bulb') s.blown = false; },
  quiz: [
    { q: '3 coulombs of charge flow through a bulb in 10 seconds. What is the current?', options: ['30 A', '0.3 A', '3 A', '13 A'], answer: 1, why: 'I = Q ÷ t = 3 C ÷ 10 s = 0.3 A.' },
    { q: 'What does “a 1.5 V cell” tell you?', options: ['It holds 1.5 coulombs', 'Each coulomb it pushes round gets 1.5 joules of energy', 'It gives 1.5 A', 'It lasts 1.5 hours'], answer: 1, why: 'A volt is a joule per coulomb. The current depends on what you connect.' },
    { q: 'Electrons drift at about 0.1 mm/s. Why does the bulb light the instant you switch on?', options: ['Electrons speed up to light speed', 'The wire is full of electrons, and the push reaches them all almost at light speed', 'The bulb stores some charge', 'Light travels down the wire'], answer: 1, why: 'Like water in a full hose, the electrons near the bulb start moving as soon as the push arrives, which takes a few billionths of a second.' },
  ],
  reel: [
    { ms: 5600, caption: 'Current is charge per second. Voltage is the energy each coulomb carries: 1.5 volts per cell.', set: { bulb: 'mini', on: true, show: 'electrons', blown: false }, anim: { cells: [1, 3] }, view: { pos: [0.0, 3.4, 5.2], target: [0.0, 3.2, 0] }, spin: 0 },
    { ms: 5200, caption: 'Electrons crawl at 0.1 mm a second, but the push races round the loop near light speed.', set: { cells: 2, bulb: 'mini', show: 'both', blown: false, on: false }, anim: { on: [false, true] }, view: { pos: [0.0, 3.3, 5.0], target: [0.0, 3.1, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const bench = box(5.8, 0.1, 1.6, M.matte(0x3a3f4b, { roughness: 0.7 })); bench.position.set(-0.1, 0.05, 0); root.add(bench);

    // ---------------------------------------------------------------- the loop (conventional direction)
    const path = makePath([[XB1, BOT, 0], [XR, BOT, 0], [XR, TOP, 0], [XBULB + 0.3, TOP, 0], [XBULB + 0.12, FIL, 0], [XBULB - 0.12, FIL, 0], [XBULB - 0.3, TOP, 0], [XL, TOP, 0], [XL, BOT, 0], [XB0, BOT, 0]]);
    const pathW = makePath([[XB1, BOT, 0], [XR, BOT, 0], [XR, TOP, 0], [XL, TOP, 0], [XL, BOT, 0], [XB0, BOT, 0]]);
    const swD = { e: path.cum[6] + (XBULB - 0.3 - XS), w: pathW.cum[2] + (XR - XS) };
    const batD = { e: path.cum[9] };                                  // from here to the end of the loop is inside the battery

    const wireMat = M.metal(0xc8773a, { roughness: 0.3 }), wires = new THREE.Group(); root.add(wires);
    wires.add(wireMesh(makePath([[XB1, BOT, 0], [XR, BOT, 0], [XR, TOP, 0], [XBULB + 0.3, TOP, 0]], false), 0.035, wireMat));
    wires.add(wireMesh(makePath([[XBULB - 0.3, TOP, 0], [XS + 0.18, TOP, 0]], false), 0.035, wireMat));
    wires.add(wireMesh(makePath([[XS - 0.18, TOP, 0], [XL, TOP, 0], [XL, BOT, 0], [XB0, BOT, 0]], false), 0.035, wireMat));
    for (const x of [XL, XR]) { const post = box(0.1, BOT - 0.1, 0.1, M.matte(0x4a505c)); post.position.set(x, (BOT + 0.1) / 2, 0); root.add(post); }

    // Battery holder with six cell slots; empty slots are bridged by a copper strip.
    const holder = new THREE.Group(); root.add(holder);
    const tray = box(XB1 - XB0 + 0.12, 0.08, 0.26, M.plastic(0x1b1d22)); tray.position.set((XB0 + XB1) / 2, BOT - 0.1, 0); holder.add(tray);
    for (const x of [XB0 - 0.03, XB1 + 0.03]) { const end = box(0.05, 0.24, 0.26, M.plastic(0x1b1d22)); end.position.set(x, BOT, 0); holder.add(end); }
    const cells = Array.from({ length: 6 }, (_, i) => { const c = makeCell(0.48, 0.07); c.position.set(XB0 + 0.25 + i * 0.5, BOT, 0); holder.add(c); return c; });
    const strip = box(1, 0.03, 0.08, M.metal(0xc8773a)); strip.position.y = BOT - 0.03; holder.add(strip);
    const plus = stage.label('+', [XB1 + 0.1, BOT + 0.3, 0], root), minus = stage.label('−', [XB0 - 0.1, BOT + 0.3, 0], root);

    // Bulb in a holder on the top wire, with a voltmeter across it.
    const bulb = makeBulb(0.34); bulb.position.set(XBULB, TOP + 0.08, 0); root.add(bulb);
    const socket = box(0.7, 0.1, 0.3, M.plastic(0x2a2e37)); socket.position.set(XBULB, TOP - 0.02, 0); root.add(socket);
    const VY = TOP - 0.85;
    const vm = makeMeter('V', 5, { w: 0.8, h: 0.64, color: '#6a3fc4' }); vm.position.set(XBULB, VY, 0.12); root.add(vm);
    const leadR = M.plastic(0xb3261e), leadB = M.plastic(0x1b1d22);
    root.add(wireMesh(makePath([[XBULB + 0.3, TOP, 0.06], [XBULB + 0.62, TOP - 0.3, 0.12], [XBULB + 0.62, VY, 0.12], [XBULB + 0.4, VY, 0.12]], false), 0.016, leadR));
    root.add(wireMesh(makePath([[XBULB - 0.3, TOP, 0.06], [XBULB - 0.62, TOP - 0.3, 0.12], [XBULB - 0.62, VY, 0.12], [XBULB - 0.4, VY, 0.12]], false), 0.016, leadB));

    const sw = makeSlideSwitch(0.4); sw.position.set(XS, TOP, 0); root.add(sw);
    const am = makeMeter('A', 0.5, { w: 0.8, h: 0.64 }); am.position.set(XR, YM, 0.05); root.add(am);
    const gate = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 8, 32), M.glow(HEX.e, { transparent: true, opacity: 0.8 })); gate.rotation.x = Math.PI / 2; gate.position.set(XR, YM - 0.45, 0); root.add(gate);

    // Electrons (cyan, − to +), conventional current (orange cones, + to −), water (blue).
    // Dots are hidden inside the battery: inside a cell, ions carry the charge (chapter 4).
    const hideBat = (d) => d >= batD.e - 0.02;
    const eFlow = flow(path, 130, 0.045, HEX.e, { radius: 0.022, hide: hideBat });
    const cFlow = flow(path, 44, 0.035, HEX.conv, { geo: coneGeo(0.035), orient: true, mat: M.glow(HEX.conv), hide: hideBat });
    const wFlow = flow(pathW, 200, 0.05, 0x4f9dff, { radius: 0.09 });
    root.add(eFlow.mesh, cFlow.mesh, wFlow.mesh);

    // Water version: clear pipe, a pump for the battery, a narrow neck with a paddle wheel for the bulb.
    const pipe = new THREE.Group(); root.add(pipe);
    pipe.add(wireMesh(makePath([[XBULB - 0.35, TOP, 0], [XL, TOP, 0], [XL, BOT, 0], [XR, BOT, 0], [XR, TOP, 0], [XBULB + 0.35, TOP, 0]], false), 0.15, M.clear(0x7fb6ff, 0.2)));
    const neck = rod(XBULB - 0.35, XBULB + 0.35, 0.06, 0.06, M.clear(0x7fb6ff, 0.4)); neck.position.y = TOP; pipe.add(neck);
    const paddle = new THREE.Group(); paddle.position.set(XBULB, TOP + 0.2, 0); pipe.add(paddle);
    for (let i = 0; i < 6; i++) { const v = box(0.03, 0.34, 0.14, M.plastic(0xe8eef8)); v.rotation.z = (i * Math.PI) / 6; paddle.add(v); }
    const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.32, 36), M.plastic(0x2e6bd6, { transparent: true, opacity: 0.85 })); pump.rotation.x = Math.PI / 2; pump.position.set(-0.1, BOT, 0.05); pipe.add(pump);
    const imp = new THREE.Group(); imp.position.set(-0.1, BOT, 0.23); pipe.add(imp);
    for (let i = 0; i < 4; i++) { const v = box(0.66, 0.06, 0.03, M.plastic(0xe8eef8)); v.rotation.z = (i * Math.PI) / 4; imp.add(v); }

    // The push: two bright pulses that run from the switch both ways when it closes.
    const pulses = [0, 1].map(() => { const p = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), M.glow(0xffe08a)); root.add(p); return p; });

    // ---------------------------------------------------------------- board: charge through the ammeter
    const T_WIN = 10;
    let hist = [[0, 0]], tq = 0, Q = 0, cur = null;
    const bd = board(root, 3.1, 1.94, 800, 500, (g, w, h) => {
      panelBg(g, w, h); if (!cur) return;
      title(g, 'Charge through the ammeter', 'Q against t');
      const qMax = Math.max(0.5, range(Math.max(cur.I * T_WIN, Q) * 1.05));
      const { X, Y } = axes(g, w, h, { x0: 92, y1: 80, xMax: T_WIN, yMax: qMax, xTicks: [0, 2, 4, 6, 8, 10], yTicks: [0, qMax / 2, qMax], xFmt: (v) => v + ' s', yFmt: (v) => +v.toPrecision(3) + ' C', xLabel: 'time t →', yLabel: 'charge Q ↑' });
      g.strokeStyle = 'rgba(142,240,255,.25)'; g.lineWidth = 2; g.setLineDash([8, 6]); g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(T_WIN), Y(Math.min(qMax, cur.I * T_WIN))); g.stroke(); g.setLineDash([]);
      g.strokeStyle = COL.e; g.lineWidth = 5; g.beginPath(); hist.forEach(([t, q], i) => (i ? g.lineTo(X(t), Y(q)) : g.moveTo(X(t), Y(q)))); g.stroke();
      const [tl, ql] = hist[hist.length - 1];
      dot(g, X(tl), Y(ql), COL.conv, 10);
      g.fillStyle = '#fff'; g.font = 'bold 24px sans-serif';
      const t1 = `slope = Q ÷ t = ${cur.I < 1 ? cur.I.toFixed(2) : cur.I.toFixed(1)} C per second = ${fmtA(cur.I)}`;
      g.fillText(t1, 110, 116);
      g.font = '18px sans-serif'; g.fillStyle = 'rgba(255,255,255,.7)';
      g.fillText(cur.I ? `${sci(cur.I * PER_C)} electrons pass every second` : 'no current: no charge flows', 110, 146);
    }, [0, 0, 0]);

    const lBat = stage.label('', [(XB0 + XB1) / 2, BOT - 0.36, 0.3], root, 'hot'); lBat.element.style.setProperty('--c', COL.volt);
    const lBulb = stage.label('', [XBULB + 1.0, TOP + 0.75, 0], root);
    const lA = stage.label('ammeter: in the loop', [XR + 0.25, YM - 0.4, 0.3], root);
    const lV = stage.label('voltmeter: across the bulb', [XBULB, VY - 0.5, 0.2], root);
    const lSw = stage.label('', [XS, TOP - 0.32, 0.2], root);
    const lE = stage.label('', [-1.6, 1.3, 0.3], root, 'hot'); lE.element.style.setProperty('--c', COL.e);

    let front = 1e3, wasOn = true, Ishow = 0, spinW = 0, over = 0, key = '';
    return {
      update(dt, s) {
        dt = Math.max(0, dt);
        const narrow = fitNarrow(stage, [lA, lV, lSw, plus, minus, lBulb]);
        placeBoard(bd, [[1.95, 4.75, -0.3], -0.15, 0.74], [[0.0, 5.0, -0.4], 0, 1.35]);
        const T = torch(s), water = s.show === 'water';
        // The bulb burns out if it is run at more than twice its rated power for about a second.
        if (s.on && !s.blown && T.over > 2) { over += dt; if (over > 1) { s.blown = true; over = 0; } } else over = 0;
        Ishow = approach(Ishow, T.I, 10, dt);
        if (s.on && !wasOn) front = 0;
        wasOn = s.on;
        front = Math.min(1e3, front + dt * 5.5);
        const L = water ? pathW.L : path.L, sd = water ? swD.w : swD.e;
        const reached = (d) => { const a = Math.abs(d - sd), dd = Math.min(a, L - a); return dd <= front; };

        // cells: fill slots from the left; a copper strip bridges the empty ones to the + end
        cells.forEach((c, i) => { c.visible = i < T.n && !water; });
        const x0 = XB0 + T.n * 0.5;
        strip.visible = T.n < 6 && !water; strip.scale.x = Math.max(0.01, XB1 - x0); strip.position.x = (x0 + XB1) / 2;
        holder.visible = !water; bulb.visible = !water; socket.visible = !water; wires.visible = !water; pipe.visible = water; sw.visible = true;
        sw.set(s.on);
        bulb.setGlow(s.blown ? 0 : clamp(T.k, 0, 1.6));
        am.set(Ishow, Ishow < 1 ? `${(Ishow * 1000).toFixed(0)} mA` : `${Ishow.toFixed(2)} A`, range(Math.max(0.1, Ishow)));
        vm.set(T.Vb, `${T.Vb.toFixed(2)} V`, range(Math.max(1, T.emf)));

        // dots: speed on screen ∝ current (hugely sped up: the real drift is about 0.1 mm/s)
        const v = 1.2 * Ishow;
        const showE = s.show === 'electrons' || s.show === 'both', showC = s.show === 'conv' || s.show === 'both';
        eFlow.mesh.visible = showE; cFlow.mesh.visible = showC; wFlow.mesh.visible = water;
        if (showE) eFlow.update(dt, -v, reached);
        if (showC) cFlow.update(dt, v, reached);
        if (water) wFlow.update(dt, v, reached);
        spinW -= dt * Ishow * 8; imp.rotation.z = spinW; paddle.rotation.z = spinW * 0.8;
        const pp = water ? pathW : path;
        pulses.forEach((p, i) => { p.visible = front < L / 2 && s.on; pp.at(sd + (i ? 1 : -1) * front, p.position); p.position.z += 0.05; });
        gate.visible = !water; gate.material.opacity = 0.35 + 0.5 * clamp(Ishow * 3, 0, 1);

        // Q–t record through the ammeter, reset every 10 s
        tq += dt; Q += Ishow * dt;
        if (tq > T_WIN) { tq = 0; Q = 0; hist = [[0, 0]]; }
        if (tq - hist[hist.length - 1][0] > 0.1) hist.push([tq, Q]);
        cur = { I: T.I };
        const k = `${hist.length}|${T.I.toFixed(4)}|${Q.toFixed(3)}`;
        if (k !== key) { key = k; bd.redraw(); }

        lBat.element.innerHTML = water ? `pump: <b>${T.emf.toFixed(1)} V</b> of pressure` : `battery <b>${T.n} × 1.5 V = ${T.emf.toFixed(1)} V</b>: ${T.emf.toFixed(1)} J per coulomb`;
        lBulb.element.innerHTML = water ? 'narrow pipe turns a wheel' : s.blown ? '<b>blown</b>: the filament melted' : T.over > 1.4 && s.on ? 'too bright: burning out' : T.b.name;
        lSw.element.textContent = s.on ? 'switch on' : 'switch off';
        lE.element.innerHTML = !s.on ? 'switch off: no push, no flow' : front < L / 2 ? 'the push races round the loop…' : water ? 'water flows from the pump round the loop' : s.show === 'conv' ? 'conventional current: + to −' : s.show === 'both' ? 'current + to −, electrons − to +' : 'electrons drift from − to +';
      },
      readout: (s) => {
        const T = torch(s);
        if (!T.I) return `<div class="big">I = Q ÷ t = 0 A</div>
          <div class="row"><span>Battery</span><b>${T.n} × 1.5 V = ${T.emf.toFixed(1)} V</b></div>
          <div class="no">${s.blown ? 'The bulb has blown: the loop is broken. Take out a cell or change the bulb.' : 'The switch is open: the loop is broken, so nothing flows.'}</div>`;
        return `<div class="big">I = Q ÷ t = ${fmtA(T.I)}</div>
          <div class="row"><span>Charge each second</span><b>${T.I.toFixed(2)} C = ${sci(T.I * PER_C)} electrons</b></div>
          <div class="row"><span>Battery, energy per coulomb</span><b>${T.emf.toFixed(1)} V = ${T.emf.toFixed(1)} J/C</b></div>
          <div class="row"><span>Voltmeter across the bulb</span><b>${T.Vb.toFixed(2)} V</b></div>
          <div class="row"><span>Power to the bulb, P = V × I</span><b>${fmtW(T.P)}${T.over > 1.4 ? ', too much' : ''}</b></div>
          <div class="row"><span>Electron drift in the wire</span><b>${(T.v * 1000).toFixed(2)} mm/s</b></div>
          <small>An electron takes ${fmtDur(1 / T.v)} to crawl 1 m of wire. The push covers it in about 5 billionths of a second.${T.over > 2 ? ' <b>Over twice its rated power: it is about to burn out.</b>' : ''}</small>`;
      },
    };
  },
};
