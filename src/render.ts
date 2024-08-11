import { canvas } from "./dom.js"
import { model } from "./model/model.js"
import { Colorer } from "./model/coloring.js"
import { cambridge, fillCities, somerville } from "./cities.js"
import { ActivityJson, DISCONTIGUOUS_MS } from "./model/gpx_json.js"
import { APPROXIMATE_HOME, HOME_PRIVACY_CIRCLE_RADIUS_DEG } from "./model/privacy.js"
import { DEDISTORT } from "./model/dedistort.js"


let renderPending = false
export function render() {
    if (renderPending) return
    renderPending = true
    requestAnimationFrame(renderImmediate)
}

// Forces a synchronous render, should be used rarely and render() preferred
export function renderImmediate() {
    renderPending = false

    const start = performance.now()
    const canvasw = canvas.width
    const canvash = canvas.height
    canvas.width = canvasw
    canvas.height = canvash

    const cam = model.cam

    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.rect(0, 0, canvasw, canvash)
    ctx.fill()

    if (model.citySelect === 'clip_somerville') {
        somerville(ctx, cam)
        ctx.clip()
    }
    if (model.citySelect === 'clip_cam') {
        cambridge(ctx, cam)
        ctx.clip()
    }

    if (model.citySelect === 'high') {
        fillCities(ctx, cam)
    }

    const waters = model.world?.waters
    if (waters) {
        ctx.fillStyle = '#358'
        ctx.strokeStyle = '#358'

        for (const w of waters) {
            ctx.beginPath()
            for (const pt of w.bank) {
                const mapped = cam.map({ x: DEDISTORT * pt.lon, y: pt.lat })
                ctx.lineTo(mapped.x, mapped.y)
            }

            if (w.closed) {
                ctx.closePath()
                ctx.fill()
            } else
                ctx.stroke()
        }
    }

    function renderActivity(a: ActivityJson, colorer: Colorer) {
        const pts = a.pts
        for (let i = 1; i < pts.length; ++i) {
            const pt = pts[i]

            const strokeStyle = colorer.color(pt)
            ctx.strokeStyle = strokeStyle
            ctx.beginPath()
            {
                const prev = pts[i - 1]
                const { x, y } = cam.map({ x: prev.lon, y: prev.lat })
                ctx.moveTo(x, y)
            }

            const { x, y } = cam.map({ x: pt.lon, y: pt.lat })
            ctx.lineTo(x, y)


            let last_t = +pt.time
            // Add points to the same line as long as strokestyle
            // of the next point is the same. 
            // eslint-disable-next-line no-constant-condition
            while (true) {
                const next = pts[i + 1]
                if (!next) break

                const next_t = +next.time
                const delta = next_t - last_t
                last_t = next_t

                // Don't draw lines between points where gps was off.
                if (delta > DISCONTIGUOUS_MS) {
                    i++
                    break
                }

                if (colorer.color(next) != strokeStyle) break

                i++

                const { x, y } = cam.map({ x: next.lon, y: next.lat })
                ctx.lineTo(x, y)
            }

            ctx.stroke()
        }
    }

    // First render any of the 'nonactive' ones, but forced light gray
    // then render all of the 'active' ones on top
    ctx.lineWidth = 1

    const currentSet = new Set(model.current)
    for (const a of model.activities) {
        if (!currentSet.has(a)) renderActivity(a, model.deselectedColorer)
    }

    if (currentSet.size < model.activities.length)
        ctx.lineWidth = 2.5

    for (const a of model.current) {
        renderActivity(a, model.colorer)
    }

    if (model.citySelect === 'clip_somerville') {
        ctx.lineWidth = 4
        ctx.strokeStyle = '#FFF'
        somerville(ctx, cam)
        ctx.stroke()
    }
    if (model.citySelect === 'clip_cam') {
        ctx.lineWidth = 4
        ctx.strokeStyle = '#FFF'
        cambridge(ctx, cam)
        ctx.stroke()
    }


    const pt = cam.map({ x: APPROXIMATE_HOME.lon, y: APPROXIMATE_HOME.lat })
    const radius = cam.mapDelta({ x: HOME_PRIVACY_CIRCLE_RADIUS_DEG, y: 0 }).x
    ctx.fillStyle = '#555'
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, radius, 0, 2 * Math.PI)
    ctx.closePath()
    ctx.fill()

    // const end = performance.now()
    // console.log('Render time:', end - start)
}

(window as any).render = render