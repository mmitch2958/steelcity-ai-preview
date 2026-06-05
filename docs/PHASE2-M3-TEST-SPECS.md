# Phase 2 — Milestone 3 Test Specifications

**Tasks:** P2-Q007 (Real-Time Preview), P2-Q008 (Templates & Drafts), P2-Q009 (Loading Skeletons)  
**Project:** SMP-2026-Q1 — Social Media Management Platform  
**Branch:** SMP-Updates  
**Created:** 2026-03-05  
**Status:** ✅ Complete  
**Related User Stories:** US-012 (Real-Time Post Preview), US-013 (Post Templates & Drafts), US-014 (Loading Skeletons)  
**Dependencies:** P2-B006 (Preview build), P2-B007 (Templates build), P2-B008 (Drafts build), P2-B009 (Skeletons build), P2-D003 (Preview design), P2-D004 (Templates design), P2-D005 (Skeleton design)  
**Test Plan Reference:** [PHASE2-TEST-PLAN.md](./PHASE2-TEST-PLAN.md) §9–§11  
**Design Spec Reference:** [PHASE2-M1-DESIGN-SPECS.md](./PHASE2-M1-DESIGN-SPECS.md) (shared tokens)

---

## Table of Contents

1. [P2-Q007: Real-Time Post Preview Test Specification](#p2-q007-real-time-post-preview-test-specification)
   - 1.1 [Scope & Objectives](#11-scope--objectives)
   - 1.2 [Preconditions & Test Data](#12-preconditions--test-data)
   - 1.3 [Functional Tests — Core Preview](#13-functional-tests--core-preview)
   - 1.4 [Typing Speed vs Preview Update](#14-typing-speed-vs-preview-update)
   - 1.5 [Special Characters & XSS Prevention](#15-special-characters--xss-prevention)
   - 1.6 [Emoji Rendering](#16-emoji-rendering)
   - 1.7 [Platform-Specific Truncation](#17-platform-specific-truncation)
   - 1.8 [Media in Preview](#18-media-in-preview)
   - 1.9 [Touch / Tablet Tests](#19-touch--tablet-tests)
   - 1.10 [Keyboard Accessibility](#110-keyboard-accessibility)
   - 1.11 [Performance Benchmarks](#111-performance-benchmarks)
2. [P2-Q008: Post Templates & Drafts Test Specification](#p2-q008-post-templates--drafts-test-specification)
   - 2.1 [Scope & Objectives](#21-scope--objectives)
   - 2.2 [Preconditions & Test Data](#22-preconditions--test-data)
   - 2.3 [Template CRUD — Create](#23-template-crud--create)
   - 2.4 [Template CRUD — Use (Apply)](#24-template-crud--use-apply)
   - 2.5 [Template CRUD — Edit](#25-template-crud--edit)
   - 2.6 [Template CRUD — Delete](#26-template-crud--delete)
   - 2.7 [Template Search & Categories](#27-template-search--categories)
   - 2.8 [Drafts — Auto-Save](#28-drafts--auto-save)
   - 2.9 [Drafts — Restore](#29-drafts--restore)
   - 2.10 [Drafts — Delete](#210-drafts--delete)
   - 2.11 [Drafts — Edge Cases & Conflict Handling](#211-drafts--edge-cases--conflict-handling)
   - 2.12 [Cross-Feature: Templates ↔ Drafts ↔ Preview](#212-cross-feature-templates--drafts--preview)
   - 2.13 [Accessibility](#213-accessibility)
   - 2.14 [Performance Benchmarks](#214-performance-benchmarks)
3. [P2-Q009: Loading Skeletons Test Specification](#p2-q009-loading-skeletons-test-specification)
   - 3.1 [Scope & Objectives](#31-scope--objectives)
   - 3.2 [Preconditions & Test Data](#32-preconditions--test-data)
   - 3.3 [Functional Tests — Skeleton Visibility](#33-functional-tests--skeleton-visibility)
   - 3.4 [Skeleton Layout Matching](#34-skeleton-layout-matching)
   - 3.5 [Animation & Visual Quality](#35-animation--visual-quality)
   - 3.6 [Skeleton → Content Transition](#36-skeleton--content-transition)
   - 3.7 [Edge Cases & Error States](#37-edge-cases--error-states)
   - 3.8 [Accessibility](#38-accessibility)
   - 3.9 [Performance Benchmarks](#39-performance-benchmarks)
4. [Cross-Feature Integration Tests (M3)](#4-cross-feature-integration-tests-m3)
5. [Test Execution Checklist](#5-test-execution-checklist)

---

## P2-Q007: Real-Time Post Preview Test Specification

### 1.1 Scope & Objectives

**Component under test:** `CreatePostTab` — real-time preview split-pane  
**Build task:** P2-B006 (10h estimated)  
**Design task:** P2-D003 (Real-time preview layout design)  
**Architecture dependency:** A008 (Real-time preview architecture)  
**Estimated QA time:** 5h

**Objectives:**
1. Verify preview updates within 100ms debounce of last keystroke
2. Validate typing responsiveness under sustained fast input (no dropped characters, no UI jank)
3. Confirm special characters render safely (XSS prevention) and correctly
4. Test emoji rendering across platforms and browsers
5. Validate platform-specific character limits and truncation behavior
6. Verify media integration with real-time preview
7. Confirm split-pane / toggle layout works across viewports

**Priority legend:**

| Priority | Meaning | When to Run |
|----------|---------|-------------|
| **P0** | Blocker — feature doesn't work | Every build |
| **P1** | Critical — main flow broken | Every build |
| **P2** | Major — secondary flow broken | Pre-release |
| **P3** | Minor — cosmetic / edge case | Pre-release |

---

### 1.2 Preconditions & Test Data

**Required seed data (from `scripts/seed-phase2-test-data.ts`):**

| Data | Details |
|------|---------|
| Connected accounts | At least 4 platforms: Facebook, Instagram, X/Twitter, LinkedIn |
| Draft with media | 1 post with 3+ images (JPEG/PNG mix) for media preview tests |
| Draft with long content | 1 post with 5000+ characters for performance/scroll tests |
| Draft with emoji content | 1 post containing diverse emoji: flags 🇺🇸, skin tones 👋🏽, compound emoji 👨‍👩‍👧‍👦, symbols ™️©️ |
| Brand voice profiles | 2 profiles (professional, casual) for verifying preview reflects tone |

**Platform character limits (reference):**

| Platform | Limit | Behavior at Limit |
|----------|-------|-------------------|
| X / Twitter | 280 characters | Hard truncation in preview; warning indicator |
| Facebook | 63,206 characters | Soft limit; "See More" at ~477 characters in feed preview |
| Instagram | 2,200 characters (caption) | Soft limit; "…more" at ~125 characters in feed preview |
| LinkedIn | 3,000 characters | Soft limit; "…see more" at ~140 characters in feed preview |
| YouTube | 5,000 characters (description) | Soft limit at ~100 characters in search results |

**Environment preconditions:**
- User is logged in as portal user (realtor role)
- CreatePostTab is accessible with split-pane layout enabled
- At least 2 platforms selected in platform selector
- Network is stable (for core tests); throttled for performance tests
- Browser DevTools available for timing/performance measurement

---

### 1.3 Functional Tests — Core Preview

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| PRV-001 | Preview updates while typing | 1. Open CreatePostTab 2. Select Facebook + X platforms 3. Type "Hello world" in content field | Preview pane shows "Hello world" within 100ms of last keystroke. Both platform tabs render content. | P0 |
| PRV-002 | Platform-specific preview tabs | 1. Select Facebook, Instagram, X, LinkedIn 2. Type "Test content" 3. Click each platform preview tab | Separate preview tabs exist for each selected platform. Each shows platform-appropriate rendering (different card layouts, avatar positions, action buttons). | P0 |
| PRV-003 | Character count updates live | 1. Select X / Twitter 2. Type incrementally | Character count updates in real-time. Shows "X / 280" format. Counter color changes as limit approaches (green → amber → red). | P1 |
| PRV-004 | Hashtag highlighting in preview | 1. Type "#realestate #pittsburgh #openhouse" | Hashtags styled distinctly in preview (e.g., `text-primary font-medium` or platform-specific blue). Color differs from body text. | P1 |
| PRV-005 | Mention highlighting in preview | 1. Type "@steelcityai mention test" | Mentions highlighted in preview. If validation exists, show valid (blue) vs unresolved (gray) state. | P2 |
| PRV-006 | URL rendering in preview | 1. Type "Visit https://steelcity-ai.com for details" | URL rendered as styled link text in preview. Facebook/LinkedIn previews may show link card placeholder. | P2 |
| PRV-007 | Empty content placeholder | 1. Open CreatePostTab with empty content 2. Observe preview pane | Preview shows placeholder: "Start typing to see preview…" or equivalent. Placeholder disappears on first keystroke. | P2 |
| PRV-008 | Content cleared — placeholder returns | 1. Type content 2. Select all and delete | Preview reverts to placeholder state. Character count resets to 0. | P2 |
| PRV-009 | Multiline content rendering | 1. Type content with line breaks (Enter key) | Preview preserves line breaks. Paragraph spacing matches platform rendering conventions. | P1 |
| PRV-010 | Preview reflects selected platforms only | 1. Select Facebook + X 2. Observe preview tabs 3. Deselect X | X preview tab disappears. Only Facebook preview tab remains. No stale preview for deselected platforms. | P1 |
| PRV-011 | Mobile/desktop preview toggle | 1. If toggle exists, switch between mobile and desktop preview modes | Preview dimensions change. Mobile shows narrower card (~375px width). Desktop shows wider card (~600px). Content re-renders to fit. | P2 |
| PRV-012 | Split-pane resizable (desktop) | 1. On desktop viewport (≥1440px) 2. Drag the split-pane divider | Editor and preview panes resize proportionally. Minimum width for each pane enforced (e.g., 300px). Content re-renders on resize. | P2 |
| PRV-013 | Toggle view (tablet) | 1. On tablet viewport (768–1024px) 2. Toggle between editor and preview | Editor and preview switch views (not side-by-side). Toggle button clearly indicates current mode. | P1 |

---

### 1.4 Typing Speed vs Preview Update

**Core performance contract:** Preview updates within **100ms of the last keystroke** (debounced — not per-keystroke). Input field must remain fully responsive at all typing speeds.

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| PRV-T01 | Normal typing speed (~40 WPM) | 1. Type a sentence at normal conversational speed 2. Observe preview | Preview updates smoothly after each natural pause. No perceptible lag between pausing and preview rendering. | P0 |
| PRV-T02 | Fast typing speed (~80 WPM) | 1. Type rapidly for 10 seconds 2. Observe input field and preview | Input field captures every character without drops. Preview batches updates (may trail slightly during active typing). Preview catches up within 100ms of stopping. | P0 |
| PRV-T03 | Burst typing (~120+ WPM) | 1. Type as fast as possible for 5 seconds 2. Stop and observe | No dropped characters in input field. Preview catches up within 100ms of last keystroke. No UI freeze or jank during burst. | P1 |
| PRV-T04 | Paste large content (instant input) | 1. Paste 2000 characters from clipboard | Input field accepts all content immediately. Preview renders full pasted content within 200ms. No visible "building up" of content in preview. | P1 |
| PRV-T05 | Paste very large content (5000+ chars) | 1. Paste 5000+ characters | Content accepted. Preview renders (may use scrollable area). Debounce ensures single render, not streaming. No browser tab freeze. | P1 |
| PRV-T06 | Rapid delete (hold Backspace) | 1. Type 200 characters 2. Hold Backspace to delete all | Characters delete smoothly. Preview updates as content shrinks. When empty, placeholder appears. No stale content in preview. | P1 |
| PRV-T07 | Select-all + replace | 1. Type 500 characters 2. Ctrl/Cmd+A 3. Type "Replacement" | Input field shows "Replacement". Preview shows "Replacement" within 100ms. Old content fully gone from preview. | P1 |
| PRV-T08 | Debounce verification (DevTools) | 1. Open DevTools console 2. Add performance timestamp logging on preview render 3. Type "Hello" (5 keystrokes in ~500ms) | Preview renders **once** (or at most twice if a natural debounce boundary hit), not 5 times. Render timestamp ≤100ms after last keystroke. | P0 |
| PRV-T09 | Continuous editing (60+ seconds) | 1. Type, delete, retype for 60 continuous seconds | No memory leak (check DevTools Memory tab). Preview stays responsive throughout. No accumulating lag. | P2 |
| PRV-T10 | IME input (CJK characters) | 1. Enable Japanese/Chinese IME 2. Type using composition (e.g., type "nihon" → select "日本") | Preview does NOT update during composition (while IME is active). Updates after composition is committed. No garbled intermediate states. | P2 |

---

### 1.5 Special Characters & XSS Prevention

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| PRV-S01 | HTML injection — script tag | 1. Type `<script>alert('xss')</script>` | Rendered as **literal text** in preview: `<script>alert('xss')</script>`. No script execution. No blank preview. | P0 |
| PRV-S02 | HTML injection — img onerror | 1. Type `<img src=x onerror=alert(1)>` | Rendered as literal text. No image element created. No JavaScript execution. | P0 |
| PRV-S03 | HTML injection — event handlers | 1. Type `<div onmouseover="alert('xss')">hover me</div>` | Rendered as literal text. No interactive HTML element. | P0 |
| PRV-S04 | HTML entities | 1. Type `&amp; &lt; &gt; &quot; &#39;` | Preview shows: `&amp; &lt; &gt; &quot; &#39;` (literal entity text, NOT decoded HTML entities, since social posts are plaintext). | P1 |
| PRV-S05 | Ampersand in normal text | 1. Type "Tom & Jerry" | Preview shows "Tom & Jerry" correctly. Ampersand not mangled or encoded. | P0 |
| PRV-S06 | Angle brackets in normal text | 1. Type "Price < $500" and "Value > expected" | Preview shows both sentences correctly with `<` and `>` rendered as text. | P1 |
| PRV-S07 | Quotes in content | 1. Type `She said "hello" and it's fine` | Preview shows both double and single quotes correctly. No escaping artifacts. | P1 |
| PRV-S08 | Backslash and special escapes | 1. Type `C:\Users\Mike\Documents` | Preview shows the path with backslashes intact. No escape sequence interpretation. | P2 |
| PRV-S09 | Unicode special characters | 1. Type `Zero-width: ​ | Soft-hyphen: ­ | BOM: ﻿` (paste from prepared text) | Characters handled gracefully. No invisible content causing layout issues. Preview length matches what platforms would display. | P2 |
| PRV-S10 | Markdown-like syntax | 1. Type `**bold** _italic_ ~~strike~~` | Rendered as literal text in preview (social posts are plaintext, not markdown). No formatting applied. | P1 |
| PRV-S11 | SQL injection strings | 1. Type `'; DROP TABLE posts; --` | Rendered as literal text. No error. No backend interaction triggered from preview. | P1 |
| PRV-S12 | Null bytes and control characters | 1. Paste text containing `\x00`, `\x01`, `\x1F` | Control characters stripped or replaced. No preview crash. No invisible characters causing layout weirdness. | P3 |
| PRV-S13 | Very long unbroken string (no spaces) | 1. Paste 500 characters with no whitespace: `aaaaaa...` | Preview wraps text correctly (CSS `word-break: break-word` or `overflow-wrap: break-word`). No horizontal overflow or layout break. | P1 |
| PRV-S14 | RTL text (Arabic/Hebrew) | 1. Type `مرحبا بالعالم` (Arabic: "Hello World") | Preview displays with correct RTL direction. Text flows right-to-left. Mixing with LTR content handles bidirectional rendering. | P3 |

---

### 1.6 Emoji Rendering

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| PRV-E01 | Basic emoji | 1. Type "Great listing! 🏠🔑✨" | Emoji render correctly in preview. Not displayed as Unicode codepoints or boxes. Consistent across platform preview tabs. | P0 |
| PRV-E02 | Skin tone modifiers | 1. Type "Welcome! 👋🏻👋🏼👋🏽👋🏾👋🏿" | Each skin tone variant renders correctly. No fallback to default yellow. Each is a distinct shade. | P1 |
| PRV-E03 | Flag emoji | 1. Type "Located in 🇺🇸 Pittsburgh, PA" | Flag emoji renders as flag (not two-letter code). Works across Chrome, Firefox, Safari. | P1 |
| PRV-E04 | Compound/family emoji (ZWJ sequences) | 1. Type "Family home! 👨‍👩‍👧‍👦👩‍💻" | ZWJ emoji render as single compound glyphs, not decomposed into individual characters. | P1 |
| PRV-E05 | Emoji-only content | 1. Type "🏡🌟💰🔥" (only emoji, no text) | Preview renders all emoji. Character count is correct (each emoji = 1–2 characters depending on platform counting). | P1 |
| PRV-E06 | Emoji at character boundary (X/Twitter) | 1. Select X/Twitter 2. Type 278 characters + one emoji (2 code units) | Character count correctly accounts for emoji width. If emoji pushes past 280, truncation warning appears. Preview truncates at correct boundary (not mid-emoji). | P1 |
| PRV-E07 | Emoji in hashtags | 1. Type "#home🏠 #sold🎉" | Hashtag styling applies to the full tag including emoji. Platform previews show how each platform treats emoji-in-hashtags. | P2 |
| PRV-E08 | Recently added Unicode emoji | 1. Paste emoji from Unicode 15.0+ (e.g., 🫨 shaking face, 🪿 goose — if supported) | Either renders correctly or shows standard replacement character (□/tofu). No crash or layout break. | P3 |
| PRV-E09 | Emoji character count per platform | 1. Type 1 emoji (e.g., 👍) 2. Check character count for each platform tab | X/Twitter: counts as 1 character (API v2 counts emoji as variable length). Instagram/Facebook: counts as 1. LinkedIn: counts as 1. Count displayed matches what the platform actually counts. | P1 |
| PRV-E10 | Mixed emoji + special chars + hashtags | 1. Type "Open house today! 🏠 #realestate 📍123 Main St & more ✨" | All elements render correctly: emoji inline, hashtags highlighted, ampersand preserved, special characters clean. | P1 |
| PRV-E11 | Emoji copy-paste from external source | 1. Copy emoji-rich text from a website 2. Paste into content field | Emoji preserved on paste. No mojibake. Preview matches pasted content. | P1 |
| PRV-E12 | Keycap emoji (0️⃣-9️⃣, #️⃣, *️⃣) | 1. Type "Call 5️⃣5️⃣5️⃣-0️⃣1️⃣2️⃣3️⃣" | Keycap emoji render correctly as styled numbers. Not displayed as plain digits. | P2 |

---

### 1.7 Platform-Specific Truncation

**Core requirement:** Each platform preview tab must show how the post will appear on that platform, including truncation/expand behavior at the platform's feed display limit.

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| PRV-TR01 | X/Twitter — under limit (≤280) | 1. Select X 2. Type 200 characters | Full content shown in X preview. No truncation indicator. Character counter green. | P0 |
| PRV-TR02 | X/Twitter — at limit (280) | 1. Type exactly 280 characters | Full content shown. Character counter shows "280/280" in amber or neutral. No truncation. | P0 |
| PRV-TR03 | X/Twitter — over limit (>280) | 1. Type 350 characters | X preview shows first 280 characters. Truncation indicator: red highlight or `…` at 280. Character counter shows "350/280" in red. Warning badge on X tab. | P0 |
| PRV-TR04 | X/Twitter — truncation does not split word | 1. Type content where character 280 falls mid-word | Truncation preview breaks at last word boundary before 280, or shows exact 280 with visual cut. Behavior matches actual X rendering. | P1 |
| PRV-TR05 | X/Twitter — truncation does not split emoji | 1. Type 279 characters + one multi-codepoint emoji | Emoji either fully included (if within limit) or fully excluded. Never split mid-codepoint. | P1 |
| PRV-TR06 | Facebook — short content (<477 chars) | 1. Select Facebook 2. Type 200 characters | Full content shown in Facebook preview. No "See more" link. | P0 |
| PRV-TR07 | Facebook — feed truncation (~477 chars) | 1. Type 600 characters | Facebook preview shows ~477 characters with "... See more" link indicator. Clicking "See more" in preview expands to full content. | P1 |
| PRV-TR08 | Instagram — short caption (<125 chars) | 1. Select Instagram 2. Type 100 characters | Full caption shown. No "…more" indicator. | P0 |
| PRV-TR09 | Instagram — feed truncation (~125 chars) | 1. Type 300 characters | Instagram preview shows ~125 characters with "…more" indicator. Preview shows how caption appears in feed (collapsed). | P1 |
| PRV-TR10 | Instagram — caption limit (2200 chars) | 1. Type 2500 characters | Instagram preview shows truncated feed view. Character counter: "2500/2200" in red. Warning that content exceeds Instagram limit. | P1 |
| PRV-TR11 | LinkedIn — feed truncation (~140 chars) | 1. Type 300 characters | LinkedIn preview shows ~140 characters with "…see more" link. | P1 |
| PRV-TR12 | LinkedIn — full limit (3000 chars) | 1. Type 3200 characters | Character counter: "3200/3000" in red. Warning indicator on LinkedIn tab. | P1 |
| PRV-TR13 | Multi-platform simultaneous truncation | 1. Select X + Facebook + Instagram + LinkedIn 2. Type 500 characters | Each platform tab shows its own truncation behavior independently. X shows over-limit warning. Facebook shows "See more" at ~477. Instagram shows "…more" at ~125. LinkedIn shows "…see more" at ~140. | P0 |
| PRV-TR14 | Truncation updates live as user types | 1. Start typing from 0 characters 2. Cross each platform's threshold incrementally | Truncation indicators appear/disappear dynamically as character count crosses each platform's threshold. No stale truncation state. | P1 |
| PRV-TR15 | Character counter color coding | 1. Select X (280 limit) 2. Type incrementally | Counter color: green (0–220), amber (221–270), red (271+). Thresholds approximately at 80% and 97% of limit. | P1 |
| PRV-TR16 | Truncation with media attached | 1. Upload image 2. Type 300 characters 3. Check X preview | X preview accounts for media: if media reduces character limit (X shortens URLs), truncation threshold adjusts. Otherwise, same 280 limit. | P2 |
| PRV-TR17 | Platform deselect clears warnings | 1. Type 350 characters with X selected (over-limit warning showing) 2. Deselect X | X warning disappears. Remaining platform counters unaffected. | P1 |
| PRV-TR18 | Hashtags count toward limit | 1. Type 250 chars + "#realestate #pittsburgh" (pushes past 280 for X) | Hashtags included in character count. X preview shows over-limit if total exceeds 280. | P1 |

---

### 1.8 Media in Preview

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| PRV-M01 | Single image in preview | 1. Upload 1 image 2. Check each platform preview | Image displayed in preview matching platform layout (full-width for Instagram, card format for Facebook/LinkedIn). | P1 |
| PRV-M02 | Multiple images — carousel/grid | 1. Upload 4 images 2. Check Instagram preview | Instagram shows carousel indicator (dots). Facebook shows 2×2 grid. Each platform renders its own multi-image layout. | P1 |
| PRV-M03 | Image reorder reflected in preview | 1. Upload 3 images 2. Reorder via DnD (Phase 2 US-007) 3. Check preview | Preview shows images in the new order. First image is the "hero" in platforms that show a primary image. | P1 |
| PRV-M04 | Video thumbnail in preview | 1. Upload 1 video | Preview shows video thumbnail (or first frame). Play icon overlay. No auto-play in preview. | P2 |
| PRV-M05 | Media + text preview layout | 1. Upload image + type content | Preview shows both media and text in platform-correct order (e.g., Facebook: text above image, Instagram: image above caption). | P1 |
| PRV-M06 | Remove media — preview updates | 1. Upload image 2. Delete image from editor | Preview removes the image immediately. If no other media, media section disappears from preview. | P1 |

---

### 1.9 Touch / Tablet Tests

| Device | Viewport | Browser | Priority |
|--------|----------|---------|----------|
| iPad landscape | 1024×768 | Safari iOS | P1 |
| iPad portrait | 768×1024 | Safari iOS | P2 |
| Android tablet | 1280×800 | Chrome Android | P2 |

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| PRV-TB01 | Toggle view works on tablet | 1. On tablet (portrait, <1024px) 2. Tap toggle between editor/preview | View switches cleanly. No content loss. Toggle button is ≥44×44px touch target. | P1 |
| PRV-TB02 | On-screen keyboard doesn't obscure preview | 1. On tablet, tap content field (keyboard appears) 2. Switch to preview toggle | Preview visible above keyboard. No content cut off. Scroll works within preview if needed. | P1 |
| PRV-TB03 | Platform tab switching via touch | 1. Tap between Facebook/Instagram/X/LinkedIn preview tabs | Tabs respond to touch. Active tab indicator updates. Content re-renders for selected platform. | P1 |

---

### 1.10 Keyboard Accessibility

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| PRV-A01 | Tab navigation: editor → preview tabs | 1. Tab from content field through UI | Focus moves logically: content field → platform tabs → preview area → action buttons. | P1 |
| PRV-A02 | Platform tab keyboard switching | 1. Focus platform preview tabs 2. Arrow left/right | Arrow keys switch between platform tabs. Active tab receives `aria-selected="true"`. | P1 |
| PRV-A03 | Screen reader announces character count | 1. Enable screen reader 2. Type content | Character count region has `aria-live="polite"`. Announces count changes at debounced intervals (not every keystroke). | P2 |
| PRV-A04 | Screen reader announces over-limit warning | 1. Enable screen reader 2. Type past X limit | Assertive announcement: "Content exceeds X character limit. 350 of 280 characters." | P2 |
| PRV-A05 | Preview pane has accessible label | 1. Inspect preview pane | `aria-label="Post preview"` or equivalent. Platform tabs have `role="tablist"` with `role="tab"` children. | P1 |

---

### 1.11 Performance Benchmarks

| ID | Metric | Target | Measurement | Priority |
|----|--------|--------|-------------|----------|
| PRV-PERF-01 | Debounce latency (last keystroke → preview render) | ≤ 100ms | Timestamp delta between `input` event and preview DOM update. Measure via `performance.now()` instrumentation. | P0 |
| PRV-PERF-02 | Input responsiveness during fast typing | 0 dropped characters at 120 WPM | Type a known string at max speed. Compare input value to expected string. | P0 |
| PRV-PERF-03 | Frame rate during preview update | ≥ 60fps (no dropped frames) | Chrome DevTools Performance recording during typing burst + preview update cycle. | P1 |
| PRV-PERF-04 | Large content render (5000 chars) | < 200ms preview render | Paste 5000 characters. Measure time from paste to preview stable render. | P1 |
| PRV-PERF-05 | Memory stability (60s continuous editing) | No increase > 5MB | DevTools Memory heap snapshot before and after 60s of editing. | P2 |
| PRV-PERF-06 | Preview render with 10 images | < 300ms | Upload 10 images. Measure preview render time with all images displayed. | P2 |

---

## P2-Q008: Post Templates & Drafts Test Specification

### 2.1 Scope & Objectives

**Components under test:**
- `CreatePostTab` — template picker, "Save as Template", draft auto-save indicator
- `PostsTab` — drafts list filter
- `TemplateLibrary` — template CRUD, search, categories
- API: `GET/POST/PUT/DELETE /api/social/templates`, `GET/POST/PUT/DELETE /api/social/drafts`

**Build tasks:** P2-B007 (Templates, 14h), P2-B008 (Drafts, 8h)  
**Design task:** P2-D004 (Templates UI design)  
**Research dependency:** R005 (Template system requirements)  
**Estimated QA time:** 8h

**Objectives:**
1. Verify full template CRUD lifecycle (create, read/browse, update, delete)
2. Validate template application with conflict handling (existing content)
3. Confirm draft auto-save triggers every 30 seconds
4. Test draft restore fidelity (content, media, platforms, hashtags)
5. Validate draft deletion with confirmation
6. Test cross-feature integration (templates + drafts + preview + DnD media)
7. Verify data isolation between templates, drafts, and published posts

**Priority legend:**

| Priority | Meaning | When to Run |
|----------|---------|-------------|
| **P0** | Blocker — feature doesn't work | Every build |
| **P1** | Critical — main flow broken | Every build |
| **P2** | Major — secondary flow broken | Pre-release |
| **P3** | Minor — cosmetic / edge case | Pre-release |

---

### 2.2 Preconditions & Test Data

**Required seed data (from `scripts/seed-phase2-test-data.ts`):**

| Data | Details |
|------|---------|
| Templates | 5 pre-created templates: "Open House", "Just Listed", "Price Reduced", "Market Update", "Client Testimonial" |
| Template categories | 3 categories: "Listings", "Market", "Social" |
| Template with all fields | 1 template with: content, hashtags (#realestate #pittsburgh), platforms (Facebook + Instagram), category ("Listings") |
| Template with minimal fields | 1 template with: content only, no platforms/hashtags/category |
| Drafts | 3 existing drafts: 1 with media, 1 text-only, 1 with all fields populated |
| Connected accounts | 4+ platforms (Facebook, Instagram, X, LinkedIn) |
| Media files | 5 images available for upload during template/draft tests |

**Environment preconditions:**
- User is logged in as portal user (realtor role)
- CreatePostTab and PostsTab are accessible
- Template API endpoints are functional (or mocked)
- Draft auto-save interval is configured to 30 seconds
- Browser localStorage/sessionStorage is accessible (for draft conflict tests)

---

### 2.3 Template CRUD — Create

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| TPL-C01 | Create template from current post content | 1. In CreatePostTab, type "New listing at 123 Main St!" 2. Add hashtags: #realestate #openhouse 3. Select Facebook + Instagram 4. Click "Save as Template" 5. Name: "New Listing Announcement" 6. Category: "Listings" 7. Click Save | Template saved. Success toast: "Template 'New Listing Announcement' saved." Template appears in template library. | P0 |
| TPL-C02 | Create template — required name validation | 1. Click "Save as Template" 2. Leave name field empty 3. Click Save | Validation error: "Template name is required." Save button disabled or form not submitted. | P0 |
| TPL-C03 | Create template — duplicate name | 1. Create template named "Open House" (already exists in seed data) | Warning: "A template named 'Open House' already exists. Overwrite or choose a different name?" Options: Overwrite, Rename, Cancel. | P1 |
| TPL-C04 | Create template — long name | 1. Enter a 200-character template name 2. Save | Name truncated to max length (e.g., 100 chars) with clear indication, or validation error if exceeding limit. | P2 |
| TPL-C05 | Create template — special characters in name | 1. Name: `Listing & "Open House" — Spring's Best!` 2. Save | Template saved with special characters intact. Name displayed correctly in library. No encoding issues. | P1 |
| TPL-C06 | Create template — content only (no platforms) | 1. Type content 2. Don't select platforms 3. Save as template | Template created successfully. On apply, platform selector remains empty (user must choose). | P1 |
| TPL-C07 | Create template — empty content | 1. Don't type any content 2. Click "Save as Template" | Either: (a) blocked with "Content is required for a template", or (b) allowed for structural templates (platforms + hashtags only). Behavior should be consistent and intentional. | P2 |
| TPL-C08 | Create template with category | 1. Create template 2. Assign category "Listings" 3. Save | Template appears under "Listings" category filter in library. | P1 |
| TPL-C09 | Create template without category | 1. Create template 2. Leave category unselected 3. Save | Template saved under "Uncategorized" or "All" view. Still searchable. | P2 |
| TPL-C10 | Template stores structure, not specifics | 1. Create template with content "Check out this property at [ADDRESS]! [PRICE]" | Template saved with placeholder text. On apply, user can fill in specifics. Content is reusable structure. | P1 |

---

### 2.4 Template CRUD — Use (Apply)

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| TPL-U01 | Apply template to empty post | 1. Open CreatePostTab (empty) 2. Open template picker 3. Click "Use Template" on "Open House" | Content field populated with template content. Platforms selected per template. Hashtags populated. Preview updates to show template content. | P0 |
| TPL-U02 | Apply template with existing content — replace | 1. Type "Some existing content" 2. Open template picker 3. Click "Use Template" on "Just Listed" 4. Confirmation dialog: click "Replace" | Existing content replaced with template content. All fields (platforms, hashtags) overwritten with template values. | P0 |
| TPL-U03 | Apply template with existing content — cancel | 1. Type "Some existing content" 2. Open template picker 3. Click "Use Template" 4. Confirmation dialog: click "Cancel" | Content unchanged. Template not applied. Template picker may remain open. | P0 |
| TPL-U04 | Apply template with existing content — merge (if supported) | 1. Type "Existing content" 2. Apply template 3. Confirmation dialog: click "Merge" (if option exists) | Template content appended to existing content. Platforms merged (union). Hashtags merged (no duplicates). | P2 |
| TPL-U05 | Template picker — card-based layout | 1. Open template picker | Templates displayed as cards in a grid. Each card shows: template name, content preview (truncated), category badge, platform icons. | P0 |
| TPL-U06 | Template preview on hover (desktop) | 1. Hover over a template card | Expanded preview appears showing full content, platforms, hashtags. Preview dismisses on mouse leave. | P1 |
| TPL-U07 | Template preview on tap (tablet) | 1. Tap a template card on tablet | Preview appears. Second tap or "Use Template" button applies it. Distinct from accidental tap. | P1 |
| TPL-U08 | Applied template updates real-time preview | 1. Apply a template 2. Check preview pane | Preview pane shows template content rendered per each selected platform. Character counts update. Truncation warnings appear if applicable. | P0 |
| TPL-U09 | Template with media references (if supported) | 1. If templates can include media references 2. Apply such a template | Media appears in the upload area. Preview shows media. (If templates don't include media, verify this is documented.) | P2 |
| TPL-U10 | Apply template then edit content | 1. Apply template 2. Modify the populated content | Edits persist. Template is a starting point, not a binding. No "reset to template" behavior unless explicitly triggered. | P0 |

---

### 2.5 Template CRUD — Edit

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| TPL-E01 | Edit template content | 1. Open template library 2. Click "Edit" on "Open House" template 3. Change content 4. Save | Template updated. Success toast. Existing posts created from this template are NOT affected. | P0 |
| TPL-E02 | Edit template name | 1. Edit template 2. Change name from "Open House" to "Open House Weekend" 3. Save | Name updated in library. Any references to old name updated (or template uses ID internally, not name). | P1 |
| TPL-E03 | Edit template — change category | 1. Edit template 2. Change category from "Listings" to "Social" 3. Save | Template now appears under "Social" filter. No longer under "Listings". | P1 |
| TPL-E04 | Edit template — change platforms | 1. Edit template 2. Remove Instagram, add LinkedIn 3. Save | Platform selection updated. Next time template is applied, new platform set is used. | P1 |
| TPL-E05 | Edit template — cancel without saving | 1. Open edit mode 2. Make changes 3. Click "Cancel" or close dialog | Template unchanged. No partial save. Confirmation prompt if changes were made: "Discard changes?" | P1 |
| TPL-E06 | Edit template — concurrent access | 1. Open same template for editing in two browser tabs 2. Save in tab A 3. Save in tab B | Tab B either: (a) overwrites with warning, (b) shows conflict dialog: "Template was modified. Reload and re-edit?", or (c) last-write-wins with no error. No data corruption. | P3 |

---

### 2.6 Template CRUD — Delete

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| TPL-D01 | Delete template — confirmation | 1. Click "Delete" on a template 2. Confirmation dialog appears | Dialog text: "Delete template 'Open House'? This action cannot be undone." Buttons: "Cancel" (focused) and "Delete" (destructive style). | P0 |
| TPL-D02 | Delete template — confirm | 1. Click "Delete" on template 2. Confirm deletion | Template removed from library. Success toast: "Template 'Open House' deleted." Library updates immediately (optimistic). | P0 |
| TPL-D03 | Delete template — cancel | 1. Click "Delete" 2. Click "Cancel" in dialog | Template preserved. Library unchanged. | P0 |
| TPL-D04 | Delete template — existing posts unaffected | 1. Apply "Open House" template to create Post A 2. Publish Post A 3. Delete "Open House" template | Post A remains intact with its content. Template deletion does not cascade to posts. | P0 |
| TPL-D05 | Delete last template in category | 1. Delete the only template in "Market" category | "Market" category either: (a) disappears from filter list, or (b) shows empty state "No templates in this category." | P2 |
| TPL-D06 | Delete template — undo (if supported) | 1. Delete a template 2. Click "Undo" in toast (if available) | Template restored. If no undo is supported, deletion is permanent (and confirmation dialog is the safeguard). | P2 |
| TPL-D07 | Bulk delete templates (if supported) | 1. Select multiple templates 2. Delete | All selected templates deleted with single confirmation. Count accurate in dialog: "Delete 3 templates?" | P3 |

---

### 2.7 Template Search & Categories

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| TPL-F01 | Search by name | 1. Open template library 2. Type "open" in search field | "Open House" template shown. Non-matching templates hidden. Search is case-insensitive. | P1 |
| TPL-F02 | Search by content | 1. Type "listing" in search (appears in template content, not name) | Templates containing "listing" in content are shown. | P2 |
| TPL-F03 | Search — no results | 1. Type "zzzznonexistent" | Empty state: "No templates match your search." Clear search option visible. | P1 |
| TPL-F04 | Search — real-time filtering | 1. Type search term character by character | Template list filters in real-time (debounced, ~200ms). No full-page reload. | P1 |
| TPL-F05 | Category filter | 1. Click "Listings" category filter | Only templates in "Listings" category shown. "All" option available to clear filter. | P1 |
| TPL-F06 | Category + search combined | 1. Filter by "Listings" 2. Search for "open" | Results filtered by both criteria (intersection). Shows templates named/containing "open" AND categorized as "Listings". | P2 |
| TPL-F07 | Clear search | 1. Type search term 2. Click clear (×) button or clear field | All templates shown again (respecting any active category filter). | P1 |
| TPL-F08 | Template count indicator | 1. View template library header | Shows total count: "5 templates" or per-category counts. Updates when templates are added/deleted. | P2 |
| TPL-F09 | Template sort order | 1. Open template library | Templates sorted by: (a) recently used, (b) alphabetical, or (c) most recently created. Sort option/indicator visible. | P2 |
| TPL-F10 | 50+ templates performance | 1. Create 50 templates (via script or seed data) 2. Open template library | Library loads within 200ms. Search filtering remains responsive. No visible scroll jank. | P2 |

---

### 2.8 Drafts — Auto-Save

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| DFT-AS01 | Auto-save triggers after 30s | 1. Open CreatePostTab 2. Type "Draft test content" 3. Wait 35 seconds (do not manually save) | Visual indicator appears: "Draft saved" or "Last saved: [timestamp]". API call to `/api/social/drafts` fires (visible in DevTools Network). | P0 |
| DFT-AS02 | Auto-save indicator updates | 1. Type content 2. Wait for auto-save 3. Type more content 4. Wait for another auto-save | Indicator updates: "Saved 30 seconds ago" → "Saving…" → "Saved just now". Timestamp reflects most recent save. | P0 |
| DFT-AS03 | Auto-save captures all fields | 1. Type content 2. Add hashtags 3. Select Facebook + Instagram 4. Upload 2 images 5. Wait for auto-save 6. Navigate away 7. Open draft from PostsTab | Draft contains: content, hashtags, platform selections, media references. All fields restored accurately. | P0 |
| DFT-AS04 | Auto-save does NOT trigger with no changes | 1. Type content 2. Wait for auto-save 3. Don't change anything 4. Wait another 35 seconds | Only 1 auto-save API call. Second interval does NOT fire another save (no changes detected). Reduces unnecessary API calls. | P1 |
| DFT-AS05 | Auto-save after continuous editing | 1. Type continuously for 2 minutes (never pausing >30s) | Auto-save fires at 30-second intervals during active editing. Each save captures the current state. At least 3 saves occur in 2 minutes. | P1 |
| DFT-AS06 | Auto-save timing accuracy | 1. Open DevTools 2. Note timestamp of first keystroke 3. Watch for auto-save API call | Auto-save fires within 30s ± 5s of first edit (or last save). Timer resets after each save, not each keystroke. | P1 |
| DFT-AS07 | "Saving…" visual state | 1. Trigger auto-save 2. Observe indicator during API call | Indicator shows "Saving…" (with spinner/animation) while API call is in flight. Transitions to "Saved" on success. | P1 |
| DFT-AS08 | Auto-save failure handling | 1. Simulate API failure (mock 500 response) 2. Wait for auto-save | Indicator shows "Save failed" or "Unable to save" with retry option. Content NOT lost from the editor. Next auto-save cycle retries. | P1 |
| DFT-AS09 | Auto-save with media upload in progress | 1. Start uploading a large image 2. Auto-save triggers during upload | Auto-save either: (a) waits for upload to complete, then saves, or (b) saves text/metadata now, queues media for next save. No partial/corrupt media references. | P2 |
| DFT-AS10 | Auto-save on tab switch (focus loss) | 1. Type content 2. Switch to another browser tab (before 30s) | Auto-save triggers immediately on focus loss (if content changed). Content preserved even if browser tab is closed. | P1 |

---

### 2.9 Drafts — Restore

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| DFT-R01 | Restore draft from PostsTab | 1. Go to PostsTab 2. Filter by "Drafts" status 3. Click on a draft | Opens in CreatePostTab with all fields restored: content, hashtags, media, platform selections. Auto-save indicator shows "Draft loaded." | P0 |
| DFT-R02 | Restore draft — content fidelity | 1. Create draft with: emoji 🏠, hashtags #test, special chars &<>"', multiline text 2. Save 3. Navigate away 4. Restore draft | Every character, emoji, line break, and special character matches exactly what was saved. No encoding/decoding loss. | P0 |
| DFT-R03 | Restore draft — media restored | 1. Create draft with 3 images 2. Auto-save 3. Restore | All 3 images displayed in media area. Image order preserved. Thumbnails rendered. No broken image references. | P0 |
| DFT-R04 | Restore draft — platform selections restored | 1. Create draft with Facebook + LinkedIn selected 2. Save 3. Restore | Facebook and LinkedIn checkboxes selected. Other platforms unchecked. Preview shows both platform tabs. | P1 |
| DFT-R05 | Restore draft while editing another post | 1. Start editing a new post (with content) 2. Go to PostsTab 3. Click on a draft | Confirmation: "You have unsaved changes. Discard and load draft?" with Discard / Save & Load / Cancel options. | P1 |
| DFT-R06 | Restore draft — preview updates | 1. Restore a draft | Real-time preview pane immediately shows draft content with platform-specific rendering. Character counts reflect draft content. | P1 |
| DFT-R07 | Drafts list — last edited timestamp | 1. View drafts list in PostsTab | Each draft shows "Last edited" timestamp (e.g., "2 hours ago" or "March 5, 2026 at 3:15 PM"). Sorted by most recently edited. | P1 |
| DFT-R08 | Drafts list — content preview | 1. View drafts list | Each draft card shows first ~100 characters of content as preview. Media thumbnail if media attached. | P1 |
| DFT-R09 | Restore very old draft (30+ days) | 1. Restore a draft from 30+ days ago | Draft restores normally. Content intact. Media still accessible (S3 links valid). No expiration without warning. | P2 |

---

### 2.10 Drafts — Delete

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| DFT-D01 | Delete draft — confirmation dialog | 1. Click "Delete" on a draft in PostsTab | Dialog: "Delete this draft? This action cannot be undone." Buttons: "Cancel" (focused), "Delete" (destructive). | P0 |
| DFT-D02 | Delete draft — confirm | 1. Confirm deletion | Draft removed from list. Success toast: "Draft deleted." API `DELETE` call fires. | P0 |
| DFT-D03 | Delete draft — cancel | 1. Click "Cancel" in dialog | Draft preserved. List unchanged. | P0 |
| DFT-D04 | Delete draft while it's open in editor | 1. Open a draft in CreatePostTab 2. In another tab/window, delete the same draft | When returning to the editor tab: content still in editor (not lost), but auto-save fails gracefully (draft no longer exists). Message: "This draft no longer exists. Save as new draft?" | P2 |
| DFT-D05 | Delete all drafts (if bulk delete supported) | 1. Select all drafts 2. Bulk delete | All drafts deleted. Empty state: "No drafts yet. Start creating a post and it will be auto-saved." | P2 |
| DFT-D06 | Draft → Publish → draft removed | 1. Open a draft 2. Complete the post 3. Click "Publish" | Post publishes. Draft is automatically deleted (no orphan draft for a published post). Published post appears in PostsTab with "Published" status. | P0 |
| DFT-D07 | Draft → Schedule → draft removed | 1. Open a draft 2. Set schedule date 3. Click "Schedule" | Post scheduled. Draft is automatically converted/deleted. Post appears with "Scheduled" status. | P0 |

---

### 2.11 Drafts — Edge Cases & Conflict Handling

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| DFT-EC01 | Draft conflict — two tabs editing same draft | 1. Open draft in Tab A 2. Open same draft in Tab B 3. Edit content in Tab A (auto-save fires) 4. Edit content in Tab B (auto-save fires) | Either: (a) last-write-wins (Tab B overwrites Tab A's changes silently), or (b) conflict detected with prompt: "This draft was modified in another window. Reload or overwrite?" No data corruption in either case. | P2 |
| DFT-EC02 | Draft with very large content (10,000+ chars) | 1. Paste 10,000 characters 2. Wait for auto-save | Draft saves successfully. No timeout. Restore also works. Character count and preview handle large content. | P2 |
| DFT-EC03 | Browser crash during auto-save | 1. Type content 2. Force-close browser during auto-save (simulate) 3. Reopen and check drafts | Last successfully saved draft state is available. In-flight save may be lost (acceptable). No corrupted draft entry. | P3 |
| DFT-EC04 | Network offline — auto-save fails | 1. Go offline 2. Type content 3. Auto-save triggers | "Save failed — you're offline" indicator. Content NOT lost from editor. When online resumes, next auto-save succeeds. | P1 |
| DFT-EC05 | Rapid edits between auto-saves | 1. Type 500 chars in first 10s 2. Delete and retype 300 chars in next 10s 3. Auto-save at 30s | Saved draft contains the 300-char version (current state at save time). Previous 500-char state is NOT saved. | P1 |
| DFT-EC06 | Draft created from template | 1. Apply a template 2. Edit template content 3. Auto-save triggers | Draft saves the edited content (not the original template). Draft is independent from template. | P1 |
| DFT-EC07 | Multiple new drafts in one session | 1. Start a post (auto-save → Draft 1) 2. Navigate away 3. Start another new post (auto-save → Draft 2) | Both drafts exist independently in the drafts list. No overwriting. Each has unique ID. | P1 |
| DFT-EC08 | Draft overwrite on re-edit | 1. Create Draft A 2. Navigate away 3. Open Draft A 4. Edit content 5. Auto-save | Same draft updated in place (no new draft created). Draft ID unchanged. "Last edited" timestamp updates. | P0 |

---

### 2.12 Cross-Feature: Templates ↔ Drafts ↔ Preview

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| XF-TD01 | Template → Edit → Auto-save as draft | 1. Apply "Open House" template 2. Modify content 3. Wait 30s for auto-save | Draft saved with modified template content. Draft is independent — editing the template later doesn't affect this draft. | P0 |
| XF-TD02 | Template applied → Preview updates → Character warnings | 1. Apply a template with 250 characters 2. Select X/Twitter 3. Check preview | Preview shows template content. X character counter shows "250/280" in green. No truncation. | P1 |
| XF-TD03 | Restore draft → Preview shows draft content | 1. Restore a draft with content + media 2. Check preview | Preview renders draft content with media in platform-specific layout. All platform tabs accurate. | P1 |
| XF-TD04 | Template with DnD media order | 1. Apply template (with media if supported) 2. Upload additional images 3. Reorder via DnD 4. Auto-save | Draft saves the reordered media sequence. On restore, media order matches what was saved. | P1 |
| XF-TD05 | Draft from duplicated post + template | 1. Duplicate a post (US-008) 2. Apply a template to the duplicate (overwrite) 3. Auto-save | Draft contains template content (not original duplicated content). Post duplication and template application are independent operations. | P2 |

---

### 2.13 Accessibility

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| TPL-A01 | Template picker keyboard navigation | 1. Open template picker via keyboard (Enter/Space on trigger button) 2. Tab through template cards 3. Enter to apply | Full keyboard flow works. Focus trap within picker dialog. Escape closes picker. | P1 |
| TPL-A02 | Template cards have accessible labels | 1. Inspect template card elements | Each card has `aria-label="Template: Open House — Listings category"` or equivalent descriptive label. | P1 |
| TPL-A03 | Template actions accessible | 1. Tab to a template card 2. Access Edit/Delete actions | Actions accessible via keyboard (e.g., context menu, or visible buttons that receive focus). `aria-label` on each action button. | P1 |
| TPL-A04 | Confirmation dialogs keyboard accessible | 1. Trigger delete confirmation via keyboard 2. Navigate dialog | Dialog has focus trap. Tab cycles through Cancel → Delete. Escape = Cancel. Cancel is initially focused (destructive action safety). | P1 |
| DFT-A01 | Auto-save status accessible | 1. Enable screen reader 2. Wait for auto-save | Status region with `aria-live="polite"` announces "Draft saved" when auto-save completes. "Save failed" announced assertively. | P1 |
| DFT-A02 | Drafts list keyboard navigable | 1. Tab through drafts list in PostsTab | Each draft item is focusable. Enter opens/restores. Delete action accessible. Focus ring visible. | P1 |

---

### 2.14 Performance Benchmarks

| ID | Metric | Target | Measurement | Priority |
|----|--------|--------|-------------|----------|
| TPL-PERF-01 | Template picker open time | < 200ms | Measure time from click to template grid visible. | P1 |
| TPL-PERF-02 | Template apply time | < 100ms content population | Measure time from "Use Template" click to content field populated + preview updated. | P1 |
| TPL-PERF-03 | Template search filtering | < 100ms per keystroke | Debounced filtering, measured via UI responsiveness. | P2 |
| TPL-PERF-04 | Template library with 50+ templates | No scroll jank | Smooth scrolling through 50+ template cards at 60fps. | P2 |
| DFT-PERF-01 | Auto-save API latency | < 500ms round-trip | Network timing for draft save `POST/PUT` call. | P1 |
| DFT-PERF-02 | Draft restore time | < 300ms | Measure time from draft click to all fields populated + preview rendered. | P1 |
| DFT-PERF-03 | Draft list loading | < 200ms | Measure time to render drafts list (with 20 drafts). | P2 |

---

## P2-Q009: Loading Skeletons Test Specification

### 3.1 Scope & Objectives

**Components under test:** All tab components — `DashboardTab`, `PostsTab`, `ContentCalendarTab`, `AnalyticsTab`, `CreatePostTab`, `CampaignsTab`, `AccountsTab`, `BrandVoiceTab`, plus template picker and draft restore loading states.

**Build task:** P2-B009 (10h estimated)  
**Design task:** P2-D005 (Skeleton specifications)  
**Design deliverable:** L007 (Skeleton component designs)  
**Estimated QA time:** 3h

**Objectives:**
1. Verify skeletons appear during all async data loading operations
2. Validate skeleton layout dimensions match actual content exactly (CLS = 0)
3. Confirm shimmer/pulse animation is smooth and consistent
4. Test skeleton → content transition (no flash, no layout shift)
5. Verify skeletons replace all previous spinner/loading implementations
6. Validate skeleton accessibility (`aria-busy`, screen reader announcements)

**Priority legend:**

| Priority | Meaning | When to Run |
|----------|---------|-------------|
| **P0** | Blocker — feature doesn't work | Every build |
| **P1** | Critical — main flow broken | Every build |
| **P2** | Major — secondary flow broken | Pre-release |
| **P3** | Minor — cosmetic / edge case | Pre-release |

---

### 3.2 Preconditions & Test Data

**Required setup:**

| Setup | Details |
|-------|---------|
| Network throttling | Chrome DevTools → Network → Slow 3G or custom throttle (~500ms–2s delay) to make loading states visible |
| All tabs populated | Seed data must provide data for every tab (posts, campaigns, analytics, calendar events) |
| Empty state variants | At least one test scenario where a tab has zero data (to test skeleton → empty state transition) |
| Error state variants | Mock API responses returning 500 for skeleton → error boundary tests |

**Network throttle profiles for testing:**

| Profile | Latency | Download | Use Case |
|---------|---------|----------|----------|
| Fast (baseline) | 50ms | 10 Mbps | Verify skeleton flashes briefly or not at all |
| Medium | 300ms | 1.5 Mbps | Standard skeleton visibility testing |
| Slow 3G | 2000ms | 400 Kbps | Extended skeleton visibility, animation quality |
| Offline | — | — | Error state testing |

**Environment preconditions:**
- User is logged in as portal user
- All tabs accessible via tab navigation
- DevTools available for network throttling, performance recording, and CLS measurement
- Lighthouse CLI or DevTools Lighthouse panel available

---

### 3.3 Functional Tests — Skeleton Visibility

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| SKL-001 | PostsTab skeleton on initial load | 1. Set network to Slow 3G 2. Navigate to PostsTab (first visit, no cache) | Skeleton grid of post cards displayed immediately. Cards show: skeleton title bar, skeleton content lines (2–3), skeleton media placeholder, skeleton action buttons. | P0 |
| SKL-002 | ContentCalendarTab skeleton | 1. Set network to Slow 3G 2. Navigate to Calendar tab | Skeleton calendar grid displayed: 7-column header (day names visible immediately), skeleton date cells, skeleton post card placeholders in occupied cells. | P0 |
| SKL-003 | AnalyticsTab skeleton | 1. Set network to Slow 3G 2. Navigate to Analytics tab | Skeleton metric cards (4 cards matching KPI card layout) + skeleton chart area (rectangle matching chart dimensions). | P0 |
| SKL-004 | DashboardTab skeleton | 1. Set network to Slow 3G 2. Navigate to Dashboard tab | Skeleton matching dashboard layout: skeleton summary cards, skeleton recent posts list, skeleton chart placeholder. | P1 |
| SKL-005 | CreatePostTab skeleton (draft loading) | 1. Set network to Slow 3G 2. Click on a draft to open in CreatePostTab | Skeleton for form fields: skeleton text area (content), skeleton platform selector, skeleton hashtag area, skeleton media zone. | P2 |
| SKL-006 | CampaignsTab skeleton | 1. Set network to Slow 3G 2. Navigate to Campaigns tab | Skeleton campaign cards matching campaign card layout. | P1 |
| SKL-007 | AccountsTab skeleton | 1. Set network to Slow 3G 2. Navigate to Accounts tab | Skeleton account cards with: skeleton avatar circle, skeleton platform name, skeleton status indicator. | P2 |
| SKL-008 | BrandVoiceTab skeleton | 1. Set network to Slow 3G 2. Navigate to Brand Voice tab | Skeleton profile cards with: skeleton title, skeleton description lines, skeleton tone indicator. | P2 |
| SKL-009 | Template picker skeleton | 1. Set network to Slow 3G 2. Open template picker in CreatePostTab | Skeleton template cards in grid layout while templates load from API. | P2 |
| SKL-010 | No spinners remain in app | 1. Search entire app for spinner/loading indicators 2. Trigger loading state on every tab | All loading states use skeleton components. No CSS spinner, no "Loading…" text, no circular progress indicators remain. | P1 |
| SKL-011 | Skeleton during tab switch | 1. Visit PostsTab (data cached) 2. Switch to Calendar (first visit) 3. Switch back to PostsTab | Calendar shows skeleton (no cache). PostsTab re-renders from cache (no skeleton). Lazy loading cache works correctly. | P1 |
| SKL-012 | Skeleton during pagination/infinite scroll | 1. PostsTab with 25+ posts 2. Scroll to bottom of first page 3. Next page loads | Skeleton post cards appear at bottom while next page loads. Blend seamlessly with existing posts above. | P2 |
| SKL-013 | Skeleton during pull-to-refresh (if supported) | 1. On tablet/mobile, pull-to-refresh on PostsTab | Content replaced with skeletons during refresh, then real content reappears. | P3 |
| SKL-014 | Skeleton during analytics date range change | 1. Change analytics date range filter (US-011) | Chart and metric cards show skeletons while new data loads. Previous data replaced, not overlaid. | P1 |

---

### 3.4 Skeleton Layout Matching

**Core requirement:** Skeleton dimensions must exactly match rendered content dimensions to achieve CLS = 0 (zero Cumulative Layout Shift).

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| SKL-L01 | PostsTab — card dimensions match | 1. Measure skeleton post card: width, height, padding, margin 2. Compare to rendered post card | Dimensions match exactly. Width: 100% of container. Height: matches card with title + 2 content lines + action bar. Padding/margin identical. | P0 |
| SKL-L02 | CalendarTab — grid cell dimensions match | 1. Measure skeleton calendar cell size 2. Compare to rendered calendar cell | Grid columns: exactly 7. Cell width: 1/7 of container. Cell height: matches rendered cells. | P0 |
| SKL-L03 | AnalyticsTab — metric card dimensions match | 1. Measure skeleton metric card 2. Compare to rendered metric card with data | Width, height, and spacing identical. Skeleton shows: title bar (h-4 w-24), value bar (h-8 w-16), trend bar (h-3 w-12). | P0 |
| SKL-L04 | AnalyticsTab — chart area dimensions match | 1. Measure skeleton chart placeholder 2. Compare to rendered chart | Width: 100% of container. Height: matches chart height (e.g., 300px). Aspect ratio preserved. | P1 |
| SKL-L05 | Dashboard — layout matches overall structure | 1. Capture skeleton layout (grid positions of all skeleton cards) 2. Compare to rendered dashboard | Same number of cards. Same grid positions. Same column spans. No content that "pops in" from off-grid. | P1 |
| SKL-L06 | PostsTab — skeleton count matches expected | 1. PostsTab shows 10 posts per page 2. Check skeleton count | Skeleton shows ~10 post card placeholders (matching expected page size). Not 1, not 100. | P1 |
| SKL-L07 | Responsive layout — skeleton adapts to viewport | 1. View PostsTab skeleton at 1920px 2. View at 1024px 3. View at 768px | Skeleton layout responds to viewport the same way content does: 3-column → 2-column → 1-column (or whatever the responsive breakpoints are). | P1 |
| SKL-L08 | Skeleton text line widths vary | 1. Inspect skeleton post card text lines | Lines have varying widths (e.g., line 1: 90%, line 2: 75%, line 3: 60%) to mimic natural text. Not all lines the same width. | P2 |

---

### 3.5 Animation & Visual Quality

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| SKL-AN01 | Shimmer animation plays | 1. Observe any skeleton component | Shimmer/pulse animation is playing. Gradient sweep moves left-to-right (or pulse opacity cycles). Animation is continuous, not one-shot. | P0 |
| SKL-AN02 | Shimmer uses theme-appropriate colors | 1. Inspect skeleton colors in light mode 2. Switch to dark mode (if supported) | Light mode: skeleton bars are `bg-muted` or equivalent gray (#e5e7eb → slightly lighter shimmer). Dark mode: appropriate dark gray with lighter shimmer pass. | P1 |
| SKL-AN03 | Animation performance — no jank | 1. Open DevTools Performance 2. Record during skeleton display (5 seconds) | Animation runs at 60fps. Uses CSS `animation` (GPU-accelerated), not JavaScript animation. No long tasks or layout thrashing. | P1 |
| SKL-AN04 | Shimmer direction consistency | 1. View PostsTab skeleton (multiple cards) 2. Observe shimmer on all cards | All skeleton elements shimmer in the same direction (left-to-right). Cards shimmer in unison or with intentional stagger (not random/chaotic). | P2 |
| SKL-AN05 | Skeleton corners match content corners | 1. Inspect skeleton card border-radius 2. Compare to rendered card | Border radius matches exactly. If cards use `rounded-lg` (8px), skeletons use `rounded-lg`. | P2 |
| SKL-AN06 | Skeleton respects spacing/gaps | 1. Inspect gap between skeleton cards 2. Compare to gap between rendered cards | Grid gap, margins, and padding match exactly between skeleton and content states. | P1 |
| SKL-AN07 | Reduced motion preference | 1. Enable "Prefers reduced motion" in OS settings 2. Observe skeletons | Animation stops or changes to a static muted state (no shimmer). Skeleton still visible as placeholder. Compliant with `prefers-reduced-motion: reduce`. | P2 |

---

### 3.6 Skeleton → Content Transition

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| SKL-T01 | Smooth transition (no flash) | 1. Set network to Medium (300ms) 2. Navigate to PostsTab 3. Observe skeleton → content | Content fades in or replaces skeleton smoothly. No white flash between skeleton and content. No "flicker" (skeleton disappears before content renders). | P0 |
| SKL-T02 | No layout shift during transition | 1. Measure CLS using DevTools Performance → Experience section 2. Navigate to PostsTab (skeleton → content) | CLS = 0. Page content does not shift vertically or horizontally during transition. Skeleton dimensions match content exactly. | P0 |
| SKL-T03 | Fast network — minimal skeleton display | 1. Set network to Fast (50ms latency) 2. Navigate to PostsTab | Either: (a) skeleton briefly visible (~50ms, acceptable), or (b) content renders directly (skeleton never shown — also acceptable). No skeleton "flash" that's distracting. | P1 |
| SKL-T04 | Slow network — skeleton persists until data loads | 1. Set network to Slow 3G 2. Navigate to PostsTab | Skeleton visible for entire loading duration (2–5s). Skeleton does NOT disappear before content is ready. No intermediate empty state. | P0 |
| SKL-T05 | Partial data load | 1. Analytics tab: metrics load before chart data 2. Observe | Metric skeletons → real metrics (transition). Chart skeleton persists until chart data loads. Independent loading per component. | P2 |
| SKL-T06 | Transition with images | 1. PostsTab posts include images 2. Observe skeleton → content | Image placeholders in skeleton. When content loads, text appears immediately. Images may lazy-load (separate from skeleton lifecycle). No broken image icons during transition. | P2 |
| SKL-T07 | Tab switch during skeleton loading | 1. Navigate to Calendar (skeleton shows) 2. Immediately switch to Posts tab 3. Switch back to Calendar | Calendar skeleton (or loaded content if fetch completed). No error. No zombie skeleton from interrupted load. AbortController cancels stale fetch if navigated away. | P1 |

---

### 3.7 Edge Cases & Error States

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| SKL-ER01 | Skeleton → Error boundary | 1. Mock API to return 500 for PostsTab data 2. Navigate to PostsTab | Skeleton displays → API fails → error boundary catches → shows error message: "Something went wrong. [Retry]". Skeleton replaced by error UI, not left hanging. | P1 |
| SKL-ER02 | Skeleton → Empty state | 1. Ensure PostsTab has 0 posts (clean state) 2. Navigate to PostsTab | Skeleton displays briefly → data returns (empty array) → skeleton replaced by empty state: "No posts yet. Create your first post!" No skeleton left visible. | P1 |
| SKL-ER03 | Skeleton during network timeout | 1. Simulate 30s network timeout 2. Navigate to PostsTab | Skeleton displays. After timeout threshold (e.g., 15s), show: "Taking longer than expected. [Retry] [Cancel]". Skeleton remains visible behind the message. | P2 |
| SKL-ER04 | Skeleton + error + retry | 1. API fails → error shown 2. Click "Retry" | Skeleton reappears during retry. If retry succeeds, content displays. If retry fails, error shown again. | P1 |
| SKL-ER05 | Multiple rapid tab switches | 1. Click PostsTab → CalendarTab → AnalyticsTab rapidly (within 1 second) | Only the final tab loads data. No race conditions. No skeleton from PostsTab bleeding into AnalyticsTab. Each tab has its own loading state. | P1 |
| SKL-ER06 | Browser back/forward during skeleton | 1. Navigate to PostsTab (skeleton showing) 2. Press browser Back | Navigation occurs cleanly. No skeleton frozen on screen. Previous page state restored. | P2 |

---

### 3.8 Accessibility

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| SKL-AC01 | `aria-busy="true"` during loading | 1. Inspect skeleton container element during load | Container has `aria-busy="true"`. Attribute removed when content loads. | P1 |
| SKL-AC02 | `aria-busy="false"` after loading | 1. Wait for content to load 2. Inspect container | `aria-busy="false"` or attribute removed entirely. | P1 |
| SKL-AC03 | Screen reader loading announcement | 1. Enable VoiceOver/NVDA 2. Navigate to a tab (skeleton loading) | Screen reader announces: "Loading content" or equivalent. Uses `aria-live="polite"` region or `role="status"`. | P2 |
| SKL-AC04 | Screen reader content loaded announcement | 1. Screen reader active 2. Wait for content to load | Announcement: "Content loaded" or equivalent after skeleton → content transition. | P2 |
| SKL-AC05 | Skeleton elements are inert | 1. Tab through skeleton during loading | Skeleton elements are NOT focusable. Tab key skips over skeleton bars. No interactive elements within skeleton. | P1 |
| SKL-AC06 | Focus after content loads | 1. Navigate to PostsTab via keyboard 2. Wait for skeleton → content | Focus is placed on a sensible element (first post card, tab header, or main content region). Not lost or trapped. | P2 |
| SKL-AC07 | Reduced motion — static skeleton | 1. Enable `prefers-reduced-motion: reduce` 2. View skeleton | Shimmer animation stopped. Skeleton visible as static gray placeholder. Loading state still conveyed visually and via ARIA. | P1 |

---

### 3.9 Performance Benchmarks

| ID | Metric | Target | Measurement | Priority |
|----|--------|--------|-------------|----------|
| SKL-PERF-01 | Skeleton render time (time to first paint) | < 100ms from navigation | DevTools Performance → First Contentful Paint of skeleton elements. Skeleton is the first meaningful content. | P0 |
| SKL-PERF-02 | Skeleton → Content CLS | 0 (zero) | Lighthouse CLS measurement on each tab. Measure across 5 consecutive loads. All must be 0. | P0 |
| SKL-PERF-03 | Shimmer animation FPS | 60fps (CSS-only, GPU-accelerated) | DevTools Performance recording during 5s of skeleton display. No dropped frames from animation. | P1 |
| SKL-PERF-04 | Skeleton JS bundle impact | < 5KB gzipped for skeleton component library | Check bundle analyzer for skeleton components. Should be lightweight CSS + minimal markup. | P2 |
| SKL-PERF-05 | Memory — no leak from repeated tab switches | < 2MB increase over 20 tab switches | DevTools Memory heap snapshot before and after switching between all tabs 20 times. | P2 |
| SKL-PERF-06 | Skeleton render with 0 network (cache hit) | < 50ms to content (skeleton may not appear) | Measure subsequent visit to cached tab. Content should render from cache nearly instantly. | P2 |

---

## 4. Cross-Feature Integration Tests (M3)

Tests validating interactions between M3 features and other Phase 2 features.

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| M3-INT-01 | Template → Preview renders immediately | 1. Apply a template 2. Check real-time preview | Preview shows template content within 100ms. All platform tabs render correctly. | P0 |
| M3-INT-02 | Draft auto-save → Skeleton on restore | 1. Create and auto-save a draft 2. Navigate away 3. Click draft in PostsTab (with throttled network) | Skeleton shows while draft data loads. Skeleton → content transition smooth. All draft fields restored. | P1 |
| M3-INT-03 | Template picker → Skeleton during load | 1. Open template picker (with throttled network) | Skeleton template cards show while templates load. Transition to real cards is smooth. | P1 |
| M3-INT-04 | Preview + Skeleton on tab init | 1. Navigate to CreatePostTab (with draft, throttled) | Editor skeleton + preview skeleton show independently. Each transitions to real content as its data loads. | P2 |
| M3-INT-05 | DnD media reorder → Preview updates → Draft saves | 1. Upload 3 images 2. Reorder via DnD (US-007) 3. Preview updates (US-012) 4. Wait for auto-save (US-013) 5. Restore draft | Entire chain works: reorder → preview shows new order → draft captures order → restore shows correct order. | P1 |
| M3-INT-06 | Bulk action → Skeleton refresh | 1. Bulk delete 5 posts from PostsTab 2. If data refetches | Skeleton appears during any refetch triggered by bulk action. Or optimistic removal with no skeleton (also acceptable). Behavior must be consistent. | P2 |
| M3-INT-07 | Analytics filter change → Skeleton → Content | 1. Change analytics date range (US-011) | Skeleton replaces current charts/metrics during data load. New data renders without layout shift. | P1 |
| M3-INT-08 | Calendar drag → Skeleton (if data refetches) | 1. Drag-reschedule a post on calendar 2. If calendar data refetches | Optimistic update preferred (no skeleton needed). If data must refetch, skeleton should NOT disrupt the user's drag context. | P2 |

---

## 5. Test Execution Checklist

### Pre-Test Setup
- [ ] Seed data script executed: `scripts/seed-phase2-test-data.ts`
- [ ] 5 templates created (Open House, Just Listed, Price Reduced, Market Update, Client Testimonial)
- [ ] 3 categories configured (Listings, Market, Social)
- [ ] 3 existing drafts available (media, text-only, all-fields)
- [ ] 4+ platform accounts connected
- [ ] DevTools throttle profiles configured (Fast, Medium, Slow 3G, Offline)
- [ ] Lighthouse/axe-core available for accessibility scans

### P2-Q007: Real-Time Post Preview

| Section | Test IDs | Count | Status |
|---------|----------|-------|--------|
| Core Preview | PRV-001 – PRV-013 | 13 | ☐ |
| Typing Speed | PRV-T01 – PRV-T10 | 10 | ☐ |
| Special Characters / XSS | PRV-S01 – PRV-S14 | 14 | ☐ |
| Emoji Rendering | PRV-E01 – PRV-E12 | 12 | ☐ |
| Platform Truncation | PRV-TR01 – PRV-TR18 | 18 | ☐ |
| Media in Preview | PRV-M01 – PRV-M06 | 6 | ☐ |
| Tablet | PRV-TB01 – PRV-TB03 | 3 | ☐ |
| Keyboard Accessibility | PRV-A01 – PRV-A05 | 5 | ☐ |
| Performance | PRV-PERF-01 – PRV-PERF-06 | 6 | ☐ |
| **P2-Q007 Total** | | **87** | ☐ |

### P2-Q008: Templates & Drafts

| Section | Test IDs | Count | Status |
|---------|----------|-------|--------|
| Template — Create | TPL-C01 – TPL-C10 | 10 | ☐ |
| Template — Use/Apply | TPL-U01 – TPL-U10 | 10 | ☐ |
| Template — Edit | TPL-E01 – TPL-E06 | 6 | ☐ |
| Template — Delete | TPL-D01 – TPL-D07 | 7 | ☐ |
| Template — Search/Categories | TPL-F01 – TPL-F10 | 10 | ☐ |
| Drafts — Auto-Save | DFT-AS01 – DFT-AS10 | 10 | ☐ |
| Drafts — Restore | DFT-R01 – DFT-R09 | 9 | ☐ |
| Drafts — Delete | DFT-D01 – DFT-D07 | 7 | ☐ |
| Drafts — Edge Cases | DFT-EC01 – DFT-EC08 | 8 | ☐ |
| Cross-Feature (T↔D↔P) | XF-TD01 – XF-TD05 | 5 | ☐ |
| Accessibility | TPL-A01 – TPL-A04, DFT-A01 – DFT-A02 | 6 | ☐ |
| Performance | TPL-PERF-01 – DFT-PERF-03 | 7 | ☐ |
| **P2-Q008 Total** | | **95** | ☐ |

### P2-Q009: Loading Skeletons

| Section | Test IDs | Count | Status |
|---------|----------|-------|--------|
| Skeleton Visibility | SKL-001 – SKL-014 | 14 | ☐ |
| Layout Matching | SKL-L01 – SKL-L08 | 8 | ☐ |
| Animation & Visual | SKL-AN01 – SKL-AN07 | 7 | ☐ |
| Skeleton → Content Transition | SKL-T01 – SKL-T07 | 7 | ☐ |
| Edge Cases & Errors | SKL-ER01 – SKL-ER06 | 6 | ☐ |
| Accessibility | SKL-AC01 – SKL-AC07 | 7 | ☐ |
| Performance | SKL-PERF-01 – SKL-PERF-06 | 6 | ☐ |
| **P2-Q009 Total** | | **55** | ☐ |

### M3 Cross-Feature Integration

| Test IDs | Count | Status |
|----------|-------|--------|
| M3-INT-01 – M3-INT-08 | 8 | ☐ |

### Grand Total

| Task | Test Count |
|------|-----------|
| P2-Q007 (Preview) | 87 |
| P2-Q008 (Templates & Drafts) | 95 |
| P2-Q009 (Skeletons) | 55 |
| M3 Integration | 8 |
| **Total M3 Test Cases** | **245** |

### Exit Criteria (M3 Complete)

- [ ] All P0 tests pass (0 failures)
- [ ] All P1 tests pass (0 failures)
- [ ] P2 tests: ≤ 3 open defects (none blocking)
- [ ] P3 tests: documented, not blocking release
- [ ] Performance benchmarks met (all P0/P1 metrics green)
- [ ] Accessibility scan (axe-core): 0 critical/serious violations on new components
- [ ] CLS = 0 on all tabs during skeleton → content transition
- [ ] No remaining CSS spinners or "Loading…" text in the application

---

*End of Phase 2 — Milestone 3 Test Specifications — P2-Q007, P2-Q008, P2-Q009*
