/* Leaflet map + browser location. No coordinates are persisted. */
(()=>{
 const el=id=>document.getElementById(id);
 const map=L.map('map',{zoomControl:false}).setView([37.5665,126.978],13);
 L.control.zoom({position:'topright'}).addTo(map);
 const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'}).addTo(map);
 let loaded=false;
 tiles.on('tileload',()=>{loaded=true;el('map-status').hidden=true;});
 tiles.on('tileerror',()=>{if(!loaded){el('map-status').hidden=false;el('map-status').textContent='지도 타일을 불러오지 못했습니다. 인터넷 연결 또는 네트워크 정책을 확인해주세요.';}});
 let watch=null,marker=null,circle=null,last=null,following=true,active=false;
 const followButton=el('follow');
 function setFollow(value){following=value;followButton.setAttribute('aria-pressed',String(value));followButton.textContent=value?'◎ 위치 따라가는 중':'◎ 내 위치로';}
 function status(text){el('position').textContent=text;}
 function stop(){active=false;if(watch!==null)navigator.geolocation.clearWatch(watch);watch=null;el('gps').disabled=false;el('stop-gps').hidden=true;setFollow(false);if(marker)marker.setOpacity(.45);status('위치 추적 중단 · 마지막 위치가 남아 있을 수 있습니다.');}
 window.teumStopLocation=stop;
 map.on('dragstart',()=>{setFollow(false);});
 map.on('zoomstart',e=>{if(e.originalEvent)setFollow(false);});
 function start(){
  if(!window.isSecureContext||!navigator.geolocation){status('위치 추적에는 HTTPS 또는 localhost와 위치 권한이 필요합니다.');return;}
  if(watch!==null){setFollow(true);if(last)map.panTo(last,{animate:false});return;}
  active=true;setFollow(true);el('gps').disabled=true;el('stop-gps').hidden=false;status('위치 권한 확인 중…');
  watch=navigator.geolocation.watchPosition(p=>{
   if(!active)return;
   const {latitude,longitude,accuracy}=p.coords;
   if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||!Number.isFinite(accuracy))return;
   if(Date.now()-p.timestamp>30000){status('위치 정보가 오래됐습니다. 새 위치를 기다립니다.');return;}
   last=[latitude,longitude];
   if(!marker){marker=L.marker(last,{icon:L.divIcon({className:'user-position',html:'<span></span>',iconSize:[24,24],iconAnchor:[12,12]}),interactive:false}).addTo(map);circle=L.circle(last,{radius:accuracy,color:'#3277e6',weight:1,fillOpacity:.1,interactive:false}).addTo(map);}
   marker.setLatLng(last).setOpacity(1);circle.setLatLng(last).setRadius(accuracy);
   if(following)map.setView(last,Math.max(map.getZoom(),16),{animate:false});
   status(`현재 위치 · 정확도 ±${Math.round(accuracy)}m · ${new Date(p.timestamp).toLocaleTimeString('ko-KR')} 확인`);
  },e=>{if(!active)return;stop();status(({1:'위치 권한이 거부됐습니다. 브라우저의 사이트 권한에서 허용해주세요.',2:'위치를 확인할 수 없습니다. 신호가 좋은 곳에서 다시 시도해주세요.',3:'위치 확인 시간이 초과됐습니다. 다시 시도해주세요.'})[e.code]||'위치 확인에 실패했습니다.');},{enableHighAccuracy:true,maximumAge:0,timeout:20000});
 }
 el('gps').onclick=start;el('stop-gps').onclick=stop;
 followButton.onclick=()=>{if(!active){start();return;}setFollow(true);if(last)map.setView(last,Math.max(map.getZoom(),16),{animate:false});};
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&active){stop();status('화면이 숨겨져 위치 추적을 중단했습니다. 돌아오면 내 위치 버튼을 눌러주세요.');}});
 window.addEventListener('pagehide',stop);
 setFollow(false);
})();
