import { fromBinary, fromJson, toBinary, toJson, type JsonValue } from "@bufbuild/protobuf";
import { FloorPlanSchema } from "../../../gen/ts/dnd5e/api/authoring/v1alpha1/service_pb.js";
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

const space = fromJson(SpaceSchema, runtimeFixture as JsonValue);
assert(space.hexes[0].zoneId === space.zones[0].id, "fixture includes disclosed innermost Zone");
assert(space.hexes[1].zoneId === "", "implicit root zone_id is empty");
assert(space.zones[0].parentId === "outer-hall" && space.zones[1].parentId === undefined, "runtime parent chain presence");
const runtimeRoundTrip = fromBinary(SpaceSchema, toBinary(SpaceSchema, space));
assert(runtimeRoundTrip.zones[0].parentId === "outer-hall" && runtimeRoundTrip.zones[1].parentId === undefined, "runtime binary parent presence");
for (const forbidden of ["cells", "extent", "hexes", "membership"]) assert(!(forbidden in ZoneSchema.fields), `runtime Zone has no ${forbidden} field`);
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
