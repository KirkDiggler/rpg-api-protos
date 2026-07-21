package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// testCategory returns a minimal Category for exercising Generate() without
// depending on any real toolkit registry.
func testCategory(ids ...string) Category {
	return Category{
		Name:           "widgets",
		RegistrySource: "test/widgets (widgets.All)",
		RegistryRef:    "widgets.All",
		Noun:           "widgets",
		EnumName:       "Widget",
		EnumComment:    []string{"Widget is a test enum."},
		Prefix:         "WIDGET_",
		UnspecComment:  "unset",
		ProtoPackage:   "test.widgets",
		GoPackage:      "example.com/gen/go/test/widgets;widgetspb",
		OutFile:        "widgets.proto",
		RegenerateCmd:  "make refgen",
		IDs:            ids,
	}
}

func setupRoot(t *testing.T) string {
	t.Helper()
	root := t.TempDir()
	if err := os.WriteFile(filepath.Join(root, "buf.yaml"), []byte("version: v2\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	return root
}

func readOut(t *testing.T, root string, c Category) string {
	t.Helper()
	b, err := os.ReadFile(filepath.Join(root, c.OutFile))
	if err != nil {
		t.Fatal(err)
	}
	return string(b)
}

func TestGenerate_FirstRun_SortedByIDStartingAtOne(t *testing.T) {
	root := setupRoot(t)
	c := testCategory("gamma", "alpha", "beta")

	if err := Generate(root, c); err != nil {
		t.Fatal(err)
	}

	values, reserved, err := parseExisting(filepath.Join(root, c.OutFile), c)
	if err != nil {
		t.Fatal(err)
	}
	if len(reserved) != 0 {
		t.Fatalf("expected no reserved entries, got %v", reserved)
	}
	want := map[string]int32{"alpha": 1, "beta": 2, "gamma": 3}
	for id, num := range want {
		if values[id].Number != num {
			t.Errorf("id %q: got number %d, want %d", id, values[id].Number, num)
		}
	}
}

func TestGenerate_Idempotent(t *testing.T) {
	root := setupRoot(t)
	c := testCategory("gamma", "alpha", "beta")

	if err := Generate(root, c); err != nil {
		t.Fatal(err)
	}
	first := readOut(t, root, c)

	if err := Generate(root, c); err != nil {
		t.Fatal(err)
	}
	second := readOut(t, root, c)

	if first != second {
		t.Fatalf("Generate is not idempotent:\n--- first ---\n%s\n--- second ---\n%s", first, second)
	}
}

func TestGenerate_AppendsNewIDsWithNextNumber(t *testing.T) {
	root := setupRoot(t)
	c := testCategory("alpha", "beta")
	if err := Generate(root, c); err != nil {
		t.Fatal(err)
	}

	c2 := testCategory("alpha", "beta", "delta", "charlie")
	if err := Generate(root, c2); err != nil {
		t.Fatal(err)
	}

	values, _, err := parseExisting(filepath.Join(root, c.OutFile), c)
	if err != nil {
		t.Fatal(err)
	}
	if values["alpha"].Number != 1 || values["beta"].Number != 2 {
		t.Fatalf("existing ids were renumbered: %+v", values)
	}
	// New ids get the next free numbers, sorted among themselves.
	if values["charlie"].Number != 3 || values["delta"].Number != 4 {
		t.Fatalf("new ids not assigned sorted next numbers: %+v", values)
	}
}

func TestGenerate_RemovedIDBecomesReserved_NeverRenumbered(t *testing.T) {
	root := setupRoot(t)
	c := testCategory("alpha", "beta", "gamma")
	if err := Generate(root, c); err != nil {
		t.Fatal(err)
	}

	// gamma drops out of the registry.
	c2 := testCategory("alpha", "beta")
	if err := Generate(root, c2); err != nil {
		t.Fatal(err)
	}

	values, reserved, err := parseExisting(filepath.Join(root, c.OutFile), c2)
	if err != nil {
		t.Fatal(err)
	}
	if _, ok := values["gamma"]; ok {
		t.Fatalf("removed id gamma should not be an active value")
	}
	if len(reserved) != 1 || reserved[0].Number != 3 || reserved[0].Name != "WIDGET_GAMMA" {
		t.Fatalf("expected gamma's number 3 reserved, got %+v", reserved)
	}

	// A brand new id introduced later must NOT reuse the reserved number.
	c3 := testCategory("alpha", "beta", "delta")
	if err := Generate(root, c3); err != nil {
		t.Fatal(err)
	}
	values, reserved, err = parseExisting(filepath.Join(root, c.OutFile), c3)
	if err != nil {
		t.Fatal(err)
	}
	if values["delta"].Number == 3 {
		t.Fatalf("delta reused reserved number 3")
	}
	if values["delta"].Number != 4 {
		t.Fatalf("expected delta to get number 4, got %d", values["delta"].Number)
	}
	if len(reserved) != 1 || reserved[0].Number != 3 {
		t.Fatalf("reserved entry for gamma should be untouched: %+v", reserved)
	}
}

func TestGenerate_RemovedThenReintroducedID_GetsFreshNumber(t *testing.T) {
	root := setupRoot(t)
	c := testCategory("alpha", "beta")
	if err := Generate(root, c); err != nil {
		t.Fatal(err)
	}

	c2 := testCategory("alpha") // beta removed
	if err := Generate(root, c2); err != nil {
		t.Fatal(err)
	}

	c3 := testCategory("alpha", "beta") // beta reappears
	if err := Generate(root, c3); err != nil {
		t.Fatal(err)
	}

	values, reserved, err := parseExisting(filepath.Join(root, c.OutFile), c3)
	if err != nil {
		t.Fatal(err)
	}
	if values["beta"].Number == 2 {
		t.Fatalf("reintroduced id reused its old (now-reserved) number")
	}
	if values["beta"].Number != 3 {
		t.Fatalf("expected reintroduced beta to get fresh number 3, got %d", values["beta"].Number)
	}
	if len(reserved) != 1 || reserved[0].Number != 2 || reserved[0].Name != "WIDGET_BETA" {
		t.Fatalf("original reservation for beta's old number must remain: %+v", reserved)
	}
}

func TestGenerate_HyphenatedIDConvertsToUpperSnake(t *testing.T) {
	root := setupRoot(t)
	c := testCategory("light-crossbow", "studded-leather")
	if err := Generate(root, c); err != nil {
		t.Fatal(err)
	}
	out := readOut(t, root, c)
	for _, want := range []string{"WIDGET_LIGHT_CROSSBOW", "WIDGET_STUDDED_LEATHER"} {
		if !strings.Contains(out, want) {
			t.Errorf("expected %q in output:\n%s", want, out)
		}
	}
}

func TestGenerate_RejectsDuplicateIDs(t *testing.T) {
	root := setupRoot(t)
	c := testCategory("alpha", "alpha")
	if err := Generate(root, c); err == nil {
		t.Fatal("expected error for duplicate registry ids")
	}
}

func TestGenerate_RejectsHandEditedValueName(t *testing.T) {
	root := setupRoot(t)
	c := testCategory("alpha")
	if err := Generate(root, c); err != nil {
		t.Fatal(err)
	}

	// Hand-corrupt the generated file: rename the value but keep the id comment.
	path := filepath.Join(root, c.OutFile)
	b, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	corrupted := string(b)
	corrupted = strings.Replace(corrupted, "WIDGET_ALPHA = 1", "WIDGET_RENAMED = 1", 1)
	if err := os.WriteFile(path, []byte(corrupted), 0o644); err != nil {
		t.Fatal(err)
	}

	if err := Generate(root, c); err == nil {
		t.Fatal("expected error parsing hand-edited generated file")
	}
}
