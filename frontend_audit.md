# CARMA Frontend — Full Code Audit

> **Stack:** Next.js 16 · React 19 · TypeScript 5 · Tailwind CSS 4 · Geist/Geist Mono fonts  
> **Pages:** 3 routes (`/`, `/health-impact`, `/solutions`)  
> **Source files audited:** 22 (16 components, 4 data modules, 1 context, 1 config, 1 API route, 3 page files, 1 layout, 1 CSS)

---

## 1 — Component Inventory

### Layout / Global

| Component | File | Purpose | Props / State | Reuse |
|-----------|------|---------|--------------|-------|
| **RootLayout** | `app/layout.tsx` | Wraps every page; loads fonts, `<GlobalProvider>`, `<Navigation>`. | `children: ReactNode` | Global (1×) |
| **Navigation** | `Navigation.tsx` | Sticky top-bar with logo + 3 route links. Active state via `usePathname()`. | None (reads pathname). | Global (1×) |
| **Reveal** | `Reveal.tsx` | Scroll-triggered fade-in wrapper (IntersectionObserver). | `children`, `className?`, `delay?: number`. State: `isVisible`. | **Reused** heavily (≈18 instances across CausalGraph, AQIHealthImpact, SolutionsCatalog). |
| **GlobalProvider** | `GlobalStateContext.tsx` | React Context providing AQI data + health analysis + refresh/generate functions across all pages. | State: `aqiData`, `isLoading`, `healthAnalysis`, `isAnalyzing`. | Global (1×) |

### Page: `/` (CausalGraph — Policy Simulator Dashboard)

| Component | File | Lines | Purpose | Props / State | Reuse |
|-----------|------|-------|---------|--------------|-------|
| **CausalGraph** | `CausalGraph.tsx` | 436 | Master orchestrator for `/`. Renders ReactFlow graph, policy generator, ImpactPanel, EmissionForecast, AQITrends, HistoricEmissions, PolicySimulator, AQIMaps, EmissionMaps, SectorMaps. | State: nodes, edges, impact, policy, loading, researchQuery, isFullScreen. | One-off |
| **CausalNode** | `nodes/CausalNode.tsx` | 102 | Custom ReactFlow node (sector slider, intermediate, output types). | `data: NodeData` (label, value, enabled, type, onChange). | Reused per graph node (6 instances) |
| **simulation.ts** | `simulation.ts` | 50 | Pure function `runSimulation()` — propagates values through graph edges. | Receives `Node[]`, `Edge[]`; returns updated nodes. | Utility |
| **ImpactPanel** | `ImpactPanel.tsx` | 236 | Displays CO₂/AQI impact metrics + cascade analysis after AI policy is applied. | `impact: Impact \| null`, `policy?: {...} \| null`. | One-off |
| **EmissionForecast** | `EmissionForecast.tsx` | 211 | Line chart (recharts) showing historical + predicted CO₂ emissions (30/60/90 days). | State: `data`, `loading`, `days`. | One-off |
| **AQITrends** | `AQITrends.tsx` | 180 | Line chart of historical AQI + 6-month AI forecast. | State: `data`, `loading`. | One-off |
| **HistoricEmissions** | `HistoricEmissions.tsx` | 242 | Dual line charts (CO₂ + AQI) for monthly historic data 2019-2025. | State: `data`, `loading`. | One-off |
| **PolicySimulator** | `PolicySimulator.tsx` | **1177** | Largest component. Policy picker (pill buttons), year selector, simulation chart (ComposedChart), economic summary, sector breakdown, model calculation table, text report generator, PDF generator (jsPDF + html2canvas), floating AI chat (react-markdown). | State: policies, selectedPolicies, selectedYear, simulation, loading, chatOpen, chatQuery, chatHistory. | One-off |
| **AQIMaps** | `AQIMaps.tsx` | 165 | Renders two server-generated map images (heatmap + hotspots) side-by-side with year dropdown. | State: `selectedYear`, `isLoading`. | One-off |
| **EmissionMaps** | `EmissionMaps.tsx` | 189 | Same pattern as AQIMaps but for CO₂ emission maps. Also renders a fixed-position legend. | State: `selectedYear`, `isLoading`. | One-off |
| **SectorMaps** | `SectorMaps.tsx` | 213 | Sector-specific emission maps with sector selector bar + year dropdown. | State: `selectedSector`, `selectedYear`, `isLoading`. | One-off |

### Page: `/health-impact`

| Component | File | Lines | Purpose | Props / State | Reuse |
|-----------|------|-------|---------|--------------|-------|
| **AQIHealthImpact** | `AQIHealthImpact.tsx` | 312 | Page-level component. AQI category selector, vulnerable population analysis, safeguards, floating live AQI indicator. Contains sub-components `AQISelector` and `VulnerableGroupCard` (inlined). | State: `selectedCategory`. Reads `aqiData` from context. | One-off |
| **LiveAQI** | `LiveAQI.tsx` | 101 | Displays live AQI value, pollutant grid, and embeds HealthImpact. | `onAqiUpdate?: (aqi: number) => void`. | Reused in AQIHealthImpact bottom section |
| **HealthImpact** | `HealthImpact.tsx` | 171 | AI health analysis display (loading → CTA → full results). Embeds HealthChat. | `aqiData: any`. Reads from GlobalState context. | One-off (embedded inside LiveAQI) |
| **HealthChat** | `HealthChat.tsx` | 145 | Chat interface for AI health consultant. | `aqiContext: any`. State: messages, input, loading. | One-off |

### Page: `/solutions`

| Component | File | Lines | Purpose | Props / State | Reuse |
|-----------|------|-------|---------|--------------|-------|
| **SolutionsCatalog** | `SolutionsCatalog.tsx` | 395 | Page-level. Category tabs, solution cards grid, impact modal. Contains sub-components `CategoryTabs`, `SolutionCard`, `ImpactModal` (inlined). | State: selectedCategory, applyingId, showImpact. | One-off |

### Data Modules

| File | Purpose |
|------|---------|
| `data/nodes.ts` | 6 initial ReactFlow nodes (Industries, Transport, Energy, Infrastructure, CO₂, AQI). |
| `data/edges.ts` | 18 edges with labels, weights, styles, markers. |
| `data/aqiHealthData.ts` | 6 AQI categories with health impact information. |
| `data/solutionsData.ts` | 4 solution categories with 17 total solutions + policy mutations. |

---

## 2 — Design Token Extraction

### 2.1 Colors

#### CSS Custom Properties (globals.css) ✅ Central

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#020617` (Slate 950) | Body background |
| `--foreground` | `#ffffff` | Body text |
| `--primary` | `#4ade80` (Green 400) | Buttons, accents |
| `--secondary` | `#06b6d4` (Cyan 500) | Icons, headers, accents |
| `--accent` | `#2dd4bf` (Teal 400) | **⚠️ Defined but NEVER used anywhere** |
| `--card-bg` | `rgba(255,255,255,0.03)` | **⚠️ Defined but NEVER used** |
| `--glass-border` | `rgba(255,255,255,0.1)` | **⚠️ Defined but NEVER used** (hardcoded inline instead) |

#### Hardcoded Colors (Inconsistency Flags)

| Color | Where Used | Issue |
|-------|-----------|-------|
| `#00ff9d` | LiveAQI (AQI Good), HealthImpact (Low urgency), ImpactPanel, SolutionsCatalog modal | ⛔ **Not a token.** Unrelated to `--primary` (`#4ade80`). Two different "neon greens" used interchangeably. |
| `#ff0055` | LiveAQI (AQI Poor — neon red) | ⛔ Hardcoded |
| `#eab308` | LiveAQI (Satisfactory), edges.ts (Energy edge) | ⛔ Hardcoded |
| `#f97316` | LiveAQI (Moderate), aqiHealthData | ⛔ Hardcoded |
| `#a855f7` | LiveAQI (Very Poor), HistoricEmissions (AQI line) | ⛔ Hardcoded |
| `#991b1b` | LiveAQI (Severe) | ⛔ Hardcoded |
| `#3b82f6` | AQITrends (historical line), edges.ts (default), ImpactPanel | ⛔ Hardcoded |
| `#fb7185` | EmissionForecast, HistoricEmissions (CO₂ lines) | ⛔ Hardcoded |
| `#ef4444` | edges.ts (alert edges), AQIHealthImpact live dot | ⛔ Hardcoded |
| `#22c55e` | AQIHealthImpact live dot | ⛔ Hardcoded |
| `#10b981` | PolicySimulator (with-policy line), solutionsData category color | ⛔ Hardcoded |
| `#0f0518` | AQIHealthImpact bg gradient, tooltip backgrounds, edge label bg | ⛔ Hardcoded (appears 5+ times). **Not `--background` (`#020617`)**. Two different near-black backgrounds. |
| `#050510` | CausalGraph full-screen bg | ⛔ Yet ANOTHER dark background |
| `#0f1014` | PolicySimulator chat panel bg | ⛔ FOURTH different dark background |
| `#111827` | PolicySimulator html2canvas bg | ⛔ FIFTH dark background |
| `#0d121f` | PolicySimulator chart container bg | ⛔ SIXTH dark background |
| `rgba(15, 5, 24, 0.9)` | Tooltip bg in AQITrends, EmissionForecast, HistoricEmissions | ⛔ Inconsistent — 3 charts use same purple-tinted tooltip bg, PolicySimulator uses `rgba(15, 5, 24, 0.95)` |

> [!CAUTION]
> **6 distinct "dark background" hex values** are used across the codebase. None reference `--background`. This is a critical inconsistency that will cause visual fragmentation.

#### AQI Color Scales

Two separate AQI → color mapping functions exist:
1. `getAQIColor()` in `LiveAQI.tsx` — returns `#00ff9d`, `#eab308`, `#f97316`, `#ff0055`, `#a855f7`, `#991b1b`
2. `aqiHealthData.ts` — uses `#22c55e`, `#eab308`, `#f97316`, `#ef4444`, `#a855f7`, `#991b1b`

> [!WARNING]
> The "Good" color is `#00ff9d` in one place and `#22c55e` in another. The "Poor" color is `#ff0055` vs `#ef4444`. **Two conflicting AQI color palettes.**

### 2.2 Spacing

All spacing is via Tailwind utility classes. No custom spacing tokens exist. Commonly used values:

| Tailwind Class | rem/px | Typical Usage |
|---------------|--------|---------------|
| `p-6` | 1.5rem/24px | Standard card/panel padding (dominant pattern) |
| `p-8` | 2rem/32px | Hero sections, HealthImpact panels |
| `p-4` | 1rem/16px | Sub-cards, metric items |
| `p-3` | 0.75rem/12px | Stat cards, pollutant grid items |
| `gap-4` / `gap-6` / `gap-8` | Mixed | Grid/flex gaps — no consistent hierarchy |
| `mb-6` | 1.5rem | Section spacing within panels |
| `mb-8` | 2rem | Section spacing within panels |
| `px-6` | 1.5rem | Page-level horizontal padding |
| `py-12` | 3rem | Content section vertical padding |
| `pt-16 pb-20` | 4rem/5rem | Hero section (non-uniform top/bottom) |

> [!NOTE]
> No spacing scale is defined. All values are ad-hoc Tailwind defaults. While internally consistent within Tailwind, there's no **semantic** spacing system (e.g., `--space-section`, `--space-card`).

### 2.3 Font Sizes

| Tailwind Class | Usage Count | Typical Context |
|---------------|-------------|-----------------|
| `text-[10px]` | **~25 instances** | Micro labels (tracking-widest uppercase pattern) |
| `text-xs` | ~40+ | Secondary labels, captions, badge text |
| `text-sm` | ~30+ | Body text, card descriptions |
| `text-lg` | ~15 | Section headings, metric values |
| `text-xl` | ~8 | Sub-panel titles |
| `text-2xl` | ~5 | Major section headings |
| `text-3xl` | 2 | Impact modal values |
| `text-4xl` | 2 | AQI label (LiveAQI), AQIHealthImpact hero, SolutionsCatalog hero |
| `text-5xl` | 1 | `md:text-5xl` on AQIHealthImpact/SolutionsCatalog hero (responsive) |

> [!WARNING]
> `text-[10px]` (arbitrary value) is used ~25 times for a "micro-label" pattern. This should be a semantic token, not an arbitrary value repeated everywhere.

### 2.4 Font Weights

| Weight | Class | Usage |
|--------|-------|-------|
| Normal | `font-medium` | Some buttons, nav subtitle |
| Semi-bold | `font-semibold` | Category tabs, some labels |
| Bold | `font-bold` | **Dominant** — used on nearly every heading, label, metric. |
| Extra-bold | `font-extrabold` | CausalNode output label only (1 instance) |

### 2.5 Border Radii

| Value | Class(es) | Usage |
|-------|----------|-------|
| `1rem` (16px) | `rounded-2xl`, `.glass-panel { border-radius: 1rem }` | Chart containers, map wrappers, nodes |
| `0.75rem` (12px) | `rounded-xl`, `.glass-card { border-radius: 0.75rem }` | Cards, buttons, inputs, tags |
| `0.5rem` (8px) | `rounded-lg`, `.btn-primary/btn-secondary { border-radius: 0.5rem }` | Buttons, icon wrappers |
| `9999px` | `rounded-full` | Pills, year selectors, nav logo, badges |
| `4px` | Scrollbar thumb | Hardcoded in CSS |
| Tooltip `12px` / `8px` | Inline style `borderRadius: '12px'` or `'8px'` | ⛔ **Inconsistent** — AQITrends/EmissionForecast use `12px`, HistoricEmissions uses `8px` |

### 2.6 Shadows

| Shadow | Where |
|--------|-------|
| `.glass-panel` box-shadow | `0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)` |
| `.btn-primary` glow | `0 0 15px rgba(74,222,128,0.3)` |
| Nav logo glow | `shadow-[0_0_15px_rgba(74,222,128,0.5)]` — hardcoded |
| Active nav dot | `shadow-[0_0_10px_#4ade80]` — hardcoded |
| Card hover shadows | Various `shadow-lg`, `shadow-2xl` — Tailwind defaults |
| CausalNode handles | `shadow-[0_0_10px_#00f0ff]`, `shadow-[0_0_10px_#4ade80]` — hardcoded |
| CausalNode output | `shadow-[0_0_30px_rgba(6,182,212,0.4)]` — hardcoded |
| ImpactPanel hover | `shadow-[0_8px_32px_rgba(217,2,130,0.15)]` — hardcoded |
| AQI selector active | `shadow-[0_0_20px_rgba(255,255,255,0.2)]` — hardcoded |

> [!NOTE]
> Every glow/shadow is a one-off arbitrary Tailwind value. No shadow tokens exist.

### 2.7 Z-Index Values

| Value | Where | Purpose |
|-------|-------|---------|
| `z-60` | Navigation | Sticky nav bar |
| `z-50` | AQIHealthImpact fixed indicator, EmissionMaps legend, loading overlays, PolicySimulator floating chat | Multiple unrelated elements share z-50 |
| `z-[100]` | CausalGraph fullscreen wrapper | Full-screen mode |
| `z-[60]` | CausalGraph fullscreen inner | Full-screen graph |
| `z-10` | Various internal layering | Content above decorative glows |

> [!WARNING]
> No z-index scale is defined. `z-60` is used for nav (may not exist in default Tailwind). `z-50`, `z-[60]`, `z-[100]` create a fragile stacking order.

### 2.8 Breakpoints

Only Tailwind defaults are used: `md:` (768px) and `lg:` (1024px). No custom breakpoints.

---

## 3 — Structural Debt

### 3.1 Redundant / Near-Duplicate Components

| Group | Components | Issue |
|-------|-----------|-------|
| **Map panels** | `AQIMaps`, `EmissionMaps`, `SectorMaps` | All 3 follow the **identical pattern**: two side-by-side `glass-panel` cards with `<img>` tags, year `<select>`, refresh `<button>`, "Interactive View" link, `onError`/`onLoad` handlers. ~500 combined lines that could be a single `<MapPanel>` component. |
| **Chart wrappers** | `EmissionForecast`, `AQITrends`, `HistoricEmissions` | All 3 share: glass-panel with loading overlay spinner, recharts `<LineChart>` inside `<ResponsiveContainer>`, identical Tooltip styling, identical axis styling, identical CartesianGrid config. ~630 combined lines with ≈80% structural overlap. |
| **Chat interfaces** | `HealthChat` (in LiveAQI flow), PolicySimulator inline chat | Both are chat UIs with identical message bubble patterns, typing indicators (bouncing dots), input+send layout. Separately implemented. |
| **AQI data interfaces** | `AQIData` interface in `LiveAQI.tsx`, `AQIData` interface in `GlobalStateContext.tsx` | ⛔ **Duplicate interface declaration.** Same fields, defined twice. |
| **Impact interfaces** | `Impact` in `CausalGraph.tsx`, `Impact` (identical) in `ImpactPanel.tsx` | ⛔ **Duplicate interface declaration.** Should be shared type. |
| **Unused code** | `ProgressBar` in `ImpactPanel.tsx` (lines 192-234) | Entire component is commented out, taking up 40 lines. Dead code. |
| **Unused imports** | `AQIHealthImpact.tsx` line 21: `// ... imports stay same ...` | Dead comment left from refactoring. |

### 3.2 Naming Inconsistencies

| Issue | Examples |
|-------|---------|
| **Export style** | `Navigation` = default export, `LiveAQI` = named export `{ LiveAQI }`, `AQIHealthImpact` = default export, `PolicySimulator` = named export `{ PolicySimulator }`, `Reveal` = named export. **No consistent pattern.** |
| **File ↔ export name** | `HealthChat.tsx` exports `{ HealthChat }` (named), `HealthImpact.tsx` exports `{ HealthImpact }` (named), `CausalGraph.tsx` exports `default CausalGraph`. Inconsistent. |
| **Prop typing** | `HealthImpact` takes `aqiData: any` ⛔. `HealthChat` takes `aqiContext: any` ⛔. Strong types exist in `GlobalStateContext.tsx` but are not referenced. |
| **Variable naming** | `aiqChange` (typo in `ImpactPanel.tsx` line 45 — should be `aqiChange`). |

### 3.3 Missing UI States

| Component | Loading | Empty | Error |
|-----------|---------|-------|-------|
| **Navigation** | N/A | N/A | N/A |
| **CausalGraph** | ✅ (button loading) | ✅ ("System Awaiting Input" placeholder) | ⛔ Only `console.error` + string message. No visual error state. |
| **CausalNode** | N/A | N/A | N/A |
| **ImpactPanel** | N/A | ✅ (returns null) | ⛔ Missing — what if impact data is malformed? |
| **EmissionForecast** | ✅ Spinner overlay | ⛔ Missing — empty `data` array renders empty chart | ⛔ Only `console.error` |
| **AQITrends** | ✅ Spinner overlay | ⛔ Missing | ⛔ Only `console.error` |
| **HistoricEmissions** | ✅ Spinner overlay | ⛔ Missing | ⛔ Only `console.error` |
| **PolicySimulator** | ✅ Multiple loading states | ✅ Empty state for no selection | ⛔ Only `console.error` for API failures |
| **AQIMaps** | ⚠️ `animate-pulse` on container, but hides img on error | ⛔ No empty state | ⚠️ `onError` hides the image but shows no message |
| **EmissionMaps** | Same as AQIMaps | Same | Same |
| **SectorMaps** | Same as AQIMaps | Same | Same |
| **LiveAQI** | ✅ "Loading Live Data..." pulse | N/A | ⛔ Falls back to mock data silently (no user indication) |
| **HealthImpact** | ✅ "Analysing Bio-Metrics..." | ✅ CTA to generate | ⛔ Missing (error from context is swallowed) |
| **HealthChat** | ✅ Bouncing dots | ✅ Empty state with suggestions | ⚠️ Shows generic "Sorry, I couldn't reach..." |
| **AQIHealthImpact** | ⛔ Missing | N/A | ⛔ Missing |
| **SolutionsCatalog** | ⛔ Missing page-level loading | N/A | ⛔ `alert()` on error ⛔ |

### 3.4 Accessibility Violations

| Issue | Location | Severity |
|-------|----------|----------|
| **Range input invisible** | `CausalNode.tsx` line 77: `opacity-0` on `<input type="range">` | 🔴 Screen readers may find it but it has no label, no `aria-label`, no `aria-valuemin/max/now`. |
| **No `<label>` elements** | PolicySimulator textarea, all `<select>` elements, HealthChat input, CausalGraph textarea | 🔴 None of the form inputs have associated `<label>` or `aria-label`. |
| **Emoji as icon** | AQIMaps (🗺️), EmissionMaps (🌡️, 🏭), SectorMaps (📊), PolicySimulator (💰, 📈, etc.) | 🟡 Emojis are used as functional icons. They have `role="img"` on some (AQIMaps, EmissionMaps) but NOT on SectorMaps or PolicySimulator emojis. |
| **Color-only information** | ImpactPanel — reduction vs. increase solely by green vs. red text. No icon/text indicator. | 🔴 Fails WCAG 1.4.1 (Use of Color). |
| **No skip navigation** | `layout.tsx` | 🟡 No skip-to-content link. |
| **Interactive elements lack focus styles** | All custom buttons using glass-panel/btn-primary patterns — some have `:hover` but no `:focus-visible` | 🔴 Keyboard users cannot see which element is focused. |
| **Modal trap** | `ImpactModal` in SolutionsCatalog: no focus trap, no `Escape` key handler | 🔴 Modal does not trap focus. |
| **No `alt` text issues** | Map images use generic alt text like "AQI Heatmap" | 🟡 Acceptable but not descriptive of content. |
| **Mobile navigation** | Navigation has no hamburger/mobile menu | 🔴 Desktop-only nav with no responsive behavior. Links will overflow/squeeze on mobile. |
| **No `aria-live` region** | LiveAQI live data, chat messages, simulation results | 🟡 Dynamic content updates not announced to screen readers. |

### 3.5 Prop Inconsistencies

| Pattern | Issue |
|---------|-------|
| `aqiData: any` | Used in `HealthImpact` and `HealthChat` — should use the `AQIData` interface from GlobalStateContext |
| `onAqiUpdate` callback unused | `LiveAQI` accepts it but `AQIHealthImpact` invokes `<LiveAQI />` without it. The callback pattern is leftover dead API. |
| `data.onChange` mutation | `CausalNode` directly mutates `data.onChange` — React anti-pattern (should be via parent state update) |

### 3.6 Direct DOM Manipulation

| File | Lines | Issue |
|------|-------|-------|
| `AQIMaps.tsx` | 20-28, 41-44 | `document.getElementById()` + direct `.src` manipulation. **Anti-React pattern.** |
| `EmissionMaps.tsx` | 19-27, 40-43 | Same pattern. |
| `SectorMaps.tsx` | 28-37, 44-48 | Same pattern. |

> [!CAUTION]
> All 3 map components bypass React's rendering to manually set `<img>` `src` via `document.getElementById()`. This defeats React's reconciliation and can cause stale state.

---

## 4 — Layout and Hierarchy Analysis

### Page: `/` (CausalGraph)

**Structure:**
```
Full-width container (min-h-screen)
├─ Top Split: CSS Grid (grid-cols-2, h-600px, explicit 2fr 1fr)
│   ├─ Left (66%): ReactFlow canvas (full-screen toggle)
│   └─ Right (33%): grid-rows-2
│       ├─ Upload area (centered flex column)
│       └─ Preset policies (flex column)
├─ Instructions bar (bg-secondary/5, centered text)
└─ Bottom content (px-6 py-12, max-w-7xl mx-auto)
    ├─ Grid 3-col (1+2 split): Policy AI prompt + ImpactPanel
    └─ Stacked full-width sections (wrapped in border):
        ├─ Flex row: EmissionForecast | AQITrends
        ├─ HistoricEmissions
        ├─ PolicySimulator
        ├─ AQIMaps
        ├─ EmissionMaps
        └─ SectorMaps
```

**Issues:**
- ⛔ **Fixed height `h-[600px]`** on top split — will clip on smaller screens; no responsive adjustment.
- ⛔ **`gridTemplateColumns: '2fr 1fr'`** hardcoded as inline style, but Tailwind class `grid-cols-2` (which means `1fr 1fr`) is also present. Inline style overrides, but declared intent conflicts.
- ⛔ **No responsive breakpoints** on the top split. On mobile, `lg:grid-cols-2` is never used — it's just `grid-cols-1`, forcing a 600px tall single-column layout.
- ⛔ Bottom section wraps **everything** in `<div className="border border-white/10">` with `space-y-6` — but this creates a visible border around all subcomponents that appears unintentional.
- ⛔ `PolicySimulator` at 1177 lines renders as a massive inline component within the page flow. Its scroll length dominates the entire page.
- ⚠️ Reveal delays increment through 300→550 for child components — on slow scroll, items below the fold may never trigger.

### Page: `/health-impact` (AQIHealthImpact)

**Structure:**
```
min-h-screen container
├─ Fixed AQI indicator (fixed top-24 right-8 z-50 — pill badge)
├─ Hero section (relative, pt-16 pb-20)
│   ├─ Ambient bg div (dynamic color)
│   ├─ Gradient overlay
│   └─ Content: badge pill, h2, p, AQISelector (flex-wrap gap-4)
└─ Main content (max-w-6xl mx-auto px-6 py-12)
    ├─ Category header card (glass-panel)
    ├─ Physiological impact card
    ├─ Vulnerable groups grid (1/2/3 columns responsive)
    ├─ Safeguards grid (1/2 columns)
    └─ Live data section (mt-16 pt-10 border-t)
        └─ LiveAQI → HealthImpact → HealthChat
```

**Issues:**
- ⛔ Fixed AQI indicator uses `top-24` which places it 6rem from top. With sticky nav at `h-20` (5rem), it clears the nav by only 1rem — fragile positioning.
- ⛔ `AQISelector` buttons don't wrap well at narrow widths due to `px-6 py-4` sizing.
- ✅ Responsive grid columns (`1 / md:2 / lg:3`) is properly tiered.

### Page: `/solutions` (SolutionsCatalog)

**Structure:**
```
min-h-screen container
├─ Hero (relative, pt-12 pb-16)
│   ├─ Decorative blur blob
│   └─ Content: h2, p (max-w-7xl mx-auto px-6 text-center)
├─ Main content (max-w-7xl mx-auto px-6 py-12)
│   ├─ CategoryTabs (flex-wrap gap-3 centered)
│   ├─ Category description card (glass-panel)
│   └─ Solutions grid (1 / md:2 / lg:2 columns)
└─ ImpactModal (fixed overlay)
```

**Issues:**
- ⚠️ Grid is `lg:grid-cols-2` not `lg:grid-cols-3` — on wide screens the 2-col layout may have cards that are excessively wide.
- ✅ Modal has proper backdrop and centering.
- ⛔ Modal has no `max-h` constraint — extremely long policy descriptions will cause overflow.

---

## 5 — Dependency Audit

| Dependency | Version | Purpose | Notes |
|-----------|---------|---------|-------|
| `next` | 16.1.2 | Framework | ✅ Core — latest |
| `react` / `react-dom` | 19.2.3 | UI library | ✅ Core — latest |
| `@xyflow/react` | ^12.10.0 | Interactive node graph (ReactFlow) | ✅ Used for causal graph. Only on `/` page. |
| `recharts` | ^3.6.0 | Charts (line, area, composed) | ✅ Used in EmissionForecast, AQITrends, HistoricEmissions, PolicySimulator. |
| `lucide-react` | ^0.562.0 | Icon library | ✅ Primary icon source. Used throughout every component. |
| `html2canvas` | ^1.4.1 | Screenshot DOM to canvas | ⚠️ Used ONLY in PolicySimulator PDF generation. Large dependency for single use. |
| `jspdf` | ^4.0.0 | PDF generation | ⚠️ Used ONLY in PolicySimulator PDF generation. |
| `react-markdown` | ^10.1.0 | Markdown rendering | ⚠️ Used ONLY in PolicySimulator chat to render AI responses. |
| `@types/html2canvas` | ^0.5.35 | Types | ⚠️ In `dependencies` not `devDependencies`. Should be dev. |
| `@types/jspdf` | ^1.3.3 | Types | ⚠️ In `dependencies` not `devDependencies`. Should be dev. **And v1.3.3 is ancient — jsPDF 4.x ships its own types.** |
| `tailwindcss` | ^4 | Styling | ✅ But `@tailwindcss/postcss` is also present as expected for v4. |
| `typescript` | ^5 | Language | ✅ |
| `eslint` + `eslint-config-next` | ^9 / 16.1.2 | Linting | ✅ |

**Redundancies / Conflicts:**
- `@types/jspdf` is **unnecessary** with jsPDF 4.x — it ships built-in TypeScript declarations.
- `@types/html2canvas` is **unnecessary** with html2canvas 1.4.x — also ships types.
- Both `@types/*` packages are in `dependencies` instead of `devDependencies`.
- No **animation library** is used — all animations are CSS-based (`animate-spin`, `animate-pulse`, `animate-bounce`, `transition-*`). This is clean.
- The emoji-based icons in AQIMaps/EmissionMaps/SectorMaps/PolicySimulator could be replaced by lucide-react for consistency, since lucide is already a dependency.

---

## 6 — Visual Capture Checklist

### Navigation

| # | Component | State | Viewport | Interaction |
|---|-----------|-------|----------|-------------|
| 1 | Navigation bar | Default — `/` active | Desktop | — |
| 2 | Navigation bar | `/solutions` active | Desktop | — |
| 3 | Navigation bar | `/health-impact` active | Desktop | — |
| 4 | Navigation bar | Hover on inactive link | Desktop | Hover |
| 5 | Navigation bar | Any route | Mobile (375px) | — (verify overflow/clip behavior) |
| 6 | Navigation bar | Any route | Tablet (768px) | — |

### Page: `/` — CausalGraph Dashboard

| # | Component | State | Viewport | Interaction |
|---|-----------|-------|----------|-------------|
| 7 | Full page | Default load (all nodes enabled) | Desktop | — |
| 8 | CausalGraph | Nodes enabled, one node disabled (toggled) | Desktop | Post-click |
| 9 | CausalGraph | Full-screen mode | Desktop | Toggle |
| 10 | CausalGraph | Slider dragged to 0 on a sector node | Desktop | Drag |
| 11 | Upload area | Default | Desktop | — |
| 12 | Upload area | Hover | Desktop | Hover |
| 13 | Preset policies | Default | Desktop | — |
| 14 | Preset policies | Hover on Info icon | Desktop | Hover |
| 15 | AI Policy Agent | Default (textarea + button) | Desktop | — |
| 16 | AI Policy Agent | Loading state | Desktop | — |
| 17 | ImpactPanel | With results (after policy applied) | Desktop | — |
| 18 | ImpactPanel | Empty/awaiting state | Desktop | — |
| 19 | EmissionForecast | Loading overlay | Desktop | — |
| 20 | EmissionForecast | Loaded (30 days) | Desktop | — |
| 21 | EmissionForecast | Loaded (90 days) | Desktop | — |
| 22 | EmissionForecast | Chart hover tooltip | Desktop | Hover |
| 23 | AQITrends | Loading overlay | Desktop | — |
| 24 | AQITrends | Loaded with data | Desktop | — |
| 25 | HistoricEmissions | Loading overlay | Desktop | — |
| 26 | HistoricEmissions | Loaded with data | Desktop | — |
| 27 | PolicySimulator | Empty (no policies selected) | Desktop | — |
| 28 | PolicySimulator | Policies loading (skeleton pills) | Desktop | — |
| 29 | PolicySimulator | 1 policy selected, simulation loading | Desktop | — |
| 30 | PolicySimulator | 3+ policies selected, simulation results visible | Desktop | — |
| 31 | PolicySimulator | Economic impact summary visible | Desktop | — |
| 32 | PolicySimulator | Model calculation table visible | Desktop | — |
| 33 | PolicySimulator | Chart with baseline vs policy lines | Desktop | — |
| 34 | PolicySimulator | Chart tooltip on hover | Desktop | Hover |
| 35 | PolicySimulator | Sector impact breakdown grid | Desktop | — |
| 36 | PolicySimulator | Year selector (2026 selected) | Desktop | — |
| 37 | PolicySimulator | Year selector (2028 selected) | Desktop | — |
| 38 | PolicySimulator floating chat | Closed (FAB button) | Desktop | — |
| 39 | PolicySimulator floating chat | Open, empty state | Desktop | — |
| 40 | PolicySimulator floating chat | With messages | Desktop | — |
| 41 | PolicySimulator floating chat | Loading (typing dots) | Desktop | — |
| 42 | AQIMaps | Default (baseline images loaded) | Desktop | — |
| 43 | AQIMaps | Image loading/error state | Desktop | — |
| 44 | AQIMaps | Year 2026 selected (forecast) | Desktop | — |
| 45 | EmissionMaps | Default + legend visible | Desktop | — |
| 46 | EmissionMaps | Year 2027 selected | Desktop | — |
| 47 | EmissionMaps | Image error state | Desktop | — |
| 48 | SectorMaps | Default (Industry selected) | Desktop | — |
| 49 | SectorMaps | Transport selected | Desktop | — |
| 50 | SectorMaps | Sector + year combined | Desktop | — |
| 51 | Full page scroll | Full `/` page from top to bottom | Desktop | Scroll to capture all Reveal animations |
| 52 | Full page | Default | Mobile (375px) | — (key: verify all grid layouts collapse) |
| 53 | Full page | Default | Tablet (768px) | — |

### Page: `/health-impact`

| # | Component | State | Viewport | Interaction |
|---|-----------|-------|----------|-------------|
| 54 | Full page | Default load (auto-selects AQI category) | Desktop | — |
| 55 | Fixed AQI indicator | Visible | Desktop | — |
| 56 | AQI Selector | "Good" selected | Desktop | — |
| 57 | AQI Selector | "Severe" selected | Desktop | — |
| 58 | AQI Selector | Live AQI dot indicator visible on matching category | Desktop | — |
| 59 | Category header card | Good category | Desktop | — |
| 60 | Category header card | Category with Life Expectancy warning (Poor/Severe) | Desktop | — |
| 61 | Vulnerable groups grid | 3 columns with cards | Desktop | — |
| 62 | Vulnerable group card | Default | Desktop | — |
| 63 | Vulnerable group card | Hover state | Desktop | Hover |
| 64 | Safeguards grid | Default | Desktop | — |
| 65 | LiveAQI panel | Loading state | Desktop | — |
| 66 | LiveAQI panel | Loaded — Good AQI | Desktop | — |
| 67 | LiveAQI panel | Loaded — Poor+ AQI (if testable) | Desktop | — |
| 68 | HealthImpact | CTA state (no analysis yet) | Desktop | — |
| 69 | HealthImpact | Analyzing state (spinner) | Desktop | — |
| 70 | HealthImpact | Full analysis results | Desktop | — |
| 71 | HealthChat | Empty state | Desktop | — |
| 72 | HealthChat | With messages | Desktop | — |
| 73 | HealthChat | Loading (typing indicator) | Desktop | — |
| 74 | Full page | Default | Mobile (375px) | — |
| 75 | Full page | Default | Tablet (768px) | — |

### Page: `/solutions`

| # | Component | State | Viewport | Interaction |
|---|-----------|-------|----------|-------------|
| 76 | Full page | Default load | Desktop | — |
| 77 | Category tabs | "Geo-Engineering" selected | Desktop | — |
| 78 | Category tabs | "Bio-Engineering" selected | Desktop | — |
| 79 | Category tabs | Hover on unselected tab | Desktop | Hover |
| 80 | Category description card | Each category (cycle through all 4) | Desktop | — |
| 81 | SolutionCard | Default collapsed | Desktop | — |
| 82 | SolutionCard | Expanded (technical details visible) | Desktop | — |
| 83 | SolutionCard | Hover state (accent bar + shadow change) | Desktop | Hover |
| 84 | SolutionCard | "Run Simulation" button loading | Desktop | — |
| 85 | Impact modal | Open with results | Desktop | — |
| 86 | Impact modal | Hover on metric cards (green/blue gradient) | Desktop | Hover |
| 87 | Full page | Default | Mobile (375px) | — |
| 88 | Full page | Default | Tablet (768px) | — |
| 89 | Full page scroll | Verify Reveal animations fire on scroll | Desktop | Scroll |

### Global / Cross-Cutting

| # | Item | State | Viewport | Notes |
|---|------|-------|----------|-------|
| 90 | Scrollbar | Custom styled scrollbar appearance | Desktop | Chrome-specific only |
| 91 | Body background | Gradient orbs visible | Desktop | Capture at page top |
| 92 | Focus states | Tab through any interactive page to check focus rings | Desktop | Keyboard nav test |
| 93 | EmissionMaps fixed legend | Visible (lg only) | Desktop | Bottom-left corner |
| 94 | PDFreport | Generated PDF file content | N/A | Generate and inspect the downloaded PDF |

> **Total captures needed: 94**
