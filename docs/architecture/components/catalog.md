# Content catalog

`dnd5e.api.catalog.v1alpha1.CatalogService.ListCatalog` returns the bounded
weapon/spell catalog without a character, turn, or executable declaration.
The [contract](../../../dnd5e/api/catalog/v1alpha1/service.proto) is the source of
truth for fields.

Entries have canonical refs, names, descriptions and ordered provider-authored
display facts. The facts are a projection for inspection, not a second rules
language. Clients render them without parsing formulas or deriving game rules.
A content oneof distinguishes spell level/build coverage from weapon category.

The complete snapshot lets creation choices and later inspection join by ref
without guessing which spell levels or equipment categories need fetching.
Unchosen content remains readable. A failed projection fails the read rather
than producing a silently incomplete snapshot.

This service does not grant spell access, equip weapons, price a character's
action, report live Rage/Bless modifiers, or provide execution selectors.
Character requirements retain selection authority; session declarations retain
execution/affordability authority.

`has_cast_profile` is factual build coverage, not availability for a character.
The separate `not_yet_implemented` flag preserves existing provider metadata for
catalog-only selection/grants; it is not inferred from build coverage.

Binding generation and validation are CI-owned. Consumers adopt the published
SDK output after the contract merges; local generated code is not part of this
contract change.
