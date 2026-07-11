import { sdk } from './server/_core/sdk.ts';

const token = await sdk.createSessionToken('Pa26se5ELQF8NgwuvRgV2y', { name: 'Tom' });
const BASE = 'http://localhost:3000';
const headers = { 'Content-Type': 'application/json', 'Cookie': `app_session_id=${token}` };

// Step 1: Save identity
const saveResp = await fetch(`${BASE}/api/trpc/profile.updateIdentity?batch=1`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ '0': { json: { gender: 'man', sexualOrientation: 'straight', birthdate: '1975-06-15' } } }),
});
const saveData = await saveResp.json();
console.log('Save status:', saveResp.status);
const saved = saveData[0]?.result?.data?.json;
console.log('Saved gender:', saved?.gender);
console.log('Saved birthdate:', saved?.birthdate);

// Step 2: Fetch profile.get to confirm it returns the fields
const getResp = await fetch(`${BASE}/api/trpc/profile.get?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D`, { headers });
const getData = await getResp.json();
const profile = getData[0]?.result?.data?.json;
console.log('\n=== profile.get response ===');
console.log('gender:', profile?.gender);
console.log('sexualOrientation:', profile?.sexualOrientation);
console.log('birthdate:', profile?.birthdate);
console.log('city:', profile?.city);
console.log('All keys:', Object.keys(profile || {}));
