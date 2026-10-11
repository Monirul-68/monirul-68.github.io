import {db,auth,fs,au,h,$,put,safeUrl,CLASSES} from './lib.js';
const {collection,getDocs,query,where,limit,setDoc,doc,serverTimestamp}=fs;
const TY={all:['📚','Everything'],mock:['⚡','Exams'],longqa:['📝','Long questions'],article:['📄','Articles']};
const P=new URLSearchParams(location.search);
let cls=CLASSES.includes(P.get('c'))?P.get('c'):'9',typ=TY[P.get('t')]?P.get('t'):'all',all=[],q='',sort='new',user=null,timer=null,bad=false;
// Ad slots: empty boxes now. Paste your ad code inside any .ad-slot later (see notes).
const ad=n=>h('div',{class:'ad-slot','data-slot':n},'Advertisement');
const mins=d=>d.questions?`${d.questions.length} questions · ${d.time} min`:`${Math.max(1,Math.ceil((d.content||'').split(/\s+/).length/200))} min read`;
const first=u=>(u.displayName||u.email.split('@')[0]).trim().split(/\s+/)[0].slice(0,40);
au.onAuthStateChanged(auth,u=>user=u);
addEventListener('scroll',()=>{const m=document.documentElement;$('prog').style.width=scrollY/Math.max(1,m.scrollHeight-innerHeight)*100+'%'},{passive:true});
$('cs').append(...CLASSES.map(c=>h('option',{value:c},'Class '+c)));$('cs').value=cls;
$('cs').onchange=e=>location.href=`?c=${e.target.value}&t=${typ}`;
$('qs').oninput=e=>{q=e.target.value.toLowerCase().trim();list()};
$('so').onchange=e=>{sort=e.target.value;list()};

function list(){const t=TY[typ];document.title=`Class ${cls} ${t[1]} · Topper Ki Tayari`;
 put($('crumbs'),`Class ${cls} › `,h('b',{},t[1]));put($('pt'),`Class ${cls} `,h('em',{},t[1]));
 put($('pills'),Object.entries(TY).map(([k,[e,l]])=>h('button',{class:'btn'+(k===typ?' on':''),on:{click:()=>{typ=k;history.replaceState(null,'',`?c=${cls}&t=${k}`);list()}}},`${e} ${l}`)));
 const L=all.filter(d=>(typ==='all'||d.type===typ)&&(d.title||'').toLowerCase().includes(q));
 L.sort((a,b)=>sort==='az'?(a.title||'').localeCompare(b.title||''):((b.createdAt?.seconds||0)-(a.createdAt?.seconds||0))*(sort==='old'?-1:1));
 const out=[];L.forEach((d,i)=>{out.push(card(d));if((i+1)%6===0)out.push(ad('feed'))});
 put($('sg'),L.length?out:h('div',{class:'empty'},bad?'Could not load content. Check your internet and refresh.':q?'No match. Try another word.':'Nothing here yet. Check back soon!'))}
function card(d){const u=safeUrl(d.thumb),t=TY[d.type]||['',''];
 return h('button',{class:'card',on:{click:()=>{location.hash=encodeURIComponent(d.id)}}},u?h('img',{src:u,alt:'',loading:'lazy',referrerpolicy:'no-referrer'}):h('div',{class:'ph'}),
  h('div',{class:'bd'},h('div',{class:'tag'},`${t[0]} ${t[1]}`),h('h3',{},d.title||'Untitled'),h('span',{class:'note'},mins(d))))}

function item(d){const t=TY[d.type]||['',''],v=$('itemV');document.title=(d.title||'Study')+' · Topper Ki Tayari';put($('crumbs'),`Class ${cls} › `,h('b',{},t[1]));
 const head=[h('button',{class:'btn',on:{click:()=>{location.hash=''}}},'← Back to list'),h('h1',{style:'margin-top:16px'},d.title||''),h('p',{class:'meta'},`${t[1]} · Class ${cls} · ${mins(d)}`),ad('top2')];
 if(d.type!=='mock')return put(v,head,h('div',{class:'read panel'},d.content||''),ad('end'));
 let ans={},done=false,s=Math.max(1,Math.min(180,+d.time||30))*60;const tm=$('tm'),total=(d.questions||[]).length;
 const qs=(d.questions||[]).map((x,i)=>h('div',{class:'panel q'},h('b',{class:'tag'},'Question '+(i+1)),h('p',{style:'margin:8px 0;font-weight:600'},x.question),
  ...['A','B','C','D'].map(k=>h('button',{class:'opt','data-k':k,on:{click:e=>{if(done)return;ans[i]=k;e.currentTarget.parentElement.querySelectorAll('.opt').forEach(o=>o.classList.toggle('sel',o===e.currentTarget))}}},x[k]))));
 const res=h('div',{class:'panel',hidden:'hidden'}),sub=h('button',{class:'btn go',on:{click:finish}},'Submit test');
 async function finish(){if(done)return;done=true;clearInterval(timer);sub.disabled=true;tm.hidden=true;
  const score=d.questions.filter((x,i)=>ans[i]===x.ans).length;
  qs.forEach((p,i)=>p.querySelectorAll('.opt').forEach(o=>{o.disabled=true;if(o.dataset.k===d.questions[i].ans)o.classList.add('ok');else if(o.dataset.k===ans[i])o.classList.add('bad')}));
  put(res,h('div',{class:'score'},`${score}/${total}`),h('p',{class:'note'},`${Math.round(score/Math.max(total,1)*100)}% correct. Green is the right answer, red is your wrong pick.`));res.hidden=false;res.scrollIntoView({behavior:'smooth',block:'center'});
  if(!user)return res.append(h('p',{class:'note'},'Log in on the home page to save your score.'));
  try{await setDoc(doc(db,'results',`${user.uid}_${d.id}`),{userId:user.uid,name:first(user),testId:d.id,testTitle:String(d.title||'').slice(0,120),score,total,date:serverTimestamp()});res.append(h('p',{class:'msg ok'},`Saved! +${score*10} XP`))}
  catch{res.append(h('p',{class:'note'},'Only your first attempt on each test is saved.'))}}
 put(v,head,qs,h('div',{class:'row',style:'margin-top:16px'},sub),res,ad('end'));
 const tick=()=>{tm.textContent=`⏱ ${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;if(s--<=0)finish()};tm.hidden=false;tick();timer=setInterval(tick,1000)}

function route(){clearInterval(timer);$('tm').hidden=true;const id=decodeURIComponent(location.hash.slice(1)),d=all.find(x=>x.id===id);
 $('listV').hidden=!!d;$('itemV').hidden=!d;scrollTo(0,0);d?item(d):list()}
addEventListener('hashchange',route);
put($('sg'),h('div',{class:'skeleton'}),h('div',{class:'skeleton'}),h('div',{class:'skeleton'}));
// Load everything, then match the class in code (same rule as the home page tiles: a missing class counts as 9, numbers and text both match)
getDocs(query(collection(db,'contents'),limit(300))).then(s=>all=s.docs.map(d=>({id:d.id,...d.data()})).filter(d=>String(d.class||'9')===cls)).catch(()=>{all=[];bad=true}).finally(route);
