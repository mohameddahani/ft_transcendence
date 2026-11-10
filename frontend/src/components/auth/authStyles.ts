// the platform's look for the sign-in pages: white pill inputs, lime focus ring, lime accents
export const muted = "text-[#565c63] dark:text-[#a3a9b1]";

export const inputBase =
  "h-12 w-full rounded-2xl bg-[var(--toota-pill)] pl-11 pr-4 rtl:pl-4 rtl:pr-11 text-sm text-[var(--toota-ink)] " +
  "shadow-[0_1px_3px_rgba(0,0,0,0.06)] outline-none ring-1 transition-shadow placeholder:text-[#8a9098] " +
  "focus:ring-2 focus:ring-[#a3e635]";

// the same pill without room for an icon, and a select box in the same style
export const inputPlain = inputBase.replace("pl-11 pr-4 rtl:pl-4 rtl:pr-11", "px-4");

export const selectBase = `${inputPlain} cursor-pointer appearance-none pr-10 rtl:pr-4 rtl:pl-10`;

export const inputRing = (hasError: boolean) =>
  hasError ? "ring-red-500 focus:ring-red-500" : "ring-black/10 dark:ring-white/10";

export const fieldIcon =
  "pointer-events-none absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-[#8a9098] " +
  "transition-colors group-focus-within:text-[#4d7c0f] dark:group-focus-within:text-[#a3e635]";

export const fieldLabel = `block text-xs font-semibold uppercase tracking-wider ${muted}`;

export const fieldError = "mt-1 text-xs font-medium text-red-600 dark:text-red-400";

export const forgotLink =
  `text-xs font-semibold ${muted} transition-colors hover:text-[var(--toota-ink)] ` +
  "hover:underline hover:decoration-[#a3e635] hover:decoration-2 hover:underline-offset-4";

export const eyeButton =
  "absolute right-2 rtl:right-auto rtl:left-2 top-1/2 grid size-9 -translate-y-1/2 cursor-pointer place-items-center " +
  "rounded-full text-[#8a9098] transition-colors hover:bg-[#a3e635]/20 hover:text-[var(--toota-ink)] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a3e635]";

// the platform's dark pill (white in dark mode), with room for the lime arrow on the right
export const submitButton =
  "group relative mt-2 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#1b1f23] " +
  "text-sm font-semibold text-white shadow-sm transition-[background-color,transform] hover:bg-[#2b3036] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a3e635] focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-[var(--toota-main)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 " +
  "dark:bg-white dark:text-[#0f1115] dark:hover:bg-[#e5e7eb]";

export const submitArrow =
  "absolute right-1.5 rtl:right-auto rtl:left-1.5 grid size-9 place-items-center rounded-full bg-[#a3e635] " +
  "text-[#1a2e05] transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5";

export const limeUnderline = "underline decoration-[#a3e635] decoration-2 underline-offset-4";
