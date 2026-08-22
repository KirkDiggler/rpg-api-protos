package declarationremaining

import (
	"bytes"
	"os"
	"path/filepath"
	"testing"

	sessionpb "github.com/KirkDiggler/rpg-api-protos/gen/go/dnd5e/api/session/v1alpha1"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"
)

// Declaration.remaining is pointer-optional (rpg-toolkit#1169): absent on an
// Attack declaration, present — including an explicit zero — on a Move one.
// This pins that absent and zero stay distinct through generated Go.
func TestDeclarationRemainingPresenceSurvivesBinaryRoundTrip(t *testing.T) {
	cases := []struct {
		name          string
		fixture       string
		wantRemaining *int32
	}{
		{name: "absent", fixture: "declaration-remaining-absent.json"},
		{name: "explicit-zero", fixture: "declaration-remaining-zero.json", wantRemaining: int32Ptr(0)},
		{name: "explicit-thirty", fixture: "declaration-remaining-thirty.json", wantRemaining: int32Ptr(30)},
	}

	encoded := make(map[string][]byte, len(cases))
	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			fixture, err := os.ReadFile(filepath.Join("..", "..", "..", "dnd5e", "api", "session", "v1alpha1", "testdata", tc.fixture))
			if err != nil {
				t.Fatalf("read fixture: %v", err)
			}

			var input sessionpb.Declaration
			if err := protojson.Unmarshal(fixture, &input); err != nil {
				t.Fatalf("unmarshal fixture: %v", err)
			}
			assertRemaining(t, &input, tc.wantRemaining)

			binary, err := proto.Marshal(&input)
			if err != nil {
				t.Fatalf("marshal declaration: %v", err)
			}
			encoded[tc.name] = binary

			var decoded sessionpb.Declaration
			if err := proto.Unmarshal(binary, &decoded); err != nil {
				t.Fatalf("unmarshal declaration: %v", err)
			}
			assertRemaining(t, &decoded, tc.wantRemaining)
		})
	}

	// The two Move fixtures differ from the Attack one in other fields too, so
	// compare the presence bit in isolation: a Move declaration with remaining
	// cleared must not serialize identically to one with remaining = 0.
	var zero sessionpb.Declaration
	if err := proto.Unmarshal(encoded["explicit-zero"], &zero); err != nil {
		t.Fatalf("unmarshal explicit-zero: %v", err)
	}
	zero.Remaining = nil
	cleared, err := proto.Marshal(&zero)
	if err != nil {
		t.Fatalf("marshal cleared: %v", err)
	}
	if bytes.Equal(cleared, encoded["explicit-zero"]) {
		t.Fatal("absent remaining and explicit remaining=0 serialized identically")
	}
}

func assertRemaining(t *testing.T, decl *sessionpb.Declaration, want *int32) {
	t.Helper()

	if want == nil {
		if decl.Remaining != nil {
			t.Fatalf("remaining presence = %v, want absent", *decl.Remaining)
		}
		return
	}
	if decl.Remaining == nil {
		t.Fatalf("remaining presence = absent, want %d", *want)
	}
	if got := decl.GetRemaining(); got != *want {
		t.Fatalf("remaining = %d, want %d", got, *want)
	}
}

func int32Ptr(value int32) *int32 {
	return &value
}
