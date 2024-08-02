import { renderImmediate } from "./render.js"


export const canvas = document.querySelector('canvas')!

export const desc = document.querySelector('.desc')!

export const colorInputSelect = document.querySelector('#coloring') as HTMLSelectElement

export const colorTableParent = document.querySelector('#colorTableParent')!

export const rideFilterSelect = document.querySelector('#ride') as HTMLSelectElement

export const citySelect = document.querySelector('#city') as HTMLSelectElement

export function trueSizeCanvas() {
    canvas.width = Math.max(1, parseInt(getComputedStyle(canvas).width))
    canvas.height = Math.max(1, parseInt(getComputedStyle(canvas).height))
    renderImmediate()
}

new ResizeObserver(trueSizeCanvas).observe(canvas)
