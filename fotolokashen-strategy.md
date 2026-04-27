# Fotolokashen — Strategic Direction & AI Integration
- Apr 27, 2026 

## The Core Question You're Asking

> "Why would a user need fotolokashen when they can more easily plan with Claude, Gemini, or another AI assistant?"

This is exactly the right question. The honest answer right now: **they wouldn't** — if all they need is a one-time planning conversation. A user who types "help me scout locations in Rome for a news shoot" into Claude gets solid general advice instantly.

**But that's not who fotolokashen is for.** The question reveals the positioning gap, not a product flaw. Here's the reframe:

---

## The Positioning Gap (Current State)

Right now both the web app and iOS describe fotolokashen in one of two ways:

- **Too broad**: "location discovery and sharing platform" — sounds like Yelp or Google Maps
- **Too technical**: "GPS-tagged, geocoded, annotatable production notes" — sounds like a developer tool

Neither captures the actual value, which is **institutional memory made searchable and shareable**.

---

## What Fotolokashen Actually Is

Fotolokashen is a **production location intelligence system** — not a planning assistant, not a map app.

The distinction matters:

| What AI assistants do | What fotolokashen does |
|---|---|
| Generate generic advice about any location | Store **your crew's actual firsthand experience** at a location |
| Answer "what's parking like near the Colosseum?" | Answer "how did *we* set up at the Colosseum in 2024, who did we call, where did we park the truck" |
| Forget everything after the conversation | Remember everything permanently, searchable by everyone on your team |
| Can't see your photos or GPS tracks | Holds the actual photos your photographer took that day |
| No awareness of your organization's access points, contacts, or history | Is built from your organization's collective field knowledge |

**The one-line positioning:**

> **Fotolokashen is where your crew's location knowledge lives — so you don't have to re-learn the same locations every shoot.**

---

## The Answer to "Why Not Just Use Claude?"

Claude helped you plan a Europe trip because you were the expert — you provided all the context in the conversation. The output was only as good as what you brought in.

Now imagine a new producer joins your team and needs to plan a shoot in Brussels. They can use Claude and get generic tourism advice. **Or** they can open fotolokashen, search Brussels, and immediately see:

- The exact parking garage your last crew used with the address and the contact name
- The access point photo showing where the live truck fits
- A note that says "do not use this corner after 4pm — school pickup blocks the shot"
- Three locations your photographers rated ★★★★★ within 2km
- The production date from the last shoot there so they can reference the old planning docs

**Claude can't give them that.** No AI can — because that knowledge exists only in your organization and currently lives in someone's head or an email chain.

**The strategic position: fotolokashen is the knowledge base that makes AI planning better, not its competitor.**

---

## Platform Split — Web vs. iOS

You're right to differentiate. Here's the clean split:

### iOS App — The Field Tool
**Who uses it**: Individual photographers, field producers, scouts, crew on location  
**When**: During and after a shoot, in the field, away from a desk  
**What it does**: Capture → GPS tag → photo → note → sync. Fast, one-handed, camera-first.  
**Tagline**: `fotolokashen · Location Scouting`  *(already updated)*

### Web App — The Production Hub  
**Who uses it**: Production managers, coordinators, department heads, teams planning future shoots  
**When**: Pre-production planning, project review, sharing with stakeholders  
**What it does**: Browse, search, filter, share, assign, manage access, project-level planning  
**Tagline**: `fotolokashen · Production Location Intelligence`

---

## Unified Marketing Language

### The Problem with Current Taglines
- iOS: "Location Scouting" — ✅ clear but narrow (sounds like only scouting)
- Web: "Enhance your Google Maps experience" — ❌ completely wrong, sounds like a Maps plugin

### Proposed Unified Tagline (Across Both)
> **"Your crew's location knowledge, always with you."**

Or for more production-specific audiences:
> **"The location intelligence platform for production teams."**

### One-paragraph description (works for both App Store + web landing page):
> Fotolokashen is the location knowledge system built for production crews. Capture locations in the field with GPS, photos, and production notes — then search, share, and plan from any device. Every shoot becomes institutional knowledge your whole team can use. No more asking "where did we park?" or "who do we call at that building?"

---

## Agent-Assisted Planning — The Real Opportunity

This is where fotolokashen becomes significantly more valuable than it is today. The model isn't "compete with Claude" — it's **"give Claude a memory for your organization."**

### What's Possible Now (No New Infrastructure)

**1. AI-Enhanced Location Descriptions** *(already partially built)*
- User adds raw notes → AI cleans and structures them
- Current implementation: `/api/locations/improve-description`
- Opportunity: expand to summarize location history, pull in past production notes

**2. AI Tag Suggestions** *(already built)*
- Suggests relevant tags from photo EXIF + notes
- Opportunity: expand to suggest similar locations in the database

**3. Smart Search** *(not yet built)*
- Natural language queries: "show me all indoor locations we've used in the northeast that fit 3 cameras"
- Powered by: vector embeddings on location notes + semantic search
- Infrastructure needed: pgvector extension on Neon DB (low cost, high value)

### What's Possible in the Next Phase

**4. The "Brain Dump" Feature** *(mentioned in your notes)*
You described this perfectly already:
> "Write out everything needed for planning and let an agent format it into a clear start of planning."

This is a high-value, low-complexity feature:
- User types or voice-dictates rough planning notes in iOS
- Agent structures it: location needs, timing, crew requirements, equipment, access considerations
- Output is a formatted pre-production location brief
- Linked to actual database locations your team has scouted

**5. Location Intelligence Q&A (The Killer Feature)**
This is the direct answer to "why not just use Claude":

- User asks: "We're shooting in lower Manhattan next week, what's worked for us before?"
- System searches your location database + past production notes
- Agent synthesizes an answer grounded in **your organization's actual data**
- Returns: recommended locations with links, past crew notes, parking info, access contacts

This is **Retrieval Augmented Generation (RAG)** applied to production location knowledge.

**Stack needed:**
- Vector embeddings for location descriptions + notes (pgvector or Pinecone)
- LLM API (Anthropic Claude or Gemini, or both via routing)
- A new `/api/ai/query` endpoint that retrieves relevant locations + synthesizes response
- iOS UI: a simple chat-style query box in the search view

**Complexity**: Medium. The data model is already perfect for this. The main work is embedding generation and retrieval logic.

---

## What to Tell Test Users

When someone asks "what is this?", here's the 30-second pitch:

> "You know how every time you go back to a location you've shot before, someone on the crew has to dig through their phone or email to remember where we parked, who to call, or how we set up the last time? Fotolokashen fixes that. It's a shared location library where your team captures all that firsthand knowledge — photos, GPS, production notes — so anyone can look it up instantly. It's like institutional memory for your locations."

If they say "can't I just ask ChatGPT?":

> "ChatGPT knows about the Eiffel Tower. It has no idea that your crew found a spot on the northeast corner with clear sightlines and your truck fits under the archway. That's in here."

---

## Recommended Next Steps

### Immediate (no code)
1. **Update the web landing page tagline** — replace "Enhance your Google Maps experience" with unified positioning
2. **Align the App Store description** with the new one-paragraph copy above
3. **Define the two audiences clearly** in all onboarding and marketing material

### Short Term (1-3 months)
4. **Smart search with natural language** — the highest-value single feature for new users who don't know what's in the database
5. **"Brain Dump" planner** — AI-structured pre-production brief from rough notes (iOS-first)
6. **Slack integration** — the Slack story is powerful: executives are genuinely surprised when you can push structured location metadata and production notes from a third-party app directly into a planning channel. This is a strong proof-of-concept moment for enterprise sales.

### Medium Term (3-6 months)
7. **RAG-powered location Q&A** — "what's worked for us near X?" grounded in your database
8. **Enterprise workspace separation** — multi-tenant data isolation so CNN (workspace 1), Company B (workspace 2), etc. each have their own private knowledge base without any data leakage
9. **Projects/Assignments** — organize locations by production, distribute to crew

### Strategic
The iOS app becomes the field capture tool and the daily driver. The web becomes the production hub for planning and team management. AI runs through both — not as a chatbot, but as an intelligence layer that makes the data you've already captured dramatically more useful.

---

## Strategic Decisions (Resolved)

### 1. Primary Target User
**Decision**: CNN production staff in the short term. CNN is the proving ground — they're helping work out the bugs and validate the workflow in a real, high-volume production environment. Once the product is solid, add enterprise workspace separation so other production companies can purchase their own isolated instance.

**Implication for product**: The current single-tenant architecture needs a workspace/organization layer before external enterprise launch. Every piece of data — locations, photos, notes, users — needs to be scoped to an org. This is a significant but well-understood infrastructure change and the right time to plan for it is before the user base grows, not after.

**Implication for marketing**: The CNN validation story *is* the pitch to the next enterprise customer. "Built with and used by CNN production crews" is a strong proof point for any broadcaster, network, or production company.

---

### 2. Web App Future — Team/Project Management
**Decision**: Yes, the web app is the team and project management hub. A solo freelancer working across multiple clients is also a valid power user — they'd use fotolokashen to organize their location knowledge by client/project and share relevant subsets.

**Slack is the critical integration** — you've already seen this work on another project. The moment an executive can see a location brief, GPS coordinates, photos, and production notes appear directly in a Slack planning channel — without anyone copying and pasting — the value proposition becomes self-evident. This is the integration that sells the enterprise tier.

**What the Slack integration enables:**
- `/fotolokashen share [location]` → drops a formatted location card into any channel
- Auto-post to a `#planning` channel when a location is approved for production
- Crew can reply in Slack, comments sync back to the location record
- Pre-production location brief pushed to channel with one tap from iOS

---

### 3. AI Infrastructure — What This Really Means

This question isn't primarily about cost. It's about **how the AI layer is architected** and who owns the data relationship with the AI provider. Here's the breakdown:

#### The Two Models

**Model A — Bring Your Own Key (BYOK)**
Enterprise customers like CNN bring their own AI API credentials. CNN already has enterprise agreements with Anthropic, Google, or OpenAI — often with negotiated privacy terms that ensure their data doesn't train the model and stays within compliance boundaries.

In this model, fotolokashen acts as the orchestration layer:
- Your app sends the query + retrieved location context to *their* AI endpoint using *their* key
- CNN's IT/legal team is comfortable because data flows through their existing vendor agreement
- Fotolokashen doesn't pay for inference costs at scale — the enterprise does
- You build a single AI integration layer with configurable provider/key per workspace

This is the right model for regulated industries (broadcasting, healthcare, finance) where data governance matters.

**Model B — Managed AI (Fotolokashen pays, charges per seat or usage)**
Fotolokashen operates the AI layer centrally. You pay for inference and build that cost into the subscription price. Simpler to build initially, but:
- You take on the data privacy responsibility for all customers
- Cost scales with usage and needs careful monitoring
- Harder to sell to enterprise legal/compliance teams who want their own AI agreement
- Works well for individual freelancers and small teams who don't have enterprise AI agreements

#### The Right Architecture for Your Situation

Given CNN as the anchor customer and the enterprise expansion roadmap, the answer is:

> **Build a provider-agnostic AI layer with BYOK support, and run a managed fallback for smaller tiers.**

In practice:
- The AI integration is abstracted behind an internal interface: `AIPlanningService`
- At the workspace level, an admin can configure: provider (Anthropic / Google / OpenAI), API key, and model preference
- If no key is configured, fall back to a managed key (fotolokashen's) with usage limits tied to the subscription tier
- CNN plugs in their enterprise Anthropic key → data flows through their agreement, your AI features work, you pay $0 for their inference
- A freelancer on the solo tier uses the managed key with a monthly query limit

#### What This Enables Practically

| Tier | AI Access | Data Governance |
|---|---|---|
| Solo / Freelancer | Managed key, limited queries/month | Fotolokashen's standard ToS |
| Team | Managed key, higher limits | Fotolokashen's standard ToS |
| Enterprise (e.g. CNN) | BYOK — their own API key | Their enterprise AI vendor agreement |

#### The Infrastructure This Requires

The core investment is **vector embeddings + retrieval** — this is what makes the AI answers accurate and grounded in your actual location data rather than hallucinated:

1. **pgvector on Neon DB** — a PostgreSQL extension (already your DB) that stores vector embeddings alongside location records. Low cost to add, no new infrastructure vendor.
2. **Embedding pipeline** — when a location is saved or updated, generate an embedding of its description + notes + tags and store it. This runs as a background job.
3. **RAG query handler** — on a user question, embed the query, retrieve the top-N most relevant locations, pass them as context to the LLM, return a grounded answer.
4. **Provider abstraction layer** — a thin service that accepts provider/key config and routes to the right API.

The data you've already collected (location notes, photos, production details, tags) is exactly the right raw material. The engineering work is building the retrieval layer on top of it.
