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
- [x] Add an admin-only member management page for granting and removing administrator roles
- [x] Add an admin dashboard tab for reviewing Sally interview event recommendation feedback

## Mobile Navigation & Feature Parity
- [ ] Audit Navbar for mobile breakpoint — what is hidden/collapsed
- [ ] Build MobileBottomNav component with: Home, Matches, Activities, Community, More menu
- [ ] Add Admin shortcut in More menu for admin users
- [ ] Ensure all major pages are reachable from mobile bottom nav
- [ ] Add mobile-responsive padding/spacing to key pages

## Local Venues & City-Based Activities
- [x] Seed Waukesha local venues (Farmers Market, Frame Park mini golf, parks, etc.) into activityListings
- [x] Seed Milwaukee local venues into activityListings
- [x] Add public-access recreation categories and venues: pools, beaches, dirt tracks, basketball, YMCAs, guest-access gyms, golf, disc golf, volleyball, and tennis
- [x] Add city filter to ActivityBoard and Events pages based on user profile city
- [x] Show distance estimate from user city on activity/event cards
- [x] Auto-show city-relevant venues when user opens Activities page
- [x] Trigger an idempotent local activity and event refresh after login or a GPS city change
- [x] Include churches and church-hosted activities in city-aware community discovery
- [x] Include high-school and community-theater productions with attendance, audition, volunteer, class, and membership pathways

## Admin Email Outreach
- [ ] Add venueOutreach DB table (id, venueId, toEmail, subject, body, sentAt, status)
- [ ] Add sendOutreachEmail tRPC procedure (admin only) using built-in email or SMTP
- [ ] Add Outreach tab in Admin panel with venue list and compose email form
- [ ] Show email history log per venue in Admin panel
- [ ] Add college performing-arts sources and outreach templates for musical plays and theater productions

## Sally Continuous Profile Enrichment
- [ ] After every Sally chat message, extract new traits/hobbies/preferences and MERGE into profile (not overwrite)
- [ ] Sally system prompt should track what profile fields are still missing and ask about them naturally
- [ ] Profile traits, hobbies, dream vacation, personality tags all accumulate across sessions
- [ ] Identity fields (gender, orientation, age) extracted if mentioned in any conversation
- [ ] Profile completeness score shown to user to encourage more chatting
- [x] During Sally interviews, offer current local events and capture interested/not-for-me feedback for future recommendations
- [x] During Sally interviews, offer current local events and capture interested/not-for-me feedback for future recommendations
- [x] Show a “What Sally learned recently” profile indicator sourced from the latest completed interview
- [x] Animate newly learned profile traits with a subtle first-load highlight

## Personalized Homepage Sections
- [x] Let members select homepage sections with checkboxes and automatically show their selections on Home
- [x] Persist selected homepage sections per member and retain a recommended default set

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
- [x] Add voice-to-text mic button to profile edit page bio field
- [x] Fix age and sex fields not saving on profile edit (confirmed columns exist, data saves correctly)
- [x] Fix movie trailers not playing (added mute=1 and playsinline=1 for mobile autoplay)
- [x] Fix mobile navigation link that opens the 404 Page Not Found screen


## Phase 26: Family Network & Trip Planner
- [x] Schema: family_profiles, family_children, family_matches, trip_plans tables
- [x] DB helpers: family profile CRUD, child management, family matching, trip plan helpers
- [x] Backend: family router with 8 procedures (getProfile, setup, addChild, removeChild, getChildren, findMatches, getFamilyEvents, connectFamily)
- [x] Backend: trip planner procedures (getTripPlans, createTripPlan, updateTripPlan, deleteTripPlan, addTripItem, removeTripItem)
- [x] Frontend: Family.tsx page with profile setup, child management, family discovery, kid-friendly activity feed
- [x] Frontend: TripPlanner.tsx page with trip creation, itinerary management, ICS calendar export
- [x] Routes: /family and /trip-planner added to App.tsx
- [x] Add navigation links to MobileBottomNav for Family and Trip Planner
- [x] Vitest tests for family and trip planner procedures (29 tests passing)
- [x] Checkpoint and deliver


## Phase 27: Jeopardy & Trivia Pursuit Games
- [x] Create Jeopardy router with 8 procedures (createRoom, joinRoom, selectClue, submitAnswer, chat, getScoreboard, startGame, endGame)
- [x] Create Trivia Pursuit router with 9 procedures (createRoom, joinRoom, nextQuestion, submitAnswer, chat, getScoreboard, startGame, endGame)
- [x] Build Jeopardy frontend page with TTS speaker icon support
- [x] Build Trivia Pursuit frontend page with TTS speaker icon support
- [x] Add routes to App.tsx (/jeopardy, /trivia-pursuit)
- [x] Integrate both games into GamesHub with cards
- [x] Add navigation links to MobileBottomNav
- [x] Create seed script with 1000 questions (500 Jeopardy + 500 Trivia)
- [ ] Seed questions into database (connection issues - retry later)
- [ ] Add game_results and player_stats tracking tables
- [ ] Update routers to record game stats
- [ ] Extract knowledge traits from game performance
- [ ] Add game stats section to Profile page
- [ ] Update matching algorithm to factor in knowledge compatibility
- [ ] Write vitest tests for game stats and matching

## Phase 28: Unified Game Lobby
- [x] Consolidate all games into GameLobby (Jeopardy, Trivia Pursuit, Would You Rather, Trivia Challenge, Icebreaker, Two Truths & a Lie, Hot Takes, Finish My Sentence, Compatibility Quiz)
- [x] Add solo/multiplayer mode toggle
- [x] Update game type selector to include all games
- [x] Conditional UI for solo vs multiplayer (room name, max players, city info)
- [x] Dynamic button text based on game mode
- [ ] Implement solo game navigation
- [ ] Write vitest tests for GameLobby
- [ ] Save checkpoint and deliver

## Phase 28: Game Stats & Knowledge-Based Matching
- [ ] Retry seeding 1000 questions into database
- [ ] Add game_results and player_stats tracking tables
- [ ] Update Jeopardy/Trivia Pursuit routers to record game stats
- [ ] Extract knowledge traits from game performance
- [ ] Add game stats section to Profile page
- [ ] Update matching algorithm to factor in knowledge compatibility
- [ ] Write vitest tests for game stats and matching
- [ ] Checkpoint and deliver


## Phase 29: Birthday Feature (Clean Rebuild)
- [x] Remove old birth year field from identity dialog
- [x] Create new dedicated Birthday section in Profile with month/day/year pickers
- [x] Add birthday backend router (saveBirthday, getBirthday) - uses existing updateIdentity
- [x] Display full birthday on profile card (e.g., "Birthday: June 15, 1967")
- [ ] Calculate and display age automatically from full date
- [ ] Add birthday notifications for matches
- [ ] Add birthday badges and celebration UI
- [ ] Create birthday events feature in Activities
- [ ] Write vitest tests for birthday feature
- [ ] Save checkpoint

## Event Bookmarks Feature
- [ ] Create event_bookmarks table (userId, eventId, createdAt)
- [ ] Add DB helpers: toggleBookmark, getBookmarksForUser, isBookmarked
- [ ] Add tRPC procedures: events.toggleBookmark, events.myBookmarks
- [ ] Add bookmark button to community event cards on Activity Board
- [ ] Optimistic UI for bookmark toggle
- [ ] Add Saved Events section to Profile page

## Banner Ad System (Local Venue Geofenced Ads)
- [x] Add banner fields to ad_partners DB table (banner_image_url, banner_link_url, banner_headline, banner_cta, banner_pages)
- [x] Add venue_lat, venue_lng, banner_reach_miles to ad_partners DB table and schema.ts
- [x] Add advertising.getBanners tRPC procedure with Haversine geofence filtering
- [x] Build LocalVenueBanner component (rotating banners, dismiss, pagination dots, "Local Sponsor" label)
- [x] Add LocalVenueBanner slot to Home.tsx (two slots: logged-in feed and between Safety/Games sections)
- [x] Add LocalVenueBanner slot to ActivityBoard.tsx (community events tab)
- [x] Add LocalVenueBanner slot to Community.tsx
- [x] Add LocalVenueBanner slot to Activities.tsx
- [x] Update AdminAdvertising.tsx with full banner ad edit form (image URL, headline, CTA, destination URL, page checkboxes, reach radius, venue coordinates)
- [x] Update advertising.update tRPC procedure to accept all banner fields
- [x] Remove Google AdSense script from client/index.html
- [x] LocalVenueBanner reads user's saved GPS location from profile for geofence filtering

## Fallback Community Announcement Banner
- [x] Add 7 rotating fallback community announcements to LocalVenueBanner (shown when no paid ads in user's radius)
- [x] Fallback rotates daily by page slot (deterministic, no randomness)
- [x] Fallback includes "advertise with us" nudge link at the bottom
- [x] Fallback is dismissible independently from paid ads
- [x] Paid ad banner unchanged — fallback only shows when visible paid ads = 0

## Bullgerdash Game
- [x] Create bullgerdash_photos, bullgerdash_games, bullgerdash_rounds DB tables
- [x] Build tRPC bullgerdash router (startGame, getGame, submitCaption, submitVote, nextRound, endGame, getRoundHistory)
- [x] Build Bullgerdash.tsx game UI page with all phases (storyteller writing, voter guessing, reveal, game over)
- [x] Add Bullgerdash card to Games.tsx game selection screen
- [x] Add Bullgerdash card to GamesHub.tsx
- [x] Add /bullgerdash/:matchId route to App.tsx
- [x] Seed 20 obscure photos into bullgerdash_photos table

## Voice Chat (Voice Messages + Live Voice Calls)
- [ ] Schema: voice_messages table (matchId, senderId, s3Key, s3Url, durationSeconds, playedAt)
- [ ] Backend: voice.sendMessage (upload audio to S3, save record), voice.getMessages (list for match), voice.markPlayed
- [ ] Backend: WebSocket signaling for WebRTC (offer, answer, ICE candidates, call-end events)
- [ ] Frontend: VoiceMessageRecorder component (hold-to-record mic button, waveform, send)
- [ ] Frontend: VoiceMessagePlayer component (play/pause, waveform, duration, played indicator)
- [ ] Frontend: Wire voice messages into Chat.tsx (record button in toolbar, voice messages in message list)
- [ ] Frontend: VoiceCall component (call button in chat header, incoming call modal, active call UI, mute/end)
- [ ] Frontend: Wire voice call button into Chat.tsx and game pages (Bullgerdash, Games)
- [ ] Checkpoint and deliver

## Admin GPS Location Review
- [x] Add admin.listUsersWithLocation tRPC procedure returning GPS data, city, verification status for all users
- [x] Build Locations tab in Admin.tsx with user table showing GPS coordinates, city, verification badge, and Google Maps link
- [x] Wire Locations tab into admin panel (safety.listUsersWithLocation procedure)

## Jeopardy Board Fix
- [x] Replace flat 5-button dollar-value grid with proper category x value grid using real question IDs from getRoom
- [x] Add BoardClue and BoardCategory types
- [x] Add answeredClueIds state (Set<number>) to track answered clues
- [x] Add boardCategories state built from getRoom query
- [x] Add trpc.jeopardy.getRoom.useQuery with 5-second polling during playing phase
- [x] Fix Set spread TypeScript error using new Set(prev) + .add() pattern

## Bulger Dash Rename
- [x] Update display name from "Bullgerdash" to "Bulger Dash" in GamesHub.tsx
- [x] Update display name in Games.tsx
- [x] Update display name in Bullgerdash.tsx page title (all 3 headers + loading states)
- [x] No Navbar references found (game not in Navbar)

## Real-time Scoreboard & Player Join Notifications
- [x] Add getPlayers procedure to jeopardy router (returns players with usernames and scores)
- [x] Add getPlayers procedure to trivia-pursuit router (returns players with usernames and scores)
- [x] Update Jeopardy.tsx with real-time polling (3s), animated join toast, live scoreboard sidebar
- [x] Update TriviaPursuit.tsx with real-time polling (3s), animated join toast, live scoreboard sidebar

## Sports Watch Party Feature
- [ ] Add watch_party_rooms, watch_party_chat, watch_party_trivia_questions, watch_party_trivia_answers tables to schema.ts
- [ ] Apply DB migrations for watch party tables
- [ ] Build tRPC procedures: createRoom, joinRoom, getRoom, sendChat, getChat, launchTrivia, submitTriviaAnswer, getLeaderboard
- [ ] Build Sports.tsx page with NFL/NBA/MLB schedule cards and local sports event posting
- [ ] Build WatchParty.tsx room page with live chat, trivia battle UI, and leaderboard
- [ ] Add Sports link to Entertainment nav section
- [ ] Seed 50+ team trivia questions (Packers, Bears, Bucks, Brewers, etc.)
- [ ] Wire Sports and WatchParty routes in App.tsx

## Game Day Chat & Trivia
- [x] Seed sports_trivia_pool with 27 questions for Packers, Bears, Bucks, Brewers
- [x] Rename "Watch Party" to "Game Day Chat" throughout Sports.tsx and WatchParty.tsx UI
- [x] Add "Game Day Chat" hero section to Sports.tsx with live room count and prominent CTA
- [x] Show live participant count badge on each game card in Sports.tsx
- [x] Add "Commercial Break Trivia" button prominently in WatchParty.tsx for hosts
- [x] Add trivia countdown timer (30 seconds) when a question is active
- [x] Show trivia answer results with correct answer reveal and points breakdown
- [x] Add reaction buttons (🔥 🎯 😱 👏) to chat messages for quick reactions
- [x] Polish WatchParty.tsx header with live indicator, fan count, and host label

## Live Sports Scores
- [x] Add sportsScores.getScores tRPC procedure fetching NFL/NBA/MLB from ESPN public API with 60s server-side cache
- [x] Add sportsScores.getAllScores and getLiveGames procedures
- [x] Add sportsScores.setTeamAlert and getMyAlerts procedures with sport_team_alerts table
- [x] Build LiveScores.tsx page with score cards for NFL, NBA, MLB tabs
- [x] Add score cards showing team logos, current score, game status/clock, venue, broadcast
- [x] Add bell icon alert toggle per team (optimistic update) for logged-in users
- [x] Wire Live Scores into Sports page with red "Live Scores" button in hero
- [x] Route /sports/live-scores added to App.tsx
- [x] Show LIVE badge with pulsing animation on in-progress games
- [x] Show Live/Upcoming/Final sections with counts
- [x] Auto-refresh every 60 seconds with manual refresh button

## User Homepage Customization
- [x] Add user_homepage_layout DB table (userId, moduleId, position, pinned)
- [x] Add getHomepageLayout and saveHomepageLayout helpers to db.ts
- [x] Add homepage.getLayout and homepage.saveLayout tRPC procedures
- [x] Define 11 pinnable modules: Sally, Matches, Activities, Sports, Games, Community, Concierge, Marketplace, Family, Trip, Shoutout
- [x] Build AuthenticatedHome with pinned module list rendered in saved order
- [x] Build CustomizeDrawer with drag-to-reorder (HTML5 drag API) and pin/unpin toggle
- [x] Customize button in home header (Settings2 icon)
- [x] Optimistic layout update + save to DB on confirm
- [x] Default layout (5 pinned modules) for new users with no saved preferences
- [x] Empty state when no modules are pinned
- [x] Sports module shows live game count badge from ESPN API

## Favorite Teams Filter (Live Scores)
- [x] Reuse sport_team_alerts table as "favorite teams" store (already exists)
- [x] Add "My Teams Only" filter toggle button on Live Scores page header
- [x] Add "Pick Your Teams" drawer listing all 32 NFL / 30 NBA / 30 MLB teams with checkboxes and search
- [x] Sport tabs (MLB/NFL/NBA) inside the picker drawer
- [x] When filter is ON, show only games where home or away team is in user's favorites
- [x] Show "None of your favorite teams play today" empty state when filter is on and no matches
- [x] Persist team selections via sportsScores.setTeamAlert procedure (optimistic updates)
- [x] Show favorite team count badge on the filter button
- [x] Star icon on each team row in score cards; gold highlight on favorite-team game cards
- [x] Filter toggle turns yellow when active for clear visual feedback

## Live Scores In-Game Chat Tab
- [x] Add a chat bubble button to each game card on the Live Scores page
- [x] Clicking it auto-creates or joins a Watch Party room for that specific game (findOrCreateGameRoom procedure)
- [x] Navigates to the full Game Day Chat room with live score banner at top
- [x] Show live fan count on the button when fans are already in the room (polls every 30s)
- [x] Non-logged-in users see a toast prompt to sign in

## Team Flairs in Game Day Chat
- [x] Add teamFlair column to watch_party_players table (nullable, stores team abbreviation)
- [x] Add setFlair and getMyFlair procedures to watchParty router
- [x] Return teamFlair in getChat messages query (LEFT JOIN to watch_party_players)
- [x] Show 🏅 team abbreviation badge next to username in each chat message
- [x] Add flair picker inline in chat toolbar (shows both teams + Neutral, toggles open/closed)
- [x] Flair persists per user per room; loads on room entry via getMyFlair query

## Game Day Chat Fan List — DM & City Display
- [ ] Update watchParty.getRoom SQL to also return gpsCity from user_profiles for each player
- [ ] Show city next to each fan's name in the Fans sidebar card
- [ ] Add a "Message" button on each fan pill (hidden for own user)
- [ ] Clicking Message navigates to /chat/:userId (existing DM chat) or creates a new match/DM thread
- [ ] Show city in chat message header tooltip (hover over username shows "📍 City")

## Gym Buddy Feature
- [x] Schema: gyms, gym_buddy_profiles, gym_sessions, gym_session_rsvps tables created
- [x] Apply DB migrations via webdev_execute_sql
- [x] Backend: gym.listGyms, getGym, getMyBuddyProfile, saveBuddyProfile, findBuddies, listSessions, createSession, rsvpSession, getMyRsvps procedures
- [x] Frontend: GymBuddy.tsx hub page — gym cards with buddy counts, workout-style matching, exercise guide
- [x] Frontend: GymPage.tsx gym-specific page — gym info, buddy list, group session scheduler, profile editor
- [x] Seed Crunch Fitness (4 Milwaukee/Waukesha locations) with amenities and partner status
- [x] Exercise guide: Squats, Push-Ups, Planks, Lunges, Overhead Press, Glute Bridges with how-to and benefits
- [x] Wire /gym-buddy and /gym-buddy/:gymId routes in App.tsx
- [x] Save checkpoint and deliver

## Add to Calendar — Gym Sessions
- [x] Add addToCalendar utility function (generates Google Calendar, Apple/ICS, and Outlook links)
- [x] Add "Add to Calendar" dropdown button (CalendarPlus icon) to each session card in GymPage.tsx
- [x] Support Google Calendar (URL), Apple Calendar (.ics download), Outlook (URL)
- [x] Pre-fill event title ("Session @ Gym"), location (gym address), start/end time (+1hr), and description

## Session Participant Avatars
- [x] Updated listSessions to batch-fetch participant avatars (up to 5 per session + extraParticipants count)
- [x] Show stacked avatar row on each SessionCard with -space-x-2 overlap, colored circles, emoji, and name tooltip
- [x] Show "+N more" overflow badge when more than 5 participants
- [x] Show "X going" count next to avatars

## Gym Buddy Revenue Layer
- [x] Fix gym seed data — replace LA Fitness with Crunch Fitness Milwaukee/Waukesha locations
- [x] Add partnerTier (basic/featured/premium), claimedByUserId, membershipUrl, referralCode columns to gyms table
- [x] Add "Claim This Gym" button on gym pages for unclaimed gyms
- [x] Add gym.claimGym tRPC procedure (sets claimedByUserId, pending admin approval)
- [x] Add "Featured Partner" gold badge and highlighted card styling for partner gyms
- [x] Add membership referral CTA with tracking link on each gym page
- [x] Show partnership pricing tiers on GymBuddy.tsx landing page (Basic $49/mo, Featured $99/mo, Premium $199/mo)

## Banner Ad Strategy — Gym Pages
- [x] Extend LocalVenueBanner PageSlot type to include gym_buddy and gym_detail
- [x] Extend getBanners tRPC procedure to accept gym_buddy and gym_detail page slots
- [x] Add banner ad slot between gym cards on GymBuddy.tsx hub (every 3rd card)
- [x] Add banner ad slot below Partner With Us section on GymBuddy.tsx hub
- [x] Add banner ad slot between amenities and membership CTA on GymPage.tsx detail page
- [x] Add Gym Buddy Hub and Gym Detail Pages options to Admin advertising panel page targeting

## Gym Buddy — Sales-Ready Visibility Upgrade
- [x] Add prominent Gym Buddy promo card to Community page Fitness section (full-width CTA card with hero image, value props, Find a Buddy button)
- [ ] Add Gym Buddy as a pinnable module on the authenticated home feed
- [x] Upgrade GymBuddy hub hero: bolder gradient, animated stats, clear 3-step value prop, partner gym logos
- [x] Add dedicated /gym-pitch landing page (shareable URL for in-gym sales, gym-owner copy, QR-code-ready)
- [x] Wire /gym-pitch route in App.tsx
- [x] Save checkpoint and deliver

## My Workout Program Feature
- [x] Add workout_exercises and workout_logs tables to schema and apply SQL migration
- [x] Add workout tRPC router (listExercises, addExercise, deleteExercise, logSet, getRecentLogs)
- [x] Add My Workout Program promo card to Community page Fitness section (green gradient, below Gym Buddy card)
- [x] Create /my-workout page: weekly day filter tabs, starter exercises auto-seeded, Add Your Own dialog, Log Set button
- [x] Wire /my-workout route in App.tsx
- [x] Gym Buddy upsell card at bottom of workout page

## Auto City Detection + Museum & Library Event Crawler
- [ ] Add detectedCity / preferredCity field to user_profiles schema and apply migration
- [ ] Build useUserCity hook: GPS first (navigator.geolocation), IP geolocation fallback (ipapi.co)
- [ ] Persist detected city via tRPC profile.updateCity procedure
- [ ] Show city badge in Navbar (e.g. "📍 Chicago") with tap-to-change
- [ ] Build server-side museum/library event crawler (Chicago Cultural Center, Chicago Public Library, Field Museum, Art Institute, Milwaukee Public Library, Milwaukee Art Museum, Discovery World)
- [ ] Crawler deduplicates by title+date before inserting into community_events
- [ ] Crawled events auto-published (isApproved = true) with source tag
- [ ] Wire city filter into Events page — default to user's detected city
- [ ] Wire city filter into Activities page — default to user's detected city
- [ ] Home feed shows city-relevant events module
- [ ] Admin panel shows event source (crawled vs user-posted)

## Comprehensive Real-Event Discovery System

### Phase 1: Real Library & Venue Events (Complete)
- [x] Add Waukesha Public Library events from Google Business Profile (5 events live)
- [x] Chicago Public Library API crawler (Socrata)
- [x] Art Institute of Chicago API crawler
- [x] Milwaukee Public Library API crawler (Communico)
- [x] Integrate all crawlers into daily midnight refresh heartbeat
- [x] Auto-purge events older than 3 days
- [x] Auto-reseed cities with fewer than 10 upcoming events
- [x] Add event source status dashboard to Admin panel

### Phase 2: Multi-Source Integration (Planned)
- [ ] Eventbrite event crawler for community events
- [ ] Meetup.com group events crawler
- [ ] Facebook Events crawler for local community pages
- [ ] Ticketmaster integration for concerts and sports
- [ ] Google Business Profile crawler for all venue types

### Phase 3: Admin Controls (In Progress)
- [x] Event source status dashboard in Admin panel
- [x] Manual refresh button for all sources
- [ ] Per-source refresh buttons
- [ ] Source health monitoring (last crawl time, event count, error logs)
- [ ] Event deduplication and conflict resolution

### Phase 4: User Discovery (Planned)
- [ ] "Trending Events" widget on home feed
- [ ] Event recommendations based on user interests
- [ ] Event calendar view with filtering
- [ ] Save/bookmark events feature

## Geographic Expansion — Support Any US City

### Phase 1: City-Agnostic Crawlers (Complete)
- [x] Refactor museumLibraryCrawler to support generic city-based library/museum discovery (cityEventCrawler.ts created)
- [x] Build Eventbrite city-based event crawler (any city)
- [x] Build Meetup.com city-based group crawler (any city)
- [x] Add Google Places API crawler for venues by city
- [x] Support Madison WI library/museum events (fallback to Eventbrite + Meetup)
- [x] Support Lincoln NE library/museum events (fallback to Eventbrite + Meetup)
- [x] Support Denver CO, Seattle WA, Austin TX, Portland OR, etc. (generic crawlers ready)

### Phase 2: City Registry & Admin Controls (Planned)
- [ ] Extend seededCities table to include all US cities with geocoding
- [ ] Admin panel: City management (add, enable/disable, configure sources per city)
- [ ] Per-city event source configuration (which crawlers to run)
- [ ] Per-city gym/venue discovery settings

### Phase 3: Geographic Home Feed (Planned)
- [ ] Home feed shows city-relevant gyms (if any nearby)
- [ ] Home feed shows city-relevant events (library, museums, community)
- [ ] Home feed shows city-relevant community groups
- [ ] City badge always visible in navbar with one-tap city switcher

### Phase 4: Testing & Validation (Planned)
- [ ] Test Madison WI: verify LLM seeds events, show real library events
- [ ] Test Lincoln NE: verify LLM seeds events, show real library events
- [ ] Test Denver CO: verify city detection, event crawling
- [ ] Test Seattle WA: verify city detection, event crawling

## Phase 1: Event-Based Matching Integration

### Core Infrastructure
- [x] Add event_interests table to schema (userId, eventId, interestedAt, status: interested/going/attended)
- [ ] Add eventInterestedCount to community_events (denormalized for query performance)
- [x] Create tRPC procedures: markEventInterest, removeEventInterest, getEventInterests, getInterestedUsers
- [x] Create tRPC procedure: getMatchesInterestedInSameEvents(eventId)

### Events Page UX
- [x] Add "Interested" button to each event card (heart icon with count)
- [ ] Show "X people interested" count below event title
- [x] Clicking button toggles interest + shows confirmation toast
- [ ] Show list of interested users (avatars + names) when tapping count

### Matching Flow Integration
- [ ] Add event_interests to match card data (show if match is interested in upcoming events)
- [ ] Show "Also interested in [Event]" badge on match cards
- [ ] Highlight matches who are interested in same event this weekend
- [ ] Add "Want to go to [Event] together?" quick action button

### Proposal & Chat Flow
- [ ] Add "Want to go together?" button to match card and chat header
- [ ] Create proposal modal: select event + optional message
- [ ] Send proposal as special message type in chat
- [ ] Show proposal status in chat (pending / accepted / declined)
- [ ] Accept proposal → auto-add to calendar + show "You're going together!"

### Milwaukee Event Seeding
- [ ] Seed Summerfest (multi-week festival, major anchor)
- [ ] Seed Jazz in the Park (free recurring series)
- [ ] Seed Chill on the Hill (free recurring series)
- [ ] Seed Traveling Beer Gardens (seasonal)
- [ ] Seed Gallery Night (recurring)
- [ ] Seed Night Market (recurring)
- [ ] Seed ethnic festivals (Irish Fest, Mexican Fiesta, German Fest, PrideFest)
- [ ] Seed neighborhood events (Brady Street, Bay View, Riverwest, Third Ward)
- [ ] Seed State Fair and holiday markets

### Analytics & Insights
- [ ] Track "Interested" events (for trending/popular events)
- [ ] Track proposals sent/accepted (conversion metric)
- [ ] Show "trending this weekend" on Events page
- [x] Add drag-and-drop ordering for selected personalized homepage sections and persist new positions
- [x] Add homepage filters so events, plays, and activities can be sorted by date or category in place
- [x] Add homepage filters so events, plays, and activities can be sorted by date or category in place
- [x] Show administrator promotion date and last active login date in the admin member-management table
- [x] Make GPS-detected city and state authoritative for discovery, keep Waukesha separate from Milwaukee, and prevent broad-city fallback leakage
- [x] Show miles away and let members filter events and activities to a 10, 25, or 50-mile radius
- [x] Verify automatic GPS permission, exact city/state discovery, nearby event/activity results, distance labels, and radius filters across the mobile flow
- [x] Add manual city or ZIP-code location search with persisted override and a return-to-GPS control for traveling members
- [x] Add saved locations for home and frequently visited cities or ZIP codes with quick switching

## Homepage Experience Improvements
- [x] Add a useful “What’s happening near you” discovery strip to Home
- [x] Standardize event and activity card metadata and actions on Home
- [x] Add Today’s Plan persistence and Home actions for event/activity planning
- [x] Add calendar, directions, and safe social coordination handoffs to Today’s Plan
- [x] Add tests and verify the responsive Home experience

## Family Select Toast Feedback
- [x] Show a success toast when a valid Family Select gender option is selected
- [x] Add regression coverage and verify the Family interaction

## Family Invalid Selection Feedback
- [x] Show an error toast when a child submission has no valid gender selection
- [x] Add regression coverage and verify the Family validation flow

## Secure Credit-Card Processing
- [x] Enable a supported secure payment provider for credit-card checkout
- [x] Connect paid marketplace and service checkout actions to the payment provider
- [x] Add payment success, cancellation, and error handling with regression coverage

## Stripe Booking Confirmation
- [x] Create a secure payment confirmation page with completed booking details
- [x] Route Stripe Checkout success to the custom confirmation page
- [x] Repair the package lock mismatch and verify the production build

## Payment Confirmation Navigation
- [x] Add prominent View My Bookings and Return to Home actions to the payment confirmation page
- [x] Verify responsive confirmation navigation and regression checks

## Payment Confirmation Booking Loading Feedback
- [x] Show an accessible loading state when View My Bookings is selected
- [x] Add regression coverage and verify the confirmation navigation interaction

## Bookings Skeleton Loading
- [x] Add a card-shaped skeleton loading state for booking records
- [x] Add regression coverage and verify the mobile bookings loading layout

## Playable Social Games
- [x] Create the Local Legend, Plan the Perfect Saturday, Three Things in Common, and Would You Join Me game collection
- [x] Add safe public-event coordination handoffs from game outcomes
- [x] Add game interaction regression coverage and responsive verification

## Social Game Completion Celebration
- [x] Add reduced-motion-aware confetti to completed social games
- [x] Add a subtle opt-in browser success sound and regression coverage
- [x] Verify the completed-game presentation on mobile

## Social Game Results Sharing
- [x] Add native social sharing and clipboard fallback to completed game cards
- [x] Add privacy-conscious share copy and regression coverage
- [x] Verify the share action in the mobile completion layout

## Member Profile Dashboard
- [x] Add a protected member dashboard summary for upcoming bookings and game achievements
- [x] Build a responsive member dashboard with booking and achievement states
- [x] Add dashboard navigation, regression coverage, and mobile verification

## Dashboard Booking Management
- [x] Add dashboard cancellation control with confirmation and data refresh
- [x] Add a clear reschedule-request handoff for upcoming bookings
- [x] Add regression coverage and verify booking controls on mobile

## Dashboard Booking Status Badges
- [x] Add clear confirmed, pending-reschedule, and cancelled badge treatment to booking cards
- [x] Add badge-state regression coverage and mobile verification

## Confirmed Booking Calendar Export
- [x] Add a calendar export action for confirmed booking cards
- [x] Build reliable booking calendar event details and regression coverage
- [x] Verify calendar controls in the mobile booking layout

## Booking Calendar Provider Guidance
- [x] Add an accessible provider tooltip and hover affordance to Add to Calendar
- [x] Add regression coverage and verify the calendar control presentation

## Universal Calendar File Guidance
- [x] Make the .ics download fallback explicit for other calendar providers
- [x] Add regression coverage and verify the calendar guidance text

## Calendar File Download Feedback
- [x] Show a specific success toast after the standard .ics file download starts
- [x] Add regression coverage for calendar file download feedback

## Animated Calendar Download Toast
- [x] Add a motion-safe animated .ics success toast with a visible dismissal progress bar
- [x] Add regression coverage and verify the enhanced calendar download feedback

## Toast Notification Stacking
- [x] Configure multiple simultaneous toast notifications to stack without overlapping
- [x] Add regression coverage for multi-alert toast behavior

## Monetization Action Plan PDF
- [x] Define prioritized, community-aligned revenue streams and implementation milestones
- [x] Produce and verify a professional Just Putzit monetization action plan PDF

## Partner Results and Attendance Proof
- [x] Add privacy-conscious member attendance check-ins for completed bookings
- [x] Build protected partner-facing results metrics for bookings and check-ins
- [x] Add member and partner UI, regression coverage, and responsive verification

## Partner Results 30-Day Trends
- [x] Aggregate privacy-safe daily booking and attendance signals for the last 30 days
- [x] Add responsive 30-day booking and attendance charts to Partner Results
- [x] Add trend regression coverage and visual verification

## Partner Results Custom Date Range
- [x] Add validated custom date-range aggregation for partner booking and attendance trends
- [x] Add preset and custom date controls to Partner Results charts
- [x] Add date-range regression coverage and responsive verification

## Partner Trend Exact-Value Tooltips
- [x] Add hover and keyboard-accessible exact-value tooltips to booking and attendance chart points
- [x] Add interaction regression coverage and responsive verification

## Partner Trend Range Summary Cards
- [x] Calculate selected-range total bookings and average attendance from protected trend data
- [x] Add responsive selected-range summary cards above partner charts
- [x] Add summary calculation regression coverage and visual verification

## Waukesha Public Library Refresh
- [x] Audit the current Waukesha Public Library venue and event listings
- [x] Refresh current library public events from official sources
- [x] Verify the updated library listings on discovery views

## Header Overlap Repair
- [x] Fix overlapping desktop header navigation and account controls
- [x] Preserve a readable mobile header and navigation access
- [x] Add regression coverage and verify header layouts at responsive breakpoints

## Entertainment Refresh
- [x] Audit the current Entertainment page and local listing sources
- [x] Refresh current official entertainment events for the Waukesha and Milwaukee area
- [x] Verify the refreshed Entertainment discovery experience

## Waukesha Library Visibility Fix
- [x] Audit Waukesha location filtering and current library event visibility
- [x] Add a direct Waukesha Public Library discovery entry and clearer local placement
- [x] Verify the library is visible under Waukesha discovery views

## Primary Waukesha Library Visibility
- [x] Add Waukesha Public Library directly to the primary Home and Events discovery screens
- [x] Keep the entry visible and readable on desktop and mobile
- [x] Add regression coverage and verify the primary-screen placement

## Investor Deck and Five-Year Forecast
- [x] Define cautious, realistic, and optimistic five-year operating assumptions from the monetization plan
- [x] Build traceable three-case revenue and operating forecast outputs
- [x] Create and review an investor-ready slide deck with forecast disclosures

## Forecast Driver and CAC Breakdown
- [x] Reconcile the five-year revenue-driver formulas and scenario assumptions
- [x] Identify customer-acquisition-cost treatment, omissions, and model limitations
- [x] Deliver a transparent revenue-driver and CAC assumption breakdown

## One-Million-User Optimistic Case
- [ ] Define transparent one-million-user activation and optional-upgrade assumptions
- [ ] Model the optimistic-case user-scale revenue sensitivity and operating implications
- [ ] Update the investor forecast disclosure and deliver the revised optimistic case

## Free Member and Advertising Revenue Model
- [ ] Define privacy-conscious advertising, partner, booking, and promotion revenue assumptions for free members
- [ ] Model advertising-led revenue sensitivity and cost implications for the optimistic case
- [ ] Document the milestones required before considering a multi-billion-dollar enterprise-value outcome

## Free Member Profile Clarification
- [x] Reframe the optimistic case so user profiles are free and business-funded revenue drives monetization
- [x] Document business-partner, booking, promotion, and advertising assumptions without member subscription revenue

## Personalized Pickup Activities and Mixers
- [x] Learn activity preferences from member interest and attendance signals for similar-event recommendations
- [x] Add safe public pickup activity creation and opt-in nearby participation notifications
- [x] Include bowling singles mixer and pickup basketball formats with public-venue safeguards
- [x] Add regression coverage and responsive verification for personalized activity coordination

## Pickup Notification Follow-Through
- [x] Link pickup activity alerts directly to the public pickup coordination screen
- [x] Verify pickup notification call-to-action behavior

## Personalized Recommendation Filtering
- [x] Add distance, time, and activity-category filtering to personalized recommendations
- [x] Add stable sorting and empty-result states for recommendation filters
- [x] Add regression coverage and responsive verification for recommendation filtering

## Transparent Sponsored Event Placement
- [x] Define eligible business event sponsorship packages and clear disclosure rules
- [x] Add secure sponsored placement records, business ownership checks, and payment states
- [x] Build vendor promotion controls and labeled sponsored recommendation placement
- [x] Add regression coverage and verify desktop and mobile sponsored discovery layouts

## Sponsored Placement Expiration
- [x] Reflect expired sponsored placements accurately in the Vendor Portal and allow a new promotion purchase
- [x] Add regression coverage for active versus expired placement presentation

## Sponsored Placement Visibility Repair
- [x] Diagnose why sponsored placement controls and labels are not visible in the live user flow
- [x] Surface clear promotion entry points and member-facing sponsored states
- [x] Verify the repaired feature on desktop and mobile

## Sponsored Activity Performance Dashboard
- [x] Capture privacy-safe sponsored activity views, clicks, and sign-up actions
- [x] Aggregate business-owned sponsored placement performance and conversion rates
- [x] Add an accessible performance dashboard to the Vendor Portal
- [x] Add regression coverage and verify the dashboard on desktop and mobile

## Anonymous Sponsored Audience Summary
- [x] Aggregate sponsored sign-up age bands and interest themes with minimum-group suppression
- [x] Add a privacy-protected anonymous audience summary to business performance reporting
- [x] Add suppression regression coverage and responsive verification

## Waukesha Library Calendar Action
- [x] Add personal-calendar export controls to Waukesha Public Library program cards
- [x] Reuse verified calendar data and feedback for library event exports
- [x] Add regression coverage and responsive verification for the library calendar action

## Waukesha Library Event Sharing
- [x] Add native event sharing and clipboard fallback beside library calendar controls
- [x] Keep event share copy limited to public program details and official source links
- [x] Add regression coverage and responsive verification for library event sharing

## Personalized Similar Event Details
- [x] Add personalized related-event data beneath event details using explicit preference signals
- [x] Build local similar-event cards with clear relevance and empty states
- [x] Add regression coverage and responsive verification for event-detail recommendations

## Similar Event Distance Indicators
- [x] Add member-location distance calculations to personalized similar-event recommendations
- [x] Render Distance from you labels with no-location fallback
- [x] Add distance regression coverage and responsive verification for similar-event cards

## Similar Event Quick Bookmark
- [x] Add save and unsave actions directly to personalized similar-event cards
- [x] Show accessible bookmark state and save feedback without opening event details
- [x] Add regression coverage and responsive verification for quick bookmarking

## Similar Event Bookmark Toast Feedback
- [x] Show a distinct short success toast when a similar event is saved
- [x] Preserve clear removal feedback and add regression coverage
