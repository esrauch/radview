import { canvas } from "./dom.js";
import { model } from "./model/model.js";
import { cambridge, fillCities, somerville } from "./cities.js";
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
function strokeWithFixedLineWidth(ctx) {
    const t = ctx.getTransform();
    ctx.resetTransform();
    ctx.stroke();
    ctx.setTransform(t);
}
// function cachedPathTrueLatLon(pts: LatLon[]): Path2D {
//     const cached: Path2D = (pts as any)['path2d']
//     if (cached) return cached
//     const p = new Path2D()
//     for (const pt of pts) {
//         p.moveTo(DEDISTORT * pt.lon, pt.lat)
//     }
// }
// Forces a synchronous render, should be used rarely and render() preferred
export function renderImmediate() {
    renderPending = false;
    const start = performance.now();
    const canvasw = canvas.width;
    const canvash = canvas.height;
    canvas.width = canvasw;
    canvas.height = canvash;
    const ctx = canvas.getContext('2d');
    const cam = model.cam;
    cam.applyTransform(ctx);
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.rect(0, 0, canvasw, canvash);
    ctx.fill();
    if (model.citySelect === 'clip_somerville') {
        somerville(ctx);
        ctx.clip();
    }
    if (model.citySelect === 'clip_cam') {
        cambridge(ctx);
        ctx.clip();
    }
    if (model.citySelect === 'high') {
        fillCities(ctx);
    }
    const waters = model.waters;
    if (waters) {
        ctx.fillStyle = '#358';
        ctx.strokeStyle = '#358';
        for (const w of waters) {
            // const path = cachedPathTrueLatLon(w.bank)
            // if (w.closed) ctx.fill(path)
            // else ctx.stroke(path)
            ctx.beginPath();
            for (const pt of w.bank) {
                ctx.lineTo(DEDISTORT * pt.lon, pt.lat);
            }
            if (w.closed) {
                ctx.fill();
            }
            else {
                strokeWithFixedLineWidth(ctx);
            }
        }
    }
    const paths = model.paths;
    if (paths) {
        ctx.lineWidth = 2;
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
            strokeWithFixedLineWidth(ctx);
        }
    }
    function renderActivity(a, colorer) {
        const pts = a.pts;
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
            strokeWithFixedLineWidth(ctx);
        }
    }
    // First render any of the 'nonactive' ones, but forced light gray
    // then render all of the 'active' ones on top
    ctx.lineWidth = 1;
    const currentSet = new Set(model.current);
    for (const a of model.activities) {
        if (!currentSet.has(a))
            renderActivity(a, model.deselectedColorer);
    }
    if (currentSet.size < model.activities.length)
        ctx.lineWidth = 2.5;
    for (const a of model.current) {
        renderActivity(a, model.colorer);
    }
    if (model.citySelect === 'clip_somerville') {
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#FFF';
        somerville(ctx);
        strokeWithFixedLineWidth(ctx);
    }
    if (model.citySelect === 'clip_cam') {
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#FFF';
        cambridge(ctx);
        strokeWithFixedLineWidth(ctx);
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
