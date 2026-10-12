import {db,auth,provider,fs,au,h,$,put,safeUrl,CLASSES} from './lib.js';
const {collection,getDocs,getDoc,setDoc,addDoc,updateDoc,deleteDoc,doc,query,where,orderBy,limit,serverTimestamp,Timestamp,getCountFromServer}=fs;
// UI gate only. The REAL admin check is in firestore.rules (isAdmin()). Keep both emails identical.
const ADMIN='edit68ms@gmail.com';
let students=[],editing=null,qRows=[],editUid=null;
$('login').onclick=()=>au.signInWithPopup(auth,provider).catch(()=>$('gMsg').textContent='Sign-in failed.');
$('logout').onclick=()=>au.signOut(auth).then(()=>location.reload());
au.onAuthStateChanged(auth,u=>{if(u&&u.email===ADMIN&&u.emailVerified){$('gate').hidden=true;$('app').hidden=false;$('who').textContent=u.email;dash();return}
 if(u){$('gMsg').textContent='This account is not an admin.';au.signOut(auth)}});
$('tabs').querySelectorAll('button').forEach(b=>b.onclick=()=>{$('tabs').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));for(const s of['dash','stu','man','add','bdg'])$(s).hidden=s!==b.dataset.t;({dash,stu:loadStu,man:list,bdg:blist}[b.dataset.t]||(()=>{}))()});
for(const id of['cC','eC'])$(id).append(...CLASSES.map(c=>h('option',{value:c},'Class '+c)));
$('cT').onchange=()=>{const m=$('cT').value==='mock';$('mockA').hidden=!m;$('artA').hidden=m};

async function dash(){const n=async q=>(await getCountFromServer(q)).data().count;
 try{const since=Timestamp.fromMillis(Date.now()-3*60000);
 const[l,s,c,r]=await Promise.all([n(query(collection(db,'online_users'),where('lastSeen','>',since))),n(collection(db,'student_profiles')),n(collection(db,'contents')),n(collection(db,'results'))]);
 $('dLive').textContent=l;$('dStu').textContent=s;$('dCon').textContent=c;$('dRes').textContent=r}catch{}}

// Students: ban = a document at banned_users/{uid}; firestore.rules then blocks that user's writes.
async function loadStu(){const[s,b]=await Promise.all([getDocs(query(collection(db,'student_profiles'),limit(300))),getDocs(query(collection(db,'banned_users'),limit(300)))]);
 const bn=new Set(b.docs.map(d=>d.id));students=s.docs.map(d=>({uid:d.id,banned:bn.has(d.id),...d.data()}));rows()}
$('search').oninput=rows;
function rows(){const q=$('search').value.toLowerCase(),L=students.filter(s=>[s.name,s.school].some(v=>(v||'').toLowerCase().includes(q)));
 put($('rows'),L.length?L.map(s=>h('tr',{},h('td',{},s.name||'–'),h('td',{},s.class||''),h('td',{},s.school||''),h('td',{},s.phone||''),h('td',{},s.banned?'🚫 Banned':'Active'),
 h('td',{},h('div',{class:'row'},h('button',{class:'btn',on:{click:()=>edit(s)}},'Edit'),s.banned?h('button',{class:'btn',on:{click:()=>unban(s)}},'Unban'):h('button',{class:'btn bad',on:{click:()=>ban(s)}},'Ban'))))):h('tr',{},h('td',{colspan:6},'No students found.')))}
function edit(s){editUid=s.uid;$('eN').value=s.name||'';$('eC').value=s.class||'9';$('eS').value=s.school||'';$('eP').value=s.phone||'';$('eG').value=s.goal||'';$('eMsg').textContent='';$('eD').showModal()}
$('eClose').onclick=()=>$('eD').close();
$('eSave').onclick=async()=>{try{await updateDoc(doc(db,'student_profiles',editUid),{userId:editUid,name:$('eN').value.trim(),class:$('eC').value,school:$('eS').value.trim(),phone:$('eP').value.trim(),goal:$('eG').value.trim(),updatedAt:serverTimestamp()});$('eD').close();loadStu()}catch{$('eMsg').textContent='Could not save. Check the phone number format.'}};
async function ban(s){const r=prompt(`Ban ${s.name||'this student'}? Enter a reason:`,'Violation of rules');if(r===null||!confirm('Ban this student?'))return;
 await setDoc(doc(db,'banned_users',s.uid),{reason:r.slice(0,200),bannedAt:serverTimestamp()});loadStu()}
async function unban(s){if(confirm('Unban this student?')){await deleteDoc(doc(db,'banned_users',s.uid));loadStu()}}

// Content
async function list(){const f=await getDocs(query(collection(db,'contents'),orderBy('createdAt','desc'),limit(200)));
 put($('list'),f.empty?'No content yet.':f.docs.map(d=>{const c=d.data();return h('div',{class:'lb'},h('span',{},`Class ${c.class} · ${c.type} · ${c.title}`),h('div',{class:'row'},h('button',{class:'btn',on:{click:()=>load(d.id,c)}},'Edit'),h('button',{class:'btn bad',on:{click:async()=>{if(confirm('Delete this item?')){await deleteDoc(doc(db,'contents',d.id));list()}}}},'Delete')))}))}
function qRow(q={}){const r={q:h('textarea',{placeholder:'Question',maxlength:500}),o:['A','B','C','D'].map(l=>h('input',{placeholder:'Option '+l,maxlength:200})),a:h('select',{},...['A','B','C','D'].map(l=>h('option',{value:l},'Correct: '+l)))};
 r.q.value=q.question||'';r.o.forEach((e,i)=>e.value=q['ABCD'[i]]||'');r.a.value=q.ans||'A';
 r.el=h('div',{class:'panel q'},r.q,...r.o,r.a,h('button',{class:'btn bad',style:'margin-top:8px',on:{click:()=>{r.el.remove();qRows=qRows.filter(x=>x!==r)}}},'Remove'));qRows.push(r);$('qs').append(r.el)}
$('addQ').onclick=()=>qRow();
function load(id,c){editing=id;$('cC').value=c.class||'9';$('cT').value=c.type;$('cT').onchange();$('cN').value=c.title||'';$('cU').value=c.thumb||'';$('cB').value=c.content||'';$('cM').value=c.time||30;qRows=[];put($('qs'));(c.questions||[]).forEach(qRow);
 $('tabs').querySelectorAll('button')[3].click();$('pMsg').textContent='Editing: '+c.title}
$('pub').onclick=async()=>{const m=$('pMsg'),type=$('cT').value,title=$('cN').value.trim();m.className='msg';if(!title)return m.textContent='Add a title.';
 const d={type,title,class:$('cC').value,thumb:safeUrl($('cU').value.trim()),createdAt:serverTimestamp()};
 if(type==='mock'){d.questions=qRows.filter(r=>r.q.value.trim()).map(r=>({question:r.q.value.trim(),A:r.o[0].value,B:r.o[1].value,C:r.o[2].value,D:r.o[3].value,ans:r.a.value}));if(!d.questions.length)return m.textContent='Add at least one question.';d.time=Math.max(1,Math.min(180,+$('cM').value||30))}
 else d.content=$('cB').value;
 try{editing?await updateDoc(doc(db,'contents',editing),d):await addDoc(collection(db,'contents'),d);m.className='msg ok';m.textContent=editing?'Updated.':'Published.';editing=null}catch{m.textContent='Could not publish. Check that you are signed in as admin.'}};

// Badges (shown to students on the home page; see the badges rule in firestore.rules)
const RL={tests:'tests done ≥',xp:'XP ≥',streak:'day streak ≥',best:'best score % ≥',perfect:'perfect score'};
$('bR').onchange=()=>{const p=$('bR').value==='perfect';$('bV').hidden=p;$('bVL').hidden=p};
async function blist(){const f=await getDocs(query(collection(db,'badges'),limit(100)));
 put($('bList'),f.empty?'No custom badges yet.':f.docs.map(d=>{const b=d.data();return h('div',{class:'lb'},h('span',{},`${b.icon} ${b.name} · ${RL[b.rule]||b.rule}${b.rule==='perfect'?'':' '+b.value}`),h('button',{class:'btn bad',on:{click:async()=>{if(confirm('Delete this badge?')){await deleteDoc(doc(db,'badges',d.id));blist()}}}},'Delete'))}))}
$('bAdd').onclick=async()=>{const m=$('bMsg'),icon=$('bI').value.trim(),name=$('bN').value.trim(),rule=$('bR').value,value=rule==='perfect'?0:Math.max(0,Math.min(100000,parseInt($('bV').value,10)||0));m.className='msg';
 if(!icon||!name)return m.textContent='Add an emoji and a name.';
 try{await addDoc(collection(db,'badges'),{icon,name,desc:$('bD').value.trim(),rule,value,createdAt:serverTimestamp()});m.className='msg ok';m.textContent='Badge added.';['bI','bN','bD'].forEach(i=>$(i).value='');blist()}
 catch{m.textContent='Could not add. Publish the new Firestore rules first.'}};
