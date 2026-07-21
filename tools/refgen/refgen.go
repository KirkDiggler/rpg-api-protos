// Package main implements refgen: a codegen tool that generates proto content
// enums 1-to-1 from a rpg-toolkit registry.
//
// The tool never touches proto business logic — it only maintains a single
// enum per configured Category, sourced from that category's registry map
// keys. The core contract (see Generate) is enum-number stability: once a
// registry id has a wire number, that number never changes, is never reused,
// and is never assigned to a different id.
package main

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
)

// Category configures one registry -> one generated proto enum.
type Category struct {
	// Name identifies the category in tool output (e.g. "weapons").
	Name string
	// RegistrySource describes where the ids come from, e.g.
	// "rpg-toolkit/rulebooks/dnd5e/weapons (weapons.All)". Used in the file
	// header.
	RegistrySource string
	// RegistryRef is the short registry reference used in the "1-to-1 with"
	// summary line, e.g. "weapons.All".
	RegistryRef string
	// Noun names one registry entry for the summary line, e.g. "concrete
	// weapons" or "armor pieces".
	Noun string
	// HeaderNote is an optional extra clause appended to the summary line,
	// e.g. explaining excluded category placeholders. Leave empty if there's
	// nothing to call out.
	HeaderNote string

	// EnumName is the proto enum name, e.g. "Weapon".
	EnumName string
	// EnumComment is the doc comment placed directly above the enum. Each
	// element becomes one "// " line.
	EnumComment []string
	// Prefix is prepended to every value name, e.g. "WEAPON_".
	Prefix string
	// UnspecComment is the trailing comment on the generated
	// "<PREFIX>UNSPECIFIED = 0" value.
	UnspecComment string

	// ProtoPackage is the proto package statement, e.g.
	// "dnd5e.api.v1alpha2.weapons".
	ProtoPackage string
	// GoPackage is the full go_package option value, e.g.
	// "github.com/KirkDiggler/rpg-api-protos/gen/go/dnd5e/api/v1alpha2/weapons;weaponspb".
	GoPackage string
	// OutFile is the repo-root-relative path to the generated .proto file.
	OutFile string
	// RegenerateCmd is the command documented in the header for regenerating
	// this file, e.g. "make refgen".
	RegenerateCmd string

	// IDs are the registry's current keys (toolkit ids, e.g. "battleaxe").
	// Order doesn't matter — Generate sorts them.
	IDs []string
}

// reservedEntry is one retired enum value: its number and name are never
// reused.
type reservedEntry struct {
	Number int32
	Name   string
}

// valueEntry is one active enum value.
type valueEntry struct {
	ID     string
	Name   string
	Number int32
}

// Generate reads the existing proto file for c (if any), reconciles it
// against c.IDs, and (re)writes it under repoRoot. Numbering is append-only:
// existing id->number assignments are preserved, new ids get the next free
// number (sorted among themselves for determinism), and ids no longer in the
// registry become reserved rather than deleted or renumbered.
func Generate(repoRoot string, c Category) error {
	if err := validateCategory(c); err != nil {
		return fmt.Errorf("invalid category %q: %w", c.Name, err)
	}

	outPath := filepath.Join(repoRoot, filepath.FromSlash(c.OutFile))

	existingValues, existingReserved, err := parseExisting(outPath, c)
	if err != nil {
		return fmt.Errorf("parsing existing %s: %w", c.OutFile, err)
	}

	ids := append([]string(nil), c.IDs...)
	sort.Strings(ids)
	idSet := make(map[string]bool, len(ids))
	for _, id := range ids {
		idSet[id] = true
	}

	// usedNumbers tracks every number ever handed out (active or reserved) so
	// it's never reassigned.
	usedNumbers := make(map[int32]bool)
	for _, v := range existingValues {
		usedNumbers[v.Number] = true
	}
	for _, r := range existingReserved {
		usedNumbers[r.Number] = true
	}

	// Ids that were active before but have dropped out of the registry
	// become newly reserved.
	reserved := append([]reservedEntry(nil), existingReserved...)
	kept := make(map[string]valueEntry, len(existingValues))
	for id, v := range existingValues {
		if idSet[id] {
			kept[id] = v
			continue
		}
		reserved = append(reserved, reservedEntry{Number: v.Number, Name: v.Name})
	}

	// Assign numbers to ids new to the registry, in sorted order, using the
	// next number past everything ever used. 0 is permanently reserved for
	// <PREFIX>UNSPECIFIED, so numbering always starts at 1.
	nextNumber := int32(1)
	for n := range usedNumbers {
		if n >= nextNumber {
			nextNumber = n + 1
		}
	}

	values := make([]valueEntry, 0, len(ids))
	for _, id := range ids {
		if v, ok := kept[id]; ok {
			values = append(values, v)
			continue
		}
		name := c.Prefix + upperSnake(id)
		values = append(values, valueEntry{ID: id, Name: name, Number: nextNumber})
		usedNumbers[nextNumber] = true
		nextNumber++
	}

	sort.Slice(values, func(i, j int) bool { return values[i].Number < values[j].Number })
	sort.Slice(reserved, func(i, j int) bool { return reserved[i].Number < reserved[j].Number })

	content := render(c, values, reserved)

	if err := os.MkdirAll(filepath.Dir(outPath), 0o755); err != nil {
		return fmt.Errorf("creating output dir: %w", err)
	}
	if err := os.WriteFile(outPath, []byte(content), 0o644); err != nil {
		return fmt.Errorf("writing %s: %w", c.OutFile, err)
	}
	return nil
}

func validateCategory(c Category) error {
	if c.Name == "" || c.EnumName == "" || c.Prefix == "" || c.OutFile == "" {
		return fmt.Errorf("Name, EnumName, Prefix, and OutFile are required")
	}
	seen := make(map[string]bool, len(c.IDs))
	for _, id := range c.IDs {
		if seen[id] {
			return fmt.Errorf("duplicate registry id %q", id)
		}
		seen[id] = true
	}
	return nil
}

// upperSnake converts a toolkit id (hyphenated lower-kebab) into the
// SCREAMING_SNAKE suffix used in enum value names.
// e.g. "light-crossbow" -> "LIGHT_CROSSBOW".
func upperSnake(id string) string {
	return strings.ToUpper(strings.ReplaceAll(id, "-", "_"))
}

// render produces the full .proto file content for c. Output is plain
// (single-space) proto formatting; `buf format -w` is the source of truth for
// final layout and is run as a separate step.
func render(c Category, values []valueEntry, reserved []reservedEntry) string {
	var b strings.Builder

	fmt.Fprintf(&b, "// Code generated from %s. DO NOT EDIT.\n", c.RegistrySource)
	fmt.Fprintf(&b, "// Regenerate with: %s — source of truth is the toolkit registry.\n", c.RegenerateCmd)
	b.WriteString("//\n")
	summary := fmt.Sprintf("1-to-1 with %s (%d %s)", c.RegistryRef, len(values), c.Noun)
	if c.HeaderNote != "" {
		summary += "; " + c.HeaderNote
	}
	fmt.Fprintf(&b, "// %s.\n", summary)
	b.WriteString("\n")

	b.WriteString("syntax = \"proto3\";\n\n")
	fmt.Fprintf(&b, "package %s;\n\n", c.ProtoPackage)
	fmt.Fprintf(&b, "option go_package = \"%s\";\n\n", c.GoPackage)

	for _, line := range c.EnumComment {
		fmt.Fprintf(&b, "// %s\n", line)
	}
	fmt.Fprintf(&b, "enum %s {\n", c.EnumName)
	fmt.Fprintf(&b, "  %sUNSPECIFIED = 0; // %s\n", c.Prefix, c.UnspecComment)

	if len(reserved) > 0 {
		b.WriteString("\n")
		for _, r := range reserved {
			fmt.Fprintf(&b, "  reserved %d;\n", r.Number)
			fmt.Fprintf(&b, "  reserved %q;\n", r.Name)
		}
	}

	if len(values) > 0 {
		b.WriteString("\n")
		for _, v := range values {
			fmt.Fprintf(&b, "  %s = %d; // %s\n", v.Name, v.Number, v.ID)
		}
	}

	b.WriteString("}\n")
	return b.String()
}

var (
	enumStartRe    = regexp.MustCompile(`^enum\s+(\w+)\s*\{\s*$`)
	valueLineRe    = regexp.MustCompile(`^(\w+)\s*=\s*(-?\d+)\s*;\s*(?://\s*(.*))?$`)
	reservedNumRe  = regexp.MustCompile(`^reserved\s+(\d+)\s*;\s*$`)
	reservedNameRe = regexp.MustCompile(`^reserved\s+"([^"]*)"\s*;\s*$`)
)

// parseExisting reads outPath (if it exists) and extracts the current
// id->value assignments and reserved entries for c's enum. A missing file is
// not an error — it just means this is the first run.
func parseExisting(outPath string, c Category) (map[string]valueEntry, []reservedEntry, error) {
	raw, err := os.ReadFile(outPath)
	if os.IsNotExist(err) {
		return map[string]valueEntry{}, nil, nil
	}
	if err != nil {
		return nil, nil, err
	}

	values := map[string]valueEntry{}
	var reserved []reservedEntry
	var pendingReservedNum *int32

	inEnum := false
	unspecName := c.Prefix + "UNSPECIFIED"

	for _, raw := range strings.Split(string(raw), "\n") {
		line := strings.TrimSpace(raw)
		if line == "" {
			continue
		}

		if !inEnum {
			if m := enumStartRe.FindStringSubmatch(line); m != nil && m[1] == c.EnumName {
				inEnum = true
			}
			continue
		}

		if line == "}" {
			inEnum = false
			continue
		}

		if m := reservedNumRe.FindStringSubmatch(line); m != nil {
			n, err := strconv.ParseInt(m[1], 10, 32)
			if err != nil {
				return nil, nil, fmt.Errorf("parsing reserved number %q: %w", line, err)
			}
			num := int32(n)
			pendingReservedNum = &num
			continue
		}
		if m := reservedNameRe.FindStringSubmatch(line); m != nil {
			if pendingReservedNum == nil {
				return nil, nil, fmt.Errorf("reserved name %q with no preceding reserved number", line)
			}
			reserved = append(reserved, reservedEntry{Number: *pendingReservedNum, Name: m[1]})
			pendingReservedNum = nil
			continue
		}

		m := valueLineRe.FindStringSubmatch(line)
		if m == nil {
			return nil, nil, fmt.Errorf("unrecognized line inside enum %s: %q", c.EnumName, line)
		}
		name := m[1]
		n, err := strconv.ParseInt(m[2], 10, 32)
		if err != nil {
			return nil, nil, fmt.Errorf("parsing value number %q: %w", line, err)
		}
		if name == unspecName {
			continue
		}
		id := strings.TrimSpace(m[3])
		if id == "" {
			return nil, nil, fmt.Errorf("value line missing trailing '// <id>' comment: %q", line)
		}
		wantName := c.Prefix + upperSnake(id)
		if wantName != name {
			return nil, nil, fmt.Errorf(
				"value %s (id %q) doesn't match expected generated name %s — file may be hand-edited", name, id, wantName)
		}
		values[id] = valueEntry{ID: id, Name: name, Number: int32(n)}
	}

	if pendingReservedNum != nil {
		return nil, nil, fmt.Errorf("reserved number %d has no matching reserved name statement", *pendingReservedNum)
	}

	return values, reserved, nil
}

// findRepoRoot walks up from start looking for the buf.yaml marker file that
// identifies the rpg-api-protos repo root.
func findRepoRoot(start string) (string, error) {
	dir, err := filepath.Abs(start)
	if err != nil {
		return "", err
	}
	for {
		if _, err := os.Stat(filepath.Join(dir, "buf.yaml")); err == nil {
			return dir, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return "", fmt.Errorf("no buf.yaml found walking up from %s", start)
		}
		dir = parent
	}
}
