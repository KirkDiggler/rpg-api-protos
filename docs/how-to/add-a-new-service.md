---
name: Add a new service
description: When and how to add a new gRPC service to rpg-api-protos
updated: 2026-05-02
confidence: high — based on patterns established by EncounterService and DiceService
---

# Add a new service

A new service is a significant contract addition. Most "new
functionality" should be a new RPC on an existing service rather
than a new service. Only add a service when the new functionality
has its own bounded context.

## Decide first: new service or new RPC?

Ask in this order:

1. **Does it belong on an existing service?** Most CRUD-like ops on an
   existing entity belong on the existing service. A new "GetCharacterX"
   RPC goes on `CharacterService`, not its own service.

2. **Does it have its own ownership boundary?** `DiceService` was a new
   service because it's RPG-system-agnostic and has its own
   entity+context model. `EncounterService` was a new service because
   encounters are a distinct aggregate. If your new functionality is
   "the same data with a different operation," it goes on the
   existing service.

3. **Will multiple services reasonably share it?** `DiceService` is
   used by character creation today and will be used by combat
   tomorrow. If the answer is "only one consumer ever," prefer an RPC
   on the existing service.

If the answer to all three is "yes," design a new service. If any is
"no," add an RPC.

## Design checklist before writing proto

- [ ] **Name.** `<Domain>Service`. Pick a domain that's a noun, not a
      verb. "EncounterService" not "ManageEncounterService".
- [ ] **Package.** `dnd5e/api/v1alpha1` for D&D-specific.
      `api/v1alpha1` for system-agnostic. New top-level packages need
      strong justification.
- [ ] **Versioning.** Start at `v1alpha1`. The repo's lint config
      excepts `PACKAGE_VERSION_SUFFIX` so this is fine.
- [ ] **Error pattern.** Use `bool success = 1; string error = 2;`
      unless you have a strong reason to design a typed error. See
      [data-model.md error patterns](../architecture/data-model.md#error-patterns-inconsistent).
- [ ] **Pagination pattern (if listing).** Use AIP-158 inline:
      `int32 page_size`, `string page_token`, `string next_page_token`,
      `int32 total_size`. See
      [data-model.md pagination](../architecture/data-model.md#pagination-patterns-inconsistent).
- [ ] **Naming.** PascalCase RPC verbs and message names; snake_case
      fields; `<TYPE>_<UPPER_SNAKE>` enums with `_UNSPECIFIED = 0`.
- [ ] **Reuse.** Check `api/v1alpha1/room_common.proto` and
      `dnd5e/api/v1alpha1/common.proto` for existing types before
      defining your own. Position, GridType, AbilityScores, Modifier,
      Resource, Condition, ValidationResult, SourceRef are all
      candidates.
- [ ] **Type-name collisions.** Search the repo for your proposed
      message names. Don't add a third `Room` or a fourth `Entity`.

## Writing the proto

1. Create the file: `dnd5e/api/v1alpha1/<domain>.proto` or
   `api/v1alpha1/<domain>.proto`.

2. Header:
   ```proto
   syntax = "proto3";

   package dnd5e.api.v1alpha1;   // or api.v1alpha1

   import "dnd5e/api/v1alpha1/common.proto";   // as needed

   option go_package = "github.com/KirkDiggler/rpg-api-protos/gen/go/dnd5e/api/v1alpha1;v1alpha1";
   option java_multiple_files = true;
   option java_package = "com.kirkdiggler.rpg.api.dnd5e.v1alpha1";
   ```

3. Define messages first (request/response pairs), then the service
   block at the bottom.

4. Document each RPC with a comment explaining what it does and any
   precondition. Look at `dice.proto:5-16` for a clean example.

## Verifying

```bash
buf format -w
buf lint                                           # must pass
buf format --diff --exit-code                      # must pass
buf breaking --against "https://github.com/KirkDiggler/rpg-api-protos.git#branch=main"   # should pass — adding a service is non-breaking
buf generate                                       # must produce output
```

## Updating docs in the same PR

A new service is a doc change too:

1. **`docs/architecture/components/<service-name>.md`** — new file
   following the shape of `dice-service.md` or `encounter-service.md`.
2. **`docs/architecture/overview.md`** — add to the repo layout block;
   add to the file list.
3. **`docs/architecture/data-model.md`** — if your service introduces
   new shared types, document them in the building-blocks section.
4. **`docs/status.md`** — add a per-service confidence row.
5. **`docs/quality.md`** — add a per-service grade with rationale.

## After merge

- CI auto-publishes the new service to npm and Go modules.
- rpg-api adds a handler and orchestrator (its own PR; outside-in
  pattern from rpg-api/CLAUDE.md).
- rpg-dnd5e-web adds Connect-ES client usage.

## Anti-patterns to avoid

- **Don't add a service speculatively.** Schema-without-consumer is
  the Rule 4 violation that produced the ~5,000 lines of unused proto
  in this repo (issue #140). If you don't have a consumer in flight,
  delay.
- **Don't redefine existing types.** `sandbox.api.v1alpha1` defined its
  own `EntitySize` instead of importing the dnd5e one. That's now an
  issue #140 cleanup item.
- **Don't invent a new error envelope.** The dominant pattern is
  `bool success + string error`. Match it unless you have a strong
  reason.
- **Don't invent a new pagination pattern.** Use the AIP-158 inline
  shape used by every live list RPC.

## Worked examples

- `dice.proto` (live, A- grade) — 3 RPCs, leaf imports, focused on a
  single concern.
- `encounter.proto` (live, B- grade) — large service that grew over
  time; carries debt from migrations.
- `room_environments.proto` (defined-not-consumed, C grade) —
  cautionary tale; what to delete rather than emulate.
