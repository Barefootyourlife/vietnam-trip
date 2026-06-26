const firebaseConfig = {
  apiKey: "AIzaSyCLolnrkJKRXb6nAicndo-oBYy8kjyezFA",
  authDomain: "travel-planner-1b586.firebaseapp.com",
  databaseURL: "https://travel-planner-1b586-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "travel-planner-1b586",
  storageBucket: "travel-planner-1b586.firebasestorage.app",
  messagingSenderId: "318044615830",
  appId: "1:318044615830:web:11cb97e5d01d30d0213eb7",
  measurementId: "G-Y20QN0VQ7K"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const tripRef = db.ref("sharedTrip");

const $ = id => document.getElementById(id);
let selectedDayId = null;
let data = {
  title:"胡志明 & 富國島",
  subtitle:"Buon Viaggio · Vietnam Trip",
  days:[
    {id:1,date:"2026-06-26",title:"Day 1",schedules:[]},
    {id:2,date:"2026-06-27",title:"Day 2",schedules:[]},
    {id:3,date:"2026-06-28",title:"Day 3",schedules:[]}
  ],
  budget:[],
  spots:[],
  stay:[],
  flight:[],
  packing:[],
  album:[]
};

tripRef.on("value", snap=>{
  if(snap.exists()) data = {...data, ...snap.val()};
  if(!data.days) data.days=[];
  if(!selectedDayId && data.days.length) selectedDayId=data.days[0].id;
  render();
});
function save(){tripRef.set(data)}
function fmtDate(d){
  if(!d) return {week:"DAY",num:"+",month:"日期"};
  const date = new Date(d+"T00:00:00");
  const weeks=["SUN","MON","TUE","WED","THU","FRI","SAT"];
  return {week:weeks[date.getDay()], num:String(date.getDate()).padStart(2,"0"), month:String(date.getMonth()+1).padStart(2,"0")+"月"};
}
function selectedIndex(){return Math.max(0,data.days.findIndex(d=>d.id===selectedDayId))}
function selectedDay(){return data.days.find(d=>d.id===selectedDayId)}
function render(){
  $("tripTitle").textContent=data.title||"我的旅行";
  $("tripSubtitle").textContent=data.subtitle||"Buon Viaggio";
  const days=data.days||[];
  const first=days[0]?.date||"";
  const last=days[days.length-1]?.date||"";
  $("rangeText").textContent = first && last ? `${first} - ${last}` : "旅行日期・雲端同步";

  $("dayTabs").innerHTML = days.map((d,i)=>{
    const f=fmtDate(d.date);
    return `<button class="day-card ${d.id===selectedDayId?'active':''}" onclick="selectDay(${d.id})">
      <span class="day-edit" onclick="event.stopPropagation();openEditDay(${d.id})">✎</span>
      <div class="week">${f.week} <small>D${i+1}</small></div>
      <div class="num">${f.num}</div>
      <div class="month">${f.month}</div>
    </button>`;
  }).join("");

  const idx=selectedIndex(), total=Math.max(days.length,1);
  $("dayCount").textContent=`Day ${idx+1} / ${total}`;
  $("progressBar").style.width=((idx+1)/total*100)+"%";

  const day=selectedDay();
  const schedules=day?.schedules||[];
  $("todayList").innerHTML = schedules.length ? schedules.map(s=>`
    <div class="schedule-item">
      <div class="time">${s.time||"--:--"}</div>
      <div>
        <div class="place">${s.place||"未命名行程"}</div>
        <div class="meta">📍 ${s.location||"未設定地點"}</div>
        <div class="meta">${s.note||""}</div>
        <button class="link danger" onclick="deleteSchedule(${day.id},${s.id})">刪除</button>
      </div>
      <div class="photo">${s.icon||"🏛️"}</div>
    </div>`).join("") : `<p class="muted">今天還沒有行程，點「＋新增」開始塞進旅行寶石吧。</p>`;

  const totalMoney=(data.budget||[]).reduce((s,x)=>s+Number(x.amount||0),0);
  $("totalAmount").textContent=totalMoney.toLocaleString();
  $("budgetBar").style.width=Math.min(100,totalMoney/30000*100)+"%";

  $("stayPreview").innerHTML=(data.stay||[]).slice(0,2).map(x=>`<b>${x.name}</b><br><span>${x.date||""}</span>`).join("<hr>")||"尚未新增住宿";
  $("flightPreview").innerHTML=(data.flight||[]).slice(0,2).map(x=>`<b>${x.no}</b><br><span>${x.time||""}</span>`).join("<hr>")||"尚未新增航班";
}
function selectDay(id){selectedDayId=id;render()}
function moveDay(n){
  const idx=selectedIndex()+n;
  if(data.days[idx]) selectedDayId=data.days[idx].id;
  render();
}
function modalForm(title, html){
  $("modalTitle").textContent = title;
  $("modalBody").innerHTML = html;
  const m = $("modal");
  if (m && typeof m.showModal === "function") {
    m.showModal();
  } else {
    alert("請用 Safari / Chrome 開啟，或更新瀏覽器後再試一次");
  }
}
function openSettings(){
  modalForm("旅程設定",`
    <div class="form">
      <input id="mTitle" value="${data.title||""}" placeholder="主標題">
      <input id="mSub" value="${data.subtitle||""}" placeholder="副標題">
      <button class="primary" onclick="saveSettings()">儲存</button>
    </div>`);
}
function saveSettings(){data.title=$("mTitle").value;data.subtitle=$("mSub").value;$("modal").close();save()}
function openDayForm(){
  modalForm("新增日期",`
    <div class="form">
      <input id="dDate" type="date">
      <input id="dTitle" placeholder="例如 Day 4｜富國島">
      <button class="primary" onclick="addDay()">新增</button>
    </div>`);
}
function addDay(){
  const date = $("dDate")?.value || "";
  const title = $("dTitle")?.value || `Day ${(data.days||[]).length + 1}`;
  const day = { id: Date.now(), date, title, schedules: [] };
  if (!Array.isArray(data.days)) data.days = [];
  data.days.push(day);
  selectedDayId = day.id;
  $("modal").close();
  save();
}
function openEditDay(id){
  const d = (data.days || []).find(x => x.id === id);
  if(!d) return;
  modalForm("修改日期",`
    <div class="form">
      <input id="editDayDate" type="date" value="${d.date || ""}">
      <input id="editDayTitle" placeholder="日期標題，例如 Day 1｜胡志明" value="${d.title || ""}">
      <button class="primary" onclick="saveEditDay(${id})">儲存修改</button>
      <button class="primary danger" onclick="deleteDay(${id})">刪除日期</button>
    </div>`);
}
function saveEditDay(id){
  const d = (data.days || []).find(x => x.id === id);
  if(!d) return;
  d.date = $("editDayDate").value || "";
  d.title = $("editDayTitle").value || d.title || "";
  $("modal").close();
  save();
}
function deleteDay(id){
  if(!confirm("確定要刪除這個日期嗎？裡面的行程也會一起刪掉。")) return;
  data.days = (data.days || []).filter(x => x.id !== id);
  selectedDayId = data.days[0]?.id || null;
  $("modal").close();
  save();
}
function openScheduleForm(){
  if(!selectedDayId) return openDayForm();
  modalForm("新增今日行程",`
    <div class="form">
      <input id="sTime" placeholder="時間，例如 08:00">
      <input id="sPlace" placeholder="行程，例如 米蘭 → 威尼斯">
      <input id="sLocation" placeholder="地點，例如 威尼斯">
      <input id="sIcon" placeholder="圖示，例如 🏛️ 🍝 🚕">
      <textarea id="sNote" placeholder="交通、備註、推薦餐廳"></textarea>
      <button class="primary" onclick="addSchedule()">新增</button>
    </div>`);
}
function addSchedule(){
  const d=selectedDay(); if(!d) return;
  d.schedules.push({id:Date.now(),time:$("sTime").value,place:$("sPlace").value,location:$("sLocation").value,icon:$("sIcon").value,note:$("sNote").value});
  $("modal").close(); save();
}
function deleteSchedule(dayId,id){const d=data.days.find(x=>x.id===dayId);d.schedules=d.schedules.filter(s=>s.id!==id);save()}
function openBudgetForm(){
  modalForm("新增花費",`
    <div class="form">
      <input id="bItem" placeholder="項目">
      <input id="bAmount" type="number" placeholder="金額">
      <button class="primary" onclick="addBudget()">新增</button>
    </div>`);
}
function addBudget(){data.budget.push({id:Date.now(),item:$("bItem").value,amount:Number($("bAmount").value||0)});$("modal").close();save()}
function showPage(page, btn){
  document.querySelectorAll(".bottom-nav button").forEach(b=>b.classList.remove("active"));
  if(btn){
    btn.classList.add("active");
  }else if(page==="home"){
    document.querySelector(".home-tab")?.classList.add("active");
  }
  if(page==="home"){render();return}
  const content = {
    allSchedule: allScheduleHtml(),
    budget: listEditor("記帳本","budget"),
    spots: simpleEditor("景點收藏","spots",["name","note"]),
    stay: simpleEditor("住宿資訊","stay",["name","date","note"]),
    flight: simpleEditor("航班資訊","flight",["no","time","note"]),
    packing: packingHtml(),
    album: `<p class="muted">相簿可先貼照片網址，之後也能再升級成上傳照片。</p>`+simpleEditor("相簿","album",["url","note"]),
    map: `<div class="form"><input id="mapQ" placeholder="輸入景點"><button class="primary" onclick="openMap()">開啟 Google Maps</button></div>`,
    more: `<div class="form"><button class="primary" onclick="showPage('stay')">住宿資訊</button><button class="primary" onclick="showPage('flight')">航班資訊</button><button class="primary" onclick="showPage('packing')">行李清單</button><button class="primary" onclick="exportPDF()">匯出PDF</button></div>`
  };
  modalForm(page, content[page]||"");
}
function allScheduleHtml(){
  return (data.days||[]).map((d,i)=>`<div class="list-card"><b>Day ${i+1}｜${d.date||""}</b>${(d.schedules||[]).map(s=>`<p>${s.time} ${s.place}</p>`).join("")}</div>`).join("");
}
function listEditor(title,type){
  return `<button class="primary" onclick="openBudgetForm()">新增</button>`+(data.budget||[]).map(x=>`<div class="list-card"><b>${x.item}</b><p>${x.amount}</p><button onclick="remove('${type}',${x.id})">刪除</button></div>`).join("");
}
function simpleEditor(title,type,keys){
  return `<div class="form">${keys.map(k=>`<input id="${type}_${k}" placeholder="${k}">`).join("")}<button class="primary" onclick="addSimple('${type}','${keys.join(",")}')">新增</button></div>`+
  (data[type]||[]).map(x=>`<div class="list-card">${keys.map(k=>`<p><b>${k}</b> ${x[k]||""}</p>`).join("")}<button onclick="remove('${type}',${x.id})">刪除</button></div>`).join("");
}
function addSimple(type,keysStr){
  const keys=keysStr.split(","); const obj={id:Date.now()};
  keys.forEach(k=>obj[k]=$(`${type}_${k}`).value);
  data[type].push(obj); save(); showPage(type);
}
function packingHtml(){
  return `<div class="form"><input id="packName" placeholder="物品"><button class="primary" onclick="addPack()">新增</button></div>`+
  (data.packing||[]).map(x=>`<div class="list-card"><label><input type="checkbox" ${x.done?"checked":""} onchange="togglePack(${x.id})"> ${x.name}</label><br><button onclick="remove('packing',${x.id})">刪除</button></div>`).join("");
}
function addPack(){data.packing.push({id:Date.now(),name:$("packName").value,done:false});save();showPage("packing")}
function togglePack(id){const x=data.packing.find(i=>i.id===id);x.done=!x.done;save()}
function remove(type,id){data[type]=data[type].filter(x=>x.id!==id);save();showPage(type)}
function openMap(){const q=$("mapQ")?.value||""; if(q) window.open("https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(q),"_blank")}
function shareSite(){navigator.share?navigator.share({title:data.title,url:location.href}):alert(location.href)}
function exportPDF(){window.print()}


document.addEventListener("click", function(e){
  const addBtn = e.target.closest(".add-date");
  if(addBtn){
    e.preventDefault();
    openDayForm();
  }
});
