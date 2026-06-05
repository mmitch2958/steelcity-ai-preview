# Phase 3 — Milestone 2 Design Specifications

**Tasks:** P3-D003 (AI Prediction UI Design), P3-D004 (Email Notification Templates)  
**Project:** SMP-2026-Q1 — Social Media Integration  
**Branch:** SMP-Updates  
**Created:** 2026-03-05  
**Status:** COMPLETE  
**Related User Stories:** US-018 (Post Performance Predictions), US-015 (Content Approval Workflow)

---

## Table of Contents

1. [P3-D003: AI Performance Prediction UI](#p3-d003-ai-performance-prediction-ui)
   - 1.1 [PredictionResultDisplay Gauge](#11-predictionresultdisplay-gauge)
   - 1.2 [Confidence Indicator](#12-confidence-indicator)
   - 1.3 [Factor Breakdown Panel](#13-factor-breakdown-panel)
   - 1.4 [Improvement Suggestion Cards](#14-improvement-suggestion-cards)
   - 1.5 [Comparison View (Predicted vs Actual)](#15-comparison-view-predicted-vs-actual)
   - 1.6 [Performance History Chart](#16-performance-history-chart)
   - 1.7 [Layout & Responsive Placement](#17-layout--responsive-placement)
2. [P3-D004: Email Notification Templates](#p3-d004-email-notification-templates)
   - 2.1 [Shared Template Structure](#21-shared-template-structure)
   - 2.2 [Request Received (Approver Email)](#22-request-received-approver-email)
   - 2.3 [Post Approved (Creator Email)](#23-post-approved-creator-email)
   - 2.4 [Post Rejected (Creator Email)](#24-post-rejected-creator-email)
   - 2.5 [Changes Requested (Creator Email)](#25-changes-requested-creator-email)
   - 2.6 [Email Design Tokens](#26-email-design-tokens)
3. [Shared Design Tokens](#shared-design-tokens)
4. [Implementation Notes](#implementation-notes)

---

## P3-D003: AI Performance Prediction UI

### 1.1 PredictionResultDisplay Gauge

The `PredictionResultDisplay` is the centerpiece of the AI prediction panel. It shows a 0–100 engagement score using a semicircular gauge with a continuous color gradient from green (high performance) through yellow (moderate) to red (poor performance).

#### Score Range & Color Map

| Score Range | Label | Gradient Position | Hex at Center | HSL Variable |
|-------------|-------|-------------------|---------------|--------------|
| **80–100** | Excellent | 0–20% from left | `#22C55E` | `--prediction-excellent: 142 71% 45%` |
| **60–79** | Good | 20–40% | `#84CC16` | `--prediction-good: 84 81% 44%` |
| **40–59** | Average | 40–60% | `#EAB308` | `--prediction-average: 48 96% 47%` |
| **20–39** | Below Average | 60–80% | `#F97316` | `--prediction-below: 25 95% 53%` |
| **0–19** | Poor | 80–100% | `#EF4444` | `--prediction-poor: 0 84% 60%` |

#### Gauge Visual Specification

```
Desktop — Right sidebar prediction panel:
┌─────────────────────────────────────┐
│         AI Performance Score        │
│                                     │
│          ╭━━━━━━━━━━━╮              │
│       ╭━━╯           ╰━━╮          │
│     ━━╯     ● 74         ╰━━       │ ← Needle points to score
│    ━╯       Good            ╰━     │
│   ╱                           ╲    │
│  G ─────── Y ─────── O ────── R    │ ← Color gradient arc
│                                     │
│  [🟢 High Confidence]              │
│                                     │
│  Factor Breakdown                   │
│  ─────────────────────              │
│  ↑ Posting time         +12        │
│  ↑ Has media            +18        │
│  ↓ No CTA               -8        │
│  → Hashtag count          0        │
│                                     │
│  Suggestions                        │
│  ─────────────────────              │
│  [suggestion cards...]              │
└─────────────────────────────────────┘
```

#### Gauge Specifications

| Property | Value | Notes |
|----------|-------|-------|
| **Type** | Semicircular (180°) SVG arc gauge | Half-circle, sweeps left-to-right |
| **SVG viewBox** | `0 0 200 120` | Wide enough for arc + labels |
| **Arc radius** | `80` (from center `100, 100`) | Proportional to container |
| **Arc stroke width** | `12px` | Thick enough to show gradient clearly |
| **Arc stroke cap** | `round` | Smooth ends |
| **Background arc** | `stroke: hsl(var(--muted) / 0.3)` | Subtle track behind active arc |
| **Active arc** | Conic gradient via SVG `<linearGradient>` stops | Green→Yellow→Orange→Red |
| **Needle** | `stroke: hsl(var(--foreground))`, `stroke-width: 2` | Thin line from center to arc edge |
| **Needle dot** | `r="4"`, `fill: hsl(var(--foreground))` | Small circle at needle tip |
| **Score number** | `text-3xl font-bold` (30px, 700 weight) | Centered below arc |
| **Score label** | `text-sm font-medium text-muted-foreground` | "Good", "Excellent", etc. below number |
| **Container padding** | `p-6` | Breathable layout |
| **Min container width** | `240px` | Gauge stays readable |
| **Animation** | Needle sweeps from 0 to target on mount, `600ms ease-out` | Satisfying reveal animation |
| **Reduced motion** | Needle appears at final position instantly | `prefers-reduced-motion` respected |

#### SVG Gradient Stops

```tsx
<defs>
  <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
    <stop offset="0%" stopColor="#22C55E" />   {/* Green — Excellent */}
    <stop offset="25%" stopColor="#84CC16" />  {/* Lime — Good */}
    <stop offset="50%" stopColor="#EAB308" />  {/* Yellow — Average */}
    <stop offset="75%" stopColor="#F97316" />  {/* Orange — Below Average */}
    <stop offset="100%" stopColor="#EF4444" /> {/* Red — Poor */}
  </linearGradient>
</defs>
```

#### Score Color (Dynamic — for the center number)

```tsx
function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-lime-600 dark:text-lime-400';
  if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
  if (score >= 20) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Average';
  if (score >= 20) return 'Below Average';
  return 'Poor';
}
```

#### Gauge Component Implementation

```tsx
interface PredictionResultDisplayProps {
  score: number;          // 0–100
  confidence: 'high' | 'medium' | 'low';
  isLoading?: boolean;
  className?: string;
}

function PredictionResultDisplay({ score, confidence, isLoading, className }: PredictionResultDisplayProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const needleAngle = 180 - (clampedScore / 100) * 180; // 180° = 0 score, 0° = 100 score

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <svg
        viewBox="0 0 200 120"
        className="w-full max-w-[240px]"
        role="img"
        aria-label={`Predicted engagement score: ${clampedScore} out of 100 — ${getScoreLabel(clampedScore)}`}
      >
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="25%" stopColor="#F97316" />
            <stop offset="50%" stopColor="#EAB308" />
            <stop offset="75%" stopColor="#84CC16" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>
        </defs>

        {/* Background track */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.3"
        />

        {/* Colored arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Needle */}
        <line
          x1="100" y1="100"
          x2={100 + 70 * Math.cos((needleAngle * Math.PI) / 180)}
          y2={100 - 70 * Math.sin((needleAngle * Math.PI) / 180)}
          stroke="hsl(var(--foreground))"
          strokeWidth="2"
          strokeLinecap="round"
          className="origin-center transition-transform duration-600 ease-out motion-reduce:transition-none"
        />
        <circle cx="100" cy="100" r="4" fill="hsl(var(--foreground))" />
      </svg>

      {/* Score readout */}
      <div className="text-center -mt-2">
        <span className={cn("text-3xl font-bold", getScoreColor(clampedScore))}>
          {clampedScore}
        </span>
        <p className="text-sm font-medium text-muted-foreground mt-0.5">
          {getScoreLabel(clampedScore)}
        </p>
      </div>
    </div>
  );
}
```

#### Loading State

When the prediction is computing (API in-flight), show a skeleton gauge:

| Property | Value | Notes |
|----------|-------|-------|
| **Arc** | `bg-muted animate-pulse` stroke | Pulsing muted arc |
| **Score number** | Skeleton rectangle `h-8 w-16 rounded bg-muted animate-pulse` | Placeholder |
| **Label** | Skeleton rectangle `h-4 w-20 rounded bg-muted animate-pulse` | Placeholder |
| **aria-busy** | `true` | Screen reader announcement |
| **aria-label** | "Calculating prediction score..." | Accessible loading state |

```tsx
function PredictionResultSkeleton() {
  return (
    <div className="flex flex-col items-center" aria-busy="true" aria-label="Calculating prediction score...">
      <svg viewBox="0 0 200 120" className="w-full max-w-[240px]">
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="12"
          strokeLinecap="round"
          className="animate-pulse"
        />
      </svg>
      <div className="text-center -mt-2 space-y-2">
        <div className="h-8 w-16 rounded bg-muted animate-pulse mx-auto" />
        <div className="h-4 w-20 rounded bg-muted animate-pulse mx-auto" />
      </div>
    </div>
  );
}
```

---

### 1.2 Confidence Indicator

The confidence indicator communicates how reliable the prediction score is, based on the volume and quality of historical data available for the specific client/platform combination.

#### Confidence Levels

| Level | Criteria | Visual | Description |
|-------|----------|--------|-------------|
| **High** | `≥ 50` historical posts with engagement data | 3 filled bars (green) | "Based on extensive posting history" |
| **Medium** | `10–49` historical posts | 2 filled bars (yellow) | "Based on moderate posting history" |
| **Low** | `< 10` historical posts | 1 filled bar (red) + warning | "Limited data — prediction may vary" |

#### Visual Specification

```
High confidence:
  [███] High Confidence
        Based on 127 previous posts

Medium confidence:
  [██░] Medium Confidence
        Based on 34 previous posts

Low confidence:
  [█░░] Low Confidence  ⚠
        Limited data — prediction may vary
```

#### Confidence Badge Specifications

| Property | Value | Notes |
|----------|-------|-------|
| **Layout** | Inline-flex: bar icon + label + tooltip trigger | Compact single-line badge |
| **Bar icon size** | `16×12px` (3 bars, each `4×12px` with `1px` gap) | Miniature signal-strength icon |
| **Bar colors (high)** | All 3 bars: `fill-green-500 dark:fill-green-400` | Full signal |
| **Bar colors (medium)** | 2 bars: `fill-yellow-500 dark:fill-yellow-400`, 1 empty: `fill-muted` | Partial signal |
| **Bar colors (low)** | 1 bar: `fill-red-500 dark:fill-red-400`, 2 empty: `fill-muted` | Weak signal |
| **Label font** | `text-xs font-medium` | Matches badge styling from approval badges |
| **Label color** | High: `text-green-700 dark:text-green-400`, Medium: `text-yellow-700 dark:text-yellow-400`, Low: `text-red-700 dark:text-red-400` | Color-coded |
| **Warning icon (low only)** | `AlertTriangle` (lucide-react), `h-3 w-3 text-red-500` | Draws attention to unreliable prediction |
| **Tooltip** | Shows historical post count + explanation | On hover/focus via Radix Tooltip |
| **Container** | `bg-muted/50 rounded-md px-2.5 py-1.5 border border-border` | Subtle contained badge |
| **Placement** | Below gauge, centered, with `mt-3` spacing | Directly under score readout |

#### Confidence Bar SVG

```tsx
const confidenceConfig = {
  high: {
    label: 'High Confidence',
    bars: [true, true, true],
    barColor: 'fill-green-500 dark:fill-green-400',
    textColor: 'text-green-700 dark:text-green-400',
    showWarning: false,
  },
  medium: {
    label: 'Medium Confidence',
    bars: [true, true, false],
    barColor: 'fill-yellow-500 dark:fill-yellow-400',
    textColor: 'text-yellow-700 dark:text-yellow-400',
    showWarning: false,
  },
  low: {
    label: 'Low Confidence',
    bars: [true, false, false],
    barColor: 'fill-red-500 dark:fill-red-400',
    textColor: 'text-red-700 dark:text-red-400',
    showWarning: true,
  },
} as const;

interface ConfidenceIndicatorProps {
  level: 'high' | 'medium' | 'low';
  postCount: number;
  className?: string;
}

function ConfidenceIndicator({ level, postCount, className }: ConfidenceIndicatorProps) {
  const config = confidenceConfig[level];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center gap-1.5",
              "bg-muted/50 rounded-md px-2.5 py-1.5 border border-border",
              className,
            )}
          >
            {/* Signal bars */}
            <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true">
              {config.bars.map((filled, i) => (
                <rect
                  key={i}
                  x={i * 5}
                  y={12 - (i + 1) * 4}
                  width="4"
                  height={(i + 1) * 4}
                  rx="0.5"
                  className={filled ? config.barColor : 'fill-muted'}
                />
              ))}
            </svg>

            <span className={cn("text-xs font-medium", config.textColor)}>
              {config.label}
            </span>

            {config.showWarning && (
              <AlertTriangle className="h-3 w-3 text-red-500" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs max-w-[200px]">
          {level === 'low'
            ? `Based on only ${postCount} previous posts. Prediction accuracy improves as more content is published.`
            : `Based on ${postCount} previous posts on this platform.`
          }
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

#### Low-Confidence Warning Banner

When confidence is `low`, an additional inline warning appears above the factor breakdown:

```
┌──────────────────────────────────────────────┐
│ ⚠ Limited historical data available.         │
│   This prediction is a rough estimate.       │
│   Accuracy will improve as you publish more. │
└──────────────────────────────────────────────┘
```

| Property | Value | Notes |
|----------|-------|-------|
| **Background** | `bg-amber-50 dark:bg-amber-950/30` | Warm warning tone |
| **Border** | `border border-amber-200 dark:border-amber-800` | Matches warning palette |
| **Text** | `text-amber-800 dark:text-amber-200 text-xs` | Readable on background |
| **Icon** | `AlertTriangle` `h-4 w-4 text-amber-500` | Leading icon |
| **Padding** | `p-3` | Comfortable reading |
| **Border radius** | `rounded-md` | Standard |
| **Margin** | `mt-4 mb-2` | Between confidence badge and factor list |

---

### 1.3 Factor Breakdown Panel

The factor breakdown shows what's helping or hurting the prediction score. Each factor displays its name, direction (positive/negative/neutral), and numeric impact on the score.

#### Visual Layout

```
Factor Breakdown
─────────────────────────────────

  ↑  Posting time (6:00 PM)          +12
  ↑  Has image media                 +18
  →  Hashtag count (5)                 0
  ↓  No call-to-action                -8
  ↓  Content is short (<50 chars)     -5
```

#### Factor Row Specifications

| Property | Value | Notes |
|----------|-------|-------|
| **Layout** | Flex row: direction icon + label + spacer + impact value | Full-width with right-aligned impact |
| **Row height** | `min-h-[36px]` with `py-2` | Comfortable touch-safe rows |
| **Direction icon** | `ArrowUp` / `ArrowDown` / `ArrowRight` (lucide-react), `h-3.5 w-3.5` | Positive/Negative/Neutral |
| **Icon color — Positive** | `text-green-600 dark:text-green-400` | Green = helping |
| **Icon color — Negative** | `text-red-600 dark:text-red-400` | Red = hurting |
| **Icon color — Neutral** | `text-muted-foreground` | Gray = no effect |
| **Label font** | `text-sm` | Standard body text |
| **Label color** | `text-foreground` | Primary color |
| **Impact value font** | `text-sm font-semibold tabular-nums` | Monospace numbers for alignment |
| **Impact color — Positive** | `text-green-600 dark:text-green-400` | Matches icon |
| **Impact color — Negative** | `text-red-600 dark:text-red-400` | Matches icon |
| **Impact color — Neutral** | `text-muted-foreground` | Gray |
| **Impact format** | `+18`, `-8`, `0` | Signed integer, no decimals |
| **Separator** | `border-b border-border/50` between rows | Subtle row delineation |
| **Section title** | `text-sm font-semibold mb-3` | "Factor Breakdown" heading |
| **Container** | No card wrapper — lives inside prediction panel | Shares parent styling |
| **Sort order** | Descending by absolute impact value | Most impactful factors first |
| **Max visible** | 6 factors; additional hidden behind "Show all" link | Prevents overwhelming UI |

#### Factor Breakdown Implementation

```tsx
interface PredictionFactor {
  id: string;
  name: string;        // "Posting time (6:00 PM)"
  impact: number;      // +12, -8, 0
  direction: 'positive' | 'negative' | 'neutral';
  suggestion?: string; // If actionable, links to suggestion card
}

const directionConfig = {
  positive: {
    icon: ArrowUp,
    iconColor: 'text-green-600 dark:text-green-400',
    valueColor: 'text-green-600 dark:text-green-400',
    format: (v: number) => `+${v}`,
  },
  negative: {
    icon: ArrowDown,
    iconColor: 'text-red-600 dark:text-red-400',
    valueColor: 'text-red-600 dark:text-red-400',
    format: (v: number) => `${v}`,
  },
  neutral: {
    icon: ArrowRight,
    iconColor: 'text-muted-foreground',
    valueColor: 'text-muted-foreground',
    format: () => '0',
  },
} as const;

function FactorBreakdown({ factors }: { factors: PredictionFactor[] }) {
  const [showAll, setShowAll] = useState(false);
  const sorted = [...factors].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  const visible = showAll ? sorted : sorted.slice(0, 6);

  return (
    <div>
      <h4 className="text-sm font-semibold mb-3">Factor Breakdown</h4>
      <div className="space-y-0">
        {visible.map((factor) => {
          const config = directionConfig[factor.direction];
          const Icon = config.icon;
          return (
            <div
              key={factor.id}
              className="flex items-center gap-2 py-2 border-b border-border/50 last:border-b-0"
            >
              <Icon className={cn("h-3.5 w-3.5 flex-shrink-0", config.iconColor)} />
              <span className="text-sm text-foreground flex-1 min-w-0 truncate">
                {factor.name}
              </span>
              <span className={cn("text-sm font-semibold tabular-nums", config.valueColor)}>
                {config.format(factor.impact)}
              </span>
            </div>
          );
        })}
      </div>
      {factors.length > 6 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-primary hover:underline mt-2"
        >
          {showAll ? 'Show less' : `Show all ${factors.length} factors`}
        </button>
      )}
    </div>
  );
}
```

---

### 1.4 Improvement Suggestion Cards

Suggestion cards are actionable recommendations that can improve the prediction score. Each card links to a specific action in the CreatePostTab (e.g., adding media, changing scheduled time).

#### Visual Layout

```
Suggestions
─────────────────────────────────

┌─────────────────────────────────────┐
│ 📷  Add an image                +14 │
│     Posts with images get 2.3x      │
│     more engagement.                │
│                        [Add Media]  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ⏰  Reschedule to 6:00 PM       +8 │
│     Your audience is most active    │
│     between 5-7 PM on weekdays.     │
│                    [Change Time]    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 💡  Add a call-to-action         +5 │
│     Posts with CTAs see 34% more    │
│     clicks on average.              │
│               [View CTA Examples]   │
└─────────────────────────────────────┘
```

#### Suggestion Card Specifications

| Property | Value | Notes |
|----------|-------|-------|
| **Container** | `bg-muted/30 rounded-lg border border-border p-3` | Subtle card, lighter than primary cards |
| **Layout** | Header row (icon + title + impact) + body text + action button | Three-zone layout |
| **Icon size** | `16×16px` (`h-4 w-4`) | Matches factor icons |
| **Icon color** | `text-primary` | Brand color for all suggestion icons |
| **Title font** | `text-sm font-medium` | Scannable header |
| **Impact badge** | `text-xs font-semibold bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 rounded-full px-2 py-0.5` | Green pill showing potential score gain |
| **Impact format** | `+14` | Always positive — these are improvements |
| **Description font** | `text-xs text-muted-foreground` | Explanatory subtext |
| **Description max** | 2 lines, truncated with `line-clamp-2` | Keeps cards compact |
| **Action button** | `variant="outline" size="sm"` | Compact actionable button |
| **Action button text** | Verb phrase: "Add Media", "Change Time", "View Examples" | Direct action language |
| **Card gap** | `gap-3` between cards | Comfortable spacing |
| **Sort order** | Descending by potential impact | Biggest wins first |
| **Max visible** | 3 suggestions | Top 3 only; more available via "See all suggestions" |
| **Applied state** | Card fades to `opacity-50` with `✓ Applied` badge replacing action button | User already took the action |
| **Transition** | `opacity 200ms ease` on apply | Smooth applied feedback |

#### Suggestion Types & Icons

| Suggestion Type | Icon | Title Pattern | Action Label | Wires To |
|-----------------|------|---------------|--------------|----------|
| **Add media** | `Image` | "Add an image" / "Add a video" | "Add Media" | Opens media uploader |
| **Change time** | `Clock` | "Reschedule to {time}" | "Change Time" | Opens time picker |
| **Add hashtags** | `Hash` | "Add relevant hashtags" | "Add Hashtags" | Focuses hashtag input |
| **Add CTA** | `MousePointerClick` | "Add a call-to-action" | "View CTA Examples" | Shows CTA suggestion popover |
| **Adjust length** | `Type` | "Lengthen your content" / "Shorten your content" | "Edit Content" | Focuses content textarea |
| **Add emoji** | `Smile` | "Add emoji for engagement" | "Add Emoji" | Opens emoji picker |

#### Suggestion Card Implementation

```tsx
interface ImprovementSuggestion {
  id: string;
  type: 'add_media' | 'change_time' | 'add_hashtags' | 'add_cta' | 'adjust_length' | 'add_emoji';
  title: string;
  description: string;
  impact: number;       // Always positive, e.g. 14
  actionLabel: string;
  applied: boolean;
}

const suggestionIcons: Record<ImprovementSuggestion['type'], LucideIcon> = {
  add_media: Image,
  change_time: Clock,
  add_hashtags: Hash,
  add_cta: MousePointerClick,
  adjust_length: Type,
  add_emoji: Smile,
};

function SuggestionCard({
  suggestion,
  onAction,
}: {
  suggestion: ImprovementSuggestion;
  onAction: (type: ImprovementSuggestion['type']) => void;
}) {
  const Icon = suggestionIcons[suggestion.type];

  return (
    <div
      className={cn(
        "bg-muted/30 rounded-lg border border-border p-3",
        "transition-opacity duration-200",
        suggestion.applied && "opacity-50",
      )}
    >
      {/* Header: icon + title + impact */}
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="h-4 w-4 text-primary flex-shrink-0" />
        <span className="text-sm font-medium flex-1 min-w-0 truncate">
          {suggestion.title}
        </span>
        <span className="text-xs font-semibold bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 rounded-full px-2 py-0.5">
          +{suggestion.impact}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground line-clamp-2 mb-2 ml-6">
        {suggestion.description}
      </p>

      {/* Action */}
      <div className="flex justify-end">
        {suggestion.applied ? (
          <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
            <CheckCircle2 className="h-3 w-3" /> Applied
          </span>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAction(suggestion.type)}
            className="text-xs h-7"
          >
            {suggestion.actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
```

---

### 1.5 Comparison View (Predicted vs Actual)

After a post publishes and engagement data is collected (48h post-publish), the prediction panel transforms into a comparison view showing predicted score alongside actual performance.

#### Visual Layout

```
Prediction vs Actual — Published Mar 5
──────────────────────────────────────────────

     Predicted          Actual
    ┌────────┐       ┌────────┐
    │   74   │       │   81   │
    │  Good  │       │  Great │
    └────────┘       └────────┘

    Accuracy: +7 (prediction was conservative)

    Factor Review
    ─────────────────────────────────
    Factor              Predicted  Actual
    Engagement rate        4.2%    5.1%  ↑
    Impressions           1,200   1,480  ↑
    Clicks                   45      38  ↓
    Saves                    12      19  ↑
```

#### Comparison View Specifications

| Property | Value | Notes |
|----------|-------|-------|
| **Layout** | Two side-by-side score blocks + accuracy summary + metrics table | Vertical stack |
| **Predicted score block** | `bg-muted/50 rounded-lg p-4 text-center` | Muted/secondary styling |
| **Actual score block** | `bg-primary/10 rounded-lg p-4 text-center border border-primary/20` | Highlighted as the "real" result |
| **Score number** | `text-2xl font-bold` | Prominent but smaller than gauge |
| **Score label** | `text-xs font-medium text-muted-foreground` | "Good", "Great", etc. |
| **Column gap** | `gap-4` | Between predicted and actual blocks |
| **Accuracy line** | `text-sm` centered below blocks | Shows the delta |
| **Accuracy — overperformed** | `text-green-600 dark:text-green-400` with `↑` prefix | Actual > Predicted |
| **Accuracy — underperformed** | `text-red-600 dark:text-red-400` with `↓` prefix | Actual < Predicted |
| **Accuracy — accurate** | `text-muted-foreground` | Delta within ±5 |
| **Metric table** | Simple 3-column layout: Metric / Predicted / Actual | Uses standard table styling |
| **Metric columns** | Label left-aligned, values right-aligned with `tabular-nums` | Clean numerical alignment |
| **Delta indicator** | `↑` green / `↓` red next to actual values | Quick scanning |
| **Container** | Replaces gauge in prediction panel | Same parent container |
| **Header** | "Prediction vs Actual — Published {date}" | Contextual title |

#### Comparison Component Implementation

```tsx
interface PredictionComparison {
  predictedScore: number;
  actualScore: number;
  publishedAt: Date;
  metrics: {
    name: string;
    predicted: number;
    actual: number;
    format: 'number' | 'percent';
  }[];
}

function ComparisonView({ comparison }: { comparison: PredictionComparison }) {
  const delta = comparison.actualScore - comparison.predictedScore;
  const deltaAbs = Math.abs(delta);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold">
        Prediction vs Actual — Published {format(comparison.publishedAt, 'MMM d')}
      </h4>

      {/* Side-by-side scores */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Predicted</p>
          <p className={cn("text-2xl font-bold", getScoreColor(comparison.predictedScore))}>
            {comparison.predictedScore}
          </p>
          <p className="text-xs font-medium text-muted-foreground">
            {getScoreLabel(comparison.predictedScore)}
          </p>
        </div>
        <div className="bg-primary/10 rounded-lg p-4 text-center border border-primary/20">
          <p className="text-xs text-muted-foreground mb-1">Actual</p>
          <p className={cn("text-2xl font-bold", getScoreColor(comparison.actualScore))}>
            {comparison.actualScore}
          </p>
          <p className="text-xs font-medium text-muted-foreground">
            {getScoreLabel(comparison.actualScore)}
          </p>
        </div>
      </div>

      {/* Accuracy summary */}
      <p className={cn(
        "text-sm text-center font-medium",
        delta > 5 ? 'text-green-600 dark:text-green-400' :
        delta < -5 ? 'text-red-600 dark:text-red-400' :
        'text-muted-foreground',
      )}>
        {delta > 5 ? `↑ Outperformed by ${deltaAbs} points` :
         delta < -5 ? `↓ Underperformed by ${deltaAbs} points` :
         `Prediction was accurate (±${deltaAbs})`}
      </p>

      {/* Metric breakdown table */}
      <div className="border border-border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Metric</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Predicted</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Actual</th>
            </tr>
          </thead>
          <tbody>
            {comparison.metrics.map((metric) => {
              const metricDelta = metric.actual - metric.predicted;
              return (
                <tr key={metric.name} className="border-b border-border/50 last:border-b-0">
                  <td className="py-2 px-3 text-foreground">{metric.name}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">
                    {metric.format === 'percent' ? `${metric.predicted.toFixed(1)}%` : metric.predicted.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums">
                    <span className="text-foreground">
                      {metric.format === 'percent' ? `${metric.actual.toFixed(1)}%` : metric.actual.toLocaleString()}
                    </span>
                    <span className={cn(
                      "ml-1 text-xs",
                      metricDelta > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
                    )}>
                      {metricDelta > 0 ? '↑' : '↓'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

#### State Transitions

| Post State | Panel Shows | Notes |
|------------|------------|-------|
| **Drafting** | Live gauge + factors + suggestions | Score updates as user types (500ms debounce) |
| **Scheduled** | Static gauge (last computed) + factors | "Score computed at scheduling time" note |
| **Published < 48h** | Static gauge + "Collecting engagement data..." message | Awaiting actual metrics |
| **Published ≥ 48h** | Comparison view (predicted vs actual) | Full comparison with metrics |
| **No prediction** | Empty state: "Start typing to see your prediction score" | Invites interaction |

---

### 1.6 Performance History Chart

The performance history chart shows prediction accuracy over time in the AnalyticsTab, allowing users to see how well the AI predictions correlate with actual post performance.

#### Visual Layout

```
Prediction Accuracy — Last 30 Days
──────────────────────────────────────────────

  100 ┤
      │         ★                    ★
   80 ┤    ★    ●●  ★         ★  ●●
      │  ●●  ●●     ●●  ★  ●●
   60 ┤               ●● ●●
      │
   40 ┤
      │
   20 ┤
      │
    0 ┤────────────────────────────────────
      Feb 5    Feb 12    Feb 19    Feb 26

  ● Predicted Score    ★ Actual Score

  ┌──────────────────────────────────────┐
  │ Overall Accuracy: 87%                │
  │ Avg Error: ±6.2 points              │
  │ Predictions: 24 posts               │
  │ Trend: Improving ↑                  │
  └──────────────────────────────────────┘
```

#### Chart Specifications

| Property | Value | Notes |
|----------|-------|-------|
| **Chart type** | Scatter plot with connecting lines | Recharts `ComposedChart` with `Line` + `Scatter` |
| **Predicted series** | Solid line + dots: `stroke: hsl(var(--primary))`, `strokeWidth: 2` | Primary brand color |
| **Actual series** | Dashed line + star markers: `stroke: #22C55E`, `strokeDasharray: "5 3"` | Green for actual results |
| **Dot size — Predicted** | `r={4}` | Standard dot |
| **Dot size — Actual** | Custom star marker or `r={5}` circle with different fill | Visually distinct |
| **X-axis** | Date, formatted as `MMM d` | `date-fns` formatting |
| **Y-axis** | Score 0–100 | Fixed range for consistency |
| **Y-axis label** | "Score" | Rotated -90° |
| **Grid** | Horizontal only, `stroke: hsl(var(--border))`, `strokeDasharray: "3 3"` | Subtle reference lines |
| **Legend** | Below chart, inline: `● Predicted Score  ★ Actual Score` | Simple legend |
| **Tooltip** | On hover: shows date, predicted score, actual score, delta | Custom tooltip component |
| **Chart height** | `300px` (desktop), `200px` (mobile) | Responsive |
| **Chart padding** | `{ top: 20, right: 20, bottom: 20, left: 40 }` | Room for Y-axis labels |
| **Animation** | Line draws in, `800ms ease-out` | Entrance animation |
| **Reduced motion** | Lines appear instantly | `prefers-reduced-motion` |
| **Empty state** | "No prediction data yet. Predictions are recorded when posts are published." | Centered in chart area |

#### Summary Stats Cards

Below the chart, display four summary cards in a 2×2 grid (4-across on wide screens):

| Card | Label | Value Format | Icon | Color |
|------|-------|-------------|------|-------|
| **Overall Accuracy** | "Accuracy" | `87%` | `Target` | Green if ≥80%, Yellow if ≥60%, Red if <60% |
| **Average Error** | "Avg Error" | `±6.2 pts` | `TrendingUp` | Inverse: Green if ≤10, Yellow if ≤20, Red if >20 |
| **Prediction Count** | "Predictions" | `24 posts` | `BarChart3` | Always `text-primary` |
| **Trend** | "Trend" | `Improving ↑` / `Stable →` / `Declining ↓` | `ArrowUpRight` / `ArrowRight` / `ArrowDownRight` | Green/Gray/Red |

#### Summary Card Specifications

| Property | Value | Notes |
|----------|-------|-------|
| **Layout** | `grid grid-cols-2 lg:grid-cols-4 gap-3` | Responsive grid |
| **Card** | `bg-card rounded-lg border border-border p-4` | Standard card styling |
| **Icon** | `h-4 w-4` in `bg-muted rounded-md p-1.5` container (total `28×28px`) | Icon badge top-left |
| **Value font** | `text-lg font-bold tabular-nums` | Prominent number |
| **Label font** | `text-xs text-muted-foreground` | Subtle label |

#### Recharts Implementation

```tsx
interface PredictionHistoryPoint {
  date: string;           // ISO date
  predictedScore: number;
  actualScore: number | null; // null if not yet collected
}

function PredictionHistoryChart({ data }: { data: PredictionHistoryPoint[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-4">Prediction Accuracy</h4>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 40 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            horizontal
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={(d) => format(parseISO(d), 'MMM d')}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis
            domain={[0, 100]}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            label={{ value: 'Score', angle: -90, position: 'insideLeft', fontSize: 12 }}
          />
          <RechartsTooltip content={<PredictionTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
          />

          {/* Predicted score line */}
          <Line
            type="monotone"
            dataKey="predictedScore"
            name="Predicted Score"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 4, fill: 'hsl(var(--primary))' }}
            activeDot={{ r: 6 }}
            animationDuration={800}
            animationEasing="ease-out"
          />

          {/* Actual score line */}
          <Line
            type="monotone"
            dataKey="actualScore"
            name="Actual Score"
            stroke="#22C55E"
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={{ r: 5, fill: '#22C55E', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7 }}
            animationDuration={800}
            animationEasing="ease-out"
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        <PredictionSummaryCard icon={Target} label="Accuracy" value="87%" valueColor="text-green-600" />
        <PredictionSummaryCard icon={TrendingUp} label="Avg Error" value="±6.2 pts" valueColor="text-yellow-600" />
        <PredictionSummaryCard icon={BarChart3} label="Predictions" value="24 posts" valueColor="text-primary" />
        <PredictionSummaryCard icon={ArrowUpRight} label="Trend" value="Improving ↑" valueColor="text-green-600" />
      </div>
    </div>
  );
}
```

#### Custom Tooltip

```tsx
function PredictionTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const predicted = payload.find((p: any) => p.dataKey === 'predictedScore')?.value;
  const actual = payload.find((p: any) => p.dataKey === 'actualScore')?.value;
  const delta = actual != null && predicted != null ? actual - predicted : null;

  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg text-sm">
      <p className="text-xs text-muted-foreground mb-2">
        {format(parseISO(label), 'MMM d, yyyy')}
      </p>
      {predicted != null && (
        <p className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Predicted: <span className="font-semibold">{predicted}</span>
        </p>
      )}
      {actual != null && (
        <p className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Actual: <span className="font-semibold">{actual}</span>
        </p>
      )}
      {delta != null && (
        <p className={cn(
          "text-xs mt-1 pt-1 border-t border-border",
          delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-muted-foreground',
        )}>
          {delta > 0 ? `↑ +${delta} overperformed` : delta < 0 ? `↓ ${delta} underperformed` : 'Spot on!'}
        </p>
      )}
    </div>
  );
}
```

---

### 1.7 Layout & Responsive Placement

The prediction panel placement differs between desktop and mobile to optimize for available space.

#### Desktop Layout (≥ 1024px)

The prediction panel appears as a right sidebar in CreatePostTab:

```
┌──────────────────────────────────────────────────────────────────────┐
│ CreatePostTab                                                        │
│ ┌────────────────────────────────┐ ┌──────────────────────────────┐  │
│ │ Content Editor                  │ │ AI Prediction               │  │
│ │                                 │ │                              │  │
│ │ [Textarea for post content]     │ │ [Gauge — score 74]           │  │
│ │                                 │ │ [High Confidence]            │  │
│ │ [Media upload area]             │ │                              │  │
│ │                                 │ │ Factor Breakdown             │  │
│ │ [Hashtag input]                 │ │ ↑ Posting time        +12   │  │
│ │                                 │ │ ↑ Has media           +18   │  │
│ │ [Platform selector]             │ │ ↓ No CTA              -8   │  │
│ │                                 │ │                              │  │
│ │ [Schedule picker]               │ │ Suggestions                  │  │
│ │                                 │ │ [📷 Add image  +14]         │  │
│ │                                 │ │ [⏰ Change time  +8]        │  │
│ │                                 │ │ [💡 Add CTA     +5]         │  │
│ │                                 │ │                              │  │
│ └────────────────────────────────┘ └──────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

| Property | Value | Notes |
|----------|-------|-------|
| **Grid** | `grid grid-cols-[1fr_320px] gap-6` | Content area expands, sidebar fixed |
| **Sidebar width** | `320px` (fixed) | Enough for gauge + cards |
| **Sidebar sticky** | `sticky top-4` | Stays visible while scrolling content |
| **Sidebar max-height** | `calc(100vh - 2rem)` with `overflow-y-auto` | Scrollable if content exceeds viewport |

#### Tablet Layout (768px–1023px)

Prediction panel becomes a collapsible section below the content editor:

```
┌──────────────────────────────────────────┐
│ CreatePostTab                             │
│ [Content Editor]                          │
│ [Media / Hashtags / Schedule]             │
│                                           │
│ ▼ AI Prediction                           │
│ ┌───────────────────────────────────────┐ │
│ │ [Gauge]  Factor Breakdown             │ │ ← Gauge + factors side by side
│ │          ↑ Posting time       +12     │ │
│ │          ↑ Has media          +18     │ │
│ │          ↓ No CTA              -8     │ │
│ │                                       │ │
│ │ [Suggestion cards in row...]          │ │
│ └───────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

| Property | Value | Notes |
|----------|-------|-------|
| **Trigger** | `Collapsible` (Radix) with chevron toggle | Default expanded |
| **Inner layout** | `grid grid-cols-[auto_1fr] gap-4` for gauge + factors | Side-by-side within collapsible |
| **Suggestion cards** | `grid grid-cols-2 gap-3` | 2-up layout |

#### Mobile Layout (< 768px)

Prediction panel is a collapsible bottom section, default collapsed:

```
┌────────────────────────────┐
│ CreatePostTab               │
│ [Content Editor]            │
│ [Media / Hashtags]          │
│ [Schedule]                  │
│                             │
│ ▶ AI Prediction (74 — Good) │  ← Collapsed: shows score inline
│                             │
│ Expanded:                   │
│ ┌─────────────────────────┐ │
│ │ [Gauge — centered]      │ │
│ │ [Confidence]            │ │
│ │ [Factor list]           │ │
│ │ [Suggestion cards]      │ │
│ └─────────────────────────┘ │
└────────────────────────────┘
```

| Property | Value | Notes |
|----------|-------|-------|
| **Default state** | Collapsed | Don't push content editor down |
| **Collapsed preview** | Shows score inline: "AI Prediction (74 — Good)" | Scannable at a glance |
| **Expanded** | Full-width, stacked layout | Gauge centered, factors below, suggestions stacked |
| **Suggestion cards** | Full-width, stacked `flex flex-col gap-3` | One card per row |
| **Touch target** | Collapsible trigger `min-h-[44px]` | Accessible toggle |

#### Collapsible Header Implementation

```tsx
function PredictionPanelMobile({ score, confidence, factors, suggestions }: PredictionPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full min-h-[44px] py-3 px-4 bg-muted/30 rounded-lg border border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">AI Prediction</span>
          {score != null && (
            <span className={cn(
              "text-sm font-bold",
              getScoreColor(score),
            )}>
              ({score} — {getScoreLabel(score)})
            </span>
          )}
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 text-muted-foreground transition-transform duration-200",
          open && "rotate-180",
        )} />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 space-y-4">
        <PredictionResultDisplay score={score} confidence={confidence} />
        <ConfidenceIndicator level={confidence.level} postCount={confidence.postCount} />
        <FactorBreakdown factors={factors} />
        <div className="flex flex-col gap-3">
          {suggestions.slice(0, 3).map(s => (
            <SuggestionCard key={s.id} suggestion={s} onAction={handleAction} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
```

#### Debounce & Performance

| Behavior | Value | Notes |
|----------|-------|-------|
| **Debounce on content change** | `500ms` | Heavier than preview (250ms); prediction API is more expensive |
| **Request cancellation** | `AbortController` on new input | Cancel stale prediction requests |
| **Cache** | Cache prediction for unchanged `{content, hashtags, platforms, scheduledAt}` | Avoid redundant API calls |
| **Skeleton** | Show skeleton gauge while loading | Never show stale score during recomputation |
| **Error state** | "Unable to generate prediction. Try again." with retry button | Graceful degradation |

---

## P3-D004: Email Notification Templates

### 2.1 Shared Template Structure

All approval notification emails share a common HTML structure and Steel City AI branding. Emails must render correctly in Gmail, Outlook (desktop + web), Apple Mail, and mobile mail clients.

#### Template Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     [Logo]                               │ ← Steel City AI logo
│              Steel City AI                               │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │                                                      │ │
│ │  [Status Icon + Headline]                            │ │ ← Action-specific
│ │                                                      │ │
│ │  [Context paragraph]                                 │ │
│ │                                                      │ │
│ │  ┌──────────────────────────────────────────────────┐│ │
│ │  │  Post Preview Card                              ││ │ ← Post content preview
│ │  │  [Platform badges]  •  Scheduled: Mar 10        ││ │
│ │  │  "Post content preview text, truncated at       ││ │
│ │  │   150 characters for email readability..."      ││ │
│ │  │  [📷 2 images attached]                         ││ │
│ │  └──────────────────────────────────────────────────┘│ │
│ │                                                      │ │
│ │  [Comment / Feedback — if applicable]                │ │
│ │                                                      │ │
│ │  [Deadline Info — if applicable]                     │ │
│ │                                                      │ │
│ │  ┌────────────┐  ┌─────────────┐                    │ │ ← Action buttons
│ │  │  Primary   │  │  Secondary  │                    │ │
│ │  └────────────┘  └─────────────┘                    │ │
│ │                                                      │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│  You received this because you're part of the approval   │ ← Footer
│  workflow for [Client Name].                             │
│  [Manage notification preferences]                       │
│                                                          │
│  © 2026 Steel City AI • Pittsburgh, PA                   │
└─────────────────────────────────────────────────────────┘
```

#### Base Template Specifications

| Element | CSS/Style | Notes |
|---------|-----------|-------|
| **Outer container** | `max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;` | Standard email width |
| **Background** | `background-color: #f4f4f5;` (zinc-100 equivalent) | Subtle gray behind card |
| **Card** | `background-color: #ffffff; border-radius: 8px; padding: 32px; margin: 24px 16px;` | White content card |
| **Logo** | `width: 40px; height: 40px;` centered, above card | Steel City AI mark |
| **Logo text** | `font-size: 16px; font-weight: 600; color: #18181b; text-align: center; margin-top: 8px;` | Brand name |
| **Headline** | `font-size: 20px; font-weight: 700; color: #18181b; margin-bottom: 8px;` | Action-specific |
| **Body text** | `font-size: 14px; line-height: 1.6; color: #3f3f46;` | Readable body |
| **Footer** | `font-size: 12px; color: #71717a; text-align: center; padding: 16px; line-height: 1.5;` | Muted footer text |
| **Footer links** | `color: #3b82f6; text-decoration: underline;` | Blue underlined links |

#### Post Preview Card (Shared Component)

The post preview card appears in all four email types, showing a snapshot of the post content.

```html
<!-- Post Preview Card -->
<table width="100%" cellpadding="0" cellspacing="0" style="
  background-color: #f4f4f5;
  border-radius: 8px;
  border: 1px solid #e4e4e7;
  margin: 16px 0;
">
  <tr>
    <td style="padding: 16px;">
      <!-- Platform badges row -->
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-right: 8px;">
            <!-- Platform badge: Instagram -->
            <span style="
              display: inline-block;
              background-color: #fce7f3;
              color: #be185d;
              font-size: 11px;
              font-weight: 600;
              padding: 2px 8px;
              border-radius: 9999px;
            ">Instagram</span>
          </td>
          <td style="padding-right: 8px;">
            <!-- Platform badge: Facebook -->
            <span style="
              display: inline-block;
              background-color: #dbeafe;
              color: #1d4ed8;
              font-size: 11px;
              font-weight: 600;
              padding: 2px 8px;
              border-radius: 9999px;
            ">Facebook</span>
          </td>
          <td>
            <span style="font-size: 12px; color: #71717a;">
              &bull; Scheduled: {{scheduledDate}}
            </span>
          </td>
        </tr>
      </table>

      <!-- Post content -->
      <p style="
        font-size: 14px;
        color: #18181b;
        line-height: 1.5;
        margin: 12px 0 0 0;
      ">
        {{postContentPreview}}
      </p>

      <!-- Media indicator (if applicable) -->
      {{#if hasMedia}}
      <p style="
        font-size: 12px;
        color: #71717a;
        margin: 8px 0 0 0;
      ">
        📷 {{mediaCount}} {{mediaType}} attached
      </p>
      {{/if}}

      <!-- Hashtags (if applicable) -->
      {{#if hashtags}}
      <p style="
        font-size: 12px;
        color: #3b82f6;
        margin: 8px 0 0 0;
      ">
        {{hashtags}}
      </p>
      {{/if}}
    </td>
  </tr>
</table>
```

| Post Preview Property | Specification | Notes |
|----------------------|---------------|-------|
| **Content truncation** | 150 characters + "..." | Keep email scannable |
| **Platform badges** | Inline `<span>` pills, not images | Works without image loading |
| **Platform colors** | Instagram: pink, Facebook: blue, Twitter/X: gray, LinkedIn: blue-700 | Consistent with app UI |
| **Media indicator** | "📷 2 images attached" / "🎥 1 video attached" | Emoji works cross-client |
| **Hashtags** | Blue text, shown inline | Max 5 hashtags displayed |
| **Scheduled date** | `MMM D, YYYY at h:mm A` format | "Mar 10, 2026 at 2:00 PM" |

#### Action Button Styling

All email action buttons use table-based "bulletproof buttons" for Outlook compatibility:

```html
<!-- Primary action button -->
<table cellpadding="0" cellspacing="0" style="margin: 24px 0;">
  <tr>
    <td style="
      background-color: {{primaryColor}};
      border-radius: 6px;
      padding: 12px 24px;
    ">
      <a href="{{actionUrl}}" style="
        color: #ffffff;
        font-size: 14px;
        font-weight: 600;
        text-decoration: none;
        display: inline-block;
      ">
        {{primaryLabel}}
      </a>
    </td>
    <td style="width: 12px;"></td>
    <td style="
      background-color: #ffffff;
      border: 1px solid #e4e4e7;
      border-radius: 6px;
      padding: 12px 24px;
    ">
      <a href="{{secondaryUrl}}" style="
        color: #3f3f46;
        font-size: 14px;
        font-weight: 600;
        text-decoration: none;
        display: inline-block;
      ">
        {{secondaryLabel}}
      </a>
    </td>
  </tr>
</table>
```

#### Button Color Map

| Email Type | Primary Button Color | Primary Label | Secondary Label |
|------------|---------------------|---------------|-----------------|
| **Request Received** | `#3b82f6` (blue-500) | "Review Post" | "View All Pending" |
| **Post Approved** | `#22c55e` (green-500) | "View Post" | "Go to Dashboard" |
| **Post Rejected** | `#ef4444` (red-500) | "View Feedback" | "Edit Post" |
| **Changes Requested** | `#f59e0b` (amber-500) | "View Changes" | "Edit Post" |

---

### 2.2 Request Received (Approver Email)

Sent to the next approver in the chain when a content creator submits a post for review.

#### Email Content

| Field | Value |
|-------|-------|
| **Subject** | `📋 Approval needed: "{{postTitle}}" — {{clientName}}` |
| **Preheader** | `{{creatorName}} submitted a post for your review. Scheduled for {{scheduledDate}}.` |
| **Headline icon** | `📋` (clipboard emoji) |
| **Headline** | `New post awaiting your approval` |
| **Context paragraph** | `{{creatorName}} has submitted a post for {{clientName}} and is waiting for your review. This post is scheduled to publish on {{scheduledDate}}.` |
| **Post preview** | Full preview card (see §2.1) |
| **Deadline section** | ⏰ **Review deadline:** {{deadlineDate}} — If no action is taken, this post will {{autoAction}}. |
| **Primary button** | "Review Post" → links to approval dashboard with post focused |
| **Secondary button** | "View All Pending" → links to approval queue tab |
| **Approval chain info** | "You are reviewer {{currentLevel}} of {{totalLevels}} in the approval chain." |

#### Deadline Section Specifications

| Property | Value | Notes |
|----------|-------|-------|
| **Container** | `background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 12px 16px;` | Amber/warning background |
| **Icon** | `⏰` emoji | Clock for urgency |
| **Text** | `font-size: 13px; color: #92400e;` | Dark amber text |
| **Auto-action text** | "auto-approve" or "remain pending" depending on config | Transparent about consequences |
| **Visibility** | Only shown if `autoApproveTimeout` is configured | Omit if no deadline |

#### Complete Email Layout

```
Subject: 📋 Approval needed: "Spring campaign launch" — Acme Corp

┌─────────────────────────────────────────────────────────┐
│                      [🔵 Logo]                           │
│                  Steel City AI                           │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │                                                      │ │
│ │  📋 New post awaiting your approval                  │ │
│ │                                                      │ │
│ │  Sarah Chen has submitted a post for Acme Corp       │ │
│ │  and is waiting for your review. This post is        │ │
│ │  scheduled to publish on Mar 10, 2026 at 2:00 PM.    │ │
│ │                                                      │ │
│ │  ┌──────────────────────────────────────────────────┐│ │
│ │  │ [Instagram] [Facebook]  • Scheduled: Mar 10     ││ │
│ │  │                                                  ││ │
│ │  │ "🌸 Spring is here! Check out our new           ││ │
│ │  │  collection featuring fresh designs and          ││ │
│ │  │  vibrant colors for the season..."               ││ │
│ │  │                                                  ││ │
│ │  │ 📷 3 images attached                            ││ │
│ │  │ #spring #newcollection #fashion                 ││ │
│ │  └──────────────────────────────────────────────────┘│ │
│ │                                                      │ │
│ │  ┌ ⏰ Review deadline: Mar 8, 2026 ─────────────── ┐│ │
│ │  │ If no action is taken by this date, the post    ││ │
│ │  │ will auto-approve and proceed to publishing.    ││ │
│ │  └─────────────────────────────────────────────────┘│ │
│ │                                                      │ │
│ │  You are reviewer 1 of 2 in the approval chain.      │ │
│ │                                                      │ │
│ │  [   Review Post   ]  [  View All Pending  ]         │ │
│ │                                                      │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│  You received this because you're an approver for        │
│  Acme Corp. [Manage notification preferences]            │
│                                                          │
│  © 2026 Steel City AI • Pittsburgh, PA                   │
└─────────────────────────────────────────────────────────┘
```

---

### 2.3 Post Approved (Creator Email)

Sent to the content creator when their post is approved by all required approvers.

#### Email Content

| Field | Value |
|-------|-------|
| **Subject** | `✅ Post approved: "{{postTitle}}" — {{clientName}}` |
| **Preheader** | `Your post has been approved by {{approverName}} and is ready to publish on {{scheduledDate}}.` |
| **Headline icon** | `✅` (green checkmark emoji) |
| **Headline** | `Your post has been approved!` |
| **Context paragraph** | `Great news! {{approverName}} has approved your post for {{clientName}}. {{#if autoPublish}}It will automatically publish on {{scheduledDate}}.{{else}}You can now schedule or publish it.{{/if}}` |
| **Post preview** | Full preview card (see §2.1) |
| **Approval details** | Shows who approved + timestamp |
| **Primary button** | "View Post" → links to post detail view |
| **Secondary button** | "Go to Dashboard" → links to PostsTab |

#### Approval Details Section

```html
<table width="100%" style="margin: 16px 0;">
  <tr>
    <td style="
      background-color: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      padding: 12px 16px;
    ">
      <p style="font-size: 13px; color: #166534; margin: 0;">
        ✓ Approved by <strong>{{approverName}}</strong> on {{approvalDate}}
      </p>
      {{#if approverComment}}
      <p style="font-size: 13px; color: #166534; margin: 8px 0 0 0; font-style: italic;">
        "{{approverComment}}"
      </p>
      {{/if}}
    </td>
  </tr>
</table>
```

| Property | Value | Notes |
|----------|-------|-------|
| **Background** | `#f0fdf4` (green-50) | Celebratory green |
| **Border** | `1px solid #bbf7d0` (green-200) | Matches |
| **Text** | `#166534` (green-800) | Readable on green-50 |
| **Comment** | Italic, shown if approver left a comment | Optional |

#### Complete Email Layout

```
Subject: ✅ Post approved: "Spring campaign launch" — Acme Corp

┌─────────────────────────────────────────────────────────┐
│                      [🔵 Logo]                           │
│                  Steel City AI                           │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │                                                      │ │
│ │  ✅ Your post has been approved!                      │ │
│ │                                                      │ │
│ │  Great news! Mike Johnson has approved your post     │ │
│ │  for Acme Corp. It will automatically publish on     │ │
│ │  Mar 10, 2026 at 2:00 PM.                            │ │
│ │                                                      │ │
│ │  ┌──────────────────────────────────────────────────┐│ │
│ │  │ [Instagram] [Facebook]  • Scheduled: Mar 10     ││ │
│ │  │                                                  ││ │
│ │  │ "🌸 Spring is here! Check out our new           ││ │
│ │  │  collection featuring fresh designs..."          ││ │
│ │  │                                                  ││ │
│ │  │ 📷 3 images attached                            ││ │
│ │  └──────────────────────────────────────────────────┘│ │
│ │                                                      │ │
│ │  ┌ ✓ Approved by Mike Johnson on Mar 6, 2026 ───── ┐│ │
│ │  │ "Looks great! Love the imagery."                ││ │
│ │  └─────────────────────────────────────────────────┘│ │
│ │                                                      │ │
│ │  [    View Post    ]    [  Go to Dashboard  ]        │ │
│ │                                                      │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│  You received this because you submitted this post for   │
│  approval. [Manage notification preferences]             │
│                                                          │
│  © 2026 Steel City AI • Pittsburgh, PA                   │
└─────────────────────────────────────────────────────────┘
```

---

### 2.4 Post Rejected (Creator Email)

Sent to the content creator when their post is rejected by an approver. Includes the rejection reason and a direct path to edit.

#### Email Content

| Field | Value |
|-------|-------|
| **Subject** | `❌ Post rejected: "{{postTitle}}" — {{clientName}}` |
| **Preheader** | `{{approverName}} rejected your post with feedback. Review the comments and resubmit.` |
| **Headline icon** | `❌` (red X emoji) |
| **Headline** | `Your post has been rejected` |
| **Context paragraph** | `{{approverName}} has reviewed your post for {{clientName}} and has decided not to approve it at this time. Please review their feedback below and make the necessary changes before resubmitting.` |
| **Post preview** | Full preview card (see §2.1) |
| **Rejection reason** | Quoted feedback from approver (mandatory — rejection requires comment) |
| **Primary button** | "View Feedback" → links to post detail with approval history focused |
| **Secondary button** | "Edit Post" → links to post in edit mode |

#### Rejection Feedback Section

```html
<table width="100%" style="margin: 16px 0;">
  <tr>
    <td style="
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      border-left: 4px solid #ef4444;
      border-radius: 6px;
      padding: 12px 16px;
    ">
      <p style="font-size: 12px; font-weight: 600; color: #991b1b; margin: 0 0 4px 0;">
        ✗ Rejected by {{approverName}} — {{rejectionDate}}
      </p>
      <p style="font-size: 14px; color: #991b1b; margin: 0; line-height: 1.5;">
        "{{rejectionComment}}"
      </p>
    </td>
  </tr>
</table>
```

| Property | Value | Notes |
|----------|-------|-------|
| **Background** | `#fef2f2` (red-50) | Soft red |
| **Border** | `1px solid #fecaca` (red-200) + `4px` left accent `#ef4444` (red-500) | Left accent draws eye to feedback |
| **Header** | `#991b1b` (red-800), 12px, bold | Rejector + date |
| **Comment** | `#991b1b` (red-800), 14px, quoted | The feedback itself |

#### Complete Email Layout

```
Subject: ❌ Post rejected: "Spring campaign launch" — Acme Corp

┌─────────────────────────────────────────────────────────┐
│                      [🔵 Logo]                           │
│                  Steel City AI                           │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │                                                      │ │
│ │  ❌ Your post has been rejected                       │ │
│ │                                                      │ │
│ │  Mike Johnson has reviewed your post for Acme Corp   │ │
│ │  and has decided not to approve it at this time.     │ │
│ │  Please review their feedback below and make the     │ │
│ │  necessary changes before resubmitting.              │ │
│ │                                                      │ │
│ │  ┌──────────────────────────────────────────────────┐│ │
│ │  │ [Instagram] [Facebook]  • Scheduled: Mar 10     ││ │
│ │  │                                                  ││ │
│ │  │ "🌸 Spring is here! Check out our new           ││ │
│ │  │  collection featuring fresh designs..."          ││ │
│ │  │                                                  ││ │
│ │  │ 📷 3 images attached                            ││ │
│ │  └──────────────────────────────────────────────────┘│ │
│ │                                                      │ │
│ │  ┌ ✗ Rejected by Mike Johnson — Mar 6, 2026 ────── ┐│ │
│ │  │ "The imagery doesn't align with the client's     ││ │
│ │  │  brand guidelines. The colors should use the     ││ │
│ │  │  spring palette from the brand kit. Also, the    ││ │
│ │  │  CTA is too aggressive for Instagram."           ││ │
│ │  └─────────────────────────────────────────────────┘│ │
│ │                                                      │ │
│ │  [  View Feedback  ]    [    Edit Post    ]          │ │
│ │                                                      │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│  You received this because you submitted this post for   │
│  approval. [Manage notification preferences]             │
│                                                          │
│  © 2026 Steel City AI • Pittsburgh, PA                   │
└─────────────────────────────────────────────────────────┘
```

---

### 2.5 Changes Requested (Creator Email)

Sent to the content creator when an approver requests specific changes before approval. Distinct from rejection — the post is not dismissed, just needs iteration.

#### Email Content

| Field | Value |
|-------|-------|
| **Subject** | `💬 Changes requested: "{{postTitle}}" — {{clientName}}` |
| **Preheader** | `{{approverName}} has requested changes to your post. Review the feedback and resubmit for approval.` |
| **Headline icon** | `💬` (speech bubble emoji) |
| **Headline** | `Changes requested on your post` |
| **Context paragraph** | `{{approverName}} has reviewed your post for {{clientName}} and is requesting some changes before it can be approved. This is not a rejection — your post is close! Review the feedback below and resubmit when you've made the updates.` |
| **Post preview** | Full preview card (see §2.1) |
| **Change request feedback** | Quoted feedback from approver |
| **Deadline section** | ⏰ **Resubmit by:** {{deadlineDate}} — The post is scheduled for {{scheduledDate}}. |
| **Primary button** | "View Changes" → links to post detail with approval history focused |
| **Secondary button** | "Edit Post" → links to post in edit mode |

#### Change Request Feedback Section

```html
<table width="100%" style="margin: 16px 0;">
  <tr>
    <td style="
      background-color: #eff6ff;
      border: 1px solid #bfdbfe;
      border-left: 4px solid #3b82f6;
      border-radius: 6px;
      padding: 12px 16px;
    ">
      <p style="font-size: 12px; font-weight: 600; color: #1e40af; margin: 0 0 4px 0;">
        💬 Changes requested by {{approverName}} — {{requestDate}}
      </p>
      <p style="font-size: 14px; color: #1e40af; margin: 0; line-height: 1.5;">
        "{{changeComment}}"
      </p>
    </td>
  </tr>
</table>
```

| Property | Value | Notes |
|----------|-------|-------|
| **Background** | `#eff6ff` (blue-50) | Soft blue — collaborative, not punitive |
| **Border** | `1px solid #bfdbfe` (blue-200) + `4px` left accent `#3b82f6` (blue-500) | Left accent for visual scanning |
| **Header** | `#1e40af` (blue-800), 12px, bold | Reviewer + date |
| **Comment** | `#1e40af` (blue-800), 14px, quoted | The requested changes |

#### Resubmission Deadline Section

```html
<table width="100%" style="margin: 16px 0;">
  <tr>
    <td style="
      background-color: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 6px;
      padding: 12px 16px;
    ">
      <p style="font-size: 13px; color: #92400e; margin: 0;">
        ⏰ <strong>Resubmit by:</strong> {{deadlineDate}}
      </p>
      <p style="font-size: 12px; color: #92400e; margin: 4px 0 0 0;">
        The post is scheduled for {{scheduledDate}}. Please make changes and resubmit in time for the next review cycle.
      </p>
    </td>
  </tr>
</table>
```

#### Complete Email Layout

```
Subject: 💬 Changes requested: "Spring campaign launch" — Acme Corp

┌─────────────────────────────────────────────────────────┐
│                      [🔵 Logo]                           │
│                  Steel City AI                           │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │                                                      │ │
│ │  💬 Changes requested on your post                    │ │
│ │                                                      │ │
│ │  Mike Johnson has reviewed your post for Acme Corp   │ │
│ │  and is requesting some changes before it can be     │ │
│ │  approved. This is not a rejection — your post is    │ │
│ │  close! Review the feedback below and resubmit when  │ │
│ │  you've made the updates.                            │ │
│ │                                                      │ │
│ │  ┌──────────────────────────────────────────────────┐│ │
│ │  │ [Instagram] [Facebook]  • Scheduled: Mar 10     ││ │
│ │  │                                                  ││ │
│ │  │ "🌸 Spring is here! Check out our new           ││ │
│ │  │  collection featuring fresh designs..."          ││ │
│ │  │                                                  ││ │
│ │  │ 📷 3 images attached                            ││ │
│ │  └──────────────────────────────────────────────────┘│ │
│ │                                                      │ │
│ │  ┌ 💬 Changes requested by Mike Johnson ─────────── ┐│ │
│ │  │ "The CTA needs to be softer — try 'Discover     ││ │
│ │  │  our collection' instead of 'Buy now'. Also,    ││ │
│ │  │  can you add a lifestyle shot instead of the    ││ │
│ │  │  product-only image as the first slide?"        ││ │
│ │  └─────────────────────────────────────────────────┘│ │
│ │                                                      │ │
│ │  ┌ ⏰ Resubmit by: Mar 8, 2026 ──────────────────  ┐│ │
│ │  │ The post is scheduled for Mar 10, 2026 at       ││ │
│ │  │ 2:00 PM. Please make changes and resubmit in    ││ │
│ │  │ time for the next review cycle.                 ││ │
│ │  └─────────────────────────────────────────────────┘│ │
│ │                                                      │ │
│ │  [  View Changes  ]    [    Edit Post    ]           │ │
│ │                                                      │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│  You received this because you submitted this post for   │
│  approval. [Manage notification preferences]             │
│                                                          │
│  © 2026 Steel City AI • Pittsburgh, PA                   │
└─────────────────────────────────────────────────────────┘
```

---

### 2.6 Email Design Tokens

Centralized design tokens for all email templates. Since emails cannot use CSS custom properties, values are hardcoded hex.

#### Color Tokens

| Token Name | Hex | Usage |
|------------|-----|-------|
| `--email-bg` | `#f4f4f5` | Page background (zinc-100) |
| `--email-card-bg` | `#ffffff` | Card background (white) |
| `--email-text-primary` | `#18181b` | Headlines, strong text (zinc-900) |
| `--email-text-body` | `#3f3f46` | Body text (zinc-700) |
| `--email-text-muted` | `#71717a` | Footer, secondary text (zinc-500) |
| `--email-link` | `#3b82f6` | Links (blue-500) |
| `--email-border` | `#e4e4e7` | Card borders, dividers (zinc-200) |
| `--email-success-bg` | `#f0fdf4` | Approved section bg (green-50) |
| `--email-success-border` | `#bbf7d0` | Approved section border (green-200) |
| `--email-success-text` | `#166534` | Approved text (green-800) |
| `--email-error-bg` | `#fef2f2` | Rejected section bg (red-50) |
| `--email-error-border` | `#fecaca` | Rejected section border (red-200) |
| `--email-error-accent` | `#ef4444` | Rejected left border (red-500) |
| `--email-error-text` | `#991b1b` | Rejected text (red-800) |
| `--email-info-bg` | `#eff6ff` | Changes requested bg (blue-50) |
| `--email-info-border` | `#bfdbfe` | Changes requested border (blue-200) |
| `--email-info-accent` | `#3b82f6` | Changes requested left border (blue-500) |
| `--email-info-text` | `#1e40af` | Changes requested text (blue-800) |
| `--email-warning-bg` | `#fffbeb` | Deadline section bg (amber-50) |
| `--email-warning-border` | `#fde68a` | Deadline border (amber-200) |
| `--email-warning-text` | `#92400e` | Deadline text (amber-800) |

#### Platform Badge Colors

| Platform | Background | Text |
|----------|-----------|------|
| **Instagram** | `#fce7f3` (pink-100) | `#be185d` (pink-700) |
| **Facebook** | `#dbeafe` (blue-100) | `#1d4ed8` (blue-700) |
| **Twitter/X** | `#f4f4f5` (zinc-100) | `#3f3f46` (zinc-700) |
| **LinkedIn** | `#dbeafe` (blue-100) | `#1e3a8a` (blue-900) |
| **TikTok** | `#fce7f3` (pink-100) | `#9d174d` (pink-800) |

#### Typography

| Element | Font Size | Weight | Line Height |
|---------|-----------|--------|-------------|
| **Headline** | `20px` | `700` | `1.3` |
| **Body** | `14px` | `400` | `1.6` |
| **Small / labels** | `12px` | `400` | `1.5` |
| **Button text** | `14px` | `600` | `1` |
| **Badge text** | `11px` | `600` | `1` |
| **Footer** | `12px` | `400` | `1.5` |

#### Email Client Compatibility Notes

| Client | Notes |
|--------|-------|
| **Gmail (web)** | Strips `<style>` blocks — all styles must be inline |
| **Gmail (mobile)** | Max-width may not be respected; test at 320px |
| **Outlook 2019+** | Uses Word rendering engine — avoid `border-radius` on `<td>`, use VML for rounded buttons if needed |
| **Outlook.com** | Strips background images — use `background-color` only |
| **Apple Mail** | Full CSS support — best case scenario |
| **Yahoo Mail** | Strips some inline styles — keep it simple |

#### Rendering Strategy

- All styles inline (no `<style>` block dependence)
- Use `<table>` layout (not `div` + CSS grid/flex)
- Font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`
- Test with [Litmus](https://litmus.com) or [Email on Acid](https://emailonacid.com) before deployment
- Provide plain-text fallback for each template

---

## Shared Design Tokens

Design tokens that extend the existing Phase 3 M1 token set for the prediction UI and email components.

### New CSS Custom Properties

```css
:root {
  /* Prediction gauge */
  --prediction-excellent: 142 71% 45%;   /* green-500 */
  --prediction-good: 84 81% 44%;         /* lime-500 */
  --prediction-average: 48 96% 47%;      /* yellow-500 */
  --prediction-below: 25 95% 53%;        /* orange-500 */
  --prediction-poor: 0 84% 60%;          /* red-500 */

  /* Confidence levels */
  --confidence-high: 142 71% 45%;        /* green-500 */
  --confidence-medium: 48 96% 47%;       /* yellow-500 */
  --confidence-low: 0 84% 60%;           /* red-500 */

  /* Factor impact */
  --factor-positive: 142 71% 45%;        /* green-500 */
  --factor-negative: 0 84% 60%;          /* red-500 */
  --factor-neutral: var(--muted-foreground);
}
```

### Animation Tokens

```css
@media (prefers-reduced-motion: no-preference) {
  .gauge-needle {
    transition: transform 600ms ease-out;
  }
  .prediction-score-enter {
    animation: scoreReveal 400ms ease-out;
  }
  .chart-line-enter {
    animation: lineDrawIn 800ms ease-out;
  }
}

@keyframes scoreReveal {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes lineDrawIn {
  from { stroke-dashoffset: 1000; }
  to { stroke-dashoffset: 0; }
}
```

### Icon Inventory (New for M2)

| Icon | Source | Usage |
|------|--------|-------|
| `Sparkles` | lucide-react | Prediction panel header |
| `Target` | lucide-react | Accuracy summary card |
| `TrendingUp` | lucide-react | Average error card |
| `BarChart3` | lucide-react | Prediction count card |
| `ArrowUpRight` | lucide-react | Trend improving |
| `ArrowRight` | lucide-react | Trend stable / neutral factor |
| `ArrowDownRight` | lucide-react | Trend declining |
| `ArrowUp` | lucide-react | Positive factor |
| `ArrowDown` | lucide-react | Negative factor |
| `AlertTriangle` | lucide-react | Low confidence warning |
| `Image` | lucide-react | Add media suggestion |
| `Clock` | lucide-react | Change time suggestion |
| `Hash` | lucide-react | Add hashtags suggestion |
| `MousePointerClick` | lucide-react | Add CTA suggestion |
| `Type` | lucide-react | Adjust content length suggestion |
| `Smile` | lucide-react | Add emoji suggestion |
| `ChevronDown` | lucide-react | Mobile collapsible toggle |

---

## Implementation Notes

### Library Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| `recharts` | existing | Performance history chart (ComposedChart, Line, Scatter) — already in project |
| `@radix-ui/react-collapsible` | existing | Mobile prediction panel collapse — already in project |
| `@radix-ui/react-tooltip` | existing | Confidence indicator tooltip — already in project |
| `date-fns` | existing | Date formatting in comparison view & charts — already in project |

No new dependencies required for Phase 3 Milestone 2 design implementation.

### Component File Map

| Component | File Path | Task |
|-----------|-----------|------|
| `PredictionResultDisplay` | `client/src/components/social/PredictionResultDisplay.tsx` | P3-B012 (new) |
| `ConfidenceIndicator` | `client/src/components/social/ConfidenceIndicator.tsx` | P3-B012 (new) |
| `FactorBreakdown` | `client/src/components/social/FactorBreakdown.tsx` | P3-B012 (new) |
| `SuggestionCard` | `client/src/components/social/SuggestionCard.tsx` | P3-B013 (new) |
| `PredictionPanel` | `client/src/components/social/PredictionPanel.tsx` | P3-B012 (new, container) |
| `PredictionPanelMobile` | `client/src/components/social/PredictionPanelMobile.tsx` | P3-B012 (new, mobile variant) |
| `ComparisonView` | `client/src/components/social/ComparisonView.tsx` | P3-B014 (new) |
| `PredictionHistoryChart` | `client/src/components/analytics/PredictionHistoryChart.tsx` | P3-B014 (new) |
| `PredictionSummaryCard` | `client/src/components/analytics/PredictionSummaryCard.tsx` | P3-B014 (new) |

### Email Template File Map

| Template | File Path | Task |
|----------|-----------|------|
| `approval-request-received.html` | `server/templates/email/approval-request-received.html` | P3-B006 (new) |
| `approval-post-approved.html` | `server/templates/email/approval-post-approved.html` | P3-B006 (new) |
| `approval-post-rejected.html` | `server/templates/email/approval-post-rejected.html` | P3-B006 (new) |
| `approval-changes-requested.html` | `server/templates/email/approval-changes-requested.html` | P3-B006 (new) |
| `_base-layout.html` | `server/templates/email/_base-layout.html` | P3-B006 (new, shared wrapper) |
| `_post-preview.html` | `server/templates/email/_post-preview.html` | P3-B006 (new, shared partial) |

### Template Variable Reference

| Variable | Type | Used In | Description |
|----------|------|---------|-------------|
| `{{postTitle}}` | string | All | Post title, truncated to 60 chars |
| `{{postContentPreview}}` | string | All | Post content, truncated to 150 chars |
| `{{clientName}}` | string | All | Client/organization name |
| `{{creatorName}}` | string | All | Person who created/submitted the post |
| `{{approverName}}` | string | Approved, Rejected, Changes | Reviewer's name |
| `{{scheduledDate}}` | string | All | "Mar 10, 2026 at 2:00 PM" |
| `{{approvalDate}}` | string | Approved | "Mar 6, 2026 at 3:15 PM" |
| `{{rejectionDate}}` | string | Rejected | "Mar 6, 2026 at 3:15 PM" |
| `{{requestDate}}` | string | Changes | "Mar 6, 2026 at 3:15 PM" |
| `{{deadlineDate}}` | string | Request Received, Changes | "Mar 8, 2026" |
| `{{rejectionComment}}` | string | Rejected | Approver's rejection reason |
| `{{changeComment}}` | string | Changes | Approver's requested changes |
| `{{approverComment}}` | string | Approved | Optional approval comment |
| `{{actionUrl}}` | string | All | Primary button link URL |
| `{{secondaryUrl}}` | string | All | Secondary button link URL |
| `{{platforms}}` | array | All | List of target platforms |
| `{{hasMedia}}` | boolean | All | Whether post has media attachments |
| `{{mediaCount}}` | number | All | Number of media items |
| `{{mediaType}}` | string | All | "image" / "images" / "video" / "videos" |
| `{{hashtags}}` | string | All | Space-separated hashtag string |
| `{{currentLevel}}` | number | Request Received | Current approval level |
| `{{totalLevels}}` | number | Request Received | Total approval chain levels |
| `{{autoAction}}` | string | Request Received | "auto-approve" / "remain pending" |
| `{{autoPublish}}` | boolean | Approved | Whether auto-publish is enabled |
| `{{preferencesUrl}}` | string | All (footer) | Notification settings link |

### Performance Budget

| Metric | Target | Measurement |
|--------|--------|-------------|
| Gauge SVG render | `< 10ms` | React Profiler — lightweight SVG |
| Prediction panel render (full) | `< 50ms` | React Profiler — gauge + factors + suggestions |
| Chart render (30 data points) | `< 100ms` | React Profiler — Recharts ComposedChart |
| Comparison view render | `< 30ms` | React Profiler — simple table + two score blocks |
| Prediction API response | `< 500ms` p95 | Server metrics — debounced, cached |
| Email template render | `< 50ms` | Server-side Handlebars/template compilation |
| Email total size | `< 100KB` per email | Including inline styles, no external CSS |

### Accessibility Checklist

- [ ] Gauge SVG has `role="img"` with `aria-label` describing score numerically
- [ ] Confidence bars are `aria-hidden="true"` (label text provides info)
- [ ] Factor direction conveyed via text ("+12", "-8") not just arrow icon color
- [ ] Suggestion "Applied" state announced via `aria-live="polite"` region
- [ ] Performance chart provides accessible `alt` text summarizing trend
- [ ] Chart data available as HTML `<table>` alternative (hidden, screen-reader accessible)
- [ ] Collapsible prediction panel uses `aria-expanded` attribute
- [ ] Mobile collapsible trigger meets `44×44px` touch target
- [ ] Color is never the only indicator — always paired with icon, text, or pattern
- [ ] Loading skeleton has `aria-busy="true"` and descriptive `aria-label`
- [ ] Email templates use semantic HTML (`<h1>`, `<p>`, `<table>` with proper headers)
- [ ] Email action buttons have descriptive link text (not "Click here")
- [ ] Email meets minimum `4.5:1` contrast ratio for body text
- [ ] `prefers-reduced-motion` disables gauge needle animation and chart entrance animation

---

*End of Phase 3 Milestone 2 Design Specifications*
