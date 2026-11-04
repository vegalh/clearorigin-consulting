/** Shared surface/border/hover treatment for every form control (inputs, selects, textareas). */
export const fieldBase =
  'border border-co-line bg-co-paper text-co-ink transition-colors duration-150 hover:border-co-orange/60 focus:border-co-orange-dark disabled:cursor-not-allowed disabled:opacity-50';

/** Standard text/date/time input styling, matching `Select variant="field"`. */
export const inputClass = `${fieldBase} rounded-co-sm px-3 py-2 text-sm placeholder:text-co-muted/70`;
