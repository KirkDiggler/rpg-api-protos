---
name: Regenerate content enums
description: How refgen generates typed proto enums from the toolkit registry, and the number-stability contract that makes it safe to rerun
updated: 2026-07-21
confidence: high — verified by reading tools/refgen/*.go end-to-end, diffing generated output, and running the tool
---

# Regenerate content enums

`refgen` is a code generator that turns a `rpg-toolkit` registry into a proto
enum. It's the first piece of the typed-wire foundation (rpg-api-protos#190):
today the wire mostly identifies content with an untyped `Ref { module, type,
id }` triple (`dnd5e/api/v1alpha2/encounter/types.proto:21`); `refgen`-produced
enums are the typed alternative for content the toolkit already enumerates.

**The toolkit is the source of truth for what content exists. The proto enum
is generated, never hand-authored.** If you add a weapon to
`rpg-toolkit/rulebooks/dnd5e/weapons`, you regenerate the proto — you never
add an enum value by hand.

Two enums exist as of this writing:

| Enum | File | Registry | Values |
|---|---|---|---|
| `dnd5e.api.v1alpha2.weapons.Weapon` | `dnd5e/api/v1alpha2/weapons/weapons.proto` | `weapons.All` | 38 |
| `dnd5e.api.v1alpha2.armor.Armor` | `dnd5e/api/v1alpha2/armor/armor.proto` | `armor.All` | 13 |

**Neither enum is wired into anything yet.** They're standalone proto
packages, generated and CI-verified, proving the pattern before the next
increment: rebasing `Item` (see
[equipment-v1alpha2.md](../architecture/components/equipment-v1alpha2.md)) off
`Ref` onto these typed enums.

## Running it

```bash
make refgen
```

This runs the tool (`cd tools/refgen && go run .`) then `buf format -w`. Safe
to run any time — it's idempotent when nothing in the registries changed, and
it never needs network access beyond resolving the toolkit Go module.

`refgen` is deliberately **not** chained into `make generate` / `test` /
`pre-commit`. It resolves a real Go module dependency (the toolkit), which is
a different kind of network dependency than `buf generate`'s remote-plugin
pipeline. Run it explicitly when a registry changes.

## Where it lives

`tools/refgen/` has its own `go.mod`/`go.sum` — a real dependency on
`github.com/KirkDiggler/rpg-toolkit/rulebooks/dnd5e`, isolated from the
repo's root module and from the generated SDK modules (`gen/go`). This is
the only place in the repo that imports the toolkit.

- `refgen.go` — the generic engine: `Category` config, `Generate()`,
  the proto parser/renderer. No toolkit imports; this is what
  `refgen_test.go` exercises directly.
- `main.go` — the toolkit-specific wiring: `weaponsCategory()` and
  `armorCategory()`, each reading a registry's map keys into a `Category`.

## Adding a new category

Add a `Category` + id-source function in `main.go`, following
`weaponsCategory()`/`armorCategory()`:

```go
func fooCategory() Category {
	ids := make([]string, 0, len(foo.All))
	for id := range foo.All {
		ids = append(ids, string(id))
	}
	return Category{
		Name:           "foo",
		RegistrySource: "rpg-toolkit/rulebooks/dnd5e/foo (foo.All)",
		RegistryRef:    "foo.All",
		Noun:           "foos",
		EnumName:       "Foo",
		EnumComment:    []string{"Foo is the typed identity of a dnd5e foo on the wire."},
		Prefix:         "FOO_",
		UnspecComment:  "unset; never a real foo",
		ProtoPackage:   "dnd5e.api.v1alpha2.foo",
		GoPackage:      "github.com/KirkDiggler/rpg-api-protos/gen/go/dnd5e/api/v1alpha2/foo;foopb",
		OutFile:        "dnd5e/api/v1alpha2/foo/foo.proto",
		RegenerateCmd:  "make refgen",
		IDs:            ids,
	}
}
```

Register it in `main()`'s `categories` slice. **Source ids from the
registry's map (its keys), never from the package's raw ID consts** — see
"Registry-sourced, not consts-sourced" below for why.

Per-module design: `dnd5e.weapons.Weapon` is dnd5e/PHB content only. An
add-on module (a future homebrew or artificer ruleset) gets its own enum in
its own package, generated from its own rulebook — never appended to an
existing one.

## The numbering contract (read this before touching a registry)

**Enum numbers are a permanent wire contract.** Once a registry id has a
number, `refgen` never changes it, never reuses it for a different id, and
never lets a removal free it up. Specifically, on every run `Generate()`:

1. Parses the existing `.proto` (if any) and keeps every existing
   id → number assignment, plus every existing `reserved` number.
2. Assigns ids new to the registry the next free number (sorted among
   themselves, so re-running with the same new ids is deterministic).
3. Turns any id that dropped out of the registry into a `reserved <n>;`
   line — the number is retired, never deleted or handed to someone else.

First run, empty file: sorted-by-id, numbered 1..N (0 is permanently
`<PREFIX>_UNSPECIFIED`).

### Reserve the number only — never the name

This is the one non-obvious rule, and it shipped broken once (caught in
review on rpg-api-protos#191, before merge): the first version of `refgen`
reserved **both** the retired value's number and its name
(`reserved 3; reserved "WEAPON_GAMMA";`). That's self-contradictory. An enum
value's name is a pure function of its id (`<PREFIX>` + `UPPER_SNAKE(id)`),
so if a retired id ever reappears in the registry, it regenerates the exact
same name — which then collides with its own `reserved "NAME";` and fails
`buf build`:

```
value WEAPON_BETA is using a reserved name
```

The fix: `refgen` reserves the **number only**. The retired value's old name
is kept as a human-readable trailing comment, not a proto reservation:

```proto
enum Weapon {
  WEAPON_UNSPECIFIED = 0; // unset; never a real weapon

  reserved 3; // WEAPON_GAMMA

  WEAPON_ALPHA = 1; // alpha
  WEAPON_BETA  = 2; // beta
}
```

If `gamma` reappears in the registry later, it gets a **fresh** number (say,
4) — it does not, and must not, reclaim 3.

This is why the tricky cases are covered by tests that actually compile the
output, not just tests that check parsed numbers. A green unit test that
never ran `buf build` on the generated proto is exactly what let the
original bug ship — `tools/refgen/refgen_test.go`'s
`TestGenerate_RemovedID_ProtoCompiles` and
`TestGenerate_RemovedThenReintroducedID_ProtoCompiles` shell out to the real
`buf build` (skipping gracefully if `buf` isn't on `PATH`) specifically to
catch this class of bug again. CI runs the full `tools/refgen` test suite
(`cd tools/refgen && go test ./...`) in the `generate-and-test` job, where
`buf` is already on `PATH` via `buf-setup-action`.

### Known limitation: the generated file IS the ledger

There's no separate history file recording which numbers were ever used —
`Generate()` only ever reads back the state it last wrote into the `.proto`
file itself. The `Code generated ... DO NOT EDIT.` header is doing real
work here: hand-deleting a `reserved` line, or hand-deleting an active
value outside of a registry change, would make `Generate()` believe that
number was never used and hand it out again. Not enforced by the tool —
just don't hand-edit generated files.

## Registry-sourced, not consts-sourced

`refgen` reads a registry's **map keys**, never a package's raw ID consts.
This matters because some packages declare consts that aren't real content.
`rpg-toolkit/rulebooks/dnd5e/weapons/common.go` declares `WeaponID` consts
for every concrete weapon *and* three category placeholders used only for
choice requirements:

```go
const (
	AnySimpleWeapon  WeaponID = "simple-weapon"
	AnyMartialWeapon WeaponID = "martial-weapon"
	AnyWeapon        WeaponID = "any-weapon"
)
```

These three are never inserted into `weapons.All` (the registry map) —
they're choice-requirement markers, not weapons. Because `weaponsCategory()`
iterates `weapons.All`'s keys rather than the const block, they're excluded
from the `Weapon` enum automatically, with no special-case filtering logic
in `refgen` itself. `armor.All` has no such placeholders — every `ArmorID`
const is a real, equippable piece of armor, so all 13 show up in `Armor`.

## Verifying a regeneration

```bash
make refgen                                        # regenerate
git diff --stat                                     # see what moved
make refgen && git diff --exit-code                  # idempotency check — should be silent
buf lint && buf format --diff --exit-code && buf breaking --against '.git#branch=origin/main'
cd tools/refgen && go test ./...                     # includes the buf-build compile checks
```

If a registry entry was removed, expect a new `reserved <n>;` line and
nothing else to move. If `git diff` shows existing numbers changing, stop —
that's the contract breaking, not a normal regeneration.

## See also

- [equipment-v1alpha2.md](../architecture/components/equipment-v1alpha2.md)
  — the equipment surface these enums will eventually type (not wired in
  yet).
- [regenerate-sdks.md](regenerate-sdks.md) — the separate `buf generate`
  step that turns `.proto` into Go/TS SDKs; runs after, not instead of,
  `refgen`.
- `tools/refgen/refgen_test.go` — the number-stability contract as tests,
  including the two `buf build` compile-check tests.
