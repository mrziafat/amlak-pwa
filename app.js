const KEY="amlak_pwa_v2";
const emptyDB={clients:[],properties:[],visits:[],followups:[],contacts:[]};
let db=loadDB(), deferredPrompt=null, currentFollowFilter="all", currentContactFilter="all";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function loadDB(){try{const x=JSON.parse(localStorage.getItem(KEY)||"null");return {...emptyDB,...(x||{})}}catch(e){return {...emptyDB}}}
function save(){localStorage.setItem(KEY,JSON.stringify(db));renderAll()}
function uid(p){return p+"-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7)}
function today(){let d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)}
function faDate(d){if(!d)return "";try{return new Intl.DateTimeFormat("fa-IR",{year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(d+"T00:00:00"))}catch{return d}}
function toast(t){let x=$("#toast");x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),2000)}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function escAttr(s){return esc(s).replace(/\n/g," ")}
function nav(id){$$(".screen").forEach(x=>x.classList.toggle("active",x.id===id));$$(".bottom-nav button[data-nav]").forEach(x=>x.classList.toggle("active",x.dataset.nav===id));window.scrollTo(0,0)}
function openModal(title,body,desc="اطلاعات را وارد کنید. همه موارد قابل ویرایش و حذف هستند."){$("#modalTitle").textContent=title;$("#modalDesc").textContent=desc;$("#modalBody").innerHTML=body;$("#modal").classList.remove("hidden")}
function closeModal(){$("#modal").classList.add("hidden")}
$("#closeModal").onclick=closeModal;
$("#modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal()});

function newVisit(clientName="",propertyValue=""){nav("visit");$("#vFollowDate").value=today();$("#vFollowTime").value="17:00";$("#vAction").value="تماس با مشتری";$("#vClient").value=clientName;$("#vProperty").value=propertyValue;$("#vNote").value="";$("#vPrice").value="";$("#vClient").focus()}
document.addEventListener("click",e=>{
 const n=e.target.closest("[data-nav]"); if(n) nav(n.dataset.nav);
 const a=e.target.closest("[data-action]"); if(a){const act=a.dataset.action;if(act==="new-visit")newVisit();if(act==="new-client")openClientModal();if(act==="new-property")openPropertyModal()}
});
$("#visitForm").addEventListener("submit",e=>{
 e.preventDefault();
 const clientName=$("#vClient").value.trim(), propValue=$("#vProperty").value.trim();
 if(!clientName||!propValue)return toast("نام مشتری و ملک را وارد کنید");
 let c=db.clients.find(x=>x.name===clientName);
 if(!c){c={id:uid("C"),name:clientName,phone:"",phones:[],need:"خرید",budget:"",area:"",status:"جدید",notes:"",created:today()};db.clients.push(c)}
 let p=db.properties.find(x=>x.code===propValue||x.address===propValue);
 if(!p){p={id:uid("P"),code:propValue,address:propValue,type:"آپارتمان",price:"",area:"",zone:"",status:"فعال",owner:"",phone:"",notes:"",created:today()};db.properties.push(p)}
 const v={id:uid("V"),date:today(),time:new Date().toLocaleTimeString("fa-IR",{hour:"2-digit",minute:"2-digit"}),clientId:c.id,client:c.name,propertyId:p.id,property:p.address||p.code,result:$("#vResult").value,price:$("#vPrice").value,action:$("#vAction").value,followDate:$("#vFollowDate").value,followTime:$("#vFollowTime").value,note:$("#vNote").value};
 db.visits.unshift(v);
 if(v.followDate&&v.action)db.followups.unshift({id:uid("F"),date:today(),due:v.followDate,time:v.followTime,type:"پیگیری بازدید",clientId:c.id,client:c.name,propertyId:p.id,property:p.address||p.code,subject:v.action,action:v.action,status:"انجام نشده",result:"",note:v.note});
 save();toast("بازدید ثبت شد ✓");e.target.reset();setTimeout(()=>nav("home"),250)
});

function renderAll(){renderHome();renderLists();renderClients();renderProperties();renderFollowups();renderContacts();renderReports()}
function renderHome(){
 const open=db.followups.filter(x=>x.status!=="انجام شد"), t=open.filter(x=>x.due===today()).length,l=open.filter(x=>x.due<today()).length;
 $("#statToday").textContent=t;$("#statLate").textContent=l;$("#statClients").textContent=db.clients.length;$("#statProps").textContent=db.properties.filter(x=>x.status!=="بایگانی").length;
 $("#todayText")?.remove();
 const arr=[...open].sort((a,b)=>String(a.due).localeCompare(String(b.due))).slice(0,5);
 $("#homeFollowups").innerHTML=arr.length?arr.map(cardFollow).join(""):`<div class="card muted">فعلاً پیگیری باز ثبت نشده است.</div>`;
}
function renderLists(){$("#clientList").innerHTML=db.clients.map(x=>`<option value="${esc(x.name)}">`).join("");$("#propertyList").innerHTML=db.properties.map(x=>`<option value="${esc(x.code||x.address)}">`).join("")}

function renderClients(){
 const q=($("#clientSearch")?.value||"").trim().toLowerCase();
 const a=db.clients.filter(x=>(x.name+" "+x.phone+" "+(x.phones||[]).join(" ")+" "+x.area+" "+x.need+" "+x.notes).toLowerCase().includes(q));
 $("#clientCards").innerHTML=a.length?a.map(clientCard).join(""):`<div class="card muted">مشتری پیدا نشد.</div>`;
}
function clientCard(x){
 const phone=x.phone||(x.phones?.[0]?.number)||"";
 return `<div class="card">
  <div class="card-top"><div><div class="card-title">${esc(x.name)}</div><div class="muted">${esc(x.need||"")} · ${esc(x.area||"منطقه ثبت نشده")} · بودجه: ${esc(x.budget||"ثبت نشده")}</div></div><span class="badge">${esc(x.status||"جدید")}</span></div>
  ${phone?`<div class="phone-line">📞 ${esc(phone)} ${x.phones?.length>1?`<small>+${x.phones.length-1} شماره</small>`:""}</div>`:""}
  ${x.notes?`<div class="note-box">${esc(x.notes)}</div>`:""}
  <div class="card-actions wrap"><button class="outline" onclick="callPhone('${escAttr(phone)}')">📞 تماس</button><button class="outline" onclick="newVisitForClient('${escAttr(x.name)}')">＋ بازدید</button><button class="outline" onclick="openClientModal('${x.id}')">✏️ ویرایش</button><button class="outline danger" onclick="deleteClient('${x.id}')">🗑️ حذف</button></div>
 </div>`
}
function openClientModal(id=""){
 const x=id?db.clients.find(a=>a.id===id):null, phones=x?.phones?.length?x.phones:[x?.phone?{label:"اصلی",number:x.phone}:{}];
 openModal(x?"ویرایش مشتری":"ثبت مشتری",`<label>نام و نام خانوادگی<input id="mName" value="${escAttr(x?.name||"")}"></label>
 <div class="subhead">شماره‌های تماس <button type="button" class="mini" onclick="addPhoneField('clientPhones')">＋ شماره</button></div><div id="clientPhones">${phones.map((p,i)=>phoneField("clientPhone",p,i)).join("")}</div>
 <div class="grid2"><label>نوع نیاز<select id="mNeed">${["خرید","رهن","اجاره","فروش","سرمایه‌گذاری","سایر"].map(v=>`<option ${x?.need===v?"selected":""}>${v}</option>`).join("")}</select></label>
 <label>وضعیت<select id="mStatus">${["جدید","در حال پیگیری","مشتری فعال","منجر به معامله","غیرفعال"].map(v=>`<option ${x?.status===v?"selected":""}>${v}</option>`).join("")}</select></label></div>
 <label>بودجه<input id="mBudget" value="${escAttr(x?.budget||"")}"></label><label>منطقه مورد نظر<input id="mArea" value="${escAttr(x?.area||"")}"></label>
 <label>توضیحات<textarea id="mNotes" rows="4">${esc(x?.notes||"")}</textarea></label>
 <button class="primary submit" onclick="saveClient('${id}')">${x?"✓ ذخیره تغییرات":"✓ ثبت مشتری"}</button>`);
}
function phoneField(cls,p={},i=0){return `<div class="phone-field"><input class="${cls}-label" placeholder="عنوان مثل همراه/همسر" value="${escAttr(p.label||"")}"><input class="${cls}-number" inputmode="tel" placeholder="شماره تماس" value="${escAttr(p.number||"")}"><button type="button" class="remove-phone" onclick="this.parentElement.remove()">×</button></div>`}
function addPhoneField(target){$("#"+target)?.insertAdjacentHTML("beforeend",phoneField("clientPhone",{},Date.now()))}
function saveClient(id){
 const name=$("#mName").value.trim();if(!name)return toast("نام مشتری الزامی است");
 const phones=[...document.querySelectorAll(".clientPhone-number")].map((el,i)=>({label:document.querySelectorAll(".clientPhone-label")[i]?.value||"شماره",number:el.value.trim()})).filter(x=>x.number);
 let x=id?db.clients.find(a=>a.id===id):{id:uid("C"),created:today()};
 Object.assign(x,{name,phones,phone:phones[0]?.number||"",need:$("#mNeed").value,status:$("#mStatus").value,budget:$("#mBudget").value.trim(),area:$("#mArea").value.trim(),notes:$("#mNotes").value});
 if(!id)db.clients.push(x);syncContactFromClient(x);save();closeModal();toast(id?"مشتری ویرایش شد ✓":"مشتری ثبت شد ✓")
}
function syncContactFromClient(c){if(!c.phones?.length)return; c.phones.forEach(p=>{if(!p.number)return;let x=db.contacts.find(a=>a.linkId===c.id&&a.phone===p.number);if(!x)db.contacts.push({id:uid("T"),name:c.name,phone:p.number,group:"مشتری",notes:"",linkId:c.id})})}
function deleteClient(id){if(!confirm("مشتری و تمام ارتباط‌های مرتبط حذف شود؟"))return;db.clients=db.clients.filter(x=>x.id!==id);db.contacts=db.contacts.filter(x=>x.linkId!==id);save();toast("مشتری حذف شد")}
function newVisitForClient(n){newVisit(n)}

function normalizeDigits(v){
 return String(v??"").replace(/[۰-۹]/g,d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d));
}
function numericValue(v){
 let s=normalizeDigits(v).toLowerCase().replace(/,/g,"").replace(/٬/g,"").replace(/٫/g,".").trim();
 if(!s)return NaN;
 let unit=1;
 if(/تریلیون/.test(s))unit=1e12;
 else if(/میلیارد/.test(s)||/\bبیلیون\b/.test(s))unit=1e9;
 else if(/میلیون/.test(s)||/\bm\b/.test(s))unit=1e6;
 else if(/هزار/.test(s)||/\bk\b/.test(s))unit=1e3;
 const n=parseFloat(s.replace(/[^\d.\-]/g,""));
 return Number.isFinite(n)?n*unit:NaN;
}
function propertyArea(x){return numericValue(x?.area)}
function propertyPrice(x){return numericValue(x?.price)}
function renderProperties(){
 const q=($("#propertySearch")?.value||"").trim().toLowerCase();
 const type=$("#propertyTypeFilter")?.value||"";
 const zone=($("#propertyZoneFilter")?.value||"").trim().toLowerCase();
 const minP=numericValue($("#propertyMinPrice")?.value),maxP=numericValue($("#propertyMaxPrice")?.value);
 const minA=numericValue($("#propertyMinArea")?.value),maxA=numericValue($("#propertyMaxArea")?.value);
 const status=$("#propertyStatusFilter")?.value||"";
 const a=db.properties.filter(x=>{
   const text=(`${x.code||""} ${x.address||""} ${x.area||""} ${x.zone||""} ${x.price||""} ${x.type||""} ${x.owner||""} ${x.phone||""} ${x.notes||""}`).toLowerCase();
   if(q&&!text.includes(q))return false;
   if(type&&x.type!==type)return false;
   if(zone&&!(`${x.zone||""} ${x.address||""}`).toLowerCase().includes(zone))return false;
   if(status&&x.status!==status)return false;
   const p=propertyPrice(x),aVal=propertyArea(x);
   if(Number.isFinite(minP)&&(!Number.isFinite(p)||p<minP))return false;
   if(Number.isFinite(maxP)&&(!Number.isFinite(p)||p>maxP))return false;
   if(Number.isFinite(minA)&&(!Number.isFinite(aVal)||aVal<minA))return false;
   if(Number.isFinite(maxA)&&(!Number.isFinite(aVal)||aVal>maxA))return false;
   return true;
 });
 const summary=[];
 if(type)summary.push(type);
 if(zone)summary.push(`منطقه: ${zone}`);
 if(Number.isFinite(minP))summary.push(`از ${formatFilterNumber(minP)} تومان`);
 if(Number.isFinite(maxP))summary.push(`تا ${formatFilterNumber(maxP)} تومان`);
 if(Number.isFinite(minA))summary.push(`از ${formatFilterNumber(minA)} متر`);
 if(Number.isFinite(maxA))summary.push(`تا ${formatFilterNumber(maxA)} متر`);
 if(status)summary.push(status);
 $("#propertyFilterSummary").textContent=summary.length?`${a.length} ملک از ${db.properties.length} ملک مطابق فیلتر است: ${summary.join("، ")}`:`${a.length} ملک از ${db.properties.length} ملک`;
 $("#propertyCards").innerHTML=a.length?a.map(propertyCard).join(""):`<div class="card muted">ملکی با این مشخصات پیدا نشد.</div>`;
}
function formatFilterNumber(n){
 if(n>=1e9)return (n/1e9).toLocaleString("fa-IR",{maximumFractionDigits:2})+" میلیارد";
 if(n>=1e6)return (n/1e6).toLocaleString("fa-IR",{maximumFractionDigits:2})+" میلیون";
 return n.toLocaleString("fa-IR",{maximumFractionDigits:2});
}
function propertyCard(x){
 return `<div class="card"><div class="card-top"><div><div class="card-title">${esc(x.code||"بدون کد")} · ${esc(x.type||"")}</div><div class="muted">${esc(x.address||"آدرس ثبت نشده")} · ${esc(x.area||"")} متر · ${esc(x.zone||"")}</div></div><span class="badge">${esc(x.status||"فعال")}</span></div>
 <div class="info-grid"><span>💰 ${esc(x.price||"قیمت ثبت نشده")}</span><span>👤 ${esc(x.owner||"مالک ثبت نشده")}</span><span>📞 ${esc(x.phone||"شماره ثبت نشده")}</span></div>
 ${x.notes?`<div class="note-box">${esc(x.notes)}</div>`:""}
 <div class="card-actions wrap">${x.phone?`<button class="outline" onclick="callPhone('${escAttr(x.phone)}')">📞 تماس مالک</button>`:""}<button class="outline" onclick="newVisit('', '${escAttr(x.code||x.address)}')">＋ بازدید</button><button class="outline" onclick="openPropertyModal('${x.id}')">✏️ ویرایش</button><button class="outline danger" onclick="deleteProperty('${x.id}')">🗑️ حذف</button></div></div>`
}
function openPropertyModal(id=""){
 const x=id?db.properties.find(a=>a.id===id):null;
 openModal(x?"ویرایش ملک":"ثبت ملک",`<div class="grid2"><label>کد ملک<input id="pCode" value="${escAttr(x?.code||"")}"></label><label>وضعیت<select id="pStatus">${["فعال","رزرو","فروخته شد","اجاره رفت","بایگانی"].map(v=>`<option ${x?.status===v?"selected":""}>${v}</option>`).join("")}</select></label></div>
 <label>آدرس / محدوده<input id="pAddress" value="${escAttr(x?.address||"")}"></label>
 <div class="grid2"><label>نوع ملک<select id="pType">${["آپارتمان","خانه","ویلایی","زمین","مغازه","اداری","باغ","سایر"].map(v=>`<option ${x?.type===v?"selected":""}>${v}</option>`).join("")}</select></label><label>متراژ<input id="pArea" inputmode="numeric" value="${escAttr(x?.area||"")}"></label></div>
 <label>منطقه / محله<input id="pZone" value="${escAttr(x?.zone||"")}"></label><label>قیمت<input id="pPrice" value="${escAttr(x?.price||"")}"></label>
 <div class="grid2"><label>نام مالک<input id="pOwner" value="${escAttr(x?.owner||"")}"></label><label>شماره مالک<input id="pPhone" inputmode="tel" value="${escAttr(x?.phone||"")}"></label></div>
 <label>توضیحات<textarea id="pNotes" rows="5">${esc(x?.notes||"")}</textarea></label>
 <button class="primary submit" onclick="saveProperty('${id}')">${x?"✓ ذخیره تغییرات":"✓ ثبت ملک"}</button>`);
}
function saveProperty(id){
 let x=id?db.properties.find(a=>a.id===id):{id:uid("P"),created:today()};
 Object.assign(x,{code:$("#pCode").value.trim(),address:$("#pAddress").value.trim(),status:$("#pStatus").value,type:$("#pType").value,area:$("#pArea").value.trim(),zone:$("#pZone").value.trim(),price:$("#pPrice").value.trim(),owner:$("#pOwner").value.trim(),phone:$("#pPhone").value.trim(),notes:$("#pNotes").value});
 if(!x.code&&!x.address)return toast("کد یا آدرس ملک را وارد کنید");
 if(!id)db.properties.push(x);if(x.phone&&x.owner)upsertContact(x.owner,x.phone,"مالک","مالک ملک "+(x.code||x.address),x.id);save();closeModal();toast(id?"ملک ویرایش شد ✓":"ملک ثبت شد ✓")
}
function upsertContact(name,phone,group,notes,linkId){let x=db.contacts.find(a=>a.phone===phone);if(x)Object.assign(x,{name,group,notes,linkId});else db.contacts.push({id:uid("T"),name,phone,group,notes,linkId})}
function deleteProperty(id){if(!confirm("این ملک حذف شود؟"))return;db.properties=db.properties.filter(x=>x.id!==id);db.contacts=db.contacts.filter(x=>x.linkId!==id);save();toast("ملک حذف شد")}

function renderFollowups(filter=currentFollowFilter){
 currentFollowFilter=filter;let a=[...db.followups];
 if(filter==="today")a=a.filter(x=>x.due===today()&&x.status!=="انجام شد");else if(filter==="late")a=a.filter(x=>x.due<today()&&x.status!=="انجام شد");else if(filter==="done")a=a.filter(x=>x.status==="انجام شد");else a=a.filter(x=>x.status!=="انجام شد");
 a.sort((x,y)=>String(x.due).localeCompare(String(y.due)));
 $("#followCards").innerHTML=a.length?a.map(cardFollow).join(""):`<div class="card muted">موردی در این فهرست وجود ندارد.</div>`;
}
function cardFollow(x){
 const late=x.due<today()&&x.status!=="انجام شد", phone=clientPhone(x.clientId);
 return `<div class="card"><div class="card-top"><div><div class="card-title">${esc(x.subject||x.action||"پیگیری")}</div><div class="muted">${esc(x.client||"")} · ${esc(x.property||"")}</div></div><span class="badge ${late?"red":x.due===today()?"yellow":""}">${x.status==="انجام شد"?"انجام‌شده":late?"عقب‌افتاده":x.due===today()?"امروز":faDate(x.due)}</span></div>
 <div class="muted follow-detail">📅 ${faDate(x.due)} ${esc(x.time||"")} ${x.note?" · "+esc(x.note):""}</div>
 <div class="card-actions wrap">${x.status!=="انجام شد"?`<button class="outline" onclick="doneFollow('${x.id}')">✓ انجام شد</button>`:""}${phone?`<button class="outline" onclick="callPhone('${escAttr(phone)}')">📞 تماس</button>`:""}<button class="outline" onclick="openFollowupModal('${x.id}')">✏️ ویرایش</button><button class="outline danger" onclick="deleteFollowup('${x.id}')">🗑️ حذف</button></div></div>`
}
function clientPhone(id){return (db.clients.find(x=>x.id===id)||{}).phone||""}
function doneFollow(id){let x=db.followups.find(x=>x.id===id);if(x){x.status="انجام شد";x.completed=today();save();toast("پیگیری انجام شد ✓")}}
function deleteFollowup(id){if(!confirm("پیگیری حذف شود؟"))return;db.followups=db.followups.filter(x=>x.id!==id);save();toast("پیگیری حذف شد")}
$("#addFollowup").onclick=()=>openFollowupModal();
function openFollowupModal(id=""){
 const x=id?db.followups.find(a=>a.id===id):null, clients=db.clients;
 openModal(x?"ویرایش پیگیری":"ثبت پیگیری",`<label>مشتری<select id="fClient"><option value="">بدون مشتری</option>${clients.map(c=>`<option value="${c.id}" ${x?.clientId===c.id?"selected":""}>${esc(c.name)}</option>`).join("")}</select></label>
 <label>عنوان پیگیری<input id="fSubject" value="${escAttr(x?.subject||"")}"></label><div class="grid2"><label>تاریخ<input id="fDate" type="date" value="${x?.due||today()}"></label><label>ساعت<input id="fTime" type="time" value="${x?.time||"17:00"}"></label></div>
 <label>وضعیت<select id="fStatus"><option ${x?.status!=="انجام شد"?"selected":""}>انجام نشده</option><option ${x?.status==="انجام شد"?"selected":""}>انجام شد</option></select></label>
 <label>توضیحات<textarea id="fNote" rows="4">${esc(x?.note||"")}</textarea></label>
 <button class="primary submit" onclick="saveFollowup('${id}')">${x?"✓ ذخیره تغییرات":"✓ ثبت پیگیری"}</button>`)
}
function saveFollowup(id){
 const cid=$("#fClient").value,c=db.clients.find(a=>a.id===cid),subject=$("#fSubject").value.trim();if(!subject)return toast("عنوان پیگیری الزامی است");
 let x=id?db.followups.find(a=>a.id===id):{id:uid("F"),date:today(),type:"پیگیری"};
 Object.assign(x,{clientId:cid,client:c?.name||"",subject,action:subject,due:$("#fDate").value,time:$("#fTime").value,status:$("#fStatus").value,note:$("#fNote").value,property:x.property||""});
 if(!id)db.followups.unshift(x);save();closeModal();toast(id?"پیگیری ویرایش شد ✓":"پیگیری ثبت شد ✓")
}

function renderContacts(){
 const q=($("#contactSearch")?.value||"").trim().toLowerCase();
 let a=db.contacts.filter(x=>(x.name+" "+x.phone+" "+x.group+" "+x.notes).toLowerCase().includes(q));
 if(currentContactFilter!=="all")a=a.filter(x=>x.group===currentContactFilter);
 $("#contactCards").innerHTML=a.length?a.map(contactCard).join(""):`<div class="card muted">شماره‌ای پیدا نشد.</div>`;
}
function contactCard(x){return `<div class="card"><div class="card-top"><div><div class="card-title">${esc(x.name)}</div><div class="muted">${esc(x.group||"سایر")} · ${esc(x.phone)}</div></div><span class="badge">${esc(x.group||"سایر")}</span></div>${x.notes?`<div class="note-box">${esc(x.notes)}</div>`:""}<div class="card-actions wrap"><button class="outline" onclick="callPhone('${escAttr(x.phone)}')">📞 تماس</button><button class="outline" onclick="smsPhone('${escAttr(x.phone)}')">💬 پیامک</button><button class="outline" onclick="openContactModal('${x.id}')">✏️ ویرایش</button><button class="outline danger" onclick="deleteContact('${x.id}')">🗑️ حذف</button></div></div>`}
$("#addContact").onclick=()=>openContactModal();
function openContactModal(id=""){
 const x=id?db.contacts.find(a=>a.id===id):null;
 openModal(x?"ویرایش شماره":"ثبت شماره",`<label>نام مخاطب<input id="tName" value="${escAttr(x?.name||"")}"></label><div class="grid2"><label>شماره تماس<input id="tPhone" inputmode="tel" value="${escAttr(x?.phone||"")}"></label><label>گروه<select id="tGroup">${["مشتری","مالک","همکار","سایر"].map(v=>`<option ${x?.group===v?"selected":""}>${v}</option>`).join("")}</select></label></div><label>توضیحات<textarea id="tNotes" rows="4">${esc(x?.notes||"")}</textarea></label><button class="primary submit" onclick="saveContact('${id}')">${x?"✓ ذخیره تغییرات":"✓ ثبت شماره"}</button>`)
}
function saveContact(id){const name=$("#tName").value.trim(),phone=$("#tPhone").value.trim();if(!name||!phone)return toast("نام و شماره تماس الزامی است");let x=id?db.contacts.find(a=>a.id===id):{id:uid("T")};Object.assign(x,{name,phone,group:$("#tGroup").value,notes:$("#tNotes").value});if(!id)db.contacts.unshift(x);save();closeModal();toast(id?"شماره ویرایش شد ✓":"شماره ثبت شد ✓")}
function deleteContact(id){if(!confirm("این شماره حذف شود؟"))return;db.contacts=db.contacts.filter(x=>x.id!==id);save();toast("شماره حذف شد")}
function callPhone(p){if(p)location.href="tel:"+p;else toast("شماره‌ای ثبت نشده است")}
function smsPhone(p){if(p)location.href="sms:"+p;else toast("شماره‌ای ثبت نشده است")}

function renderReports(){
 const done=db.followups.filter(x=>x.status==="انجام شد").length;
 $("#reportCards").innerHTML=`<div class="report-card"><b>${db.visits.length}</b><span>بازدید ثبت‌شده</span></div><div class="report-card"><b>${db.clients.length}</b><span>مشتری</span></div><div class="report-card"><b>${db.properties.length}</b><span>ملک</span></div><div class="report-card"><b>${db.contacts.length}</b><span>شماره تلفن</span></div><div class="report-card"><b>${done}</b><span>پیگیری انجام‌شده</span></div>`;
}
document.addEventListener("click",e=>{
 const b=e.target.closest(".chip[data-filter]");if(b){$$(".filters .chip").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderFollowups(b.dataset.filter)}
 const c=e.target.closest(".chip[data-contact-filter]");if(c){$$(".contact-tabs .chip").forEach(x=>x.classList.remove("active"));c.classList.add("active");renderContacts(currentContactFilter=c.dataset.contactFilter)}
});
$("#addClient").onclick=()=>openClientModal();
$("#addProperty").onclick=()=>openPropertyModal();
$("#clientSearch").addEventListener("input",renderClients);$("#propertySearch").addEventListener("input",renderProperties);$("#contactSearch").addEventListener("input",renderContacts);
["propertyTypeFilter","propertyZoneFilter","propertyMinPrice","propertyMaxPrice","propertyMinArea","propertyMaxArea","propertyStatusFilter"].forEach(id=>{
 const el=$("#"+id); if(el)el.addEventListener("input",renderProperties);
});
$("#clearPropertyFilters").onclick=()=>{
 ["propertySearch","propertyZoneFilter","propertyMinPrice","propertyMaxPrice","propertyMinArea","propertyMaxArea"].forEach(id=>{const el=$("#"+id);if(el)el.value=""});
 ["propertyTypeFilter","propertyStatusFilter"].forEach(id=>{const el=$("#"+id);if(el)el.value=""});
 renderProperties();
};

$("#voiceBtn").onclick=()=>{if(!("webkitSpeechRecognition"in window||"SpeechRecognition"in window))return toast("مرورگر شما از ثبت صوتی پشتیبانی نمی‌کند");const SR=window.SpeechRecognition||window.webkitSpeechRecognition;const r=new SR();r.lang="fa-IR";r.interimResults=false;r.onresult=e=>{$("#vNote").value+=(($("#vNote").value?" ":"")+e.results[0][0].transcript);toast("متن صوتی ثبت شد")};r.onerror=()=>toast("ثبت صوتی فعال نشد");r.start()};

function makeBackupName(){const d=new Date(),p=n=>String(n).padStart(2,"0");return `amlak-backup-${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.json`}
function downloadBackup(auto=false){const payload={app:"املاک من",version:4,exportedAt:new Date().toISOString(),data:db};const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json;charset=utf-8"}),url=URL.createObjectURL(blob),x=document.createElement("a");x.href=url;x.download=makeBackupName();document.body.appendChild(x);x.click();x.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);localStorage.setItem("amlak_last_backup",payload.exportedAt);toast(auto?"پشتیبان خودکار ذخیره شد ✓":"نسخه پشتیبان ساخته شد ✓")}
$("#exportData").onclick=()=>downloadBackup(false);
$("#importData").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const raw=JSON.parse(r.result),x=raw.data&&typeof raw.data==="object"?raw.data:raw;if(!x||!Array.isArray(x.clients)||!Array.isArray(x.properties))throw 0;const clean={clients:Array.isArray(x.clients)?x.clients:[],properties:Array.isArray(x.properties)?x.properties:[],visits:Array.isArray(x.visits)?x.visits:[],followups:Array.isArray(x.followups)?x.followups:[],contacts:Array.isArray(x.contacts)?x.contacts:[]};const msg=`${clean.clients.length} مشتری، ${clean.properties.length} ملک، ${clean.contacts.length} شماره، ${clean.visits.length} بازدید و ${clean.followups.length} پیگیری`;if(confirm(`این پشتیبان شامل ${msg} است.\
\
اطلاعات فعلی جایگزین شود؟`)){db=clean;save();toast("بازیابی اطلاعات با موفقیت انجام شد ✓")}}catch(err){toast("فایل پشتیبان معتبر نیست")}};r.readAsText(f);e.target.value=""};
(function(){const last=localStorage.getItem("amlak_last_backup");if(!last||Date.now()-new Date(last).getTime()>7*24*60*60*1000)setTimeout(()=>{if(db.clients.length||db.properties.length||db.contacts.length||db.visits.length||db.followups.length)if(confirm("بیش از ۷ روز از آخرین پشتیبان‌گیری گذشته است. اکنون نسخه پشتیبان بگیرید؟"))downloadBackup(true)},1200)})();
$("#clearData").onclick=()=>{if(confirm("تمام اطلاعات این برنامه حذف شود؟ این کار قابل بازگشت نیست.")){db={...emptyDB};save();toast("تمام اطلاعات حذف شد")}};

document.addEventListener("dblclick",e=>{if(e.target.closest("input,textarea,select,button"))return});
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("#installBtn").classList.remove("hidden")});
$("#installBtn").onclick=async()=>{if(deferredPrompt){await deferredPrompt.prompt();deferredPrompt=null}};
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js"));
renderAll();
