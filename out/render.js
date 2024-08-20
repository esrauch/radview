import { canvas } from "./dom.js";
import { model } from "./model/model.js";
import { ARLINGTON, BOSTON, CAMBRIDGE, MEDFORD, SOMERVILLE } from "./cities.js";
import { DISCONTIGUOUS_MS } from "./model/gpx_json.js";
import { APPROXIMATE_HOME, HOME_PRIVACY_CIRCLE_RADIUS_DEG } from "./model/privacy.js";
import { DEDISTORT } from "./model/dedistort.js";
let renderPending = false;
export function render() {
    if (renderPending)
        return;
    renderPending = true;
    requestAnimationFrame(renderImmediate);
}
function cachedPathDedistortXY(pts) {
    const cached = pts['path2d'];
    if (cached)
        return cached;
    const p = new Path2D();
    for (const pt of pts) {
        p.lineTo(pt.x, pt.y);
    }
    pts['path2d'] = p;
    return p;
}
function cachedPathTrueLatLon(pts) {
    const cached = pts['path2d'];
    if (cached)
        return cached;
    const p = new Path2D();
    for (const pt of pts) {
        p.lineTo(DEDISTORT * pt.lon, pt.lat);
    }
    pts['path2d'] = p;
    return p;
}
// Can handle distontiguous
function cachedPathDedistortPtJson(pts) {
    const cached = pts['path2d'];
    if (cached)
        return cached;
    const p = new Path2D();
    let last = pts[0];
    for (const pt of pts) {
        if (pt.time - last.time > DISCONTIGUOUS_MS)
            p.moveTo(pt.lon, pt.lat);
        else
            p.lineTo(pt.lon, pt.lat);
        last = pt;
    }
    pts['path2d'] = p;
    return p;
}
// Forces a synchronous render, should be used rarely and render() preferred
export function renderImmediate() {
    renderPending = false;
    const start = performance.now();
    const canvasw = canvas.width;
    const canvash = canvas.height;
    canvas.width = canvasw;
    canvas.height = canvash;
    const ctx = canvas.getContext('2d', { 'alpha': false });
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.rect(0, 0, canvasw, canvash);
    ctx.fill();
    const cam = model.cam;
    cam.applyTransform(ctx);
    const THIN_LINE_WIDTH = cam.mapInverseDelta({ x: 1, y: 0 }).x;
    const MEDIUM_LINE_WIDTH = cam.mapInverseDelta({ x: 3, y: 0 }).x;
    const WIDE_LINE_WIDTH = cam.mapInverseDelta({ x: 5, y: 0 }).x;
    if (model.citySelect === 'clip_somerville') {
        ctx.clip(cachedPathDedistortXY(SOMERVILLE));
    }
    if (model.citySelect === 'clip_cam') {
        ctx.clip(cachedPathDedistortXY(CAMBRIDGE));
    }
    if (model.citySelect === 'high') {
        const RED = 'hsl(0 50% 10%)';
        const YELLOW = 'hsl(50 50% 10%)';
        const GREEN = 'hsl(150 50% 10%)';
        const ORANGE = 'hsl(25 50% 10%)';
        ctx.fillStyle = YELLOW;
        ctx.fill(cachedPathDedistortXY(CAMBRIDGE));
        ctx.fillStyle = GREEN;
        ctx.fill(cachedPathDedistortXY(SOMERVILLE));
        ctx.fillStyle = ORANGE;
        ctx.fill(cachedPathDedistortXY(BOSTON));
        ctx.fill(cachedPathDedistortXY(ARLINGTON));
        ctx.fillStyle = RED;
        ctx.fill(cachedPathDedistortXY(MEDFORD));
    }
    const waters = model.waters;
    if (waters) {
        ctx.fillStyle = '#358';
        ctx.strokeStyle = '#358';
        for (const w of waters) {
            const path = cachedPathTrueLatLon(w.bank);
            if (w.closed)
                ctx.fill(path);
            else
                ctx.stroke(path);
        }
    }
    const paths = model.paths;
    if (paths) {
        ctx.lineWidth = MEDIUM_LINE_WIDTH;
        for (const w of paths) {
            const seen = w.seen_amount || 0;
            ctx.strokeStyle =
                seen < 0.3 ? '#F00' :
                    seen < 0.6 ? '#F70' :
                        '#020';
            ctx.beginPath();
            for (const pt of w.nodes) {
                ctx.lineTo(DEDISTORT * pt.lon, pt.lat);
            }
            ctx.stroke();
        }
    }
    function renderActivity(a, colorer) {
        const pts = a.pts;
        if (pts.length == 0)
            return;
        if (colorer.isSingleColorForPath()) {
            ctx.strokeStyle = colorer.color(pts[0]);
            ctx.stroke(cachedPathDedistortPtJson(pts));
            return;
        }
        // If we're a non-fixed color strat we don't use the cache because we have
        // to break up the line at different points. This could use a color segmented
        // cache but...
        for (let i = 1; i < pts.length; ++i) {
            const pt = pts[i];
            const strokeStyle = colorer.color(pt);
            ctx.strokeStyle = strokeStyle;
            ctx.beginPath();
            {
                const prev = pts[i - 1];
                ctx.moveTo(prev.lon, prev.lat);
            }
            ctx.lineTo(pt.lon, pt.lat);
            let last_t = +pt.time;
            // Add points to the same line as long as strokestyle
            // of the next point is the same. 
            // eslint-disable-next-line no-constant-condition
            while (true) {
                const next = pts[i + 1];
                if (!next)
                    break;
                const next_t = +next.time;
                const delta = next_t - last_t;
                last_t = next_t;
                // Don't draw lines between points where gps was off.
                if (delta > DISCONTIGUOUS_MS) {
                    i++;
                    break;
                }
                if (colorer.color(next) != strokeStyle)
                    break;
                i++;
                ctx.lineTo(next.lon, next.lat);
            }
            ctx.stroke();
        }
    }
    // First render any of the 'nonactive' ones, but forced light gray
    // then render all of the 'active' ones on top
    ctx.lineWidth = THIN_LINE_WIDTH;
    const currentSet = new Set(model.current);
    for (const a of model.activities) {
        if (!currentSet.has(a))
            renderActivity(a, model.deselectedColorer);
    }
    if (currentSet.size < model.activities.length)
        ctx.lineWidth = MEDIUM_LINE_WIDTH;
    for (const a of model.current) {
        renderActivity(a, model.colorer);
    }
    if (model.citySelect === 'clip_somerville') {
        ctx.lineWidth = WIDE_LINE_WIDTH;
        ctx.strokeStyle = '#FFF';
        ctx.stroke(cachedPathDedistortXY(SOMERVILLE));
    }
    if (model.citySelect === 'clip_cam') {
        ctx.lineWidth = WIDE_LINE_WIDTH;
        ctx.strokeStyle = '#FFF';
        ctx.stroke(cachedPathDedistortXY(CAMBRIDGE));
    }
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.arc(APPROXIMATE_HOME.lon, APPROXIMATE_HOME.lat, HOME_PRIVACY_CIRCLE_RADIUS_DEG, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
    const end = performance.now();
    console.log('Render time:', end - start);
}
window.render = render;
