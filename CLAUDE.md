# Trips Hub — Claude Code Setup Guide

This is a universal travel hub template. Your job is to customize it for a specific trip
by editing `src/trip.config.ts` and nothing else (unless the user asks for more).

---

## How to set up a new trip

When the user says something like:
> "Setup this hub for my trip to Japan: Tokyo 6 nights, Kyoto 4 nights, Osaka 3 nights.
>  I love gastronomy and temples. Traveling as a couple, mid-range budget."

Follow these steps **in order**:

### Step 1 — Parse the trip

Extract from the user's message:
- **Destinations** in travel order (city names + nights)
- **Start date** if provided, otherwise leave as placeholder
- **Travel style**: budget / mid-range / luxury
- **Interests**: food, culture, nature, nightlife, shopping, adventure, etc.
- **Number of travelers**

### Step 2 — Generate city IDs

Create a short lowercase ASCII slug for each city, no spaces or accents:
- "Tokio" → `tokyo`
- "Buenos Aires" → `bsas`
- "São Paulo" → `saopaulo`
- "México DF" → `cdmx`

These become the `CityKey` values used everywhere.

### Step 3 — Edit `src/trip.config.ts`

Fill in **all 9 sections** of the config file:

#### TRIP_NAME, TRIP_EMOJI, TRIP_TAGLINE
Choose an appropriate emoji for the destination country/region.

#### CITIES
For each destination:
- `label`: Display name in the local language (e.g. "Tokio", not "Tokyo" if the user speaks Spanish)
- `bg`: A dark accent color that feels right for that city/country (hex). Examples:
  - Japan: red `#C0392B` or deep indigo `#2C3E7A`
  - France: navy `#1A2650` or bordeaux `#8B1A4A`
  - Greece: blue `#1A6BAA` or terracotta `#C0714A`
  - Italy: verde `#2E7D5E` or rosso `#C0392B`
  - Morocco: terracotta `#C8602A` or deep teal `#1A6B6B`
- `soft`: A very light tint of the same color family (5-8% opacity equivalent)
- `coord`: Real GPS coordinates `[lat, lng]` — look these up accurately
- `order`: 0-based index in travel order

#### INIT_CONFIG
- `startDate`: Use format `YYYY-MM-DD`. If not given, set to `2026-01-01` as placeholder
- `cityNights`: nights per city as provided

#### ROUTE_SEGMENTS
Generate one segment per consecutive city pair. Use realistic:
- `mode`: the most common transport between those cities
  - Same country, <300km: `Tren`
  - Same country, >500km: `Vuelo`
  - Island hopping: `Vuelo` or `Ferry`
  - Road trip: `Auto`
  - Nearby cities: `Bus`
- `time`: realistic travel time including check-in buffer for flights
- `distanceKm`: approximate real distance

#### DEFAULT_POIS
Generate **8–12 POIs per city** based on the user's interests. For each POI:
- `id`: `{cityId}-{n}` (e.g. `tokyo-1`)
- `category`: one of `museo | restaurante | barrio | mirador | playa | monumento | compras | otro`
- `coord`: real GPS coordinates (accurate!)
- `notes`: one useful sentence — opening hours, price, local tip
- `visited`: always `false`

Prioritize POIs matching the user's stated interests. Include at least:
- 2 iconic monuments
- 2 neighborhoods/areas to walk
- 2 restaurants or food markets
- 1 viewpoint or park
- 1 museum (if they like culture)

#### DEFAULT_LINKS
Generate **3–5 links per city**:
- 1–2 YouTube travel videos (real videos you know exist for that destination)
- 1 official tourism/booking site
- 1 Google Maps link to the city center

Format: `https://youtu.be/{known-video-id}` only if you're confident the video exists.
When unsure, skip video links rather than hallucinate URLs.

#### CITY_TEMPLATES
Generate **one DayTemplate per day per city** (nights + 1 optional arrival day).
Keep activity lists realistic — 3–5 things per day, not overwhelming.
First day of each city: include arrival/transport activity.
Last day of each city: lighter schedule if traveling next day.

#### INIT_BUDGET
Estimate nightly costs in EUR based on travel style:
- Budget:    airbnb 40-60, food 25-35, transport 8-12, activities 10-15
- Mid-range: airbnb 70-100, food 45-65, transport 12-18, activities 20-30
- Luxury:    airbnb 150-250, food 80-120, transport 20-35, activities 40-60

Adjust by destination cost-of-living:
- Japan, Scandinavia, Switzerland: +30%
- Southeast Asia, Eastern Europe: -40%
- Western Europe, Australia: base
- Latin America: -20% to -30%

### Step 4 — Verify

After editing trip.config.ts, run:
```
npx tsc --noEmit
```
Fix any TypeScript errors before reporting done.

### Step 5 — Report

Tell the user:
- How many cities configured
- Total trip days
- Total POIs generated
- Remind them to run `npm run dev` to preview

---

## Rules

- **Only edit `src/trip.config.ts`** unless the user asks for more changes
- **Never hallucinate coordinates** — use real GPS values. If unsure, use the city center
- **Never hallucinate URLs** — skip links you're not confident about
- **Keep comments** in the config file for any field that's a placeholder
- **Respect the user's language** — if they write in Spanish, use Spanish labels

---

## Slash commands

### /setup-trip
Runs the full setup flow above. Prompt the user for any missing info before starting.

### /add-city <name> <nights>
Adds one more destination to an existing configured trip.
Updates CITIES, INIT_CONFIG.cityNights, ROUTE_SEGMENTS (last city → new city), INIT_BUDGET, and adds 8+ POIs.

### /change-dates <start-date>
Updates INIT_CONFIG.startDate and regenerates CITY_TEMPLATES day counts if needed.

### /add-pois <city> <interests>
Adds 5+ more POIs to a specific city based on the given interests.
