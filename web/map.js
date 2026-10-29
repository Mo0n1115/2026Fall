/* Leaflet map + browser location. No coordinates are persisted. */
(()=>{
 const el=id=>document.getElementById(id);
 const map=L.map('map',{zoomControl:false}).setView([37.5665,126.978],13);
 L.control.zoom({position:'topright'}).addTo(map);
 const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'}).addTo(map);
 let loaded=false;
 tiles.on('tileload',()=>{loaded=true;el('map-status').hidden=true;});
 tiles.on('tileerror',()=>{if(!loaded){el('map-status').hidden=false;el('map-status').textContent='지도 연결 실패 · 네트워크 확인';}});
 const routeLayer=L.layerGroup().addTo(map);
 let choices=[],selectedKind=null;
 function paintRoutes(){
  routeLayer.clearLayers();
  const sorted=[...choices].sort((a,b)=>(a.kind===selectedKind)-(b.kind===selectedKind));
  for(const choice of sorted){
   const selected=choice.kind===selectedKind;
   const color=selected?(choice.kind==='comfort'?'#247453':'#1670ef'):'#7a858d';
   for(const leg of choice.route.legs){
    if(!leg.points?.length)continue;
    const line=L.polyline(leg.points,{color,weight:selected?7:4,opacity:selected?1:.55,dashArray:leg.mode==='WALK'?'4 9':null}).addTo(routeLayer);
    line.bindTooltip(`${choice.label} · ${leg.mode==='WALK'?'도보':leg.route} · 합성 개략선`);
    line.on('click',()=>window.dispatchEvent(new CustomEvent('teum-route-pick',{detail:choice.kind})));
   }
  }
  for(const item of sorted){
   const transit=item.route.legs.filter(l=>l.mode!=='WALK'&&l.points?.length).sort((a,b)=>b.sectionTime-a.sectionTime)[0];
   if(!transit)continue;
   const point=transit.points[Math.floor((transit.points.length-1)/2)];
   const selected=item.kind===selectedKind;
   const badge=L.marker(point,{zIndexOffset:selected?1000:500,icon:L.divIcon({className:'route-time-marker',html:`<button class="route-time ${selected?'chosen':''} ${item.kind}" aria-label="${item.label} ${Math.round(item.route.seconds/60)}분 예시 선택"><strong>${Math.round(item.route.seconds/60)}분</strong><span>${item.label}</span></button>`,iconSize:[116,62],iconAnchor:[58,31]})}).addTo(routeLayer);
   const button=badge.getElement().querySelector('button');
   L.DomEvent.disableClickPropagation(button);
   button.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('teum-route-pick',{detail:item.kind})));
  }
  const choice=choices.find(c=>c.kind===selectedKind);
  if(!choice)return;
  const points=choice.route.legs.flatMap(leg=>leg.points||[]);
  if(!points.length){el('route-legend').textContent='경로 좌표 없음';return;}
  const labels=[[points[0],'출발'],[points.at(-1),'도착']];
  choice.route.legs.forEach((leg,i)=>{if(i>0&&leg.mode==='WALK'&&i<choice.route.legs.length-1&&leg.points?.length)labels.push([leg.points[0],'환승']);});
  for(const [point,label] of labels){L.marker(point,{icon:L.divIcon({className:'route-marker',html:`<span>${label}</span>`,iconSize:[44,28],iconAnchor:[22,14]})}).addTo(routeLayer).bindTooltip('합성 예시 지점 · 실제 승하차 위치 아님');}
  el('route-legend').textContent=`예시 개략선 · 실제 이동용 아님 · 점선: 도보`;
 }
 window.teumSetRoutes=(next,kind)=>{choices=next;selectedKind=kind;paintRoutes();};
 window.teumSelectRoute=kind=>{
  selectedKind=kind;paintRoutes();setFollow(false);
  const points=choices.find(c=>c.kind===kind)?.route.legs.flatMap(l=>l.points||[])||[];
  if(points.length){const guiding=!el('live-guide').hidden;const panel=(guiding?el('live-guide'):el('route-sheet')).getBoundingClientRect();const bottom=guiding||window.innerWidth<=1024;map.fitBounds(L.latLngBounds(points),{paddingTopLeft:bottom?[75,110]:[panel.right+50,110],paddingBottomRight:bottom?[75,window.innerHeight-panel.top+95]:[85,100],animate:false});}
 };
 window.teumFocusLeg=leg=>{
  if(!leg.points?.length)return;
  setFollow(false);
  const panel=el('live-guide').getBoundingClientRect();
  map.fitBounds(L.latLngBounds(leg.points),{paddingTopLeft:[80,120],paddingBottomRight:[80,window.innerHeight-panel.top+70],maxZoom:16,animate:false});
 };
 let watch=null,marker=null,circle=null,last=null,following=true,active=false;
 const followButton=el('follow');
 function setFollow(value){following=value;followButton.setAttribute('aria-pressed',String(value));followButton.textContent=value?'◎ 위치 따라가는 중':'◎ 내 위치로';}
 function status(text){el('position').textContent=text;}
 function stop(){active=false;if(watch!==null)navigator.geolocation.clearWatch(watch);watch=null;el('gps').disabled=false;el('stop-gps').hidden=true;setFollow(false);if(marker)marker.setOpacity(.45);status('추적 중단 · 마지막 위치');}
 window.teumStopLocation=stop;
 map.on('dragstart',()=>{setFollow(false);});
 map.on('zoomstart',e=>{if(e.originalEvent)setFollow(false);});
 function start(){
  if(!window.isSecureContext||!navigator.geolocation){status('위치 사용 불가 · HTTPS·권한 확인');return;}
  if(watch!==null){setFollow(true);if(last)map.panTo(last,{animate:false});return;}
  active=true;setFollow(true);el('gps').disabled=true;el('stop-gps').hidden=false;status('위치 확인 중');
  watch=navigator.geolocation.watchPosition(p=>{
   if(!active)return;
   const {latitude,longitude,accuracy}=p.coords;
   if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||!Number.isFinite(accuracy))return;
   if(Date.now()-p.timestamp>30000){status('오래된 위치 · 갱신 대기');return;}
   last=[latitude,longitude];
   if(!marker){marker=L.marker(last,{icon:L.divIcon({className:'user-position',html:'<span></span>',iconSize:[24,24],iconAnchor:[12,12]}),interactive:false}).addTo(map);circle=L.circle(last,{radius:accuracy,color:'#3277e6',weight:1,fillOpacity:.1,interactive:false}).addTo(map);}
   marker.setLatLng(last).setOpacity(1);circle.setLatLng(last).setRadius(accuracy);
   if(following)map.setView(last,Math.max(map.getZoom(),16),{animate:false});
   status(`정확도 ±${Math.round(accuracy)}m · ${new Date(p.timestamp).toLocaleTimeString('ko-KR')} 확인`);
  },e=>{if(!active)return;stop();status(({1:'위치 권한 거부 · 사이트 권한 확인',2:'위치 확인 불가 · 재시도',3:'위치 시간 초과 · 재시도'})[e.code]||'위치 확인 실패');},{enableHighAccuracy:true,maximumAge:0,timeout:20000});
 }
 el('gps').onclick=start;el('stop-gps').onclick=stop;
 followButton.onclick=()=>{if(!active){start();return;}setFollow(true);if(last)map.setView(last,Math.max(map.getZoom(),16),{animate:false});};
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&active){stop();status('화면 숨김 · 추적 중단 · 내 위치로 재개');}});
 window.addEventListener('pagehide',stop);
 window.addEventListener('teum-panel-change',()=>{if(selectedKind&&!following)window.teumSelectRoute(selectedKind);});
 window.addEventListener('resize',()=>{if(selectedKind&&!following)window.teumSelectRoute(selectedKind);});
 setFollow(false);
})();
