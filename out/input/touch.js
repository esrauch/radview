import { canvas } from "../dom.js";
import { model } from "../model/model.js";
export function initTouch() {
    canvas.addEventListener('touchstart', start);
    canvas.addEventListener('touchend', end);
    canvas.addEventListener('touchcancel', cancel);
    canvas.addEventListener('touchmove', move);
}
function xyForTouch(t) {
    const bcr = t.target.getBoundingClientRect();
    const x = t.clientX - bcr.x;
    const y = t.clientY - bcr.y;
    return { x, y };
}
function xyDist(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}
function avgDist(list, to) {
    let sum = 0;
    for (const xy of list) {
        sum += xyDist(xy, to);
    }
    return sum / list.length;
}
const touches = new Map();
function updateTouches(e) {
    touches.clear();
    for (let i = 0; i < e.touches.length; ++i) {
        const t = e.touches.item(i);
        touches.set(t.identifier, xyForTouch(t));
    }
}
function start(e) {
    e.preventDefault();
    updateTouches(e);
}
function move(e) {
    e.preventDefault();
    const ts = e.touches;
    const cam = model.cam;
    if (ts.length == 0) {
        console.error('move with 0 touches?');
        return;
    }
    if (ts.length == 1) {
        const t = ts.item(0);
        const newXy = xyForTouch(t);
        const oldXy = touches.get(t.identifier);
        if (touches.size !== 1 || !oldXy) {
            console.error('bad touch state :(');
            return;
        }
        const deltaPx = { x: newXy.x - oldXy.x, y: newXy.y - oldXy.y };
        const delta = cam.mapInverseDelta(deltaPx);
        cam.pan(delta);
        updateTouches(e);
        return;
    }
    // Multifinger gesture
    const num = ts.length;
    if (num != touches.size) {
        console.error('move where touch count mismatch', ts, touches);
        return;
    }
    const newXys = [];
    for (let i = 0; i < ts.length; ++i) {
        newXys.push(xyForTouch(ts.item(i)));
    }
    const newSum = newXys.reduce((a, b) => ({ x: a.x + b.x, y: a.y + b.y }));
    const newCenter = { x: newSum.x / num, y: newSum.y / num };
    const oldXys = [...touches.values()];
    const oldSum = oldXys.reduce((a, b) => ({ x: a.x + b.x, y: a.y + b.y }));
    const oldCenter = { x: oldSum.x / num, y: oldSum.y / num };
    const deltaPx = { x: newCenter.x - oldCenter.x, y: newCenter.y - oldCenter.y };
    const delta = cam.mapInverseDelta(deltaPx);
    cam.pan(delta);
    // The zoom amount is determined by the ratio between:
    // - The average distance between the center and each of the touches before
    // - The same for the touches now
    const oldAvgDist = avgDist(oldXys, oldCenter);
    const newAvgDist = avgDist(newXys, newCenter);
    cam.zoom(oldAvgDist / newAvgDist, cam.mapInverse(newCenter));
    updateTouches(e);
}
function end(e) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; ++i) {
        const t = e.changedTouches.item(i);
        touches.delete(t.identifier);
    }
}
function cancel(e) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; ++i) {
        const t = e.changedTouches.item(i);
        touches.delete(t.identifier);
    }
}
