---
name: EnvironmentService (UNUSED)
description: Generic room generation and CRUD; defined in api/v1alpha1, no live consumer
updated: 2026-05-02
confidence: high — verified by grepping rpg-api / rpg-dnd5e-web for any reference to this service or its messages
---

# EnvironmentService

**Status: defined, not consumed.** Tracked under issue #140 for
deletion or implementation decision.

This service is part of an aspirational "generic, RPG-system-agnostic
room generation API" that predates the dnd5e encounter service taking
on room responsibility. The live game generates rooms via rpg-api's
encounter orchestrator (which calls the dungeon component), not this
service.

## File and shape

- `api/v1alpha1/room_environments.proto` — 530 lines.
- 1 service, 8 RPCs, ~30 messages.
- Imports `api/v1alpha1/room_common.proto` (Position, Room, RoomConfig,
  PageInfo, etc.).

## RPCs

| RPC | Purpose |
|---|---|
| `GenerateRoom` | Procedurally generate a room from a `RoomConfig` |
| `GetRoomDetails` | Fetch a generated room |
| `ListRooms` | List rooms (uses `PageInfo` envelope) |
| `UpdateRoom` | Modify a room |
| `DeleteRoom` | Remove a room |
| `ValidateRoomConfig` | Check a config before generating |
| `ListRoomTemplates` | List reusable room templates |
| `CreateRoomTemplate` | Save a template |

## Why this is unused

- The live encounter service has its own `Room` message
  (`dnd5e/api/v1alpha1/encounter.proto:111`) that doesn't import or
  reference this `Room` (`api/v1alpha1/room_common.proto:176`).
- rpg-api's dungeon generator uses toolkit types (`spatial.RoomData`,
  `dungeon.Room`) and converts directly to the dnd5e encounter
  `Room`. The generic shape is bypassed.
- No code in `rpg-api/internal` or `rpg-dnd5e-web/src` references
  `EnvironmentServiceClient` (verified by grep, 2026-05-02).

## What it would cost to keep

- Schema review attention every time `room_common.proto` is touched.
- 530 lines of proto + generated Go + generated TS + generated C++ on
  every CI run.
- Cognitive load: new contributors see two `Room` messages and have to
  learn which is live.

## What it would cost to delete

- A breaking change at the file level (`buf breaking: use: [FILE]`).
  `buf breaking` is blocking in CI; a deletion PR will need the
  `breaking-change-approved` label since this is alpha-package code.
- Generated TypeScript and Go consumers won't be affected — there
  aren't any.

## Recommendation

Delete with the issue #140 cleanup. If the workspace later wants a
generic room API, it can be designed fresh against actual consumer
needs rather than preserved as scaffolding.

## Rule violations (this service)

- **Rule 4 (no proto unused for >1 release)**: this service has
  been defined-but-unused since at least 2025-12 (latest dated
  ADR `002-room-service-architecture.md` is the design context).
- **Rule 6 (naming)**: `Room`, `Entity`, `Wall`, `Door`, `Position`,
  `ValidationResult` — all defined here also exist in
  `dnd5e.api.v1alpha1` or are reused there. The ones reused (Position,
  Wall) are the only ones earning their keep.
