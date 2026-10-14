import assert from 'node:assert/strict';
import {paymentBonus} from '../lib/payment-bonus.ts';
assert.deepEqual(paymentBonus(undefined,undefined),{amount:0,reason:''});
assert.deepEqual(paymentBonus(100000,' Great work '),{amount:100000,reason:'Great work'});
for(const value of [-1,NaN,Infinity,1.001,1000000001,'100'])assert.throws(()=>paymentBonus(value,'Great work'));
assert.throws(()=>paymentBonus(100,''));
assert.throws(()=>paymentBonus(100,'a'.repeat(301)));
console.log('Bonus checks passed: optional bonus, amount limits, precision and required reason.');
