import { canonicalPair } from "./canonical-pair";

describe("canonicalPair", () => {
  it("sorts two UUIDs lexicographically — smaller ID first", () => {
    const a = "00000000-0000-0000-0000-000000000002";
    const b = "00000000-0000-0000-0000-000000000001";
    expect(canonicalPair(a, b)).toEqual({ userAId: b, userBId: a });
  });

  it("returns identical output regardless of argument order", () => {
    const a = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const b = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    expect(canonicalPair(a, b)).toEqual(canonicalPair(b, a));
  });

  it("handles real-world UUID strings", () => {
    const pedro = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
    const mang = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
    const { userAId, userBId } = canonicalPair(pedro, mang);
    expect(userAId).toBe(mang);
    expect(userBId).toBe(pedro);
  });
});
