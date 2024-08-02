import { canvas } from "../dom.js";
import { model } from "../model/model.js";
export function initMouse() {
    canvas.addEventListener('click', onMouseClick);
    canvas.addEventListener('mousewheel', onMouseWheel);
    canvas.addEventListener('mousemove', onMouseMove);
}
function onMouseClick(evt) {
    const e = evt;
    const center = model.cam.mapInverse({ x: e.offsetX, y: e.offsetY });
    console.log(center);
}
function onMouseWheel(evt) {
    const e = evt;
    const center = model.cam.mapInverse({ x: e.offsetX, y: e.offsetY });
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
