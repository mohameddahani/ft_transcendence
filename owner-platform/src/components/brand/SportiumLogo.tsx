import { cn } from "@/lib/utils";

// Standalone Sportium monogram mark (S & T)
export function SportiumIcon({
  className,
  fill = "currentColor",
}: {
  className?: string;
  fill?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      role="img"
      aria-labelledby="sportium-owner-icon-title"
      focusable="false"
      className={cn("size-6", className)}
    >
      <title id="sportium-owner-icon-title">Sportium</title>
      <g transform="translate(128 128) scale(0.820898) skewX(-15) translate(-115 -80)">
        <path
          fill={fill}
          d="M132 34 L48.5 34 A14.5 14.5 0 0 0 48.5 63 L83.5 63 A48.5 48.5 0 0 1 83.5 160 L0 160 L0 126 L83.5 126 A14.5 14.5 0 0 0 83.5 97 L48.5 97 A48.5 48.5 0 0 1 48.5 0 L132 0 Z"
        />
        <path
          fill={fill}
          d="M131 0 H230 V34 H131 Z M144 0 H178 V160 H144 Z"
        />
      </g>
    </svg>
  );
}

