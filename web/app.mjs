import {fixture,normalize,recommend} from './routes.mjs';
const $=id=>document.getElementById(id);
let chosen=null,step=0,watch=null;
const routes=normalize(fixture);
function instructions(route){return route.legs.map(leg=>leg.mode==='WALK'?'도보 구간을 확인하세요. 실제 길안내는 아직 연결되지 않았습니다.':`${leg.route} · ${leg.start.name}에서 ${leg.end.name}까지 이동하는 예시입니다. 실제 방향·승강장 정보는 없습니다.`);}
function stopGps(){window.teumStopLocation?.();}
function closeGuide(){stopGps();$('navigation').hidden=true;$('start').hidden=false;}
function render(){
 $('navigation').hidden=true;$('start').hidden=false;$('detail').hidden=true;
 const {fast,comfortable}=recommend(routes,Number($('extra').value));
 $('results').replaceChildren();
 const title=document.createElement('h2');title.textContent=`${$('origin').value.trim()} → ${$('destination').value.trim()}`;$('results').append(title);
 for(const [label,route,kind] of [['편하게 이동',comfortable,'comfort'],['가장 빠르게 이동',fast,'fast']]){
  const card=document.createElement('article');card.className=`card ${kind}`;
  if(!route){card.textContent='혼잡도를 비교할 수 있는 예시 경로가 없습니다.';$('results').append(card);continue;}
  card.innerHTML=`<h3>${label}</h3><div class="time">${Math.round(route.seconds/60)}<small> 분</small></div><div class="metrics"><span>환승 ${route.transfers}회</span><span>도보 ${route.walk}m</span><span>최단 후보 대비 +${Math.round((route.seconds-fast.seconds)/60)}분</span></div><p class="pill">${route.congestion===null?'혼잡도 정보 없음':route.congestion===1?'여유 · 합성 예시':'혼잡 · 합성 예시'}</p><p class="muted">예시 점수로 비교한 결과입니다. 좌석 확보를 보장하지 않습니다.</p>`;
  const button=document.createElement('button');button.textContent='경로 자세히 보기';button.onclick=()=>show(route,label);card.append(button);$('results').append(card);
 }
 if(fast&&comfortable?.id===fast.id){const p=document.createElement('p');p.textContent='현재 허용 시간에서는 두 추천이 같은 예시 경로입니다.';$('results').append(p);}
}
function show(route,label){$('navigation').hidden=true;$('start').hidden=false;chosen=route;step=0;$('detail').hidden=false;$('detail-title').textContent=`${label} · ${route.seconds/60}분`;$('steps').replaceChildren();for(const text of instructions(route)){const li=document.createElement('li');li.textContent=text;$('steps').append(li);}$('detail').focus();}
function updateStep(){const list=instructions(chosen);$('current').textContent=`${step+1}/${list.length} · ${list[step]}`;$('previous').disabled=step===0;$('next').textContent=step===list.length-1?'도착 완료':'다음 단계';[...$('steps').children].forEach((li,i)=>li.classList.toggle('active',i===step));}
$('search').onsubmit=e=>{e.preventDefault();if(!$('origin').value.trim()||!$('destination').value.trim())return;render();};
$('start').onclick=()=>{$('navigation').hidden=false;$('start').hidden=true;step=0;updateStep();};
$('previous').onclick=()=>{step=Math.max(0,step-1);updateStep();};
$('next').onclick=()=>{if(step===chosen.legs.length-1){closeGuide();$('current').textContent='';$('steps').querySelectorAll('.active').forEach(li=>li.classList.remove('active'));return;}step++;updateStep();};
$('end').onclick=()=>{closeGuide();$('steps').querySelectorAll('.active').forEach(li=>li.classList.remove('active'));};
$('json').textContent=JSON.stringify(fixture,null,2);render();
