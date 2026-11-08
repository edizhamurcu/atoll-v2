/** Pure helpers for converting WordPress export data. */
const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/**
 * The WP short description ("Driver & licence requirements / Damage Excess / Fuel Policy / Mileage") is plain
 * text with tab-indented bullets and glued "Heading£value" lines. Convert it to small, safe HTML (escaped text).
 */
export function rentalInfoHtml(raw: string) {
  const text = raw.replace(/\r/g, "").replace(/Damage Excess\s*(£[\d.,]+)/g, "Damage Excess: $1").replace(/Mileage\s*Unlimited/g, "Mileage: Unlimited");
  const blocks = text.split(/\n[ \t]*\n/).map((b) => b.replace(/^\n+|\s+$/g, "")).filter((b) => b.trim());
  const out: string[] = [];
  let list: string[] = [];
  const flush = () => { if (list.length) { out.push(`<ul>${list.map((li) => `<li>${esc(li)}</li>`).join("")}</ul>`); list = []; } };
  const HEAD = /^(Driver & licence requirements|Damage Excess: .+|Fuel Policy|Mileage: .+)$/;
  for (const b of blocks) {
    for (const line of b.split("\n").map((l) => l.replace(/\s+$/, "")).filter((l) => l.trim())) {
      if (/^\s{2,}|^\t/.test(line)) { list.push(line.trim()); continue; }
      flush();
      out.push(HEAD.test(line.trim()) ? `<h3>${esc(line.trim())}</h3>` : `<p>${esc(line.trim())}</p>`);
    }
  }
  flush();
  return out.join("\n");
}
