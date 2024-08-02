import { renderImmediate } from "./render.js";
export const canvas = document.querySelector('canvas');
export const desc = document.querySelector('.desc');
export const colorInputSelect = document.querySelector('#coloring');
export const colorTableParent = document.querySelector('#colorTableParent');
export const rideFilterSelect = document.querySelector('#ride');
export const citySelect = document.querySelector('#city');
export const showOptions = document.querySelector('#showOptions');
export const hideOptions = document.querySelector('#hideOptions');
export const sidebarExpanded = document.querySelector('#sidebar_expanded');
export const sidebarCollapsed = document.querySelector('#sidebar_collapsed');
export function trueSizeCanvas() {
    canvas.width = Math.max(1, parseInt(getComputedStyle(canvas).width));
    canvas.height = Math.max(1, parseInt(getComputedStyle(canvas).height));
    renderImmediate();
}
new ResizeObserver(trueSizeCanvas).observe(canvas);
