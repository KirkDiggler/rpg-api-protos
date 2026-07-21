package main

import (
	"fmt"
	"os"

	"github.com/KirkDiggler/rpg-toolkit/rulebooks/dnd5e/armor"
	"github.com/KirkDiggler/rpg-toolkit/rulebooks/dnd5e/weapons"
)

func main() {
	root, err := findRepoRoot(".")
	if err != nil {
		fmt.Fprintf(os.Stderr, "refgen: %v\n", err)
		os.Exit(1)
	}

	categories := []Category{
		weaponsCategory(),
		armorCategory(),
	}

	for _, c := range categories {
		if err := Generate(root, c); err != nil {
			fmt.Fprintf(os.Stderr, "refgen: %s: %v\n", c.Name, err)
			os.Exit(1)
		}
		fmt.Printf("refgen: wrote %s (%d ids)\n", c.OutFile, len(c.IDs))
	}
}

// weaponsCategory sources the Weapon enum from weapons.All — the registry
// map, not the WeaponID consts. common.go also declares category
// placeholders (AnySimpleWeapon, AnyMartialWeapon, AnyWeapon) for choice
// requirements; those are intentionally NOT in weapons.All and so never reach
// the wire as weapon identities.
func weaponsCategory() Category {
	ids := make([]string, 0, len(weapons.All))
	for id := range weapons.All {
		ids = append(ids, string(id))
	}
	return Category{
		Name:           "weapons",
		RegistrySource: "rpg-toolkit/rulebooks/dnd5e/weapons (weapons.All)",
		RegistryRef:    "weapons.All",
		Noun:           "concrete weapons",
		HeaderNote:     "category placeholders simple-weapon/martial-weapon/any-weapon are choice-requirement consts, not weapons, and are intentionally excluded — they aren't in the registry",
		EnumName:       "Weapon",
		EnumComment: []string{
			"Weapon is the typed identity of a dnd5e weapon on the wire.",
			"Enum value = the toolkit WeaponID; the UI maps it to an asset/behavior.",
			"Numbers are STABLE: append-only, never renumbered or reused (wire contract).",
		},
		Prefix:        "WEAPON_",
		UnspecComment: "unset; never a real weapon",
		ProtoPackage:  "dnd5e.api.v1alpha2.weapons",
		GoPackage:     "github.com/KirkDiggler/rpg-api-protos/gen/go/dnd5e/api/v1alpha2/weapons;weaponspb",
		OutFile:       "dnd5e/api/v1alpha2/weapons/weapons.proto",
		RegenerateCmd: "make refgen",
		IDs:           ids,
	}
}

// armorCategory sources the Armor enum from armor.All. Unlike weapons, the
// armor package declares no category placeholders — every ArmorID const is
// already a concrete, equippable piece of armor in the registry.
func armorCategory() Category {
	ids := make([]string, 0, len(armor.All))
	for id := range armor.All {
		ids = append(ids, string(id))
	}
	return Category{
		Name:           "armor",
		RegistrySource: "rpg-toolkit/rulebooks/dnd5e/armor (armor.All)",
		RegistryRef:    "armor.All",
		Noun:           "armor pieces",
		EnumName:       "Armor",
		EnumComment: []string{
			"Armor is the typed identity of a dnd5e armor piece on the wire.",
			"Enum value = the toolkit ArmorID; the UI maps it to an asset/behavior.",
			"Numbers are STABLE: append-only, never renumbered or reused (wire contract).",
		},
		Prefix:        "ARMOR_",
		UnspecComment: "unset; never a real armor piece",
		ProtoPackage:  "dnd5e.api.v1alpha2.armor",
		GoPackage:     "github.com/KirkDiggler/rpg-api-protos/gen/go/dnd5e/api/v1alpha2/armor;armorpb",
		OutFile:       "dnd5e/api/v1alpha2/armor/armor.proto",
		RegenerateCmd: "make refgen",
		IDs:           ids,
	}
}
