import {test} from 'node:test';import assert from 'node:assert/strict';
import {demoCars,seatingCandidates} from '../web/seating.mjs';
test('일반 빈좌석으로 추천하고 배려석 수로 결과를 바꾸지 않는다',()=>{assert.equal(seatingCandidates(demoCars)[0].car,3);const cars=demoCars.map(c=>({...c,prioritySeats:c.car===1?100:0,pregnancySeats:100}));assert.equal(seatingCandidates(cars)[0].car,3);});
test('일반 빈좌석 동점이면 입석 인원이 적은 칸을 고른다',()=>{const cars=demoCars.map(c=>({...c,occupiedGeneralSeats:34}));assert.equal(seatingCandidates(cars)[0].car,3);});
test('점유·칸·문 데이터 누락과 잘못된 수치는 제외한다',()=>{assert.deepEqual(seatingCandidates(null),[]);assert.deepEqual(seatingCandidates([{...demoCars[0],occupiedGeneralSeats:99}]),[]);assert.deepEqual(seatingCandidates([{...demoCars[0],position:undefined}]),[]);});
test('모든 일반 좌석이 차 있으면 빈좌석을 생성하지 않는다',()=>{assert.ok(seatingCandidates(demoCars.map(c=>({...c,occupiedGeneralSeats:c.generalSeats}))).every(c=>c.availableGeneralSeats===0));});
