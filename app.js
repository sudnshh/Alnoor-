/* MedStudentsHub — shared clinical platform. UI intentionally preserves original Gemini design. */
'use strict';
const $ = id => document.getElementById(id);
const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons = () => { if (window.lucide?.createIcons) window.lucide.createIcons(); };
const dateLabel = value => { try { return new Date(value).toLocaleDateString('ar-IQ', {day:'numeric',month:'short',year:'numeric'}); } catch {return '';} };
let toastTimer;
function toast(text) {const el=$('toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3800);}
async function api(route,options={}) {
  const result=await fetch(`/api${route}`,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});
  let data;try { data=await result.json(); } catch {throw new Error('تعذّر الاتصال بالخادم');}
  if(!result.ok)throw new Error(data.error||`خطأ ${result.status}`);
  return data;
}
const post=(path,data={})=>api(path,{method:'POST',body:JSON.stringify(data)});
const put=(path,data)=>api(path,{method:'PUT',body:JSON.stringify(data)});
const state={user:null,cases:[],groups:[],view:'feed',dept:'all',selectedGroup:null,reader:null,readerPage:0,authMode:'login'};
function mustLogin() {if(state.user)return true;openAuth();toast('سجّل الدخول للمشاركة في المنصة');return false;}
function showModal(id){$(id).classList.add('open');icons();}
function closeModal(id){$(id).classList.remove('open');}
function updateProfileDisplay() {
  const u=state.user;
  $('navUserName').textContent=u?.name||'زائر';
  $('userAvatar').textContent=(u?.name||'ط')[0];
  $('authBtn').textContent=u?'تسجيل الخروج':'تسجيل الدخول';
  $('adminDashboardLink').hidden=!u?.isAdmin;
  $('profileBtn').title=u?'الملف الشخصي':'سجّل الدخول';
  $('editFullName').value=u?.name||'';$('editUniversity').value=u?.university||'';
  $('editCountry').value=u?.country||'';$('editGrade').value=u?.grade||'';
}
function openAuth(){setAuthMode('login');$('authError').textContent='';showModal('authModal');}
function setAuthMode(mode){
  state.authMode=mode;
  $('authTitle').textContent=mode==='register'?'إنشاء حساب طالب':'دخول الطلاب إلى MedStudentsHub';
  $('authNameWrap').hidden=mode!=='register';
  $('authName').required=mode==='register';
  $('authPassword').autocomplete=mode==='login'?'current-password':'new-password';
  $('submitAuthBtn').textContent=mode==='register'?'إنشاء الحساب':'تسجيل الدخول';
  $('switchAuthMode').textContent=mode==='register'?'لديك حساب؟ تسجيل الدخول':'ليس لديك حساب؟ إنشاء حساب';
  $('authError').textContent='';
}
async function authSubmit(event){
  event.preventDefault();
  const b={email:$('authEmail').value.trim(),password:$('authPassword').value};
  if(state.authMode==='register') b.name=$('authName').value.trim();
  const btn=$('submitAuthBtn');btn.disabled=true;
  try{
    const r=await post(state.authMode==='register'?'/register':'/login',b);
    state.user=r.user;updateProfileDisplay();closeModal('authModal');$('authPassword').value='';
    await Promise.all([loadGroups(),loadCases()]);toast('أهلاً بك في MedStudentsHub');
  }catch(e){ $('authError').textContent=e.message; }
  finally{btn.disabled=false;}
}
async function logout(){
  try {await post('/logout');state.user=null;state.view='feed';state.selectedGroup=null;updateProfileDisplay();
    await Promise.all([loadGroups(),loadCases()]);showView('feed');toast('تم تسجيل الخروج');}
  catch(e){toast(e.message);}
}
async function loadGroups(){const r=await api('/groups');state.groups=r.groups;renderGroups();updateGroupSelect();}
async function loadCases(){const r=await api('/cases');state.cases=r.cases;renderCases();}
function showView(view,groupId=null){
  state.view=view;state.selectedGroup=groupId;
  $('mainFeedView').classList.toggle('hidden-view',view==='groups');
  $('groupsView').classList.toggle('hidden-view',view!=='groups');
  $('tabFeed').classList.toggle('active',view==='feed'||view==='group');
  $('tabSaved').classList.toggle('active',view==='saved');
  $('tabGroups').classList.toggle('active',view==='groups');
  if(view==='feed'){state.dept='all';$('searchInput').value='';syncFilters();}
  if(view==='group'){
    $('searchInput').value='';state.dept='all';syncFilters();
    const g=state.groups.find(x=>x.id===groupId);toast(`تصفح حالات: ${g?.name||'المجموعة'}`);
  }
  renderCases();
}
function syncFilters(){document.querySelectorAll('.filter-pill').forEach(p=>p.classList.toggle('active',p.dataset.dept===state.dept));}
function renderCases(){
  const target=$('casesContainer');target.replaceChildren();
  const q=$('searchInput').value.trim().toLowerCase();
  const filtered=state.cases.filter(c=>(state.view!=='saved'||c.isSaved)
    &&(state.view!=='group'||c.groupId===state.selectedGroup)
    &&(state.dept==='all'||c.dept===state.dept)
    &&(!q||[c.title,c.pearl,c.hospital,c.dept].join(' ').toLowerCase().includes(q)));
  if(!filtered.length){target.innerHTML=`<div class="no-results" style="grid-column:1/-1;text-align:center;padding:40px;background:white;border-radius:16px;color:#64748b">
    <p style="font-weight:700">لا توجد حالات مطابقة</p><p>جرّب البحث عن حالة أخرى أو غيّر التخصص.</p></div>`;return;}
  for(const c of filtered){
    const card=document.createElement('div');card.className='case-card';
    const hasImage=Boolean(c.canvasPages?.length && c.canvasPages[0]);
    const exam=c.examSummary||{};
    const examLines=Array.isArray(exam.hpi)?exam.hpi.slice(0,3).map(t=>`<div>${safe(t)}</div>`).join(''):'';
    const preview=hasImage?`<img class="sheet-img-preview" alt="صفحة مكتوبة باليد" src="${c.canvasPages[0]}">`:
      `<div class="sheet-header-text">CLINICAL HISTORY &amp; PHYSICAL EXAM</div><div class="sheet-preview-content">
      <div>• ${safe(exam.patient||'حالة سريرية')}</div><div>• ${safe(exam.cc||'')}</div>
      <div class="row-indent">${examLines}</div><div>• ${safe(exam.pmh||'')}</div></div>`;
    card.innerHTML=`<div class="sheet-thumbnail" tabindex="0" role="button" aria-label="اقرأ الحالة">
      <div class="sheet-badge-row"><span class="sheet-pill pill-dept">${safe(c.dept)}</span><span class="sheet-pill pill-pages">${c.pagesCount} صفحات</span></div>
      ${preview}<span class="handwritten-badge"><i data-lucide="${hasImage?'pen-tool':'book-open'}"></i>${hasImage?'مكتوبة باليد':'حالة تعليمية'}</span>
      </div><div class="card-content" tabindex="0" role="button">
      <div class="card-meta-top"><span class="university-name">${safe(c.hospital)}</span><span>${dateLabel(c.time)}</span></div>
      <h3 class="case-card-title">${safe(c.title)}</h3><div class="clinical-pearl-quote"><span class="pearl-quote-icon">“</span>${safe(c.pearl)}</div></div>
      <div class="card-footer">
      <button class="card-action-btn ${c.isLiked?'liked':''}" data-action="like"><i data-lucide="heart"></i><span>${c.likes}</span></button>
      <button class="card-action-btn" data-action="read"><i data-lucide="message-square"></i><span>${c.commentsCount} مناقشة</span></button>
      <button class="card-action-btn ${c.isSaved?'saved':''}" data-action="bookmark"><i data-lucide="bookmark"></i><span>${c.isSaved?'محفوظة':'حفظ'}</span></button></div>`;
    card.querySelectorAll('.sheet-thumbnail,.card-content').forEach(el=>{
      el.addEventListener('click',()=>openReader(c.id));
      el.addEventListener('keydown',e=>{if(e.key==='Enter')openReader(c.id);});
    });
    card.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('click',()=>{
      if(btn.dataset.action==='read')openReader(c.id);
      else toggleReaction(c.id,btn.dataset.action);
    }));
    target.appendChild(card);
  }
  icons();
}
async function toggleReaction(id,which){
  if(!mustLogin())return;
  try{await post(`/cases/${id}/${which}`);await loadCases();}
  catch(e){toast(e.message);}
}
function renderGroups(){
  const container=$('groupsContainer');container.replaceChildren();
  for(const g of state.groups){
    const el=document.createElement('div');el.className='group-card';
    el.innerHTML=`<div class="group-header"><div class="group-avatar" style="background:${/^#[a-fA-F0-9]{6}$/.test(g.color)?g.color:'#0f766e'}">${safe(g.initials)}</div>
      <div><h3>${safe(g.name)}</h3><p>${safe(g.description)}</p></div></div>
      <div class="group-meta"><span><i data-lucide="users"></i>${g.members} عضو</span><span><i data-lucide="file-text"></i>${g.casesCount} حالة</span></div>
      <button class="group-join-btn ${g.joined?'joined':''}" data-action="join">${g.joined?'مغادرة المجموعة':'انضم للمجموعة'}</button>
      <button class="group-join-btn" data-action="view" ${!g.joined?'disabled title="انضم للمجموعة أولاً"':''}>مشاهدة حالات المجموعة</button>`;
    el.querySelector('[data-action=join]').addEventListener('click',()=>changeMembership(g));
    el.querySelector('[data-action=view]').addEventListener('click',()=>showView('group',g.id));
    container.appendChild(el);
  }
  icons();
}
async function changeMembership(g){
  if(!mustLogin())return;
  if(g.joined&&!confirm('هل تريد مغادرة المجموعة؟ لن تستطيع مشاهدة منشوراتها الخاصة بعد ذلك.'))return;
  try{await post(`/groups/${g.id}/${g.joined?'leave':'join'}`);await Promise.all([loadGroups(),loadCases()]);toast(g.joined?'تمت مغادرة المجموعة':'تم الانضمام للمجموعة');}
  catch(e){toast(e.message);}
}
function updateGroupSelect(){
  const select=$('metaGroup');select.replaceChildren();
  const joined=state.groups.filter(g=>g.joined);
  for(const g of joined){const o=document.createElement('option');o.value=g.id;o.textContent=g.name;select.append(o);}
  if(!joined.length){const o=document.createElement('option');o.value='';o.textContent='انضم إلى مجموعة أولاً';select.append(o);}
  select.disabled=!joined.length;
  $('groupSelectWrap').hidden=$('metaAudience').value!=='group';
}
async function openReader(id){
  try{
    const r=await api(`/cases/${id}`);state.reader=r.case;state.readerPage=0;
    $('readerTitle').textContent=r.case.title;$('readerDeptTag').textContent=r.case.dept;
    $('readerSub').textContent=`${r.case.hospital} • ${dateLabel(r.case.time)} • بقلم: ${r.case.author}`;
    $('readerPearlText').textContent=r.case.pearl;
    $('deleteCaseBtn').hidden=!r.case.owner;
    renderReaderPages();renderComments();showModal('readerModal');
  }catch(e){toast(e.message);await loadCases();}
}
function renderReaderPages(){
  const c=state.reader,wrap=$('readerImgWrapper'),nav=$('readerPagesNav');
  wrap.replaceChildren();nav.replaceChildren();if(!c)return;
  if(c.canvasPages?.length){
    const img=document.createElement('img');img.src=c.canvasPages[state.readerPage];img.alt=`صفحة ${state.readerPage+1}`;wrap.append(img);
    c.canvasPages.forEach((p,i)=>{
      const b=document.createElement('button');b.className=`reader-page-chip ${i===state.readerPage?'active':''}`;
      b.textContent=`صفحة ${i+1}`;b.addEventListener('click',()=>{state.readerPage=i;renderReaderPages();});nav.append(b);
    });
  }else{
    const ex=c.examSummary||{};const div=document.createElement('div');
    div.style.cssText="padding:24px;font-family:monospace;font-size:.9rem;line-height:1.9;direction:ltr;text-align:left;";
    div.innerHTML=`<h3 style="border-bottom:2px solid #0f172a;padding-bottom:12px">CLINICAL HISTORY &amp; PHYSICAL EXAM</h3>
      <p><strong>Patient:</strong> ${safe(ex.patient||'Anonymized case')}</p><p><strong>CC:</strong> ${safe(ex.cc)}</p>
      <p><strong>HPI:</strong></p>${(ex.hpi||[]).map(v=>`<p>${safe(v)}</p>`).join('')}
      <p><strong>PMH:</strong> ${safe(ex.pmh)}</p>`;wrap.append(div);
  }
}
function renderComments(){
  const c=state.reader;if(!c)return;
  const target=$('commentsList');target.replaceChildren();
  $('commentsCountText').textContent=`${c.comments?.length||0} مناقشة`;
  if(!c.comments?.length){const p=document.createElement('p');p.className='hint-text';p.textContent='ابدأ المناقشة السريرية مع زملائك.';target.append(p);return;}
  for(const comment of c.comments){const item=document.createElement('div');item.className='comment-bubble';
    item.innerHTML=`<span class="comment-bubble-author">${safe(comment.author)} • ${dateLabel(comment.time)}</span><p>${safe(comment.text)}</p>`;target.append(item);}
}
async function submitComment(){
  if(!mustLogin()||!state.reader)return;
  const text=$('newCommentInput').value.trim();if(text.length<2)return;
  const btn=$('postCommentBtn');btn.disabled=true;
  try{const r=await post(`/cases/${state.reader.id}/comments`,{text});state.reader=r.case;
    $('newCommentInput').value='';renderComments();await loadCases();}
  catch(e){toast(e.message);}finally{btn.disabled=false;}
}
async function reportCase(){
  if(!mustLogin()||!state.reader)return;
  const reason=prompt('سبب الإبلاغ (مثلاً: معلومات تكشف هوية مريض):');
  if(!reason)return;
  try{await post(`/cases/${state.reader.id}/report`,{reason});toast('تم استلام البلاغ للمراجعة');}
  catch(e){toast(e.message);}
}
async function deleteCase(){
  if(!state.reader?.owner||!confirm('هل تريد حذف هذه الحالة وجميع تعليقاتها نهائياً؟'))return;
  try{await api(`/cases/${state.reader.id}`,{method:'DELETE'});closeModal('readerModal');state.reader=null;await loadCases();toast('تم حذف الحالة');}
  catch(e){toast(e.message);}
}
function printCase(){
  const c=state.reader;if(!c)return;
  const pages=c.canvasPages?.length?c.canvasPages.map((p,i)=>`<div class="page"><img src="${p}" alt="Clinical page ${i+1}"></div>`).join(''):
    `<div class="page">${$('readerImgWrapper').innerHTML}</div>`;
  const win=window.open('','_blank');if(!win){toast('اسمح بفتح نافذة الطباعة من المتصفح');return;}
  win.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${safe(c.title)}</title><style>
  @page{size:A4;margin:12mm}body{font-family:Arial,sans-serif;color:#111827}h2{font-size:17px;border-bottom:2px solid #0d9488;padding:10px}
  .page{page-break-after:always;width:100%;text-align:center}.page img{width:100%;height:auto;max-height:255mm;object-fit:contain}
  p{line-height:1.7}small{color:#475569}</style></head><body><h2>${safe(c.title)}</h2><small>${safe(c.hospital)} • ${safe(c.author)} • ${dateLabel(c.time)}</small><p>Clinical Pearl: ${safe(c.pearl)}</p>${pages}</body></html>`);
  win.document.close();win.focus();setTimeout(()=>win.print(),450);
}

// Handwriting editor: multi-page canvas + autosaved local drafts (never auto-published).
const canvas=$('clinicalCanvas'),ctx=canvas.getContext('2d');
let pages=[null], ink=[false],pageIndex=0, drawing=false, tool='pen',color='#1e3a8a',brush=5,
  undoStack=[],redoStack=[],loadSerial=0,draftTimer;
// Track only the active pen/mouse. Palm and finger contacts are never ink strokes.
let activeDrawingPointer=null, lastInkPoint=null;
function draftKey(){return `msh_draft_${state.user?.id||'guest'}`;}
function resetPages(){pages=[null];ink=[false];pageIndex=0;ctx.clearRect(0,0,canvas.width,canvas.height);undoStack=[];redoStack=[];updatePageNav();}
function saveCurrentPage(){pages[pageIndex]=ink[pageIndex]?canvas.toDataURL('image/png'):null;}
function updatePageNav(){
  $('pageIndicator').textContent=`الصفحة ${pageIndex+1} من ${pages.length}`;
  $('prevPageBtn').disabled=pageIndex===0;
  $('nextPageBtn').disabled=pageIndex===pages.length-1;
  $('addPageBtn').disabled=pages.length>=6;
}
function loadPage(i){
  pageIndex=i;const marker=++loadSerial;ctx.clearRect(0,0,canvas.width,canvas.height);
  undoStack=[];redoStack=[];ctx.globalCompositeOperation='source-over';
  if(pages[i]){const image=new Image();image.onload=()=>{if(marker===loadSerial){ctx.globalCompositeOperation='source-over';ctx.drawImage(image,0,0);}};image.src=pages[i];}
  updatePageNav();
}
function saveSnapshot(){undoStack.push(ctx.getImageData(0,0,canvas.width,canvas.height));if(undoStack.length>14)undoStack.shift();redoStack=[];}
function undo(){if(!undoStack.length)return;redoStack.push(ctx.getImageData(0,0,canvas.width,canvas.height));ctx.putImageData(undoStack.pop(),0,0);ink[pageIndex]=true;queueDraft();}
function redo(){if(!redoStack.length)return;undoStack.push(ctx.getImageData(0,0,canvas.width,canvas.height));ctx.putImageData(redoStack.pop(),0,0);ink[pageIndex]=true;queueDraft();}
function pos(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height};}
function drawStart(e){
  // iPad palm rejection: the palm may rest on the screen while Apple Pencil writes.
  // Only a stylus (or a mouse on desktop) starts a stroke; all touch contacts are ignored.
  if(e.pointerType!=='pen'&&e.pointerType!=='mouse')return;
  if(drawing||(e.pointerType==='mouse'&&e.button!==0))return;
  e.preventDefault();
  activeDrawingPointer=e.pointerId;
  canvas.setPointerCapture?.(e.pointerId);
  drawing=true;saveSnapshot();ink[pageIndex]=true;
  ctx.globalCompositeOperation=tool==='eraser'?'destination-out':'source-over';
  ctx.strokeStyle=color;ctx.fillStyle=color;
  ctx.lineCap='round';ctx.lineJoin='round';
  // Keep the stroke legible even at light Pencil pressure and on smaller screens.
  ctx.lineWidth=tool==='eraser'?Math.max(20,brush*8):Math.max(4.5,brush*1.3);
  const p=pos(e);lastInkPoint=p;
  // A tap creates a clearly visible dot, even without moving the pencil.
  ctx.beginPath();ctx.arc(p.x,p.y,ctx.lineWidth/2,0,Math.PI*2);ctx.fill();
}
function drawMove(e){
  if(!drawing||e.pointerId!==activeDrawingPointer)return;
  e.preventDefault();
  // Coalesced Pencil samples make handwriting smoother on supported browsers.
  const samples=e.getCoalescedEvents?.()||[];
  for(const sample of (samples.length?samples:[e])){
    const p=pos(sample);
    ctx.beginPath();ctx.moveTo(lastInkPoint.x,lastInkPoint.y);
    ctx.lineTo(p.x,p.y);ctx.stroke();lastInkPoint=p;
  }
}
function drawEnd(e){
  // A palm/finger lifting must never interrupt a pencil stroke.
  if(!drawing||(e&&e.pointerId!==activeDrawingPointer))return;
  const pointer=activeDrawingPointer;
  drawing=false;activeDrawingPointer=null;lastInkPoint=null;
  ctx.globalCompositeOperation='source-over';
  try{if(pointer!==null&&canvas.hasPointerCapture?.(pointer))canvas.releasePointerCapture(pointer);}catch{}
  queueDraft();
}
function queueDraft(){clearTimeout(draftTimer);draftTimer=setTimeout(saveDraft,750);}
function saveDraft(){
  if(!state.user)return false;
  saveCurrentPage();
  const metadata={title:$('metaTitle').value,dept:$('metaDept').value,year:$('metaYear').value,
    hospital:$('metaHospital').value,pearl:$('metaPearl').value,audience:$('metaAudience').value,groupId:$('metaGroup').value};
  try{localStorage.setItem(draftKey(),JSON.stringify({pages,ink,pageIndex,metadata}));$('draftStatus').textContent='تم حفظ المسودة على هذا الجهاز';return true;}
  catch{$('draftStatus').textContent='تعذر حفظ المسودة: مساحة المتصفح ممتلئة. لا تغلق الصفحة قبل النشر.';return false;}
}
function restoreDraft(){
  resetPages();if(!state.user)return;
  try{
    const d=JSON.parse(localStorage.getItem(draftKey())||'null');if(!d)return;
    if(Array.isArray(d.pages)&&d.pages.length<=6&&d.pages.length>0){pages=d.pages;ink=Array.isArray(d.ink)&&d.ink.length===pages.length?d.ink:pages.map(Boolean);loadPage(Math.max(0,Math.min(d.pageIndex||0,pages.length-1)));}
    for(const [key,id] of Object.entries({title:'metaTitle',dept:'metaDept',year:'metaYear',hospital:'metaHospital',pearl:'metaPearl',audience:'metaAudience',groupId:'metaGroup'}))
      if(d.metadata?.[key]!==undefined)$(id).value=d.metadata[key];
    updateGroupSelect();
    if(d.metadata?.groupId && state.groups.some(g=>g.id===d.metadata.groupId&&g.joined))$('metaGroup').value=d.metadata.groupId;
  }catch{resetPages();}
}
function setEditorStep(step){
  const isMeta=step==='meta';
  $('editorBody').classList.toggle('meta-step',isMeta);
  if($('publishError')){$('publishError').hidden=true;$('publishError').textContent='';}
  if($('publishStatus'))$('publishStatus').textContent='';
  document.querySelector('#editorBody .canvas-workspace').hidden=isMeta;
  $('caseMetaStage').hidden=!isMeta;
  $('continueCaseBtn').hidden=isMeta;
  $('backToHistoryBtn').hidden=!isMeta;
  $('publishCaseBtn').hidden=!isMeta;
  $('editorStepHint').textContent=isMeta
    ? 'الخطوة 2 من 2: بيانات الحالة السريرية ثم النشر'
    : 'الخطوة 1 من 2: اكتب التاريخ المرضي بالقلم أولاً، ثم أكمل بيانات الحالة';
  $('editorBody').scrollTop=0;
}
function continueToCaseDetails(){
  if(drawing)drawEnd();
  saveCurrentPage();
  if(!ink.some(Boolean)){toast('اكتب الهستري على صفحة واحدة على الأقل قبل الانتقال إلى بيانات الحالة');return;}
  saveDraft();
  setEditorStep('meta');
  $('metaTitle').focus({preventScroll:true});
}
function openEditor(){if(!mustLogin())return;restoreDraft();$('privacyAgree').checked=false;setEditorStep('history');showModal('editorModal');}
function composeSheet(rawPage) {
  return new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>{
      try {
        // Merge written ink onto white paper; JPEG is far smaller and more reliable
        // than PNG when uploading handwritten pages from iPad Safari.
        const out=document.createElement('canvas');out.width=800;out.height=1200;
        const c=out.getContext('2d');
        if(!c)throw new Error('المتصفح لم يتمكن من تجهيز الصفحة');
        c.fillStyle='#fff';c.fillRect(0,0,800,1200);
        c.fillStyle='#0f172a';c.font='bold 24px Arial';c.textAlign='left';
        c.fillText('CLINICAL HISTORY & PHYSICAL EXAM',35,42);
        c.font='14px Arial';c.fillStyle='#64748b';
        c.fillText('ANONYMIZED CASE • NO PATIENT IDENTIFIERS',35,74);
        c.strokeStyle='#0d9488';c.lineWidth=3;c.beginPath();c.moveTo(35,91);c.lineTo(765,91);c.stroke();
        c.strokeStyle='#e2e8f0';c.lineWidth=1;
        for(let y=122;y<1190;y+=32){c.beginPath();c.moveTo(28,y);c.lineTo(770,y);c.stroke();}
        c.drawImage(image,0,100,800,1100);
        let result=out.toDataURL('image/jpeg',0.76);
        if(result.length>2_300_000){
          const mini=document.createElement('canvas');mini.width=640;mini.height=960;
          mini.getContext('2d').drawImage(out,0,0,mini.width,mini.height);
          result=mini.toDataURL('image/jpeg',0.66);
        }
        if(!result.startsWith('data:image/jpeg;base64,')||result.length>2_300_000)
          throw new Error('حجم الصفحة كبير جداً؛ جرّب تقليل حجم الرسومات');
        resolve(result);
      }catch(e){reject(e);}
    };
    image.onerror=()=>reject(new Error('تعذر تجهيز صورة الصفحة؛ حاول الرجوع لصفحة الكتابة ثم المتابعة'));
    image.src=rawPage;
  });
}
function publishFailure(message){
  const e=$('publishError');e.textContent=message;e.hidden=false;
  e.scrollIntoView({block:'nearest',behavior:'smooth'});
  toast(message);
}
async function publish(){
  if(!mustLogin())return;
  $('publishError').hidden=true;$('publishError').textContent='';
  const title=$('metaTitle').value.trim(),dept=$('metaDept').value;
  if(title.length<5){publishFailure('اكتب عنواناً واضحاً للحالة (5 أحرف على الأقل)');return;}
  if(!$('privacyAgree').checked){publishFailure('لازم تأشر مربع تأكيد إخفاء هوية المريض قبل النشر');return;}
  saveCurrentPage();const finalPages=pages.filter((p,i)=>ink[i]&&p);
  if(!finalPages.length){publishFailure('اكتب ملاحظاتك على صفحة واحدة على الأقل قبل النشر');return;}
  const audience=$('metaAudience').value,groupId=$('metaGroup').value;
  if(audience==='group'&&!groupId){publishFailure('انضم إلى مجموعة أولاً من تبويب المجموعات');return;}
  // Save before attempting upload so a network failure never destroys the draft.
  const draftSaved=saveDraft();
  const btn=$('publishCaseBtn'),originalText=btn.textContent;
  btn.disabled=true;btn.textContent='جارٍ تجهيز ونشر الحالة…';
  try{
    $('publishStatus').textContent='جارٍ تجهيز الصفحات للإرسال…';
    const publishedPages=[];
    for(let i=0;i<finalPages.length;i++){
      publishedPages.push(await composeSheet(finalPages[i]));
      $('publishStatus').textContent=`تم تجهيز ${i+1} من ${finalPages.length} صفحات…`;
    }
    $('publishStatus').textContent='جارٍ إرسال الحالة إلى المنصة…';
    await post('/cases',{title,dept,year:$('metaYear').value,hospital:$('metaHospital').value.trim(),
      pearl:$('metaPearl').value.trim(),audience,groupId,canvasPages:publishedPages,privacyAgree:true});
    localStorage.removeItem(draftKey());resetPages();
    for(const id of ['metaTitle','metaHospital','metaPearl'])$(id).value='';
    $('privacyAgree').checked=false;setEditorStep('history');closeModal('editorModal');showView('feed');
    try{await Promise.all([loadCases(),loadGroups()]);}
    catch{toast('تم النشر بنجاح، لكن حدث خطأ أثناء تحديث قائمة الحالات؛ حدّث الصفحة');return;}
    toast('تم نشر الحالة للطلاب بنجاح');
  }catch(e){
    const message=e instanceof TypeError
      ? 'تعذّر الاتصال بالخادم. تحقق من الإنترنت ومن حالة Railway ثم حاول مرة ثانية.'
      : `تعذّر نشر الحالة: ${e.message}. جرّب مرة ثانية.`;
    if(!draftSaved) $('draftStatus').textContent='المسودة ما انحفظت محلياً؛ لا تغلق الصفحة قبل إكمال النشر.';
    publishFailure(message);
  }finally{btn.disabled=false;btn.textContent=originalText;$('publishStatus').textContent='';}
}

function setupEditor(){
  canvas.width=800;canvas.height=1100;updatePageNav();
  // Prevent iPad Safari from treating resting hands as a scroll/zoom gesture on paper.
  canvas.style.touchAction='none';
  canvas.style.userSelect='none';
  canvas.addEventListener('pointerdown',drawStart);canvas.addEventListener('pointermove',drawMove);
  canvas.addEventListener('pointerup',drawEnd);canvas.addEventListener('pointercancel',drawEnd);
  canvas.addEventListener('lostpointercapture',drawEnd);
  $('brushSize').value=String(brush);
  $('brushSize').addEventListener('input',e=>brush=Number(e.target.value));
  function setTool(t){tool=t;$('penTool').classList.toggle('active',t==='pen');$('eraserTool').classList.toggle('active',t==='eraser');}
  $('penTool').addEventListener('click',()=>setTool('pen'));
  $('eraserTool').addEventListener('click',()=>setTool('eraser'));
  document.querySelectorAll('.color-swatch').forEach(sw=>sw.addEventListener('click',()=>{
    color=sw.dataset.color;setTool('pen');document.querySelectorAll('.color-swatch').forEach(s=>s.classList.toggle('active',s===sw));
  }));
  $('undoBtn').addEventListener('click',undo);$('redoBtn').addEventListener('click',redo);
  $('clearCanvasBtn').addEventListener('click',()=>{if(!confirm('مسح الصفحة الحالية؟'))return;saveSnapshot();ctx.clearRect(0,0,canvas.width,canvas.height);ink[pageIndex]=false;queueDraft();});
  $('addPageBtn').addEventListener('click',()=>{if(pages.length>=6)return;saveCurrentPage();pages.push(null);ink.push(false);loadPage(pages.length-1);queueDraft();});
  $('prevPageBtn').addEventListener('click',()=>{if(pageIndex>0){saveCurrentPage();loadPage(pageIndex-1);queueDraft();}});
  $('nextPageBtn').addEventListener('click',()=>{if(pageIndex<pages.length-1){saveCurrentPage();loadPage(pageIndex+1);queueDraft();}});
  $('openEditorBtn').addEventListener('click',openEditor);
  $('closeEditorBtn').addEventListener('click',()=>{saveDraft();closeModal('editorModal');});
  $('continueCaseBtn').addEventListener('click',continueToCaseDetails);
  $('backToHistoryBtn').addEventListener('click',()=>{saveDraft();setEditorStep('history');});
  $('publishCaseBtn').addEventListener('click',publish);
  $('metaAudience').addEventListener('change',()=>{updateGroupSelect();queueDraft();});
  for(const id of ['metaTitle','metaDept','metaYear','metaHospital','metaPearl','metaGroup'])$(id).addEventListener('input',queueDraft);
}
function setupEvents(){
  $('authBtn').addEventListener('click',()=>state.user?logout():openAuth());
  $('closeAuthBtn').addEventListener('click',()=>closeModal('authModal'));
  $('authForm').addEventListener('submit',authSubmit);
  $('switchAuthMode').addEventListener('click',()=>setAuthMode(state.authMode==='login'?'register':'login'));
  $('profileBtn').addEventListener('click',()=>state.user?showModal('profileModal'):openAuth());
  $('closeProfileBtn').addEventListener('click',()=>closeModal('profileModal'));
  $('saveProfileBtn').addEventListener('click',async()=>{
    try{const r=await put('/profile',{name:$('editFullName').value,university:$('editUniversity').value,
      country:$('editCountry').value,grade:$('editGrade').value});state.user=r.user;updateProfileDisplay();closeModal('profileModal');toast('تم تحديث الملف الشخصي');}
    catch(e){toast(e.message);}
  });
  $('tabFeed').addEventListener('click',()=>showView('feed'));
  $('tabGroups').addEventListener('click',()=>showView('groups'));
  $('tabSaved').addEventListener('click',()=>showView('saved'));
  $('createGroupBtn').addEventListener('click',()=>{if(mustLogin())showModal('groupModal');});
  $('closeGroupBtn').addEventListener('click',()=>closeModal('groupModal'));
  $('groupForm').addEventListener('submit',async e=>{
    e.preventDefault();
    try{
      const r=await post('/groups',{name:$('groupName').value,description:$('groupDescription').value});
      e.target.reset();closeModal('groupModal');await Promise.all([loadGroups(),loadCases()]);
      showView('group',r.group.id);toast('تم إنشاء المجموعة والانضمام إليها');
    }catch(ex){toast(ex.message);}
  });
  $('filterTags').querySelectorAll('.filter-pill').forEach(p=>p.addEventListener('click',()=>{state.dept=p.dataset.dept;syncFilters();renderCases();}));
  $('searchInput').addEventListener('input',renderCases);
  $('closeReaderBtn').addEventListener('click',()=>closeModal('readerModal'));
  $('postCommentBtn').addEventListener('click',submitComment);
  $('newCommentInput').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();submitComment();}});
  $('reportCaseBtn').addEventListener('click',reportCase);
  $('deleteCaseBtn').addEventListener('click',deleteCase);
  $('downloadCasePdfBtn').addEventListener('click',printCase);
  for(const id of ['authModal','profileModal','readerModal','groupModal']) $(id).addEventListener('click',e=>{if(e.target===$(id))closeModal(id);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')for(const id of ['authModal','profileModal','readerModal','groupModal'])closeModal(id);});
}
async function init(){
  $('paperDateAuto').textContent=new Date().toLocaleDateString('en-CA');
  setupEvents();setupEditor();icons();
  try{const r=await api('/me');state.user=r.user;updateProfileDisplay();await Promise.all([loadCases(),loadGroups()]);}
  catch(e){toast(`تعذر تحميل المنصة: ${e.message}`);}
}
document.addEventListener('DOMContentLoaded',init);
