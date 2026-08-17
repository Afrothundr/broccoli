---
target: the broccoli mobile app
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-08-17T19-56-52Z
slug: apps-mobile-src
---
Method: dual-agent (A: design-review sub-agent · B: detector-evidence sub-agent)

# Design Critique — Broccoli Mobile (`apps/mobile/src`, Operate surface)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Parse poll can run 90s behind one static line; upload leg is a bare button spinner |
| 2 | Match System / Real World | 4 | Best-in-class plain language; only the `−1d/+1w` chips read as engineer shorthand |
| 3 | User Control and Freedom | 2 | Undo bar vanishes on the last card (`last && top` gate); mis-swipe on final item is unrecoverable |
| 4 | Consistency and Standards | 3 | Unified components, but Capture's 48px title vs 32px siblings; takeovers aren't routes (Android back fails) |
| 5 | Error Prevention | 2 | Review's remove-X unconfirmed and un-undoable; quiet-hours steppers allow "10 PM to 10 PM" |
| 6 | Recognition Rather Than Recall | 3 | Persistent swipe hint + button parity excellent; icon-only expanded rows and cryptic chips push recall |
| 7 | Flexibility and Efficiency | 2 | No search/filter/sort in Kitchen — scan-only at 80 items; no bulk actions |
| 8 | Aesthetic and Minimalist Design | 3 | Disciplined rows; Home stacks 5 stat modules + a contested "% vs average" badge |
| 9 | Error Recovery | 3 | Standout error copy, but sign-in leaks raw server messages; stats error lacks retry |
| 10 | Help and Documentation | 2 | Two good empty states + one dense hint are the whole onboarding; savings math never explained |
| **Total** | | **27/40** | **Acceptable (borderline Good)** |

## Design Specificity Verdict

**Authored in copy and interaction; visually still wearing a rented suit.**

**LLM assessment:** The check-in deck is a real interaction invention — the swipe vocabulary remapped to food decisions with urgency-first dealing. Copy voice is the strongest brand asset ("Your kitchen", "Bought Jun 28", chip suppression past 30 days because "~535d on canned tuna is noise"). Green-as-freshness (`statusGood === primary`) is a small real identity move. But the visual system is shadcn/zinc verbatim — the Home dashboard could be any fintech with the green swapped. The splash is literally the Expo template: `#208AEF` blue + `expo-logo.png` on every launch of a green food brand. The app named after a vegetable never depicts food — the check-in card, the one moment the product "holds" an item, is a plain text card.

**Deterministic scan:** clean — 0 findings across all 37 source files (exit 0). Caveat: the detector's rules lean web/CSS, so a clean pass on a React Native tree is weaker evidence than on a web target; it caught nothing the review missed and produced no false positives.

**Visual overlays:** not applicable — native RN target, no URL to inject into.

## Overall Impression

The interaction design and error-handling discipline are ahead of the visual identity. Someone is making taste decisions and writing them down (chip suppression, hidden store names with rationale in comments, CVD-validated chart colors) — but the brand lives entirely in words, the launch experience contradicts it, and the emotional arc mishandles its riskiest moment: a food-waste app that opens on a red "more waste than average" badge and closes its core ritual with a tally of your failures.

## What's Working

1. **Error-copy discipline** — every failure names the object and the recovery path, and the mechanisms make the copy true: "Couldn't save Milk — it's back in the deck" actually re-queues the card.
2. **The deck's engineering serves the interaction** — optimistic commits, urgency-first ordering, `useReducedMotion` path, tap buttons duplicating every gesture with per-item labels ("Tossed Milk").
3. **Editorial restraint in the data model** — freshness chips suppressed past 30 days, "typical shelf life" instead of dataset names, identity never riding on color alone.

## Priority Issues

1. **[P1] Last-swipe mis-commit is unrecoverable** — undo bar requires `last && top` (check-in-deck.tsx:332); after the final card, `top` is null and undo vanishes. Fix: render undo on the "All caught up" state (it already has `records`). Suggested: `/impeccable harden`
2. **[P1] Off-brand template splash on every launch** — `animated-icon.tsx` paints Expo blue `#208AEF` and renders `expo-logo.png`. Fix: brand-green/white splash, delete Expo assets. Suggested: `/impeccable polish`
3. **[P1] The 90-second parse valley** — one static "Reading your receipt…" for the app's highest-stakes wait; no staged progress, no expectation, no cancel. Fix: staged messages, "usually under a minute" copy, cancel via `parse.reset()`. Suggested: `/impeccable harden`
4. **[P2] Expanded inventory row overloads the decision point** — 7 interactive controls at once (4 date chips + 3 location chips), icon-only headers, `−1d/+1w` shorthand. Fix: split into two disclosed lines with text labels or a focused date picker. Suggested: `/impeccable distill` + `/impeccable clarify`
5. **[P2] Takeovers aren't routes** — Settings, deck, and review are state swaps; Android hardware back exits the app instead of the takeover. Fix: modal routes or `BackHandler` hooks. Suggested: `/impeccable adapt`

Also logged: **[P2]** interruption mid-review discards the parsed receipt with no resume path (server has it; UI never resurfaces it).

## Persona Red Flags

**Casey (one-handed, distracted):** Settings gear and deck-close X both top-right — dead thumb zone. Upload on slow connection is an opaque spinner with no progress/cancel, then the 90s poll. Interruption mid-review loses the receipt. Passes: bottom-anchored deck actions, optimistic swipes, focus-refetch.

**Jordan (first-timer):** `−1d/+1w` chips have no unit words or key. "Quiet hours" never says it suppresses notifications, and steppers allow "9 PM to 9 PM". The "% vs average" badge never connects to its baseline. The swipe hint is one dense sentence covering three directions. Passes: both empty states, "AI estimate / set by you" labels.

**Sam (screen reader):** `ItemRow` is a `Pressable` with `accessibilityRole="button"` wrapping 7 more Pressables — the classic RN VoiceOver flattening trap (needs device confirmation). No live-region announcements on any async error — Sam swipes on unaware. Every `Input` is placeholder-only, no `accessibilityLabel` — the review screen is a grid of unlabeled fields. Passes: labeled icon buttons, chart bars with full data labels, reduced-motion respected.

## Minor Observations

- `destructive` and `statusBad` are identical hex in both themes — duplicate token
- Savings hero shows cents ("$47.23") — false precision for a 1/3-baseline estimate
- After "Saved — 6 items added", no "See your kitchen" link at peak curiosity
- Review shows no receipt image alongside the item list — "fix anything the scan got wrong" with no source to check against
- Dead template files: `hint-row.tsx`, `web-badge.tsx`, Expo assets
- `BottomTabInset` hardcoded (50/80) rather than safe-area-derived
- `hour12` ignores 24-hour locale preference

## Questions to Consider

1. Is "daily check-in" the right ritual, or the right *moment*? What if the push notification *was* the check-in — three cards, launched from the nudge, done at the fridge?
2. Can a toss become generative instead of confessional? "You've tossed cilantro 3 times — buy the small bunch" turns the shame loop into a savings loop.
3. Which screen is actually Home? The money ledger greets the user; the daily-use surface ("Use these first") is buried in tab three. For a habit product, does the food or the ledger deserve the front door?
