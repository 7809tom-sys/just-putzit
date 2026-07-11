// Test script to verify updateIdentity mutation works
import { sdk } from './server/_core/sdk.ts';

const token = await sdk.createSessionToken('Pa26se5ELQF8NgwuvRgV2y', { name: 'Tom' });
console.log('Session token created:', token ? 'OK' : 'FAILED');

// Test the mutation via HTTP
const resp = await fetch('http://localhost:3000/api/trpc/profile.updateIdentity?batch=1', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': `app_session_id=${token}`,
  },
  body: JSON.stringify({
    '0': {
      json: {
        gender: 'man',
        sexualOrientation: 'straight',
        birthdate: '1985-01-01',
      }
    }
  }),
});

const data = await resp.json();
console.log('Response status:', resp.status);
const profile = data[0]?.result?.data?.json;
console.log('Gender:', profile?.gender);
console.log('SexualOrientation:', profile?.sexualOrientation);
console.log('Birthdate:', profile?.birthdate);
console.log('City:', profile?.city);
console.log('GpsVerifiedCity:', profile?.gpsVerifiedCity);
