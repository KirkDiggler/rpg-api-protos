package placementoffset

import (
    "bytes"
    "os"
    "path/filepath"
    "testing"

    authoring "github.com/KirkDiggler/rpg-api-protos/gen/go/dnd5e/api/authoring/v1alpha1"
    common "github.com/KirkDiggler/rpg-api-protos/gen/go/dnd5e/api/v1alpha1"
    encounter "github.com/KirkDiggler/rpg-api-protos/gen/go/dnd5e/api/v1alpha2/encounter"
    "google.golang.org/protobuf/encoding/protojson"
    "google.golang.org/protobuf/proto"
    "google.golang.org/protobuf/reflect/protoreflect"
)

type offsetMessage interface {
    proto.Message
    GetOffset() *common.PlacementOffset
}

func TestPlacementOffsetShapeIsExactlyXYZ(t *testing.T) {
    fields := (&common.PlacementOffset{}).ProtoReflect().Descriptor().Fields()
    if fields.Len() != 3 {
        t.Fatalf("PlacementOffset field count = %d, want 3", fields.Len())
    }
    for index, name := range []protoreflect.Name{"x", "y", "z"} {
        field := fields.Get(index)
        if field.Name() != name || field.Number() != protoreflect.FieldNumber(index+1) || field.Kind() != protoreflect.DoubleKind {
            t.Fatalf("field %d = %s/%d/%s, want %s/%d/double", index, field.Name(), field.Number(), field.Kind(), name, index+1)
        }
    }
}

func TestAuthoringPlacementOffsetPresenceAndCompatibility(t *testing.T) {
    testOffsetCases(t, "authoring", filepath.Join("..", "..", "..", "dnd5e", "api", "authoring", "v1alpha1", "testdata"), func() offsetMessage {
        return &authoring.FloorPlanPlacement{}
    })

    // A pre-offset FloorPlan binary contains no field 11 and remains readable.
    legacy, err := proto.Marshal(&authoring.FloorPlan{Width: 9, Height: 7})
    if err != nil { t.Fatal(err) }
    var decoded authoring.FloorPlan
    if err := proto.Unmarshal(legacy, &decoded); err != nil { t.Fatal(err) }
    if len(decoded.Placements) != 0 { t.Fatalf("legacy placements = %d, want 0", len(decoded.Placements)) }
}

func TestPlacementOffsetFlowsThroughAuthoringSnapshotAndLiveEvent(t *testing.T) {
    zero := &common.PlacementOffset{}

    authoringPlan := &authoring.FloorPlan{Placements: []*authoring.FloorPlanPlacement{{Ref: "dnd5e:props:bookcase", Offset: zero}}}
    var decodedPlan authoring.FloorPlan
    roundTrip(t, authoringPlan, &decodedPlan)
    if len(decodedPlan.Placements) != 1 { t.Fatalf("authoring placements = %d, want 1", len(decodedPlan.Placements)) }
    assertOffset(t, decodedPlan.Placements[0].Offset, zero)

    record := &encounter.HexRecord{
        Position: &encounter.Position{},
        Contents: []*encounter.Placement{{EntityId: "bookcase-1", Offset: zero}},
    }
    snapshot := &encounter.Space{Hexes: []*encounter.HexRecord{record}}
    var decodedSnapshot encounter.Space
    roundTrip(t, snapshot, &decodedSnapshot)
    assertOffset(t, decodedSnapshot.Hexes[0].Contents[0].Offset, zero)

    live := &encounter.HexKnowledgeChanged{Hexes: []*encounter.HexRecord{record}}
    var decodedLive encounter.HexKnowledgeChanged
    roundTrip(t, live, &decodedLive)
    assertOffset(t, decodedLive.Hexes[0].Contents[0].Offset, zero)
}

func roundTrip(t *testing.T, input, output proto.Message) {
    t.Helper()
    binary, err := proto.Marshal(input)
    if err != nil { t.Fatalf("marshal: %v", err) }
    if err := proto.Unmarshal(binary, output); err != nil { t.Fatalf("unmarshal: %v", err) }
}

func TestRuntimePlacementOffsetPresenceAndCompatibility(t *testing.T) {
    testOffsetCases(t, "runtime", filepath.Join("..", "..", "..", "dnd5e", "api", "v1alpha2", "encounter", "testdata"), func() offsetMessage {
        return &encounter.Placement{}
    })

    // Historical field-1-only bytes remain readable with offset absent.
    legacy, err := proto.Marshal(&encounter.Placement{EntityId: "legacy-prop"})
    if err != nil { t.Fatal(err) }
    var decoded encounter.Placement
    if err := proto.Unmarshal(legacy, &decoded); err != nil { t.Fatal(err) }
    if decoded.Offset != nil { t.Fatalf("legacy offset = %#v, want absent", decoded.Offset) }
}

func testOffsetCases(t *testing.T, surface, fixtureDir string, newMessage func() offsetMessage) {
    t.Helper()
    cases := []struct {
        name string
        want *common.PlacementOffset
    }{
        {name: "absent"},
        {name: "zero", want: &common.PlacementOffset{}},
        {name: "signed", want: &common.PlacementOffset{X: 0.125, Y: -2.5, Z: 3.75}},
    }
    encoded := make(map[string][]byte, len(cases))
    for _, tc := range cases {
        tc := tc
        t.Run(surface+"-"+tc.name, func(t *testing.T) {
            fixture, err := os.ReadFile(filepath.Join(fixtureDir, "placement-offset-"+tc.name+".json"))
            if err != nil { t.Fatalf("read fixture: %v", err) }
            input := newMessage()
            if err := protojson.Unmarshal(fixture, input); err != nil { t.Fatalf("unmarshal fixture: %v", err) }
            assertOffset(t, input.GetOffset(), tc.want)
            binary, err := proto.Marshal(input)
            if err != nil { t.Fatalf("marshal: %v", err) }
            encoded[tc.name] = binary
            decoded := newMessage()
            if err := proto.Unmarshal(binary, decoded); err != nil { t.Fatalf("unmarshal binary: %v", err) }
            assertOffset(t, decoded.GetOffset(), tc.want)
            jsonRoundTrip, err := protojson.Marshal(decoded)
            if err != nil { t.Fatalf("marshal JSON: %v", err) }
            jsonDecoded := newMessage()
            if err := protojson.Unmarshal(jsonRoundTrip, jsonDecoded); err != nil { t.Fatalf("unmarshal JSON: %v", err) }
            assertOffset(t, jsonDecoded.GetOffset(), tc.want)
        })
    }
    if bytes.Equal(encoded["absent"], encoded["zero"]) {
        t.Fatalf("%s absent offset and explicit zero serialized identically", surface)
    }
}

func assertOffset(t *testing.T, got, want *common.PlacementOffset) {
    t.Helper()
    if want == nil {
        if got != nil { t.Fatalf("offset = %#v, want absent", got) }
        return
    }
    if got == nil { t.Fatal("offset = absent, want present") }
    if got.X != want.X || got.Y != want.Y || got.Z != want.Z {
        t.Fatalf("offset = [%v,%v,%v], want [%v,%v,%v]", got.X, got.Y, got.Z, want.X, want.Y, want.Z)
    }
}
