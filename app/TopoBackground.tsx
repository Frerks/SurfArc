'use client'

/**
 * TopoBackground — purely decorative cartographic layer.
 * Concentric contour rings rendered as SVG <textPath> with repeating
 * tiny mono text ("SWELL // WIND // TIDE // SPOT"). Rings drift slowly
 * (gated by prefers-reduced-motion in globals.css). No logic here.
 */

const RING_TEXT =
  'SWELL // WIND // TIDE // SPOT // SWELL // WIND // TIDE // SPOT // SWELL // WIND // TIDE // SPOT // '

// concentric circle radii (viewBox 0 0 1000 1000, center 500,500)
const RINGS = [
  { r: 470, spin: 'topo-spin-slow', op: 0.9 },
  { r: 420, spin: 'topo-spin-rev', op: 0.75 },
  { r: 360, spin: 'topo-spin', op: 0.7 },
  { r: 300, spin: 'topo-spin-rev', op: 0.6 },
  { r: 240, spin: 'topo-spin-slow', op: 0.55 },
  { r: 182, spin: 'topo-spin', op: 0.5 },
  { r: 128, spin: 'topo-spin-rev', op: 0.45 },
  { r: 78, spin: 'topo-spin', op: 0.4 },
]

export default function TopoBackground() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* faint plain contour lines (hairline ellipses, slightly offset = elevation map feel) */}
      <svg
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <defs>
          {RINGS.map((ring, i) => (
            <path
              key={`p${i}`}
              id={`ringPath${i}`}
              d={`M 500,500 m -${ring.r},0 a ${ring.r},${ring.r} 0 1,1 ${ring.r * 2},0 a ${ring.r},${ring.r} 0 1,1 -${ring.r * 2},0`}
            />
          ))}
        </defs>

        {/* hairline elevation contours (decorative, no text) */}
        <g stroke="rgba(196,255,61,0.06)" fill="none" strokeWidth="1">
          <ellipse cx="500" cy="500" rx="460" ry="430" />
          <ellipse cx="510" cy="495" rx="395" ry="372" />
          <ellipse cx="492" cy="505" rx="330" ry="312" />
          <ellipse cx="505" cy="498" rx="262" ry="250" />
          <ellipse cx="498" cy="502" rx="196" ry="188" />
          <ellipse cx="503" cy="500" rx="132" ry="128" />
          <ellipse cx="500" cy="500" rx="72" ry="70" />
        </g>

        {/* repeating-text contour rings, each on its own slowly-spinning group */}
        {RINGS.map((ring, i) => (
          <g key={`g${i}`} className={`topo-ring ${ring.spin}`} style={{ opacity: ring.op }}>
            <text
              fontFamily="var(--font-mono), monospace"
              fontSize="11"
              letterSpacing="2"
              fill="var(--contour)"
            >
              <textPath href={`#ringPath${i}`} startOffset="0">
                {RING_TEXT.repeat(2)}
              </textPath>
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
