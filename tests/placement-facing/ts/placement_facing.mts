import { fromBinary, fromJson, toBinary, type JsonValue } from "@bufbuild/protobuf";

import { PlacementSchema } from "../../../gen/ts/dnd5e/api/v1alpha2/encounter/types_pb.js";
import absentFixture from "../../../dnd5e/api/v1alpha2/encounter/testdata/placement-facing-absent.json" with { type: "json" };
import eastFixture from "../../../dnd5e/api/v1alpha2/encounter/testdata/placement-facing-east.json" with { type: "json" };
import southwestFixture from "../../../dnd5e/api/v1alpha2/encounter/testdata/placement-facing-southwest.json" with { type: "json" };

const cases: ReadonlyArray<{
  readonly name: string;
  readonly fixture: JsonValue;
  readonly facing: number | undefined;
}> = [
  { name: "absent", fixture: absentFixture as JsonValue, facing: undefined },
  { name: "explicit-east-zero", fixture: eastFixture as JsonValue, facing: 0 },
  { name: "explicit-southwest", fixture: southwestFixture as JsonValue, facing: 4 },
];

const encoded = new Map<string, Uint8Array>();
for (const testCase of cases) {
  const input = fromJson(PlacementSchema, testCase.fixture);
  assertEqual(input.facing, testCase.facing, `${testCase.name}: parsed facing`);

  const binary = toBinary(PlacementSchema, input);
  encoded.set(testCase.name, binary);

  const decoded = fromBinary(PlacementSchema, binary);
  assertEqual(decoded.facing, testCase.facing, `${testCase.name}: round-trip facing`);
}

if (bytesEqual(encoded.get("absent"), encoded.get("explicit-east-zero"))) {
  throw new Error("absent facing and explicit facing=0 serialized identically");
}

function assertEqual(
  actual: number | undefined,
  expected: number | undefined,
  label: string,
): void {
  if (actual !== expected) {
    throw new Error(`${label}: got ${String(actual)}, want ${String(expected)}`);
  }
}

function bytesEqual(left: Uint8Array | undefined, right: Uint8Array | undefined): boolean {
  if (left === undefined || right === undefined || left.length !== right.length) {
    return false;
  }
  return left.every((value, index) => value === right[index]);
}
