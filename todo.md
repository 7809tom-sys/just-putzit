# Just Putzit - Development TODO

## Phase 2: Foundation
- [x] Update DB schema with all tables (userProfiles, interviewSessions, matches, chatMessages, gameSessions)
- [x] Apply DB migration via webdev_execute_sql
- [x] Set up global styles, color palette, fonts (Nunito + Playfair Display)
- [x] Build landing page with Sally branding, Singles Network, Couples Network, Community Events sections
- [x] Build top navigation with auth state

## Phase 3: Onboarding & AI Interview
- [x] Build onboarding flow: account creation + avatar selection (emoji + color picker)
- [x] Build Sally AI 90-second interview screen (chat UI, countdown timer, LLM-powered)
- [x] Build profile refinement logic (merge new interview traits into profile)
- [x] Trigger interview on every login after first session

## Phase 4: Profile, Matchmaking & Chat
- [x] Build user profile page (avatar, traits, compatibility insights, vetting status)
- [x] Build AI matchmaking procedure (LLM compares profiles, returns score + reason)
- [x] Build matches page showing compatibility cards
- [x] Build matched couples chat forum with avatars (2-3 couples simultaneously)

## Phase 5: Games & Activity Discovery
- [x] Build Newlywed Game widget (LLM generates profile-based questions, Sally hosts, scoring)
- [x] Build Two Truths and a Lie game (LLM generates statements from profile)
- [x] Build This or That rapid-fire game (LLM asks either/or, reveals match %)
- [x] Build local activity discovery (Google Maps Places API, geo-locate, surface nearby venues)
- [x] LLM narrates all game results in warm game-show Sally style

## Phase 6: Polish & Delivery
- [x] Notifications (new match, game ready, new message)
- [x] Third Wheel safety feature indicator on profiles
- [x] Continuous vetting / re-interview display on profiles
- [x] Vitest tests (10 passing)
- [x] Responsive design check
- [ ] Final checkpoint and delivery

## Phase 6: Anti-Fraud & Safety System
- [ ] Identity verification badge on profiles (verified/unverified status)
- [ ] Unverified accounts hidden from match results
- [ ] Report & block system on every user profile
- [ ] Reported accounts auto-suspended pending admin review
- [ ] Admin moderation dashboard (view flagged accounts, approve/suspend/ban)
- [ ] Sally behavioral flagging (detect bot-like response patterns in interviews)
- [ ] "Third Wheel" safety moderator indicator on community events
- [ ] Safety tips page explaining how Just Putzit protects users
- [ ] DB tables: reports, blocks, admin_flags

## Phase 7: Expanded Platform Features
- [ ] Three-network onboarding: Singles, Couples, Community selection
- [ ] Couples Network: joint couple profile creation and matching
- [ ] "What's Happening Near Me" Sally activity board on login/dashboard
- [ ] Sally proactive weekend suggestions based on user profile and location
- [ ] Sally Date Concierge: in-app picnic/outing arrangement with vendor ordering
- [ ] Venue & Vendor Partner referral system with check-in codes
- [ ] Community Groups: book clubs, hiking, cooking circles
- [ ] Trust Promise / Safety page explaining Just Putzit's zero-fake-profile commitment
- [ ] Activity RSVP system with Sally introductions to other attendees

## Phase 7: Sally Activity Marketplace
- [ ] Activity listings page with categories (bowling, mini golf, kayaking, movies, dining, events)
- [ ] In-app ticket and reservation booking flow with checkout
- [ ] Sally Date Concierge: picnic/food order arrangement with vendor fulfillment
- [ ] Vendor partner portal: list activities, set pricing, manage availability
- [ ] Pay-per-visit referral check-in code system
- [ ] Group booking support (2, 4, 6+ people)
- [ ] Sally personalized activity recommendations based on matched profiles
- [ ] Order history and upcoming bookings on user profile
- [ ] Commission/revenue tracking in admin dashboard

## Phase 8: Revenue Engines (Active Build)
- [x] Schema: bookings table (tickets/marketplace orders, commission, status)
- [x] Schema: conciergeRequests table (Sally Date Concierge picnic/outing arrangements)
- [x] Schema: marketplace pricing fields on activityListings (priceCents, hasTickets)
- [x] Schema: vendor ownership fields on venuePartners (ownerUserId, contactEmail)
- [x] Schema: coupleLinks table (couple-to-couple matching joint profiles)
- [x] DB helpers: bookings, concierge, vendor portal, couples
- [x] Backend routers: marketplace (browse, book, my bookings)
- [x] Backend routers: concierge (Sally suggests, create request, list)
- [x] Backend routers: vendor portal (register, my venues, my listings, referrals)
- [x] Backend routers: couples (link partner, find couple matches)
- [x] Frontend: Sally Date Concierge page (/concierge)
- [x] Frontend: Activity Marketplace page with booking checkout (/marketplace) + My Bookings
- [x] Frontend: Vendor Partner Portal page (/vendor)
- [x] Frontend: Couples Network page (/couples)
- [x] Navbar + App routes for all new pages
- [x] Phase 5 polish: login -> interview redirect, This-or-That match %, verification badges
- [x] Vitest tests for new routers (8 tests, all passing; caught & fixed notifications.expiresAt DB mismatch)
- [x] Final checkpoint and delivery

## Phase 9: Campus Growth Engine (cold-start solution, Carroll University first)
- [x] Schema: campuses table (name, city, state, emailDomain, launchThreshold, isLive)
- [x] Schema: campus membership fields on userProfiles (campusId, schoolEmail, isAmbassador)
- [x] Schema: referrals table (inviterUserId, inviteeUserId, inviteCode, campusId, status)
- [x] Schema: invite code field on userProfiles (personal invite code)
- [ ] DB helpers: campuses CRUD, member counts, referral tracking, leaderboard
- [ ] Backend: campus router (list campuses, get campus stats, join campus, waitlist count)
- [ ] Backend: referral router (my invite link, record referral on signup, my referral count, campus leaderboard)
- [ ] Backend: .edu / campus email verification on join (sets isVerified when domain matches)
- [ ] Frontend: campus picker + waitlist page with honest "X of N joined" progress
- [ ] Frontend: invite/referral page (personal link, copy, share, referral count)
- [ ] Frontend: campus ambassador leaderboard (top inviters, badges)
- [ ] Integrate campus selection into onboarding flow
- [ ] Landing page: campus-focused hero + "launching at Carroll University" messaging
- [x] Seed Carroll University (Waukesha, WI) as campus #1 with threshold 100
- [ ] Capture invite code from URL (?ref=) on signup and attribute referral
- [ ] Vitest tests for campus join, referral attribution, leaderboard
- [ ] Final checkpoint and delivery for campus growth engine

## Phase 10: Would You Rather game (low AI cost)
- [x] Schema: would_you_rather_questions table (optionA, optionB, category) + would_you_rather_answers table (userId, questionId, choice)
- [x] Seed 40 pre-written WYR questions (zero per-play AI cost)
- [x] DB helpers: get random unanswered questions, record answer, count A/B split
- [x] Backend router: wyr.getBatch, wyr.answer (returns crowd split), wyr.stats
- [x] Frontend: WouldYouRather page (tap A or B, show % split, streak, categories, progress)
- [x] Wire into route (/would-you-rather) + Navbar menu
- [x] Vitest tests for answer recording + split counts (5 tests, all 23 pass)
- [x] Checkpoint and deliver playable demo

## Phase 11: 2-Player Would You Rather (match icebreaker)
- [ ] Schema: wyr_challenges table (initiatorId, partnerId, status, compatibility%)
- [ ] Backend: wyr.startChallenge, wyr.getChallenge, wyr.compareAnswers (compute match %)
- [ ] Seed 20+ additional WYR questions
- [ ] Frontend: 2-player challenge UI (invite match, answer together, reveal compatibility)
- [ ] Wire into existing WYR page as a mode toggle (Solo vs. Challenge a Match)
- [ ] Vitest tests for 2-player flow
- [ ] Checkpoint and deliver

## Phase 12: Admin Panel (justputzit.com ready)
- [x] Backend: admin.getStats (total users, new this week, verified, interviewed, matches, messages)
- [x] Backend: admin.searchUsers (search by name/email, paginated)
- [x] Backend: admin.getUserDetail (profile + activity counts)
- [x] Backend: admin.suspendUser / updateReport / resolveFlag
- [x] Frontend: Admin dashboard with 6 stat cards, Overview, Users, Reports, Flags tabs
- [x] Frontend: User detail drawer (profile info, network, verified, onboarding, match/message counts, suspend)
- [x] Checkpoint and deliver

## Phase 13: 2-Player WYR + Campus Growth Engine
- [x] Schema: wyr_challenges table (challengerId, challengedId, questionIds JSON, status)
- [x] Backend: wyr.sendChallenge, wyr.getChallenge, wyr.myChallenges, wyr.computeCompatibility
- [x] Frontend: WyrChallenge page (/wyr-challenge) — lobby, solo play, compatibility reveal, navbar link
- [x] Campus growth: backend getCampusStats, generateInviteCode, recordReferral, getCampusLeaderboard
- [x] Campus growth: Carroll waitlist page (/campus/carroll) with honest progress bar + invite link
- [x] Campus growth: Ambassador leaderboard (top inviters, 5+ referrals = Ambassador badge)
- [x] 23 tests passing, 0 TypeScript errors
- [ ] Checkpoint and deliver

## Phase 14: Real Auth + Face Verification (Production-Ready)

### Authentication (replace Manus OAuth for public users)
- [ ] Schema: add email, passwordHash, phone, emailVerified, phoneVerified to users table
- [ ] Backend: auth.register (email+password), auth.login, auth.logout, auth.verifyEmail, auth.requestPhoneOTP, auth.verifyPhoneOTP
- [ ] Frontend: Sign Up page (email+password+phone), Log In page, email verification flow
- [ ] Keep Manus OAuth as optional "continue with Manus" for existing users

### Face Verification (AWS Rekognition)
- [ ] Add AWS credentials as secrets (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION)
- [ ] Backend: verification.startSession (create Rekognition liveness session), verification.getResult (check liveness result, update isVerified)
- [ ] Frontend: FaceVerification page — camera prompt, 3-angle capture, liveness check, result display
- [ ] No images stored — only pass/fail result saved to DB
- [ ] Show "Verified" badge on profile after passing

### Integration
- [ ] Onboarding flow: register → verify email → Sally interview → face verification → matches
- [ ] The Shield stats page: show real verified count, bots deflected counter
- [ ] Unverified users hidden from match results (only verified users shown)
- [ ] Tests for new auth and verification flows
- [ ] Checkpoint and deliver

## Phase 14: Email Auth + GPS Photo Verification

- [ ] Schema: add email, passwordHash, emailVerified, emailVerifyToken fields to users table
- [ ] Schema: add gpsLat, gpsLng, gpsCity, gpsVerifiedAt to user_profiles
- [ ] Backend: auth.registerEmail, auth.loginEmail, auth.verifyEmail procedures
- [ ] Backend: verification.submitGpsPhoto (read EXIF, check coords vs claimed city, save result)
- [ ] Frontend: Sign Up page (email + password + city selection)
- [ ] Frontend: Log In page (email + password)
- [ ] Frontend: GPS Photo Verification page (live camera capture, EXIF check, result)
- [ ] Onboarding flow: register -> verify email -> Sally interview -> GPS photo verify -> matches
- [ ] Match filtering: only show verified users in match results
- [ ] Tests for auth and GPS verification flows
- [ ] Checkpoint and deliver
