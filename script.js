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

let selectedDayId = null;

let data = {
  title: "胡志明 & 富國島",
  subtitle: "多人共用・雲端同步・旅行小宇宙",
  theme: "cream",
  days: [
    {id: 1, title: "Day 1｜胡志明市", date: "", schedules: []},
    {id: 2, title: "Day 2｜胡志明市", date: "", schedules: []},
    {id: 3, title: "Day 3｜富國島", date: "", schedules: []}
  ],
  itinerary: [],
  budget: [],
  spots: [],
  stay: [],
  flight: [],
  packing: []
};

tripRef.on("value", snap => {
  if (snap.exists()) data = {...data, ...snap.val()};

  // 舊版資料轉成新版日期卡
  if ((!data.days || !data.days.length) && data.itinerary && data.itinerary.length) {
    const grouped = {};
    data.itinerary.forEach(item => {
      const day = item.vals?.[0] || "未分類日期";
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push({id:item.id, time:item.vals?.[1]||"", place:item.vals?.[2]||"", note:item.vals?.[3]||""});
    });
    data.days = Object.keys(grouped).map((title, idx)=>({id:Date.now()+idx, title, date:"", schedules:grouped[title]}));
  }

  if (!data.days) data.days = [];
  if (!selectedDayId && data.days.length) selectedDayId = data.days[0].id;
  render();
});

function save(){ tripRef.set(data); }

function showTab(id){
  document.querySelectorAll(".panel,.tab").forEach(el=>el.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  event.target.classList.add("active");
}

function openSettings(){
  document.getElementById("setTitle").value = data.title || "";
  document.getElementById("setSubtitle").value = data.subtitle || "";
  document.getElementById("setTheme").value = data.theme || "cream";
  document.getElementById("settings").showModal();
}
function closeSettings(){ document.getElementById("settings").close(); }
function saveSettings(){
  data.title = document.getElementById("setTitle").value || "我的旅行";
  data.subtitle = document.getElementById("setSubtitle").value || "";
  data.theme = document.getElementById("setTheme").value || "cream";
  closeSettings(); save();
}

function addDay(){
  const date = document.getElementById("newDayDate").value;
  const title = document.getElementById("newDayTitle").value.trim() || `Day ${data.days.length + 1}`;
  const day = {id: Date.now(), title, date, schedules: []};
  data.days.push(day);
  selectedDayId = day.id;
  document.getElementById("newDayDate").value = "";
  document.getElementById("newDayTitle").value = "";
  save();
}

function selectDay(id){
  selectedDayId = id;
  render();
}

function removeDay(id){
  if(!confirm("確定要刪除這一天嗎？")) return;
  data.days = data.days.filter(d=>d.id!==id);
  selectedDayId = data.days[0]?.id || null;
  save();
}

function addScheduleToSelectedDay(){
  if(!selectedDayId) return alert("請先新增一個日期");
  const day = data.days.find(d=>d.id===selectedDayId);
  const time = timeInput.value.trim();
  const place = placeInput.value.trim();
  const note = noteInput.value.trim();
  if(!time && !place && !note) return alert("請先輸入行程");
  day.schedules.push({id:Date.now(), time, place, note});
  timeInput.value=""; placeInput.value=""; noteInput.value="";
  save();
}

function removeSchedule(dayId, scheduleId){
  const day = data.days.find(d=>d.id===dayId);
  if(day){ day.schedules = day.schedules.filter(s=>s.id!==scheduleId); save(); }
}

function addItem(type){
  const map = {
    spots:["spotName","spotNote"],
    stay:["stayName","stayDate","stayNote"],
    flight:["flightNo","flightTime","flightNote"]
  };
  const vals = map[type].map(id=>document.getElementById(id).value.trim());
  if(!vals.some(Boolean)) return alert("請先輸入內容");
  data[type].push({id:Date.now(), vals});
  map[type].forEach(id=>document.getElementById(id).value="");
  save();
}

function addBudget(){
  const item = budgetItem.value.trim();
  const amount = Number(budgetAmount.value || 0);
  if(!item && !amount) return alert("請輸入花費");
  data.budget.push({id:Date.now(), item, amount});
  budgetItem.value=""; budgetAmount.value="";
  save();
}
function addPacking(){
  const item = packItem.value.trim();
  if(!item) return;
  data.packing.push({id:Date.now(), item, done:false});
  packItem.value=""; save();
}
function togglePacking(id){
  const x=data.packing.find(i=>i.id===id); if(x){x.done=!x.done; save();}
}
function removeItem(type,id){
  data[type]=data[type].filter(x=>x.id!==id); save();
}
function openMap(){
  const q = document.getElementById("mapName").value.trim();
  if(q) window.open("https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(q), "_blank");
}
function exportPDF(){ window.print(); }

function renderItinerary(){
  dayTabs.innerHTML = (data.days||[]).map(d=>`
    <button class="day-card ${d.id===selectedDayId?'active':''}" onclick="selectDay(${d.id})">
      <b>${d.title}</b>
      <small>${d.date || "未設定日期"}</small>
    </button>
  `).join("");

  const day = (data.days||[]).find(d=>d.id===selectedDayId);
  if(!day){
    itineraryList.innerHTML = `<div class="card">請先新增日期，再開始安排行程。</div>`;
    return;
  }

  itineraryList.innerHTML = `
    <div class="card">
      <div class="schedule-head">
        <div><b>${day.title}</b><div class="small">${day.date || "未設定日期"}</div></div>
        <button onclick="removeDay(${day.id})">刪除日期</button>
      </div>
    </div>
    ${(day.schedules||[]).map(s=>`
      <div class="card">
        <div><b>${s.time || "未設定時間"}</b></div>
        <div>${s.place || ""}</div>
        <div class="small">${s.note || ""}</div>
        <div class="actions"><button onclick="removeSchedule(${day.id},${s.id})">刪除</button></div>
      </div>
    `).join("")}
  `;
}

function renderCards(type, el, labels=[]){
  document.getElementById(el).innerHTML = (data[type]||[]).map(x=>{
    let body = (x.vals||[]).map((v,i)=>v?`<div><b>${labels[i]||""}</b> ${v}</div>`:"").join("");
    return `<div class="card">${body}<div class="actions"><button onclick="removeItem('${type}',${x.id})">刪除</button></div></div>`;
  }).join("");
}

function render(){
  document.body.className = data.theme || "cream";
  tripTitle.textContent = data.title || "我的旅行";
  tripSubtitle.textContent = data.subtitle || "";
  renderItinerary();
  renderCards("spots","spotsList",["景點","備註"]);
  renderCards("stay","stayList",["住宿","日期","備註"]);
  renderCards("flight","flightList",["航班","時間","備註"]);

  budgetList.innerHTML = (data.budget||[]).map(x=>`<div class="card"><b>${x.item}</b><div>${x.amount}</div><div class="actions"><button onclick="removeItem('budget',${x.id})">刪除</button></div></div>`).join("");
  totalAmount.textContent = (data.budget||[]).reduce((s,x)=>s+Number(x.amount||0),0).toLocaleString();

  packingList.innerHTML = (data.packing||[]).map(x=>`<div class="card"><label><input type="checkbox" ${x.done?"checked":""} onchange="togglePacking(${x.id})"> ${x.item}</label><div class="actions"><button onclick="removeItem('packing',${x.id})">刪除</button></div></div>`).join("");
}
