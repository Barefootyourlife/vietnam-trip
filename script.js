const firebaseConfig={
  apiKey:"AIzaSyCLolnrkJKRXb6nAicndo-oBYy8kjyezFA",
  authDomain:"travel-planner-1b586.firebaseapp.com",
  databaseURL:"https://travel-planner-1b586-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:"travel-planner-1b586",
  storageBucket:"travel-planner-1b586.firebasestorage.app",
  messagingSenderId:"318044615830",
  appId:"1:318044615830:web:11cb97e5d01d30d0213eb7",
  measurementId:"G-Y20QN0VQ7K"
};
firebase.initializeApp(firebaseConfig);
const db=firebase.database();
const ref=db.ref("sharedTrip");
const $=id=>document.getElementById(id);

let selectedDayId=null;
let data={
  title:"越南 🇻🇳",
  subtitle:"Buon Viaggio",
  days:[{id:1,date:"",title:"Day 1",schedules:[]}],
  budget:[],
  spots:[],
  stay:[],
  flight:[],
  packing:[]
};

ref.on("value",snap=>{
  if(snap.exists()) data={...data,...snap.val()};
  if(!Array.isArray(data.days)||!data.days.length){
    data.days=[{id:Date.now(),date:"",title:"Day 1",schedules:[]}];
  }
  if(!selectedDayId) selectedDayId=data.days[0].id;
  render();
});
function save(){ref.set(data)}
function closeModal(){$("modal").close()}
function openModal(title,html){$("modalTitle").textContent=title;$("modalBody").innerHTML=html;$("modal").showModal()}

function fmtDate(dateStr){
  if(!dateStr) return {week:"DAY",num:"+",month:"日期"};
  const d=new Date(dateStr+"T00:00:00");
  const w=["SUN","MON","TUE","WED","THU","FRI","SAT"];
  return {week:w[d.getDay()],num:String(d.getDate()).padStart(2,"0"),month:String(d.getMonth()+1).padStart(2,"0")+"月"};
}
function currentDay(){return data.days.find(d=>d.id===selectedDayId)||data.days[0]}
function currentIndex(){return Math.max(0,data.days.findIndex(d=>d.id===selectedDayId))}

function showPage(name,btn){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  $(name+"Page").classList.add("active");
  document.querySelectorAll(".bottom-nav button").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  render();
}

function render(){
  $("title").textContent=data.title||"我的旅行";
  $("subtitle").textContent=data.subtitle||"Buon Viaggio";
  renderDays();
  renderToday();
  renderAllSchedule();
  renderBudget();
  renderSpots();
  renderMore();
  renderMapPlaces();
}
function renderDays(){
  const total=Math.max(data.days.length,1), idx=currentIndex();
  $("dayLabel").textContent=`Day ${idx+1} / ${total}`;
  $("progress").style.width=((idx+1)/total*100)+"%";
  $("days").innerHTML=data.days.map((d,i)=>{
    const f=fmtDate(d.date);
    return `<button class="day ${d.id===selectedDayId?'active':''}" onclick="selectDay(${d.id})">
      <span class="edit" onclick="event.stopPropagation();openEditDay(${d.id})">✎</span>
      <div class="week">${f.week} <small>D${i+1}</small></div>
      <div class="num">${f.num}</div>
      <div class="month">${f.month}</div>
    </button>`;
  }).join("");
}
function renderToday(){
  const d=currentDay(), arr=d.schedules||[];
  $("todayList").innerHTML=arr.length
    ? arr.slice(0,3).map(s=>scheduleHtml(s,d.id)).join("")
    : `<div class="empty">📋<br>今天還沒有行程，點「＋新增行程」開始規劃你的旅程吧！</div>`;
}
function scheduleHtml(s,dayId){
  return `<div class="schedule">
    <div class="time">${s.time||"--:--"}</div>
    <div>
      <div class="place">${s.place||"未命名行程"}</div>
      <div class="meta">📍 ${s.location||"未設定地點"}</div>
      <div class="meta">${s.note||""}</div>
    </div>
    <div>
      <div class="icon">${s.icon||"🏛️"}</div>
      <button onclick="deleteSchedule(${dayId},${s.id})">刪除</button>
    </div>
  </div>`;
}
function renderAllSchedule(){
  $("allSchedule").innerHTML=data.days.map((d,i)=>`
    <div class="list-item">
      <div class="list-row"><h3>Day ${i+1}｜${d.date||"未設定日期"}</h3><button onclick="selectDay(${d.id});openScheduleModal()">＋新增</button></div>
      ${(d.schedules||[]).map(s=>scheduleHtml(s,d.id)).join("")||"<p class='meta'>尚未新增行程</p>"}
    </div>
  `).join("");
}
function renderBudget(){
  const total=(data.budget||[]).reduce((s,x)=>s+Number(x.amount||0),0);
  $("totalMoney").textContent=total.toLocaleString();
  $("budgetList").innerHTML=(data.budget||[]).map(x=>`
    <div class="list-item"><div class="list-row"><b>${x.item}</b><span>${Number(x.amount||0).toLocaleString()}</span></div><button onclick="remove('budget',${x.id})">刪除</button></div>
  `).join("");
}
function renderSpots(){
  $("spotList").innerHTML=(data.spots||[]).map(x=>`
    <div class="list-item"><h3>${x.name}</h3><p>${x.note||""}</p><button onclick="remove('spots',${x.id})">刪除</button></div>
  `).join("")||`<div class="empty">尚未收藏景點</div>`;
}
function renderMore(){
  $("stayList").innerHTML=(data.stay||[]).map(x=>`<div class="list-item"><b>${x.name}</b><p>${x.date||""}</p><p>${x.note||""}</p><button onclick="remove('stay',${x.id})">刪除</button></div>`).join("")||"尚未新增住宿";
  $("flightList").innerHTML=(data.flight||[]).map(x=>`<div class="list-item"><b>${x.no}</b><p>${x.time||""}</p><p>${x.note||""}</p><button onclick="remove('flight',${x.id})">刪除</button></div>`).join("")||"尚未新增航班";
  $("packingList").innerHTML=(data.packing||[]).map(x=>`<div class="list-item"><label><input type="checkbox" ${x.done?"checked":""} onchange="togglePack(${x.id})"> ${x.name}</label><br><button onclick="remove('packing',${x.id})">刪除</button></div>`).join("")||"尚未新增行李";
}
function renderMapPlaces(){
  let places=[];
  data.days.forEach(d=>(d.schedules||[]).forEach(s=>{if(s.location)places.push(s.location)}));
  $("mapPlaces").innerHTML=places.map(p=>`<div class="list-item list-row"><span>📍 ${p}</span><button onclick="window.open('https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p)}','_blank')">導航</button></div>`).join("")||`<div class="empty">尚未有行程地點</div>`;
}

function selectDay(id){selectedDayId=id;render()}
function changeDay(n){const i=currentIndex()+n;if(data.days[i])selectedDayId=data.days[i].id;render()}

function openSettings(){
  openModal("旅程設定",`
    <input id="setTitle" value="${data.title||""}" placeholder="主標題">
    <input id="setSubtitle" value="${data.subtitle||""}" placeholder="副標題">
    <button class="primary" onclick="data.title=$('setTitle').value;data.subtitle=$('setSubtitle').value;closeModal();save()">儲存</button>
  `);
}
function openDayModal(){
  openModal("新增日期",`
    <input id="dDate" type="date">
    <input id="dTitle" placeholder="日期標題，例如 Day 1｜胡志明">
    <button class="primary" onclick="addDay()">新增日期</button>
  `);
}
function addDay(){
  const day={id:Date.now(),date:$("dDate").value,title:$("dTitle").value||`Day ${data.days.length+1}`,schedules:[]};
  data.days.push(day);selectedDayId=day.id;closeModal();save();
}
function openEditDay(id){
  const d=data.days.find(x=>x.id===id);
  openModal("修改日期",`
    <input id="eDate" type="date" value="${d.date||""}">
    <input id="eTitle" value="${d.title||""}">
    <button class="primary" onclick="let d=data.days.find(x=>x.id===${id});d.date=$('eDate').value;d.title=$('eTitle').value;closeModal();save()">儲存</button>
    <button class="primary danger" onclick="deleteDay(${id})">刪除日期</button>
  `);
}
function deleteDay(id){
  if(!confirm("確定刪除日期嗎？"))return;
  data.days=data.days.filter(x=>x.id!==id);
  selectedDayId=data.days[0]?.id;
  closeModal();save();
}
function openScheduleModal(){
  openModal("新增今日行程",`
    <input id="sTime" placeholder="時間，例如 08:00">
    <input id="sPlace" placeholder="行程，例如 米蘭 → 威尼斯">
    <input id="sLocation" placeholder="地點，例如 威尼斯">
    <input id="sIcon" placeholder="圖示，例如 🏛️ 🍝 🚕">
    <textarea id="sNote" placeholder="交通、備註、推薦餐廳"></textarea>
    <button class="primary" onclick="addSchedule()">新增行程</button>
  `);
}
function addSchedule(){
  const d=currentDay();
  d.schedules=d.schedules||[];
  d.schedules.push({id:Date.now(),time:$("sTime").value,place:$("sPlace").value,location:$("sLocation").value,icon:$("sIcon").value,note:$("sNote").value});
  closeModal();save();
}
function deleteSchedule(dayId,id){
  const d=data.days.find(x=>x.id===dayId);
  d.schedules=d.schedules.filter(x=>x.id!==id);
  save();
}
function openBudgetModal(){openModal("新增花費",`<input id="bItem" placeholder="項目"><input id="bAmount" type="number" placeholder="金額"><button class="primary" onclick="data.budget.push({id:Date.now(),item:$('bItem').value,amount:Number($('bAmount').value||0)});closeModal();save()">新增</button>`)}
function openSpotModal(){openModal("新增景點",`<input id="spName" placeholder="景點名稱"><textarea id="spNote" placeholder="備註"></textarea><button class="primary" onclick="data.spots.push({id:Date.now(),name:$('spName').value,note:$('spNote').value});closeModal();save()">新增</button>`)}
function openStayModal(){openModal("新增住宿",`<input id="stName" placeholder="住宿名稱"><input id="stDate" placeholder="日期"><textarea id="stNote" placeholder="地址、訂房資訊"></textarea><button class="primary" onclick="data.stay.push({id:Date.now(),name:$('stName').value,date:$('stDate').value,note:$('stNote').value});closeModal();save()">新增</button>`)}
function openFlightModal(){openModal("新增航班",`<input id="fNo" placeholder="航班"><input id="fTime" placeholder="時間"><textarea id="fNote" placeholder="機場、航廈、行李"></textarea><button class="primary" onclick="data.flight.push({id:Date.now(),no:$('fNo').value,time:$('fTime').value,note:$('fNote').value});closeModal();save()">新增</button>`)}
function openPackingModal(){openModal("新增行李",`<input id="pName" placeholder="物品"><button class="primary" onclick="data.packing.push({id:Date.now(),name:$('pName').value,done:false});closeModal();save()">新增</button>`)}
function togglePack(id){const x=data.packing.find(i=>i.id===id);x.done=!x.done;save()}
function remove(type,id){data[type]=data[type].filter(x=>x.id!==id);save()}
function openMapSearch(){
  const q=$("mapSearch").value;
  if(q) window.open("https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(q),"_blank");
}