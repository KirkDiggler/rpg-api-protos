import { fromBinary, fromJson, toBinary, toJson, type JsonValue } from "@bufbuild/protobuf";
import { FloorPlanFloorSource, FloorPlanSchema } from "../../../gen/ts/dnd5e/api/authoring/v1alpha1/service_pb.js";
import { SpaceSchema, ZoneSchema } from "../../../gen/ts/dnd5e/api/v1alpha2/encounter/types_pb.js";
import runtimeFixture from "../../../dnd5e/api/v1alpha2/encounter/testdata/zone-parent.json" with { type: "json" };

const authoring = fromJson(FloorPlanSchema, { regions: [
  { id: "inner-sanctum", cells: [{ column: 2, row: 1 }], parentId: "outer-hall" },
  { id: "outer-hall", cells: [{ column: 1, row: 1 }] },
] } as JsonValue);
assert(authoring.regions[0].parentId === "outer-hall", "authoring child parent presence");
assert(authoring.regions[1].parentId === undefined, "authoring root parent absence");
const authoringRoundTrip = fromBinary(FloorPlanSchema, toBinary(FloorPlanSchema, authoring));
assert(authoringRoundTrip.regions[0].parentId === "outer-hall" && authoringRoundTrip.regions[1].parentId === undefined, "authoring binary parent presence");
assert((toJson(FloorPlanSchema, authoringRoundTrip) as { regions: Array<{ parentId?: string }> }).regions[1].parentId === undefined, "authoring JSON root absence");

const regionFloor = fromJson(FloorPlanSchema, {
  width: 3,
  height: 3,
  floorSource: "FLOOR_PLAN_FLOOR_SOURCE_REGIONS",
  floorCells: [
    { column: 0, row: 0 }, { column: 0, row: 1 }, { column: 0, row: 2 },
    { column: 1, row: 0 }, { column: 1, row: 2 },
    { column: 2, row: 0 }, { column: 2, row: 1 }, { column: 2, row: 2 },
  ],
  entrance: { column: 0, row: 0 },
  edges: [
    { from: { column: 1, row: 1 }, to: { column: 1, row: 0 }, kind: "FLOOR_PLAN_EDGE_KIND_SOLID" },
    { from: { column: 0, row: 0 }, to: { column: -1, row: 0 }, kind: "FLOOR_PLAN_EDGE_KIND_SOLID" },
  ],
} as JsonValue);
assert(regionFloor.floorSource === FloorPlanFloorSource.REGIONS, "generated regions discriminator");
assert(regionFloor.entrance?.column === 0 && regionFloor.entrance.row === 0, "present (0,0) entrance");
assert(regionFloor.floorCells.length === 8, "exact region floor mask");
assert(regionFloor.edges[0].from?.column === 1 && regionFloor.edges[1].to?.column === -1, "flat void/off-canvas pairs");
const regionFloorRoundTrip = fromBinary(FloorPlanSchema, toBinary(FloorPlanSchema, regionFloor));
assert(regionFloorRoundTrip.floorSource === FloorPlanFloorSource.REGIONS, "binary regions discriminator");
assert(regionFloorRoundTrip.entrance?.column === 0 && regionFloorRoundTrip.entrance.row === 0, "binary present (0,0) entrance");
const regionFloorJson = toJson(FloorPlanSchema, regionFloorRoundTrip) as { floorSource?: string; entrance?: { column?: number; row?: number } };
assert(regionFloorJson.floorSource === "FLOOR_PLAN_FLOOR_SOURCE_REGIONS" && regionFloorJson.entrance !== undefined, "JSON source and entrance presence");

const tinyDraft = fromJson(FloorPlanSchema, {
  width: 3,
  height: 3,
  floorSource: "FLOOR_PLAN_FLOOR_SOURCE_REGIONS",
  floorCells: [{ column: 1, row: 1 }, { column: 1, row: 2 }],
} as JsonValue);
assert(tinyDraft.floorSource === FloorPlanFloorSource.REGIONS, "tiny draft resolved source");
assert(tinyDraft.entrance === undefined, "tiny validate-only draft entrance absence");
const tinyDraftRoundTrip = fromBinary(FloorPlanSchema, toBinary(FloorPlanSchema, tinyDraft));
assert(tinyDraftRoundTrip.floorSource === FloorPlanFloorSource.REGIONS && tinyDraftRoundTrip.entrance === undefined, "tiny draft binary presence");
assert((toJson(FloorPlanSchema, tinyDraftRoundTrip) as { entrance?: unknown }).entrance === undefined, "tiny draft JSON entrance absence");

const resolvedOmission = fromJson(FloorPlanSchema, { floorSource: "FLOOR_PLAN_FLOOR_SOURCE_BOUNDS" } as JsonValue);
assert(resolvedOmission.floorSource === FloorPlanFloorSource.BOUNDS, "omitted YAML resolves to generated bounds discriminator");
assert(fromJson(FloorPlanSchema, {}).floorSource === undefined, "older producer floor source stays detectably absent");

const space = fromJson(SpaceSchema, runtimeFixture as JsonValue);
assert(space.hexes[0].zoneId === space.zones[0].id, "fixture includes disclosed innermost Zone");
assert(space.hexes[1].zoneId === "", "implicit root zone_id is empty");
assert(space.zones[0].parentId === "outer-hall" && space.zones[1].parentId === undefined, "runtime parent chain presence");
const runtimeRoundTrip = fromBinary(SpaceSchema, toBinary(SpaceSchema, space));
assert(runtimeRoundTrip.zones[0].parentId === "outer-hall" && runtimeRoundTrip.zones[1].parentId === undefined, "runtime binary parent presence");
for (const forbidden of ["cells", "extent", "hexes", "membership"]) assert(!(forbidden in ZoneSchema.fields), `runtime Zone has no ${forbidden} field`);
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
