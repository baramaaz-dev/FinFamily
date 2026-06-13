export function fractionToDecimal(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return numerator / denominator;
}

export function sharesSum(
  members: Array<{ share_numerator: number; share_denominator: number }>
): number {
  return members.reduce(
    (sum, m) => sum + fractionToDecimal(m.share_numerator, m.share_denominator),
    0
  );
}

const EPSILON = 0.0001;

export function isSharesSumValid(
  members: Array<{ share_numerator: number; share_denominator: number }>
): boolean {
  if (members.length === 0) return true;
  return Math.abs(sharesSum(members) - 1) < EPSILON;
}
