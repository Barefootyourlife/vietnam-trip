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

let data = {
  title: "胡志明 & 富國島",
  subtitle: "多人共用・雲端同步・旅行小宇宙",
  theme: "cream",
  itinerary: [],
  budget: [],
  spots: [],
  stay: [],
  flight: [],
  packing: []
};

tripRef.on("value", snap => {
  if (snap.exists()) data = {...data, ...snap.val()};
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

function addItem(type){
  const map = {
    itinerary:["dayInput","timeInput","placeInput","noteInput"],
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
  renderCards("itinerary","itineraryList",["日期","時間","行程","備註"]);
  renderCards("spots","spotsList",["景點","備註"]);
  renderCards("stay","stayList",["住宿","日期","備註"]);
  renderCards("flight","flightList",["航班","時間","備註"]);

  budgetList.innerHTML = (data.budget||[]).map(x=>`<div class="card"><b>${x.item}</b><div>${x.amount}</div><div class="actions"><button onclick="removeItem('budget',${x.id})">刪除</button></div></div>`).join("");
  totalAmount.textContent = (data.budget||[]).reduce((s,x)=>s+Number(x.amount||0),0).toLocaleString();

  packingList.innerHTML = (data.packing||[]).map(x=>`<div class="card"><label><input type="checkbox" ${x.done?"checked":""} onchange="togglePacking(${x.id})"> ${x.item}</label><div class="actions"><button onclick="removeItem('packing',${x.id})">刪除</button></div></div>`).join("");
}
