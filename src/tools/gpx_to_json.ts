import { ActivityJson, DISCONTIGUOUS_MS, PtJson } from "../model/gpx_json.js"
import { APPROXIMATE_HOME, closeToHome } from "../model/privacy.js"

function $<T>(t: T | null | undefined): T {
    if (!t) throw 'Missing required value'
    return t
}

function XmlDocumentToJson(gpx: Document): ActivityJson {
    const metadata = $(gpx.querySelector('metadata'))
    const date = +new Date($(metadata.querySelector('time')?.textContent))

    const trk = $(gpx.querySelector('trk'))

    const name = $(trk.querySelector('name')?.textContent)
    const type = $(trk.querySelector('type')?.textContent)

    const xmlpts = Array.from(trk.querySelectorAll('trkpt')).filter((val, index) => index % 3 == 0)

    const pts = xmlpts.map(TrkPtXmlToJson)

    let distDegrees = 0
    for (let i = 1; i < pts.length; ++i) {
        const prev = pts[i - 1]
        const curr = pts[i]
        const dx = curr.lon - prev.lon
        const dy = curr.lat - prev.lat
        const deltaDeg = Math.sqrt(dx * dx + dy * dy)
        const ms = (+curr.time) - (+prev.time)

        // In discontiguous gaps don't count it for mph
        // or for total distance.
        if (ms < DISCONTIGUOUS_MS) {
            distDegrees += deltaDeg
            const deltaMiles = deltaDeg * 69
            const hours = ms / 1000 / 60 / 60
            curr.mph = deltaMiles / hours
        }
    }
    const miles = distDegrees * 69

    // Resmooth over the speed: instanteous speed is too noisy
    // which is also a performance problem
    denoiseSpeed(pts)

    let movingTimeMs = 0
    for (let i = 0; i < pts.length - 1; ++i) {
        const a = pts[i]
        const b = pts[i + 1]
        const ms = (+b.time) - (+a.time)
        if (a.mph > 5 && ms < DISCONTIGUOUS_MS) {
            movingTimeMs += ms
        }
    }

    // Apply the privacy filter
    for (let i = 0; i < pts.length; ++i) {
        const pt = pts[i]
        if (closeToHome(pt)) {
            pt.lat = APPROXIMATE_HOME.lat
            pt.lon = APPROXIMATE_HOME.lon
        }
    }

    return {
        date,
        name,
        type,
        pts,
        miles,
        movingTimeMs
    }
}

// Map the long into a space where 1 degree = 69 miles in both lat and lon
// Not sure why it overdistorts to do this live on every point
// let dedistort = Math.cos(lat / 180 * Math.PI)
const CAM_DEDISTORT = 0.7390340695856275

function TrkPtXmlToJson(el: Element): PtJson {
    const lat = +$(el.getAttribute('lat'))
    const lon = CAM_DEDISTORT * +$(el.getAttribute('lon'))
    const time = +new Date($(el.querySelector('time')?.textContent))
    const ele = +$(el.querySelector('ele')?.textContent)

    let hr
    const hrs = el.getElementsByTagName('gpxtpx:hr')
    if (hrs.length > 1) throw 'Expected 0 or 1 hr per pt'
    if (hrs.length == 1) {
        hr = +$(hrs[0].textContent)
    }

    return {
        lat,
        lon,
        time,
        ele,
        hr,
        mph: 0
    }
}

function denoiseSpeed(pts: PtJson[]) {
    const denoised = []
    for (let i = 0; i < pts.length; ++i) {
        let sum = pts[i].mph
        let count = 1
        for (let j = i - 10; j <= i + 10; ++j) {
            const mph = pts[j]?.mph
            if (!mph) continue
            const weight = Math.sqrt(1 / (Math.abs(i - j) + 1))
            sum += mph * weight
            count += weight
        }
        denoised[i] = sum / count
    }

    for (let i = 0; i < pts.length; ++i) {
        pts[i].mph = denoised[i]
    }
}

async function fetchGpx(gpxname: string): Promise<Document> {
    const f = await fetch(gpxname)
    const text = await f.text()
    const doc = new DOMParser().parseFromString(text, 'text/xml')
    return doc
}

async function main() {
    const fetches = []
    for (let i = 1; i <= 59; ++i) {
        // 12 doesn't exist. spooky
        if (i == 12) continue
        fetches.push(fetchGpx(`gpx/${i}.gpx`))
    }
    const documents = await Promise.all(fetches)
    const activities = documents.map(XmlDocumentToJson)
    console.log(activities)
}

main()