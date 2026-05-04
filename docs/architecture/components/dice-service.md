---
name: DiceService
description: Generic dice rolling service with entity+context grouping; consumed for ability score rolls
updated: 2026-05-02
confidence: high — verified by reading api/v1alpha1/dice.proto end-to-end
---

# DiceService

The smallest live service. Defined in `api/v1alpha1/dice.proto`
(112 lines). Designed as RPG-system-agnostic: rolls grouped by
`entity_id` + `context`, retrieved by the same key, expired after a
configurable TTL.

This service is the architectural reference for "how a small focused
service should look in this repo." It does one thing, names the
thing clearly, and keeps the message shapes minimal.

## File and shape

- `api/v1alpha1/dice.proto` — 112 lines.
- 1 service, 3 RPCs, 7 messages.
- No imports. Leaf file.

## RPCs

| RPC | Purpose |
|---|---|
| `RollDice` | Rolls dice and stores in a session keyed by `(entity_id, context)` |
| `GetRollSession` | Retrieves an existing session |
| `ClearRollSession` | Clears a session |

`RollDiceRequest` (line 19):
```proto
string entity_id = 1;             // "char_draft_123", "char_789", "monster_456"
string context = 2;               // "ability_scores", "combat_round_1", "damage_rolls"
string notation = 3;              // "4d6", "1d20", "2d8+3"
int32 count = 4;                  // separate rolls (default 1)
int32 ttl_seconds = 5;            // default 900 (15 minutes)
string modifier_description = 6;  // display only
```

`DiceRoll` (line 49) — the *result* shape:
```proto
string roll_id = 1;
string notation = 2;
repeated int32 dice = 3;          // individual values rolled
int32 total = 4;                  // final after modifiers
repeated int32 dropped = 5;       // for "drop lowest" etc.
string description = 6;
int32 dice_total = 7;             // raw before modifiers
int32 modifier = 8;               // applied modifier
```

## Live consumers

- **rpg-api** — character orchestrator's `RollAbilityScores` RPC
  delegates to this service. The toolkit's character creation flow
  uses the returned `roll_id`s to assign rolls to ability slots
  flexibly (str=roll_3, dex=roll_1, etc.).
- **rpg-dnd5e-web** — receives the rolls via `RollAbilityScores` on
  `CharacterService` (which internally calls `RollDice`). The web
  client does not call `DiceService` directly; the indirection lets
  `CharacterService` apply D&D-specific defaults (4d6 drop lowest,
  6 sets, 15-minute TTL).

## Design notes

- **Entity+context grouping.** The same `(entity_id, context)` pair
  retrieves the same session. Designed to support multiple concurrent
  contexts per entity (e.g. one entity has both "ability_scores" and
  "combat_round_1" sessions live).
- **No streaming.** Rolls are unary RPCs; no real-time push.
- **TTL on the server side.** Sessions auto-expire. The client never
  has to clean up unless it wants to free the slot early via
  `ClearRollSession`.
- **`roll_id` is opaque.** Clients pass it back when assigning rolls
  to slots; the server doesn't expose its structure.

## Rule violations (this service)

None. This service is the cleanest in the repo.

The one issue is **Rule 6 (naming consistency): `DiceRoll` collision.**
`api.v1alpha1.DiceRoll` (this file, line 49) and
`dnd5e.api.v1alpha1.DiceRoll` (`common.proto:45`) share the message
name despite different shapes:

- `api.v1alpha1.DiceRoll` — a roll *result* with rolled dice values.
- `dnd5e.api.v1alpha1.DiceRoll` — a roll *notation* (count, size,
  modifier, "1d20+5").

Different roles, different fields, identical name. Generated
TypeScript code disambiguates by import path, but humans don't. When
either is touched next, rename to `DiceRollResult` /
`DiceRollNotation` (or similar).

## Confidence and what's not verified

- RPC and message counts verified by grepping the file directly.
- "Smallest live service" claim verified by `wc -l` against every
  proto file in the repo.
- Indirect consumption claim (web → CharacterService → DiceService)
  is from the existing ADR `docs/archive/adr/001-dice-service-architecture.md`;
  not re-verified for this audit.
