package placementoffset

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"testing"

	_ "github.com/KirkDiggler/rpg-api-protos/gen/go/api/v1alpha1"
	authoring "github.com/KirkDiggler/rpg-api-protos/gen/go/dnd5e/api/authoring/v1alpha1"
	_ "github.com/KirkDiggler/rpg-api-protos/gen/go/dnd5e/api/lobby/v1alpha1"
	common "github.com/KirkDiggler/rpg-api-protos/gen/go/dnd5e/api/v1alpha1"
	_ "github.com/KirkDiggler/rpg-api-protos/gen/go/dnd5e/api/v1alpha2/armor"
	_ "github.com/KirkDiggler/rpg-api-protos/gen/go/dnd5e/api/v1alpha2/character"
	encounter "github.com/KirkDiggler/rpg-api-protos/gen/go/dnd5e/api/v1alpha2/encounter"
	_ "github.com/KirkDiggler/rpg-api-protos/gen/go/dnd5e/api/v1alpha2/weapons"
	_ "github.com/KirkDiggler/rpg-api-protos/gen/go/sandbox/api/v1alpha1"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/reflect/protoreflect"
	"google.golang.org/protobuf/reflect/protoregistry"
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

func TestFloorPlanPlacementDescriptorIsExact(t *testing.T) {
	descriptor := (&authoring.FloorPlanPlacement{}).ProtoReflect().Descriptor()
	type expectedField struct {
		name            protoreflect.Name
		number          protoreflect.FieldNumber
		kind            protoreflect.Kind
		message         protoreflect.FullName
		hasPresence     bool
		optionalKeyword bool
	}
	expected := []expectedField{
		{name: "ref", number: 1, kind: protoreflect.StringKind},
		{name: "at", number: 2, kind: protoreflect.MessageKind, message: "dnd5e.api.authoring.v1alpha1.FloorPlanCell", hasPresence: true},
		{name: "facing", number: 3, kind: protoreflect.Uint32Kind, hasPresence: true, optionalKeyword: true},
		{name: "blocks_movement", number: 4, kind: protoreflect.BoolKind},
		{name: "blocks_los", number: 5, kind: protoreflect.BoolKind},
		{name: "source_path", number: 6, kind: protoreflect.StringKind},
		{name: "offset", number: 7, kind: protoreflect.MessageKind, message: "dnd5e.api.v1alpha1.PlacementOffset", hasPresence: true},
	}
	if descriptor.Fields().Len() != len(expected) {
		t.Fatalf("FloorPlanPlacement field count = %d, want %d", descriptor.Fields().Len(), len(expected))
	}
	for index, want := range expected {
		got := descriptor.Fields().Get(index)
		var message protoreflect.FullName
		if got.Message() != nil {
			message = got.Message().FullName()
		}
		if got.Name() != want.name || got.Number() != want.number || got.Kind() != want.kind || message != want.message || got.HasPresence() != want.hasPresence || got.HasOptionalKeyword() != want.optionalKeyword {
			t.Fatalf("field %d = %s/%d/%s/message=%s/presence=%t/optional=%t, want %+v", index, got.Name(), got.Number(), got.Kind(), message, got.HasPresence(), got.HasOptionalKeyword(), want)
		}
	}
}

func TestPlacementOffsetHasOnlyApprovedCarriers(t *testing.T) {
	var references []string
	protoregistry.GlobalFiles.RangeFiles(func(file protoreflect.FileDescriptor) bool {
		collectMessageReferences(file.Messages(), "dnd5e.api.v1alpha1.PlacementOffset", &references)
		return true
	})
	sort.Strings(references)
	want := []string{
		"dnd5e.api.authoring.v1alpha1.FloorPlanPlacement.offset=7",
		"dnd5e.api.v1alpha2.encounter.Placement.offset=3",
	}
	if fmt.Sprint(references) != fmt.Sprint(want) {
		t.Fatalf("PlacementOffset references = %v, want only %v", references, want)
	}
}

func collectMessageReferences(messages protoreflect.MessageDescriptors, target protoreflect.FullName, references *[]string) {
	for index := 0; index < messages.Len(); index++ {
		message := messages.Get(index)
		for fieldIndex := 0; fieldIndex < message.Fields().Len(); fieldIndex++ {
			field := message.Fields().Get(fieldIndex)
			if field.Message() != nil && field.Message().FullName() == target {
				*references = append(*references, fmt.Sprintf("%s.%s=%d", message.FullName(), field.Name(), field.Number()))
			}
		}
		collectMessageReferences(message.Messages(), target, references)
	}
}

func TestAuthoringPlacementMatrixRoundTrip(t *testing.T) {
	var plan authoring.FloorPlan
	loadJSONBinaryJSONRoundTrip(t, authoringFixture("floor-plan-placement-matrix.json"), &plan)

	uint32Ptr := func(value uint32) *uint32 { return &value }
	expected := []struct {
		name           string
		ref            string
		column         int32
		row            int32
		facing         *uint32
		blocksMovement bool
		blocksLOS      bool
		sourcePath     string
		offset         *common.PlacementOffset
	}{
		{name: "room-prop", ref: "dnd5e:props:bookcase", column: 3, row: 2, facing: uint32Ptr(0), blocksMovement: true, blocksLOS: true, sourcePath: "rooms[0].place[0]"},
		{name: "canvas-prop", ref: "dnd5e:props:torch-ornate", column: 12, row: -4, facing: uint32Ptr(5), sourcePath: "canvas.place[0]", offset: &common.PlacementOffset{}},
		{name: "room-monster", ref: "dnd5e:monster:wolf", column: -2, row: 7, blocksMovement: true, blocksLOS: true, sourcePath: "rooms[1].place[0]", offset: &common.PlacementOffset{X: 0.125, Y: -2.5, Z: 3.75}},
		{name: "canvas-monster", ref: "dnd5e:monster:goblin", column: 4, row: 9, blocksMovement: true, sourcePath: "canvas.place[1]", offset: &common.PlacementOffset{X: -1.25, Y: 0.5, Z: -0.75}},
		{name: "room-boss", ref: "dnd5e:monster:dragon", column: 30, row: 12, blocksMovement: true, blocksLOS: true, sourcePath: "rooms[2].boss", offset: &common.PlacementOffset{X: 5, Y: -1, Z: 0.25}},
	}
	if len(plan.Placements) != len(expected) {
		t.Fatalf("placements = %d, want %d", len(plan.Placements), len(expected))
	}
	for index, want := range expected {
		t.Run(want.name, func(t *testing.T) {
			got := plan.Placements[index]
			if got.Ref != want.ref || got.GetAt().GetColumn() != want.column || got.GetAt().GetRow() != want.row || got.BlocksMovement != want.blocksMovement || got.BlocksLos != want.blocksLOS || got.SourcePath != want.sourcePath {
				t.Fatalf("placement = ref=%q at=[%d,%d] blockers=[%t,%t] source=%q, want %+v", got.Ref, got.GetAt().GetColumn(), got.GetAt().GetRow(), got.BlocksMovement, got.BlocksLos, got.SourcePath, want)
			}
			assertFacing(t, got.Facing, want.facing)
			assertOffset(t, got.Offset, want.offset)
		})
	}
}

func TestAuthoringAndRuntimeOffsetPresenceAndCompatibility(t *testing.T) {
	testOffsetCases(t, "authoring", authoringFixture(""), func() offsetMessage { return &authoring.FloorPlanPlacement{} })
	testOffsetCases(t, "runtime", runtimeFixture(""), func() offsetMessage { return &encounter.Placement{} })

	legacyPlan, err := proto.Marshal(&authoring.FloorPlan{Width: 9, Height: 7})
	if err != nil {
		t.Fatal(err)
	}
	var decodedPlan authoring.FloorPlan
	if err := proto.Unmarshal(legacyPlan, &decodedPlan); err != nil {
		t.Fatal(err)
	}
	if len(decodedPlan.Placements) != 0 {
		t.Fatalf("legacy placements = %d, want 0", len(decodedPlan.Placements))
	}

	legacyPlacement, err := proto.Marshal(&encounter.Placement{EntityId: "legacy-prop"})
	if err != nil {
		t.Fatal(err)
	}
	var decodedPlacement encounter.Placement
	if err := proto.Unmarshal(legacyPlacement, &decodedPlacement); err != nil {
		t.Fatal(err)
	}
	if decodedPlacement.Offset != nil {
		t.Fatalf("legacy offset = %#v, want absent", decodedPlacement.Offset)
	}
}

func TestAuthorizedSnapshotAndLivePlacementJoins(t *testing.T) {
	var snapshot encounter.Space
	loadJSONBinaryJSONRoundTrip(t, runtimeFixture("placement-offset-space.json"), &snapshot)
	assertAuthorizedPlacementJoins(t, snapshot.Hexes, snapshot.Entities)

	var live encounter.HexKnowledgeChanged
	loadJSONBinaryJSONRoundTrip(t, runtimeFixture("placement-offset-knowledge-change.json"), &live)
	assertAuthorizedPlacementJoins(t, live.Hexes, live.Entities)
}

func assertAuthorizedPlacementJoins(t *testing.T, hexes []*encounter.HexRecord, entities []*encounter.Entity) {
	t.Helper()
	if len(hexes) != 1 || len(hexes[0].Contents) != 5 {
		t.Fatalf("authorized hex/content counts = %d/%d, want 1/5", len(hexes), len(hexes[0].GetContents()))
	}
	byID := make(map[string]*encounter.Entity, len(entities))
	for _, entity := range entities {
		byID[entity.Id] = entity
	}
	expected := []struct {
		entityID string
		kind     encounter.EntityType
		offset   *common.PlacementOffset
	}{
		{entityID: "room-prop-1", kind: encounter.EntityType_ENTITY_TYPE_PROP},
		{entityID: "canvas-prop-1", kind: encounter.EntityType_ENTITY_TYPE_PROP, offset: &common.PlacementOffset{}},
		{entityID: "room-monster-1", kind: encounter.EntityType_ENTITY_TYPE_MONSTER, offset: &common.PlacementOffset{X: 0.125, Y: -2.5, Z: 3.75}},
		{entityID: "canvas-monster-1", kind: encounter.EntityType_ENTITY_TYPE_MONSTER, offset: &common.PlacementOffset{X: -1.25, Y: 0.5, Z: -0.75}},
		{entityID: "room-boss-1", kind: encounter.EntityType_ENTITY_TYPE_MONSTER, offset: &common.PlacementOffset{X: 5, Y: -1, Z: 0.25}},
	}
	for index, want := range expected {
		placement := hexes[0].Contents[index]
		if placement.EntityId != want.entityID {
			t.Fatalf("placement[%d].entity_id = %q, want %q", index, placement.EntityId, want.entityID)
		}
		entity := byID[placement.EntityId]
		if entity == nil || entity.Id != placement.EntityId {
			t.Fatalf("placement %q has no exact entity join", placement.EntityId)
		}
		if entity.Type != want.kind {
			t.Fatalf("entity %q type = %s, want %s", entity.Id, entity.Type, want.kind)
		}
		if want.kind == encounter.EntityType_ENTITY_TYPE_PROP && (entity.GetProp() == nil || entity.GetMonster() != nil) {
			t.Fatalf("entity %q discriminator is not prop", entity.Id)
		}
		if want.kind == encounter.EntityType_ENTITY_TYPE_MONSTER && (entity.GetMonster() == nil || entity.GetProp() != nil) {
			t.Fatalf("entity %q discriminator is not monster (boss uses monster shape)", entity.Id)
		}
		assertOffset(t, placement.Offset, want.offset)
	}
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
			if err != nil {
				t.Fatalf("read fixture: %v", err)
			}
			input := newMessage()
			if err := protojson.Unmarshal(fixture, input); err != nil {
				t.Fatalf("unmarshal fixture: %v", err)
			}
			assertOffset(t, input.GetOffset(), tc.want)
			binary, err := proto.Marshal(input)
			if err != nil {
				t.Fatalf("marshal: %v", err)
			}
			encoded[tc.name] = binary
			decoded := newMessage()
			if err := proto.Unmarshal(binary, decoded); err != nil {
				t.Fatalf("unmarshal binary: %v", err)
			}
			assertOffset(t, decoded.GetOffset(), tc.want)
			jsonRoundTrip, err := protojson.Marshal(decoded)
			if err != nil {
				t.Fatalf("marshal JSON: %v", err)
			}
			jsonDecoded := newMessage()
			if err := protojson.Unmarshal(jsonRoundTrip, jsonDecoded); err != nil {
				t.Fatalf("unmarshal JSON: %v", err)
			}
			assertOffset(t, jsonDecoded.GetOffset(), tc.want)
		})
	}
	if bytes.Equal(encoded["absent"], encoded["zero"]) {
		t.Fatalf("%s absent offset and explicit zero serialized identically", surface)
	}
}

func loadJSONBinaryJSONRoundTrip(t *testing.T, fixturePath string, message proto.Message) {
	t.Helper()
	fixture, err := os.ReadFile(fixturePath)
	if err != nil {
		t.Fatalf("read %s: %v", fixturePath, err)
	}
	if err := protojson.Unmarshal(fixture, message); err != nil {
		t.Fatalf("unmarshal %s: %v", fixturePath, err)
	}
	binary, err := proto.Marshal(message)
	if err != nil {
		t.Fatalf("marshal binary: %v", err)
	}
	proto.Reset(message)
	if err := proto.Unmarshal(binary, message); err != nil {
		t.Fatalf("unmarshal binary: %v", err)
	}
	jsonRoundTrip, err := protojson.Marshal(message)
	if err != nil {
		t.Fatalf("marshal JSON: %v", err)
	}
	proto.Reset(message)
	if err := protojson.Unmarshal(jsonRoundTrip, message); err != nil {
		t.Fatalf("unmarshal JSON: %v", err)
	}
}

func authoringFixture(name string) string {
	return filepath.Join("..", "..", "..", "dnd5e", "api", "authoring", "v1alpha1", "testdata", name)
}

func runtimeFixture(name string) string {
	return filepath.Join("..", "..", "..", "dnd5e", "api", "v1alpha2", "encounter", "testdata", name)
}

func assertFacing(t *testing.T, got, want *uint32) {
	t.Helper()
	if want == nil {
		if got != nil {
			t.Fatalf("facing = %v, want absent", *got)
		}
		return
	}
	if got == nil || *got != *want {
		t.Fatalf("facing = %v, want %d", got, *want)
	}
}

func assertOffset(t *testing.T, got, want *common.PlacementOffset) {
	t.Helper()
	if want == nil {
		if got != nil {
			t.Fatalf("offset = %#v, want absent", got)
		}
		return
	}
	if got == nil {
		t.Fatal("offset = absent, want present")
	}
	if got.X != want.X || got.Y != want.Y || got.Z != want.Z {
		t.Fatalf("offset = [%v,%v,%v], want [%v,%v,%v]", got.X, got.Y, got.Z, want.X, want.Y, want.Z)
	}
}
