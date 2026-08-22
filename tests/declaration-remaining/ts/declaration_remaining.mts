import { clone, fromBinary, fromJson, toBinary, type JsonValue } from "@bufbuild/protobuf";

import { DeclarationSchema } from "../../../gen/ts/dnd5e/api/session/v1alpha1/types_pb.js";
import absentFixture from "../../../dnd5e/api/session/v1alpha1/testdata/declaration-remaining-absent.json" with { type: "json" };
import zeroFixture from "../../../dnd5e/api/session/v1alpha1/testdata/declaration-remaining-zero.json" with { type: "json" };
import thirtyFixture from "../../../dnd5e/api/session/v1alpha1/testdata/declaration-remaining-thirty.json" with { type: "json" };

// Declaration.remaining is pointer-optional (rpg-toolkit#1169): undefined on
// an Attack declaration, a number — including 0 — on a Move one. A client that
// reads 0 where the server sent nothing would grey out every attack as
// "no feet left"; this pins that undefined and 0 stay distinct.
const cases: ReadonlyArray<{
  readonly name: string;
  readonly fixture: JsonValue;
  readonly remaining: number | undefined;
}> = [
  { name: "absent", fixture: absentFixture as JsonValue, remaining: undefined },
  { name: "explicit-zero", fixture: zeroFixture as JsonValue, remaining: 0 },
  { name: "explicit-thirty", fixture: thirtyFixture as JsonValue, remaining: 30 },
];

const encoded = new Map<string, Uint8Array>();
for (const testCase of cases) {
  const input = fromJson(DeclarationSchema, testCase.fixture);
  assertEqual(input.remaining, testCase.remaining, `${testCase.name}: parsed remaining`);

  const binary = toBinary(DeclarationSchema, input);
  encoded.set(testCase.name, binary);

  const decoded = fromBinary(DeclarationSchema, binary);
  assertEqual(decoded.remaining, testCase.remaining, `${testCase.name}: round-trip remaining`);
}

// Compare the presence bit in isolation: the same Move declaration with
// remaining cleared must not serialize identically to remaining = 0.
const zeroBinary = encoded.get("explicit-zero");
if (zeroBinary === undefined) {
  throw new Error("explicit-zero fixture was not encoded");
}
const zero = fromBinary(DeclarationSchema, zeroBinary);
const cleared = clone(DeclarationSchema, zero);
cleared.remaining = undefined;
if (bytesEqual(toBinary(DeclarationSchema, cleared), zeroBinary)) {
  throw new Error("absent remaining and explicit remaining=0 serialized identically");
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

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((value, index) => value === right[index]);
}
