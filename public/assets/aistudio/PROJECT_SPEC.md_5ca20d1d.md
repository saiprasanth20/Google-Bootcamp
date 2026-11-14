# Project Specification: EventSphere (Social Event & Networking Platform)

## 1. Executive Summary
EventSphere is a location-aware social networking and event discovery web application designed primarily for tech events, hackathons, summits, and community meetups—while remaining extensible to any public event. Unlike traditional ticketing platforms (Eventbrite, Luma) that stop at registration, EventSphere bridges the **pre-event coordination gap** (finding co-attendees, forming hackathon teams, planning travel) and the **post-event reflection gap** (sharing key takeaways, project showcases, photos, and building verified "co-attendee" connections).

## 2. Core Value Proposition
* **Discover Globally & Locally:** Interactive 3D Globe dashboard + Google Maps integration to explore events visually by region, category, and date.
* **Pre-Event Squads:** See who else is attending an upcoming event, match based on skills/interests, and coordinate travel or team formation before doors open.
* **Post-Event Proof of Work:** Turn attendance into a portfolio. Users publish structured recaps ("What I Built," "Key Takeaways," "Event Vibe/Process," photo galleries) tagged to the event.
* **Verified Alumni Graph:** Connect specifically with people who attended the same past events, eliminating cold-outreach friction.

## 3. Target Audience & User Personas
1. **The Builder / Hackathon Attendee:** Wants to find teammates before an event, showcase their demo afterward, and connect with mentors/judges.
2. **The Conference Explorer:** Travels to summits/meetups, wants to know who is flying in from their city, and shares synthesized notes/learnings.
3. **The Event Organizer / Community Lead:** Wants organic post-event visibility, attendee engagement, and aggregated recap feeds.

## 4. Functional Requirements & Modules

### 4.1 Authentication & User Profiles
* **Auth:** Email/Password + OAuth (Google, GitHub, LinkedIn).
* **Profile ("Builder Passport"):**
  * Bio, role, current organization/university, tech stack/interest tags, social links.
  * **Event Timeline:** Split into *Upcoming Events (Going)* and *Past Events (Attended)* with verified badges.
  * **Showcase Wall:** Grid of all post-event recaps, photos, and project links posted by the user.

### 4.2 Interactive Globe & Google Maps Discovery Dashboard
* **3D Globe View (Landing Hero / Explorer Mode):**
  * Interactive WebGL/Three.js globe plotting active event hubs with glowing pulse markers scaled by attendee count.
  * Clicking a city/region smoothly zooms into a localized **Google Maps API** view.
* **Google Maps Integration:**
  * Custom dark/light map styling with clustered event pins.
  * Venue details, transit/walkability info, nearby co-working/coffee spots for pre-event meetups, and "People from your network nearby" indicators.
* **Event Aggregation & Enrichment (Google Search / Grounding):**
  * Users can submit event URLs or search for events; backend uses Google Search grounding / structured scraping to auto-populate event title, dates, venue coordinates, speakers, and official links.

### 4.3 Event Hub (Single Event Page)
Each event has a dedicated workspace divided into three lifecycle tabs:
1. **Overview & Location:** Description, schedule, Google Map embed, official link, and RSVP toggle (*Interested*, *Going*, *Attended*).
2. **Attendee Lobby (Pre-Event Networking):**
   * Filterable directory of users marked *Going* (filter by Role, Skills, Looking for Team, Traveling From).
   * "Looking for..." status badges (e.g., *Looking for Frontend Dev*, *Splitting cab from airport*, *Down for coffee*).
   * Direct connection requests & lightweight event-scoped group threads/icebreakers.
3. **Recaps & Showcase (Post-Event Feed):**
   * Structured posts from verified attendees containing:
     * **Summary & Process:** How the event went, registration/selection process, organization quality.
     * **Key Learnings:** Bullet takeaways, tech stacks explored, talk notes.
     * **Media Gallery:** Multi-photo upload (venue, demos, group selfies) + GitHub/Demo links.

### 4.4 Networking & Messaging Engine
* **Contextual Connection Requests:** Instead of blank invites, requests auto-attach context (e.g., *"Both attending India AI Summit"* or *"Both attended ETHIndia 2025"*).
* **1:1 Direct Messaging & Mini-Squad Chats:** Real-time chat to coordinate meetups at the venue or follow up afterward.

## 5. Recommended Technical Architecture
* **Frontend:** React (TypeScript), Tailwind CSS, Lucide Icons.
* **3D Globe & Maps:** `react-globe.gl` (or Three.js) for the macro globe view + `@vis.gl/react-google-maps` (Google Maps JavaScript API + Places API) for street-level venue mapping.
* **Backend & Database:** Supabase or Firebase (PostgreSQL/Firestore, Auth, Storage for event photos, Realtime subscriptions for chat).
* **AI & Search Grounding:** Gemini API with **Google Search Grounding** to fetch live event metadata, verify event details, and summarize community takeaways for any event.

## 6. MVP Milestones
* **Phase 1 (Prototype):** UI/UX flows in Google Stitch (Globe Dashboard, Map Split View, Event Hub, Recap Composer, Profile).
* **Phase 2 (AI Studio Build):** Interactive React app with state management, Google Maps API integration, and Gemini Search Grounding for live event lookup.
* **Phase 3 (Production Persistence):** Connect Auth, Cloud Database, and Image Storage.