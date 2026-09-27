// Chapter 2: series and parallel circuits, switches and fuses.
// A 6 V battery (four 1.5 V cells, like a 4R25 lantern battery) with an internal resistance of about
// 0.5 Ω, and identical 6 V 0.5 A bulbs (hot filament R = 12 Ω, rated 3 W). Brightness is taken as the
// bulb's power against its rated power (a filament's resistance falls when it is dimmer, which this
// simple model ignores).
//  - series: one path, R = n R₁ + r, the same current through every bulb, each gets about 6 V ÷ n,
//    so each glows at roughly 1 ÷ n² of full power. Break one and every bulb goes out. Old incandescent
//    fairy lights did this: about 50 bulbs of about 4.6 V in a row share India's 230 V.
//  - parallel: every bulb sits across the battery, R = R₁ ÷ n (plus r), each gets nearly the full 6 V and
//    its own current; the battery's current is the sum (Kirchhoff's current law, 1845). House wiring
//    works this way, so every socket gets the full 230 V.
//  - fuse: a thin wire that melts when the current stays above its rating (here it blows after
//    ∫ (I/I_rated)² dt of about 1 s, a crude I²t model). A short circuit (0.02 Ω of thick wire across the
//    battery) drives about 6 ÷ 0.52 ≈ 11.5 A and blows a 2 A fuse in a fraction of a second.
import { THREE, M, box, rod, clamp, approach } from '../kit.js';
import {
  makePath, wireMesh, flow, makeBulb, makeFuse, board, panelBg, title, axes, COL, HEX, fmtA, fmtW, fitNarrow, placeBoard,
} from '../current.js';

const BAT = { V: 6, r: 0.5 }, BULB = { R: 12, P: 3 }, R_SHORT = 0.02;
const XL = -2.6, XR = 3.4, TOP = 2.6, BOT = 0.5, MID = 1.05, BP = 2.1, BN = 1.0, XF = -1.95, XS = -1.35;
const xs = [-0.6, 0.6, 1.8, 3.0];

export function solve(s) {
  const n = Math.round(s.n), present = xs.slice(0, n).map((_, i) => !(s.out && i === 1));
  const live = present.filter(Boolean).length;
  const out = { n, present, I: 0, Ib: [0, 0, 0, 0], Vb: [0, 0, 0, 0], Ishort: 0, open: false, Vt: BAT.V };
  if (s.blown) { out.open = true; return out; }
  // total external resistance
  let Rload = Infinity;
  if (s.layout === 'series') Rload = live === n ? n * BULB.R : Infinity;
  else Rload = live ? BULB.R / live : Infinity;
  const Rext = s.short ? 1 / (1 / R_SHORT + (isFinite(Rload) ? 1 / Rload : 0)) : Rload;
  if (!isFinite(Rext)) { out.open = true; return out; }
  out.I = BAT.V / (Rext + BAT.r);
  const V = out.I * Rext; out.Vt = V;
  if (s.short) out.Ishort = V / R_SHORT;
  if (isFinite(Rload)) {
    const Iload = V / Rload;
    present.forEach((p, i) => {
      if (!p) return;
      if (s.layout === 'series') { out.Ib[i] = Iload; out.Vb[i] = Iload * BULB.R; }
      else { out.Vb[i] = V; out.Ib[i] = V / BULB.R; }
    });
  }
  return out;
}

export default {
  id: 'circuits',
  short: 'Series & parallel',
  title: 'One path or many',
  subtitle: 'Fairy lights and house wiring: how current splits, why bulbs dim, and what a fuse is for.',
  view: { pos: [0.9, 3.1, 9.6], target: [0.9, 2.9, 0] },
  learn: `<p>There are two ways to connect several things to one battery. In <b>series</b> they sit one after another in a single loop, like beads on a string. In <b>parallel</b> each one gets its own path between the battery’s two ends, like the rungs of a ladder.</p>
    <p><b>Series:</b> the same current flows through every bulb, but they share the battery’s voltage. Two bulbs get half each, three get a third, so each glows far dimmer. Worse, if one bulb breaks, the loop is broken and <b>all</b> go dark. Old <b>fairy lights</b> were wired like this: about 50 little bulbs sharing 230 V, and one dead bulb meant hunting along the whole string.</p>
    <p><b>Parallel:</b> every bulb gets the <b>full voltage</b> and shines at full brightness, and one broken bulb does not affect the others. The currents <b>add up</b>: four bulbs take four times the current from the battery. Your <b>house</b> is wired in parallel, so every socket gets the full 230 V and each switch controls only its own branch.</p>
    <p>That adding-up is why we need <b>fuses</b>. A fuse is a thin wire in the main line that <b>melts</b> if the current gets too big, breaking the loop before the wiring overheats. A <b>short circuit</b>, a thick wire straight across the battery with no bulb in the way, drives a huge current. Chapter 3 shows the MCBs that do this job in a home.</p>
    <p class="tip"><b>Try it:</b> add bulbs in series and watch them dim; switch to parallel and watch the battery’s current climb instead. Take out bulb 2 in each layout. Then make a short circuit and see the fuse blow.</p>`,
  terms: [
    { t: 'Series', d: 'Parts connected one after another in a single loop. The same current flows through each; they share the voltage.' },
    { t: 'Parallel', d: 'Parts each connected directly across the supply. Each gets the full voltage; their currents add up.' },
    { t: 'Switch', d: 'A gap you can open or close. Open, the loop is broken and no current flows.' },
    { t: 'Fuse', d: 'A thin wire that melts when the current stays above its rating, breaking the circuit to prevent a fire.' },
    { t: 'Short circuit', d: 'A path with almost no resistance across the supply, so a dangerously large current flows.' },
    { t: 'Junction rule', d: 'Current into a junction equals current out of it: branch currents add up (Kirchhoff, 1845).' },
  ],
  defaults: { layout: 'series', n: 3, out: false, short: false, fuse: 2, blown: false },
  controls: [
    { key: 'layout', type: 'seg', label: 'Wiring', options: [{ v: 'series', label: 'Series (fairy lights)' }, { v: 'parallel', label: 'Parallel (house)' }] },
    { key: 'n', type: 'range', label: 'Bulbs (6 V, 0.5 A each)', min: 1, max: 4, step: 1, ends: ['1', '4'], fmt: (v) => `${v} bulb${v > 1 ? 's' : ''}` },
    { key: 'out', type: 'toggle', label: 'Take out bulb 2', hint: 'In series every bulb goes dark. In parallel only one does.' },
    { key: 'fuse', type: 'seg', label: 'Fuse rating', options: [{ v: 1, label: '1 A' }, { v: 2, label: '2 A' }, { v: 5, label: '5 A' }] },
    { key: 'short', type: 'toggle', label: 'Short circuit', hint: 'A thick wire straight across the battery, after the fuse.' },
    { key: 'go', type: 'buttons', label: 'Fuse', items: [{ label: 'Replace the fuse', act: (s) => { s.blown = false; s.short = false; } }] },
  ],
  onChange(s, key) { if (key === 'fuse') s.blown = false; },
  quiz: [
    { q: 'Three identical bulbs are in series on a 6 V battery. Roughly what voltage does each get?', options: ['6 V', '2 V', '18 V', '3 V'], answer: 1, why: 'In series the bulbs share the voltage: 6 V ÷ 3 = 2 V each, so they glow dimly.' },
    { q: 'Why is a house wired in parallel?', options: ['It uses less wire', 'Every socket gets the full voltage, and each appliance works on its own', 'Parallel wiring has no current', 'So one switch turns off everything'], answer: 1, why: 'In parallel, each branch sits across the full 230 V and one appliance failing does not break the others.' },
    { q: 'What does a fuse do?', options: ['Stores charge for later', 'Raises the voltage', 'Melts and breaks the circuit when the current is too big', 'Makes bulbs brighter'], answer: 2, why: 'Its thin wire overheats first, cutting the current before the wiring can catch fire.' },
  ],
  reel: [
    { ms: 5200, caption: 'In parallel, each bulb gets the full voltage. A short circuit sends a huge current and the fuse melts.', set: { layout: 'parallel', n: 3, out: false, blown: false, fuse: 2, short: false }, anim: { short: [false, true] }, view: { pos: [0.4, 2.6, 8.2], target: [0.4, 2.0, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const bench = box(6.8, 0.1, 1.5, M.matte(0x3a3f4b, { roughness: 0.7 })); bench.position.set(0.4, 0.05, 0); root.add(bench);
    for (const x of [XL, XR]) { const post = box(0.1, BOT - 0.1, 0.1, M.matte(0x4a505c)); post.position.set(x, (BOT + 0.1) / 2, 0); root.add(post); }

    // Battery standing on the left wire, + on top.
    const bat = new THREE.Group(); bat.position.set(XL, (BP + BN) / 2, 0); root.add(bat);
    const body = box(0.5, BP - BN, 0.5, M.plastic(0x2a2e37, { roughness: 0.35 })); bat.add(body);
    const band = box(0.52, 0.25, 0.52, M.plastic(0xd98b2b)); band.position.y = (BP - BN) / 2 - 0.2; bat.add(band);
    const tp = rod(-0.04, 0.04, 0.05, 0.05, M.metal(0xd8dde6)); tp.rotation.z = Math.PI / 2; tp.position.y = (BP - BN) / 2 + 0.04; bat.add(tp);
    stage.label('+', [XL - 0.45, BP - 0.1, 0], root); stage.label('−', [XL - 0.45, BN + 0.1, 0], root);

    const fuse = makeFuse(0.5, 0.07); fuse.position.set(XF, TOP, 0); root.add(fuse);
    const bulbs = xs.map((x) => { const b = makeBulb(0.34); root.add(b); const sock = box(0.7, 0.1, 0.3, M.plastic(0x2a2e37)); b.add(sock); sock.position.y = -0.1; return b; });
    const shortMat = M.metal(0xe0e4ea, { roughness: 0.25, emissive: new THREE.Color(0, 0, 0) });

    // Wires, electron flows and their paths are rebuilt when the layout changes.
    const wireMat = M.metal(0xc8773a, { roughness: 0.3 });
    let wires = new THREE.Group(), flows = [], key = '';
    root.add(wires);
    const dispose = (g) => g.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    const hideIn = (P) => (d) => d >= P.cum[P.cum.length - 2] - 0.02;          // the last leg runs inside the battery
    function rebuild(s, S) {
      root.remove(wires); dispose(wires); flows.forEach((f) => { root.remove(f.mesh); f.mesh.geometry.dispose(); });
      wires = new THREE.Group(); root.add(wires); flows = [];
      const W = (pts) => wires.add(wireMesh(makePath(pts, false), 0.035, wireMat));
      const n = S.n, last = xs[n - 1];
      if (s.layout === 'series') {
        W([[XL, BP, 0], [XL, TOP, 0], [xs[0] - 0.3, TOP, 0]]);
        for (let i = 0; i < n - 1; i++) W([[xs[i] + 0.3, TOP, 0], [xs[i + 1] - 0.3, TOP, 0]]);
        W([[last + 0.3, TOP, 0], [XR, TOP, 0], [XR, BOT, 0], [XL, BOT, 0], [XL, BN, 0]]);
        const pts = [[XL, BP, 0], [XL, TOP, 0]];
        for (let i = 0; i < n; i++) pts.push([xs[i] - 0.3, TOP, 0], [xs[i] - 0.12, TOP + 0.52, 0], [xs[i] + 0.12, TOP + 0.52, 0], [xs[i] + 0.3, TOP, 0]);
        pts.push([XR, TOP, 0], [XR, BOT, 0], [XL, BOT, 0], [XL, BN, 0]);
        const P = makePath(pts); const f = flow(P, 150, 0.045, HEX.e, { radius: 0.02, hide: hideIn(P) }); f.branch = -1; flows.push(f);
      } else {
        W([[XL, BP, 0], [XL, TOP, 0], [last + 0.3, TOP, 0]]);
        W([[last - 0.3, BOT, 0], [XL, BOT, 0], [XL, BN, 0]]);
        for (let i = 0; i < n; i++) {
          W([[xs[i] + 0.3, TOP, 0], [xs[i] + 0.3, MID, 0]]); W([[xs[i] - 0.3, MID, 0], [xs[i] - 0.3, BOT, 0]]);
          const P = makePath([[XL, BP, 0], [XL, TOP, 0], [xs[i] + 0.3, TOP, 0], [xs[i] + 0.3, MID, 0], [xs[i] + 0.12, MID + 0.52, 0], [xs[i] - 0.12, MID + 0.52, 0], [xs[i] - 0.3, MID, 0], [xs[i] - 0.3, BOT, 0], [XL, BOT, 0], [XL, BN, 0]]);
          const f = flow(P, 70 + 20 * i, 0.045, HEX.e, { radius: 0.02, hide: hideIn(P) }); f.branch = i; flows.push(f);
        }
      }
      if (s.short) {
        const sw = new THREE.Group(); sw.add(wireMesh(makePath([[XS, TOP, 0], [XS, BOT, 0]], false), 0.06, shortMat)); wires.add(sw);
        const P = makePath([[XL, BP, 0], [XL, TOP, 0], [XS, TOP, 0], [XS, BOT, 0], [XL, BOT, 0], [XL, BN, 0]]);
        const f = flow(P, 90, 0.05, HEX.e, { radius: 0.03, hide: hideIn(P) }); f.branch = 9; flows.push(f);
      }
      flows.forEach((f) => root.add(f.mesh));
    }

    // Board: current in each bulb and from the battery, against the fuse rating.
    let cur = null;
    const bd = board(root, 3.0, 1.9, 800, 500, (g, w, h) => {
      panelBg(g, w, h); if (!cur) return;
      const { s, S } = cur;
      title(g, 'Where the current goes', s.layout === 'series' ? 'one path: the same current everywhere' : 'branches: the currents add up');
      const yMax = s.short && !s.blown ? 12 : Math.max(2.5, s.fuse * 1.2);
      const { X, Y } = axes(g, w, h, { x0: 92, y1: 80, xMin: 0, xMax: 6, yMax, xTicks: [], yTicks: [0, yMax / 2, yMax], yFmt: (v) => +v.toPrecision(2) + ' A', yLabel: 'current ↑' });
      const bar = (i, v, col, lab, sub) => {
        const x = X(i + 0.25), bw = X(0.7) - X(0);
        g.fillStyle = col; g.fillRect(x, Y(Math.min(v, yMax)), bw, Y(0) - Y(Math.min(v, yMax)));
        g.fillStyle = '#fff'; g.font = 'bold 20px sans-serif'; const t = fmtA(v); g.fillText(t, x + bw / 2 - g.measureText(t).width / 2, Math.max(100, Y(Math.min(v, yMax)) - 10));
        g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '17px sans-serif'; g.fillText(lab, x + bw / 2 - g.measureText(lab).width / 2, Y(0) + 24);
        if (sub) g.fillText(sub, x + bw / 2 - g.measureText(sub).width / 2, Y(0) + 46);
      };
      for (let i = 0; i < 4; i++) {
        if (i >= S.n) continue;
        bar(i, S.Ib[i], COL.e, `bulb ${i + 1}`, S.present[i] ? `${Math.round((S.Ib[i] * S.Ib[i] * BULB.R / BULB.P) * 100)}% bright` : 'out');
      }
      bar(4.3, S.I, s.blown ? COL.bad : COL.conv, 'battery', s.short && !s.blown ? `short: ${fmtA(S.Ishort)}` : '');
      g.strokeStyle = COL.bad; g.lineWidth = 3; g.setLineDash([10, 6]); g.beginPath(); g.moveTo(X(0), Y(s.fuse)); g.lineTo(X(6), Y(s.fuse)); g.stroke(); g.setLineDash([]);
      g.fillStyle = COL.bad; g.font = 'bold 18px sans-serif'; g.fillText(s.blown ? `fuse ${s.fuse} A: BLOWN` : `fuse melts above ${s.fuse} A`, X(3.3), Y(s.fuse) - 10);
    }, [0, 0, 0]);

    const lB = xs.map((x) => stage.label('', [x, 0, 0.2], root));
    const lF = stage.label('', [XF, TOP + 0.35, 0.1], root, 'hot'); lF.element.style.setProperty('--c', COL.bad);
    const lBat = stage.label('6 V battery', [XL - 0.95, (BP + BN) / 2, 0], root);
    const lS = stage.label('short circuit!', [XS + 0.1, MID + 0.2, 0.3], root, 'hot'); lS.element.style.setProperty('--c', COL.bad);

    let heat = 0, show = [0, 0, 0, 0], bulbY = [TOP, TOP, TOP, TOP];
    return {
      update(dt, s) {
        dt = Math.max(0, dt);
        const narrow = fitNarrow(stage, [lBat, ...lB]);
        placeBoard(bd, [[3.25, 4.75, -0.4], -0.12, 0.95], [[0.4, 4.8, -0.4], 0, 1.25]);
        const S = solve(s);
        // Fuse: heats with (I / rating)², melts after about a second's worth.
        const ratio = S.I / s.fuse;
        if (!s.blown && ratio > 1) { heat += dt * ratio * ratio; if (heat > 1) { s.blown = true; heat = 0; } } else heat = Math.max(0, heat - dt * 2);
        fuse.setState(s.blown ? 0 : clamp(heat + (ratio > 0.6 ? (ratio - 0.6) * 0.5 : 0), 0, 1), s.blown);
        const k = `${s.layout}|${S.n}|${s.short}`;
        if (k !== key) { key = k; rebuild(s, S); }
        shortMat.emissive.setRGB(s.short && !s.blown ? 1.2 : 0, s.short && !s.blown ? 0.35 : 0, 0.02);
        const S2 = solve(s);
        bulbs.forEach((b, i) => {
          const on = i < S2.n;
          b.visible = on;
          const ty = s.layout === 'series' ? TOP + 0.08 : MID + 0.08, out = s.out && i === 1;
          bulbY[i] = approach(bulbY[i], out ? ty + 0.9 : ty, 8, dt);
          b.position.set(xs[i], bulbY[i], out ? 0.5 : 0);
          show[i] = approach(show[i], (S2.Ib[i] * S2.Ib[i] * BULB.R) / BULB.P, 10, dt);
          b.setGlow(show[i]);
          lB[i].visible = on && !narrow;
          lB[i].position.set(xs[i], bulbY[i] + 1.1, 0.2);
          lB[i].element.innerHTML = out ? 'taken out' : `${S2.Vb[i].toFixed(1)} V<br>${fmtA(S2.Ib[i])}`;
        });
        flows.forEach((f) => {
          const I = f.branch === -1 ? S2.Ib[0] : f.branch === 9 ? S2.Ishort : S2.Ib[f.branch];
          f.update(dt, -Math.min(4, 1.3 * I));
        });
        lF.element.innerHTML = s.blown ? `fuse <b>blown</b>` : `fuse ${s.fuse} A`;
        lS.visible = s.short && !narrow;
        const kk = `${s.layout}|${S2.n}|${s.out}|${s.short}|${s.blown}|${s.fuse}|${S2.I.toFixed(3)}`;
        if (kk !== cur?.k) { cur = { s: { ...s }, S: S2, k: kk }; bd.redraw(); }
      },
      readout: (s) => {
        const S = solve(s), n = S.n;
        const head = s.layout === 'series' ? `R = ${n} × 12 Ω + 0.5 Ω` : `R = 12 Ω ÷ ${S.present.filter(Boolean).length || '–'} + 0.5 Ω`;
        const lit = S.Ib.filter((v) => v > 0.01).length;
        return `<div class="big">Battery current ${fmtA(S.I)}</div>
          <div class="row"><span>${s.layout === 'series' ? 'Series: one loop' : 'Parallel: a branch per bulb'}</span><b>${s.short ? 'shorted' : head}</b></div>
          <div class="row"><span>Each lit bulb gets</span><b>${lit ? S.Vb.find((v) => v > 0.01).toFixed(1) + ' V, ' + fmtA(S.Ib.find((v) => v > 0.01)) : 'nothing'}</b></div>
          <div class="row"><span>Power to the bulbs</span><b>${fmtW(S.Ib.reduce((a, I) => a + I * I * BULB.R, 0))}</b></div>
          <div class="row"><span>Fuse</span><b>${s.fuse} A${s.blown ? ', blown' : ''}</b></div>
          ${s.blown ? '<div class="no">The fuse melted and broke the loop. Remove the fault, then replace it.</div>' : s.short ? `<div class="no">Short circuit: ${fmtA(S.Ishort)} through the thick wire.</div>` : S.open ? '<div class="no">The loop is broken: no current anywhere in it.</div>' : `<small>${s.layout === 'series' ? 'The same current flows through every bulb. They share the 6 V.' : 'Each branch takes its own current. The battery supplies the sum.'}</small>`}`;
      },
    };
  },
};
