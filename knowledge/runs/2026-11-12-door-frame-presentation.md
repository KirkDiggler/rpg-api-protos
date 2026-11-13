# Run — 2026-11-12 — Courtyard S4 captured door-frame contract

Slice [Project #906](https://github.com/KirkDiggler/rpg-project/issues/906) of story [Project #867](https://github.com/KirkDiggler/rpg-project/issues/867). Contract [Protos #436](https://github.com/KirkDiggler/rpg-api-protos/pull/436).

## Shipped

- Contract source only: optional visual frame spans and independent door-frame presentation in both session versions; consumer capture, generated binding adoption and play delivery are not claimed here — [PR](https://github.com/KirkDiggler/rpg-api-protos/pull/436).

## Decided

- Capture the door's own fixed-face appearance because an independently permitted door cannot depend on its withheld parent wall; retain existing snapshot/reveal ownership rather than adding a lookup or RPC — [measured boundary and continuation](https://github.com/KirkDiggler/rpg-project/issues/906#issuecomment-6844016998).
- Carry wrapped unitless phase at the aperture centre, not full distance to the wall start, because alignment must not disclose hidden parent extent; provider metadata continues to own resources and repeat size — [contract](https://github.com/KirkDiggler/rpg-api-protos/pull/436).
- Use scalar presence for phase because zero is a valid value, and keep visual frame extent separate from passage width because appearance must not change movement or sight — [contract](https://github.com/KirkDiggler/rpg-api-protos/pull/436).
- KirkDiggler accepted the actual Studio interaction on 2026-11-12; preserve that look instead of adding another appearance-approval loop — [acceptance](https://github.com/KirkDiggler/rpg-project/issues/906#issuecomment-6843793552).

## Found

- Existing independently projected door records carry no material facts or parent identity; both opening messages have free field4 and both door messages have free field8 — [source change](https://github.com/KirkDiggler/rpg-api-protos/commit/f41f652f7f9b0db35d65a18e8ba38d929c6ad372).
- Local contract checks and CI generation/SDK validation pass on the initial contract head; normal published SDK output still requires an authorized merge — [CI](https://github.com/KirkDiggler/rpg-api-protos/actions/runs/43366713993).

## Mistaken

- The workspace-wide doc-genre advisory exits nonzero for 44 findings in unrelated existing root documents, interrupting the initial shell sequence; those findings are reported rather than called green or cleaned up in this contract PR — [checks and limits](https://github.com/KirkDiggler/rpg-api-protos/pull/436).
