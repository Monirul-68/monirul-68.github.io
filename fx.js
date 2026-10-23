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

// ===== v4: SVG icon set + accessible carousel (UI/UX Pro Max rules: no emoji icons, pause/prev/next, stop on hover/focus) =====
const IC={home:'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z|M9 22V12h6v10',book:'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z|M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',trophy:'M6 9H4.5a2.5 2.5 0 0 1 0-5H6|M18 9h1.5a2.5 2.5 0 0 0 0-5H18|M4 22h16|M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22|M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22|M18 2H6v7a6 6 0 0 0 12 0V2z',zap:'M13 2L3 14h9l-1 8 10-12h-9l1-8z',flame:'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z',file:'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z|M14 2v6h6|M16 13H8|M16 17H8',pen:'M12 20h9|M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',left:'M15 18l-6-6 6-6',right:'M9 18l6-6-6-6',pause:'M6 4h4v16H6z|M14 4h4v16h-4z',play:'M5 3l14 9-14 9V3z'};
const NS='http://www.w3.org/2000/svg';
const ico=n=>{const s=document.createElementNS(NS,'svg');for(const[k,v]of Object.entries({viewBox:'0 0 24 24','aria-hidden':'true',fill:'none',stroke:'currentColor','stroke-width':'2','stroke-linecap':'round','stroke-linejoin':'round'}))s.setAttribute(k,v);
 (IC[n]||'').split('|').forEach(d=>{const p=document.createElementNS(NS,'path');p.setAttribute('d',d);s.append(p)});return s};
document.querySelectorAll('[data-i]').forEach(e=>e.prepend(ico(e.dataset.i)));
const sl=document.getElementById('sl');
if(sl){const S=[['zap','Timed mock tests','Real exam pressure with an instant score and answer review.'],['pen','Long Q&A','Detailed answers for deep revision before the exam.'],['file','Easy notes','Short, readable guides for every class from 5 to 12.'],['flame','Daily streaks','Study a little every day and unlock new badges.'],['trophy','Leaderboard','See where you stand against other toppers.']];
 const mk=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
 const tr=mk('div','s-track'),dots=mk('div','s-dots'),ctl=mk('div','s-ctl'),pb=mk('button','s-b'),pv=mk('button','s-b'),nx=mk('button','s-b');
 let cur=0,paused=RM,hov=false,foc=false;
 sl.setAttribute('role','region');sl.setAttribute('aria-roledescription','carousel');sl.setAttribute('aria-label','Features');
 const go=i=>{cur=(i+S.length)%S.length;tr.scrollTo({left:cur*tr.clientWidth,behavior:RM?'auto':'smooth'})};
 S.forEach(([n,t,d],i)=>{const s=mk('div','s-slide'),a=mk('span','em'),b=mk('button');a.append(ico(n));s.setAttribute('role','group');s.setAttribute('aria-roledescription','slide');s.setAttribute('aria-label',`${i+1} of ${S.length}`);s.append(a,mk('h3','',t),mk('p','',d));tr.append(s);b.setAttribute('aria-label',`Go to slide ${i+1}`);b.onclick=()=>go(i);dots.append(b)});
 const lab=()=>{pb.replaceChildren(ico(paused?'play':'pause'));pb.setAttribute('aria-label',paused?'Start slideshow':'Pause slideshow');tr.setAttribute('aria-live',paused||hov||foc?'polite':'off')};
 pv.append(ico('left'));pv.setAttribute('aria-label','Previous slide');pv.onclick=()=>go(cur-1);nx.append(ico('right'));nx.setAttribute('aria-label','Next slide');nx.onclick=()=>go(cur+1);pb.onclick=()=>{paused=!paused;lab()};
 ctl.append(pv,pb,nx,dots);sl.append(tr,ctl);lab();
 tr.addEventListener('scroll',()=>{cur=Math.round(tr.scrollLeft/Math.max(1,tr.clientWidth));[...dots.children].forEach((b,i)=>{b.classList.toggle('on',i===cur);i===cur?b.setAttribute('aria-current','true'):b.removeAttribute('aria-current')})},{passive:true});tr.dispatchEvent(new Event('scroll'));
 sl.onpointerenter=()=>{hov=true;lab()};sl.onpointerleave=()=>{hov=false;lab()};sl.addEventListener('focusin',()=>{foc=true;lab()});sl.addEventListener('focusout',()=>{foc=false;lab()});
 sl.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')go(cur-1);if(e.key==='ArrowRight')go(cur+1)});
 setInterval(()=>{if(!paused&&!hov&&!foc&&!document.hidden&&!RM)go(cur+1)},4500)}
