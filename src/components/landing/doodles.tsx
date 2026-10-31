/** Hand-drawn SVGs — strokes/fills use theme utilities so dark mode stays readable. */

export function ReaderDoodle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <ellipse
        cx="110"
        cy="248"
        rx="52"
        ry="8"
        className="fill-foreground/20"
      />
      <path
        d="M72 118c8-42 28-68 48-68s40 26 48 68c4 22-6 48-20 62H92c-14-14-24-40-20-62Z"
        className="stroke-foreground"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <circle
        cx="96"
        cy="102"
        r="11"
        className="stroke-foreground"
        strokeWidth="2.4"
      />
      <circle
        cx="124"
        cy="102"
        r="11"
        className="stroke-foreground"
        strokeWidth="2.4"
      />
      <path d="M107 102h6" className="stroke-foreground" strokeWidth="2.2" />
      <circle cx="96" cy="102" r="3.2" className="fill-foreground" />
      <circle cx="124" cy="102" r="3.2" className="fill-foreground" />
      <path
        d="M88 72c6-14 16-22 22-22s16 8 22 22"
        className="stroke-foreground"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M100 118c4 6 12 8 20 0"
        className="stroke-foreground"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M78 168c-10 18-8 42 4 58h56c12-16 14-40 4-58"
        className="stroke-foreground"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path
        d="M70 176h80l-6 34H76l-6-34Z"
        className="fill-card stroke-foreground"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path d="M110 176v34" className="stroke-foreground" strokeWidth="1.8" />
      <path
        d="M84 188h18M84 198h14M116 188h18M116 198h12"
        className="stroke-foreground"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M58 148c-16 4-28 18-28 34 0 10 6 18 16 22"
        className="stroke-foreground"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M162 148c16 4 28 18 28 34 0 10-6 18-16 22"
        className="stroke-foreground"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function VaultDoodle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <ellipse
        cx="120"
        cy="268"
        rx="58"
        ry="8"
        className="fill-foreground/20"
      />
      <rect
        x="58"
        y="78"
        width="124"
        height="150"
        rx="18"
        className="fill-muted stroke-foreground"
        strokeWidth="2.6"
      />
      <path
        d="M78 78V62c0-18 16-32 42-32s42 14 42 32v16"
        className="stroke-foreground"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle
        cx="120"
        cy="148"
        r="34"
        className="fill-card stroke-foreground"
        strokeWidth="2.6"
      />
      <circle cx="120" cy="148" r="10" className="fill-foreground" />
      <path
        d="M120 138v-14M120 172v14M106 148H92M148 148h-14"
        className="stroke-foreground"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M86 210h68"
        className="stroke-foreground"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M168 118c22-4 36 10 34 30-2 16-16 26-34 24"
        className="stroke-foreground"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle
        cx="198"
        cy="132"
        r="14"
        className="fill-card stroke-foreground"
        strokeWidth="2.4"
      />
      <circle cx="198" cy="132" r="4" className="fill-foreground" />
      <path
        d="M42 170c-14 8-18 28-8 42 8 12 24 14 36 6"
        className="stroke-foreground"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CurvedArrow({
  className,
  flip,
}: {
  className?: string;
  flip?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 64 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <path
        d="M8 40C20 20 40 12 56 10"
        className="stroke-foreground/55"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M48 4l10 6-8 8"
        className="stroke-foreground/55"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
