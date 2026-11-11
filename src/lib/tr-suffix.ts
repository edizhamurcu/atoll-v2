/**
 * Turkish ablative suffix after a price ("£25'ten", "£30'dan", "£120'den"), chosen by the last
 * spoken word of the number (vowel harmony + consonant assimilation). Used by the "from £X" copy.
 */
const UNIT = ["dan", "den", "den", "ten", "ten", "ten", "dan", "den", "den", "dan"]; // sıfır, bir, iki, üç, dört, beş, altı, yedi, sekiz, dokuz
const TENS = ["", "dan", "den", "dan", "tan", "den", "tan", "ten", "den", "dan"]; // on, yirmi, otuz, kırk, elli, altmış, yetmiş, seksen, doksan

function forInteger(n: number): string {
  if (n % 10) return UNIT[n % 10];
  if (n % 100) return TENS[(n % 100) / 10];
  if (n === 0) return UNIT[0];
  if (n % 1000 || n < 1_000_000) return "den"; // yüz, bin
  return "dan"; // milyon / milyar
}

export function trAblative(amount: number | string): string {
  const [int, frac = ""] = String(amount).split(".");
  const cents = Number(frac.padEnd(2, "0").slice(0, 2));
  return `'${cents ? forInteger(cents) : forInteger(Math.abs(Number(int)) || 0)}`;
}
