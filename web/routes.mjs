// Synthetic subset of documented TMAP fields; not a captured or complete API response.
export const fixture = {metaData:{plan:{itineraries:[
 {totalTime:2400,transferCount:1,totalWalkDistance:700,legs:[{mode:'WALK',sectionTime:300},{mode:'SUBWAY',route:'예시 2호선',sectionTime:900,start:{name:'출발역'},end:{name:'환승역'}},{mode:'WALK',sectionTime:180},{mode:'SUBWAY',route:'예시 8호선',sectionTime:720,start:{name:'환승역'},end:{name:'도착역'}},{mode:'WALK',sectionTime:300}]},
 {totalTime:3000,transferCount:0,totalWalkDistance:350,legs:[{mode:'WALK',sectionTime:180},{mode:'BUS',route:'예시 100번',sectionTime:2640,start:{name:'출발 정류장'},end:{name:'도착 정류장'}},{mode:'WALK',sectionTime:180}]},
 {totalTime:3300,transferCount:0,totalWalkDistance:200,legs:[{mode:'WALK',sectionTime:120},{mode:'BUS',route:'예시 200번',sectionTime:3060,start:{name:'출발 정류장'},end:{name:'도착 정류장'}},{mode:'WALK',sectionTime:120}]}
]}}};
// Congestion is separate from TMAP routing; these synthetic scores are comparable only in this demo.
const congestion = [3,1,null];
export function normalize(response) {
 const rows=response?.metaData?.plan?.itineraries;
 if(!Array.isArray(rows)) throw new Error('경로 응답 형식을 확인할 수 없습니다.');
 return rows.map((r,id)=>{
  if(!Number.isFinite(r.totalTime)||r.totalTime<=0||!Array.isArray(r.legs)||!r.legs.length) throw new Error('필수 경로 정보가 없습니다.');
  return {id,seconds:r.totalTime,transfers:r.transferCount,walk:r.totalWalkDistance,legs:r.legs,congestion:congestion[id]??null};
 });
}
export function recommend(routes,extraMinutes=15){
 if(!Number.isFinite(extraMinutes)||extraMinutes<0) throw new Error('추가 시간을 확인해주세요.');
 if(!routes.length) return {fast:null,comfortable:null};
 const fast=[...routes].sort((a,b)=>a.seconds-b.seconds)[0];
 const known=routes.filter(r=>r.seconds<=fast.seconds+extraMinutes*60&&r.congestion!==null);
 known.sort((a,b)=>a.congestion-b.congestion||a.transfers-b.transfers||a.walk-b.walk||a.seconds-b.seconds);
 return {fast,comfortable:known[0]??null};
}
