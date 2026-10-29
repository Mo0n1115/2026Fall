import {createDemoArrivals,arrivalState} from './arrivals.mjs';
import {demoCars,seatingCandidates} from './seating.mjs';
import {fixture,normalize,recommend} from './routes.mjs';
const $=id=>document.getElementById(id);
let chosen=null,step=0,choices=[];
const routes=normalize(fixture);
let preference='comfort';
let arrivalSnapshots=createDemoArrivals(routes);
let arrivalBindings=[];
function tickArrivals(){arrivalBindings=arrivalBindings.filter(binding=>binding.node.isConnected);for(const binding of arrivalBindings){const snapshot=binding.key?arrivalSnapshots.get(binding.key):binding.snapshot;const arrivalAt=binding.key?snapshot?.vehicles?.[0]?.arrivalAt:binding.arrivalAt;const state=arrivalState(snapshot,arrivalAt);binding.node.textContent=state.text;binding.node.dataset.state=state.kind;}}
function renderArrivals(route){
 const section=$('arrivals');section.replaceChildren();
 const title=document.createElement('h3');title.textContent='도착 정보';section.append(title);
 const note=document.createElement('p');note.className='muted';note.textContent='예시 시각 · 실제 도착 미연동';section.append(note);
 route.legs.forEach((leg,index)=>{if(!['SUBWAY','BUS'].includes(leg.mode))return;
 const box=document.createElement('div');box.className='arrival-panel';const h=document.createElement('h4');h.textContent=`${leg.mode==='SUBWAY'?'열차':'버스'} · ${leg.route} / ${leg.start.name}`;box.append(h);
 const snapshot=arrivalSnapshots.get(`${route.id}:${index}`);const meta=document.createElement('p');meta.className='muted';meta.textContent=snapshot?`예시 생성 ${new Date(snapshot.observedAt).toLocaleTimeString('ko-KR')} · 유효 2분`:'도착 정보 없음';box.append(meta);
 for(const [i,vehicle] of (snapshot?.vehicles||[{arrivalAt:null}]).entries()){const row=document.createElement('p');row.className='arrival-row';const label=document.createElement('span');label.textContent=i===0?'첫 차량':'다음 차량';const value=document.createElement('strong');row.append(label,value);box.append(row);arrivalBindings.push({node:value,snapshot,arrivalAt:vehicle.arrivalAt});}
 section.append(box);});
 const refresh=document.createElement('button');refresh.className='secondary';refresh.textContent='예시 갱신';refresh.onclick=()=>{const next=createDemoArrivals([route]);for(const [key,value] of next)arrivalSnapshots.set(key,value);renderArrivals(route);};section.append(refresh);tickArrivals();
}
let arrivalInterval=setInterval(tickArrivals,1000);
window.addEventListener('pagehide',()=>{clearInterval(arrivalInterval);arrivalInterval=null;});
window.addEventListener('pageshow',()=>{tickArrivals();if(arrivalInterval===null)arrivalInterval=setInterval(tickArrivals,1000);});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)tickArrivals();});
function renderSeating(route){
 const section=$('seating');section.replaceChildren();
 const heading=document.createElement('h3');heading.textContent='추천 승차 위치';section.append(heading);
 const subway=route.legs.filter(l=>l.mode==='SUBWAY');
 if(!subway.length){const p=document.createElement('p');p.textContent='지하철 구간 없음';section.append(p);return;}
 for(const leg of subway){const box=document.createElement('div');box.className='seat-panel';const title=document.createElement('h4');title.textContent=leg.route;box.append(title);
 const cars=seatingCandidates(demoCars);const best=cars[0];
 const description=document.createElement('p');description.textContent=best?`추천 ${best.position} · ${best.car}칸 (예시)`:'칸별 좌석 정보 없음';box.append(description);
 const note=document.createElement('p');note.className='muted';note.textContent='일반 좌석 기준 · 노약자석·임산부석 제외 · 칸-문 위치는 예시';box.append(note);
 const grid=document.createElement('div');grid.className='car-grid';for(const car of [...cars].sort((a,b)=>a.car-b.car)){const cell=document.createElement('div');cell.className=car.car===best?.car?'car recommended':'car';cell.textContent=`${car.car}칸${car.car===best?.car?' · 추천':''} · 빈좌석 ${car.availableGeneralSeats}석 · 입석 ${car.standingPassengers}명`;grid.append(cell);}box.append(grid);
 const reason=document.createElement('p');reason.className='muted';reason.textContent='빈좌석 많은 순 → 입석 적은 순 · 착석 보장 없음';box.append(reason);section.append(box);}
}

function bindArrival(node,route,index){
 arrivalBindings.push({node,key:`${route.id}:${index}`});
}
function congestionText(route){return route.congestion===null?'혼잡 --':route.congestion===1?'여유':'혼잡';}
function routeSummary(route){
 const wrapper=document.createElement('div');wrapper.className='route-summary';
 const bar=document.createElement('div');bar.className='segment-bar';bar.setAttribute('aria-label','구간별 예상 이동 시간');
 route.legs.forEach(leg=>{const segment=document.createElement('span');segment.className=`segment ${leg.mode.toLowerCase()}`;segment.style.flexGrow=String(leg.sectionTime);segment.style.flexBasis='0';segment.textContent=`${Math.round(leg.sectionTime/60)}분`;segment.title=`${leg.mode==='WALK'?'도보':leg.route} ${Math.round(leg.sectionTime/60)}분`;bar.append(segment);});wrapper.append(bar);
 route.legs.forEach((leg,index)=>{
  if(leg.mode==='WALK')return;
  const row=document.createElement('div');row.className='transit-summary';
  const heading=document.createElement('p');heading.className='transit-name';heading.textContent=`${leg.mode==='BUS'?'버스':'지하철'} · ${leg.route} / ${leg.start.name} 승차`;row.append(heading);
  const facts=document.createElement('div');facts.className='vehicle-facts';const eta=document.createElement('strong');bindArrival(eta,route,index);facts.append(eta);
  const congestion=document.createElement('span');congestion.className=`crowding ${route.congestion===1?'quiet':'busy'}`;congestion.textContent=`${congestionText(route)} · 예시`;facts.append(congestion);
  if(leg.mode==='SUBWAY'){const best=seatingCandidates(demoCars)[0];const seat=document.createElement('span');seat.textContent=best?`승차 ${best.position} · 빈좌석 ${best.availableGeneralSeats}석(예시)`:'좌석 --';facts.append(seat);}else{const seat=document.createElement('span');seat.textContent='잔여석 --';facts.append(seat);}
  row.append(facts);wrapper.append(row);
 });
 return wrapper;
}
function instructions(route){return route.legs.map(leg=>leg.mode==='WALK'?'도보 · 동선 미연동':`${leg.start.name} → ${leg.end.name} · 행선지·승강장 미연동`);}
function stopGps(){window.teumStopLocation?.();}
function closeGuide(){
 stopGps();$('navigation').hidden=true;$('live-guide').hidden=true;document.body.classList.remove('guiding');$('start').hidden=false;
 window.dispatchEvent(new Event('teum-panel-change'));
}
function guideSummary(){
 const leg=chosen.legs[step];$('guide-route').textContent=leg.mode==='WALK'?'도보 이동':`${leg.route} · ${leg.start.name}`;
 $('guide-progress').textContent=`${step+1} / ${chosen.legs.length} 단계`;
 $('guide-facts').replaceChildren();
 if(leg.mode!=='WALK'){
  const row=document.createElement('div');row.className='vehicle-facts';const eta=document.createElement('strong');bindArrival(eta,chosen,step);row.append(eta);
  const text=document.createElement('span');text.className=`crowding ${chosen.congestion===1?'quiet':'busy'}`;text.textContent=`${congestionText(chosen)} · 예시`;row.append(text);
  const stops=document.createElement('span');stops.textContent='정거장 --';row.append(stops);$('guide-facts').append(row);
  if(leg.mode==='SUBWAY'){const p=document.createElement('p');const best=seatingCandidates(demoCars)[0];p.textContent=best?`승차 ${best.position} · 일반석 기준 · 예시`:'승차 위치 --';$('guide-facts').append(p);}
 }
 tickArrivals();window.teumFocusLeg?.(leg);
}
function render(){
 if(!$('live-guide').hidden)closeGuide();
 $('navigation').hidden=true;$('start').hidden=false;$('detail').hidden=true;
 const {fast,comfortable}=recommend(routes,Number($('extra').value));
 choices=[{label:'편하게 이동',route:comfortable,kind:'comfort'},{label:'가장 빠르게 이동',route:fast,kind:'fast'}].filter(c=>c.route);
 const selected=choices.find(c=>c.kind===preference);
 window.teumSetRoutes?.(choices,selected?.kind);
 window.teumSelectRoute?.(selected?.kind);
 $('results').replaceChildren();
 const title=document.createElement('h2');title.textContent=`${$('origin').value.trim()} → ${$('destination').value.trim()}`;$('results').append(title);
 for(const [label,route,kind] of [['편하게 이동',comfortable,'comfort'],['가장 빠르게 이동',fast,'fast']]){
  const card=document.createElement('article');card.className=`card ${kind}`;card.dataset.kind=kind;
  if(!route){card.textContent='혼잡도 비교 불가';$('results').append(card);continue;}
  card.innerHTML=`<div class="card-heading"><div><h3>${label}</h3><div class="time">${Math.round(route.seconds/60)}<small>분</small></div></div><span class="pill">예시 경로</span></div><div class="metrics"><span>환승 ${route.transfers}회</span><span>도보 ${route.walk}m</span><span>추가 ${Math.round((route.seconds-fast.seconds)/60)}분</span></div>`;
  card.append(routeSummary(route));
  const button=document.createElement('button');button.textContent='경로 선택';button.onclick=()=>show(route,label,kind);card.append(button);$('results').append(card);
 }
 const selectedChoice=choices.find(c=>c.kind===preference);if(selectedChoice)show(selectedChoice.route,selectedChoice.label,selectedChoice.kind,false);
 if(fast&&comfortable?.id===fast.id){const p=document.createElement('p');p.textContent='빠른 길 = 편한 길 · 현재 시간 조건';$('results').append(p);}
}
function show(route,label,kind,focus=true){if(!$('live-guide').hidden)closeGuide();preference=kind;const radio=document.querySelector(`input[name=preference][value=${kind}]`);if(radio)radio.checked=true;window.teumSelectRoute?.(kind);document.querySelectorAll('.card').forEach(card=>card.classList.toggle('selected',card.dataset.kind===kind));$('navigation').hidden=true;$('start').hidden=false;chosen=route;step=0;$('detail').hidden=false;$('detail-title').textContent=`${label} · ${route.seconds/60}분`;document.querySelector('.sheet-toolbar h1').textContent=`${route.seconds/60}분 · ${kind==='fast'?'빠르게':'편하게'}`;document.querySelector('.sheet-subtitle').textContent=`${$('origin').value.trim()} → ${$('destination').value.trim()} · 예시`;$('steps').replaceChildren();for(const text of instructions(route)){const li=document.createElement('li');li.textContent=text;$('steps').append(li);}renderSeating(route);renderArrivals(route);tickArrivals();if(focus)$('detail').focus();}
function updateStep(){guideSummary();const list=instructions(chosen);$('current').textContent=`${step+1}/${list.length} · ${list[step]}`;$('previous').disabled=step===0;$('next').textContent=step===list.length-1?'도착 완료':'다음 단계';[...$('steps').children].forEach((li,i)=>li.classList.toggle('active',i===step));}
$('search').onsubmit=e=>{e.preventDefault();if(!$('origin').value.trim()||!$('destination').value.trim())return;render();};
document.querySelectorAll('input[name=preference]').forEach(radio=>radio.addEventListener('change',()=>{preference=radio.value;render();}));
$('extra').addEventListener('change',render);
$('start').onclick=()=>{$('live-guide').hidden=false;document.body.classList.add('guiding');$('navigation').hidden=false;$('start').hidden=true;step=0;updateStep();};
$('previous').onclick=()=>{step=Math.max(0,step-1);updateStep();};
$('next').onclick=()=>{if(step===chosen.legs.length-1){closeGuide();$('current').textContent='';$('steps').querySelectorAll('.active').forEach(li=>li.classList.remove('active'));return;}step++;updateStep();};
$('end').onclick=()=>{closeGuide();$('steps').querySelectorAll('.active').forEach(li=>li.classList.remove('active'));};
$('json').textContent=JSON.stringify(fixture,null,2);render();

window.addEventListener('teum-route-pick',e=>{const c=choices.find(c=>c.kind===e.detail);if(c)show(c.route,c.label,c.kind);});

$('toggle-sheet').onclick=()=>{
 const collapsed=$('route-sheet').classList.toggle('collapsed');
 $('sheet-content').hidden=collapsed;
 $('toggle-sheet').textContent=collapsed?'열기 ↑':'접기 ↓';
 $('toggle-sheet').setAttribute('aria-expanded',String(!collapsed));
 document.body.classList.toggle('sheet-collapsed',collapsed);
 window.dispatchEvent(new Event('teum-panel-change'));
};
