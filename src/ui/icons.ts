// Authored icons: 24px grid, 2px square-cap strokes, drawn in currentColor.
import { svg } from '../core/dom';

const wrap = (body: string, cls = '') =>
  svg(
    `<svg class="icon ${cls}" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter">${body}</svg>`,
  );

export const arrowRight = () => wrap('<path d="M3 12h17M14 6l6 6-6 6"/>');
export const arrowLeft = () => wrap('<path d="M21 12H4M10 6l-6 6 6 6"/>');
export const play = () => wrap('<path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/>');
export const again = () => wrap('<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 3v5h-5"/>');
export const mic = () => wrap('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>');
export const speaker = () => wrap('<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" stroke="none"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>');
export const download = () => wrap('<path d="M12 3v12M6 10l6 6 6-6M4 21h16"/>');
