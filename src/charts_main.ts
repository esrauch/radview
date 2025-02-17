import { CompactActivity, getHumanActivityName } from "./model/activity.js"
import { durationSToHHMMSS } from "./util/time.js"
import { max, min } from "./util/util.js"

async function load(): Promise<CompactActivity[]> {
    const activityJsonFile = await fetch('rides_json')
    if (!activityJsonFile.ok) {
        alert('failed to open json')
        throw ('failed to open json')
    }
    const activities = (await activityJsonFile.json()) as CompactActivity[]
    return activities
}

function addActivity(el: HTMLSelectElement, a: CompactActivity) {
    const opt = document.createElement('option')
    opt.label = getHumanActivityName(a)
    opt.value = `${a.id}`
    el.appendChild(opt)
}

function init(activities: CompactActivity[]) {
    const activitySelect = document.querySelector('#activity') as HTMLSelectElement | undefined
    if (!activitySelect) {
        throw 'missing activity select'
    }
    const chartsContainerMaybe = document.querySelector('#chartsContainer')
    if (!chartsContainerMaybe) {
        throw 'missing charts container'
    }
    const chartsContainer = chartsContainerMaybe
    for (let i = activities.length - 1; i >= 0; --i)
        addActivity(activitySelect, activities[i])

    activitySelect.addEventListener('change', () => {
        addCharts(activitySelect.selectedOptions[0].value)
    })
    addCharts('all')

    function addCharts(id: string) {
        chartsContainer.innerHTML = ''

        if (id == 'all') {
            addAllCharts()
            return
        }
        const a = activities.find(act => act.id == +id)
        if (!a) throw `missing activity ${id}`

        if (a.latlngs) {
            const lats = a.latlngs.map(ll => ll[0])
            const lons = a.latlngs.map(ll => ll[1])
            addChart(lons, lats, 'lon', 'lat')
        }

        for (const s of a.streams) addChart(a.times, s.data, 'time', s.type)

        const mph = a.streams.find(s => s.type == 'mph')
        const grade = a.streams.find(s => s.type == 'grade_pct')
        if (mph && grade) {
            addChart(grade.data, mph.data, 'grade_pct', 'mph', 'scatter')
        }
    }

    // The "all" charts
    function addAllCharts() {
        // ride # vs ride properties
        {
            const dates = activities.map(a => +new Date(a.date))
            addChart(dates, activities.map(a => a.average_speed_mph), 'date', 'avg mph', 'scatter')
            addChart(dates, activities.map(a => a.miles), 'date', 'miles', 'scatter')
        }

        // mph vs grade
        {
            let mphs: number[] = []
            let grades: number[] = []
            for (const a of activities) {
                const mph = a.streams.find(s => s.type == 'mph')
                const grade = a.streams.find(s => s.type == 'grade_pct')
                if (mph && grade) {
                    mphs = mphs.concat(mph.data)
                    grades = grades.concat(grade.data)
                }
            }
            addChart(grades, mphs, 'grade_pct', 'mph', 'scatter')
        }
    }

    function addChart(xs: number[], ys: number[], xtype: string, ytype: string,
        type?: 'line' | 'scatter'
    ) {
        type = type ?? 'line'
        if (xs.length != ys.length) {
            console.error('Mismatched x/y length')
            return
        }
        const el = document.createElement('div')
        const c = document.createElement('canvas')
        c.width = 800
        c.height = 600
        el.innerHTML = `${xtype} vs ${ytype}<br>`
        el.appendChild(c)
        el.appendChild(document.createElement('hr'))

        const ctx = c.getContext('2d')!

        const lowx = min(xs)
        const highx = max(xs)
        const lowy = min(ys)
        const highy = max(ys)

        const minx = lowx - 0.1 * (highx - lowx)
        const miny = lowy - 0.1 * (highy - lowy)
        const maxx = highx + 0.1 * (highx - lowx)
        const maxy = highy + 0.1 * (highy - lowy)

        ctx.strokeStyle = '#fff'
        ctx.fillStyle = xs.length > 200 ? 'rgba(255,255,255,0.5)' : '#fff'
        const ptSize = xs.length > 200 ? 0.5 : 5

        for (let i = 0; i < xs.length; ++i) {
            const x = (xs[i] - minx) / (maxx - minx)
            const y = (ys[i] - miny) / (maxy - miny)
            const xpx = x * c.width
            const ypx = (1 - y) * c.height
            if (type == 'line') ctx.lineTo(xpx, ypx)
            else {
                ctx.fillRect(xpx - ptSize, ypx - ptSize, 2 * ptSize, 2 * ptSize)
            }
        }

        if (type == 'line') ctx.stroke()

        // y axis labels
        ctx.fillStyle = '#5da'
        const numYLabels = 10
        for (let i = 1; i < numYLabels; ++i) {
            const val = (i / numYLabels) * (maxy - miny) + miny
            ctx.fillText(val.toFixed(2), 0, (1 - (i / numYLabels)) * c.height)
        }

        // x axis labels
        const numXLabels = 15
        for (let i = 1; i < numXLabels; ++i) {
            const val = (i / numXLabels) * (maxx - minx) + minx
            const label =
                xtype == 'time' ? durationSToHHMMSS(val) :
                    xtype == 'date' ? new Date(val).toLocaleDateString() :
                        val.toFixed(2)
            ctx.fillText(label, (i / numXLabels) * c.width, c.height)
        }

        chartsContainer.appendChild(el)
    }
}

load().then(init)