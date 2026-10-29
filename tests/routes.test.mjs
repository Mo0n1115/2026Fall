import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixture,normalize,recommend} from '../web/routes.mjs';
test('15분 이내에서 덜 혼잡한 후보를 추천한다',()=>{const r=recommend(normalize(fixture),15);assert.equal(r.fast.seconds,2400);assert.equal(r.comfortable.seconds,3000);});
test('추가 5분 제한을 적용하고 누락 혼잡도를 여유로 보지 않는다',()=>{const rows=normalize(fixture);assert.equal(recommend(rows,5).comfortable.id,0);rows.forEach(r=>r.congestion=null);assert.equal(recommend(rows).comfortable,null);});
test('혼잡도 동점 시 환승과 도보 순으로 비교한다',()=>{const rows=normalize(fixture);rows.forEach(r=>r.congestion=1);assert.equal(recommend(rows,30).comfortable.id,2);});
test('빈 후보와 잘못된 응답을 구별한다',()=>{assert.deepEqual(recommend([]),{fast:null,comfortable:null});assert.throws(()=>normalize({}));assert.throws(()=>recommend([], -1));});

test('경로 좌표의 경도·위도 순서를 Leaflet 위도·경도로 변환한다',async()=>{const {readLine}=await import('../web/routes.mjs');assert.deepEqual(readLine('126.97,37.55 127.1,37.51'),[[37.55,126.97],[37.51,127.1]]);for(const bad of [undefined,'','NaN,37 127,37','181,37 127,37','126,37,5 127,37','126,37'])assert.deepEqual(readLine(bad),[]);});
test('모든 예시 구간이 연결된 지도 좌표를 가진다',()=>{for(const route of normalize(fixture)){assert.equal(route.legs.length,route.legs.filter(l=>l.points.length>=2).length);for(let i=1;i<route.legs.length;i++)assert.deepEqual(route.legs[i-1].points.at(-1),route.legs[i].points[0]);}});
