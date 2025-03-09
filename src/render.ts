import { canvas } from "./dom.js"
import { LatLon, LatLonCompact, model } from "./model/model.js"
import { Colorer } from "./model/coloring.js"
import { ARLINGTON, BOSTON, CAMBRIDGE, MEDFORD, SOMERVILLE } from "./cities.js"
import { DEDISTORT } from "./model/dedistort.js"
import { CompactActivity } from "./model/activity.js"
import { DISCONTIGUOUS_S } from "./model/gpx_json.js"


let renderPending = false
export function render() {
    if (renderPending) return
    renderPending = true
    requestAnimationFrame(renderImmediate)
}

function cachedPathDedistortXY(pts: { x: number, y: number }[]): Path2D {
    const cached: Path2D = (pts as any)['path2d']
    if (cached) return cached
    const p = new Path2D()
    for (const pt of pts) {
        p.lineTo(pt.x, pt.y)
    }
    (pts as any)['path2d'] = p
    return p
}


function cachedPathTrueLatLon(pts: LatLon[]): Path2D {
    const cached: Path2D = (pts as any)['path2d']
    if (cached) return cached
    const p = new Path2D()
    for (const pt of pts) {
        p.lineTo(DEDISTORT * pt.lon, pt.lat)
    }
    (pts as any)['path2d'] = p
    return p
}

// Can handle discontiguous
function cachedPathDedistortPtJson(pts: LatLonCompact[], times: number[]): Path2D {
    const cached: Path2D = (pts as any)['path2d']
    if (cached) return cached
    const p = new Path2D()

    for (let i = 0; i < pts.length - 1; ++i) {
        const pt = pts[i]
        if (i == 0 || (times[i] - times[i - 1] > DISCONTIGUOUS_S))
            p.moveTo(DEDISTORT * pt[1], pt[0])
        else
            p.lineTo(DEDISTORT * pt[1], pt[0])
    }
    (pts as any)['path2d'] = p
    return p
}


// Forces a synchronous render, should be used rarely and render() preferred
export function renderImmediate() {
    renderPending = false

    // const start = performance.now()
    const canvasw = canvas.width
    const canvash = canvas.height
    canvas.width = canvasw
    canvas.height = canvash

    const ctx = canvas.getContext('2d', { 'alpha': false })!

    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.rect(0, 0, canvasw, canvash)
    ctx.fill()

    const cam = model.cam
    cam.applyTransform(ctx)

    const THIN_LINE_WIDTH = cam.mapInverseDelta({ x: 1, y: 0 }).x
    const MEDIUM_LINE_WIDTH = cam.mapInverseDelta({ x: 3, y: 0 }).x
    const WIDE_LINE_WIDTH = cam.mapInverseDelta({ x: 5, y: 0 }).x

    if (model.citySelect === 'clip_somerville') {
        ctx.clip(cachedPathDedistortXY(SOMERVILLE))
    }
    if (model.citySelect === 'clip_cam') {
        ctx.clip(cachedPathDedistortXY(CAMBRIDGE))
    }

    if (model.citySelect === 'high') {
        const RED = 'hsl(0 50% 10%)'
        const YELLOW = 'hsl(50 50% 10%)'
        const GREEN = 'hsl(150 50% 10%)'
        const ORANGE = 'hsl(25 50% 10%)'

        ctx.fillStyle = YELLOW
        ctx.fill(cachedPathDedistortXY(CAMBRIDGE))

        ctx.fillStyle = GREEN
        ctx.fill(cachedPathDedistortXY(SOMERVILLE))

        ctx.fillStyle = ORANGE
        ctx.fill(cachedPathDedistortXY(BOSTON))

        ctx.fill(cachedPathDedistortXY(ARLINGTON))

        ctx.fillStyle = RED
        ctx.fill(cachedPathDedistortXY(MEDFORD))
    }

    const waters = model.waters
    if (waters) {
        ctx.fillStyle = '#358'
        ctx.strokeStyle = '#358'

        for (const w of waters) {
            const path = cachedPathTrueLatLon(w.bank)
            if (w.closed) ctx.fill(path)
            else ctx.stroke(path)
        }
    }

    const paths = model.paths
    if (paths) {
        ctx.lineWidth = THIN_LINE_WIDTH
        let lastStrokeStyle = ''
        for (const w of paths) {
            /*
            const seen = w.num_rides || 0
            const color = new Map<number, string>([
                [0, '#700'],
                [1, '#338'],
                [2, '#559'],
                [3, '#77a'],
                [4, '#9aa'],
                [5, '#3c3'],
            ])
            const next = color.get(Math.round(seen)) || '#0F0'
            */
            const seen = w.seen_percent ?? 0
            const next = seen > 0.7 ? '#090' :
                seen > 0.5 ? '#990' : '#900'
            if (next != lastStrokeStyle) lastStrokeStyle = ctx.strokeStyle = next
            ctx.stroke(cachedPathTrueLatLon(w.nodes))
        }
    }

    function renderActivity(a: CompactActivity, colorer: Colorer) {
        const pts = a.latlngs
        const times = a.times

        if (!pts) {
            return
        }

        if (pts.length != times.length) {
            console.error('Malformed data: times and latlns length differs')
        }

        if (pts.length == 0) return

        colorer.activateActivity(a)

        const fixedColor = colorer.fixedColor(a)
        if (fixedColor) {
            ctx.strokeStyle = fixedColor
            ctx.stroke(cachedPathDedistortPtJson(pts, times))
            return
        }

        // If we're a non-fixed color strat we don't use the cache because we have
        // to break up the line at different points. This could use a color segmented
        // cache but...
        for (let i = 1; i < pts.length; ++i) {
            const pt = pts[i]

            const strokeStyle = colorer.color(i)
            const strokeStyleIdx = i
            ctx.strokeStyle = strokeStyle
            ctx.beginPath()
            {
                const prev = pts[i - 1]
                ctx.moveTo(DEDISTORT * prev[1], prev[0])
            }

            ctx.lineTo(DEDISTORT * pt[1], pt[0])

            let last_t = times[i]
            // Add points to the same line as long as strokestyle
            // of the next point is the same. 
            // eslint-disable-next-line no-constant-condition
            while (true) {
                const next = pts[i + 1]
                if (!next) break

                const next_t = times[i + 1]
                const delta = next_t - last_t
                last_t = next_t

                // Don't draw lines between points where gps was off.
                if (delta > DISCONTIGUOUS_S) {
                    i++
                    break
                }

                // Only change colors at most once per 10 points
                if ((i - strokeStyleIdx > 10) && colorer.color(i + 1) != strokeStyle) break

                i++

                ctx.lineTo(DEDISTORT * next[1], next[0])
            }

            ctx.stroke()
        }
    }

    // First render any of the 'nonactive' ones, but forced light gray
    // then render all of the 'active' ones on top
    ctx.lineWidth = THIN_LINE_WIDTH

    const RENDER_ACTIVITIES = true

    if (RENDER_ACTIVITIES) {
        const currentSet = new Set(model.current)
        for (const a of model.activities) {
            if (!currentSet.has(a)) renderActivity(a, model.deselectedColorer)
        }

        if (currentSet.size < model.activities.length)
            ctx.lineWidth = MEDIUM_LINE_WIDTH

        for (const a of model.current) {
            renderActivity(a, model.colorer)
        }
    }

    if (model.citySelect === 'clip_somerville') {
        ctx.lineWidth = WIDE_LINE_WIDTH
        ctx.strokeStyle = '#FFF'
        ctx.stroke(cachedPathDedistortXY(SOMERVILLE))
    }
    if (model.citySelect === 'clip_cam') {
        ctx.lineWidth = WIDE_LINE_WIDTH
        ctx.strokeStyle = '#FFF'
        ctx.stroke(cachedPathDedistortXY(CAMBRIDGE))
    }

    // const end = performance.now()
    // console.log('Render time:', end - start)
}

(window as any).render = render