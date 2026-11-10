# Run — 2026-11-11 — gate conversation S3 speak address

Slice [rpg-project#923](https://github.com/KirkDiggler/rpg-project/issues/923) of story [rpg-project#769](https://github.com/KirkDiggler/rpg-project/issues/769). Base: `rpg-api-protos` `main` at [`a10de13`](https://github.com/KirkDiggler/rpg-api-protos/commit/a10de131f9f4594be7536af32dd2d0324c11ef6e).

One line per entry. Every line ends with a link: a PR, an issue comment, a commit, or a design section anchor. This file rides on the work PR, under the `knowledge/runs/` of the lowest directory that contains everything the PR changed. The ingest reads it once and adds a `processed:` line at the top; nobody else edits it after merge.

## Shipped

- `session.v1alpha1.SpeakAddress{guard_member_id = 1, interaction_id = 2}` and `Declaration.address = 24`, carried on the addressed member's Speak row beside `speak_options` — [rpg-project#923](https://github.com/KirkDiggler/rpg-project/issues/923).

## Decided

- The address rides `Declaration` (the Afford Speak row), not `GetViewResponse`, so the reply panel has one source with the options it opens on — [rpg-project#923 How it works](https://github.com/KirkDiggler/rpg-project/issues/923).
- A singular message field (presence by message) rather than two loose strings on `Declaration`, so "no address" is one absent field, never two empty strings — [rpg-project#923](https://github.com/KirkDiggler/rpg-project/issues/923).
- `guard_member_id` names a member the way `SpeakOption.member_id` does; `interaction_id` is opaque, as `option_id` is — [rpg-project#923](https://github.com/KirkDiggler/rpg-project/issues/923).
- Field 24 is the next free number on `Declaration` (4 and 6 stay reserved); nothing renumbered — [rpg-project#923](https://github.com/KirkDiggler/rpg-project/issues/923).

## Found

- No session proto names an interaction id before this field; `SpeakAddress.interaction_id` is the first — [rpg-project#923](https://github.com/KirkDiggler/rpg-project/issues/923).

## Mistaken

- none observed — [rpg-project#923](https://github.com/KirkDiggler/rpg-project/issues/923).
