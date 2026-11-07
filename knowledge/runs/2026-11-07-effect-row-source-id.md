# 2026-11-07 — preserve effect-row source identity

Work: [Composable conditions S12 #884](https://github.com/KirkDiggler/rpg-project/issues/884), approved [design #2295](https://github.com/KirkDiggler/rpg-toolkit/pull/2295).

## Shipped

- Add optional source_id field 9 to session EffectRow; no existing field, service, package identity or generated output is changed by authoring — [contract](../../dnd5e/api/session/v1alpha1/types.proto).

## Decided

- Carry contributing entity identity explicitly because it may name an item or actor; it is not a stacking qualifier and cannot be reconstructed from the opaque row ID. Empty remains unspecified — [approved source-custody contract](https://github.com/KirkDiggler/rpg-toolkit/pull/2295).

## Found

- Rulebook contributions already produce SourceID, but SDK/wire EffectRow omitted it. The consumer-driven plan now includes the additive field and exact API/web SDK adoption instead of silently losing provenance — [slice #884](https://github.com/KirkDiggler/rpg-project/issues/884).
- make format and make test pass: Buf lint, format, new-options policy and breaking detection against main. Generation and SDK validation/publication remain CI-owned — [authoring contract](../../docs/how-to/run-buf-checks-locally.md).

## Mistaken

- Initial planning assumed the existing wire row could carry all required source facts. Inspection found the missing field; no client-side ID parsing or source-name workaround was used — [slice #884](https://github.com/KirkDiggler/rpg-project/issues/884).

— cross-team agent, on behalf of KirkDiggler
