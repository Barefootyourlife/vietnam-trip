const $ = id => document.getElementById(id);
let data = JSON.parse(localStorage.getItem('tripPlannerData') || '{}');
let selectedDay = data.selectedDay || 0;

const defaults = {
  tripName: '越南胡志明＆富國島自由行',
  startDate: '',
  dayCount: 5,
  days: []
};
data = {...defaults, ...data};

function save(){ localStorage.setItem('tripPlannerData', JSON.stringify(data)); }
function fmt(date){ return date.toISOString().slice(0,10); }
function weekday(date){ return ['SUN','MON','TUE','WED','THU','FRI','SAT'][date.getDay()]; }

function generateDays(){
  const start = $('startDate').value;
  const count = Math.max(1, Number($('dayCount').value || 1));
  data.tripName = $('tripName').value || defaults.tripName;
  data.startDate = start;
  data.dayCount = count;
  if(!start){ alert('請先選出發日期'); return; }
  const oldDays = data.days || [];
  data.days = Array.from({length: count}, (_,i)=>{
    const d = new Date(start + 'T00:00:00'); d.setDate(d.getDate()+i);
    return oldDays[i] || {date: fmt(d), schedules: []};
  });
  selectedDay = Math.min(selectedDay, count-1); data.selectedDay = selectedDay;
  save(); render();
}

function renderDates(){
  const box = $('dateStrip'); box.innerHTML='';
  data.days.forEach((day,i)=>{
    const d = new Date(day.date + 'T00:00:00');
    const btn = document.createElement('button');
    btn.className = 'date-item' + (i===selectedDay?' active':'');
    btn.innerHTML = `<em>${weekday(d)} D${i+1}</em><strong>${d.getDate()}</strong><span>${d.getMonth()+1}月</span>`;
    btn.onclick = ()=>{selectedDay=i; data.selectedDay=i; save(); render();};
    box.appendChild(btn);
  });
}

function renderSchedules(){
  const list = $('scheduleList'); list.innerHTML='';
  const day = data.days[selectedDay];
  if(!day){ list.innerHTML='<p class="empty">先設定日期，就能開始塞滿旅行小紙條 🧳</p>'; return; }
  const schedules = [...(day.schedules||[])].sort((a,b)=>a.time.localeCompare(b.time));
  if(!schedules.length){ list.innerHTML='<p class="empty">今天還沒有行程，按「新增」開始安排。</p>'; return; }
  schedules.forEach(item=>{
    const div = document.createElement('div'); div.className='schedule-item';
    div.innerHTML = `<div class="time">${item.time||'--:--'}</div><div><div class="place">${item.title}</div><div class="city">${item.city||''}</div>${item.note?`<div class="note">${item.note}</div>`:''}</div><button class="edit-btn">✎</button>`;
    div.querySelector('button').onclick = ()=>openEditor(item);
    list.appendChild(div);
  });
}

function openEditor(item={}){
  $('editorCard').classList.add('show');
  $('editId').value = item.id || '';
  $('timeInput').value = item.time || '';
  $('titleInput').value = item.title || '';
  $('cityInput').value = item.city || '';
  $('noteInput').value = item.note || '';
  $('editorCard').scrollIntoView({behavior:'smooth'});
}
function closeEditor(){ $('editorCard').classList.remove('show'); }
function saveSchedule(){
  if(!data.days[selectedDay]) return alert('請先產生日期');
  const title = $('titleInput').value.trim();
  if(!title) return alert('請輸入行程標題');
  const id = $('editId').value || crypto.randomUUID();
  const item = {id, time:$('timeInput').value, title, city:$('cityInput').value.trim(), note:$('noteInput').value.trim()};
  const arr = data.days[selectedDay].schedules || [];
  const idx = arr.findIndex(x=>x.id===id);
  if(idx>=0) arr[idx]=item; else arr.push(item);
  data.days[selectedDay].schedules = arr;
  save(); closeEditor(); render();
}
function render(){ $('tripName').value=data.tripName; $('startDate').value=data.startDate; $('dayCount').value=data.dayCount; renderDates(); renderSchedules(); }

$('generateDays').onclick = generateDays;
$('addSchedule').onclick = ()=>openEditor();
$('saveSchedule').onclick = saveSchedule;
$('cancelEdit').onclick = closeEditor;
$('clearAll').onclick = ()=>{ if(confirm('確定要清空所有行程嗎？')){localStorage.removeItem('tripPlannerData'); location.reload();} };

if(!data.days.length){
  const today = new Date();
  $('startDate').value = fmt(today);
}else render();
