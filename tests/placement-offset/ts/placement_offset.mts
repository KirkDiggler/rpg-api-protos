import {
  fromBinary,
  fromJson,
  toBinary,
  toJson,
  type DescField,
  type DescMessage,
  type JsonValue,
  type MessageShape,
} from "@bufbuild/protobuf";

import {
  FloorPlanPlacementSchema,
  FloorPlanSchema,
} from "../../../gen/ts/dnd5e/api/authoring/v1alpha1/service_pb.js";
import { PlacementOffsetSchema } from "../../../gen/ts/dnd5e/api/v1alpha1/common_pb.js";
import { HexKnowledgeChangedSchema } from "../../../gen/ts/dnd5e/api/v1alpha2/encounter/events_pb.js";
import {
  EntityType,
  PlacementSchema,
  SpaceSchema,
} from "../../../gen/ts/dnd5e/api/v1alpha2/encounter/types_pb.js";

import authoringAbsent from "../../../dnd5e/api/authoring/v1alpha1/testdata/placement-offset-absent.json" with { type: "json" };
import authoringMatrix from "../../../dnd5e/api/authoring/v1alpha1/testdata/floor-plan-placement-matrix.json" with { type: "json" };
import authoringSigned from "../../../dnd5e/api/authoring/v1alpha1/testdata/placement-offset-signed.json" with { type: "json" };
import authoringZero from "../../../dnd5e/api/authoring/v1alpha1/testdata/placement-offset-zero.json" with { type: "json" };
import liveFixture from "../../../dnd5e/api/v1alpha2/encounter/testdata/placement-offset-knowledge-change.json" with { type: "json" };
import runtimeAbsent from "../../../dnd5e/api/v1alpha2/encounter/testdata/placement-offset-absent.json" with { type: "json" };
import runtimeSigned from "../../../dnd5e/api/v1alpha2/encounter/testdata/placement-offset-signed.json" with { type: "json" };
import snapshotFixture from "../../../dnd5e/api/v1alpha2/encounter/testdata/placement-offset-space.json" with { type: "json" };
import runtimeZero from "../../../dnd5e/api/v1alpha2/encounter/testdata/placement-offset-zero.json" with { type: "json" };

type Offset = MessageShape<typeof PlacementOffsetSchema>;
type OffsetCarrier = { offset?: Offset };

const STRING = 9;
const BOOL = 8;
const UINT32 = 13;
const EXPLICIT = 1;
const IMPLICIT = 2;
const signed = { x: 0.125, y: -2.5, z: 3.75 } as const;

assertPlacementOffsetDescriptor();
assertFloorPlanPlacementDescriptor();
assertOnlyApprovedOffsetCarriers();
runSurface("authoring", FloorPlanPlacementSchema, [authoringAbsent, authoringZero, authoringSigned] as JsonValue[]);
runSurface("runtime", PlacementSchema, [runtimeAbsent, runtimeZero, runtimeSigned] as JsonValue[]);
assertAuthoringMatrix();
assertAuthorizedSnapshotAndLiveJoins();

function assertPlacementOffsetDescriptor(): void {
  const fields = Object.values(PlacementOffsetSchema.field);
  if (fields.length !== 3 || fields.map((field) => field.name).join(",") !== "x,y,z") {
    throw new Error("PlacementOffset must expose exactly double x/y/z");
  }
  fields.forEach((field, index) => {
    if (field.number !== index + 1 || field.fieldKind !== "scalar" || field.scalar !== 1) {
      throw new Error(`PlacementOffset ${field.name} descriptor changed`);
    }
  });
}

function assertFloorPlanPlacementDescriptor(): void {
  const fields = Object.values(FloorPlanPlacementSchema.field);
  const expected: ReadonlyArray<{
    readonly protoName: string;
    readonly localName: string;
    readonly number: number;
    readonly fieldKind: "scalar" | "message";
    readonly scalar?: number;
    readonly message?: string;
    readonly presence: number;
    readonly proto3Optional?: boolean;
  }> = [
    { protoName: "ref", localName: "ref", number: 1, fieldKind: "scalar", scalar: STRING, presence: IMPLICIT },
    { protoName: "at", localName: "at", number: 2, fieldKind: "message", message: "dnd5e.api.authoring.v1alpha1.FloorPlanCell", presence: EXPLICIT },
    { protoName: "facing", localName: "facing", number: 3, fieldKind: "scalar", scalar: UINT32, presence: EXPLICIT, proto3Optional: true },
    { protoName: "blocks_movement", localName: "blocksMovement", number: 4, fieldKind: "scalar", scalar: BOOL, presence: IMPLICIT },
    { protoName: "blocks_los", localName: "blocksLos", number: 5, fieldKind: "scalar", scalar: BOOL, presence: IMPLICIT },
    { protoName: "source_path", localName: "sourcePath", number: 6, fieldKind: "scalar", scalar: STRING, presence: IMPLICIT },
    { protoName: "offset", localName: "offset", number: 7, fieldKind: "message", message: "dnd5e.api.v1alpha1.PlacementOffset", presence: EXPLICIT },
  ];
  if (fields.length !== expected.length) throw new Error(`FloorPlanPlacement field count ${fields.length}`);
  fields.forEach((field, index) => {
    const want = expected[index];
    const message = field.fieldKind === "message" ? field.message.typeName : undefined;
    const scalar = field.fieldKind === "scalar" ? field.scalar : undefined;
    if (
      field.name !== want.protoName ||
      field.localName !== want.localName ||
      field.number !== want.number ||
      field.fieldKind !== want.fieldKind ||
      scalar !== want.scalar ||
      message !== want.message ||
      field.presence !== want.presence ||
      field.proto.proto3Optional !== (want.proto3Optional ?? false)
    ) {
      throw new Error(`FloorPlanPlacement descriptor mismatch at ${index}: ${field.toString()}`);
    }
  });

  const placements = FloorPlanSchema.field.placements;
  if (
    placements.number !== 11 ||
    placements.fieldKind !== "list" ||
    placements.listKind !== "message" ||
    placements.message.typeName !== FloorPlanPlacementSchema.typeName
  ) {
    throw new Error("FloorPlan.placements must be repeated FloorPlanPlacement field 11");
  }
}

function assertOnlyApprovedOffsetCarriers(): void {
  const target = PlacementOffsetSchema.typeName;
  const references: string[] = [];
  const seenFiles = new Set<string>();
  for (const file of [FloorPlanPlacementSchema.file, PlacementSchema.file]) {
    if (seenFiles.has(file.name)) continue;
    seenFiles.add(file.name);
    collectReferences(file.messages, target, references);
  }
  references.sort();
  const expected = [
    "dnd5e.api.authoring.v1alpha1.FloorPlanPlacement.offset=7",
    "dnd5e.api.v1alpha2.encounter.Placement.offset=3",
  ];
  if (references.join("|") !== expected.join("|")) {
    throw new Error(`PlacementOffset has unapproved Entity/generic/catalog/gameplay carrier: ${references.join(",")}`);
  }
}

function collectReferences(messages: readonly DescMessage[], target: string, references: string[]): void {
  for (const message of messages) {
    for (const field of message.fields) {
      if (fieldReferencesMessage(field, target)) {
        references.push(`${message.typeName}.${field.name}=${field.number}`);
      }
    }
    collectReferences(message.nestedMessages, target, references);
  }
}

function fieldReferencesMessage(field: DescField, target: string): boolean {
  if (field.fieldKind === "message") return field.message.typeName === target;
  if (field.fieldKind === "list" && field.listKind === "message") return field.message.typeName === target;
  if (field.fieldKind === "map" && field.mapKind === "message") return field.message.typeName === target;
  return false;
}

function assertAuthoringMatrix(): void {
  const plan = roundTrip(FloorPlanSchema, authoringMatrix as JsonValue);
  const expected = [
    { name: "room-prop", ref: "dnd5e:props:bookcase", column: 3, row: 2, facing: 0, blocksMovement: true, blocksLos: true, sourcePath: "rooms[0].place[0]", offset: undefined },
    { name: "canvas-prop", ref: "dnd5e:props:torch-ornate", column: 12, row: -4, facing: 5, blocksMovement: false, blocksLos: false, sourcePath: "canvas.place[0]", offset: { x: 0, y: 0, z: 0 } },
    { name: "room-monster", ref: "dnd5e:monster:wolf", column: -2, row: 7, facing: undefined, blocksMovement: true, blocksLos: true, sourcePath: "rooms[1].place[0]", offset: signed },
    { name: "canvas-monster", ref: "dnd5e:monster:goblin", column: 4, row: 9, facing: undefined, blocksMovement: true, blocksLos: false, sourcePath: "canvas.place[1]", offset: { x: -1.25, y: 0.5, z: -0.75 } },
    { name: "room-boss", ref: "dnd5e:monster:dragon", column: 30, row: 12, facing: undefined, blocksMovement: true, blocksLos: true, sourcePath: "rooms[2].boss", offset: { x: 5, y: -1, z: 0.25 } },
  ] as const;
  if (plan.placements.length !== expected.length) throw new Error(`authoring placement count ${plan.placements.length}`);
  plan.placements.forEach((placement, index) => {
    const want = expected[index];
    if (
      placement.ref !== want.ref ||
      placement.at?.column !== want.column ||
      placement.at.row !== want.row ||
      placement.facing !== want.facing ||
      placement.blocksMovement !== want.blocksMovement ||
      placement.blocksLos !== want.blocksLos ||
      placement.sourcePath !== want.sourcePath
    ) {
      throw new Error(`${want.name}: authoring placement fields changed`);
    }
    assertOffsetValues(placement.offset, want.offset, `${want.name}: offset`);
  });
}

function assertAuthorizedSnapshotAndLiveJoins(): void {
  const snapshot = roundTrip(SpaceSchema, snapshotFixture as unknown as JsonValue);
  assertAuthorizedJoins(snapshot.hexes, snapshot.entities, "snapshot");
  const live = roundTrip(HexKnowledgeChangedSchema, liveFixture as unknown as JsonValue);
  assertAuthorizedJoins(live.hexes, live.entities, "live");
}

type AuthorizedHex = MessageShape<typeof SpaceSchema>["hexes"][number];
type AuthorizedEntity = MessageShape<typeof SpaceSchema>["entities"][number];

function assertAuthorizedJoins(hexes: AuthorizedHex[], entities: AuthorizedEntity[], surface: string): void {
  if (hexes.length !== 1 || hexes[0].contents.length !== 5) throw new Error(`${surface}: authorized record matrix missing`);
  const byId = new Map(entities.map((entity) => [entity.id, entity]));
  const expected = [
    { entityId: "room-prop-1", type: EntityType.PROP, dataCase: "prop", offset: undefined },
    { entityId: "canvas-prop-1", type: EntityType.PROP, dataCase: "prop", offset: { x: 0, y: 0, z: 0 } },
    { entityId: "room-monster-1", type: EntityType.MONSTER, dataCase: "monster", offset: signed },
    { entityId: "canvas-monster-1", type: EntityType.MONSTER, dataCase: "monster", offset: { x: -1.25, y: 0.5, z: -0.75 } },
    { entityId: "room-boss-1", type: EntityType.MONSTER, dataCase: "monster", offset: { x: 5, y: -1, z: 0.25 } },
  ] as const;
  hexes[0].contents.forEach((placement, index) => {
    const want = expected[index];
    if (placement.entityId !== want.entityId) throw new Error(`${surface}: entity ID mismatch at ${index}`);
    const entity = byId.get(placement.entityId);
    if (entity === undefined || entity.id !== placement.entityId) throw new Error(`${surface}: no exact entity join for ${placement.entityId}`);
    if (entity.type !== want.type || entity.data.case !== want.dataCase) throw new Error(`${surface}: discriminator mismatch for ${placement.entityId}`);
    assertOffsetValues(placement.offset, want.offset, `${surface}: ${placement.entityId} offset`);
  });
}

function runSurface<T extends DescMessage>(name: string, schema: T, fixtures: JsonValue[]): void {
  const expected: ReadonlyArray<Offset | undefined> = [
    undefined,
    { $typeName: "dnd5e.api.v1alpha1.PlacementOffset", x: 0, y: 0, z: 0 },
    { $typeName: "dnd5e.api.v1alpha1.PlacementOffset", ...signed },
  ];
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

function roundTrip<T extends DescMessage>(schema: T, fixture: JsonValue): MessageShape<T> {
  const parsed = fromJson(schema, fixture);
  const binaryDecoded = fromBinary(schema, toBinary(schema, parsed));
  return fromJson(schema, toJson(schema, binaryDecoded));
}

function assertOffsetValues(
  actual: Offset | undefined,
  expected: Readonly<{ x: number; y: number; z: number }> | undefined,
  label: string,
): void {
  if (actual === undefined || expected === undefined) {
    if (actual !== expected) throw new Error(`${label}: presence mismatch`);
    return;
  }
  if (actual.x !== expected.x || actual.y !== expected.y || actual.z !== expected.z) {
    throw new Error(`${label}: got [${actual.x},${actual.y},${actual.z}]`);
  }
}

function assertOffset(actual: Offset | undefined, expected: Offset | undefined, label: string): void {
  assertOffsetValues(actual, expected, label);
}

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
