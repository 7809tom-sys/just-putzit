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
