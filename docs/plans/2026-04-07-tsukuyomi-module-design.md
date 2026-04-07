# Tsukuyomi Module — Player Development System

**Module:** #15 in MikeOS dashboard
**Route:** `/dashboard/tt`
**Purpose:** Single source of truth for Mike's competitive table tennis journey toward the 2026 Jamaican National Championship (November 2026).

---

## Player Identity: Tsukuyomi

A playing identity built around ball 1-2-3 control, a complete backhand system, and match-level adaptation that tightens across games. The opponent is in your genjutsu from ball 1 — they just don't know it yet.

### The Uchiha Arsenal (System Language)

| Concept | Table Tennis Mapping | Description |
|---------|---------------------|-------------|
| **Sharingan** | Serve/receive, pattern recognition | The read. Solving opponents across games. |
| **Tsukuyomi** | Overall identity | They're in your world from ball 1. |
| **Amaterasu** | Forehand system | Doesn't come out every rally, but inescapable when it does. |
| **Susanoo** | Flow state | Both wings active, movement easy, full armor. 11-3 sets. |
| **Totsuka** | Kill shot | Beautiful, powerful, seals the point. Walk-off energy. |
| **Yata Mirror** | Block/counter game | When Susanoo is active, nothing gets through. |

### Mode System

Tracked per session. The critical self-check: "Did you respect Mode 1 today?"

| Mode | Name | State |
|------|------|-------|
| 1 | **Calibration** | Reading, spinning properly, gathering data. Patient aggression. Not rushing. |
| 2 | **Building** | Found something. Rhythm developing. Placement with intention. |
| 3 | **Susanoo** | Full flow. Both wings. Right shot every time. Invincible. |
| 4 | **Override** | No solution found. Controlled violence — power, angles, tempo shifts. By choice, not panic. |

**Known vulnerability:** Skipping Mode 1 and jumping to Override before calibrating. The boot sequence must be a discipline, not a feeling.

---

## Architecture

### Route Structure

```
/dashboard/tt                    → Dashboard (hub)
/dashboard/tt/log                → Training log (list + new entry)
/dashboard/tt/log/[id]           → Session detail
/dashboard/tt/atlas              → Technique Atlas overview
/dashboard/tt/atlas/[shot]       → Individual shot page (your game + reference model)
/dashboard/tt/lab                → Equipment Lab
/dashboard/tt/matches            → Match journal list
/dashboard/tt/matches/[id]       → Match detail + scouting card
/dashboard/tt/plan               → Periodization calendar
```

### API Routes

```
/api/tt/sessions                 → GET (list), POST (create)
/api/tt/sessions/[id]            → GET, PUT, DELETE
/api/tt/techniques               → GET (all ratings), POST (new rating snapshot)
/api/tt/techniques/[shot]        → GET (shot detail + history)
/api/tt/references               → GET, POST (technique reference models)
/api/tt/equipment                → GET (list), POST (new entry)
/api/tt/matches                  → GET (list), POST (create)
/api/tt/matches/[id]             → GET, PUT, DELETE
/api/tt/periods                  → GET (all phases), PUT (update phase)
```

---

## Data Model (Prisma)

### TTSession (Training Log)

```prisma
model TTSession {
  id          String   @id @default(cuid())
  date        DateTime
  duration    Int      // minutes
  location    String?
  blade       String   // "FZD ALC" | "Q968"
  mode1Respected Boolean?  // Did you respect calibration?
  peakMode    Int?     // Highest mode reached (1-4)
  energyLevel Int?     // 1-10
  notes       String?
  drills      TTDrill[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("tt_sessions")
}
```

### TTDrill

```prisma
model TTDrill {
  id          String    @id @default(cuid())
  sessionId   String
  session     TTSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  name        String    // "BH flick receive", "Serve + ball 3 attack"
  category    String    // "sharingan" | "amaterasu" | "totsuka" | "yata-mirror"
  technique   String?   // specific shot: "bh-flick", "fh-opening-loop", etc.
  rating      Int?      // 1-10 how it felt today
  notes       String?
  createdAt   DateTime  @default(now())

  @@map("tt_drills")
}
```

### TTTechniqueRating (Progression Tracking)

```prisma
model TTTechniqueRating {
  id        String   @id @default(cuid())
  shot      String   // "bh-flick", "bh-opening-loop", "fh-block", etc.
  rating    Int      // 1-10
  date      DateTime
  notes     String?
  createdAt DateTime @default(now())

  @@map("tt_technique_ratings")
}
```

### TTTechniqueReference (Pro Player Study)

```prisma
model TTTechniqueReference {
  id               String   @id @default(cuid())
  shot             String   // "bh-flick"
  playerName       String   // "Lin Yun-Ju"
  mechanicsBreakdown String? // written analysis of their technique
  extractionNotes  String?  // what specifically you're taking from them
  comparisonNotes  String?  // your mechanics vs theirs
  videoLinks       Json?    // [{url, timestamp, description}]
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@map("tt_technique_references")
}
```

### TTMatch (Match Journal)

```prisma
model TTMatch {
  id              String   @id @default(cuid())
  date            DateTime
  opponent        String
  opponentNotes   String?  // archetype/style description (free text)
  result          String   // "3-1", "3-2", "1-3", etc.
  scores          Json?    // [{"you": 11, "them": 4}, {"you": 11, "them": 9}, ...]
  blade           String   // "FZD ALC" | "Q968"
  tournament      String?  // tournament name or "practice"
  whatWorked      String?
  whatBroke        String?
  tacticalNotes   String?  // for next time
  servesUsed      String?  // which serves worked
  receiveNotes    String?  // what gave trouble
  peakMode        Int?     // highest mode reached
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("tt_matches")
}
```

### TTEquipmentLog

```prisma
model TTEquipmentLog {
  id              String    @id @default(cuid())
  item            String    // "Zyre 03", "J&H C52.5", "Q968"
  type            String    // "rubber" | "blade"
  side            String?   // "fh" | "bh" (for rubbers)
  blade           String?   // which blade it was tested on
  dateStarted     DateTime
  dateEnded       DateTime?
  satisfaction    Int?      // 1-10
  pros            String?
  cons            String?
  verdict         String?   // "kept" | "discarded" | "revisit"
  revisitConditions String? // under what conditions to try again
  notes           String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@map("tt_equipment_log")
}
```

### TTBoostLog

```prisma
model TTBoostLog {
  id        String   @id @default(cuid())
  rubber    String   // "J&H C57.5"
  blade     String   // "FZD ALC"
  side      String   // "fh" | "bh"
  booster   String   // "Haifu Yellow" | "Falco Tempo Long"
  date      DateTime
  notes     String?
  createdAt DateTime @default(now())

  @@map("tt_boost_log")
}
```

### TTPeriodPhase

```prisma
model TTPeriodPhase {
  id          String   @id @default(cuid())
  name        String   // "Foundation", "Development", etc.
  startMonth  DateTime
  endMonth    DateTime
  focusAreas  Json     // ["BH flick rebuild", "Mode 1 discipline"]
  targets     Json     // ["Flick 5->6.5", "Stop rushing calibration"]
  reviewNotes String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("tt_period_phases")
}
```

---

## Module Sections

### 1. Dashboard (`/dashboard/tt`)

Landing page. Shows:
- Current periodization phase and its focus areas
- Last session summary (date, duration, mode check)
- Technique spotlight: 2-3 shots actively developing, current ratings, trend arrows
- Days to nationals counter
- Quick log button

### 2. Training Log (`/dashboard/tt/log`)

List of all sessions, reverse chronological. Each entry shows date, duration, blade, peak mode, mode 1 check.

**New session form:**
- Date, duration, location
- Blade selector (FZD ALC / Q968)
- Mode 1 respected? (yes/no — the critical self-check)
- Peak mode reached (1-4)
- Energy level (1-10)
- Drills performed (add multiple):
  - Name, category (Sharingan/Amaterasu/Totsuka/Yata Mirror), technique tag, rating, notes
- Session notes (free text)

### 3. Technique Atlas (`/dashboard/tt/atlas`)

Overview grid of all shots. Each card shows shot name, current rating, category icon, trend arrow.

**Individual shot page (`/dashboard/tt/atlas/[shot]`):**

Split view:

**Your Game:**
- Current rating + rating history chart
- Your mechanics notes (grip, stance, contact, follow-through)
- What works / what breaks down
- Recent drill log (filtered from training sessions)
- Your video clips (when filming starts)

**Reference Model:**
- Pro player name and photo/avatar
- Their mechanics breakdown (written analysis)
- Curated video links with timestamps and descriptions
- What you're extracting from them specifically
- Gap analysis: their mechanics vs yours

**Initial shot inventory:**

| Shot | Category | Rating | Reference Player |
|------|----------|--------|-----------------|
| BH flick | Sharingan | 5 | Lin Yun-Ju |
| BH opening loop | Totsuka | 8 | Lin Shidong / Fan Zhendong |
| BH counter/rally loop | Totsuka | 6 | Lin Shidong |
| BH block/redirect | Yata Mirror | 7.5 | Fan Zhendong |
| BH kill/finish | Totsuka | 7 | Fan Zhendong |
| BH push/touch | Sharingan | 8 | — |
| FH opening loop | Amaterasu | 9 | Fan Zhendong |
| FH counter/rally loop | Amaterasu | 8 | Fan Zhendong |
| FH kill/smash | Amaterasu | 9 | Fan Zhendong |
| FH block | Yata Mirror | 4 | — |
| FH flick | Sharingan | 4 | — |
| FH push/touch | Sharingan | 8 | — |
| Pendulum serve | Sharingan | — | Lin Yun-Ju |
| Reverse pendulum | Sharingan | — | — |
| Backhand serve | Sharingan | — | Dimitrij Ovtcharov |
| Receive (general) | Sharingan | — | Lin Yun-Ju |

### 4. Equipment Lab (`/dashboard/tt/lab`)

**Current Setup** — snapshot of both blades with rubbers, weights, boost dates.

**Timeline** — chronological rubber/blade history with full decision context.

**Testing Journal** — active tests with multi-session notes and verdict tracking.

**Boost Tracker** — last boost date per rubber/blade/side. Visual indicator when boost is aging.

**Current setup to seed:**

| | FZD ALC (195g) | Q968 (203g) |
|---|---|---|
| FH | J&H C57.5 + Haifu Yellow | J&H C57.5 + Haifu Yellow |
| BH | J&H C52.5 + Falco Tempo Long | J&H C52.5 + Falco Tempo Long |
| Role | Ball 3 dominance, lighter, immediate | Extended rallies, explosive ceiling |

**Rubber history (BH):** Dignics 09C → Dignics 05 → Zyre 03 → J&H C52.5
**Rubber history (FH):** Dignics 09C → Dignics 05 → H3 Neo Blue 39° → J&H C57.5

**Long-term notes:**
- H3 Neo is the endgame FH rubber once physicality catches up
- Q968 weight reduction is worth exploring (C55 instead of C52.5?)
- Open to blade consolidation if right option appears

### 5. Match Journal (`/dashboard/tt/matches`)

List of all matches. Filter by opponent, tournament, result.

**Match detail page:**
- Full scorecard (per game scores)
- Blade used
- What worked / what broke
- Serves used and effectiveness
- Receive notes
- Peak mode reached
- Opponent scouting card (name, style description, vulnerabilities, notes for next time)

### 6. Periodization (`/dashboard/tt/plan`)

Calendar view of the road to November 2026.

| Phase | Months | Focus | Key Targets |
|-------|--------|-------|-------------|
| Foundation | Apr-May | BH flick rebuild, Mode 1 discipline, footwork efficiency | Flick 5→6.5, conscious calibration |
| Development | Jun-Jul | BH counter-loop consistency, FH block, fitness ramp | Counter 6→7.5, crossover improvement |
| Integration | Aug-Sep | Full game under pressure, serve/receive sharpening | All systems under pressure |
| Competition | Oct-Nov | Broward tournament reps, tactical prep, peaking | Peak form for nationals |

Each phase links to relevant technique atlas entries and shows progress against targets.

---

## Player Profile (Reference Context)

### Physical
- 29 years old, 6ft
- Fitness: 6.5/10, just started calisthenics
- Stamina degrades over long sessions due to footwork inefficiency
- 2027 physical targets: lower body strength, balance, pivot speed (Wang Chuqin evolution)

### Training
- 3x/week, 4hrs/session
- 6hrs/week dedicated backhand work
- Structured: specific feeds → freeform rally
- No coach — video study and self-correction
- Eleven TT (Meta Quest 3) planned, not yet acquired
- Plans to film training/matches

### Game Architecture
- **Serve:** Pendulum (5+ variations, primary), reverse pendulum, backhand (Ovtcharov), hook/scoop (learning)
- **Receive:** Defaults to push on short backspin (upgrading to flick threat), can be more aggressive on long serves
- **FH:** Elite attack (9, 8, 9), weak block (4) and flick (4), solid touch (8)
- **BH:** Strong foundation (opening loop 8, block 7.5, touch 8), flick in rebuild (5), counter-loop needs discipline (6)
- **Movement:** Effective but inefficient. Crossover zone is weakest. Decision speed (BH or FH?) causes hesitation.
- **Stance:** Neutral to FH-aggressive, working on centering

### Mental Game
- When down: stays analytical ("I haven't solved him yet but I will")
- At 9-9: trusts best patterns, hint of tightening
- Core vulnerability: rushing Mode 1, skipping calibration
- Loss chain: receive pressure → uncertainty → rushing → movement hesitation → collapse

### Competitive
- Top 20 Jamaica (estimated)
- Target: 2026 National Championship (November)
- Format: group stage + knockout, Bo5, Bo7 finals
- Plan: develop in Jamaica Apr-Sep, compete in Broward Oct-Nov before nationals

### Aspirational Models
- **Lin Yun-Ju:** serve, receive, flick mastery
- **Fan Zhendong:** complete game template, backhand power/versatility
- **Lin Shidong:** compact BH swing, rally sustain
- **Hugo Calderano:** effortless mid-range bombs, refuses easy balls
- **Ma Long:** tactical brain (FH out of reach currently)
- **Wang Chuqin:** explosive physicality (2027 evolution target)

---

## Design Notes

- Follows MikeOS sumi-e design system (ink, parchment, vermillion)
- Uchiha framework is system language, not decoration — categories, mode names, and terminology are integrated throughout
- Sub-routes break from single-page-per-module convention due to depth — this is intentional
- Mobile-first for logging at the club
- v2 considerations: player archetype taxonomy, Eleven TT integration, video upload/annotation
