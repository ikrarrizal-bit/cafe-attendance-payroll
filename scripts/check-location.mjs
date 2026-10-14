import assert from 'node:assert/strict';
import {cafeLocation,distanceMetres,validateCheckInLocation} from '../lib/checkin-location.ts';
const now = Date.now();
function form(overrides = {}) {
  const f = new FormData();
  const values = {latitude:cafeLocation.latitude,longitude:cafeLocation.longitude,locationAccuracy:10,locationTimestamp:now,...overrides};
  for (const [key,value] of Object.entries(values)) f.set(key,String(value));
  return f;
}
assert.equal(distanceMetres(cafeLocation.latitude,cafeLocation.longitude),0);
assert.equal(validateCheckInLocation(form(),now).distanceMetres,0);
assert.doesNotThrow(()=>validateCheckInLocation(form({latitude:cafeLocation.latitude+0.0008}),now));
assert.throws(()=>validateCheckInLocation(form({latitude:cafeLocation.latitude+0.001}),now),/within 100 metres/);
assert.throws(()=>validateCheckInLocation(new FormData(),now),/location access/);
assert.throws(()=>validateCheckInLocation(form({latitude:NaN}),now),/verified/);
assert.throws(()=>validateCheckInLocation(form({latitude:91}),now),/verified/);
assert.throws(()=>validateCheckInLocation(form({locationAccuracy:51}),now),/accurate enough/);
assert.throws(()=>validateCheckInLocation(form({locationTimestamp:now-60001}),now),/out of date/);
assert.throws(()=>validateCheckInLocation(form({locationTimestamp:now+15001}),now),/out of date/);
console.log('Location checks passed: café radius, missing/invalid location, accuracy and freshness.');
