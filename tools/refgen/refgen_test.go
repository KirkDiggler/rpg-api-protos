package main

import (
	"os"
	"os/exec"
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

// requireBuf skips the test if the buf CLI isn't on PATH — the compile-check
// tests shell out to the real `buf build` to catch what number/name
// bookkeeping alone can't: whether the generated proto is actually valid.
func requireBuf(t *testing.T) string {
	t.Helper()
	path, err := exec.LookPath("buf")
	if err != nil {
		t.Skip("buf CLI not found on PATH; skipping compile-check")
	}
	return path
}

// bufBuild runs `buf build` against root (which setupRoot seeded with a
// minimal buf.yaml) and returns its combined output alongside any error.
func bufBuild(t *testing.T, bufPath, root string) (string, error) {
	t.Helper()
	cmd := exec.Command(bufPath, "build")
	cmd.Dir = root
	out, err := cmd.CombinedOutput()
	return string(out), err
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

// TestGenerate_RemovedID_ProtoCompiles is a compile-check: bookkeeping
// numbers matching what we expect isn't enough — the generated file has to
// actually be valid protobuf. Runs the real `buf build`.
func TestGenerate_RemovedID_ProtoCompiles(t *testing.T) {
	bufPath := requireBuf(t)
	root := setupRoot(t)

	c := testCategory("alpha", "beta", "gamma")
	if err := Generate(root, c); err != nil {
		t.Fatal(err)
	}
	c2 := testCategory("alpha", "beta") // gamma removed
	if err := Generate(root, c2); err != nil {
		t.Fatal(err)
	}

	out, err := bufBuild(t, bufPath, root)
	if err != nil {
		t.Fatalf("generated proto does not compile after a removal:\n%s\n%s", readOut(t, root, c), out)
	}
}

// TestGenerate_RemovedThenReintroducedID_ProtoCompiles is the tricky case a
// pure number-bookkeeping test can miss entirely: if a retired id's OLD name
// were reserved (not just its number), the id reappearing later would
// regenerate that exact name and collide with its own reservation, and buf
// build would fail even though the numbers all looked correct. This is a
// regression test for that exact failure mode.
func TestGenerate_RemovedThenReintroducedID_ProtoCompiles(t *testing.T) {
	bufPath := requireBuf(t)
	root := setupRoot(t)

	c := testCategory("alpha", "beta")
	if err := Generate(root, c); err != nil {
		t.Fatal(err)
	}
	c2 := testCategory("alpha") // beta removed
	if err := Generate(root, c2); err != nil {
		t.Fatal(err)
	}
	c3 := testCategory("alpha", "beta") // beta reintroduced
	if err := Generate(root, c3); err != nil {
		t.Fatal(err)
	}

	out, err := bufBuild(t, bufPath, root)
	if err != nil {
		t.Fatalf("generated proto does not compile after remove+reintroduce:\n%s\n%s", readOut(t, root, c), out)
	}
}

func TestGenerate_RejectsCollidingGeneratedNames(t *testing.T) {
	root := setupRoot(t)
	// "foo-bar" and "foo_bar" both normalize to WIDGET_FOO_BAR.
	c := testCategory("foo-bar", "foo_bar")
	if err := Generate(root, c); err == nil {
		t.Fatal("expected error for ids that generate the same enum value name")
	}
}

func TestGenerate_RejectsIDCollidingWithUnspecified(t *testing.T) {
	root := setupRoot(t)
	c := testCategory("unspecified")
	if err := Generate(root, c); err == nil {
		t.Fatal("expected error for an id that generates the UNSPECIFIED name")
	}
}

// TestGenerate_TolerantOfCoalescedReservedForms guards parseExisting against
// wedging on `reserved` statement shapes this tool never emits itself
// (comma lists, "to" ranges) but that a future buf version or a hand-applied
// fix might introduce.
func TestGenerate_TolerantOfCoalescedReservedForms(t *testing.T) {
	root := setupRoot(t)
	c := testCategory("alpha")
	proto := `// Code generated. DO NOT EDIT.

syntax = "proto3";

package test.widgets;

option go_package = "example.com/gen/go/test/widgets;widgetspb";

enum Widget {
  WIDGET_UNSPECIFIED = 0; // unset

  reserved 2, 3;
  reserved 5 to 7;

  WIDGET_ALPHA = 1; // alpha
}
`
	if err := os.WriteFile(filepath.Join(root, c.OutFile), []byte(proto), 0o644); err != nil {
		t.Fatal(err)
	}

	_, reserved, err := parseExisting(filepath.Join(root, c.OutFile), c)
	if err != nil {
		t.Fatalf("parseExisting rejected a valid coalesced reserved form: %v", err)
	}
	got := make(map[int32]bool, len(reserved))
	for _, r := range reserved {
		got[r.Number] = true
	}
	for _, want := range []int32{2, 3, 5, 6, 7} {
		if !got[want] {
			t.Errorf("expected reserved number %d to be parsed out of the coalesced forms, got %+v", want, reserved)
		}
	}

	// And Generate() must keep those numbers off-limits for a brand new id.
	c2 := testCategory("alpha", "beta")
	if err := Generate(root, c2); err != nil {
		t.Fatal(err)
	}
	values, _, err := parseExisting(filepath.Join(root, c.OutFile), c2)
	if err != nil {
		t.Fatal(err)
	}
	if got[values["beta"].Number] {
		t.Fatalf("beta was assigned a number reserved via a coalesced form: %d", values["beta"].Number)
	}
	if values["beta"].Number != 8 {
		t.Fatalf("expected beta to get number 8 (first free past the coalesced reservations), got %d", values["beta"].Number)
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
