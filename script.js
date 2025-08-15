/* Cinematic + de-jittered interactions + calculators.
   – Cursor comet: higher damping, capped scale.
   – Magnetic hover: spring smoothing per element.
   – Typewriter: no random jitter; clean, slider-controlled cadence.
*/

const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
const fmt = (x, p=2) => (isFinite(x) ? Number(x).toLocaleString(undefined, {maximumFractionDigits:p}) : '—');
const toPct = (x, p=2) => isFinite(x) ? (100*x).toFixed(p)+'%' : '—';
const nearly = (a,b,eps=1e-12)=>Math.abs(a-b)<eps;

// ---------- Cursor comet (smoother, no jitter) ----------
const blob = $("#cursor-blob");
let mx=window.innerWidth/2, my=window.innerHeight/2, tx=mx, ty=my, vx=0, vy=0;
window.addEventListener('mousemove', e => { tx=e.clientX; ty=e.clientY; });
function cursorLoop(){
  // Critically damped-ish spring
  const k = 0.12, damp = 0.85;
  const dx = tx - mx, dy = ty - my;
  vx = vx*damp + dx*k; vy = vy*damp + dy*k;
  mx += vx; my += vy;
  blob.style.transform = `translate(${mx-21}px, ${my-21}px)`;

  // Gentle scale with velocity
  const sp = Math.min(1.4, 0.8 + Math.hypot(vx,vy)/28);
  const s = 42*sp;
  blob.style.width = `${s}px`; blob.style.height = `${s}px`;
  requestAnimationFrame(cursorLoop);
}
cursorLoop();

// ---------- Navigation ----------
const navLinks = $$('.nav-link');
const scenes = $$('.scene');
function showScene(id){
  scenes.forEach(s=>s.classList.toggle('active', s.id===id));
  navLinks.forEach(btn=>btn.classList.toggle('active', btn.dataset.target===id));
  window.scrollTo({top:0, behavior:'smooth'});
  requestAnimationFrame(() => revealScan());
}
navLinks.forEach(btn=>btn.addEventListener('click', ()=>showScene(btn.dataset.target)));
$$('.next').forEach(btn=>btn.addEventListener('click', ()=>showScene(btn.dataset.next)));

// ---------- Typewriter (no random jitter) ----------
const tw = $("#typewriter");
const speedSlider = $("#type-speed");
const speedOut = $("#speed-readout");
const storyText = [
  "Day 1. The espresso cart hums. Alex wonders: what’s money worth across time?",
  "Day 30. A lender calls. Terms swirl: nominal, effective, force of interest.",
  "Day 60. Plans expand: annuities for equipment, a loan for build-out, bonds for idle cash.",
  "Day 120. Immunization whispers: match cashflows, tame volatility. The future feels… calculated."
];
let twIdx = 0, twChar=0, rate=1.0;
if (speedSlider){
  const updateSpeed = ()=>{ rate = Number(speedSlider.value); speedOut.textContent = rate.toFixed(1)+'×'; };
  speedSlider.addEventListener('input', updateSpeed); updateSpeed();
}
function typeLoop(){
  if(!tw) return;
  const s = storyText[twIdx];
  tw.textContent = s.slice(0, twChar++);
  if(twChar> s.length){
    twIdx = (twIdx+1) % storyText.length;
    twChar = 0;
    setTimeout(typeLoop, 900/rate);
  } else {
    // constant cadence scaled by rate
    setTimeout(typeLoop, Math.max(14, 28 / rate));
  }
}
typeLoop();

// ---------- Gentle parallax ----------
const brand = $(".brand");
const storyPanel = $(".story-panel");
document.addEventListener('scroll', ()=>{
  const y = window.scrollY;
  const py = y * 0.04;
  if(brand) brand.style.transform = `translateZ(0) translateY(${py}px)`;
  if(storyPanel) storyPanel.style.transform = `translateZ(0) translateY(${py*0.6}px)`;
});

// ---------- Intersection reveal ----------
let observer;
function revealScan(){
  const cards = $$('[data-reveal]:not(.revealed)');
  if(observer) cards.forEach(el=>observer.observe(el));
}
observer = new IntersectionObserver((entries)=>{
  entries.forEach((entry)=>{
    if(entry.isIntersecting){
      entry.target.classList.add('revealed');
      observer.unobserve(entry.target);
    }
  });
},{ root: $('.content'), rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
revealScan();

// ---------- Sources drawer ----------
const sourcesDrawer = $("#sources");
$("#toggle-sources").addEventListener('click', ()=>sourcesDrawer.classList.add('active'));
$("#sources .close").addEventListener('click', ()=>sourcesDrawer.classList.remove('active'));
$$('[data-source]').forEach(a=>{
  a.addEventListener('click', (e)=>{
    e.preventDefault();
    sourcesDrawer.classList.add('active');
  });
});
document.addEventListener('keydown', (e)=>{
  if(e.key==='Escape' && sourcesDrawer.classList.contains('active')){
    sourcesDrawer.classList.remove('active');
  }
});

// ---------- Magnetic hover (smoothed spring) ----------
const magnets = $$('.magnet');
const magState = new WeakMap();
magnets.forEach(el=>{
  const st = {tx:0, ty:0, x:0, y:0, raf:null};
  magState.set(el, st);
  const strength = 10; // gentler
  el.addEventListener('mousemove', e=>{
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width/2)) / (r.width/2);
    const dy = (e.clientY - (r.top + r.height/2)) / (r.height/2);
    st.tx = dx*strength; st.ty = dy*strength;
    if(!st.raf){
      const loop = ()=>{
        st.x += (st.tx - st.x)*0.18;
        st.y += (st.ty - st.y)*0.18;
        el.style.transform = `translate(${st.x}px, ${st.y}px)`;
        if(Math.hypot(st.tx-st.x, st.ty-st.y) > 0.1){
          st.raf = requestAnimationFrame(loop);
        } else {
          st.raf = null;
        }
      };
      st.raf = requestAnimationFrame(loop);
    }
  });
  el.addEventListener('mouseleave', ()=>{
    st.tx = 0; st.ty = 0;
    if(!st.raf){
      const loop = ()=>{
        st.x += (st.tx - st.x)*0.18;
        st.y += (st.ty - st.y)*0.18;
        el.style.transform = `translate(${st.x}px, ${st.y}px)`;
        if(Math.hypot(st.tx-st.x, st.ty-st.y) > 0.1){
          st.raf = requestAnimationFrame(loop);
        } else {
          st.raf = null;
        }
      };
      st.raf = requestAnimationFrame(loop);
    }
  });
});

// =====================================================================
// ==================== FINANCIAL MATH CALCULATORS ======================
// =====================================================================

// Helpers
function parseCSVNums(s){ if(!s) return []; return s.split(/[, ]+/).map(Number).filter(x=>!Number.isNaN(x)); }
function vFromI(i){ return 1/(1+i); }
function dFromI(i){ return i/(1+i); }
function iFromd(d){ return d/(1-d); }
function imFromi(i, m){ return Math.pow(1+i, 1/m)-1; }
function effFromNomJ(jm, m){ return Math.pow(1+jm/m, m)-1; }
function deltaFromNomJ(jm, m){ return m*Math.log(1+jm/m); }
function effFromNomD(dm, m){ return Math.pow(1-dm/m, -m)-1; }
function sum(arr){ return arr.reduce((a,b)=>a+b,0); }

function pvFromCFs(CFs, i){ return CFs.reduce((acc, cf, idx)=> acc + cf / Math.pow(1+i, idx+1), 0); }
function avFromCFs(CFs, i){ return CFs.reduce((acc, cf, idx)=> acc + cf * Math.pow(1+i, CFs.length-(idx+1)), 0); }

// Scene 1: rates
const jNom = $("#j-nom"), mComp = $("#m-comp"), effI = $("#eff-i"), effDelta = $("#eff-delta");
function updateNominal(){
  const jm = Number(jNom?.value)/100;
  const m  = Number(mComp?.value);
  if(!isFinite(jm) || !isFinite(m) || m<=0) return;
  const i = effFromNomJ(jm, m);
  const delta = deltaFromNomJ(jm, m);
  if(effI) effI.textContent = toPct(i, 6);
  if(effDelta) effDelta.textContent = toPct(delta, 6);
}
[jNom, mComp].forEach(el=>el && el.addEventListener('input', updateNominal));
updateNominal();

$("#btn-cf-pv")?.addEventListener('click', ()=>{
  const cfs = parseCSVNums($("#cf-seq").value);
  const i = Number($("#cf-i").value)/100;
  const pv = pvFromCFs(cfs, i);
  $("#cf-pv").textContent = fmt(pv, 4);
});

// Scene 2: level annuities
function a_n_i(n,i){ if(nearly(i,0)) return n; return (1-Math.pow(1+i,-n))/i; }
function s_n_i(n,i){ if(nearly(i,0)) return n; return (Math.pow(1+i,n)-1)/i; }
function ada_n_i(n,i){ const d = dFromI(i); if(nearly(d,0)) return n; return (1-Math.pow(1+i,-n))/d; }
function a_bar_n_delta(n,delta){ if(nearly(delta,0)) return n; return (1-Math.exp(-delta*n))/delta; }

$("#btn-ann")?.addEventListener('click', ()=>{
  const n = Number($("#ann-n").value);
  const i = Number($("#ann-i").value)/100;
  $("#res-a-ni").textContent = fmt(a_n_i(n,i), 8);
  $("#res-ada-ni").textContent = fmt(ada_n_i(n,i), 8);
  $("#res-s-ni").textContent = fmt(s_n_i(n,i), 8);
});
$("#btn-cont-ann")?.addEventListener('click', ()=>{
  const n = Number($("#cont-n").value);
  const delta = Number($("#cont-delta").value)/100;
  $("#res-a-bar").textContent = fmt(a_bar_n_delta(n,delta), 8);
});
$("#btn-m-ann")?.addEventListener('click', ()=>{
  const i = Number($("#m-i").value)/100;
  const m = Number($("#m-m").value);
  const n = Number($("#m-n").value);
  const im = imFromi(i, m);
  const N = m*n;
  const a = a_n_i(N, im);
  $("#res-m-a").textContent = `${fmt(a,8)} (i_m=${toPct(im,6)})`;
});

// Scene 3: varying annuities
function inc_a(n,i){ return (a_n_i(n,i) - n*Math.pow(1+i,-n))/i; }
function dec_a(n,i){ return (n - a_n_i(n,i))/i; }
function geo_a(n,i,g){
  if(nearly(i,g)) {
    let v=1/(1+i), acc=0;
    for(let k=1;k<=n;k++){ acc += Math.pow(1+g,k-1)*Math.pow(v,k); }
    return acc;
  }
  return (1 - Math.pow((1+g)/(1+i), n)) / (i-g);
}
$("#btn-ari")?.addEventListener('click', ()=>{
  const n = Number($("#ari-n").value);
  const i = Number($("#ari-i").value)/100;
  const step = Number($("#ari-step").value);
  $("#res-ari-inc").textContent = fmt(inc_a(n,i)*step, 6);
  $("#res-ari-dec").textContent = fmt(dec_a(n,i)*step, 6);
});
$("#btn-geo")?.addEventListener('click', ()=>{
  const n = Number($("#geo-n").value);
  const i = Number($("#geo-i").value)/100;
  const g = Number($("#geo-g").value)/100;
  $("#res-geo").textContent = fmt(geo_a(n,i,g), 6);
});

// Scene 4: loans
function levelPayment(L, n, i){ return L / a_n_i(n,i); }
function buildLoanSchedule(L,n,i){
  const P = levelPayment(L,n,i);
  const rows = [];
  let B = L;
  for(let t=1;t<=n;t++){
    const interest = B*i;
    const principal = P - interest;
    const Bnext = B - principal;
    rows.push({t, P, interest, principal, B: Math.max(0,Bnext)});
    B = Bnext;
  }
  return {P, rows};
}
$("#btn-loan")?.addEventListener('click', ()=>{
  const L = Number($("#loan-L").value);
  const i = Number($("#loan-i").value)/100;
  const n = Number($("#loan-n").value);
  const {P, rows} = buildLoanSchedule(L,n,i);
  $("#loan-P").textContent = fmt(P, 6);
  const wrap = $("#loan-table-wrap"); wrap.innerHTML = '';
  const table = document.createElement('table');
  table.innerHTML = `<thead><tr><th>t</th><th>Payment</th><th>Interest</th><th>Principal</th><th>Balance</th></tr></thead>`;
  const tb = document.createElement('tbody');
  rows.forEach(r=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.t}</td><td>${fmt(r.P,2)}</td><td>${fmt(r.interest,2)}</td><td>${fmt(r.principal,2)}</td><td>${fmt(r.B,2)}</td>`;
    tb.appendChild(tr);
  });
  table.appendChild(tb);
  wrap.appendChild(table);
});
$("#btn-balance")?.addEventListener('click', ()=>{
  const L = Number($("#loan-L").value);
  const i = Number($("#loan-i").value)/100;
  const n = Number($("#loan-n").value);
  const t = Number($("#loan-t").value);
  const P = levelPayment(L,n,i);
  const prospective = P * a_n_i(n-t, i);
  const retrospective = L * Math.pow(1+i, t) - P * s_n_i(t, i);
  $("#bal-pro").textContent = fmt(prospective, 6);
  $("#bal-ret").textContent = fmt(retrospective, 6);
});

// Scene 5: bonds
function bondPrice(F, C, r, i, n){
  const a = a_n_i(n,i);
  return F*r*a + C*Math.pow(1+i,-n);
}
function makeBondTable(P0, F, r, i, n){
  const rows = [];
  let B = P0;
  for(let t=1;t<=n;t++){
    const interest = B*i;
    const coupon = F*r;
    const Bnext = B*(1+i) - coupon;
    rows.push({t, Bstart:B, interest, coupon, Bend:Bnext});
    B = Bnext;
  }
  return rows;
}
$("#btn-bond")?.addEventListener('click', ()=>{
  const F = Number($("#bond-F").value);
  const C = Number($("#bond-C").value);
  const r = Number($("#bond-r").value)/100;
  const i = Number($("#bond-i").value)/100;
  const n = Number($("#bond-n").value);
  const P = bondPrice(F, C, r, i, n);
  $("#bond-P").textContent = fmt(P, 6);
  if ($("#bond-sched").checked){
    const rows = makeBondTable(P, F, r, i, n);
    const wrap = $("#bond-table-wrap"); wrap.innerHTML='';
    const table = document.createElement('table');
    table.innerHTML = `<thead><tr><th>t</th><th>Book Start</th><th>Interest</th><th>Coupon</th><th>Book End</th></tr></thead>`;
    const tb = document.createElement('tbody');
    rows.forEach(rw=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${rw.t}</td><td>${fmt(rw.Bstart,2)}</td><td>${fmt(rw.interest,2)}</td><td>${fmt(rw.coupon,2)}</td><td>${fmt(rw.Bend,2)}</td>`;
      tb.appendChild(tr);
    });
    table.appendChild(tb); wrap.appendChild(table);
  } else {
    $("#bond-table-wrap").innerHTML='';
  }
});
$("#btn-bc")?.addEventListener('click', ()=>{
  const F = Number($("#bond-F").value);
  const r = Number($("#bond-r").value)/100;
  const n = Number($("#bond-n").value);
  const i = Number($("#bond-i").value)/100;
  const P = bondPrice(F, F, r, i, n); // base price (C=F)
  const days = Number($("#bc-days").value);
  const period = Number($("#bc-period").value);
  const coupon = F*r;
  const accrued = coupon * (days/period);
  const dirty = P + accrued;
  const clean = dirty - accrued;
  $("#bc-accrued").textContent = fmt(accrued, 6);
  $("#bc-dirty").textContent = fmt(dirty, 6);
  $("#bc-clean").textContent = fmt(clean, 6);
});

// Scene 6: duration/convexity
function priceFromCFs(CFs, i){ return CFs.reduce((acc,cf,t)=> acc + cf*Math.pow(1+i, -(t+1)), 0); }
function macaulayDuration(CFs, i){
  const P = priceFromCFs(CFs,i);
  let num=0;
  CFs.forEach((cf,idx)=>{ const t=idx+1; num += t * cf * Math.pow(1+i,-t); });
  return num / P;
}
function macaulayConvexity(CFs, i){
  const P = priceFromCFs(CFs,i);
  let num=0;
  CFs.forEach((cf,idx)=>{ const t=idx+1; num += t*(t+1) * cf * Math.pow(1+i,-(t+2)); });
  return num / P;
}
$("#btn-dur")?.addEventListener('click', ()=>{
  const CFs = parseCSVNums($("#dur-cf").value);
  const i = Number($("#dur-i").value)/100;
  const P = priceFromCFs(CFs, i);
  const Dmac = macaulayDuration(CFs, i);
  const Dmod = Dmac/(1+i);
  const Cmac = macaulayConvexity(CFs, i);
  const Cmod = Cmac/((1+i)**2);
  $("#dur-P").textContent = fmt(P, 6);
  $("#dur-mac").textContent = fmt(Dmac, 6);
  $("#dur-mod").textContent = fmt(Dmod, 6);
  $("#dur-cmac").textContent = fmt(Cmac, 6);
  $("#dur-cmod").textContent = fmt(Cmod, 6);
});

// Scene 7: term structure
const curveCanvas = $("#curve-canvas");
const cctx = curveCanvas ? curveCanvas.getContext('2d') : null;
function discountFactorFromSpot(s, t){ return Math.pow(1+s, -t); }
function forwardFromSpots(s_t, s_tp1, t){ return Math.pow( (Math.pow(1+s_tp1, t+1) / Math.pow(1+s_t, t)), 1) - 1; }
function parYieldFromDF(P0n, dfs){ return (1 - P0n)/dfs.reduce((a,b)=>a+b,0); }
function drawCurve(spots){
  if(!cctx) return;
  const W = curveCanvas.width, H = curveCanvas.height;
  cctx.clearRect(0,0,W,H);
  cctx.strokeStyle = "#334"; cctx.lineWidth = 1.2;
  cctx.beginPath(); cctx.moveTo(40,H-30); cctx.lineTo(W-10,H-30); cctx.moveTo(40,10); cctx.lineTo(40,H-30); cctx.stroke();
  const maxY = Math.max(5, Math.max(...spots)+1);
  const stepX = (W-60)/(spots.length-1 || 1);
  cctx.strokeStyle = "#7ee787"; cctx.lineWidth = 2;
  cctx.beginPath();
  spots.forEach((s,idx)=>{
    const x = 40 + idx*stepX;
    const y = (H-30) - (s/maxY)*(H-60);
    if(idx===0) cctx.moveTo(x,y); else cctx.lineTo(x,y);
    cctx.fillStyle = "#7ee787";
    cctx.beginPath(); cctx.arc(x,y,3,0,Math.PI*2); cctx.fill();
  });
  cctx.stroke();
  cctx.fillStyle = "#a8b3c5"; cctx.fillText("maturity (t)", W-90, H-10);
  cctx.fillText("spot %", 8, 18);
}
$("#btn-curve")?.addEventListener('click', ()=>{
  const sPct = parseCSVNums($("#spot-seq").value);
  const spots = sPct.map(x=>x/100);
  const n = spots.length;
  const dfs = spots.map((s,t)=> discountFactorFromSpot(s, t+1));
  const fwds = [];
  for(let t=0;t<n-1;t++){ fwds.push(forwardFromSpots(spots[t], spots[t+1], t)); }
  const par = parYieldFromDF(dfs[dfs.length-1], dfs);
  $("#df-list").textContent = dfs.map(x=>fmt(x,6)).join(', ');
  $("#fw-list").textContent = fwds.map(x=>toPct(x,4)).join(', ');
  $("#par-yield").textContent = toPct(par, 6);
  drawCurve(sPct);
});

// Scene 8: immunization
function portfolioMeasures(CFs, i){
  const P = priceFromCFs(CFs,i);
  const D = macaulayDuration(CFs,i);
  const C = macaulayConvexity(CFs,i);
  return {P,D,C};
}
$("#btn-imm")?.addEventListener('click', ()=>{
  const L = parseCSVNums($("#imm-L").value);
  const A = parseCSVNums($("#imm-A").value);
  const i = Number($("#imm-i").value)/100;
  const mL = portfolioMeasures(L,i);
  const mA = portfolioMeasures(A,i);
  $("#imm-pv").textContent = `${fmt(mA.P,6)} vs ${fmt(mL.P,6)}`;
  $("#imm-dur").textContent = `${fmt(mA.D,6)} vs ${fmt(mL.D,6)}`;
  $("#imm-conv").textContent = `${fmt(mA.C,6)} vs ${fmt(mL.C,6)}`;
  const cond1 = nearly(mA.P, mL.P, 1e-6);
  const cond2 = nearly(mA.D, mL.D, 1e-6);
  const cond3 = (mA.C > mL.C);
  $("#imm-res").textContent = cond1 && cond2 && cond3 ? "Yes — Redington satisfied" : `No — Conditions: [PV ${cond1?'✓':'✗'}] [Dur ${cond2?'✓':'✗'}] [Conv ${cond3?'✓':'✗'}]`;
});

// Scene 9: swaps
function parSwapRate(dfs, alphas){
  const denom = dfs.reduce((acc, df, idx)=> acc + (alphas[idx]||1)*df, 0);
  const P0 = 1; const Pn = dfs[dfs.length-1];
  return (P0 - Pn)/denom;
}
function priceSwap(dfs, alphas, S, N){
  const Sstar = parSwapRate(dfs, alphas);
  const fixedPV = S * dfs.reduce((acc,df,idx)=> acc + (alphas[idx]||1)*df, 0);
  const floatPV = 1 - dfs[dfs.length-1];
  const V = N * (fixedPV - floatPV);
  return {Sstar, V};
}
$("#btn-swap")?.addEventListener('click', ()=>{
  const dfs = parseCSVNums($("#swap-df").value);
  const alphas = parseCSVNums($("#swap-alpha").value);
  const S = Number($("#swap-S").value)/100;
  const N = Number($("#swap-N").value);
  const {Sstar, V} = priceSwap(dfs, alphas, S, N);
  $("#swap-Sstar").textContent = toPct(Sstar, 6);
  $("#swap-V").textContent = fmt(V, 2);
});

// Scene 10: odds & ends
$("#btn-od-perp")?.addEventListener('click', ()=>{
  const i = Number($("#od-i").value)/100;
  const m = Number($("#od-m").value);
  const v = 1/(1+i);
  const PV = Math.pow(v, m) * (1/i);
  $("#od-perp").textContent = fmt(PV, 6);
});
$("#btn-od-dv01")?.addEventListener('click', ()=>{
  const P = Number($("#od-P").value);
  const Dm = Number($("#od-D").value);
  const dv01 = 0.0001 * P * Dm;
  const ddur = -P * Dm;
  $("#od-dv01").textContent = fmt(dv01, 6);
  $("#od-ddur").textContent = fmt(ddur, 6);
});
$("#btn-irr")?.addEventListener('click', ()=>{
  const rets = parseCSVNums($("#tw-returns").value).map(x=>x/100);
  const twr = rets.reduce((acc,r)=> acc*(1+r), 1)-1;
  $("#tw-res").textContent = toPct(twr, 6);
  const cfs = parseCSVNums($("#irr-cf").value);
  let j = 0.1, it=0;
  function f(j){ return cfs.reduce((acc,cf,idx)=> acc + cf/Math.pow(1+j, idx), 0); }
  function fp(j){ return cfs.reduce((acc,cf,idx)=> acc - idx*cf/Math.pow(1+j, idx+1), 0); }
  while(it++<100){
    const val = f(j), der = fp(j);
    if(Math.abs(val) < 1e-9) break;
    j = j - val/der;
    if(!isFinite(j)) { j = 0.1; break; }
  }
  $("#irr-res").textContent = toPct(j, 6);
});

// ---------- Intro canvas (gentle) ----------
const introCanvas = $("#intro-canvas");
if (introCanvas){
  const ctx = introCanvas.getContext('2d');
  const W = introCanvas.width, H = introCanvas.height;
  const layers = [0.4, 0.7, 1.0];
  const bubbles = [];
  layers.forEach((depth)=>{
    for(let k=0;k<7;k++){
      bubbles.push({
        x: Math.random()*W,
        y: H+Math.random()*H/2,
        r: 6+Math.random()*10*depth,
        vx: (-0.25+Math.random()*0.5)*depth,
        vy: (-0.25 - Math.random()*0.55)*depth,
        hue: 170+Math.random()*120,
        depth
      });
    }
  });
  function draw(){
    ctx.clearRect(0,0,W,H);
    const g = ctx.createLinearGradient(0,0, W, H);
    g.addColorStop(0,'#0b0f27'); g.addColorStop(1,'#0f1637');
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
    bubbles.forEach(b=>{
      b.x+=b.vx; b.y+=b.vy;
      if(b.y < -20) { b.y=H+20; b.x=Math.random()*W; }
      if(b.x< -20) b.x=W+20; if(b.x>W+20) b.x=-20;
      ctx.beginPath();
      ctx.arc(b.x,b.y,b.r,0,Math.PI*2);
      ctx.fillStyle = `hsla(${b.hue},70%,60%,${0.35 + 0.55*b.depth})`;
      ctx.shadowBlur=16*b.depth; ctx.shadowColor=`hsla(${b.hue},70%,60%,0.45)`;
      ctx.fill(); ctx.shadowBlur=0;
    });
    requestAnimationFrame(draw);
  }
  draw();
}