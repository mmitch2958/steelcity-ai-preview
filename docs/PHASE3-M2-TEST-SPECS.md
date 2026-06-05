# Phase 3 — Milestone 2 Test Specifications
**Project:** SMP-2026-Q1 — Social Media Platform  
**Phase:** 3 (Advanced Features — "Level Up")  
**Milestone:** M2 — Analytics Dashboard + AI Predictions  
**QA Tasks Covered:** P3-Q005, P3-Q006, P3-Q007  
**Author:** QA Department (automated)  
**Created:** 2026-03-05  
**Status:** DRAFT

---

## Table of Contents
1. [P3-Q005 — Hashtag Analytics Dashboard Testing](#p3-q005--hashtag-analytics-dashboard-testing)
2. [P3-Q006 — AI Prediction Engine Testing](#p3-q006--ai-prediction-engine-testing)
3. [P3-Q007 — Email Notification Testing](#p3-q007--email-notification-testing)
4. [Appendices](#appendices)

---

## Prerequisites (All Sections)

- Phase 3 M1 test seed data loaded (see [PHASE3-M1-TEST-SPECS.md](./PHASE3-M1-TEST-SPECS.md) §1.2)
- 3 clients (ClientA, ClientB, ClientC), each with 20+ published posts spanning 60 days
- 15+ distinct hashtags per client with backfilled `social_hashtag_metrics` data
- `prediction_records` table migrated and empty (will be populated during tests)
- `notification_preferences` table migrated with default preferences (all email ON)
- Test SMTP server (Ethereal or Mailhog) running and capturing emails
- Approval configs: ClientA (1-level), ClientB (2-level), ClientC (none)

---

## P3-Q005 — Hashtag Analytics Dashboard Testing

**User Story:** US-017 (Hashtag Performance Tracking)  
**Build Dependencies:** P3-B008 (schema + API), P3-B009 (dashboard UI), P3-B010 (suggestions engine)  
**Design Spec:** P3-D002

---

### TC-HD-001: Dashboard Loads and Displays Metrics Correctly
| Field | Value |
|-------|-------|
| **ID** | TC-HD-001 |
| **User Story** | US-017 |
| **Priority** | P0 |
| **Type** | E2E |
| **Preconditions** | Logged in as admin. ClientA has 15+ hashtags with backfilled `social_hashtag_metrics` data spanning 60 days. At least 5 hashtags have >100 total impressions. |
| **Steps** | 1. Navigate to AnalyticsTab. <br>2. Click "Hashtags" sub-tab/section. <br>3. Observe the hashtag analytics dashboard. |
| **Expected Result** | • Dashboard loads within 1 second. <br>• Top hashtags table is visible with columns: Hashtag, Impressions, Reach, Engagement Rate, Sparkline. <br>• Hashtags are sorted by engagement rate (descending) by default. <br>• Each row shows numeric values formatted with commas for thousands (e.g., "12,450"). <br>• Engagement rate displayed as percentage (e.g., "3.2%"). <br>• `GET /api/admin/social/analytics/hashtags` returns 200 with paginated array. <br>• Summary cards above the table show: Total Hashtags Tracked, Avg Engagement Rate, Top Performer (hashtag name + rate). |

---

### TC-HD-002: Column Header Sorting
| Field | Value |
|-------|-------|
| **ID** | TC-HD-002 |
| **User Story** | US-017 |
| **Priority** | P0 |
| **Type** | Component |
| **Preconditions** | TC-HD-001 completed. Dashboard is loaded with data. |
| **Steps** | 1. Click "Impressions" column header. <br>2. Observe sort order. <br>3. Click "Impressions" column header again. <br>4. Click "Reach" column header. <br>5. Click "Engagement Rate" column header. |
| **Expected Result** | • First click on "Impressions": table sorts by impressions descending (▼ indicator visible). <br>• Second click: toggles to ascending (▲ indicator). <br>• Click on "Reach": sorts by reach descending, previous sort indicator clears. <br>• Click on "Engagement Rate": sorts by engagement rate descending. <br>• Sort indicator icon visible on active column. <br>• Sort is applied client-side for current page; if server-side, `GET /api/.../hashtags?sort=impressions&order=desc` includes sort params. <br>• Keyboard accessible: sort headers focusable and activatable via Enter/Space. |

---

### TC-HD-003: Date Range Filter Changes Metrics
| Field | Value |
|-------|-------|
| **ID** | TC-HD-003 |
| **User Story** | US-017 |
| **Priority** | P0 |
| **Type** | Integration |
| **Preconditions** | Dashboard loaded. ClientA has hashtag data spanning 60 days. Date range picker from Phase 2 (US-011) is available. |
| **Steps** | 1. Note current default date range (e.g., "Last 30 days") and record top hashtag + impressions. <br>2. Change date range to "Last 7 days" using the date range picker. <br>3. Observe updated metrics. <br>4. Change date range to "Last 60 days". <br>5. Observe updated metrics. <br>6. Set a custom date range (e.g., specific two-week window). |
| **Expected Result** | • Changing to "Last 7 days": impressions and reach values decrease (fewer data points). <br>• Changing to "Last 60 days": values increase (more data aggregated). <br>• Custom date range: metrics reflect only the selected window. <br>• API calls include date range params: `GET /api/.../hashtags?from=2026-02-03&to=2026-03-05`. <br>• Table re-sorts with updated values. <br>• Loading indicator shown briefly during data fetch. <br>• Summary cards update to reflect new date range. <br>• If no data exists in selected range, empty state is shown (see TC-HD-008). |

---

### TC-HD-004: Pagination Works Correctly
| Field | Value |
|-------|-------|
| **ID** | TC-HD-004 |
| **User Story** | US-017 |
| **Priority** | P0 |
| **Type** | Component |
| **Preconditions** | ClientA has 15+ hashtags. Default page size is 10 (or configurable). |
| **Steps** | 1. Load hashtag dashboard. <br>2. Observe page 1 (first 10 hashtags). <br>3. Click "Next" or page 2 button. <br>4. Observe page 2 results. <br>5. Click "Previous" to return to page 1. |
| **Expected Result** | • Page 1 shows first 10 hashtags (sorted by default). <br>• Pagination controls visible below table: page number, next/previous buttons. <br>• "Showing 1-10 of N" text displays total count. <br>• Page 2 shows hashtags 11-N (no duplicates from page 1). <br>• API includes pagination: `GET /api/.../hashtags?page=2&limit=10`. <br>• Previous button disabled on page 1; Next disabled on last page. <br>• Sorting persists across pagination (same sort order on all pages). |

---

### TC-HD-005: Sparkline Mini-Charts Render
| Field | Value |
|-------|-------|
| **ID** | TC-HD-005 |
| **User Story** | US-017 |
| **Priority** | P1 |
| **Type** | Component |
| **Preconditions** | Dashboard loaded with hashtag data spanning at least 14 days. |
| **Steps** | 1. Observe the sparkline column in the hashtag table. <br>2. Compare sparkline shape for a hashtag with known increasing engagement vs. one with decreasing. <br>3. Hover over a sparkline (if tooltip is implemented). |
| **Expected Result** | • Each hashtag row has a small sparkline chart (~80px wide × 24px tall) in the rightmost column. <br>• Sparkline shows engagement trend over the current date range. <br>• Upward-trending sparkline rendered in green tint; downward in red tint (or neutral gray). <br>• Sparklines render as SVG or canvas elements (Recharts `<Sparkline>` or similar). <br>• No sparkline overflow or clipping — contained within table cell. <br>• A hashtag with only 1 data point shows a flat line or single dot. <br>• A hashtag with 0 data points in range shows a dash or "—" placeholder. <br>• Hover tooltip (if implemented) shows the date and value of the nearest data point. |

---

### TC-HD-006: Selecting a Hashtag Shows Time-Series Chart
| Field | Value |
|-------|-------|
| **ID** | TC-HD-006 |
| **User Story** | US-017 |
| **Priority** | P0 |
| **Type** | E2E |
| **Preconditions** | Dashboard loaded. Hashtag "#SteelCity" has daily data for 30+ days. |
| **Steps** | 1. Click on "#SteelCity" row in the hashtag table (or click a "View Details" button). <br>2. Observe the time-series chart that appears. |
| **Expected Result** | • A Recharts `<LineChart>` appears below or beside the table. <br>• X-axis: dates (daily granularity). Y-axis: impressions or engagement rate. <br>• Line connects daily data points for "#SteelCity". <br>• Chart title shows the selected hashtag name. <br>• `GET /api/.../analytics/hashtags/SteelCity/timeseries?from=...&to=...` returns daily data points. <br>• Each data point is interactive (hover shows tooltip with date + exact value). <br>• Chart respects the current date range filter. <br>• If chart area is empty before selection, a placeholder message reads "Select a hashtag to view trends". |

---

### TC-HD-007: Multi-Hashtag Comparison
| Field | Value |
|-------|-------|
| **ID** | TC-HD-007 |
| **User Story** | US-017 |
| **Priority** | P1 |
| **Type** | Component |
| **Preconditions** | Dashboard loaded. At least 4 hashtags have time-series data. |
| **Steps** | 1. Select "#SteelCity" for comparison (checkbox or multi-select in table). <br>2. Select "#Pittsburgh" as second hashtag. <br>3. Select "#AIMarketing" as third. <br>4. Select "#SmallBusiness" as fourth. <br>5. Attempt to select a fifth hashtag. |
| **Expected Result** | • Time-series chart renders 4 distinct colored lines, one per selected hashtag. <br>• Chart legend shows hashtag names with matching line colors. <br>• Colors are visually distinct (e.g., blue, red, green, orange — from P3-D002 palette). <br>• Fifth selection is blocked with tooltip: "Maximum 4 hashtags for comparison". <br>• Deselecting a hashtag removes its line from the chart. <br>• Y-axis auto-scales to accommodate all selected hashtags' value ranges. |

---

### TC-HD-008: Empty State — No Hashtag Data
| Field | Value |
|-------|-------|
| **ID** | TC-HD-008 |
| **User Story** | US-017 |
| **Priority** | P0 |
| **Type** | Component |
| **Preconditions** | ClientC has no posts with hashtags (or no `social_hashtag_metrics` records). |
| **Steps** | 1. Switch to ClientC context (admin client filter or portal login). <br>2. Navigate to Hashtags dashboard. |
| **Expected Result** | • Table is replaced by an empty state illustration/message. <br>• Message reads: "No hashtag data yet" with subtext: "Start using hashtags in your posts to see performance analytics here." <br>• No JavaScript errors in console. <br>• Summary cards show "0" or "—" values (not NaN or undefined). <br>• Date range picker still functional (changing range still shows empty state). |

---

### TC-HD-009: Portal User Sees Only Their Client's Data
| Field | Value |
|-------|-------|
| **ID** | TC-HD-009 |
| **User Story** | US-017 |
| **Priority** | P0 |
| **Type** | Integration |
| **Preconditions** | Portal user logged in for ClientA. ClientA and ClientB both have hashtag data. |
| **Steps** | 1. Navigate to Hashtags dashboard as ClientA portal user. <br>2. Inspect API response for `GET /api/portal/social/analytics/hashtags`. |
| **Expected Result** | • Only ClientA's hashtag metrics are displayed. <br>• API response does not include any data belonging to ClientB or ClientC. <br>• No client filter dropdown visible (portal users see their own client only). <br>• `GET /api/portal/social/analytics/hashtags` filters server-side by authenticated user's `clientId`. |

---

### TC-HD-010: Admin Can Filter Hashtag Data by Client
| Field | Value |
|-------|-------|
| **ID** | TC-HD-010 |
| **User Story** | US-017 |
| **Priority** | P1 |
| **Type** | Component |
| **Preconditions** | Admin user logged in. Multiple clients have hashtag data. |
| **Steps** | 1. Load Hashtags dashboard (shows aggregate or default client). <br>2. Select "ClientA" from client filter dropdown. <br>3. Observe metrics update. <br>4. Select "ClientB". <br>5. Select "All Clients" (if available). |
| **Expected Result** | • Client filter dropdown is visible for admin users. <br>• Selecting ClientA shows only ClientA's hashtag data. <br>• Selecting ClientB shows only ClientB's data — values differ from ClientA. <br>• "All Clients" (if supported) shows aggregated data across all clients. <br>• API includes client filter: `GET /api/admin/social/analytics/hashtags?clientId=clientA-id`. <br>• Sparklines and summary cards update per selected client. |

---

### TC-HD-011: Hashtag with Special Characters Displays Correctly
| Field | Value |
|-------|-------|
| **ID** | TC-HD-011 |
| **User Story** | US-017 |
| **Priority** | P2 |
| **Type** | Component |
| **Preconditions** | Seed data includes hashtags: "#CaféVibes", "#日本語", "#🔥Hot", "#São-Paulo". |
| **Steps** | 1. Load Hashtags dashboard. <br>2. Locate special-character hashtags in the table. <br>3. Click on one to view its time-series chart. |
| **Expected Result** | • All special-character hashtags display correctly (no mojibake, no encoding issues). <br>• Table text renders accented characters, CJK characters, and emoji. <br>• Emoji renders inline with text (not as a placeholder box). <br>• Time-series API call URL-encodes the hashtag: `GET /api/.../hashtags/%23%F0%9F%94%A5Hot/timeseries`. <br>• Chart title displays the hashtag with correct characters. |

---

### TC-HD-012: Large Dataset Performance
| Field | Value |
|-------|-------|
| **ID** | TC-HD-012 |
| **User Story** | US-017 |
| **Priority** | P2 |
| **Type** | Performance |
| **Preconditions** | Seed data includes 1000+ distinct hashtags for a test client, with `social_hashtag_metrics` records. |
| **Steps** | 1. Load Hashtags dashboard for the test client. <br>2. Measure time to first render. <br>3. Sort by different columns. <br>4. Paginate through pages. |
| **Expected Result** | • Initial table load (page 1, 10 rows) completes within 1 second. <br>• Sorting triggers data refetch within 500ms. <br>• Pagination responds within 500ms. <br>• No visible jank, scroll stutter, or UI blocking. <br>• API uses `LIMIT`/`OFFSET` (not fetching all 1000 rows at once). <br>• Browser memory usage remains stable (no memory leak from sparkline rendering). |

---

### TC-HD-013: Hashtag API Returns Correct Schema
| Field | Value |
|-------|-------|
| **ID** | TC-HD-013 |
| **User Story** | US-017 |
| **Priority** | P0 |
| **Type** | Integration |
| **Preconditions** | At least 5 hashtags with metrics exist in the database. |
| **Steps** | 1. Call `GET /api/admin/social/analytics/hashtags?page=1&limit=10&sort=engagementRate&order=desc`. <br>2. Validate the response schema. |
| **Expected Result** | • Response status 200. <br>• Response body matches schema: <br>```json
{
  "hashtags": [
    {
      "hashtag": "#SteelCity",
      "totalImpressions": 45230,
      "totalReach": 32100,
      "avgEngagementRate": 3.24,
      "totalClicks": 1240,
      "totalSaves": 580,
      "postCount": 12,
      "sparklineData": [1.2, 2.4, 3.1, ...],
      "platforms": ["instagram", "facebook"]
    }
  ],
  "total": 47,
  "page": 1,
  "limit": 10
}
``` <br>• `totalImpressions`, `totalReach`, `totalClicks`, `totalSaves` are non-negative integers. <br>• `avgEngagementRate` is a numeric (up to 4 decimal places). <br>• `sparklineData` is an array of numbers representing daily values for current date range. <br>• `total` reflects the full count (for pagination math). |

---

### TC-HD-014: Time-Series API Returns Daily Data Points
| Field | Value |
|-------|-------|
| **ID** | TC-HD-014 |
| **User Story** | US-017 |
| **Priority** | P0 |
| **Type** | Integration |
| **Preconditions** | Hashtag "#SteelCity" has 30 days of `social_hashtag_metrics` records. |
| **Steps** | 1. Call `GET /api/admin/social/analytics/hashtags/SteelCity/timeseries?from=2026-02-03&to=2026-03-05`. <br>2. Validate response. |
| **Expected Result** | • Response status 200. <br>• Response body: <br>```json
{
  "hashtag": "#SteelCity",
  "dataPoints": [
    { "date": "2026-02-03", "impressions": 450, "reach": 320, "engagementRate": 2.8, "clicks": 12, "saves": 5 },
    { "date": "2026-02-04", "impressions": 520, ... },
    ...
  ],
  "granularity": "daily"
}
``` <br>• Number of `dataPoints` matches the number of days in range (30 days = 30 entries). <br>• Days with no data return 0 values (no gaps in time-series). <br>• Data points are sorted chronologically (ascending date). <br>• All numeric fields are non-negative. |

---

### TC-HD-015: Multi-Platform Aggregation
| Field | Value |
|-------|-------|
| **ID** | TC-HD-015 |
| **User Story** | US-017 |
| **Priority** | P1 |
| **Type** | Integration |
| **Preconditions** | Hashtag "#AIMarketing" is used in posts published to both Instagram and Facebook. Separate `social_hashtag_metrics` rows exist per platform. |
| **Steps** | 1. Load Hashtags dashboard. <br>2. Locate "#AIMarketing" in the table. <br>3. Verify impressions = sum of Instagram impressions + Facebook impressions. |
| **Expected Result** | • The table row for "#AIMarketing" shows aggregated (summed) impressions and reach across platforms. <br>• `avgEngagementRate` is a weighted average (total engagements / total impressions × 100). <br>• `platforms` array in API response lists both "instagram" and "facebook". <br>• When viewing time-series, the chart shows the combined daily values. <br>• No double-counting: each `social_hashtag_metrics` row contributes once. |

---

## P3-Q006 — AI Prediction Engine Testing

**User Story:** US-018 (Post Performance Predictions)  
**Build Dependencies:** P3-B011 (scoring engine), P3-B012 (prediction UI), P3-B013 (suggestions), P3-B014 (accuracy tracker)  
**Design Spec:** P3-D003

---

### TC-PE-001: Prediction API Returns Valid 0-100 Score
| Field | Value |
|-------|-------|
| **ID** | TC-PE-001 |
| **User Story** | US-018 |
| **Priority** | P0 |
| **Type** | Integration |
| **Preconditions** | Prediction engine (P3-B011) deployed. ClientA has 20+ published posts with engagement data (sufficient for historical baseline). |
| **Steps** | 1. Call `POST /api/admin/social/ai/predict-performance` with body: <br>```json
{
  "content": "Check out our latest AI-powered marketing tool! 🚀 Transform your business today. #AIMarketing #SmallBusiness",
  "platforms": ["instagram", "facebook"],
  "hashtags": ["#AIMarketing", "#SmallBusiness"],
  "mediaUrls": ["https://example.com/image.jpg"],
  "scheduledAt": "2026-03-10T14:00:00Z"
}
``` <br>2. Validate the response. |
| **Expected Result** | • Response status 200. <br>• Response body matches schema: <br>```json
{
  "score": 72,
  "confidence": 0.85,
  "factors": [
    { "name": "Time of Day", "impact": "positive", "value": 8.5, "suggestion": null },
    { "name": "Content Quality", "impact": "positive", "value": 7.2, "suggestion": "Consider adding a question to boost engagement" },
    { "name": "Hashtag Strength", "impact": "neutral", "value": 5.0, "suggestion": "Try using #PittsburghBusiness for higher local reach" },
    { "name": "Media Presence", "impact": "positive", "value": 8.0, "suggestion": null },
    { "name": "Historical Performance", "impact": "positive", "value": 6.8, "suggestion": null }
  ]
}
``` <br>• `score` is an integer between 0 and 100 inclusive. <br>• `confidence` is a number between 0.0 and 1.0. <br>• `factors` is an array with 5 entries (matching scoring weight categories). <br>• Each factor has `name` (string), `impact` (one of "positive" / "negative" / "neutral"), `value` (number 0-10), and optional `suggestion` (string or null). <br>• Response time < 2 seconds. |

---

### TC-PE-002: Score Breakdown Matches Weighted Formula
| Field | Value |
|-------|-------|
| **ID** | TC-PE-002 |
| **User Story** | US-018 |
| **Priority** | P0 |
| **Type** | Unit |
| **Preconditions** | Scoring weights defined: time-of-day (20%), content quality (25%), hashtag strength (15%), media (20%), historical (20%). Mock historical data provides deterministic baseline. |
| **Steps** | 1. Call prediction API with identical inputs twice. <br>2. Calculate expected score: `(timeScore × 0.20 + contentScore × 0.25 + hashtagScore × 0.15 + mediaScore × 0.20 + historicalScore × 0.20) × 10`. <br>3. Compare API score with manual calculation. |
| **Expected Result** | • Two identical calls return the same score (deterministic for same inputs + same historical data). <br>• The composite score matches the weighted formula within ±1 point (rounding tolerance). <br>• Individual factor `value` fields (0-10 scale) correspond to the sub-scores used in the formula. <br>• Composite score scaled to 0-100 range: `(weighted_sum / 10) × 100`. |

---

### TC-PE-003: Confidence Calculation Based on Data Volume
| Field | Value |
|-------|-------|
| **ID** | TC-PE-003 |
| **User Story** | US-018 |
| **Priority** | P0 |
| **Type** | Integration |
| **Preconditions** | ClientA has 50+ published posts. ClientC has 0 published posts (new client). |
| **Steps** | 1. Request prediction for ClientA post content. Record `confidence`. <br>2. Request prediction for ClientC post content (identical text, different client context). Record `confidence`. <br>3. Compare confidence values. |
| **Expected Result** | • ClientA prediction has higher confidence (e.g., 0.75-0.95) due to rich historical data. <br>• ClientC prediction has lower confidence (e.g., 0.10-0.40) due to zero historical data. <br>• Confidence is clamped between 0.0 and 1.0 (never negative, never >1). <br>• Confidence is a continuous value (not just 3 buckets). <br>• Response for ClientC includes a `lowConfidence: true` flag or equivalent indicator. |

---

### TC-PE-004: Score Displays in CreatePostTab
| Field | Value |
|-------|-------|
| **ID** | TC-PE-004 |
| **User Story** | US-018 |
| **Priority** | P0 |
| **Type** | E2E |
| **Preconditions** | Feature flag for predictions is enabled. Logged in as admin with ClientA selected. |
| **Steps** | 1. Navigate to CreatePostTab. <br>2. Enter content: "Check out our new product launch! 🚀 #NewProduct". <br>3. Select platforms: Instagram, Facebook. <br>4. Observe the prediction panel. |
| **Expected Result** | • Prediction panel appears in right sidebar (desktop) or collapsible bottom section (mobile). <br>• After a brief loading state (skeleton/spinner), score is displayed. <br>• Score rendered as a circular gauge or horizontal bar per P3-D003. <br>• Color matches range: red (0-30), yellow (31-60), green (61-100). <br>• Numeric score displayed prominently (e.g., "72/100" or "72"). <br>• Factor breakdown list visible below the score gauge. <br>• Each factor shows name, impact indicator (↑ positive / ↓ negative / — neutral), and sub-score. |

---

### TC-PE-005: Score Updates on Content Change (Debounced)
| Field | Value |
|-------|-------|
| **ID** | TC-PE-005 |
| **User Story** | US-018 |
| **Priority** | P0 |
| **Type** | Component |
| **Preconditions** | CreatePostTab open with prediction panel visible. Initial score displayed. |
| **Steps** | 1. Record current score (e.g., 72). <br>2. Clear the content and type: "Buy now." (very short, no hashtags, no media). <br>3. Wait 500ms+ for debounce to fire. <br>4. Observe score update. <br>5. Add a media image attachment. <br>6. Wait for score update. |
| **Expected Result** | • Score does NOT update while actively typing (500ms debounce). <br>• After 500ms pause, prediction API is called with new content. <br>• New score reflects poorer content quality (shorter content, no hashtags → lower score). <br>• Adding media triggers another prediction update after debounce → score improves (media factor goes positive). <br>• Previous in-flight prediction requests are cancelled (no stale results appearing). <br>• UI shows a subtle loading indicator during score recalculation (not a full skeleton—minimal flicker). |

---

### TC-PE-006: Rapid Typing Cancels Previous Requests
| Field | Value |
|-------|-------|
| **ID** | TC-PE-006 |
| **User Story** | US-018 |
| **Priority** | P1 |
| **Type** | Integration |
| **Preconditions** | CreatePostTab open. Network throttled to 1s latency. |
| **Steps** | 1. Type "Hello" — wait 300ms. <br>2. Type " World" — wait 300ms. <br>3. Type " again" — wait 600ms (debounce fires). <br>4. Observe network requests and displayed score. |
| **Expected Result** | • Only ONE prediction API request is in-flight at any given time. <br>• Previous requests are aborted (AbortController or similar). <br>• Final displayed score matches the prediction for "Hello World again" — not an intermediate string. <br>• No flashing of stale intermediate scores. <br>• Browser DevTools Network tab shows cancelled/aborted requests for intermediate inputs. |

---

### TC-PE-007: Empty Content — Graceful Empty State
| Field | Value |
|-------|-------|
| **ID** | TC-PE-007 |
| **User Story** | US-018 |
| **Priority** | P0 |
| **Type** | Component |
| **Preconditions** | CreatePostTab open with empty content field. |
| **Steps** | 1. Observe prediction panel with empty content. <br>2. Enter content, see score appear. <br>3. Clear all content. <br>4. Observe prediction panel. |
| **Expected Result** | • With empty content: no score displayed. <br>• Message shown: "Start writing to see your predicted engagement score" or similar placeholder. <br>• No API call made for empty content (skip prediction). <br>• Score gauge is in an inactive/dimmed state (not showing "0"). <br>• After clearing content, panel smoothly transitions back to empty state. <br>• No error toast or console error. |

---

### TC-PE-008: Very Long Content (5000+ chars) Doesn't Break API
| Field | Value |
|-------|-------|
| **ID** | TC-PE-008 |
| **User Story** | US-018 |
| **Priority** | P1 |
| **Type** | Integration |
| **Preconditions** | Prediction API deployed. |
| **Steps** | 1. Call `POST /api/admin/social/ai/predict-performance` with content = 5000+ character string (lorem ipsum or realistic long post). <br>2. Observe response. |
| **Expected Result** | • API returns 200 (not 413 Payload Too Large). <br>• Score returned is valid (0-100). <br>• Content quality factor may score lower if platform best practices suggest shorter content. <br>• Response time remains < 3 seconds (slightly longer acceptable for very long content). <br>• No server crash or timeout. |

---

### TC-PE-009: Prediction with Zero Historical Data — Low-Confidence Warning
| Field | Value |
|-------|-------|
| **ID** | TC-PE-009 |
| **User Story** | US-018 |
| **Priority** | P0 |
| **Type** | Component |
| **Preconditions** | New client with 0 published posts (no historical engagement data). Feature flag enabled. |
| **Steps** | 1. Navigate to CreatePostTab for the new client. <br>2. Enter post content. <br>3. Observe prediction panel. |
| **Expected Result** | • Score is still returned (heuristic works without history, per risk mitigation). <br>• Confidence value is low (< 0.40). <br>• UI displays a visible warning: "⚠️ Limited data — prediction confidence is low" or similar. <br>• Warning styled per P3-D003 low-confidence indicator (amber badge or info banner). <br>• Historical performance factor shows "neutral" impact with value ~5.0 (baseline/unknown). <br>• Score is conservative (tends toward middle range, not extreme). |

---

### TC-PE-010: Prediction Score Stored on Publish
| Field | Value |
|-------|-------|
| **ID** | TC-PE-010 |
| **User Story** | US-018 |
| **Priority** | P0 |
| **Type** | Integration |
| **Preconditions** | Post created with prediction score visible. Prediction displayed score = 72, confidence = 0.85. |
| **Steps** | 1. Create a post with content, hashtags, media. <br>2. Observe prediction score (72). <br>3. Publish the post (directly or via schedule → auto-publish). <br>4. Query `prediction_records` table for the published post ID. |
| **Expected Result** | • `prediction_records` row created with: <br>  - `postId` = the published post's ID <br>  - `predictedScore` = 72.00 <br>  - `confidence` = 0.85 <br>  - `factors` = JSON array of the factor breakdown at time of publish <br>  - `actualScore` = NULL (not yet measured) <br>  - `actualMeasuredAt` = NULL <br>  - `predictedAt` = timestamp within seconds of publish action <br>• Only one `prediction_records` row per post publish (no duplicates from draft saves). |

---

### TC-PE-011: Accuracy Calculation at 48h Post-Publish
| Field | Value |
|-------|-------|
| **ID** | TC-PE-011 |
| **User Story** | US-018 |
| **Priority** | P1 |
| **Type** | Integration |
| **Preconditions** | A post was published 48+ hours ago with a prediction record. Post has engagement data (impressions, clicks, etc.) in `social_posts.engagement`. |
| **Steps** | 1. Trigger accuracy calculation (via cron job or manual API call). <br>2. Query `prediction_records` for the post. |
| **Expected Result** | • `actualScore` is now populated (0-100, using same normalization as predicted score). <br>• `actualMeasuredAt` is set to the measurement timestamp. <br>• `actualScore` is calculated from real engagement data: normalized engagement metrics → 0-100 scale. <br>• Post with high engagement gets higher `actualScore`; low engagement gets lower. <br>• Accuracy = |predictedScore - actualScore|. Lower delta = more accurate. |

---

### TC-PE-012: Accuracy Dashboard Displays Metrics
| Field | Value |
|-------|-------|
| **ID** | TC-PE-012 |
| **User Story** | US-018 |
| **Priority** | P1 |
| **Type** | E2E |
| **Preconditions** | At least 10 posts have both `predictedScore` and `actualScore` in `prediction_records`. |
| **Steps** | 1. Navigate to AnalyticsTab. <br>2. Locate "Prediction Accuracy" card/section. <br>3. Observe the displayed metrics. |
| **Expected Result** | • `GET /api/admin/social/ai/prediction-accuracy` returns 200. <br>• Response includes: `avgError` (average |predicted - actual|), `predictionCount` (total predictions with actuals), `recentAccuracy` (array of recent accuracy data points). <br>• UI shows: <br>  - Overall accuracy percentage (e.g., "78% accurate" where accuracy = 100 - avgError). <br>  - Prediction count badge (e.g., "Based on 42 predictions"). <br>  - Trend line chart (accuracy % over time — last 30 days). <br>  - Scatter plot: X = predicted score, Y = actual score. Diagonal line = perfect accuracy. Dots above/below show over/under-prediction. <br>• Chart renders using Recharts components. |

---

### TC-PE-013: Post with Zero Engagement — Accuracy Edge Case
| Field | Value |
|-------|-------|
| **ID** | TC-PE-013 |
| **User Story** | US-018 |
| **Priority** | P2 |
| **Type** | Integration |
| **Preconditions** | A published post has `engagement: {}` or `engagement: null` (zero engagement recorded). A prediction record exists for this post with `predictedScore` = 65. |
| **Steps** | 1. Trigger accuracy calculation for this post. <br>2. Check `prediction_records` entry. |
| **Expected Result** | • `actualScore` is set to 0 (not null, not NaN). <br>• Accuracy calculation treats it as valid data: error = |65 - 0| = 65. <br>• No division-by-zero errors in normalization. <br>• This data point is included in overall accuracy metrics (not silently excluded). <br>• Scatter plot shows this as a dot at (65, 0) — clearly an over-prediction. |

---

### TC-PE-014: Old Predictions Don't Skew Recent Accuracy
| Field | Value |
|-------|-------|
| **ID** | TC-PE-014 |
| **User Story** | US-018 |
| **Priority** | P2 |
| **Type** | Integration |
| **Preconditions** | Prediction records exist spanning 120 days. Some very old predictions (>90 days) have high error rates. Recent predictions (last 30 days) are more accurate. |
| **Steps** | 1. Call `GET /api/admin/social/ai/prediction-accuracy`. <br>2. Examine the `recentAccuracy` array and `avgError`. |
| **Expected Result** | • `avgError` uses a rolling window (last 90 days default, configurable). <br>• OR: `avgError` uses weighted average with exponential decay (recent predictions weighted more heavily). <br>• `recentAccuracy` array only includes data from the accuracy window. <br>• Old predictions (>90 days) are excluded from the displayed accuracy or weighted very low. <br>• API supports optional `?window=30d` parameter to customize the accuracy window. |

---

### TC-PE-015: Improvement Suggestions Display
| Field | Value |
|-------|-------|
| **ID** | TC-PE-015 |
| **User Story** | US-018 |
| **Priority** | P1 |
| **Type** | Component |
| **Preconditions** | CreatePostTab open. Post content entered without media and with suboptimal posting time. Prediction score displayed. |
| **Steps** | 1. Observe the improvement suggestions section of the prediction panel. |
| **Expected Result** | • Suggestions rendered as actionable cards below the factor breakdown. <br>• Each card shows: icon, title (e.g., "Add an Image"), description (e.g., "Posts with images get 2.3x more engagement"), and an "Apply" button. <br>• Suggestions are ranked by potential score impact (highest improvement first). <br>• Each suggestion shows a "+N" badge indicating estimated score increase if applied. <br>• Suggestion types may include: "Add Media", "Change Posting Time", "Add Hashtags", "Shorten Content", "Add a CTA", "Add Emoji". |

---

### TC-PE-016: Clicking Suggestion "Add Media" Opens Uploader
| Field | Value |
|-------|-------|
| **ID** | TC-PE-016 |
| **User Story** | US-018 |
| **Priority** | P1 |
| **Type** | E2E |
| **Preconditions** | Prediction panel showing "Add Media" suggestion. No media attached to current post. |
| **Steps** | 1. Click "Apply" on the "Add Media" suggestion card. <br>2. Observe the media uploader behavior. |
| **Expected Result** | • Media uploader opens (file picker dialog or media library). <br>• After attaching media, prediction automatically recalculates (after debounce). <br>• "Add Media" suggestion disappears from the list (no longer relevant). <br>• Score increases by approximately the predicted improvement amount. <br>• Media presence factor changes from "negative" to "positive". |

---

### TC-PE-017: Feature Flag Gates Prediction UI
| Field | Value |
|-------|-------|
| **ID** | TC-PE-017 |
| **User Story** | US-018 |
| **Priority** | P0 |
| **Type** | Component |
| **Preconditions** | Feature flag for predictions is OFF. |
| **Steps** | 1. Navigate to CreatePostTab. <br>2. Enter post content. <br>3. Observe the page layout. |
| **Expected Result** | • No prediction panel visible. <br>• No prediction API calls made (check Network tab). <br>• CreatePostTab layout adjusts to fill the space (no empty gap). <br>• No references to prediction score in the UI. <br>• Toggling the feature flag ON and reloading shows the prediction panel. |

---

### TC-PE-018: Prediction Loading State
| Field | Value |
|-------|-------|
| **ID** | TC-PE-018 |
| **User Story** | US-018 |
| **Priority** | P1 |
| **Type** | Component |
| **Preconditions** | Prediction API response deliberately slow (>1s) via network throttling. |
| **Steps** | 1. Enter content in CreatePostTab. <br>2. Observe the prediction panel during loading. |
| **Expected Result** | • Score gauge shows a skeleton/shimmer animation or spinner (not blank space). <br>• Factor breakdown shows skeleton rows. <br>• Suggestions section shows skeleton cards or is hidden until loaded. <br>• No layout shift when score loads (skeleton matches final layout dimensions). <br>• If API takes >5s, a timeout message appears: "Prediction is taking longer than expected." |

---

### TC-PE-019: Prediction API Accepts All Input Fields
| Field | Value |
|-------|-------|
| **ID** | TC-PE-019 |
| **User Story** | US-018 |
| **Priority** | P0 |
| **Type** | Integration |
| **Preconditions** | Prediction API deployed. |
| **Steps** | 1. Call `POST /api/admin/social/ai/predict-performance` with full payload: <br>```json
{
  "content": "Great post content with a CTA: Learn more at our website!",
  "platforms": ["instagram", "facebook", "twitter"],
  "hashtags": ["#AI", "#Marketing", "#Growth"],
  "mediaUrls": ["https://example.com/img1.jpg", "https://example.com/img2.jpg"],
  "scheduledAt": "2026-03-10T18:00:00Z"
}
``` <br>2. Call again with minimal payload (content only, no optional fields): <br>```json
{
  "content": "Just a simple post."
}
``` |
| **Expected Result** | • Full payload: returns score with all factors considered. Time-of-day factor uses `scheduledAt`, hashtag factor uses provided hashtags, media factor considers 2 images. <br>• Minimal payload: returns score with defaults. Hashtag strength = 0 (no hashtags), media = 0 (no media), time-of-day uses "now" or neutral. Platforms defaults to empty or a sensible default. <br>• Neither request returns 400 (both are valid). <br>• `scheduledAt` in the past is accepted (for historical analysis). |

---

### TC-PE-020: Mobile Layout — Collapsible Prediction Panel
| Field | Value |
|-------|-------|
| **ID** | TC-PE-020 |
| **User Story** | US-018 |
| **Priority** | P1 |
| **Type** | Component |
| **Preconditions** | Mobile viewport (< 768px width). CreatePostTab open with content entered. |
| **Steps** | 1. Observe prediction panel placement. <br>2. Tap to expand the prediction panel. <br>3. Tap to collapse. |
| **Expected Result** | • On mobile, prediction panel renders as a collapsible bottom panel (not sidebar). <br>• Default state: collapsed, showing only the score badge (e.g., "Score: 72 ▲"). <br>• Tapping expands to show full factor breakdown and suggestions. <br>• Expanded panel does not fully cover the content editor (partial overlay or push-up). <br>• Collapsible toggle is accessible (44px minimum touch target). <br>• Score badge color-coded even in collapsed state. |

---

## P3-Q007 — Email Notification Testing

**User Story:** US-015 (Content Approval Workflow)  
**Build Dependencies:** P3-B006 (email notifications), P3-B002 (approval API)  
**Related M1 Test Cases:** TC-AHP-002, TC-AHP-004 (email assertions), TC-AEC-022 (preferences)

---

### TC-EN-001: Email Sent on Approval Request Submission
| Field | Value |
|-------|-------|
| **ID** | TC-EN-001 |
| **User Story** | US-015 |
| **Priority** | P0 |
| **Type** | Integration |
| **Preconditions** | ClientA has 1-level approval config. Approver has email address configured. Test SMTP server running (Ethereal/Mailhog). Notification preferences: `emailOnApprovalRequest = true` (default). |
| **Steps** | 1. Creator submits "Test Post Alpha" for approval via `POST /api/admin/social/posts/:id/request-approval`. <br>2. Within 5 seconds, check test SMTP inbox for the approver's email. |
| **Expected Result** | • Exactly 1 email sent to the approver's email address. <br>• Email received within 5 seconds of submission. <br>• **From:** Steel City AI or configured sender (e.g., `noreply@steelcity-ai.com`). <br>• **To:** Approver's email address. <br>• **Subject:** "Approval Requested: Test Post Alpha" (contains post title). <br>• **Body** includes: <br>  - Post content preview (first 200 chars or summary). <br>  - Requester name (who submitted the post). <br>  - Submission timestamp. <br>  - "Review & Approve" CTA button/link pointing to the approval dashboard with the approval request ID. <br>  - Steel City AI logo/branding. <br>• **No email sent to:** the requester (they already know they submitted it). |

---

### TC-EN-002: Email Sent on Approval (Approved)
| Field | Value |
|-------|-------|
| **ID** | TC-EN-002 |
| **User Story** | US-015 |
| **Priority** | P0 |
| **Type** | Integration |
| **Preconditions** | Post "Test Post Alpha" is pending approval. Test SMTP inbox cleared. |
| **Steps** | 1. Approver approves the post with comment: "Looks great!" via `PUT /api/admin/social/approval-requests/:id/respond` with `{action: "approve", comment: "Looks great!"}`. <br>2. Check test SMTP inbox. |
| **Expected Result** | • 1 email sent to the **creator/requester** (not the approver). <br>• **Subject:** "Your post has been approved: Test Post Alpha". <br>• **Body** includes: <br>  - Post title and content preview. <br>  - Approver's name. <br>  - Approval comment: "Looks great!" (displayed in a quote/callout block). <br>  - "View Post" link to the post in PostsTab. <br>  - Next step guidance: "Your post is now ready to be scheduled or published." <br>  - Steel City AI branding. <br>• Email sent within 5 seconds of approval action. |

---

### TC-EN-003: Email Sent on Rejection
| Field | Value |
|-------|-------|
| **ID** | TC-EN-003 |
| **User Story** | US-015 |
| **Priority** | P0 |
| **Type** | Integration |
| **Preconditions** | Post "Test Post Beta" is pending approval. Test SMTP inbox cleared. |
| **Steps** | 1. Approver rejects the post with comment: "The tone doesn't match our brand guidelines. Please revise." <br>2. Check test SMTP inbox. |
| **Expected Result** | • 1 email sent to the **creator/requester**. <br>• **Subject:** "Your post was rejected: Test Post Beta". <br>• **Body** includes: <br>  - Post title and content preview. <br>  - Rejector's name. <br>  - Rejection reason/comment prominently displayed (not hidden, not truncated): "The tone doesn't match our brand guidelines. Please revise." <br>  - "Edit & Re-submit" link to the post edit view. <br>  - Steel City AI branding. <br>• No email sent to the approver (they performed the action). |

---

### TC-EN-004: Email Sent on Request Changes
| Field | Value |
|-------|-------|
| **ID** | TC-EN-004 |
| **User Story** | US-015 |
| **Priority** | P0 |
| **Type** | Integration |
| **Preconditions** | Post "Test Post Gamma" is pending approval. Test SMTP inbox cleared. |
| **Steps** | 1. Approver clicks "Request Changes" with comment: "Add a CTA and swap the image for something more seasonal." <br>2. Check test SMTP inbox. |
| **Expected Result** | • 1 email sent to the **creator/requester**. <br>• **Subject:** "Changes requested on: Test Post Gamma". <br>• **Body** includes: <br>  - Post title and content preview. <br>  - Reviewer's name. <br>  - Feedback comment clearly displayed: "Add a CTA and swap the image for something more seasonal." <br>  - "Edit Post" link to the post edit view. <br>  - Steel City AI branding. <br>• Subject line distinguishes this from rejection (different wording). |

---

### TC-EN-005: Email Content Includes Post Details
| Field | Value |
|-------|-------|
| **ID** | TC-EN-005 |
| **User Story** | US-015 |
| **Priority** | P0 |
| **Type** | Integration |
| **Preconditions** | Post with rich content: title, content (200+ chars), 2 platform badges (Instagram + Facebook), 3 hashtags, scheduled date. Submitted for approval. |
| **Steps** | 1. Check the approval notification email sent to the approver. <br>2. Inspect the email HTML/text body in detail. |
| **Expected Result** | • Post content preview is present (first 200 chars or meaningful excerpt). <br>• Platforms listed (e.g., "Instagram, Facebook"). <br>• Hashtags shown (e.g., "#AI #Marketing #Growth"). <br>• Scheduled date/time shown if set (e.g., "Scheduled for: Mar 10, 2026 at 2:00 PM EST"). <br>• Media presence indicated (e.g., "📷 2 images attached" — but images NOT inlined in email for size reasons). <br>• All links are valid, absolute URLs (not relative paths). <br>• Action link includes authentication token or deep-link parameters for seamless login-to-approval. |

---

### TC-EN-006: Multi-Level Approval — L1 Approve Triggers L2 Notification
| Field | Value |
|-------|-------|
| **ID** | TC-EN-006 |
| **User Story** | US-015 |
| **Priority** | P0 |
| **Type** | Integration |
| **Preconditions** | ClientB has 2-level approval chain: L1 (Team Lead), L2 (Client Owner). Post submitted for approval. L1 approves. Test SMTP inbox cleared before L1 approval. |
| **Steps** | 1. L1 approver approves the post. <br>2. Check test SMTP inbox for L2 approver's email. <br>3. Check test SMTP inbox for creator's email. |
| **Expected Result** | • **L2 approver receives email:** <br>  - Subject: "Approval Requested: [Post Title]" (same format as initial request). <br>  - Body includes L1's approval comment (visible context for L2 review). <br>  - Body shows "Level 2 of 2 — Final Approval" indicator. <br>  - "Review & Approve" link. <br>• **Creator does NOT receive email yet** (post not fully approved — still pending at L2). <br>• L1 approver does NOT receive an email (they just approved it). <br>• Total emails sent: exactly 1 (to L2 approver only). |

---

### TC-EN-007: Multi-Level Approval — Final Approval Triggers Creator Notification
| Field | Value |
|-------|-------|
| **ID** | TC-EN-007 |
| **User Story** | US-015 |
| **Priority** | P0 |
| **Type** | Integration |
| **Preconditions** | TC-EN-006 completed. Post pending at L2. Test SMTP inbox cleared. |
| **Steps** | 1. L2 approver approves the post with comment: "Approved for publication." <br>2. Check test SMTP inbox. |
| **Expected Result** | • Creator receives email: "Your post has been fully approved: [Post Title]". <br>• Body includes full approval chain summary: "L1 Team Lead approved → L2 Client Owner approved". <br>• Body includes L2's comment: "Approved for publication." <br>• "Schedule Post" or "View Post" link included. <br>• L1 approver optionally receives a CC/notification (depends on implementation — verify either way). <br>• L2 approver does NOT receive an email (they just approved). |

---

### TC-EN-008: Multi-Level Rejection — Only Creator Notified
| Field | Value |
|-------|-------|
| **ID** | TC-EN-008 |
| **User Story** | US-015 |
| **Priority** | P1 |
| **Type** | Integration |
| **Preconditions** | ClientB 2-level chain. Post pending at L1. Test SMTP inbox cleared. |
| **Steps** | 1. L1 approver rejects the post. <br>2. Check test SMTP inbox. |
| **Expected Result** | • Creator receives rejection email (as per TC-EN-003). <br>• L2 approver does NOT receive any email (rejection at L1 terminates the chain). <br>• Total emails sent: exactly 1 (to creator only). |

---

### TC-EN-009: Notification Preference — Email Disabled for Approval Requests
| Field | Value |
|-------|-------|
| **ID** | TC-EN-009 |
| **User Story** | US-015 |
| **Priority** | P1 |
| **Type** | Integration |
| **Preconditions** | Approver's `notification_preferences` row has `emailOnApprovalRequest = false`. All other preferences remain `true`. Test SMTP inbox cleared. |
| **Steps** | 1. Creator submits a post for approval. <br>2. Wait 10 seconds. <br>3. Check test SMTP inbox for the approver's email. |
| **Expected Result** | • No email sent to the approver. <br>• Test SMTP inbox is empty (no messages for approver's address). <br>• Approval request is still created in the database (`social_post_approvals` row exists). <br>• Post status changes to "pending" as normal. <br>• Approver can still see the pending post in ApprovalQueueTab (in-app notification works). <br>• No error logged server-side (skipping email is expected, not an error). |

---

### TC-EN-010: Notification Preference — Email Disabled for Approval Responses
| Field | Value |
|-------|-------|
| **ID** | TC-EN-010 |
| **User Story** | US-015 |
| **Priority** | P1 |
| **Type** | Integration |
| **Preconditions** | Creator's `notification_preferences` row has `emailOnApprovalResponse = false`. Test SMTP inbox cleared. |
| **Steps** | 1. Approver approves the creator's post. <br>2. Wait 10 seconds. <br>3. Check test SMTP inbox for the creator's email. |
| **Expected Result** | • No email sent to the creator. <br>• Post status correctly changes to "approved" in the database. <br>• Creator can see the updated status in PostsTab (in-app). <br>• Approval comment is recorded in `social_post_approvals`. <br>• No error logged. |

---

### TC-EN-011: Notification Preference — Email Disabled for Changes Requested
| Field | Value |
|-------|-------|
| **ID** | TC-EN-011 |
| **User Story** | US-015 |
| **Priority** | P1 |
| **Type** | Integration |
| **Preconditions** | Creator's `notification_preferences` row has `emailOnChangesRequested = false`. Test SMTP inbox cleared. |
| **Steps** | 1. Approver requests changes on the creator's post with a comment. <br>2. Wait 10 seconds. <br>3. Check test SMTP inbox. |
| **Expected Result** | • No email sent to the creator. <br>• Post status changes to "changes_requested" correctly. <br>• Comment saved in database. <br>• Creator sees the changes-requested status in PostsTab/PostEditDialog. |

---

### TC-EN-012: All Email Notifications Disabled — Full Silence
| Field | Value |
|-------|-------|
| **ID** | TC-EN-012 |
| **User Story** | US-015 |
| **Priority** | P1 |
| **Type** | Integration |
| **Preconditions** | Both approver and creator have all email preferences set to `false` (`emailOnApprovalRequest`, `emailOnApprovalResponse`, `emailOnChangesRequested` all `false`). Test SMTP inbox cleared. |
| **Steps** | 1. Creator submits post for approval. <br>2. Approver approves the post. <br>3. Wait 10 seconds. <br>4. Check test SMTP inbox. |
| **Expected Result** | • Zero emails sent throughout the entire workflow. <br>• Test SMTP inbox remains empty. <br>• All approval workflow steps complete successfully (database state correct). <br>• In-app workflow fully functional (ApprovalQueueTab, status badges, etc.). |

---

### TC-EN-013: Notification Preference CRUD
| Field | Value |
|-------|-------|
| **ID** | TC-EN-013 |
| **User Story** | US-015 |
| **Priority** | P1 |
| **Type** | Integration |
| **Preconditions** | User has no `notification_preferences` row (first-time setup). |
| **Steps** | 1. Call `GET /api/admin/notification-preferences` (or equivalent). <br>2. Observe default values. <br>3. Call `PUT /api/admin/notification-preferences` with `{emailOnApprovalRequest: false}`. <br>4. Call `GET` again to verify. |
| **Expected Result** | • Initial `GET` returns defaults: all email preferences `true`, `inAppNotifications: true`. <br>• If no row exists, API returns defaults (not 404). <br>• `PUT` with partial update succeeds (200). Only `emailOnApprovalRequest` changes; others remain `true`. <br>• Subsequent `GET` confirms `emailOnApprovalRequest = false`. <br>• `userId` and `userType` set correctly from authenticated session. |

---

### TC-EN-014: Batch Submissions — Debounced Email (Not Flooding)
| Field | Value |
|-------|-------|
| **ID** | TC-EN-014 |
| **User Story** | US-015 |
| **Priority** | P1 |
| **Type** | Integration |
| **Preconditions** | 5 draft posts exist for ClientA. Same approver for all posts. Test SMTP inbox cleared. |
| **Steps** | 1. Bulk-submit all 5 posts for approval in quick succession (via bulk action or rapid individual submissions within 5 seconds). <br>2. Wait 15 seconds. <br>3. Count emails in test SMTP inbox for the approver. |
| **Expected Result** | • Approver receives **1 batched email** (preferred) OR **at most 5 individual emails** (acceptable fallback). <br>• If batched: email subject = "5 posts awaiting your approval" or similar. Body lists all 5 post titles with individual review links. <br>• If individual: emails arrive without overwhelming the inbox (no more than 1 per second). <br>• No duplicate emails for the same post. <br>• All 5 approval requests are created in the database regardless of email batching. |

---

### TC-EN-015: Email Action Links Are Valid and Functional
| Field | Value |
|-------|-------|
| **ID** | TC-EN-015 |
| **User Story** | US-015 |
| **Priority** | P0 |
| **Type** | E2E |
| **Preconditions** | Approval notification email received in test SMTP inbox. Email contains "Review & Approve" link. |
| **Steps** | 1. Extract the "Review & Approve" URL from the email body. <br>2. Open the URL in a browser. |
| **Expected Result** | • URL is a valid absolute URL (starts with `https://`). <br>• URL includes the approval request ID or post ID as a parameter/path segment. <br>• Opening the URL navigates to the approval dashboard showing the specific pending post. <br>• If user is not authenticated, they are redirected to login first, then to the approval page. <br>• URL does not expose sensitive tokens in plain text (use short-lived or hashed tokens if direct-action links). <br>• URL does not 404 or redirect to homepage. |

---

### TC-EN-016: Email HTML Rendering and Branding
| Field | Value |
|-------|-------|
| **ID** | TC-EN-016 |
| **User Story** | US-015 |
| **Priority** | P2 |
| **Type** | Manual |
| **Preconditions** | Approval notification email captured in test SMTP inbox. |
| **Steps** | 1. Open the email in HTML view (Mailhog/Ethereal HTML preview). <br>2. Check visual rendering. <br>3. Open in plain-text view. |
| **Expected Result** | • HTML version: <br>  - Steel City AI logo visible in header. <br>  - Consistent color scheme (brand colors). <br>  - CTA button is styled and clickable (not just a plain link). <br>  - Responsive layout (readable on mobile email clients — single-column, max 600px). <br>  - No broken images (logo hosted or inlined as base64). <br>• Plain-text fallback exists (multipart email). <br>• Plain-text version includes all critical info: post title, action, and a clickable URL. <br>• No CSS issues that would trigger spam filters (inline styles, not external stylesheet). |

---

### TC-EN-017: Email Not Sent for Clients Without Approval Config
| Field | Value |
|-------|-------|
| **ID** | TC-EN-017 |
| **User Story** | US-015 |
| **Priority** | P0 |
| **Type** | Integration |
| **Preconditions** | ClientC has no approval config. Post published directly (no approval flow). Test SMTP inbox cleared. |
| **Steps** | 1. Create and publish a post for ClientC. <br>2. Wait 10 seconds. <br>3. Check test SMTP inbox. |
| **Expected Result** | • No approval-related emails sent. <br>• Test SMTP inbox remains empty (for approval emails — other transactional emails may exist). <br>• Post publishes normally without any approval workflow triggering. |

---

### TC-EN-018: Re-Submit After Rejection — Fresh Notification
| Field | Value |
|-------|-------|
| **ID** | TC-EN-018 |
| **User Story** | US-015 |
| **Priority** | P1 |
| **Type** | Integration |
| **Preconditions** | Post was rejected. Creator has edited the post. Test SMTP inbox cleared. |
| **Steps** | 1. Creator clicks "Re-submit for Approval". <br>2. Check test SMTP inbox. |
| **Expected Result** | • Approver receives a fresh notification email. <br>• Subject: "Approval Requested: [Post Title]" (same format as initial submission). <br>• Body may include a "Resubmission" indicator or note that this is a revision. <br>• Email does not include the old rejection comment (clean start for the approver). <br>• A new `approval_requests` row is created (previous rejection preserved for audit). |

---

## Appendices

### Appendix A: Prediction Score Formula Reference

```
Composite Score (0-100) = (
  timeOfDayScore    × 0.20 +     // 20% weight
  contentQuality    × 0.25 +     // 25% weight
  hashtagStrength   × 0.15 +     // 15% weight
  mediaPresence     × 0.20 +     // 20% weight
  historicalPerf    × 0.20       // 20% weight
) × 10

Each sub-score: 0.0 to 10.0
Composite range: 0 to 100

Confidence = f(historicalDataVolume)
  0 posts: 0.10
  1-5 posts: 0.25
  6-20 posts: 0.50
  21-50 posts: 0.75
  50+ posts: 0.90+
```

### Appendix B: Notification Email Templates

| Trigger Event | Recipient | Subject Format | Required Body Elements |
|---------------|-----------|----------------|----------------------|
| Submit for Approval | Approver | "Approval Requested: {postTitle}" | Post preview, requester name, review link |
| Approved | Creator | "Your post has been approved: {postTitle}" | Post title, approver name, comment (if any), view link |
| Rejected | Creator | "Your post was rejected: {postTitle}" | Post title, rejector name, rejection comment, edit link |
| Changes Requested | Creator | "Changes requested on: {postTitle}" | Post title, reviewer name, feedback comment, edit link |
| L1→L2 Forward | L2 Approver | "Approval Requested: {postTitle}" | Post preview, L1 comment, level indicator, review link |
| Final Approval (multi) | Creator | "Your post has been fully approved: {postTitle}" | Approval chain summary, final comment, schedule link |

### Appendix C: Database Schema Reference (Phase 3 M2)

```sql
-- prediction_records
CREATE TABLE prediction_records (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id VARCHAR NOT NULL,
  predicted_score NUMERIC(5,2) NOT NULL,     -- 0.00 to 100.00
  confidence NUMERIC(5,2),                    -- 0.00 to 1.00
  factors JSONB,                              -- [{name, impact, value, suggestion}]
  actual_score NUMERIC(5,2),                  -- Populated 48h post-publish
  actual_measured_at TIMESTAMP,
  predicted_at TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX ON prediction_records (post_id);
CREATE INDEX ON prediction_records (predicted_at);

-- notification_preferences
CREATE TABLE notification_preferences (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  user_type TEXT NOT NULL,                    -- 'admin' | 'portal'
  email_on_approval_request BOOLEAN DEFAULT TRUE NOT NULL,
  email_on_approval_response BOOLEAN DEFAULT TRUE NOT NULL,
  email_on_changes_requested BOOLEAN DEFAULT TRUE NOT NULL,
  in_app_notifications BOOLEAN DEFAULT TRUE NOT NULL,
  email_address TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX ON notification_preferences (user_id);

-- social_hashtag_metrics
CREATE TABLE social_hashtag_metrics (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  hashtag TEXT NOT NULL,
  post_id VARCHAR,
  platform TEXT,
  impressions INTEGER DEFAULT 0,
  engagements INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  engagement_rate NUMERIC(10,4),
  measured_at TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX ON social_hashtag_metrics (hashtag);
CREATE INDEX ON social_hashtag_metrics (post_id);
CREATE INDEX ON social_hashtag_metrics (measured_at);
CREATE INDEX ON social_hashtag_metrics (hashtag, measured_at);
```

### Appendix D: API Endpoint Reference (Phase 3 M2)

| Endpoint | Method | Auth | Purpose | Test Cases |
|----------|--------|------|---------|------------|
| `/api/{mode}/social/analytics/hashtags` | GET | Admin/Portal | Paginated, sorted hashtag metrics | TC-HD-001, 002, 003, 004, 009, 010, 013 |
| `/api/{mode}/social/analytics/hashtags/:tag/timeseries` | GET | Admin/Portal | Daily time-series for a hashtag | TC-HD-006, 014 |
| `/api/{mode}/social/ai/predict-performance` | POST | Admin/Portal | Get prediction score for post content | TC-PE-001, 002, 008, 019 |
| `/api/{mode}/social/ai/prediction-accuracy` | GET | Admin/Portal | Accuracy metrics for predictions | TC-PE-012, 014 |
| `/api/{mode}/notification-preferences` | GET/PUT | Admin/Portal | Manage email notification prefs | TC-EN-009–013 |

### Appendix E: Test Case Summary

| Section | Total Cases | P0 | P1 | P2 |
|---------|------------|----|----|-----|
| P3-Q005: Hashtag Dashboard | 15 | 7 | 5 | 3 |
| P3-Q006: AI Predictions | 20 | 7 | 10 | 3 |
| P3-Q007: Email Notifications | 18 | 7 | 9 | 2 |
| **Total** | **53** | **21** | **24** | **8** |

### Appendix F: Test Execution Checklist

- [ ] Test SMTP server (Ethereal/Mailhog) started and accessible
- [ ] Phase 3 seed data loaded (3 clients, posts, hashtags, users)
- [ ] `notification_preferences` table has default rows for test users
- [ ] `social_hashtag_metrics` backfilled from existing engagement data
- [ ] Feature flag for predictions enabled (for TC-PE-* tests)
- [ ] Feature flag for predictions disabled (for TC-PE-017 only)
- [ ] Mock prediction API configured for deterministic outputs (unit tests)
- [ ] Network throttling tools available (for debounce/cancellation tests)
- [ ] Mobile viewport testing available (browser DevTools or real device)

---

*End of Phase 3 Milestone 2 Test Specifications*
