import { renderImmediate } from "./render.js"


export const canvas = document.querySelector('canvas')!

export const desc = document.querySelector('.desc')!

export const colorInputSelect = document.querySelector('#coloring') as HTMLSelectElement

export const colorTableParent = document.querySelector('#colorTableParent')!

export const rideFilterSelect = document.querySelector('#ride') as HTMLSelectElement

export const citySelect = document.querySelector('#city') as HTMLSelectElement

export const showOptions = document.querySelector('#showOptions')!

export const hideOptions = document.querySelector('#hideOptions')!

export const sidebarExpanded = document.querySelector('#sidebar_expanded') as HTMLElement

export const sidebarCollapsed = document.querySelector('#sidebar_collapsed') as HTMLElement

export const downloadPng = document.querySelector("#save")!

export function trueSizeCanvas() {
    canvas.width = Math.max(1, parseInt(getComputedStyle(canvas).width)) * devicePixelRatio
    canvas.height = Math.max(1, parseInt(getComputedStyle(canvas).height)) * devicePixelRatio
    renderImmediate()
}

new ResizeObserver(trueSizeCanvas).observe(canvas)
