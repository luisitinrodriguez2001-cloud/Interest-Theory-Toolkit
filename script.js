/* Noir Edition app.js
   – No cursor bubble.
   – Letterbox + cut-to-scene transitions.
   – Rich typewriter (no raw HTML shows) + per-scene narration + formula spotlight.
   – Smooth magnetic hover.
   – All calculators wired.
*/

const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
const fmt = (x, p=2) => (isFinite(x) ? Number(x).toLocaleString(undefined, {maximumFractionDigits:p}) : '—');
const toPct = (x, p=2) => isFinite(x) ? (100*x).toFixed(p)+'%' : '—';
const nearly = (a,b,eps=1e-12)=>Math.abs(a-b)<eps;

/* =========================
   LETTERBOX CUT TRANSITIONS
   ========================= */
const body = document.body;
function cutToScene(id){
  body.classList.add('bars','cutting');
  setTimeout(()=>{ showScene(id, false); }, 180);
  setTimeout(()=>{ body.classList.remove('cutting'); }, 420);
  setTimeout(()=>{ body.classList.remove('bars'); }, 700);
}

/* ===============
   NAV + REVEAL
   =============== */
const navLinks = $$('.nav-link');
const scenes = $$('.scene');
function showScene(id, smooth=true){
  scenes.forEach(s=>s.classList.toggle('active', s.id===id));
  navLinks.forEach(btn=>btn.classList.toggle('active', btn.dataset.target===id));
  if(smooth) window.scrollTo({top:0, behavior:'smooth'});
  requestAnimationFrame(revealScan);
}
navLinks.forEach(btn=>btn.addEventListener('click', ()=> cutToScene(btn.dataset.target)));
$$('.next').forEach(btn=>btn.addEventListener('click', ()=> cutToScene(btn.dataset.next)));

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

/* =================
   SOURCES DRAWER
   ================= */
const sourcesDrawer = $("#sources");
$("#toggle-sources")?.addEventListener('click', ()=>sourcesDrawer.classList.add('active'));
$("#sources .close")?.addEventListener('click', ()=>sourcesDrawer.classList.remove('active'));
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

/* ==============================
   MAGNETIC HOVER (SMOOTH SPRING)
   ============================== */
const magnets = $$('.magnet');
const magState = new WeakMap();
magnets.forEach(el=>{
  const st = {tx:0, ty:0, x:0, y:0, raf:null};
  magState.set(el, st);
  const strength = 10;
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

/* ===========================================
   STORY ENGINE — RICH TYPEWRITER + SPOTLIGHT
   =========================================== */
const speedSlider = $("#type-speed");
const speedOut = $("#speed-readout");
let rate = 1.0;
if (speedSlider){
  const updateSpeed = ()=>{ rate = Number(speedSlider.value); speedOut.textContent = rate.toFixed(1)+'×'; };
  speedSlider.addEventListener('input', updateSpeed); updateSpeed();
}

/* Narration scripts */
const scripts = {
  "scene-intro": [
    "A cart, a kettle, and a ledger. <span class='cue'>Tonight</span>, Alex maps a route from street stand to storefront.",
    "Numbers don’t care about the rain. <span class='fx'>They care about time</span>—and time bends cash.",
    "Cue the math: rates, annuities, loans, bonds… each a scene in a longer film about risk and reward."
  ],
  "scene-1": [
    "The bank pitches <em>12% nominal, compounded monthly</em>. Alex hears static. What matters is <span class='fx'>effective i</span>.",
    "Use \\(i=(1+\\tfrac{j^{(m)}}{m})^{m}-1\\) to strip the sales gloss; compare apples to apples.",
    "For a generator decision, stack cashflows and solve an <span class='fx'>equation of value</span>: \\(PV=\\sum CF_t v^t\\)."
  ],
  "scene-2": [
    "The café oven lease is a level monthly payment. That’s a <span class='fx'>level annuity</span>.",
    "If payment starts now, it’s <em>due</em>: \\(\\ddot a_{\\overline{n}|i}=(1+i)a_{\\overline{n}|i}\\). Budget meets calendar.",
    "Continuous approximations whisper when cash trickles constantly: \\(\\bar a_{\\overline{n}|\\delta}=\\tfrac{1-e^{-\\delta n}}{\\delta}\\)."
  ],
  "scene-3": [
    "Tourists arrive each month—sales climb by a fixed step. That’s an <span class='fx'>arithmetic gradient</span>.",
    "Holiday hype? Revenues grow by a rate \\(g\\). That’s a <span class='fx'>geometric annuity</span>: \\(\\tfrac{1-(\\frac{1+g}{1+i})^n}{i-g}\\).",
    "Pricing seasonal promos now means discounting those uneven cashflows right."
  ],
  "scene-4": [
    "Renovation loan time. Payment is \\(P=\\tfrac{L}{a_{\\overline{n}|i}}\\).",
    "Twelve months in, Alex considers prepay. Two lenses: \\(B_t=P\\,a_{\\overline{n-t}|i}\\) and \\(B_t=L(1+i)^t-Ps_{\\overline{t}|i}\\).",
    "Same balance, different viewpoint—like two camera angles on one scene."
  ],
  "scene-5": [
    "Cash reserve shouldn’t nap. Short bonds pay coupons while beans get roasted.",
    "Price with \\(P=Fr a_{\\overline{n}|i}+Cv^n\\). Premium? Discount? Book value walks by \\(B_t=B_{t-1}(1+i)-Fr\\).",
    "Buy mid-period? Add accrued for dirty; clean subtracts it—credits roll, coupons cut."
  ],
  "scene-6": [
    "Rates can jump like jump-cuts. <span class='fx'>Duration</span> estimates sensitivity; <span class='fx'>convexity</span> tweaks the curve.",
    "Compute \\(D_m=\\frac{D}{1+i}\\) and \\(C_m=\\frac{C}{(1+i)^2}\\).",
    "Rough cut: \\(\\Delta P/P\\approx -D_m\\Delta i+\\tfrac12 C_m(\\Delta i)^2\\) to see how a scene change hits price."
  ],
  "scene-7": [
    "A supplier offers beans next year at a price tied to forwards. Build discounts: \\(P(0,t)=1/(1+s_t)^t\\).",
    "Imply forwards via \\(1+f_{t,t+1}=\\frac{(1+s_{t+1})^{t+1}}{(1+s_t)^t}\\).",
    "Par yield locks a fair coupon: \\(r_{par}=\\frac{1-P(0,n)}{\\sum P(0,t)}\\). Now Alex can haggle with a curve."
  ],
  "scene-8": [
    "Opening day rent is a fixed liability on a date. Immunize with assets that match at \\(i^*\\).",
    "Match <span class='fx'>PV</span>, match <span class='fx'>Macaulay D</span>, keep <span class='fx'>C_A>C_L</span>—local hedging against small rate shocks.",
    "It’s choreography: liabilities step left, assets step right, music stays on beat."
  ],
  "scene-9": [
    "The café’s floating-rate line makes Alex seasick. Swap waves for a calm fixed rate.",
    "Fair fixed: \\(S^*=\\tfrac{1-P(0,n)}{\\sum \\alpha_t P(0,t)}\\). Value the position with those same \\(P(0,t)\\).",
    "Now revenue can focus on flavor, not LIBOR, SOFR, or the buzzword du jour."
  ],
  "scene-10": [
    "A service contract begins later: a <span class='fx'>deferred perpetuity</span> \\(v^m/i\\).",
    "Quick risk read: DV01 \\(\\approx 0.0001\\,P\\,D_{mod}\\).",
    "Investments montage: time-weighted return vs IRR—performance vs path. Cut to credits."
  ]
};

function byId(id){ return $("#"+id); }
const narEls = {
  "scene-intro": byId("nar-scene-intro"),
  "scene-1": byId("nar-scene-1"),
  "scene-2": byId("nar-scene-2"),
  "scene-3": byId("nar-scene-3"),
  "scene-4": byId("nar-scene-4"),
  "scene-5": byId("nar-scene-5"),
  "scene-6": byId("nar-scene-6"),
  "scene-7": byId("nar-scene-7"),
  "scene-8": byId("nar-scene-8"),
  "scene-9": byId("nar-scene-9"),
  "scene-10": byId("nar-scene-10"),
};

let typing = { timer:null, scene:null, line:0, running:false };

/* Highlight the formula block that pairs with the current line */
function spotlightFor(sceneId, lineIdx){
  const scene = $("#"+sceneId);
  const maths = $$('.math', scene);
  maths.forEach(m => m.classList.remove('spotlight'));
  const el = maths[lineIdx] || maths[maths.length-1];
  if(el) el.classList.add('spotlight');
}

/* Tokenize a line into plain text + styled spans (<span class="cue|fx">, <em>) */
function tokenizeRich(line){
  const tokens = [];
  const regex = /<(span|em)\s*(?:class=['"](cue|fx)['"])?\s*>(.*?)<\/\1>/gis;
  let last = 0, m;
  while((m = regex.exec(line)) !== null){
    if(m.index > last){
      tokens.push({ type:'text', text: line.slice(last, m.index) });
    }
    const tag = m[1].toLowerCase();
    const cls = (m[2] || '').toLowerCase();
    const inner = m[3];
    if(tag === 'span' && (cls === 'cue' || cls === 'fx')){
      tokens.push({ type:'span', cls, text: inner });
    } else if(tag === 'em'){
      tokens.push({ type:'span', cls:'emph', text: inner });
    } else {
      tokens.push({ type:'text', text: m[0] }); // fallback
    }
    last = regex.lastIndex;
  }
  if(last < line.length){
    tokens.push({ type:'text', text: line.slice(last) });
  }
  return tokens;
}

/* Types a single line with styled spans (no raw tags shown) */
function typeRichLine(container, line, onDone){
  const tokens = tokenizeRich(line);
  const nodes = tokens.map(tok=>{
    const s = document.createElement('span');
    if(tok.type === 'span') s.className = tok.cls;
    s.textContent = ''; s.dataset.full = tok.text;
    container.appendChild(s);
    return { node:s, text: tok.text, i:0 };
  });

  function step(){
    for(let k=0;k<nodes.length;k++){
      const nk = nodes[k];
      if(nk.i < nk.text.length){
        nk.node.textContent += nk.text[nk.i++];
        setTimeout(step, Math.max(12, 26/rate));
        return;
      }
    }
    // finished line: typeset MathJax in this paragraph
    if(window.MathJax?.typesetPromise){
      MathJax.typesetPromise([container]).finally(()=> onDone && onDone());
    }else{
      onDone && onDone();
    }
  }
  step();
}

function playScene(sceneId){
  const lines = scripts[sceneId] || [];
  const box = narEls[sceneId];
  if(!box) return;

  // reset
  box.innerHTML = '';
  if(typing.timer) { clearTimeout(typing.timer); typing.timer = null; }
  typing = { timer:null, scene:sceneId, line:0, running:true };

  const nextLine = ()=>{
    if(typing.line >= lines.length){ typing.running=false; return; }
    const p = document.createElement('p');
    box.appendChild(p);
    spotlightFor(sceneId, typing.line);
    const raw = lines[typing.line];
    typeRichLine(p, raw, ()=>{
      typing.line++;
      typing.timer = setTimeout(nextLine, 550/rate);
    });
  };
  nextLine();
}

/* Play buttons */
$$('.play').forEach(btn=>{
  btn.addEventListener('click', ()=> playScene(btn.dataset.play));
});

/* ============================================
   FINANCIAL MATH HELPERS + CALCULATORS
   ============================================ */
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

/* Scene 1 — Rates & equation of value */
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

/* Scene 2 — Level annuities */
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

/* Scene 3 — Varying annuities */
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

/* Scene 4 — Loans */
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

/* Scene 5 — Bonds */
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
  const P = bondPrice(F, F, r, i, n);
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

/* Scene 6 — Duration & Convexity */
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

/* Scene 7 — Yield curve lab */
const curveCanvas = $("#curve-canvas");
const cctx = curveCanvas ? curveCanvas.getContext('2d') : null;
function discountFactorFromSpot(s, t){ return Math.pow(1+s, -t); }
function forwardFromSpots(s_t, s_tp1 /*, t*/){ return (Math.pow(1+s_tp1, 1) * Math.pow(1+s_t, 0)) * (Math.pow(1+s_tp1, 0) - 0) && (Math.pow(1+s_tp1, 1) / Math.pow(1+s_t, 1)) - 1; }
// Simpler: for yearly steps, f_{t,t+1} = (1+s_{t+1})^{t+1}/(1+s_t)^t - 1
function forwardsYearly(spots){
  const fwds = [];
  for(let t=0;t<spots.length-1;t++){
    fwds.push( Math.pow(1+spots[t+1], t+1) / Math.pow(1+spots[t], t) - 1 );
  }
  return fwds;
}
function parYieldFromDF(P0n, dfs){ return (1 - P0n)/dfs.reduce((a,b)=>a+b,0); }
function drawCurve(spotsPct){
  if(!cctx) return;
  const W = curveCanvas.width, H = curveCanvas.height;
  cctx.clearRect(0,0,W,H);
  cctx.strokeStyle = "#334"; cctx.lineWidth = 1.2;
  cctx.beginPath(); cctx.moveTo(40,H-30); cctx.lineTo(W-10,H-30); cctx.moveTo(40,10); cctx.lineTo(40,H-30); cctx.stroke();
  const maxY = Math.max(5, Math.max(...spotsPct)+1);
  const stepX = (W-60)/(spotsPct.length-1 || 1);
  cctx.strokeStyle = "#64ffda"; cctx.lineWidth = 2;
  cctx.beginPath();
  spotsPct.forEach((s,idx)=>{
    const x = 40 + idx*stepX;
    const y = (H-30) - (s/maxY)*(H-60);
    if(idx===0) cctx.moveTo(x,y); else cctx.lineTo(x,y);
    cctx.fillStyle = "#64ffda";
    cctx.beginPath(); cctx.arc(x,y,3,0,Math.PI*2); cctx.fill();
  });
  cctx.stroke();
  cctx.fillStyle = "#a8b3c5"; cctx.fillText("maturity (t)", W-90, H-10);
  cctx.fillText("spot %", 8, 18);
}
$("#btn-curve")?.addEventListener('click', ()=>{
  const sPct = parseCSVNums($("#spot-seq").value);
  const spots = sPct.map(x=>x/100);
  const dfs = spots.map((s,t)=> discountFactorFromSpot(s, t+1));
  const fwds = forwardsYearly(spots);
  const par = parYieldFromDF(dfs[dfs.length-1], dfs);
  $("#df-list").textContent = dfs.map(x=>fmt(x,6)).join(', ');
  $("#fw-list").textContent = fwds.map(x=>toPct(x,4)).join(', ');
  $("#par-yield").textContent = toPct(par, 6);
  drawCurve(sPct);
});

/* Scene 8 — Immunization */
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
  $("#imm-res").textContent = cond1 && cond2 && cond3 ? "Yes — Redington satisfied" : `No — [PV ${cond1?'✓':'✗'}] [Dur ${cond2?'✓':'✗'}] [Conv ${cond3?'✓':'✗'}]`;
});

/* Scene 9 — Swaps */
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

/* Scene 10 — Odds & ends */
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