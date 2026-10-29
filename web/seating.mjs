// UI-only synthetic observations; never treat these as live train data.
export const demoCars = [
 {car:1,position:'1-2',generalSeats:36,prioritySeats:12,pregnancySeats:2,occupiedGeneralSeats:36,standingPassengers:18},
 {car:2,position:'2-2',generalSeats:36,prioritySeats:12,pregnancySeats:2,occupiedGeneralSeats:34,standingPassengers:7},
 {car:3,position:'3-2',generalSeats:36,prioritySeats:12,pregnancySeats:2,occupiedGeneralSeats:31,standingPassengers:3},
 {car:4,position:'4-2',generalSeats:36,prioritySeats:12,pregnancySeats:2,occupiedGeneralSeats:35,standingPassengers:12}
];
export function seatingCandidates(cars){
 if(!Array.isArray(cars))return [];
 return cars.filter(c=>Number.isInteger(c.car)&&c.car>0&&typeof c.position==='string'&&/^\d+-\d+$/.test(c.position)&&['generalSeats','prioritySeats','pregnancySeats','occupiedGeneralSeats','standingPassengers'].every(k=>Number.isInteger(c[k])&&c[k]>=0)&&c.generalSeats>0&&c.occupiedGeneralSeats<=c.generalSeats)
 .map(c=>({...c,availableGeneralSeats:c.generalSeats-c.occupiedGeneralSeats}))
 .sort((a,b)=>b.availableGeneralSeats-a.availableGeneralSeats||a.standingPassengers-b.standingPassengers||a.car-b.car);
}
