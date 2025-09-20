// UI refs
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const startCamBtn = document.getElementById('startCam');
const avgVal = document.getElementById('avgVal');
const abdLVal = document.getElementById('abdL');
const abdRVal = document.getElementById('abdR');
const startRecBtn = document.getElementById('startRec');
const dlBtn = document.getElementById('dl');
const bar = document.getElementById('bar');
const pillToggles = document.querySelectorAll('.pill');

// matomumo jungikliai
const SHOW = { shoulders:true, hips:true, knees:true, lines:true, midline:true, labels:true };
pillToggles.forEach(p=>{
  p.addEventListener('click', ()=>{
    const key = p.dataset.show;
    SHOW[key] = !SHOW[key];
    p.classList.toggle('active', SHOW[key]);
    draw();
  });
});

// kamera
async function initCamera(){
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

// pradiniai taškai (normalizuoti 0..1 canvas koord.)
const P = {
  LS: {x:0.35, y:0.20}, RS: {x:0.65, y:0.20},  // pečiai
  LH: {x:0.42, y:0.55}, RH: {x:0.58, y:0.55},  // klubai
  LK: {x:0.40, y:0.80}, RK: {x:0.60, y:0.80}   // keliai
};
const ORDER = ['LS','RS','LH','RH','LK','RK'];
const COLOR = '#ffffff', RADIUS = 8;

// drag
let dragKey = null;
canvas.addEventListener('pointerdown', e=>{
  const {x,y} = toNorm(e);
  dragKey = hitTest(x,y);
  if (dragKey){ canvas.setPointerCapture(e.pointerId); }
});
canvas.addEventListener('pointermove', e=>{
  if (!dragKey) return;
  const {x,y} = toNorm(e);
  P[dragKey].x = Math.min(1, Math.max(0, x));
  P[dragKey].y = Math.min(1, Math.max(0, y));
  draw();
});
canvas.addEventListener('pointerup', e=>{
  dragKey=null; canvas.releasePointerCapture?.(e.pointerId);
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

// geometrija
const sub = (a,b)=>({x:a.x-b.x, y:a.y-b.y});
const unit = (v)=>{ const n=Math.hypot(v.x,v.y); return n>1e-6?{x:v.x/n,y:v.y/n}:{x:0,y:0}; };
const dotp = (a,b)=>a.x*b.x + a.y*b.y;
const ang  = (a,b)=>{ const c=Math.max(-1,Math.min(1,dotp(unit(a),unit(b)))); return Math.acos(c)*180/Math.PI; };
function pelvisBasis2D(LH, RH){
  const x = unit(sub(RH,LH));
  let midDown = unit({x:-x.y, y:x.x});
  if (midDown.y < 0) midDown = {x:-midDown.x, y:-midDown.y};
  return { x, midDown };
}
function abduction(HIP, KNEE, midDown){ return ang(sub(KNEE,HIP), midDown); }
const SAFE = { abdMin:30, abdMax:45, abdWarnMax:55 };
const colAbd = (a)=> a>=SAFE.abdMin && a<=SAFE.abdMax ? '#34a853'
                    : a>SAFE.abdMax && a<=SAFE.abdWarnMax ? '#f9ab00'
                    : '#ea4335';

// braižymas
function px(p){ return { x:p.x*canvas.width, y:p.y*canvas.height }; }

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if (!canvas.width) return;

  const { midDown } = pelvisBasis2D(P.LH, P.RH);
  const aL = abduction(P.LH, P.LK, midDown);
  const aR = abduction(P.RH, P.RK, midDown);
  const avg = (aL + aR) / 2;

  // dubens vidurio linija
  if (SHOW.midline){
    const mid = { x:(P.LH.x+P.RH.x)/2, y:(P.LH.y+P.RH.y)/2 };
    ctx.strokeStyle = COLOR; ctx.lineWidth = 2;
    ctx.beginPath();
    const mpx = px(mid);
    ctx.moveTo(mpx.x, mpx.y);
    ctx.lineTo(mpx.x + midDown.x*120, mpx.y + midDown.y*120);
    ctx.stroke();
  }

  // šlaunų linijos
  if (SHOW.lines){
    ctx.strokeStyle = COLOR; ctx.lineWidth = 5; ctx.lineCap='round';
    let LH=px(P.LH), LK=px(P.LK); ctx.beginPath(); ctx.moveTo(LH.x,LH.y); ctx.lineTo(LK.x,LK.y); ctx.stroke();
    let RH=px(P.RH), RK=px(P.RK); ctx.beginPath(); ctx.moveTo(RH.x,RH.y); ctx.lineTo(RK.x,RK.y); ctx.stroke();
  }

  // taškai
  ctx.fillStyle = COLOR;
  const groups = [];
  if (SHOW.shoulders) groups.push('LS','RS');
  if (SHOW.hips)      groups.push('LH','RH');
  if (SHOW.knees)     groups.push('LK','RK');

  for (const k of groups){
    const p = px(P[k]);
    ctx.beginPath(); ctx.arc(p.x, p.y, RADIUS, 0, Math.PI*2); ctx.fill();
    ctx.font = '12px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(k, p.x + 10, p.y - 10);
    ctx.fillStyle = COLOR;
  }

  // kampų etiketės prie klubų
  if (SHOW.labels){
    labelAt(px(P.LH), `${aL.toFixed(0)}°`, colAbd(aL));
    labelAt(px(P.RH), `${aR.toFixed(0)}°`, colAbd(aR));
  }

  // panelė
  abdLVal.textContent = isFinite(aL)? `${aL.toFixed(0)}°` : '–';
  abdRVal.textContent = isFinite(aR)? `${aR.toFixed(0)}°` : '–';
  avgVal.textContent  = isFinite(avg)? `${avg.toFixed(1)}°` : '–';
  const c = colAbd(avg); avgVal.style.color = c; abdLVal.style.color = c; abdRVal.style.color = c;
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

// pradinė būsena
draw();

// įrašymas: 2 s kas 10 ms
const RECORD_MS = 2000, SAMPLE_MS = 10;
let recTimer = null, t0 = 0, data = [];

startRecBtn.addEventListener('click', ()=>{
  if (recTimer) return;
  data = [];
  t0 = Date.now();
  bar.style.width = '0%';
  startRecBtn.disabled = true;
  dlBtn.disabled = true;

  recTimer = setInterval(()=>{
    const t = Date.now() - t0;
    const prog = (t/RECORD_MS)*100; bar.style.width = `${Math.min(100,prog)}%`;

    // skaičiuojam ir kaupiam
    const { midDown } = pelvisBasis2D(P.LH, P.RH);
    const aL = abduction(P.LH, P.LK, midDown);
    const aR = abduction(P.RH, P.RK, midDown);
    const avg = (aL + aR)/2;

    data.push({
      timestamp: Date.now(),
      time: t,
      angles: { abductionAvg:+avg.toFixed(2), abductionLeft:+aL.toFixed(2), abductionRight:+aR.toFixed(2) },
      pelvis: { midDownX: midDown.x, midDownY: midDown.y },
      landmarks: {
        leftShoulder:  {...P.LS}, rightShoulder: {...P.RS},
        leftHip:       {...P.LH}, rightHip:      {...P.RH},
        leftKnee:      {...P.LK}, rightKnee:     {...P.RK}
      }
    });

    if (t >= RECORD_MS){
      clearInterval(recTimer); recTimer = null;
      startRecBtn.disabled = false;
      dlBtn.disabled = data.length===0;
    }
  }, SAMPLE_MS);
});

dlBtn.addEventListener('click', ()=>{
  if (!data.length) return;
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `manual_pose_${new Date().toISOString().replace(/:/g,'-')}.json`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
});
