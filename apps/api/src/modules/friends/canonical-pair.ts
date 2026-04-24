/**
 * Sort two UUIDs lexicographically for friendship table insertion.
 *
 * Ensures ONE row per user pair regardless of who initiated the friendship.
 * Every caller of the friendships table MUST use this helper before insert/query
 * to maintain the `user_a_id < user_b_id` invariant enforced by the unique index.
 */
export function canonicalPair(
  idA: string,
  idB: string,
): { userAId: string; userBId: string } {
  return idA < idB
    ? { userAId: idA, userBId: idB }
    : { userAId: idB, userBId: idA };
}
