// Synthetic arrival snapshots. This module does not call a live provider.
export function createDemoArrivals(routes,now=Date.now()){
 const records=new Map();
 for(const route of routes){let elapsed=0;route.legs.forEach((leg,index)=>{
  if(leg.mode==='SUBWAY'||leg.mode==='BUS')records.set(`${route.id}:${index}`,{
   source:'demo',observedAt:now,validForMs:120000,
   vehicles:[{id:'first',arrivalAt:now+(elapsed+300)*1000},{id:'second',arrivalAt:now+(elapsed+720)*1000}]
  });
  elapsed+=leg.sectionTime;
 });}
 return records;
}
export function arrivalState(snapshot,arrivalAt,now=Date.now()){
 if(!snapshot||!Number.isFinite(snapshot.observedAt)||!Number.isFinite(snapshot.validForMs)||snapshot.validForMs<=0||!Number.isFinite(arrivalAt))return {kind:'unknown',text:'도착 정보 없음'};
 const age=now-snapshot.observedAt;
 if(age<0)return {kind:'unknown',text:'정보 시각 확인 필요'};
 if(age>=snapshot.validForMs)return {kind:'stale',text:'정보가 오래됐습니다 · 갱신 필요'};
 const remaining=Math.ceil((arrivalAt-now)/1000);
 if(remaining<=0)return {kind:'expired',text:'예정 시각 지남 · 도착 여부 확인 필요'};
 return {kind:'countdown',seconds:remaining,text:`${Math.floor(remaining/60)}분 ${String(remaining%60).padStart(2,'0')}초`};
}
