import { canvas } from "../dom.js";
import { model } from "../model/model.js";
export function initMouse() {
    canvas.addEventListener('click', onMouseClick);
    canvas.addEventListener('mousewheel', onMouseWheel);
    canvas.addEventListener('mousemove', onMouseMove);
}
function xyForMouseEvent(evt) {
    return {
        x: evt.offsetX * devicePixelRatio,
        y: evt.offsetY * devicePixelRatio
    };
}
function onMouseClick(evt) {
    const e = evt;
    const center = model.cam.mapInverse(xyForMouseEvent(e));
    console.log(center);
}
function onMouseWheel(evt) {
    const e = evt;
    const center = model.cam.mapInverse(xyForMouseEvent(e));
    model.cam.zoom(1 - e.deltaY / 1000, center);
    evt.preventDefault();
}
function onMouseMove(evt) {
    if (evt.buttons == 0)
        return;
    const delta = model.cam.mapInverseDelta({ x: evt.movementX, y: evt.movementY });
    model.cam.pan(delta);
    evt.preventDefault();
}
