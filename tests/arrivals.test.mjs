import {test} from 'node:test';import assert from 'node:assert/strict';
import {arrivalState,createDemoArrivals} from '../web/arrivals.mjs';import {fixture,normalize} from '../web/routes.mjs';
const snapshot={observedAt:1000,validForMs:120000};
test('절대 도착 시각에서 남은 시간을 계산하고 초를 올림한다',()=>{assert.equal(arrivalState(snapshot,62000,1000).text,'1분 01초');assert.equal(arrivalState(snapshot,62000,1501).seconds,61);assert.equal(arrivalState(snapshot,62000,32000).text,'0분 30초');});
test('예정 시각이 지나도 실제 도착으로 확정하지 않는다',()=>{assert.equal(arrivalState(snapshot,62000,62000).kind,'expired');assert.equal(arrivalState(snapshot,62000,63000).kind,'expired');});
test('복귀 후 오래된 정보·누락·잘못된 시각을 구분한다',()=>{assert.equal(arrivalState(snapshot,999000,121000).kind,'stale');assert.equal(arrivalState(null,null,1000).kind,'unknown');assert.equal(arrivalState(snapshot,999000,0).kind,'unknown');});
test('도보는 제외하고 환승 구간은 이전 이동시간 이후의 예시 시각을 생성한다',()=>{const rows=normalize(fixture),records=createDemoArrivals(rows,1000);assert.ok(!records.has('0:0'));assert.ok(records.has('0:1'));assert.ok(records.has('1:1'));assert.ok(records.get('0:3').vehicles[0].arrivalAt>records.get('0:1').vehicles[0].arrivalAt);assert.equal(records.get('0:1').source,'demo');});
