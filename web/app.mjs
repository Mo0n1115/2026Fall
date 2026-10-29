import {createDemoArrivals,arrivalState} from './arrivals.mjs';
import {demoCars,seatingCandidates} from './seating.mjs';
import {fixture,normalize,recommend} from './routes.mjs';
const $=id=>document.getElementById(id);
let chosen=null,step=0,choices=[];
const routes=normalize(fixture);
let preference='comfort';
let arrivalSnapshots=createDemoArrivals(routes);
let arrivalBindings=[];
function tickArrivals(){for(const {node,snapshot,arrivalAt} of arrivalBindings){const state=arrivalState(snapshot,arrivalAt);node.textContent=state.text;node.dataset.state=state.kind;}}
function renderArrivals(route){
 const section=$('arrivals');section.replaceChildren();arrivalBindings=[];
 const title=document.createElement('h3');title.textContent='열차·버스 도착 타이머';section.append(title);
 const note=document.createElement('p');note.className='muted';note.textContent='예시 시각으로 진행되는 카운트다운입니다. 실제 도착 정보가 아닙니다. 남은 시간은 현재 시각 기준이며 승차 가능 여부나 환승 성공을 보장하지 않습니다.';section.append(note);
 route.legs.forEach((leg,index)=>{if(!['SUBWAY','BUS'].includes(leg.mode))return;
 const box=document.createElement('div');box.className='arrival-panel';const h=document.createElement('h4');h.textContent=`${leg.mode==='SUBWAY'?'열차':'버스'} · ${leg.route} / ${leg.start.name}`;box.append(h);
 const snapshot=arrivalSnapshots.get(`${route.id}:${index}`);const meta=document.createElement('p');meta.className='muted';meta.textContent=snapshot?`예시 생성 ${new Date(snapshot.observedAt).toLocaleTimeString('ko-KR')} · 2분 후 갱신 필요 · 실제 행선지·차량 번호 미확인`:'도착 정보 없음';box.append(meta);
 for(const [i,vehicle] of (snapshot?.vehicles||[{arrivalAt:null}]).entries()){const row=document.createElement('p');row.className='arrival-row';const label=document.createElement('span');label.textContent=i===0?'첫 번째 예시 차량':'다음 예시 차량';const value=document.createElement('strong');row.append(label,value);box.append(row);arrivalBindings.push({node:value,snapshot,arrivalAt:vehicle.arrivalAt});}
 section.append(box);});
 const refresh=document.createElement('button');refresh.className='secondary';refresh.textContent='예시 도착 정보 새로 만들기';refresh.onclick=()=>{const next=createDemoArrivals([route]);for(const [key,value] of next)arrivalSnapshots.set(key,value);renderArrivals(route);};section.append(refresh);tickArrivals();
}
let arrivalInterval=setInterval(tickArrivals,1000);
window.addEventListener('pagehide',()=>{clearInterval(arrivalInterval);arrivalInterval=null;});
window.addEventListener('pageshow',()=>{tickArrivals();if(arrivalInterval===null)arrivalInterval=setInterval(tickArrivals,1000);});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)tickArrivals();});
function renderSeating(route){
 const section=$('seating');section.replaceChildren();
 const heading=document.createElement('h3');heading.textContent='앉아서 가기 위한 승차 위치';section.append(heading);
 const subway=route.legs.filter(l=>l.mode==='SUBWAY');
 if(!subway.length){const p=document.createElement('p');p.textContent='이 예시 경로에는 지하철 구간이 없습니다.';section.append(p);return;}
 for(const leg of subway){const box=document.createElement('div');box.className='seat-panel';const title=document.createElement('h4');title.textContent=leg.route;box.append(title);
 const cars=seatingCandidates(demoCars);const best=cars[0];
 const description=document.createElement('p');description.textContent=best?`예시 추천: ${best.car}번째 칸 · 승차 위치 ${best.position}`:'칸별 좌석 정보가 없어 추천할 수 없습니다.';box.append(description);
 const note=document.createElement('p');note.className='muted';note.textContent='합성 좌석 배치·점유 예시입니다. 노약자석·임산부석은 일반 착석 후보에서 제외합니다. 승차 위치(칸-문)는 승강장 번호가 아닙니다. 실제 위치·착석 확률은 미확인입니다.';box.append(note);
 const grid=document.createElement('div');grid.className='car-grid';for(const car of [...cars].sort((a,b)=>a.car-b.car)){const cell=document.createElement('div');cell.className=car.car===best?.car?'car recommended':'car';cell.textContent=`${car.car}칸${car.car===best?.car?' · 추천':''} / 일반 빈좌석 ${car.availableGeneralSeats} / 입석 ${car.standingPassengers}명`;grid.append(cell);}box.append(grid);
 const reason=document.createElement('p');reason.className='muted';reason.textContent='비교 기준: 일반 빈좌석이 많은 칸 → 입석 인원이 적은 칸. 실제 배려석 배치·점유와 칸별 데이터 연동이 필요하며 확률(%)이나 좌석 확보를 보장하지 않습니다.';box.append(reason);section.append(box);}
}

function instructions(route){return route.legs.map(leg=>leg.mode==='WALK'?'도보 구간을 확인하세요. 실제 길안내는 아직 연결되지 않았습니다.':`${leg.route} · ${leg.start.name}에서 ${leg.end.name}까지 이동하는 예시입니다. 실제 방향·승강장 정보는 없습니다.`);}
function stopGps(){window.teumStopLocation?.();}
function closeGuide(){stopGps();$('navigation').hidden=true;$('start').hidden=false;}
function render(){
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
  if(!route){card.textContent='혼잡도를 비교할 수 있는 예시 경로가 없습니다.';$('results').append(card);continue;}
  card.innerHTML=`<h3>${label}</h3><div class="time">${Math.round(route.seconds/60)}<small> 분</small></div><div class="metrics"><span>환승 ${route.transfers}회</span><span>도보 ${route.walk}m</span><span>최단 후보 대비 +${Math.round((route.seconds-fast.seconds)/60)}분</span></div><p class="pill">${route.congestion===null?'혼잡도 정보 없음':route.congestion===1?'여유 · 합성 예시':'혼잡 · 합성 예시'}</p><p class="muted">예시 점수로 비교한 결과입니다. 좌석 확보를 보장하지 않습니다.</p>`;
  const button=document.createElement('button');button.textContent='경로 자세히 보기';button.onclick=()=>show(route,label,kind);card.append(button);$('results').append(card);
 }
 const selectedChoice=choices.find(c=>c.kind===preference);if(selectedChoice)show(selectedChoice.route,selectedChoice.label,selectedChoice.kind,false);
 if(fast&&comfortable?.id===fast.id){const p=document.createElement('p');p.textContent='현재 허용 시간에서는 두 추천이 같은 예시 경로입니다.';$('results').append(p);}
}
function show(route,label,kind,focus=true){preference=kind;const radio=document.querySelector(`input[name=preference][value=${kind}]`);if(radio)radio.checked=true;window.teumSelectRoute?.(kind);document.querySelectorAll('.card').forEach(card=>card.classList.toggle('selected',card.dataset.kind===kind));$('navigation').hidden=true;$('start').hidden=false;chosen=route;step=0;$('detail').hidden=false;$('detail-title').textContent=`${label} · ${route.seconds/60}분`;$('steps').replaceChildren();for(const text of instructions(route)){const li=document.createElement('li');li.textContent=text;$('steps').append(li);}renderSeating(route);renderArrivals(route);if(focus)$('detail').focus();}
function updateStep(){const list=instructions(chosen);$('current').textContent=`${step+1}/${list.length} · ${list[step]}`;$('previous').disabled=step===0;$('next').textContent=step===list.length-1?'도착 완료':'다음 단계';[...$('steps').children].forEach((li,i)=>li.classList.toggle('active',i===step));}
$('search').onsubmit=e=>{e.preventDefault();if(!$('origin').value.trim()||!$('destination').value.trim())return;render();};
document.querySelectorAll('input[name=preference]').forEach(radio=>radio.addEventListener('change',()=>{preference=radio.value;render();}));
$('extra').addEventListener('change',render);
$('start').onclick=()=>{$('navigation').hidden=false;$('start').hidden=true;step=0;updateStep();};
$('previous').onclick=()=>{step=Math.max(0,step-1);updateStep();};
$('next').onclick=()=>{if(step===chosen.legs.length-1){closeGuide();$('current').textContent='';$('steps').querySelectorAll('.active').forEach(li=>li.classList.remove('active'));return;}step++;updateStep();};
$('end').onclick=()=>{closeGuide();$('steps').querySelectorAll('.active').forEach(li=>li.classList.remove('active'));};
$('json').textContent=JSON.stringify(fixture,null,2);render();

window.addEventListener('teum-route-pick',e=>{const c=choices.find(c=>c.kind===e.detail);if(c)show(c.route,c.label,c.kind);});
