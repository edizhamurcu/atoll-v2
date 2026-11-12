/** Stylised Cyprus outline (equirectangular, ~240px/degree) with Atoll pick-up points. */
// Coastline from real coordinates: x = (lon - 32.2) * 240, y = (35.78 - lat) * 240.
const OUTLINE =
  "M17 163 L50 245 L103 269 L125 276 L180 293 L202 266 L262 262 L348 230 L346 206 L360 199 L451 197 L420 158 L420 115 L492 72 L574 19 L528 38 L444 72 L408 91 L269 106 L230 103 L173 91 L175 139 L156 151 L84 151 L53 178 L29 168 Z";

export interface MapPoint { slug: string; label: string; x: number; y: number; primary?: boolean; labelAt?: "above" | "below" | "left" | "right" }

export const MAP_POINTS: Omit<MapPoint, "label">[] = [
  { slug: "alsancak-office", x: 238, y: 106, primary: true },
  { slug: "ercan-airport", x: 312, y: 149 },
  { slug: "larnaca-airport", x: 341, y: 218 },
  { slug: "paphos-airport", x: 70, y: 254 },
];

function labelPos(p: MapPoint) {
  const at = p.labelAt ?? (p.primary ? "above" : p.slug === "larnaca-airport" ? "below" : "right");
  if (at === "above") return { x: p.primary ? -6 : 0, y: -16, textAnchor: "middle" as const };
  if (at === "below") return p.slug === "larnaca-airport" ? { x: 12, y: 22, textAnchor: "start" as const } : { x: 0, y: 26, textAnchor: "middle" as const };
  if (at === "left") return { x: -12, y: 5, textAnchor: "end" as const };
  return { x: 12, y: 5, textAnchor: "start" as const };
}

/** Gentle curve from a to b (control point pushed sideways), for the animated routes. */
function curve(a: MapPoint, b: MapPoint) {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
  const k = Math.min(40, len * 0.18);
  return `M${a.x} ${a.y} Q${(mx - (dy / len) * k).toFixed(1)} ${(my + (dx / len) * k).toFixed(1)} ${b.x} ${b.y}`;
}

/** `animated`: dashed routes flow from the primary point to the others and the points pulse (CSS; off with reduced motion). */
export function CyprusMap({ points, title, animated = false }: { points: MapPoint[]; title: string; animated?: boolean }) {
  const hub = points.find((p) => p.primary);
  return (
    <svg viewBox="0 0 600 310" role="img" aria-label={title} className="h-auto w-full">
      <title>{title}</title>
      <path d={OUTLINE} fill="var(--color-aegean-wash)" stroke="var(--color-ink)" strokeWidth="2" strokeLinejoin="round" />
      {/* Green Line, schematic */}
      <path d="M115 146 C 180 150, 230 140, 278 147 S 360 165, 405 172" fill="none" stroke="var(--color-ink-soft)" strokeWidth="1.2" strokeDasharray="4 5" opacity="0.6" />
      {animated && hub && points.filter((p) => p !== hub).map((p) => (
        <path key={`r-${p.slug}`} d={curve(hub, p)} fill="none" stroke="var(--color-bougain)" strokeWidth="2" strokeLinecap="round" className="map-route" opacity="0.7" />
      ))}
      {points.map((p, i) => (
        <g key={p.slug} transform={`translate(${p.x} ${p.y})`}>
          {animated && <circle r={p.primary ? 9 : 6.5} fill={p.primary ? "var(--color-bougain)" : "var(--color-ink)"} className="map-pulse" style={{ animationDelay: `${i * 0.45}s` }} />}
          <circle r={p.primary ? 9 : 6.5} fill={p.primary ? "var(--color-bougain)" : "var(--color-ink)"} stroke="var(--color-paper)" strokeWidth="2.5" />
          <text
            {...labelPos(p)}
            className="fill-ink font-sans"
            style={{ fontSize: p.primary ? 17 : 15, fontWeight: p.primary ? 700 : 500 }}
          >
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
