// Visual effects only: network background, mouse spotlight, number count-up. No data access.
const RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
const c=document.createElement('canvas');c.id='fx';document.body.prepend(c);const g=c.getContext('2d');
let W,H,P=[];const m={x:-999,y:-999};
const size=()=>{W=c.width=innerWidth;H=c.height=innerHeight;P=Array.from({length:Math.min(80,Math.floor(W*H/18000))},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.4,vy:(Math.random()-.5)*.4}))};
size();addEventListener('resize',size);
addEventListener('pointermove',e=>{m.x=e.clientX;m.y=e.clientY;const t=e.target.closest?.('.card,.panel,.stat');if(t){const r=t.getBoundingClientRect();t.style.setProperty('--mx',e.clientX-r.left+'px');t.style.setProperty('--my',e.clientY-r.top+'px')}},{passive:true});
function frame(){g.clearRect(0,0,W,H);
 for(const p of P){if(!RM){p.x+=p.vx;p.y+=p.vy}if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;g.fillStyle='#00f2ffaa';g.fillRect(p.x,p.y,2,2)}
 for(let i=0;i<P.length;i++){for(let j=i+1;j<P.length;j++){const d=Math.hypot(P[i].x-P[j].x,P[i].y-P[j].y);if(d<130){g.strokeStyle=`rgba(139,92,246,${.35*(1-d/130)})`;g.beginPath();g.moveTo(P[i].x,P[i].y);g.lineTo(P[j].x,P[j].y);g.stroke()}}
  const d=Math.hypot(P[i].x-m.x,P[i].y-m.y);if(d<180){g.strokeStyle=`rgba(0,242,255,${.6*(1-d/180)})`;g.beginPath();g.moveTo(P[i].x,P[i].y);g.lineTo(m.x,m.y);g.stroke()}}
 if(!RM&&!document.hidden)requestAnimationFrame(frame)}
frame();document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!RM)frame()});

// Count-up for numbers inside .stat b whenever the app updates them
const count=el=>{const n=+el.textContent;if(RM||el.dataset.busy||!Number.isFinite(n)||el.dataset.v===String(n))return;
 el.dataset.v=n;el.dataset.busy=1;const t0=performance.now();
 (function s(t){const k=Math.min(1,(t-t0)/900);el.textContent=Math.round(n*(1-(1-k)**3));if(k<1)requestAnimationFrame(s);else delete el.dataset.busy})(t0)};
new MutationObserver(ms=>ms.forEach(x=>{const el=x.target.nodeType===3?x.target.parentElement:x.target;if(el?.matches?.('.stat b'))count(el)})).observe(document.body,{childList:true,subtree:true,characterData:true});

// ===== Scroll reveal, sticky navbar blur, smooth anchors (vanilla, no libraries) =====
const SEL='.card,.panel,.stat,.q,.lb,.day';
const io=new IntersectionObserver(es=>{let i=0;es.forEach(e=>{if(!e.isIntersecting)return;const el=e.target;el.style.transitionDelay=Math.min(i++,3)*.1+'s';el.classList.add('visible');io.unobserve(el);setTimeout(()=>{el.style.transitionDelay=''},900)})},{threshold:.12,rootMargin:'0px 0px -30px 0px'});
const one=el=>{if(el.classList.contains('animate-on-scroll'))return;el.classList.add('animate-on-scroll');RM?el.classList.add('visible'):io.observe(el)};
const tag=r=>{if(r.matches?.(SEL))one(r);r.querySelectorAll?.(SEL).forEach(one)};
tag(document.body);
new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>n.nodeType===1&&tag(n)))).observe(document.body,{childList:true,subtree:true});
const hd=document.querySelector('header'),sc=()=>hd?.classList.toggle('scrolled',scrollY>10);
addEventListener('scroll',sc,{passive:true});sc();
document.addEventListener('click',e=>{const a=e.target.closest?.('a[href^="#"]');const id=a?.getAttribute('href');if(id&&id.length>1){const t=document.querySelector(id);if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth'})}}});

// ===== Opening intro: plays once per browser tab session, never blocks the page =====
const it=document.getElementById('intro');
if(it){let seen=false;try{seen=sessionStorage.getItem('tkt_intro')}catch{}
 if(seen||RM){it.remove();document.body.classList.remove('intro-on')}
 else{try{sessionStorage.setItem('tkt_intro','1')}catch{}
  it.addEventListener('animationend',e=>{if(e.animationName==='introOut')it.remove()});
  setTimeout(()=>it.remove(),3500)}}

// ===== v2: cursor glow, 3D tilt, button ripple, rotating headline, CTA buttons =====
if(!RM&&matchMedia('(hover:hover)').matches){const cu=document.createElement('div');cu.id='cur';document.body.append(cu);
 addEventListener('pointermove',e=>{cu.style.transform=`translate(${e.clientX}px,${e.clientY}px)`;const t=e.target.closest?.('.tile,.stat,.badge,.card');if(!t)return;const r=t.getBoundingClientRect();
  t.style.setProperty('--rx',((e.clientY-r.top)/r.height-.5)*-9+'deg');t.style.setProperty('--ry',((e.clientX-r.left)/r.width-.5)*9+'deg');t.classList.add('tilt')},{passive:true});
 document.addEventListener('pointerout',e=>{const t=e.target.closest?.('.tilt');if(t&&!t.contains(e.relatedTarget))t.classList.remove('tilt')})}
document.addEventListener('pointerdown',e=>{const b=e.target.closest?.('.btn');if(!b||RM)return;const r=b.getBoundingClientRect(),s=Math.max(r.width,r.height),i=document.createElement('i');i.className='rip';
 i.style.cssText=`width:${s}px;height:${s}px;left:${e.clientX-r.left-s/2}px;top:${e.clientY-r.top-s/2}px`;b.append(i);setTimeout(()=>i.remove(),650)});
const rot=document.getElementById('rot');
if(rot&&!RM){const W=['with confidence','like a Topper','without stress','faster','every single day'];let k=0;setInterval(()=>{rot.classList.add('out');setTimeout(()=>{rot.textContent=W[++k%W.length];rot.classList.remove('out')},350)},2600)}
document.getElementById('cta')?.addEventListener('click',()=>document.querySelector('#nav [data-t=study]').click());
document.getElementById('cta2')?.addEventListener('click',()=>document.querySelector('#nav [data-t=board]').click());
