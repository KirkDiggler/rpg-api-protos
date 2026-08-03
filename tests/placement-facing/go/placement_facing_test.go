package placementfacing

import (
	"bytes"
	"os"
	"path/filepath"
	"testing"

	encounter "github.com/KirkDiggler/rpg-api-protos/gen/go/dnd5e/api/v1alpha2/encounter"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"
)

func TestPlacementFacingPresenceSurvivesBinaryRoundTrip(t *testing.T) {
	cases := []struct {
		name       string
		fixture    string
		wantFacing *uint32
	}{
		{name: "absent", fixture: "placement-facing-absent.json"},
		{name: "explicit-east-zero", fixture: "placement-facing-east.json", wantFacing: uint32Ptr(0)},
		{name: "explicit-southwest", fixture: "placement-facing-southwest.json", wantFacing: uint32Ptr(4)},
	}

	encoded := make(map[string][]byte, len(cases))
	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			fixture, err := os.ReadFile(filepath.Join("..", "..", "..", "dnd5e", "api", "v1alpha2", "encounter", "testdata", tc.fixture))
			if err != nil {
				t.Fatalf("read fixture: %v", err)
			}

			var input encounter.Placement
			if err := protojson.Unmarshal(fixture, &input); err != nil {
				t.Fatalf("unmarshal fixture: %v", err)
			}
			assertFacing(t, &input, tc.wantFacing)

			binary, err := proto.Marshal(&input)
			if err != nil {
				t.Fatalf("marshal placement: %v", err)
			}
			encoded[tc.name] = binary

			var decoded encounter.Placement
			if err := proto.Unmarshal(binary, &decoded); err != nil {
				t.Fatalf("unmarshal placement: %v", err)
			}
			assertFacing(t, &decoded, tc.wantFacing)
		})
	}

	if bytes.Equal(encoded["absent"], encoded["explicit-east-zero"]) {
		t.Fatal("absent facing and explicit facing=0 serialized identically")
	}
}

func assertFacing(t *testing.T, placement *encounter.Placement, want *uint32) {
	t.Helper()

	if want == nil {
		if placement.Facing != nil {
			t.Fatalf("facing presence = %v, want absent", placement.Facing)
		}
		return
	}
	if placement.Facing == nil {
		t.Fatalf("facing presence = absent, want %d", *want)
	}
	if got := *placement.Facing; got != *want {
		t.Fatalf("facing = %d, want %d", got, *want)
	}
}

func uint32Ptr(value uint32) *uint32 {
	return &value
}
