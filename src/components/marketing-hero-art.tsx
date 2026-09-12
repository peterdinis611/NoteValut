const ink = "#171412";
const paper = "#fbf6ea";
const lilac = "#cbb6ee";
const brew = "#e8611a";
const leaf = "#8eab57";
const tan = "#edd3b0";

export function NotesHeroArt() {
  return (
    <svg
      className="nv-land-art"
      viewBox="0 0 460 400"
      fill="none"
      aria-hidden
    >
      <ellipse className="nv-art-shadow" cx="230" cy="352" rx="96" ry="12" fill={ink} />

      <g className="nv-art-float">
        <g className="nv-art-page-l">
          <rect x="78" y="92" width="154" height="214" rx="10" fill="#e8d7b8" stroke={ink} strokeWidth="3.2" />
          <rect x="88" y="104" width="134" height="190" rx="6" fill={paper} stroke={ink} strokeWidth="2.2" />
          <path d="M104 138h102M104 166h90M104 194h96M104 222h78" stroke="#cbbca3" strokeWidth="2.2" strokeLinecap="round" />
          <rect x="104" y="248" width="16" height="16" rx="3" fill="#fff" stroke={ink} strokeWidth="2" />
          <path d="M107 256l4 4 8-9" stroke={brew} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        <g className="nv-art-page-r">
          <rect x="214" y="78" width="158" height="220" rx="10" fill="#fff" stroke={ink} strokeWidth="3.2" />
          <rect x="226" y="92" width="134" height="192" rx="6" fill={paper} />
          <path d="M240 128h106M240 156h98M240 184h88M240 212h72" stroke="#cbbca3" strokeWidth="2.2" strokeLinecap="round" />
          <path className="nv-art-scribble" d="M240 248c18 12 40 12 58 2" stroke={lilac} strokeWidth="3" strokeLinecap="round" />
        </g>

        <path d="M228 86v214" stroke={ink} strokeWidth="3.4" strokeLinecap="round" />
        <path d="M221 84c8 8 8 24 0 36" stroke={ink} strokeWidth="2.2" fill="none" />

        <g className="nv-art-ribbon">
          <path d="M318 70c14 6 22 28 10 46l-18-8c6-12 4-24 8-38Z" fill={lilac} stroke={ink} strokeWidth="2.8" />
        </g>

        <g className="nv-art-pen">
          <rect x="332" y="118" width="18" height="108" rx="7" fill="#2a241c" stroke={ink} strokeWidth="3" transform="rotate(-22 341 172)" />
          <rect x="348" y="98" width="16" height="28" rx="5" fill={lilac} stroke={ink} strokeWidth="2.6" transform="rotate(-22 356 112)" />
          <path d="M318 228l16 28" stroke={ink} strokeWidth="3" strokeLinecap="round" />
          <path d="M332 258l9 5-14 3 5-8Z" fill={brew} stroke={ink} strokeWidth="2" />
        </g>

        <g className="nv-art-ink">
          <ellipse cx="348" cy="196" rx="30" ry="22" fill={tan} stroke={ink} strokeWidth="3" />
          <path d="M326 188c8-12 24-14 36-4" stroke={ink} strokeWidth="2.1" strokeLinecap="round" />
          <rect x="336" y="214" width="24" height="28" rx="5" fill={brew} stroke={ink} strokeWidth="3" />
          <path className="nv-art-drip" d="M348 244v14" stroke={brew} strokeWidth="3" strokeLinecap="round" />
        </g>

        <g className="nv-art-leaf nv-art-leaf-a">
          <path d="M96 250c22-8 44 10 40 30-20 4-36-8-40-30Z" fill={leaf} stroke={ink} strokeWidth="2.6" />
        </g>
        <g className="nv-art-leaf nv-art-leaf-b">
          <path d="M128 272c24-6 42 14 34 32-22 0-36-12-34-32Z" fill="#6f8d3e" stroke={ink} strokeWidth="2.6" />
        </g>
        <g className="nv-art-leaf nv-art-leaf-c">
          <path d="M318 278c22 6 36 24 22 38-16-8-28-18-22-38Z" fill={leaf} stroke={ink} strokeWidth="2.6" />
        </g>

        <g className="nv-art-plus">
          <circle cx="168" cy="286" r="13" fill="#6b4a2a" stroke={ink} strokeWidth="2.6" />
          <path d="M161 286h14M168 279v14" stroke={paper} strokeWidth="1.5" />
        </g>
        <circle cx="252" cy="298" r="10" fill="#6b4a2a" stroke={ink} strokeWidth="2.6" />
      </g>

      <g className="nv-art-steam">
        <path d="M338 86c8-16 20-18 26-8" stroke={ink} strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <path d="M358 78c6-12 16-12 20-4" stroke={ink} strokeWidth="2" strokeLinecap="round" fill="none" />
      </g>

      <g className="nv-art-sparks" stroke={ink} strokeWidth="2.2" strokeLinecap="round">
        <path className="nv-art-spark" d="M78 78l4 10M74 88h12" />
        <path className="nv-art-spark nv-art-spark-2" d="M392 64l3 9M388 72h11" />
        <path className="nv-art-spark nv-art-spark-3" d="M64 188l10 3M68 184v12" />
        <path className="nv-art-spark nv-art-spark-4" d="M400 228l9 4M398 236h12" />
      </g>

      <path
        className="nv-art-arrow"
        d="M92 168c32 20 44 52 36 86"
        stroke={ink}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        markerEnd="url(#nv-land-arrow)"
      />
      <defs>
        <marker id="nv-land-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0 0l8 4-8 4z" fill={ink} />
        </marker>
      </defs>
    </svg>
  );
}

export function NotesSack() {
  return (
    <svg className="nv-land-sack nv-art-bob" viewBox="0 0 128 108" fill="none" aria-hidden>
      <rect x="22" y="48" width="78" height="46" rx="6" fill="#e8d7b8" stroke={ink} strokeWidth="3" />
      <rect x="28" y="34" width="78" height="46" rx="6" fill={paper} stroke={ink} strokeWidth="3" />
      <rect x="34" y="20" width="78" height="48" rx="6" fill="#fff" stroke={ink} strokeWidth="3" />
      <path d="M48 38h50M48 50h40" stroke="#cbbca3" strokeWidth="2" strokeLinecap="round" />
      <text x="73" y="72" textAnchor="middle" fill={ink} fontSize="12" fontFamily="ui-serif, Georgia, serif">
        notes
      </text>
      <circle className="nv-art-plus" cx="104" cy="28" r="10" fill={brew} stroke={ink} strokeWidth="2.4" />
    </svg>
  );
}

export function FeatureDoodle({ kind }: { kind: "nest" | "graph" | "daily" | "offline" }) {
  if (kind === "graph") {
    return (
      <svg className="nv-doodle" viewBox="0 0 72 48" fill="none" aria-hidden>
        <circle className="nv-art-node nv-art-node-a" cx="14" cy="24" r="7" fill={lilac} stroke={ink} strokeWidth="2.4" />
        <circle className="nv-art-node nv-art-node-b" cx="58" cy="14" r="7" fill={tan} stroke={ink} strokeWidth="2.4" />
        <circle className="nv-art-node nv-art-node-c" cx="50" cy="36" r="7" fill={paper} stroke={ink} strokeWidth="2.4" />
        <path d="M20 22l32-6M20 26l24 8M52 21l-2 10" stroke={ink} strokeWidth="2" />
      </svg>
    );
  }
  if (kind === "daily") {
    return (
      <svg className="nv-doodle" viewBox="0 0 72 48" fill="none" aria-hidden>
        <g className="nv-art-spin-slow">
          <circle cx="36" cy="24" r="14" fill={tan} stroke={ink} strokeWidth="2.6" />
          <path d="M36 24l8-6" stroke={ink} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M36 10v4M36 34v4M22 24h-4M54 24h4" stroke={brew} strokeWidth="2" strokeLinecap="round" />
        </g>
      </svg>
    );
  }
  if (kind === "offline") {
    return (
      <svg className="nv-doodle nv-art-pulse" viewBox="0 0 72 48" fill="none" aria-hidden>
        <rect x="16" y="12" width="40" height="26" rx="6" fill={paper} stroke={ink} strokeWidth="2.6" />
        <path d="M24 22h24M24 30h14" stroke="#cbbca3" strokeWidth="2" strokeLinecap="round" />
        <circle cx="50" cy="14" r="6" fill={leaf} stroke={ink} strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg className="nv-doodle nv-art-bob" viewBox="0 0 72 48" fill="none" aria-hidden>
      <rect x="10" y="10" width="28" height="30" rx="4" fill={lilac} stroke={ink} strokeWidth="2.5" />
      <rect x="28" y="16" width="28" height="26" rx="4" fill={paper} stroke={ink} strokeWidth="2.5" />
      <path d="M34 24h16M34 32h10" stroke="#cbbca3" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
