export function prettify(num: number) {
  if (Math.abs(num) < 1) return +num.toFixed(6);
  if (Math.abs(num) < 2) return +num.toFixed(4);
  if (Math.abs(num) < 50) return +num.toFixed(3);
  if (Math.abs(num) < 200) return +num.toFixed(2);
  if (Math.abs(num) < 500) return +num.toFixed(1);
  return +num.toFixed(0);
}
