import { canvas } from "../dom.js"
import { model } from "../model/model.js"


export function initMouse() {
    canvas.addEventListener('click', onMouseClick)

    canvas.addEventListener('mousewheel', onMouseWheel)
    canvas.addEventListener('mousemove', onMouseMove)
}

function xyForMouseEvent(evt: MouseEvent): { x: number, y: number } {
    return {
        x: evt.offsetX * devicePixelRatio,
        y: evt.offsetY * devicePixelRatio
    }
}

function onMouseClick(evt: Event) {
    const e = evt as MouseEvent
    const center = model.cam.mapInverse(xyForMouseEvent(e))
    console.log(center)
}


function onMouseWheel(evt: Event) {
    const e = evt as WheelEvent

    const center = model.cam.mapInverse(xyForMouseEvent(e))
    model.cam.zoom(1 - e.deltaY / 1000, center)
    evt.preventDefault()
}

function onMouseMove(evt: MouseEvent) {
    if (evt.buttons == 0) return
    const delta = model.cam.mapInverseDelta({ x: evt.movementX * devicePixelRatio, y: evt.movementY * devicePixelRatio })
    model.cam.pan(delta)
    evt.preventDefault()
}