// Test Sally chat and profile enrichment end-to-end
import { sdk } from './server/_core/sdk.ts';

const token = await sdk.createSessionToken('Pa26se5ELQF8NgwuvRgV2y', { name: 'Tom' });
console.log('Session token:', token ? 'OK' : 'FAILED');

const BASE = 'http://localhost:3000';
const headers = {
  'Content-Type': 'application/json',
  'Cookie': `app_session_id=${token}`,
};

// Step 1: Get profile BEFORE Sally chat
const profileBefore = await fetch(`${BASE}/api/trpc/profile.get?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D`, { headers });
const profileBeforeData = await profileBefore.json();
const pBefore = profileBeforeData[0]?.result?.data?.json;
console.log('\n=== PROFILE BEFORE SALLY ===');
console.log('Bio:', pBefore?.bio || '(empty)');
console.log('Traits aiSummary:', pBefore?.traits?.aiSummary || '(empty)');
console.log('InterviewCount:', pBefore?.interviewCount);

// Step 2: Start a Sally interview session
const startResp = await fetch(`${BASE}/api/trpc/interview.start?batch=1`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ '0': { json: null } }),
});
const startData = await startResp.json();
console.log('\n=== START INTERVIEW ===');
console.log('Status:', startResp.status);
const sessionId = startData[0]?.result?.data?.json?.sessionId;
console.log('Session ID:', sessionId);

if (!sessionId) {
  console.log('ERROR: Could not start interview session');
  console.log('Full response:', JSON.stringify(startData, null, 2));
  process.exit(1);
}

// Step 3: Send a message to Sally
const msgResp = await fetch(`${BASE}/api/trpc/interview.chat?batch=1`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    '0': {
      json: {
        sessionId,
        userMessage: "I love hiking, cooking Italian food, and watching movies. I'm pretty outgoing and love meeting new people.",
      }
    }
  }),
});
const msgData = await msgResp.json();
console.log('\n=== SEND MESSAGE ===');
console.log('Status:', msgResp.status);
const reply = msgData[0]?.result?.data?.json?.message;
console.log('Sally reply:', reply?.substring(0, 150) + '...');

// Step 4: Finish the interview to trigger profile enrichment
const finishResp = await fetch(`${BASE}/api/trpc/interview.complete?batch=1`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ '0': { json: { sessionId } } }),
});
const finishData = await finishResp.json();
console.log('\n=== FINISH INTERVIEW ===');
console.log('Status:', finishResp.status);
console.log('Result:', JSON.stringify(finishData[0]?.result?.data?.json || finishData[0]?.error, null, 2));

// Step 5: Wait a moment then check profile AFTER
await new Promise(r => setTimeout(r, 2000));
const profileAfter = await fetch(`${BASE}/api/trpc/profile.get?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D`, { headers });
const profileAfterData = await profileAfter.json();
const pAfter = profileAfterData[0]?.result?.data?.json;
console.log('\n=== PROFILE AFTER SALLY ===');
console.log('Bio:', pAfter?.bio || '(empty)');
console.log('Traits aiSummary:', JSON.stringify(pAfter?.traits?.aiSummary)?.substring(0, 200));
console.log('Traits hobbies:', JSON.stringify(pAfter?.traits?.hobbies)?.substring(0, 200));
console.log('InterviewCount:', pAfter?.interviewCount);
console.log('City:', pAfter?.city);
