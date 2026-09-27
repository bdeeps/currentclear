// Chapter 5: safety, and where the simple picture misleads.
//  - bird: an 11 kV distribution line (common in India) carrying 100 A. An aluminium ACSR conductor has
//    about 0.3 Ω per km, so 5 cm of wire between the bird's feet is 1.5 × 10⁻⁵ Ω and the voltage across
//    its feet is V = I R ≈ 1.5 mV. Taking the bird's body as roughly 10 kΩ (an estimate), the current
//    through it is about 0.15 µA: nothing. Touch the earthed cross-arm and it bridges the full
//    line-to-earth voltage, 11 kV ÷ √3 ≈ 6.35 kV, driving about 0.6 A. Large birds (vultures, eagles)
//    are often killed this way on distribution poles.
//  - shock: current through a person, I = V ÷ R_body. Body resistance ≈ 500 Ω inside plus the skin:
//    dry about 100 kΩ, sweaty about 10 kΩ, wet about 1 kΩ (OSHA, "Controlling Electrical Hazards").
//    Below about 50 V the outer skin is not broken down and resists more; IEC 60479-1 gives total body
//    impedance of about 3,250 Ω at 25 V against about 1,350 Ω at 230 V, so the skin is taken as 2.5 ×
//    higher below 50 V. Effects (OSHA): about 1 mA felt; 5 mA a slight shock; 6–30 mA painful, can't
//    let go (about 10 mA is the usual let-go limit); 50–150 mA respiratory arrest, death possible;
//    1,000–4,300 mA ventricular fibrillation. An RCCB trips at 30 mA.
//  - lightning: a typical flash carries about 30,000 A (peak) and up to about 300 million volts, for
//    tens of microseconds (US National Weather Service). A lightning rod gives it a thick path to earth.
//    In India lightning killed about 2,900 people in 2022 (NCRB, ADSI 2022: 35.8% of 8,060 deaths
//    from forces of nature).
//  - myth: higher voltage does not always mean more current. A 2 kW geyser on 230 V takes 8.7 A
//    (R = V² ÷ P ≈ 26 Ω). A car starter motor on 12 V takes about 150 A (R ≈ 0.08 Ω): 17 times the
//    current at a nineteenth of the voltage. I = V ÷ R: it depends on the resistance (OhmsLawClear).
import { THREE, M, box, rod, sphere, clamp, approach } from '../kit.js';
import {
  makePath, wireMesh, flow, board, panelBg, title, axes, COL, HEX, si, fmtA, fitNarrow, placeBoard, focusSwitch, makePerson, rng,
} from '../current.js';

const SX = 30, LX = 60, MX = 90;
const VIEWS = {
  bird: { pos: [1.7, 4.0, 5.3], target: [0.2, 3.55, 0.3] },
  shock: { pos: [SX + 1.6, 1.7, 5.0], target: [SX + 0.8, 1.4, 0] },
  lightning: { pos: [LX + 2.2, 4.6, 13.5], target: [LX + 1.0, 5.0, 0] },
  myth: { pos: [MX + 0.5, 2.3, 6.8], target: [MX + 0.3, 1.6, 0] },
};
const LINE = { I: 100, rPerM: 3e-4, feet: 0.05, bird: 1e4, V: 11000 };
export const birdI = (touch) => (touch ? (LINE.V / Math.sqrt(3)) / LINE.bird : (LINE.I * LINE.rPerM * LINE.feet) / LINE.bird);
const SKIN = { dry: 1e5, sweaty: 1e4, wet: 1e3 };
export function shock(s) {
  const skin = SKIN[s.skin] * (s.volts < 50 ? 2.5 : 1), R = 500 + skin, I = s.volts / R;
  const level = I < 0.001 ? ['Nothing: too small to feel', COL.ok] : I < 0.006 ? ['Felt: a tingle or a slight shock', COL.ok] : I < 0.03 ? ['Painful: muscles clench, you may not be able to let go', COL.conv] : I < 0.1 ? ['Very dangerous: breathing can stop', COL.bad] : ['Deadly: the heart can stop', COL.bad];
  return { R, I, level };
}
const MYTH = { gey: { V: 230, P: 2000 }, st: { V: 12, I: 150 } };
MYTH.gey.I = MYTH.gey.P / MYTH.gey.V; MYTH.gey.R = MYTH.gey.V / MYTH.gey.I; MYTH.st.R = MYTH.st.V / MYTH.st.I;

export default {
  id: 'limits',
  short: 'Safety & myths',
  title: 'What really hurts, and two myths',
  subtitle: 'Birds on wires, wet hands, lightning, and why volts alone don’t tell you the current.',
  view: VIEWS.bird,
  learn: `<p>A <b>bird on a power line</b> is safe. Both its feet are on the same wire, so there is almost no voltage between them: about a thousandth of a volt. With no difference in push, almost no current flows through the bird. If a big bird’s wing touches the wire and the earthed pole at the same time, it bridges thousands of volts and is killed. This really happens to vultures and eagles on Indian power poles.</p>
    <p>What harms you is the <b>current through your body</b>, and that depends on the voltage <b>and</b> your resistance: I = V ÷ R. Dry skin resists strongly. <b>Wet skin</b> resists about a hundred times less, so the same 230 V drives a hundred times the current. About <b>1 mA</b> can be felt, about <b>10 mA</b> makes your muscles clench so you <b>can’t let go</b>, and about <b>100 mA</b> across the chest can stop the heart. That’s why RCCBs trip at 30 mA, and why you never touch switches with wet hands.</p>
    <p><b>Lightning</b> is the extreme: about 30,000 A and hundreds of millions of volts, for a few millionths of a second. A lightning rod gives it a thick metal path to the ground. In India lightning kills nearly 3,000 people a year: in a storm, go indoors, and stay away from lone trees and open fields.</p>
    <p><b>Myth: “a battery stores electrons.”</b> It doesn’t. It stores <b>chemical energy</b>. Every electron that leaves the − end comes back in at the + end, so a flat battery has just as many electrons as a full one (chapter 4).</p>
    <p><b>Myth: “higher voltage always means more current.”</b> A 230 V geyser takes 8.7 A, but a car’s 12 V starter motor takes about 150 A. Current depends on the resistance too (see OhmsLawClear).</p>
    <p><b>Stay safe:</b> never touch mains wiring or open sockets, never poke anything into a socket, and never go near a fallen power line. For any electrical fault, switch off at the board and <b>call a qualified electrician</b>.</p>
    <p class="tip"><b>Try it:</b> let the bird’s wing touch the pole. Then wet the hand and raise the voltage, and watch the current climb the danger ladder. Finally compare the geyser with the starter motor.</p>`,
  terms: [
    { t: 'Potential difference', d: 'Another name for voltage: the difference in electrical push between two points. No difference, no current.' },
    { t: 'Earth', d: 'The ground, which can soak up current. Anything touching a live wire and the earth completes a path.' },
    { t: 'Let-go current', d: 'About 10 mA: above it, the muscles of the hand clench and a person can’t release a live wire.' },
    { t: 'Body resistance', d: 'Hundreds of thousands of ohms with dry skin, around a thousand with wet skin.' },
    { t: 'Lightning rod', d: 'A metal rod joined by a thick conductor to the ground, giving lightning a safe path.' },
  ],
  defaults: { focus: 'bird', touch: false, volts: 230, skin: 'dry' },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'bird', label: 'Bird on a wire' }, { v: 'shock', label: 'Your body' }, { v: 'lightning', label: 'Lightning' }, { v: 'myth', label: 'Volts vs amps' }] },
    { key: 'touch', type: 'toggle', label: 'Bird: wing touches the pole', hint: 'Now one foot is at 6,350 V and the wing is at earth.' },
    { key: 'volts', type: 'seg', label: 'You touch', options: [{ v: 1.5, label: 'AA cell 1.5 V' }, { v: 12, label: 'Car battery 12 V' }, { v: 230, label: 'Mains 230 V' }] },
    { key: 'skin', type: 'seg', label: 'Your skin', options: [{ v: 'dry', label: 'Dry' }, { v: 'sweaty', label: 'Sweaty' }, { v: 'wet', label: 'Wet' }] },
  ],
  onChange(s, key) {
    if (key === 'touch') s.focus = 'bird';
    if (key === 'volts' || key === 'skin') s.focus = 'shock';
  },
  quiz: [
    { q: 'Why can a bird sit safely on a single high-voltage wire?', options: ['Birds are insulators', 'Both feet are at almost the same voltage, so almost no current flows through it', 'The wire carries no current', 'Its feathers are wet'], answer: 1, why: 'Current needs a difference in voltage. Between two feet 5 cm apart on one wire it is about a thousandth of a volt.' },
    { q: 'Why is touching a live wire with wet hands so much more dangerous?', options: ['Water raises the voltage', 'Wet skin has much lower resistance, so far more current flows', 'Water stores electricity', 'It isn’t more dangerous'], answer: 1, why: 'I = V ÷ R. Wet skin can resist about a hundred times less than dry skin, letting through a deadly current from the same 230 V.' },
    { q: 'Is it true that a higher voltage always means a bigger current?', options: ['Yes, always', 'No: the current also depends on the resistance', 'Only for AC', 'Only in batteries'], answer: 1, why: 'A 12 V starter motor takes about 150 A; a 230 V geyser takes 8.7 A. I = V ÷ R.' },
  ],
  reel: [
    { ms: 5200, caption: 'A bird on one wire is safe: its feet are at the same voltage. Touch the pole too, and it isn’t.', set: { focus: 'bird', touch: false }, anim: { touch: [false, true] }, view: { pos: [0.55, 3.75, 2.2], target: [0.05, 3.5, 0.7] }, spin: 0 },
    { ms: 5400, caption: 'Current, not voltage alone, harms you. Wet skin lets through a hundred times more.', set: { focus: 'shock', volts: 230, skin: 'dry' }, anim: { skin: ['dry', 'wet'] }, view: { pos: [SX + 1.1, 1.5, 4.0], target: [SX + 0.5, 1.2, 0] }, spin: 0 },
    { ms: 4800, caption: 'Lightning carries about 30,000 amps. Never touch mains wiring: call an electrician.', set: { focus: 'lightning' }, view: { pos: [LX + 1.8, 4.8, 13], target: [LX + 1.2, 4.4, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const gB = new THREE.Group(), gS = new THREE.Group(), gL = new THREE.Group(), gM = new THREE.Group();
    gS.position.x = SX; gL.position.x = LX; gM.position.x = MX; root.add(gB, gS, gL, gM);
    const focus = focusSwitch(stage, { bird: gB, shock: gS, lightning: gL, myth: gM }, VIEWS);
    const spark = M.glow(0xff5a8a), eMat = M.glow(HEX.e);

    // ================================================================ bird on an 11 kV line
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 3.4, 16), M.matte(0x8a8f96)); pole.position.set(-0.6, 1.7, 0); gB.add(pole);
    const arm = box(0.1, 0.08, 2.2, M.metal(0x6b7280)); arm.position.set(-0.6, 3.25, 0); gB.add(arm);
    const insMat = M.plastic(0xc9d6e8), wireY = 3.42, WZ = 0.8;
    for (const z of [-WZ, WZ]) {
      const ins = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.17, 12), insMat); ins.position.set(-0.6, 3.33, z); gB.add(ins);
      const w = rod(-5, 6, 0.025, 0.025, M.metal(0xb9bec8, { roughness: 0.35 })); w.position.y = wireY; w.position.z = z; gB.add(w);
    }
    // earth wire down the pole
    gB.add(wireMesh(makePath([[-0.6, 3.22, 0.1], [-0.6, 0.05, 0.1]], false), 0.015, M.plastic(0x7fcf6a)));
    // the bird: body, head, beak, legs, and one wing that can reach out to the cross-arm
    const bird = new THREE.Group(); bird.position.set(0.15, wireY + 0.02, WZ); gB.add(bird);
    const bMat = M.matte(0x4a3b30, { emissive: new THREE.Color(0, 0, 0) });
    const bBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.16, 6, 12), bMat); bBody.rotation.z = Math.PI / 2 - 0.35; bBody.position.y = 0.16; bird.add(bBody);
    const bHead = sphere(0.07, M.matte(0x5a4a3c), 16); bHead.position.set(0.14, 0.3, 0); bird.add(bHead);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.08, 8), M.matte(0xd8a040)); beak.rotation.z = -Math.PI / 2; beak.position.set(0.23, 0.3, 0); bird.add(beak);
    for (const z of [-0.04, 0.04]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.1, 6), M.matte(0xd8a040)); leg.position.set(0, 0.05, z); bird.add(leg); }
    const wing = new THREE.Group(); wing.position.set(-0.02, 0.2, 0.08); bird.add(wing);
    const wMesh = box(0.42, 0.02, 0.14, M.matte(0x3a2e25)); wMesh.position.x = -0.21; wing.add(wMesh);
    const pBird = makePath([[0.15, wireY, WZ], [0.12, wireY + 0.18, WZ + 0.05], [-0.3, wireY + 0.02, WZ + 0.08], [-0.6, 3.3, WZ], [-0.6, 3.3, 0.1], [-0.6, 0.05, 0.12]], false);
    const fBird = flow(pBird, 44, 0.035, 0xff5a8a, { mat: spark }); gB.add(fBird.mesh);
    const lFeet = stage.label('', [0.45, wireY + 0.6, WZ], gB, 'hot'), lPole = stage.label('earthed cross-arm', [-0.6, 3.0, -0.3], gB), lLine = stage.label('11,000 V line', [1.6, wireY + 0.14, WZ], gB);

    // ================================================================ a hand on a live source
    const floorS = box(3.4, 0.05, 2.4, M.matte(0x4a505c)); floorS.position.set(0.6, 0.025, 0); gS.add(floorS);
    const person = makePerson({ shirt: 0x7a4fd8 }); person.position.set(0, 0.05, 0); gS.add(person);
    person.pose({ arm: 1.35, arm2: 0.15 });
    const src = new THREE.Group(); src.position.set(1.12, 1.44, 0.22); gS.add(src);
    const srcSock = box(0.3, 0.3, 0.06, M.plastic(0xf2f2f2)); srcSock.rotation.y = -Math.PI / 2; src.add(srcSock);
    const srcCar = box(0.5, 0.35, 0.3, M.plastic(0x1f232b)); src.add(srcCar);
    const srcAA = rod(-0.13, 0.13, 0.04, 0.04, M.plastic(0x2a2e37)); srcAA.rotation.z = Math.PI / 2; src.add(srcAA);
    const wall = box(0.1, 2.4, 2.2, M.matte(0x5b6270)); wall.position.set(1.3, 1.2, 0); gS.add(wall);
    const drops = Array.from({ length: 6 }, (_, i) => { const d = sphere(0.02, M.glow(0x6fb8ff), 8); d.position.set(0.72 + (i % 3) * 0.05, 1.38 + Math.floor(i / 3) * 0.06, 0.2 + (i % 2) * 0.05); gS.add(d); return d; });
    const pBody = makePath([[0.98, 1.44, 0.22], [0.5, 1.45, 0.22], [0.02, 1.4, 0.18], [0, 0.95, 0.1], [0, 0.5, 0.1], [0.04, 0.06, 0.1]], false);
    const fBody = flow(pBody, 34, 0.03, 0xff5a8a, { mat: spark }); gS.add(fBody.mesh);
    const lSrc = stage.label('', [1.1, 1.85, 0.3], gS, 'hot'), lBody = stage.label('', [-0.55, 1.1, 0.3], gS);

    // ================================================================ lightning onto a lightning rod
    const ground = box(12, 0.05, 6, M.matte(0x2f3a2f)); ground.position.set(1, 0.025, 0); gL.add(ground);
    const house = box(2.6, 2.0, 2.0, M.matte(0xc9b79c)); house.position.set(1.5, 1.0, -0.5); gL.add(house);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.1, 1.1, 4), M.matte(0x8a3b2a)); roof.rotation.y = Math.PI / 4; roof.position.set(1.5, 2.55, -0.5); gL.add(roof);
    const lrod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 8), M.metal(0xd8a060)); lrod.position.set(1.5, 3.55, -0.5); gL.add(lrod);
    gL.add(wireMesh(makePath([[1.5, 3.1, -0.5], [2.85, 2.1, -0.5], [2.85, 2.0, 0.55], [2.85, 0.03, 0.55]], false), 0.03, M.metal(0xd8a060)));
    const cloud = new THREE.Group(); cloud.position.set(3.2, 9.0, -1.5); gL.add(cloud);
    const R = rng(3);
    for (let i = 0; i < 14; i++) { const c = sphere(0.8 + R() * 0.7, M.matte(0x4a4f5a), 16); c.position.set((R() - 0.5) * 6, (R() - 0.5) * 0.8, (R() - 0.5) * 1.5); cloud.add(c); }
    const boltPts = [[2.9, 8.3, -1.2]]; for (let i = 1; i < 9; i++) boltPts.push([2.9 + (1.5 - 2.9) * i / 9 + (R() - 0.5) * 0.9, 8.3 - (8.3 - 4.05) * i / 9, -1.2 + (0.7 * i) / 9]); boltPts.push([1.5, 4.05, -0.5]);
    const bolt = wireMesh(makePath(boltPts, false), 0.07, M.glow(0xeef4ff)); gL.add(bolt);
    const flash = new THREE.PointLight(0xcfe0ff, 0, 30, 1.2); flash.position.set(1.2, 6, 1); gL.add(flash);
    const pDown = makePath([[1.5, 4.0, -0.5], [1.5, 3.1, -0.5], [2.85, 2.1, -0.5], [2.85, 2.0, 0.55], [2.85, 0.03, 0.55]], false);
    const fDown = flow(pDown, 40, 0.05, 0xeef4ff, { mat: M.glow(0xeef4ff) }); gL.add(fDown.mesh);
    const lBolt = stage.label('≈ 30,000 A', [3.2, 6.0, 0], gL, 'hot'), lRod = stage.label('lightning rod → earth', [3.6, 1.6, 0.6], gL);

    // ================================================================ myth: 230 V geyser vs 12 V starter
    const tbl = box(5.2, 0.08, 1.6, M.matte(0x3a3f4b)); tbl.position.set(0.3, 0.04, 0); gM.add(tbl);
    const gey = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.2, 28), M.plastic(0xf4f4f4)); gey.position.set(-1.5, 0.7, 0); gM.add(gey);
    const sockM = box(0.3, 0.3, 0.06, M.plastic(0xf2f2f2)); sockM.position.set(-0.4, 0.6, -0.3); gM.add(sockM);
    const pG = makePath([[-0.4, 0.62, -0.25], [-1.1, 0.62, -0.1], [-1.1, 0.95, 0.1], [-0.4, 0.58, -0.25]]);
    gM.add(wireMesh(makePath([[-0.4, 0.62, -0.25], [-1.1, 0.62, -0.1]], false), 0.02, M.plastic(0x22252c)));
    const cb = box(0.9, 0.6, 0.5, M.plastic(0x1f232b)); cb.position.set(1.0, 0.38, 0); gM.add(cb);
    const motor = rod(-0.35, 0.35, 0.22, 0.22, M.metal(0x6b7280)); motor.position.set(2.3, 0.35, 0); gM.add(motor);
    const pSt = makePath([[1.3, 0.72, 0], [1.95, 0.72, 0], [1.95, 0.4, 0], [1.95, 0.2, 0.15], [1.3, 0.2, 0.15]]);
    gM.add(wireMesh(makePath([[1.3, 0.72, 0], [1.95, 0.72, 0], [1.95, 0.4, 0]], false), 0.06, M.plastic(0xb3261e)));
    const fG = flow(pG, 26, 0.035, HEX.e, { mat: eMat }), fSt = flow(pSt, 110, 0.04, HEX.e, { mat: eMat, radius: 0.04 });
    gM.add(fG.mesh, fSt.mesh);
    const lG = stage.label(`geyser: <b>230 V · ${MYTH.gey.I.toFixed(1)} A</b>`, [-1.5, 1.6, 0], gM, 'hot'), lSt = stage.label('starter motor: <b>12 V · 150 A</b>', [1.7, 1.2, 0], gM, 'hot');
    lG.element.style.setProperty('--c', COL.conv); lSt.element.style.setProperty('--c', COL.e);

    // ================================================================ one board, drawn for the scene in view
    let cur = null;
    const bd = board(root, 3.0, 1.9, 800, 500, (g, w, h) => {
      panelBg(g, w, h); if (!cur) return;
      const s = cur;
      if (s.focus === 'shock' || s.focus === 'bird') {
        const I = s.focus === 'shock' ? shock(s).I : birdI(s.touch);
        title(g, 'Current through the body', 'each line is ×10');
        const { X, Y, x0, x1 } = axes(g, w, h, { x0: 110, y1: 70, xMax: 1, yMin: 1e-7, yMax: 1, logY: true, xTicks: [], yTicks: [1e-7, 1e-6, 1e-5, 1e-4, 1e-3, 1e-2, 1e-1, 1], yFmt: (v) => si(v, 'A', 1).replace('.0', '') });
        const band = (a, b, col, t) => { g.fillStyle = col; g.fillRect(x0 + 1, Y(b), x1 - x0 - 1, Y(a) - Y(b)); g.fillStyle = 'rgba(255,255,255,.85)'; g.font = '17px sans-serif'; g.fillText(t, x0 + 12, Y(b) + 20); };
        band(1e-3, 6e-3, 'rgba(92,225,169,.12)', '1 mA: felt');
        band(6e-3, 3e-2, 'rgba(255,181,71,.16)', '≈10 mA: can’t let go');
        band(3e-2, 1e-1, 'rgba(255,90,138,.18)', '30 mA: RCCB trips · breathing can stop');
        band(1e-1, 1, 'rgba(255,90,138,.32)', '≈100 mA and up: deadly');
        const y = Y(clamp(I, 1e-7, 1)), xm = (x0 + x1) * 0.72;
        g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
        g.fillStyle = '#fff'; g.font = 'bold 24px sans-serif'; const t = `${s.focus === 'bird' ? 'bird' : 'you'}: ${si(I, 'A', 2)}`; g.fillText(t, xm - g.measureText(t).width / 2, y - 10);
      } else if (s.focus === 'lightning') {
        title(g, 'Currents compared', 'each line is ×10');
        const items = [['phone charger', 2], ['geyser', 8.7], ['starter motor', 150], ['lightning', 30000]];
        const { X, Y } = axes(g, w, h, { x0: 110, y1: 76, xMax: 4, yMin: 1, yMax: 1e5, logY: true, xTicks: [], yTicks: [1, 10, 100, 1e3, 1e4, 1e5], yFmt: (v) => v.toLocaleString('en-IN') + ' A' });
        items.forEach(([n, v], i) => { const x = X(i + 0.2), bw = X(0.6) - X(0); g.fillStyle = i === 3 ? '#eef4ff' : 'rgba(142,240,255,.5)'; g.fillRect(x, Y(v), bw, Y(1) - Y(v)); g.fillStyle = '#fff'; g.font = '18px sans-serif'; const t = fmtA(v); g.fillText(t, x + bw / 2 - g.measureText(t).width / 2, Y(v) - 8); g.fillStyle = 'rgba(255,255,255,.75)'; g.fillText(n, x + bw / 2 - g.measureText(n).width / 2, Y(1) + 24); });
      } else {
        title(g, 'More volts, fewer amps', 'I = V ÷ R');
        const rows = [['geyser', MYTH.gey.V, MYTH.gey.I, MYTH.gey.R, COL.conv], ['starter motor', MYTH.st.V, MYTH.st.I, MYTH.st.R, COL.e]];
        g.font = '19px sans-serif';
        rows.forEach(([n, V, I, Rr, col], i) => {
          const y0 = 110 + i * 175;
          g.fillStyle = col; g.font = 'bold 22px sans-serif'; g.fillText(n, 24, y0);
          g.font = '18px sans-serif'; g.fillStyle = 'rgba(255,255,255,.75)';
          g.fillText('volts', 24, y0 + 40); g.fillText('amps', 24, y0 + 80); g.fillText('resistance', 24, y0 + 120);
          g.fillStyle = col; g.fillRect(140, y0 + 24, (V / 230) * 520, 22); g.fillRect(140, y0 + 64, (I / 150) * 520, 22);
          g.fillStyle = '#fff'; g.fillText(`${V} V`, 150 + (V / 230) * 520, y0 + 42); g.fillText(`${I.toFixed(I < 20 ? 1 : 0)} A`, 150 + (I / 150) * 520, y0 + 82); g.fillText(`${Rr < 1 ? Rr.toFixed(2) : Rr.toFixed(0)} Ω`, 140, y0 + 122);
        });
      }
    }, [0, 0, 0]);

    let t = 0, wingK = 0, key = '';
    return {
      update(dt, s, time = 0) {
        dt = Math.max(0, dt);
        const narrow = fitNarrow(stage, [lPole, lLine, lRod, lBody]);
        focus(s.focus);
        const bp = { bird: [[1.45, 4.3, -0.8], -0.2, 0.55], shock: [[SX + 2.0, 2.45, -0.8], -0.25, 0.6], lightning: [[LX + 6.2, 4.4, -1.0], -0.25, 1.5], myth: [[MX + 2.3, 2.75, -0.6], -0.2, 0.75] }[s.focus];
        const rp = { bird: [[-0.15, 4.7, -0.8], 0, 0.42], shock: [[SX + 0.5, 2.6, -0.8], 0, 0.72], lightning: [[LX + 1.2, 6.7, -1.0], 0, 1.7], myth: [[MX + 0.3, 2.7, -0.6], 0, 0.9] }[s.focus];
        placeBoard(bd, bp, rp);
        t += dt;

        if (s.focus === 'bird') {
          wingK = approach(wingK, s.touch ? 1 : 0, 4, dt);
          wing.rotation.set(0, 0.15 * wingK, 0.42 * wingK - 0.1);
          wMesh.scale.x = 1 + 1.0 * wingK;
          wMesh.position.x = -0.21 * wMesh.scale.x;
          const on = s.touch && wingK > 0.9;
          fBird.mesh.visible = on; if (on) fBird.update(dt, 2.0);
          bMat.emissive.setRGB(on ? 0.22 : 0, 0, 0.03 * +on);
          lFeet.element.innerHTML = s.touch ? `wing on the pole: <b>6,350 V</b> across the bird` : `between its feet: <b>${(LINE.I * LINE.rPerM * LINE.feet * 1000).toFixed(1)} mV</b>`;
          lFeet.element.style.setProperty('--c', s.touch ? COL.bad : COL.ok);
        }
        if (s.focus === 'shock') {
          const S = shock(s);
          srcSock.visible = s.volts === 230; srcCar.visible = s.volts === 12; srcAA.visible = s.volts === 1.5;
          drops.forEach((d) => { d.visible = s.skin !== 'dry'; });
          fBody.mesh.visible = S.I > 1e-4; fBody.update(dt, clamp(0.4 + Math.log10(S.I / 1e-4) * 0.6, 0.2, 3));
          lSrc.element.innerHTML = s.volts === 230 ? 'mains socket, 230 V' : s.volts === 12 ? 'car battery, 12 V' : 'AA cell, 1.5 V';
          lSrc.element.style.setProperty('--c', s.volts === 230 ? COL.bad : COL.ok);
          lBody.element.innerHTML = `body ≈ ${si(S.R, 'Ω', 2)}`;
        }
        if (s.focus === 'lightning') {
          const k = t % 3.2, on = k < 0.35 && (k < 0.08 || k > 0.16);
          bolt.visible = on; flash.intensity = on ? 30 : 0; fDown.mesh.visible = k < 0.6;
          if (fDown.mesh.visible) fDown.update(dt, 8);
        }
        if (s.focus === 'myth') { fG.update(dt, -0.35); fSt.update(dt, -2.6); }
        const kk = `${s.focus}|${s.touch}|${s.volts}|${s.skin}`;
        if (kk !== key) { key = kk; cur = { ...s }; bd.redraw(); }
      },
      readout: (s) => {
        if (s.focus === 'bird') {
          const I = birdI(s.touch);
          return `<div class="big">Through the bird: ${si(I, 'A', 2)}</div>
            <div class="row"><span>Line</span><b>11,000 V, carrying ${LINE.I} A</b></div>
            <div class="row"><span>Voltage across it</span><b>${s.touch ? '6,350 V (line to earth)' : '1.5 mV (5 cm of wire)'}</b></div>
            <div class="row"><span>Bird’s body, roughly</span><b>10 kΩ</b></div>
            ${s.touch ? '<div class="no">Wing on the earthed pole: a path to earth. Deadly.</div>' : '<div class="ok">Both feet on one wire: almost no push across it. Safe.</div>'}`;
        }
        if (s.focus === 'shock') {
          const S = shock(s);
          return `<div class="big">I = V ÷ R = ${si(S.I, 'A', 2)}</div>
            <div class="row"><span>Voltage</span><b>${s.volts} V</b></div>
            <div class="row"><span>Body resistance, ${s.skin} skin</span><b>${si(S.R, 'Ω', 2)}</b></div>
            <div class="${S.I >= 0.006 ? 'no' : 'ok'}">${S.level[0]}.</div>
            <small>Rough values: real resistance varies a lot from person to person. Never test it. Treat every mains wire as deadly.</small>`;
        }
        if (s.focus === 'lightning') {
          return `<div class="big">Lightning ≈ 30,000 A</div>
            <div class="row"><span>Voltage</span><b>up to about 300 million V</b></div>
            <div class="row"><span>How long</span><b>tens of millionths of a second</b></div>
            <div class="row"><span>Deaths in India, 2022</span><b>about 2,900 (NCRB)</b></div>
            <small>In a storm, go indoors or into a car. Stay away from lone trees, open fields, water and metal poles.</small>`;
        }
        return `<div class="big">More volts ≠ more amps</div>
          <div class="row"><span>Geyser, 2 kW</span><b>230 V → ${MYTH.gey.I.toFixed(1)} A (${MYTH.gey.R.toFixed(0)} Ω)</b></div>
          <div class="row"><span>Car starter motor</span><b>12 V → 150 A (${MYTH.st.R.toFixed(2)} Ω)</b></div>
          <small>The current depends on the resistance: I = V ÷ R. And a battery doesn’t store electrons: it stores chemical energy.</small>`;
      },
    };
  },
};
