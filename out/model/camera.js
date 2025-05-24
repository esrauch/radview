import { canvas } from "../dom.js";
import { Listenable } from "../listenable.js";
const MAX_RENDER_SCALE = 50000;
const MIN_RENDER_SCALE = 1000;
export class Camera extends Listenable {
    constructor() {
        super();
        this.left = -52.7;
        this.top = 42.2;
        this.right = -52.3;
        this.bottom = 42.5;
        // left = -71
        // top = 42.341
        // right = -72
        // bottom = 42.436
        this.canvasw = 0;
        this.canvash = 0;
        this.renderscale = 0;
        this.canvasw = canvas.width;
        this.canvash = canvas.height;
        this.fixRenderScale();
    }
    updateCanvasWH() {
        this.canvasw = canvas.width;
        this.canvash = canvas.height;
        this.fixRenderScale();
    }
    fixRenderScale() {
        const minx = this.left;
        const maxx = this.right;
        this.renderscale = this.canvasw / (maxx - minx);
        // Just to avoid some enormous jump doing a bad thing, also cap here
        this.renderscale = Math.min(this.renderscale, MAX_RENDER_SCALE);
        this.renderscale = Math.max(this.renderscale, MIN_RENDER_SCALE);
        this.triggerListeners();
    }
    getTransform() {
        return new DOMMatrix().
            scale(this.renderscale, -this.renderscale).
            translate(-this.left, -this.bottom);
    }
    applyTransform(ctx) {
        ctx.resetTransform();
        ctx.setTransform(this.getTransform());
    }
    // Maps from lat/long to screen px
    map(pt) {
        const p = new DOMPoint(pt.x, pt.y);
        return this.getTransform().transformPoint(p);
    }
    // Maps a lat/long _difference_ to a screen px difference
    mapDelta(pt) {
        return { x: pt.x * this.renderscale, y: -pt.y * this.renderscale };
    }
    // Maps from screen px to lat/long
    mapInverse(pt) {
        return this.getTransform().inverse().transformPoint(pt);
    }
    // Maps a screen px _difference_ to a lat/lon difference
    mapInverseDelta(pt) {
        return { x: pt.x / this.renderscale, y: -pt.y / this.renderscale };
    }
    zoom(mult, zoom_center) {
        if (this.renderscale >= MAX_RENDER_SCALE && mult < 1)
            return;
        if (this.renderscale <= MIN_RENDER_SCALE && mult > 1)
            return;
        let [miny, minx, maxy, maxx] = [this.top, this.left, this.bottom, this.right];
        const w = maxx - minx;
        const h = maxy - miny;
        const center = {
            x: minx + (maxx - minx) / 2,
            y: miny + (maxy - miny) / 2
        };
        if (!zoom_center) {
            zoom_center = center;
        }
        const { zcx, zcy } = { zcx: zoom_center.x, zcy: zoom_center.y };
        // We attribute a _portion_ of the zoom mult based on where the zoom_center is
        // relative to the current center.
        // For example, zoom_center left is in the center then we want to apply it equally to left and right
        // If the zoom center is all the way on the left, then it should only move _right_
        // Anything between is linearly interpolated
        const portion_left = (zcx - minx) / w;
        const portion_right = 1 - portion_left;
        const portion_top = (zcy - miny) / h;
        const portion_bot = 1 - portion_top;
        const wdelta = (w * mult) - w;
        const hdelta = (h * mult) - h;
        minx -= (wdelta * portion_left);
        miny -= (hdelta * portion_top);
        maxx += (wdelta * portion_right);
        maxy += (hdelta * portion_bot);
        this.top = miny;
        this.left = minx;
        this.bottom = maxy;
        this.right = maxx;
        this.fixRenderScale();
    }
    pan(delta) {
        const { dx, dy } = { dx: delta.x, dy: delta.y };
        this.top -= dy;
        this.bottom -= dy;
        this.left -= dx;
        this.right -= dx;
        this.fixRenderScale();
    }
    zoomIn() {
        this.zoom(1 / 1.1);
    }
    zoomOut() {
        this.zoom(1.1);
    }
}
