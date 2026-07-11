import { getDb } from './server/db.ts';
import { userProfiles } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const db = await getDb();
const rows = await db.select().from(userProfiles).where(eq(userProfiles.userId, 1));
const p = rows[0];
if (!p) { console.log('No profile found for userId=1'); process.exit(1); }
console.log('userId:', p.userId);
console.log('gender:', (p as any).gender);
console.log('sexualOrientation:', (p as any).sexualOrientation);
console.log('birthdate:', (p as any).birthdate);
console.log('city:', p.city);
console.log('gpsVerifiedCity:', (p as any).gpsVerifiedCity);
console.log('interviewCount:', p.interviewCount);
console.log('traits keys:', Object.keys((p.traits as any) || {}));
