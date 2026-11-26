# Run — 2026-11-26 — Courtyard S7 material-channel contract

Slice [rpg-project#1192](https://github.com/KirkDiggler/rpg-project/issues/1192) of [Courtyard#867](https://github.com/KirkDiggler/rpg-project/issues/867).

## Shipped

- Defined a shared presence-aware normal/emissive adjustment leaf and additive observed-member, prop, wall and independent-frame fields; SDK publication and consumer implementation remain separate — [slice](https://github.com/KirkDiggler/rpg-project/issues/1192).

## Decided

- Shared leaf messages use a neutral material subpackage beneath session/presentation, so snapshot and live geometry consume one value without importing each other's version package — [approved design](https://github.com/KirkDiggler/rpg-project/pull/1189).
- Default is absent, Off uses an explicit empty-message oneof arm, and Scale is a finite positive multiplier; source-zero emission stays fixed under the operator's agreement — [agreement](https://github.com/KirkDiggler/rpg-project/pull/1189#issuecomment-7185560714).

## Found

- `PublicMemberInfo`, not position-only `Member`, owns observed appearance on the snapshot wire; field11 extends that owner without adding another disclosure route — [checked finding](https://github.com/KirkDiggler/rpg-project/issues/1192#issuecomment-7185995983).

## Mistaken

- Adding a managed-options file to the legacy presentation package failed Buf's same-package Go/Java option checks; the shared leaf now has its own material subpackage, preserving both checks and all existing generated identities — [slice record](https://github.com/KirkDiggler/rpg-project/issues/1192).

- The initial plan called the target message Member; pre-edit inspection corrected it to PublicMemberInfo before any wire change, leaving the placement message untouched — [correction](https://github.com/KirkDiggler/rpg-project/issues/1192#issuecomment-7185995983).
