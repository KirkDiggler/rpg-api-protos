---
name: SessionPresentationService
description: Shared live-session dice-throw presentation contract — validates and fans out decorative rigid-body throw plans without carrying combat truth
updated: 2026-08-27
confidence: high for the contract shape — verified by buf format/lint/breaking/generate plus make mocks; runtime confidence waits on rpg-api#852 and rpg-dnd5e-web#837
---

# SessionPresentationService

Defined in `dnd5e/api/session/presentation/v1alpha1/service.proto`. Package
`dnd5e.api.session.presentation.v1alpha1`.

Parent work: journey `rpg-project#289`, approved design `rpg-project#303`
(PR #304), provider issue `rpg-api-protos#256`. Immediate consumer legs are
assigned, not speculative: `rpg-api#852` owns the live host/relay and
`rpg-dnd5e-web#837` owns SessionCanvas playback.

## Why this is a separate service

This seam is PRESENTATION-ONLY. The authoritative combat result already exists
on `SessionService` responses and typed Story events; this package carries only
one decorative rigid-body throw plan that the roller and witnesses can play
conversationally identically.

Keeping it separate prevents two kinds of drift:

- `SessionService` does not grow presentation transport, replay policy, or
  physics vocabulary into the game-truth seam.
- The shared throw does not gain outcome authority by accident — no hit/miss,
  damage, HP, target legality, or toolkit facts belong here.

## Shape

- 1 service, 2 RPCs.
- 4 enums, 14 messages.
- No imports; leaf package.
- Service-first single file today because the surface is still compact.

| RPC | Purpose |
|---|---|
| `PublishDiceThrow` | Validate one client-generated draft, bind it to the authenticated session member, and return the published shared plan |
| `StreamDiceThrows` | Live-only fanout of validated plans to roller and witnesses in the same session |

```proto
message DiceThrowDraft {
  uint32 schema_version = 1;
  string presentation_id = 2;
  uint64 authority_seq = 3;
  uint32 attempt = 4;
  DicePhysicsSchema physics_schema = 5;
  bytes collider_fingerprint = 6;
  repeated DiceBodyInitial bodies = 7;
  repeated ContactCheckpoint contacts = 8;
  ThrowTerminal terminal = 9;
}
message DiceThrowPlan {
  uint32 schema_version = 1;
  string session = 2;
  string presentation_id = 3;
  uint64 authority_seq = 4;
  string roller = 5;
  uint32 attempt = 6;
  DicePhysicsSchema physics_schema = 7;
  bytes collider_fingerprint = 8;
  repeated DiceBodyInitial bodies = 9;
  repeated ContactCheckpoint contacts = 10;
  ThrowTerminal terminal = 11;
}
```

The two low-level pose types are intentionally new and presentation-specific:
`Vector3` and `Quaternion`. This package does **not** mint a fourth `Position`
message. Dungeon cells stay on `session/v1alpha1.Position`; rigid-body pose and
velocity stay here.

## Live-only, Redis-backed intended host

The intended runtime host is `rpg-api` as a live session relay (`rpg-api#852`),
with Redis-backed fanout for current throws only. That matters because the
stream is intentionally **no-replay**:

- there is no snapshot event;
- there is no history RPC;
- reconnect does not ask this service to restage old choreography; and
- a missed release must settle/fallback from current authoritative combat truth
  plus the client's own presentation rules.

The package therefore models a current shared ritual, not an event log.

## Group-shaped on purpose

The contract starts with one attack d20 in production, but the wire is already
**group-shaped**:

- `repeated DiceBodyInitial bodies`
- `repeated ContactCheckpoint contacts`
- `ThrowTerminal { repeated DiceBodyTerminal dice }`

That shape is the forward-compatibility story. Later damage handfuls extend the
existing repeated-body plan instead of replacing the service with a new
single-die dialect. Future die kinds add `DiceShape` enum values; future
playback families add `DicePhysicsSchema` values. Old values keep their meaning.

## Authority boundaries

What this service **does** own:

- validated presentation identity (`presentation_id`);
- shared physics schema choice (`physics_schema`);
- bounded sparse contacts and per-body terminal states;
- server-bound roller identity on `DiceThrowPlan.roller`; and
- session scoping plus collider consistency via `collider_fingerprint`.

What this service **does not** own:

- attack/damage outcome authority;
- hit/miss, HP, AC, target legality, action economy, or Story wording;
- gesture authority for witnesses;
- collectible ownership/catalog truth; or
- server-side physics/exact trajectory streaming.

`authority_seq` is correlation into already-authoritative combat truth, not a
second outcome channel.

## Bounds and validation

The design deliberately sends a **compact bounded plan**, not frame-by-frame
motion:

- initials define one fixed body set for the attempt;
- contacts are sparse ordered checkpoints, not pointer history or trajectory
  streaming; and
- terminals close the same body set with `SETTLED` or `OFF_TABLE` only.

The current host/client validation contract is explicit even though it does not
add fields:

- `DiceThrowDraft` / `DiceThrowPlan` carry **1-20 stable bodies** per attempt.
- `DICE_PHYSICS_SCHEMA_RAPIER_DUNGEON_D20_V1` currently accepts
  **`DICE_SHAPE_D20` bodies only**.
- Playback is authored for **60 Hz** and steps must stay within **480**.
- A plan may carry at most **128** contacts.
- All `ContactCheckpoint.after` entries combined may carry at most **256**
  checkpoint body states.
- `attempt` is bounded to **1-32**.
- `collider_fingerprint` is exactly **32 bytes**.
- Encoded draft/plan size is capped at **64 KiB**.
- Every quaternion must be normalized within absolute norm error
  **<= 0.0001**.

These are validation rules for the live host/client pair in `rpg-api` and
`rpg-dnd5e-web`, not new wire fields. The proto's job is to keep the shape
narrow enough that those checks are possible and obvious.

## Consumer state

- **`rpg-api#852`** — relay/validation host, authenticated member binding,
  Redis-backed live fanout, bounded draft acceptance, and publish path.
- **`rpg-dnd5e-web#837`** — SessionCanvas playback, tray handoff, shared
  witness playback, off-table retry UX, reconnect/fallback behavior.

At merge time this is therefore **consumer PR pending**, not a repo-noise
service and not a live runtime surface yet.

## Evidence

Per repo policy, there are no hand-written protobuf mechanics tests here. The
contract evidence is:

- `buf format -w`
- `buf lint`
- `buf format --diff --exit-code`
- `buf breaking --against ...main`
- `buf generate`
- `make mocks`

Re-grade after the API and web legs land and the two-browser dungeon walk is
recorded.
