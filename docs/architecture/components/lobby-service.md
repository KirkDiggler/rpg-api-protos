---
name: LobbyService
description: D&D 5e party-assembly contract (v1alpha1) — join/ready/start, the slice-1 seam that feeds encounter construction
updated: 2026-07-06
confidence: high — proto-side only; no consumer yet, verified by reading the design doc and the committed .proto files
---

# LobbyService

Defined in `dnd5e/api/lobby/v1alpha1/` (service-first layout: `service.proto`,
`types.proto`, `events.proto` — mirrors `dnd5e/api/v1alpha2/encounter/`'s
split). Package `dnd5e.api.lobby.v1alpha1`.

Design doc: `rpg-project/ideas/game-screen-rebuild/lobby-surface.md`. Umbrella:
`KirkDiggler/rpg-project#81`. This service closes the gap the design doc
names: nothing on `v1alpha2` could assemble a multiplayer party before this —
the only multi-player v2 encounters that ever existed were devseed fixtures
written straight to Redis, bypassing the RPC surface entirely.

## Why a separate service, not RPCs on `EncounterService`

Services version independently. `EncounterService` is where iteration churn
lives (TakeAction wave, reactions, death saves); the lobby can stay stable —
or grow a feature — without forcing an encounter-service rewrite. It also
keeps the encounter types a clean 1:1 toolkit mirror: a lobby is pure API
orchestration state (join refs, membership, ready flags, lifecycle), and the
toolkit has zero lobby concept. Bolting a `WAITING` pseudo-mode onto
`EncounterMode` would have polluted an enum that maps straight onto toolkit
state.

The lobby starts at its own `v1alpha1` and versions on its own clock —
deliberately not `v1alpha2` to match the encounter service's current version;
lining a new service up with another service's version number would
re-import the whole-API-versioning habit the service split exists to avoid
(`rpg-project#80`).

## RPCs

| RPC | Request:Response | Notes |
|---|---|---|
| `CreateLobby` | `CreateLobbyRequest:CreateLobbyResponse` | Starts a `WAITING` lobby; caller becomes host and binds `character_id` |
| `JoinLobby` | `JoinLobbyRequest:JoinLobbyResponse` | Idempotent — rebinds `character_id` for an existing member rather than erroring. `FailedPrecondition` if already `STARTED` or at party cap |
| `SetReady` | `SetReadyRequest:SetReadyResponse` | Toggles caller's ready flag; broadcasts `member_ready` |
| `LeaveLobby` | `LeaveLobbyRequest:LeaveLobbyResponse` | Pre-start only. Host leaving migrates host role (`host_changed`), doesn't dissolve the lobby |
| `StartEncounter` | `StartEncounterRequest:StartEncounterResponse` | Host-only, all-ready gated. Builds the toolkit encounter, persists it, then emits `encounter_started`. Terminal — subsumes the deleted `EncounterService.CreateEncounter` |
| `StreamLobby` | `StreamLobbyRequest:stream LobbyEvent` | Snapshot-then-deltas, mirrors `StreamEncounter`. Ends at `encounter_started`; clients switch to `StreamEncounter(encounter_id)` |

## Messages

- `LobbyMember` (`types.proto`) — `player_id`, `character_id`,
  `character_name` (server-enriched, never client-computed), `is_host`,
  `is_ready`, `is_connected`.
- `LobbyEvent` (`events.proto`) — oneof: `snapshot` (first event on
  subscribe), `member_joined`, `member_left`, `member_ready`,
  `member_connection_changed`, `host_changed`, `encounter_started`
  (terminal). No combat-log envelope (no `sequence`/`timestamp`/
  `correlation_id` like `EncounterEvent`) — the lobby has no causation
  chains to reassemble and the stream is short-lived.

## Contract edge cases (decided at design time, not left to implementation)

- **Presence vs. membership**: `is_connected` flips on `StreamLobby`
  subscribe/disconnect, broadcast as `member_connection_changed`. A dropped
  tab keeps its seat — only explicit `LeaveLobby` removes a member.
- **Host migration**: host leaving reassigns to the oldest remaining member
  rather than dissolving the lobby.
- **Late join**: `JoinLobby` on a `STARTED` lobby → `FailedPrecondition`.
  Mid-encounter join is a future encounter-side concern, not a lobby one.
- **Join is idempotent**: repeat `JoinLobby` calls (reconnect, second tab,
  character re-pick) rebind rather than error — the only re-select path.
- **Start/leave atomicity**: `StartEncounter` snapshots members atomically;
  a racing `LeaveLobby` lands either before (excluded) or after
  (`FailedPrecondition`).
- **Abandonment**: TTL-based expiry (refreshed on activity), no reaper
  process, no contract field — same pattern as the v2 encounter repo.
- **Party cap**: server-enforced (4 to start), `FailedPrecondition` over
  cap — a config knob, not a contract field.

## One join mechanism, two carriers

`JoinLobby` takes an opaque `join_ref` minted at `CreateLobby`. The Discord
Activity carrier supplies it automatically (shared channel instance); the
dev/playtest carrier passes the same ref via URL param or displayed short
code. The instance→`join_ref` mapping is rpg-api internal — invisible to
this contract, which only ever deals in `join_ref`.

## What was deleted alongside this

`EncounterService.CreateEncounter` and its request/response messages
(`dnd5e/api/v1alpha2/encounter/service.proto`) — see the Rule 2 worked
example in [overview.md](../overview.md#rule-2-buf-breaking-is-authoritative-not-advisory).
A solo lobby is the one-player start path; keeping both constructors would
have been the two-parallel-shapes smell overview.md's Rule 1 names.

## Status

Proto-only as of this doc. No `rpg-api` handler/orchestrator/repository yet
(tracked as the next leg of `rpg-project#81`) and no `rpg-dnd5e-web` client
usage. Not yet a "live" service by this repo's usual definition — flag for
re-grading once the rpg-api PR lands.
