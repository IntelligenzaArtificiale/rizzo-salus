/*
 * Classi dei campi. Superficie e bordo dai token Beautiful UI (bg-surface, line-strong,
 * accent, accent-tint), forma rounded-control. Bordo sempre 1px: gli stati cambiano
 * colore e anello, mai la geometria.
 */
export const fieldBox =
  "flex h-10 items-center gap-2 rounded-control border border-line-strong bg-surface px-3 " +
  "shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-[border-color,box-shadow] duration-150 " +
  "focus-within:border-accent focus-within:ring-[3px] focus-within:ring-accent-tint";

export const fieldBoxInvalid = "border-red focus-within:border-red focus-within:ring-red-tint";

export const fieldInput =
  "min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-3";

export const fieldLabel = "text-[13px] font-medium text-ink";

export const fieldMessage = "min-h-[18px] text-[12.5px] leading-[18px]";
