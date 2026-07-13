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

## Phase 15: Local Events Discovery
- [x] Schema: community_events table (title, description, date, time, location, city, category, isFree, price, url, postedByUserId)
- [x] Backend: events.list (browse + filter by city/category/free), events.create (admin only), events.getEventbrite (proxy to Eventbrite API when key available)
- [x] Frontend: Events page (/events) with search, category filter, free/low-cost toggle, Sally suggestions
- [x] Seed real Waukesha/Milwaukee free events (Music on the Square, farmers markets, etc.)
- [x] Admin panel: post new community events
- [x] Eventbrite API integration (slots in when EVENTBRITE_TOKEN secret is set)
- [x] Navbar link to Events page
- [x] Tests, checkpoint, deliver

## Phase 16: WebAuthn Biometric Authentication (Anti-Bot Layer 2)
- [x] Install @simplewebauthn/server and @simplewebauthn/browser packages
- [x] Schema: passkey_credentials table (userId, credentialId, publicKey, counter, deviceType, transports, createdAt)
- [x] Backend: webauthn.registrationOptions, webauthn.verifyRegistration, webauthn.authOptions, webauthn.verifyAuth tRPC procedures
- [x] Frontend: BiometricEnroll component (shown after first email/password login)
- [x] Frontend: "Sign in with Face ID / Fingerprint" button on Login page
- [x] Show biometric badge on verified profiles (proves real human device)
- [x] Tests, checkpoint, deliver

## Phase 16b: Biometric Polish (post-delivery follow-up)
- [ ] Persist WebAuthn challenges in DB (webauthn_challenges table) instead of in-memory Map for serverless safety
- [ ] Build BiometricEnroll component shown post-login (prompt to register Face ID/fingerprint)
- [ ] Fix biometric login hook usage in Login.tsx (move trpc utils to component scope)
- [ ] Add passkey badge to profile page (shows "Biometric verified" when passkey registered)
- [ ] Add login ads todo items
- [ ] Login Ads section in Vendor Portal (upload clip, set budget, view impressions) - DONE
- [ ] Seed a demo login ad for testing

## Phase 17: Progressive Web App (PWA)
- [x] Create web app manifest (manifest.json) with name, icons, theme color, display standalone
- [x] Generate PWA icons (192x192, 512x512, maskable) and upload to CDN
- [x] Create service worker (sw.js) for offline caching of app shell
- [x] Wire vite-plugin-pwa into vite.config.ts
- [x] Add manifest link and meta tags to client/index.html
- [x] Add iOS-specific meta tags (apple-mobile-web-app-capable, status-bar-style)
- [x] Test install prompt on Android Chrome
- [x] Save checkpoint and deliver install instructions

## Phase 18: App Install Section
- [ ] Add usePWAInstall hook to capture beforeinstallprompt event
- [ ] Add "Get the App" section to Home.tsx with Android/iPhone tabs
- [ ] Add smart "Install App" button that triggers native browser install prompt on Android Chrome
- [ ] Save checkpoint and deliver

## Phase 18: App Install Section
- [x] Add usePWAInstall hook to capture beforeinstallprompt event
- [x] Add "Get the App" section to Home.tsx with Android/iPhone tabs and step-by-step instructions
- [x] Smart "Install App" button triggers native browser install prompt on Android Chrome
- [x] iPhone tab shows Safari-specific steps with share icon illustration
- [x] Save checkpoint and deliver

## Phase 19: Revenue Streams
- [ ] Create AdSenseSlot component with publisher ID placeholder and responsive ad unit
- [ ] Add AdSense script tag to index.html (with placeholder publisher ID)
- [ ] Place ad slots: between event cards in Events page, below match list in Matches page, in landing page between sections
- [ ] Add isFeatured/isSponsored column to community_events table and run migration
- [ ] Add isFeatured/isSponsored column to activities table and run migration
- [ ] Backend: events.setFeatured and activities.setFeatured admin procedures
- [ ] Events page: show Sponsored badge and pin featured events to top
- [ ] Activities page: show Featured badge and pin featured activities to top
- [ ] Admin panel: toggle featured/sponsored for events and activities
- [ ] Revenue summary card in Admin panel (ad impressions, login ad spend, featured placements)
- [ ] Save checkpoint and deliver

- [ ] Add gender and sexual orientation fields to profile schema and Sally interview
- [ ] Display gender/orientation on Home authenticated dashboard profile card
- [ ] Fix Home dashboard navigation dead-end (add Navbar or nav links so users can exit)
- [x] Add gender, sexual orientation, birthdate columns to profiles table in schema
- [ ] Add profile_photos table with S3 key, city, verified flag
- [ ] Add photo upload tRPC procedure with EXIF GPS city-verification
- [ ] Update Sally interview to ask gender, orientation, age
- [ ] Update profile tRPC get/update to return gender, orientation, age
- [ ] Build photo upload UI on Profile page with city-verification badge
- [ ] Add Navbar to AuthenticatedHome to fix navigation dead-end
- [x] Add gender, orientation, age on Home profile card

## Admin Panel
- [x] Audit existing Admin.tsx and admin tRPC procedures
- [x] Add admin procedures: getAllUsers, banUser, unbanUser, getUserDetail
- [x] Add admin procedures: getPendingPhotos, approvePhoto, rejectPhoto
- [x] Add admin procedures: getReports, resolveReport, getAdminFlags
- [x] Add admin procedures: getSiteStats (total users, photos, matches, events, revenue)
- [x] Build Admin Dashboard tab with site stats cards
- [x] Build Admin Users tab: searchable table, ban/unban, view profile
- [x] Build Admin Photos tab: grid of unverified/pending photos with approve/reject
- [x] Build Admin Reports tab: list of reports with resolve action
- [x] Build Admin Revenue tab: sponsored listings toggle, revenue summary
- [x] Ensure admin route is protected (adminProcedure / role=admin check)
- [x] Promote owner account to admin role in DB
- [x] Add Admin link to Navbar for admin users only

## Mobile Navigation & Feature Parity
- [ ] Audit Navbar for mobile breakpoint — what is hidden/collapsed
- [ ] Build MobileBottomNav component with: Home, Matches, Activities, Community, More menu
- [ ] Add Admin shortcut in More menu for admin users
- [ ] Ensure all major pages are reachable from mobile bottom nav
- [ ] Add mobile-responsive padding/spacing to key pages

## Local Venues & City-Based Activities
- [ ] Seed Waukesha local venues (Farmers Market, Frame Park mini golf, parks, etc.) into activityListings
- [ ] Seed Milwaukee local venues into activityListings
- [ ] Add city filter to ActivityBoard and Events pages based on user profile city
- [ ] Show distance estimate from user city on activity/event cards
- [ ] Auto-show city-relevant venues when user opens Activities page

## Admin Email Outreach
- [ ] Add venueOutreach DB table (id, venueId, toEmail, subject, body, sentAt, status)
- [ ] Add sendOutreachEmail tRPC procedure (admin only) using built-in email or SMTP
- [ ] Add Outreach tab in Admin panel with venue list and compose email form
- [ ] Show email history log per venue in Admin panel

## Sally Continuous Profile Enrichment
- [ ] After every Sally chat message, extract new traits/hobbies/preferences and MERGE into profile (not overwrite)
- [ ] Sally system prompt should track what profile fields are still missing and ask about them naturally
- [ ] Profile traits, hobbies, dream vacation, personality tags all accumulate across sessions
- [ ] Identity fields (gender, orientation, age) extracted if mentioned in any conversation
- [ ] Profile completeness score shown to user to encourage more chatting

## Public Game Lobby
- [ ] Add game_rooms and game_room_players DB tables (city, max players, game type, status)
- [ ] tRPC: createRoom, listRooms (filtered by city), joinRoom, leaveRoom, getRoomState
- [ ] Game Lobby page: browse open rooms near you, create a room, see who's in each room
- [ ] In-room game play: WYR, trivia, or icebreaker questions with all room members
- [ ] Geographic filter: show rooms in same city first, then nearby cities
- [ ] After game, prompt players to connect/match with each other

## Movie Night Feature
- [ ] Research TMDB API for now-playing movies and trailers
- [ ] Find Waukesha local theater ticket booking URLs (Marcus Theatres, AMC, etc.)
- [ ] Add movie_bookings table to DB schema and apply migration
- [ ] Add tRPC procedures: getNowPlaying, getMovieTrailer, recordMovieBookingClick
- [ ] Build Movies page with now-playing grid, trailer modal (YouTube embed), theater info
- [ ] Add Book Tickets CTA linking to local theater with referral tracking
- [ ] Add Movies to Navbar and mobile bottom nav More sheet
- [ ] Add Movie Night card to Home dashboard
- [ ] Add movie booking click revenue to Admin Revenue tab

## Friends Shout-Out / Invite Feature
- [ ] Add friend_invites table to schema (inviterId, contactName, contactPhone, contactEmail, inviteCode, status, joinedAt)
- [ ] Generate and apply Drizzle migration for friend_invites
- [ ] Add tRPC procedures: createInvite, listMyInvites, trackInviteJoin (called on signup with ?ref=CODE)
- [ ] Build ShoutOut.tsx page with Web Contacts API picker + manual add fallback
- [ ] Checklist UI: select contacts, preview personalized message, send via SMS/share link
- [ ] Generate unique invite URL per contact: justputzit.com/join?ref=CODE&from=NAME
- [ ] Handle ?ref= on signup page to credit the referrer
- [ ] Add ShoutOut to Navbar user dropdown and MobileBottomNav More sheet
- [ ] Add "Invite Friends" card to Home dashboard
- [ ] Add invite stats to Admin Revenue tab (total invites sent, joined, conversion rate)

## WYR Answers → Sally Profile
- [ ] Read WouldYouRather router to understand answer storage
- [ ] After each WYR answer, run AI trait extraction and merge into userProfiles
- [ ] Show 'Sally updated your profile' toast in WYR UI after extraction

## All Games → Sally Profile (Matchmaking Intelligence)
- [ ] WYR answers: extract traits async after every answer, merge into userProfiles
- [ ] Game Lobby (Trivia/Icebreaker/Two Truths): extract traits after each answer submitted
- [ ] Match Games: extract traits from game session answers
- [ ] Add 'Game Insights' section to Profile page showing traits derived from games
- [ ] Update matchmaking to weight game-derived traits in compatibility scoring

## Campus / University Dating Pool
- [ ] Audit existing campus schema (campuses table, campus_members)
- [ ] Add campus_members table if missing; add joinCampus/leaveCampus tRPC procedures
- [ ] Seed nearby Wisconsin universities (Carroll, UW-Waukesha, Marquette, UW-Milwaukee, MSOE, etc.)
- [ ] Build Campus page: browse nearby universities, join/leave campus, see campus member pool
- [ ] Add Campus link to Navbar and mobile nav
- [ ] Campus dating pool: filter matches by shared campus affiliation

## Recommend a Friend (Prominent Referral Button)
- [ ] Add a highly visible "Recommend a Friend" floating button / banner on Home dashboard
- [ ] Add Recommend button to mobile bottom nav bar (primary tab, not buried in More)
- [ ] Add Recommend button to Profile page sidebar
- [ ] Clicking opens ShoutOut page with pre-filled message

## Identity Save Android Fix & Refer-a-Friend
- [ ] Fix identity save on Android — replace shadcn Select with native select for mobile compatibility
- [ ] Add prominent Refer-a-Friend floating button on Home dashboard
- [ ] Add Refer-a-Friend as a primary tab in mobile bottom nav
- [ ] Create standalone /refer page with shareable link and contact picker

## Mandatory Account Verification Gate
- [x] Add passkeyVerified boolean field to users table in schema.ts
- [x] Generate and apply Drizzle migration for passkeyVerified field
- [x] Add markPasskeyVerified tRPC procedure (sets passkeyVerified=true after successful passkey registration)
- [x] Add auth.verificationStatus procedure returning { passkeyVerified, gpsPhotoVerified }
- [x] Build AccountVerify.tsx page with two-step flow: Step 1 passkey setup, Step 2 GPS photo upload
- [x] Add /verify-account route to App.tsx
- [x] Add gate logic in App.tsx: redirect logged-in unverified users to /verify-account before any protected page
- [x] Skip gate for /login, /signup, /verify, /verify-account routes

## SEO Infrastructure
- [x] Create useSEO hook that sets document.title and meta tags dynamically
- [x] Add Open Graph and Twitter Card meta tags to index.html base
- [x] Apply useSEO to Home, CityLanding, and public event pages
- [x] Build CityLanding.tsx page template with local SEO copy
- [x] Add city routes: /city/:citySlug (e.g. /city/jackson-ms)
- [x] Add /sitemap.xml server endpoint listing all public pages and city pages
- [x] Update robots.txt to allow crawling and point to sitemap
- [x] Add JSON-LD SoftwareApplication structured data to homepage
- [x] Add JSON-LD LocalBusiness structured data to city landing pages
- [x] Create public /events/:id page accessible without login for Google indexing
- [x] Add tRPC publicProcedure for fetching a single event by ID

## Meetup + Yelp Integration
- [ ] Add Meetup GraphQL API fetcher to externalEvents.ts (events by city/lat-lng)
- [ ] Add Yelp Fusion API fetcher to externalEvents.ts (businesses by category + city)
- [ ] Add getMeetupEvents and getYelpVenues tRPC procedures
- [ ] Merge Meetup events + Yelp venues into ActivityBoard Live Events tab
- [ ] Show source badge (Meetup / Yelp / Ticketmaster / Eventbrite) on each card
- [ ] Add MEETUP_API_KEY and YELP_API_KEY to secrets

## Milwaukee/Waukesha Community Event Scraper
- [x] Research and verify scrapable event URLs for Milwaukee/Waukesha libraries, universities, newspapers
- [x] Install cheerio for HTML parsing
- [x] Build communityScraper.ts with scrapers for Milwaukee Public Library, Waukesha Public Library, UW-Milwaukee, Marquette University, OnMilwaukee
- [x] Extend communityEvents source enum in schema.ts (milwaukee_library, waukesha_library, uwm, marquette, onmilwaukee, scraped)
- [x] Add isOnCampus boolean field to community_events table + apply migration
- [x] Add upsertScrapedEvents db helper with deduplication logic
- [x] Build scheduledScrape.ts POST handler for /api/scheduled/scrape-events (Heartbeat cron)
- [x] Register scrape-events route in server/_core/index.ts
- [x] Add Community Events tab to ActivityBoard.tsx with source badges (library/university/news)
- [x] Add Free Events Only and Campus Events Only quick filters
- [x] Community sources sidebar panel showing all 5 scraped sources
- [x] 29 tests passing, 0 TypeScript errors

## Family Network
- [ ] Schema: family_profiles table (userId, familyName, bio, neighborhoodCity, interests JSON, isActive)
- [ ] Schema: family_children table (familyProfileId, ageYears, gender optional)
- [ ] Schema: family_matches table (family1Id, family2Id, status, compatibilityScore)
- [ ] Apply DB migration
- [ ] DB helpers: getOrCreateFamilyProfile, updateFamilyProfile, addChild, removeChild, getFamilyMatches, findFamilyMatches
- [ ] Backend: family.getProfile, family.setup, family.addChild, family.removeChild, family.findMatches, family.getMatches, family.getFamilyEvents
- [ ] Frontend: /family page with 3 sections — Setup (if no profile), Family Matches, Kid-Friendly Events
- [ ] Family profile setup form: family name, neighborhood, kids' ages, family interests
- [ ] Family matching card: show other families with kids same age range, connect button
- [ ] Kid-friendly events feed: filter community events by age-appropriate categories (library, arts, outdoors, sports)
- [ ] Add Family nav link to Navbar
- [ ] Add /family to public routes (gate still applies — must be verified)
- [ ] TypeScript check, tests, checkpoint

## Family Network + Trip Planner
- [ ] Apply family_profiles, family_children, family_matches DB migration
- [ ] DB helpers: getOrCreateFamilyProfile, updateFamilyProfile, addChild, removeChild, findFamilyMatches, getFamilyMatches, connectFamilies
- [ ] Schema: trip_plans table (userId, title, date, items JSON array of activity/event IDs + notes)
- [ ] DB helpers: createTripPlan, getTripPlans, addTripItem, removeTripItem, deleteTripPlan
- [ ] Backend: family.getProfile, family.setup, family.addChild, family.removeChild, family.findMatches, family.connectFamily, family.getFamilyEvents (GPS-based, kid-friendly filter)
- [ ] Backend: tripPlanner.create, tripPlanner.list, tripPlanner.addItem, tripPlanner.removeItem, tripPlanner.delete, tripPlanner.exportIcs
- [ ] Frontend: /family page — GPS auto-detects location, shows kid-friendly events nearby, family profile setup, family matching cards
- [ ] Frontend: /trip-planner page — create trip, add activities/events to date slots, export to .ics (Google Calendar / Apple Calendar / Outlook)
- [ ] "Add to Trip" button on every activity card and event card throughout the app
- [ ] .ics file generation on server (RFC 5545 compliant) with event title, date, location, URL
- [ ] Google Calendar deep-link as alternative to .ics download
- [ ] Add Family and Trip Planner links to navbar/More menu
- [ ] TypeScript check, tests, checkpoint

## Voice-to-Text Profile Input
- [ ] Build VoiceBio reusable component using Web Speech API (SpeechRecognition) with Whisper API fallback
- [ ] Mic button shows recording state (pulsing red), transcribes in real time, stops on tap
- [ ] Wire VoiceBio into profile bio field on Profile edit page
- [ ] Wire VoiceBio into family profile bio field on Family Network setup
- [ ] Wire VoiceBio into Sally interview text input (speak answers instead of typing)
- [ ] Show "AI-written" vs "Voice-recorded" badge on bio so other users know it's authentic
- [ ] TypeScript check, tests, checkpoint

## Games Suite (Multiplayer + Profile-Building)
- [ ] Schema: trivia_questions table (question, optionA-D, correctAnswer, category, difficulty)
- [ ] Schema: trivia_rooms table (hostUserId, status, maxPlayers, currentQuestion, gameCode)
- [ ] Schema: trivia_room_players table (roomId, userId, score, isReady)
- [ ] Schema: trivia_answers table (roomId, userId, questionId, answer, isCorrect, answeredAt)
- [ ] Apply DB migration for trivia tables
- [ ] Seed 200+ trivia questions across 6 categories (Relationships, Pop Culture, Local Knowledge, Food & Drinks, Sports & Outdoors, Wild Card)
- [ ] DB helpers: createTriviaRoom, joinTriviaRoom, getTriviaRoom, submitTriviaAnswer, getTriviaScores, listOpenRooms
- [ ] Backend: trivia.createRoom, trivia.joinRoom, trivia.listRooms, trivia.getRoom, trivia.submitAnswer, trivia.nextQuestion, trivia.endGame
- [ ] Frontend: TriviaGame.tsx — lobby with player list + ready-up, 15-second countdown timer per question, scoreboard, in-game chat panel
- [ ] Add /games/trivia route and Games nav entry
- [ ] Backend + Frontend: HotTakes game (rapid-fire agree/disagree, reveal match %)
- [ ] Backend + Frontend: FinishMySentence game (Sally prompts, both users complete, compare)
- [ ] Backend + Frontend: CompatibilityQuiz game (10 values-alignment questions, Sally scores)
- [ ] Backend + Frontend: MemoryLane game (quiz on things your match said in chat)
- [ ] Backend + Frontend: SallyCompatibilityChallenge (guess your match's profile answers)
- [ ] Wire ALL game answers to profile trait extraction (async merge into traits JSON)
- [ ] Add "Game Insights" section to Profile page showing traits derived from games
- [ ] Update matchmaking to weight game-derived traits in compatibility scoring
- [ ] Admin: Sally Training panel (match rule editor, accuracy score, trait frequency heatmap)
- [ ] Add "Challenge your match" button in existing chat screen
- [ ] TypeScript check, tests, checkpoint

## Bug Fixes (Jul 13)
- [ ] Add voice-to-text mic button to profile edit page bio field
- [ ] Fix age and sex fields not saving on profile edit
- [ ] Fix movie trailers not playing
