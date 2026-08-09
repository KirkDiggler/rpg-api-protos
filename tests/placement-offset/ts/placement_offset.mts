import { fromBinary, fromJson, toBinary, toJson, type DescMessage, type JsonValue, type MessageShape } from "@bufbuild/protobuf";

import { FloorPlanPlacementSchema, FloorPlanSchema } from "../../../gen/ts/dnd5e/api/authoring/v1alpha1/service_pb.js";
import { PlacementOffsetSchema } from "../../../gen/ts/dnd5e/api/v1alpha1/common_pb.js";
import { HexKnowledgeChangedSchema } from "../../../gen/ts/dnd5e/api/v1alpha2/encounter/events_pb.js";
import { PlacementSchema, SpaceSchema } from "../../../gen/ts/dnd5e/api/v1alpha2/encounter/types_pb.js";

import authoringAbsent from "../../../dnd5e/api/authoring/v1alpha1/testdata/placement-offset-absent.json" with { type: "json" };
import authoringZero from "../../../dnd5e/api/authoring/v1alpha1/testdata/placement-offset-zero.json" with { type: "json" };
import authoringSigned from "../../../dnd5e/api/authoring/v1alpha1/testdata/placement-offset-signed.json" with { type: "json" };
import runtimeAbsent from "../../../dnd5e/api/v1alpha2/encounter/testdata/placement-offset-absent.json" with { type: "json" };
import runtimeZero from "../../../dnd5e/api/v1alpha2/encounter/testdata/placement-offset-zero.json" with { type: "json" };
import runtimeSigned from "../../../dnd5e/api/v1alpha2/encounter/testdata/placement-offset-signed.json" with { type: "json" };

const offsetFields = Object.values(PlacementOffsetSchema.field);
if (offsetFields.length !== 3 || offsetFields.map((field) => field.name).join(",") !== "x,y,z") {
  throw new Error("PlacementOffset must expose exactly double x/y/z");
}

type Offset = MessageShape<typeof PlacementOffsetSchema>;
type OffsetCarrier = { offset?: Offset };
const signed = { x: 0.125, y: -2.5, z: 3.75 } as const;

runSurface("authoring", FloorPlanPlacementSchema, [authoringAbsent, authoringZero, authoringSigned] as JsonValue[]);
runSurface("runtime", PlacementSchema, [runtimeAbsent, runtimeZero, runtimeSigned] as JsonValue[]);

const authoringPlan = fromJson(FloorPlanSchema, { placements: [authoringZero] } as JsonValue);
assertOffset(authoringPlan.placements[0]?.offset, { $typeName: "dnd5e.api.v1alpha1.PlacementOffset", x: 0, y: 0, z: 0 }, "FloorPlan.placements");
const authorizedHex = { position: { x: 0, y: 0, z: 0 }, contents: [runtimeZero] };
const snapshot = fromJson(SpaceSchema, { hexes: [authorizedHex] } as JsonValue);
assertOffset(snapshot.hexes[0]?.contents[0]?.offset, { $typeName: "dnd5e.api.v1alpha1.PlacementOffset", x: 0, y: 0, z: 0 }, "Space.hexes contents");
const liveUpdate = fromJson(HexKnowledgeChangedSchema, { hexes: [authorizedHex] } as JsonValue);
assertOffset(liveUpdate.hexes[0]?.contents[0]?.offset, { $typeName: "dnd5e.api.v1alpha1.PlacementOffset", x: 0, y: 0, z: 0 }, "HexKnowledgeChanged.hexes contents");

function runSurface<T extends DescMessage>(name: string, schema: T, fixtures: JsonValue[]): void {
  const expected: ReadonlyArray<Offset | undefined> = [undefined, { $typeName: "dnd5e.api.v1alpha1.PlacementOffset", x: 0, y: 0, z: 0 }, { $typeName: "dnd5e.api.v1alpha1.PlacementOffset", ...signed }];
  const binaries: Uint8Array[] = [];
  fixtures.forEach((fixture, index) => {
    const input = fromJson(schema, fixture) as MessageShape<T> & OffsetCarrier;
    assertOffset(input.offset, expected[index], `${name} parsed`);
    const binary = toBinary(schema, input);
    binaries.push(binary);
    const decoded = fromBinary(schema, binary) as MessageShape<T> & OffsetCarrier;
    assertOffset(decoded.offset, expected[index], `${name} binary`);
    const jsonDecoded = fromJson(schema, toJson(schema, decoded)) as MessageShape<T> & OffsetCarrier;
    assertOffset(jsonDecoded.offset, expected[index], `${name} JSON`);
  });
  if (bytesEqual(binaries[0], binaries[1])) throw new Error(`${name}: absent and zero serialized identically`);
}

function assertOffset(actual: Offset | undefined, expected: Offset | undefined, label: string): void {
  if (actual === undefined || expected === undefined) {
    if (actual !== expected) throw new Error(`${label}: presence mismatch`);
    return;
  }
  if (actual.x !== expected.x || actual.y !== expected.y || actual.z !== expected.z) {
    throw new Error(`${label}: got [${actual.x},${actual.y},${actual.z}]`);
  }
}

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
