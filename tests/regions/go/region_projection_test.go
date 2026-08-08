package regions

import (
	"bytes"
	"os"
	"path/filepath"
	"testing"

	authoring "github.com/KirkDiggler/rpg-api-protos/gen/go/dnd5e/api/authoring/v1alpha1"
	encounter "github.com/KirkDiggler/rpg-api-protos/gen/go/dnd5e/api/v1alpha2/encounter"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/encoding/prototext"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/reflect/protoreflect"
)

func TestAuthoringRegionParentPresenceSurvivesTextprotoJSONAndBinary(t *testing.T) {
	input := &authoring.FloorPlan{}
	text := readFixture(t, "dnd5e", "api", "authoring", "v1alpha1", "testdata", "floor_plan_regions.textproto")
	if err := prototext.Unmarshal(text, input); err != nil {
		t.Fatalf("unmarshal textproto: %v", err)
	}
	if got := []string{input.Regions[0].Id, input.Regions[1].Id, input.Regions[2].Id}; !equalStrings(got, []string{"inner-sanctum", "outer-hall", "root-sibling"}) {
		t.Fatalf("declaration order = %v", got)
	}
	assertRegion(t, input.Regions[0], "outer-hall")
	assertRegion(t, input.Regions[1], "")
	assertRegion(t, input.Regions[2], "")
	assertSortedCells(t, input.Regions[1].Cells)

	canonicalText, err := prototext.Marshal(input)
	if err != nil {
		t.Fatalf("marshal textproto: %v", err)
	}
	var textRoundTrip authoring.FloorPlan
	if err := prototext.Unmarshal(canonicalText, &textRoundTrip); err != nil {
		t.Fatalf("round-trip textproto: %v", err)
	}
	assertRegion(t, textRoundTrip.Regions[0], "outer-hall")
	assertRegion(t, textRoundTrip.Regions[1], "")

	json, err := protojson.Marshal(input)
	if err != nil {
		t.Fatalf("marshal json: %v", err)
	}
	var jsonRoundTrip authoring.FloorPlan
	if err := protojson.Unmarshal(json, &jsonRoundTrip); err != nil {
		t.Fatalf("unmarshal json: %v", err)
	}
	assertRegion(t, jsonRoundTrip.Regions[0], "outer-hall")
	assertRegion(t, jsonRoundTrip.Regions[1], "")

	binary, err := proto.Marshal(input)
	if err != nil {
		t.Fatalf("marshal binary: %v", err)
	}
	var binaryRoundTrip authoring.FloorPlan
	if err := proto.Unmarshal(binary, &binaryRoundTrip); err != nil {
		t.Fatalf("unmarshal binary: %v", err)
	}
	assertRegion(t, binaryRoundTrip.Regions[0], "outer-hall")
	assertRegion(t, binaryRoundTrip.Regions[1], "")
	if bytes.Equal(mustMarshal(t, input.Regions[0]), mustMarshal(t, input.Regions[1])) {
		t.Fatal("present and absent parent_id serialized identically")
	}
}

func TestAuthoringFloorSourceAndEntrancePresenceSurviveGeneratedRoundTrips(t *testing.T) {
	regionFloor := readAuthoringFixture(t, "floor_plan_region_floor.textproto")
	assertResolvedRegionFloor(t, regionFloor)

	canonicalJSON, err := protojson.Marshal(regionFloor)
	if err != nil {
		t.Fatalf("marshal region floor JSON: %v", err)
	}
	var jsonRoundTrip authoring.FloorPlan
	if err := protojson.Unmarshal(canonicalJSON, &jsonRoundTrip); err != nil {
		t.Fatalf("unmarshal region floor JSON: %v", err)
	}
	assertResolvedRegionFloor(t, &jsonRoundTrip)

	binary, err := proto.Marshal(regionFloor)
	if err != nil {
		t.Fatalf("marshal region floor binary: %v", err)
	}
	var binaryRoundTrip authoring.FloorPlan
	if err := proto.Unmarshal(binary, &binaryRoundTrip); err != nil {
		t.Fatalf("unmarshal region floor binary: %v", err)
	}
	assertResolvedRegionFloor(t, &binaryRoundTrip)

	tinyDraft := readAuthoringFixture(t, "floor_plan_tiny_draft.textproto")
	assertResolvedSource(t, tinyDraft, authoring.FloorPlanFloorSource_FLOOR_PLAN_FLOOR_SOURCE_REGIONS)
	if tinyDraft.Entrance != nil || tinyDraft.ProtoReflect().Has(tinyDraft.ProtoReflect().Descriptor().Fields().ByName("entrance")) {
		t.Fatalf("tiny validate-only draft entrance = %v, want absent", tinyDraft.Entrance)
	}
	if len(tinyDraft.FloorCells) != 2 {
		t.Fatalf("tiny validate-only draft floor cells = %d, want 2", len(tinyDraft.FloorCells))
	}
	assertEntranceAbsentAfterRoundTrips(t, tinyDraft)

	bounds := authoring.FloorPlanFloorSource_FLOOR_PLAN_FLOOR_SOURCE_BOUNDS
	resolvedOmission := &authoring.FloorPlan{FloorSource: &bounds}
	assertResolvedSource(t, resolvedOmission, authoring.FloorPlanFloorSource_FLOOR_PLAN_FLOOR_SOURCE_BOUNDS)

	olderProducer := &authoring.FloorPlan{}
	if olderProducer.FloorSource != nil || olderProducer.ProtoReflect().Has(olderProducer.ProtoReflect().Descriptor().Fields().ByName("floor_source")) {
		t.Fatal("unset older-producer floor_source unexpectedly has presence")
	}
}

func TestRuntimeZoneParentChainAndNoExtents(t *testing.T) {
	input := &encounter.Space{}
	if err := protojson.Unmarshal(readFixture(t, "dnd5e", "api", "v1alpha2", "encounter", "testdata", "zone-parent.json"), input); err != nil {
		t.Fatalf("unmarshal fixture: %v", err)
	}
	if len(input.Zones) != 2 || input.Zones[0].Id != input.Hexes[0].ZoneId {
		t.Fatalf("zones must include innermost zone matching hex zone_id: %#v", input)
	}
	if input.Hexes[1].ZoneId != "" {
		t.Fatalf("root hex zone_id = %q, want empty", input.Hexes[1].ZoneId)
	}
	if input.Zones[0].ParentId == nil || *input.Zones[0].ParentId != "outer-hall" {
		t.Fatalf("inner parent = %v", input.Zones[0].ParentId)
	}
	if input.Zones[1].ParentId != nil {
		t.Fatalf("root parent_id = %v, want absent", input.Zones[1].ParentId)
	}
	for _, field := range []string{"cells", "extent", "hexes", "membership"} {
		if encounter.File_dnd5e_api_v1alpha2_encounter_types_proto.Messages().ByName("Zone").Fields().ByName(protoreflect.Name(field)) != nil {
			t.Fatalf("Zone unexpectedly has runtime extent field %q", field)
		}
	}

	json, err := protojson.Marshal(input)
	if err != nil {
		t.Fatalf("marshal json: %v", err)
	}
	var jsonRoundTrip encounter.Space
	if err := protojson.Unmarshal(json, &jsonRoundTrip); err != nil {
		t.Fatalf("unmarshal json: %v", err)
	}
	binary, err := proto.Marshal(&jsonRoundTrip)
	if err != nil {
		t.Fatalf("marshal binary: %v", err)
	}
	var binaryRoundTrip encounter.Space
	if err := proto.Unmarshal(binary, &binaryRoundTrip); err != nil {
		t.Fatalf("unmarshal binary: %v", err)
	}
	if binaryRoundTrip.Zones[0].ParentId == nil || *binaryRoundTrip.Zones[0].ParentId != "outer-hall" || binaryRoundTrip.Zones[1].ParentId != nil {
		t.Fatal("zone parent presence did not survive round trips")
	}
}

func readAuthoringFixture(t *testing.T, name string) *authoring.FloorPlan {
	t.Helper()
	plan := &authoring.FloorPlan{}
	text := readFixture(t, "dnd5e", "api", "authoring", "v1alpha1", "testdata", name)
	if err := prototext.Unmarshal(text, plan); err != nil {
		t.Fatalf("unmarshal %s: %v", name, err)
	}
	return plan
}

func assertResolvedRegionFloor(t *testing.T, plan *authoring.FloorPlan) {
	t.Helper()
	assertResolvedSource(t, plan, authoring.FloorPlanFloorSource_FLOOR_PLAN_FLOOR_SOURCE_REGIONS)
	if plan.Entrance == nil || !plan.ProtoReflect().Has(plan.ProtoReflect().Descriptor().Fields().ByName("entrance")) {
		t.Fatalf("region floor entrance = %v, want present", plan.Entrance)
	}
	if plan.Entrance.Column != 0 || plan.Entrance.Row != 0 {
		t.Fatalf("region floor entrance = (%d,%d), want (0,0)", plan.Entrance.Column, plan.Entrance.Row)
	}
	if len(plan.FloorCells) != 8 {
		t.Fatalf("region floor cells = %d, want 8", len(plan.FloorCells))
	}
	if len(plan.Edges) != 2 || plan.Edges[0].From.Column != 1 || plan.Edges[0].From.Row != 1 || plan.Edges[1].To.Column != -1 {
		t.Fatalf("representative void/off-canvas pairs changed: %#v", plan.Edges)
	}
}

func assertResolvedSource(t *testing.T, plan *authoring.FloorPlan, want authoring.FloorPlanFloorSource) {
	t.Helper()
	field := plan.ProtoReflect().Descriptor().Fields().ByName("floor_source")
	if plan.FloorSource == nil || !plan.ProtoReflect().Has(field) || *plan.FloorSource != want {
		t.Fatalf("floor_source = %v (present=%v), want present %v", plan.FloorSource, plan.ProtoReflect().Has(field), want)
	}
}

func assertEntranceAbsentAfterRoundTrips(t *testing.T, plan *authoring.FloorPlan) {
	t.Helper()
	json, err := protojson.Marshal(plan)
	if err != nil {
		t.Fatal(err)
	}
	var jsonRoundTrip authoring.FloorPlan
	if err := protojson.Unmarshal(json, &jsonRoundTrip); err != nil {
		t.Fatal(err)
	}
	if jsonRoundTrip.Entrance != nil {
		t.Fatalf("JSON round trip invented entrance: %v", jsonRoundTrip.Entrance)
	}
	binary, err := proto.Marshal(plan)
	if err != nil {
		t.Fatal(err)
	}
	var binaryRoundTrip authoring.FloorPlan
	if err := proto.Unmarshal(binary, &binaryRoundTrip); err != nil {
		t.Fatal(err)
	}
	if binaryRoundTrip.Entrance != nil {
		t.Fatalf("binary round trip invented entrance: %v", binaryRoundTrip.Entrance)
	}
	assertResolvedSource(t, &jsonRoundTrip, authoring.FloorPlanFloorSource_FLOOR_PLAN_FLOOR_SOURCE_REGIONS)
	assertResolvedSource(t, &binaryRoundTrip, authoring.FloorPlanFloorSource_FLOOR_PLAN_FLOOR_SOURCE_REGIONS)
}

func assertRegion(t *testing.T, region *authoring.FloorPlanRegion, wantParent string) {
	t.Helper()
	if wantParent == "" {
		if region.ParentId != nil {
			t.Fatalf("%s parent_id = %v, want absent", region.Id, region.ParentId)
		}
		return
	}
	if region.ParentId == nil || *region.ParentId != wantParent {
		t.Fatalf("%s parent_id = %v, want %q", region.Id, region.ParentId, wantParent)
	}
}
func assertSortedCells(t *testing.T, cells []*authoring.FloorPlanCell) {
	t.Helper()
	for i := 1; i < len(cells); i++ {
		if cells[i-1].Column > cells[i].Column || cells[i-1].Column == cells[i].Column && cells[i-1].Row > cells[i].Row {
			t.Fatalf("cells not lexicographically sorted: %v then %v", cells[i-1], cells[i])
		}
	}
}
func readFixture(t *testing.T, parts ...string) []byte {
	t.Helper()
	path := filepath.Join(append([]string{"..", "..", ".."}, parts...)...)
	b, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read %s: %v", path, err)
	}
	return b
}
func mustMarshal(t *testing.T, message proto.Message) []byte {
	t.Helper()
	b, err := proto.Marshal(message)
	if err != nil {
		t.Fatal(err)
	}
	return b
}
func equalStrings(left, right []string) bool {
	if len(left) != len(right) {
		return false
	}
	for i := range left {
		if left[i] != right[i] {
			return false
		}
	}
	return true
}
