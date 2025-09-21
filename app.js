// ====== UI refs ======
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const startCamBtn = document.getElementById('startCam');
const startRecBtn = document.getElementById('startRec');
const dlBtn = document.getElementById('dl');

const avgVal = document.getElementById('avgVal');
const abdLVal = document.getElementById('abdL');
const abdRVal = document.getElementById('abdR');
const bar = document.getElementById('bar');
const statusEl = document.getElementById('statusMsg');

const enableSensorsBtn = document.getElementById('enableSensors');
const tiltBadge = document.getElementById('tiltBadge');

const pillToggles = document.querySelectorAll('.pill');

// ====== rodymo jungikliai ======
const SHOW = { shoulders:true, hips:true, knees:true, lines:true, midline:true, labels:true, midHandle:true };
pillToggles.forEach(p=>{
  p.addEventListener('click', ()=>{
    const key = p.dataset.show;
    SHOW[key] = !SHOW[key];
    p.classList.toggle('active', SHOW[key]);
    draw();
  });
});

// ====== Paciento/tyrimo kodas (iki 10 skaitmenų) ======
let patientCode = null;
function askPatientCode(){
  let ok = false;
  while(!ok){
    const val = prompt('Įveskite paciento/tyrimo kodą (iki 10 skaitmenų):', '');
    if (val === null) return false; // atšaukė
    if (/^\d{1,10}$/.test(val)) { patientCode = val; ok = true; }
    else alert('Kodas turi būti 1–10 skaitmenų.');
  }
  return true;
}

// ====== kamera ======
async function initCamera(){
  if (!patientCode){
    const cont = askPatientCode();
    if (!cont) return;
  }
  try{
    let constraints = { video:{facingMode:{ideal:'environment'}, width:{ideal:1280}, height:{ideal:720}}, audio:false };
    let stream = await navigator.mediaDevices.getUserMedia(constraints).catch(()=>null);
    if (!stream){ stream = await navigator.mediaDevices.getUserMedia({video:true, audio:false}); }
    video.setAttribute('playsinline',''); video.setAttribute('muted',''); video.setAttribute('autoplay','');
    video.srcObject = stream;
    await new Promise(res => { if (video.readyState>=1) res(); else video.onloadedmetadata=res; });
    await video.play();
    resize();
  } catch(e){
    alert('Kameros leidimas atmestas arba klaida. Patikrink naršyklės leidimus.');
  }
}
startCamBtn?.addEventListener('click', initCamera);

function resize(){
  const w = document.getElementById('wrap').clientWidth;
  const h = video.videoHeight ? w * (video.videoHeight / video.videoWidth) : (w*9/16);
  canvas.width = w; canvas.height = h;
  draw();
}
window.addEventListener('resize', resize);
video.addEventListener('loadedmetadata', resize);

// ====== pradiniai taškai (normalizuoti 0..1) ======
const P = {
  LS: {x:0.35, y:0.20}, RS: {x:0.65, y:0.20},  // pečiai
  LH: {x:0.42, y:0.55}, RH: {x:0.58, y:0.55},  // klubai
  LK: {x:0.40, y:0.80}, RK: {x:0.60, y:0.80}   // keliai
};
const ORDER = ['LS','RS','LH','RH','LK','RK'];
const COLOR = '#ffffff', RADIUS = 8;

// ====== midline poslinkis (origin shift) ======
// midOffset – lygiagretus visos vidurio linijos poslinkis (leidžia „pataisyti“ automatiką)
let midOffset = {dx:0, dy:0}; // normalizuotas poslinkis

// ====== vektorinė geometrija ======
const sub = (a,b)=>({x:a.x-b.x, y:a.y-b.y});
const unit = (v)=>{ const n=Math.hypot(v.x,v.y); return n>1e-6?{x:v.x/n,y:v.y/n}:{x:0,y:0}; };
const dotp = (a,b)=>a.x*b.x + a.y*b.y;
const ang  = (a,b)=>{ const c=Math.max(-1,Math.min(1,dotp(unit(a),unit(b)))); return Math.acos(c)*180/Math.PI; };

// ====== automatinė vidurio ašis (pečiai → klubai) ======
// Grąžina: {S_mid, H_mid, midDown}, kur midDown – žemyn nukreipta pečių–klubų ašis
function bodyMidline(){
  const S_mid = { x:(P.LS.x+P.RS.x)/2, y:(P.LS.y+P.RS.y)/2 };
  const H_mid = { x:(P.LH.x+P.RH.x)/2, y:(P.LH.y+P.RH.y)/2 };
  let midDown = unit(sub(H_mid, S_mid));
  if (midDown.y < 0) midDown = { x:-midDown.x, y:-midDown.y }; // garantuotai „žemyn“
  return { S_mid, H_mid, midDown };
}

// ====== abdukcijos kampas (šlaunis vs vidurio ašis) ======
function abduction(HIP, KNEE, midDown){ return ang(sub(KNEE,HIP), midDown); }
const SAFE = { greenMin:30, greenMax:45, yellowMax:60 };

// ====== kampų spalvos ======
function colorFor(a){
  if (a < SAFE.greenMin) return '#ea4335';     // <30 red
  if (a <= SAFE.greenMax) return '#34a853';    // 30–45 green
  if (a <= SAFE.yellowMax) return '#f9ab00';   // 45–60 yellow
  return '#ea4335';                            // >60 red
}

// ====== drag logika (taškai + midline rankenėlė) ======
let dragKey = null;
let draggingMid = false;

canvas.addEventListener('pointerdown', e=>{
  const {x,y} = toNorm(e);

  // MID rankenėlė – ties (H_mid + offset), kad pataikyti patogiau per „centrą apačioje“
  const { H_mid } = bodyMidline();
  const midHandle = { x:H_mid.x + midOffset.dx, y:H_mid.y + midOffset.dy };
  const tolMid = 0.03;
  if (SHOW.midHandle && Math.hypot(x - midHandle.x, y - midHandle.y) < tolMid){
    draggingMid = true;
    canvas.setPointerCapture(e.pointerId);
    return;
  }

  // taškų „grab“
  dragKey = hitTest(x,y);
  if (dragKey){ canvas.setPointerCapture(e.pointerId); }
});
canvas.addEventListener('pointermove', e=>{
  const {x,y} = toNorm(e);
  if (draggingMid){
    // Skaičiuojame poslinkį MID rankenėlei pagal dabartinę automatinę bazę
    const { H_mid } = bodyMidline();
    midOffset.dx = x - H_mid.x;
    midOffset.dy = y - H_mid.y;
    draw();
    return;
  }
  if (!dragKey) return;
  P[dragKey].x = Math.min(1, Math.max(0, x));
  P[dragKey].y = Math.min(1, Math.max(0, y));
  draw();
});
canvas.addEventListener('pointerup', e=>{
  dragKey=null; draggingMid=false;
  canvas.releasePointerCapture?.(e.pointerId);
});

function toNorm(e){
  const r = canvas.getBoundingClientRect();
  return { x:(e.clientX-r.left)/r.width, y:(e.clientY-r.top)/r.height };
}
function hitTest(x,y){
  const tol = 0.03;
  for (const k of ORDER){
    const dx = x - P[k].x, dy = y - P[k].y;
    if (Math.hypot(dx,dy) < tol) return k;
  }
  return null;
}

// ====== TILT (įrenginio pakrypimas) ======
let tiltDeg = null;       // momentinis pakrypimas (laipsniais)
let sensorsEnabled = false;

function updateTiltBadge(){
  if (!tiltBadge) return;
  if (tiltDeg == null){
    tiltBadge.textContent = 'Pakrypimas: –';
    tiltBadge.style.color = '#e5e7eb';
    tiltBadge.style.background = '#111827';
    return;
  }
  tiltBadge.textContent = `Pakrypimas: ${tiltDeg.toFixed(1)}°`;
  if (Math.abs(tiltDeg) > 5){
    tiltBadge.style.color = '#fff';
    tiltBadge.style.background = '#ea4335';
  } else {
    tiltBadge.style.color = '#fff';
    tiltBadge.style.background = '#34a853';
  }
}

async function enableSensors(){
  try{
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function'){
      const perm = await DeviceOrientationEvent.requestPermission();
      if (perm !== 'granted') throw new Error('Leidimas nesuteiktas');
    }
    window.addEventListener('deviceorientation', onDeviceOrientation, true);
    sensorsEnabled = true;
    enableSensorsBtn.disabled = true;
    enableSensorsBtn.textContent = 'Jutiklis įjungtas';
  } catch(e){
    alert('Nepavyko įjungti jutiklio. iOS reikalingas leidimas po mygtuko paspaudimo.');
  }
}
enableSensorsBtn?.addEventListener('click', enableSensors);

/**
 * Heuristika:
 * - Jei portrait – naudojame gamma (L↔R pakrypimas).
 * - Jei landscape – naudojame beta (Pirmyn↔Atgal).
 */
function onDeviceOrientation(e){
  const portrait = window.innerHeight >= window.innerWidth;
  const primaryTilt = portrait ? (e.gamma ?? 0) : (e.beta ?? 0); // °
  tiltDeg = Number(primaryTilt) || 0;
  updateTiltBadge();
  draw();
}

// ====== piešimas ======
function px(p){ return { x:p.x*canvas.width, y:p.y*canvas.height }; }

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if (!canvas.width) return;

  // 1) Kūno vidurio ašis pagal pečius ir klubus
  const { S_mid, H_mid, midDown } = bodyMidline();

  // 2) Kampai (šlaunis vs midDown)
  const aL = abduction(P.LH, P.LK, midDown);
  const aR = abduction(P.RH, P.RK, midDown);
  const avg = (aL + aR) / 2;

  // 3) Vidurio linija (su poslinkiu)
  if (SHOW.midline){
    const S_off = { x:S_mid.x + midOffset.dx, y:S_mid.y + midOffset.dy };
    const H_off = { x:H_mid.x + midOffset.dx, y:H_mid.y + midOffset.dy };
    const Spt = px(S_off), Hpt = px(H_off);

    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(Spt.x, Spt.y); ctx.lineTo(Hpt.x, Hpt.y); ctx.stroke();

    if (SHOW.midHandle){
      // MID rankenėlė – ties apatine (klubų) vidurio tašku
      ctx.beginPath(); ctx.arc(Hpt.x, Hpt.y, 10, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
      ctx.font = '12px system-ui'; ctx.fillStyle = '#000';
      ctx.fillText('MID', Hpt.x + 12, Hpt.y + 4);
    }
  }

  // 4) Šlaunų linijos
  if (SHOW.lines){
    ctx.lineCap='round'; ctx.lineWidth = 5;
    // kairė
    ctx.strokeStyle = colorFor(aL);
    const LH=px(P.LH), LK=px(P.LK);
    ctx.beginPath(); ctx.moveTo(LH.x,LH.y); ctx.lineTo(LK.x,LK.y); ctx.stroke();
    // dešinė
    ctx.strokeStyle = colorFor(aR);
    const RH=px(P.RH), RK=px(P.RK);
    ctx.beginPath(); ctx.moveTo(RH.x,RH.y); ctx.lineTo(RK.x,RK.y); ctx.stroke();
  }

  // 5) Taškai
  ctx.fillStyle = '#ffffff';
  const groups = [];
  if (SHOW.shoulders) groups.push('LS','RS');
  if (SHOW.hips)      groups.push('LH','RH');
  if (SHOW.knees)     groups.push('LK','RK');

  for (const k of groups){
    const p = px(P[k]);
    ctx.beginPath(); ctx.arc(p.x, p.y, RADIUS, 0, Math.PI*2); ctx.fill();
    ctx.font = '12px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(k, p.x + 10, p.y - 10);
    ctx.fillStyle = '#ffffff';
  }

  // 6) Kampų etiketės
  if (SHOW.labels){
    labelAt(px(P.LH), `${aL.toFixed(0)}°`, colorFor(aL));
    labelAt(px(P.RH), `${aR.toFixed(0)}°`, colorFor(aR));
  }

  // 7) Panelės tekstai
  abdLVal.textContent = isFinite(aL)? `${aL.toFixed(0)}°` : '–';
  abdRVal.textContent = isFinite(aR)? `${aR.toFixed(0)}°` : '–';
  avgVal.textContent  = isFinite(avg)? `${avg.toFixed(1)}°` : '–';
  abdLVal.style.color = colorFor(aL);
  abdRVal.style.color = colorFor(aR);
  avgVal.style.color  = '#ffffff';

  // 8) Statusas (įskaitant tilt)
  let statusMsg = '';
  let statusColor = '#e5e7eb';
  const bothGreen = (colorFor(aL)==='#34a853' && colorFor(aR)==='#34a853');
  const over60 = (aL>SAFE.yellowMax || aR>SAFE.yellowMax);

  if (over60){ statusMsg = 'Dėmesio: abdukcija > 60° — per didelė!'; statusColor = '#ea4335'; }
  else if (bothGreen){ statusMsg = 'Poza gera (abi kojos 30–45°).'; statusColor = '#34a853'; }
  else if (colorFor(aL)==='#f9ab00' || colorFor(aR)==='#f9ab00'){ statusMsg = 'Įspėjimas: 45–60° (geltona zona).'; statusColor = '#f9ab00'; }
  else if (aL < 30 || aR < 30){ statusMsg = 'Per maža abdukcija (<30°).'; statusColor = '#ea4335'; }

  if (tiltDeg != null && Math.abs(tiltDeg) > 5){
    statusMsg = `Telefonas pakreiptas ${tiltDeg.toFixed(1)}° (>5°). Ištiesinkite įrenginį.`;
    statusColor = '#ea4335';
  }

  if (statusEl){
    statusEl.textContent = statusMsg;
    statusEl.style.color = statusColor;
  }
}

function labelAt(pt, text, col){
  const pad = 4, offY = -12;
  ctx.font = '14px system-ui, -apple-system, Segoe UI, Roboto';
  ctx.textBaseline = 'bottom';
  const m = ctx.measureText(text);
  const w = m.width + pad*2, h = 18;
  const x = Math.min(Math.max(0, pt.x - w/2), canvas.width - w);
  const y = Math.min(Math.max(h, pt.y + offY), canvas.height);
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(x, y-h, w, h);
  ctx.fillStyle = col; ctx.fillText(text, x + pad, y - 4);
}

// pradžia
draw();

// ====== vienkartinis įrašymas (vienas failas su vienu įrašu kiekvieną kartą) ======
let data = [];
startRecBtn.addEventListener('click', ()=>{
  if (bar) bar.style.width = '100%';

  // Įspėjimas, jei pakrypimas > 5°
  if (tiltDeg != null && Math.abs(tiltDeg) > 5){
    const proceed = confirm(`Telefonas pakreiptas ${tiltDeg.toFixed(1)}° (>5°).\nAr tikrai norite išsaugoti?`);
    if (!proceed) return;
  }

  // Kampai pagal automatinę pečių–klubų ašį
  const { S_mid, H_mid, midDown } = bodyMidline();
  const aL = abduction(P.LH, P.LK, midDown);
  const aR = abduction(P.RH, P.RK, midDown);
  const now = Date.now();

  const rec = {
    timestamp: now,
    patientCode: patientCode || null,
    angles: {
      abductionLeft: +aL.toFixed(2),
      abductionRight: +aR.toFixed(2)
    },
    device: {
      tiltDeg: tiltDeg == null ? null : +tiltDeg.toFixed(2),
      tiltOK: tiltDeg == null ? null : (Math.abs(tiltDeg) <= 5)
    },
    midline: {
      from: { x:+(S_mid.x+midOffset.dx).toFixed(4), y:+(S_mid.y+midOffset.dy).toFixed(4) },
      to:   { x:+(H_mid.x+midOffset.dx).toFixed(4), y:+(H_mid.y+midOffset.dy).toFixed(4) }
    },
    midlineOffset: { dx: +midOffset.dx.toFixed(4), dy: +midOffset.dy.toFixed(4) },
    landmarks: {
      leftShoulder:  {...P.LS},
      rightShoulder: {...P.RS},
      leftHip:       {...P.LH},
      rightHip:      {...P.RH},
      leftKnee:      {...P.LK},
      rightKnee:     {...P.RK}
    }
  };
  data = [rec]; // laikome tik paskutinį įrašą viename faile

  if (aL>60 || aR>60){
    alert('Dėmesio: kurio nors šlaunies abdukcija > 60°. Patikrinkite padėtį.');
  }

  // Įjungiam download mygtuką ir automatiškai inicijuojam atsisiuntimą (vienas failas)
  dlBtn.disabled = false;
  autoDownloadJSON();
});

dlBtn.addEventListener('click', ()=>autoDownloadJSON());

function autoDownloadJSON(){
  if (!data.length) return;
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `pose_single_${new Date().toISOString().replace(/:/g,'-')}.json`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
