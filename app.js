import {db,auth,provider,fs,au,h,$,put,safeUrl,CLASSES,authErr} from './lib.js';
const {collection,getDocs,getDoc,setDoc,doc,query,where,orderBy,limit,serverTimestamp}=fs;
let user=null,all=[],cls=null,typ='all',mock=null,ans={},timer=null,done=false,fails=0,lockUntil=0,pres=null;
const first=s=>(s||'Student').trim().split(/\s+/)[0].slice(0,40);

// Tabs
document.querySelectorAll('#nav button').forEach(b=>b.onclick=()=>tab(b.dataset.t));
function tab(t){document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));for(const s of['home','study','board'])$(s).hidden=s!==t;if(t==='board')board();if(t==='study')back();scrollTo(0,0)}

// Content
async function load(){put($('grid'),h('div',{class:'skeleton'}),h('div',{class:'skeleton'}),h('div',{class:'skeleton'}));
 try{const s=await getDocs(query(collection(db,'contents'),orderBy('createdAt','desc'),limit(150)));all=s.docs.map(d=>({id:d.id,...d.data()}));
 $('sCh').textContent=all.length;$('sQ').textContent=all.reduce((a,b)=>a+(b.questions?.length||0),0);}catch{all=[]}
 grid()}
$('classes').append(...CLASSES.map(c=>h('button',{class:'card',on:{click:()=>{cls=c;typ='all';$('chooser').hidden=true;$('area').hidden=false;$('clsLabel').textContent='Class '+c;grid()}}},'Class '+c)));
$('pc').append(...CLASSES.map(c=>h('option',{value:c},'Class '+c)));
const FT=[['all','All'],['mock','⚡ Tests'],['longqa','📝 Q&A'],['article','📄 Articles']];
function back(){cls=null;$('chooser').hidden=false;$('area').hidden=true}
$('back').onclick=back;
const TT=[['mock','⚡','Exams','Timed mock tests with instant score and answer review'],['longqa','📝','Long questions','Detailed Q&A for deep revision'],['article','📄','Articles','Notes and guides that are easy to read'],['all','📚','Everything','All content for this class']];
function grid(){put($('filters'));if(!cls)return put($('grid'));
 put($('grid'),TT.map(([k,e,l,s])=>{const n=all.filter(d=>String(d.class||'9')===cls&&(k==='all'||d.type===k)).length;
  return h('a',{class:'card tile',href:`study.html?c=${cls}&t=${k}`},h('span',{class:'em'},e),h('h3',{},l),h('p',{class:'note'},s),h('b',{class:'tag'},`${n} item${n===1?'':'s'}`))}))}

// Reader / test
function open(d){if(d.type!=='mock'){$('rTitle').textContent=d.title||'';$('rBody').textContent=d.content||'';return $('readD').showModal()}
 mock=d;ans={};done=false;$('tTitle').textContent=d.title||'';$('tRes').hidden=true;$('tSubmit').disabled=false;
 put($('tQs'),(d.questions||[]).map((q,i)=>h('div',{class:'panel q'},h('b',{class:'tag'},'Question '+(i+1)),h('p',{style:'margin:8px 0;font-weight:600'},q.question),
 ...['A','B','C','D'].map(k=>h('button',{class:'opt','data-k':k,on:{click:e=>{ans[i]=k;e.currentTarget.parentElement.querySelectorAll('.opt').forEach(o=>o.classList.toggle('sel',o===e.currentTarget))}}},q[k])))));
 let t=Math.max(1,Math.min(180,+d.time||30))*60;clearInterval(timer);const tick=()=>{$('tTimer').textContent=`⏱ ${Math.floor(t/60)}:${String(t%60).padStart(2,'0')}`;if(t--<=0)submit()};tick();timer=setInterval(tick,1000);$('testD').showModal()}
async function submit(){if(done)return;done=true;clearInterval(timer);$('tSubmit').disabled=true;
 const total=mock.questions.length,score=mock.questions.filter((q,i)=>ans[i]===q.ans).length,r=$('tRes');r.hidden=false;
 put(r,h('h2',{class:'tag'},`${score}/${total}`),h('p',{class:'note'},'Your score'));
 if(!user)return r.append(h('p',{class:'note'},'Log in to save XP and appear on the leaderboard.'));
 try{await setDoc(doc(db,'results',`${user.uid}_${mock.id}`),{userId:user.uid,name:first(user.displayName||user.email.split('@')[0]),testId:mock.id,testTitle:String(mock.title||'').slice(0,120),score,total,date:serverTimestamp()});r.append(h('p',{class:'msg ok'},`Saved! +${score*10} XP`));xp()}
 catch{r.append(h('p',{class:'note'},'Score not saved. Your first attempt on each test is the one that counts.'))}}
$('tSubmit').onclick=submit;$('tClose').onclick=()=>{clearInterval(timer);$('testD').close()};$('rClose').onclick=()=>$('readD').close();

// Leaderboard & XP
async function board(){if(!user)return put($('lb'),'Log in to see the leaderboard.');
 try{const s=await getDocs(query(collection(db,'results'),orderBy('score','desc'),limit(15)));let i=0;
 put($('lb'),s.empty?'No scores yet.':s.docs.map(d=>{const r=d.data(),m=['🥇','🥈','🥉'][i]||'#'+(i+1);i++;return h('div',{class:'lb'},h('span',{},`${m} ${r.name||'Student'} · ${r.testTitle||''}`),h('b',{class:'tag'},`${r.score}/${r.total}`))}))}catch{put($('lb'),'Could not load scores.')}}
async function xp(){if(!user)return;try{const s=await getDocs(query(collection(db,'results'),where('userId','==',user.uid)));let x=0,p=false;s.forEach(d=>{const r=d.data();x+=(r.score||0)*10;if(r.total&&r.score===r.total)p=true});stats={x,n:s.size,perfect:p};$('sXP').textContent=x;paint()}catch{}}

// ===== Motivation: level, streak, badges, daily tip, continue card =====
let streak=0,stats={x:0,n:0,perfect:false};
const LV=[[0,'🌱','Beginner'],[100,'📘','Learner'],[300,'⭐','Achiever'],[600,'🎓','Scholar'],[1000,'🏆','Champion'],[2000,'👑','Topper']];
const BD=[['🚀','First test',s=>s.n>=1],['📚','5 tests done',s=>s.n>=5],['💯','Perfect score',s=>s.perfect],['⚡','500 XP',s=>s.x>=500],['🔥','3-day streak',()=>streak>=3],['🌟','7-day streak',()=>streak>=7]];
const TIPS=['Study in 25-minute focus blocks, then take a 5-minute break.','Revise yesterday\'s topic for 10 minutes before starting a new one.','One mock test teaches more than reading three chapters passively.','Sleep well. Your brain stores what you learned while you rest.','Write answers by hand once a week to improve speed and memory.','Start with your weakest subject while your mind is fresh.','Small progress every day beats one big push each month.','Explain a topic aloud as if teaching a friend. Gaps show up fast.','Keep your phone away and a water bottle close while studying.','Review your wrong answers. That is where your marks are hiding.'];
function paint(){if(!$('lvName'))return;const x=stats.x;let i=0;LV.forEach((l,k)=>{if(x>=l[0])i=k});const cur=LV[i],nx=LV[i+1];
 $('lvName').textContent=`${cur[1]} ${cur[2]}`;$('xpFill').style.width=(nx?Math.round((x-cur[0])/(nx[0]-cur[0])*100):100)+'%';
 $('lvNote').textContent=nx?`${nx[0]-x} XP to reach ${nx[1]} ${nx[2]}. Every correct answer gives 10 XP.`:'Top level reached. You are a Topper!';
 $('stk').textContent=`🔥 ${streak} day streak`;
 put($('badges'),BD.map(([e,n,f])=>h('div',{class:'badge'+(f(stats)?' on':'')},h('span',{},e),h('small',{},n))))}
$('tip').textContent=TIPS[Math.floor(Date.now()/864e5)%TIPS.length];
try{const l=JSON.parse(localStorage.getItem('tkt_last')||'null');if(l&&CLASSES.includes(l.c)&&['mock','longqa','article'].includes(l.t)&&typeof l.id==='string'&&typeof l.title==='string')
 put($('cont'),h('a',{class:'card tile cont',href:`study.html?c=${l.c}&t=${l.t}#${encodeURIComponent(l.id)}`},h('b',{class:'tag'},'▶ Continue where you left off'),h('h3',{},l.title.slice(0,120))))}catch{}
paint();

// Weekly streak (stored only in this browser)
(function(){const K='tkt_streak',ds=d=>d.toLocaleDateString('en-CA');let v=[];try{v=JSON.parse(localStorage.getItem(K)||'[]')}catch{}
 const t=ds(new Date());if(!v.includes(t)){v.push(t);v=v.slice(-60);try{localStorage.setItem(K,JSON.stringify(v))}catch{}}
 const n=new Date(),mon=new Date(n);mon.setDate(n.getDate()-((n.getDay()+6)%7));let c=0;
 put($('week'),[...'MTWTFSS'].map((l,i)=>{const d=new Date(mon);d.setDate(mon.getDate()+i);const on=v.includes(ds(d));c+=on;return h('div',{class:'day'+(on?' done':'')},on?'🔥':l)}));
 let k=0,d0=new Date();while(v.includes(ds(d0))){k++;d0.setDate(d0.getDate()-1)}streak=k;$('wText').textContent=`${c} of 7 days completed`;$('sStreak').textContent=c;paint()})();

// Auth
$('authBtn').onclick=()=>user?au.signOut(auth).then(()=>location.reload()):$('authD').showModal();
$('aClose').onclick=()=>$('authD').close();
const msg=(t,ok)=>{$('aMsg').textContent=t;$('aMsg').className='msg'+(ok?' ok':'')};
async function guard(fn){if(Date.now()<lockUntil)return msg('Too many attempts. Wait 30 seconds.');
 const e=$('em').value.trim(),p=$('pw').value;if(!e||p.length<8)return msg('Enter your email and a password of 8+ characters.');
 try{await fn(e,p);$('authD').close();$('pw').value=''}catch(x){if(++fails>=5){lockUntil=Date.now()+30000;fails=0}msg(authErr(x))}}
$('doLogin').onclick=()=>guard((e,p)=>au.signInWithEmailAndPassword(auth,e,p));
$('doSignup').onclick=()=>guard((e,p)=>au.createUserWithEmailAndPassword(auth,e,p));
$('doGoogle').onclick=async()=>{try{await au.signInWithPopup(auth,provider);$('authD').close()}catch(x){msg(authErr(x))}};
$('doReset').onclick=async()=>{const e=$('em').value.trim();if(!e)return msg('Enter your email first.');try{await au.sendPasswordResetEmail(auth,e)}catch{}msg('If this email is registered, a reset link is on its way.',1)};

// Profile (document id = user id, so nobody else can read or overwrite it)
$('me').onclick=async()=>{$('pMsg').textContent='';$('profD').showModal();if(!user)return;try{const s=await getDoc(doc(db,'student_profiles',user.uid));if(s.exists()){const p=s.data();$('pn').value=p.name||'';$('pc').value=p.class||'9';$('ps').value=p.school||'';$('pp').value=p.phone||'';$('pg').value=p.goal||''}}catch{}};
$('profClose').onclick=()=>$('profD').close();
$('saveProf').onclick=async()=>{const m=$('pMsg'),name=$('pn').value.trim(),phone=$('pp').value.trim();m.className='msg';
 if(!user)return m.textContent='Log in first.';if(!name)return m.textContent='Name is required.';if(phone&&!/^[0-9+ ]{7,15}$/.test(phone))return m.textContent='Enter a valid phone number.';
 try{await setDoc(doc(db,'student_profiles',user.uid),{userId:user.uid,name,class:$('pc').value,school:$('ps').value.trim(),phone,goal:$('pg').value.trim(),updatedAt:serverTimestamp()});
 m.className='msg ok';m.textContent='Saved.';show({name,class:$('pc').value,school:$('ps').value.trim()});setTimeout(()=>$('profD').close(),700)}catch{m.textContent='Could not save. Check your details and try again.'}};
function show(p){$('uName').textContent=p.name||user.displayName||user.email.split('@')[0];$('uSub').textContent=`Class ${p.class||'9'}${p.school?' · '+p.school:''}`}

async function banned(u){try{const s=await getDoc(doc(db,'banned_users',u.uid));if(!s.exists())return false;
 document.body.replaceChildren(h('div',{class:'panel',style:'max-width:420px;margin:12vh auto;text-align:center'},h('h2',{},'Account suspended'),h('p',{class:'note',style:'margin:10px 0'},'Reason: '+String(s.data().reason||'Not provided').slice(0,200)),h('p',{class:'note'},'If this is a mistake, contact the site admin.'),h('button',{class:'btn',style:'margin-top:16px',on:{click:()=>au.signOut(auth).then(()=>location.reload())}},'Log out')));return true}catch{return false}}
au.onAuthStateChanged(auth,async u=>{user=u;clearInterval(pres);
 if(!u){$('authBtn').textContent='Log in';$('hi').textContent='student';$('uName').textContent='Guest';$('uSub').textContent='Log in to save progress';return}
 if(await banned(u))return;
 $('authBtn').textContent='Log out';$('hi').textContent=first(u.displayName||u.email.split('@')[0]);show({});xp();
 try{const s=await getDoc(doc(db,'student_profiles',u.uid));if(s.exists())show(s.data())}catch{}
 const ping=()=>document.visibilityState==='visible'&&setDoc(doc(db,'online_users',u.uid),{lastSeen:serverTimestamp()}).catch(()=>{});ping();pres=setInterval(ping,120000)});
load();
