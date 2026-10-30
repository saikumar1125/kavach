import assert from 'node:assert/strict';
import { RiskTracker, THRESHOLD } from './risk.js';

const lines = [
  'Hello, main CBI officer bol raha hoon, mee Aadhaar number tho oka parcel lo drugs dorikayi.',
  'Mimmalni digital arrest chesam, video call lo undandi, line cut cheyakandi.',
  'Ee vishayam evarikee cheppakandi, mee family ki kuda cheppakoodadu.',
  'Verification kosam mee account ki vachina OTP ventane cheppandi.',
];
const t = new RiskTracker();
const scores = lines.map((l) => t.feed(l).score);
console.log('scam scores', scores);
assert.ok(scores.every((s, i) => i === 0 || s >= scores[i - 1]), 'monotonic');
assert.ok(scores.at(-1) >= THRESHOLD, 'scam call crosses threshold');

const benign = new RiskTracker();
for (const l of ['Hello amma, how are you?', 'Dinner ki em chesav? Rice and dal.', 'నేను రేపు వస్తాను, మీటింగ్ ఉంది'])
  benign.feed(l);
console.log('benign score', benign.score);
assert.ok(benign.score < 30, 'benign chat stays low');
console.log('OK');
