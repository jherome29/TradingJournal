/** Fraction of retrieved ids that are actually in the relevant set --
    "of the results the search gave back, how many were correct?" */
export function computePrecisionAtK(retrieved: string[], relevant: Set<string>): number {
  if (retrieved.length === 0) return 0;
  const hits = retrieved.filter((id) => relevant.has(id)).length;
  return hits / retrieved.length;
}
