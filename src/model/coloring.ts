
import { Listenable } from "../listenable.js"
import { CompactActivity } from "./activity.js"

export enum ColorStrat {
    WHITE,
    HR,
    SPEED,
    ELEVATION,
    YEAR,
    GRAY,
}

function zone(val: number | undefined, thresholds: number[]): number {
    if (!val || isNaN(val)) return NaN
    for (let i = 0; i < thresholds.length; ++i) {
        const t = thresholds[i]
        if (val < t) return i
    }
    return 6
}

const HR_MAX = 190
const hrThresholds = [
    0.55 * HR_MAX,  // 0
    0.65 * HR_MAX,  // 1
    0.75 * HR_MAX,  // 2
    0.85 * HR_MAX,  // 3
    0.90 * HR_MAX,  // 4
    HR_MAX, // 5  (anything higher will be 6
]

const mphThresholds = [
    4,  // 0
    8,  // 1
    12, // 2
    16, // 3
    20, // 4
    24, // 5 (anything higher will be 6)
]

const eleThresholds = [
    5,  // 0
    10,  // 1
    20, // 2
    40, // 3
    65, // 4
    80, // 5 (anything higher will be 6)
]

const zoneRgbs: { [zone: number]: string } = {
    NaN: '#555',
    0: '#77b',
    1: '#9bb',
    2: '#5b5',
    3: '#ffa',
    4: '#f77',
    5: '#f33',
    6: '#ff028d'
}

const stratImpl = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    [ColorStrat.WHITE]: (_: any) => '#fff',
    [ColorStrat.HR]: (hr: number) => zoneRgbs[zone(hr, hrThresholds)],
    [ColorStrat.SPEED]: (mph: number) => zoneRgbs[zone(mph, mphThresholds)],
    [ColorStrat.ELEVATION]: (ele: number) => zoneRgbs[zone(ele, eleThresholds)],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    [ColorStrat.YEAR]: (_: number) => '#fff',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    [ColorStrat.GRAY]: (_: any) => '#373737',
}

const CURRENT_YEAR = new Date().getFullYear()

export class Colorer extends Listenable {
    private strat = ColorStrat.WHITE
    private fn = stratImpl[ColorStrat.WHITE]

    private activity: CompactActivity | undefined
    private stream: number[] | undefined

    constructor(strat: ColorStrat) {
        super()
        this.setStrat(strat)
    }

    private refreshStream() {
        const a = this.activity
        if (!a) return
        const streamNameMap = {
            [ColorStrat.HR]: 'heartrate',
            [ColorStrat.SPEED]: 'mph',
            [ColorStrat.ELEVATION]: 'elevation_meters',
            [ColorStrat.YEAR]: undefined,
            [ColorStrat.GRAY]: undefined,
            [ColorStrat.WHITE]: undefined
        }
        const streamName = streamNameMap[this.strat]
        if (!streamName) return
        const stream = a.streams.find(s => s.type == streamName)
        this.stream = stream?.data as number[]
    }

    getStrat(): ColorStrat {
        return this.strat
    }

    setStrat(strat: ColorStrat) {
        this.strat = strat
        this.fn = stratImpl[strat]
        this.refreshStream()
        this.triggerListeners()
    }

    activateActivity(a: CompactActivity) {
        this.activity = a
        this.refreshStream()
    }

    fixedColor(a: CompactActivity): string | undefined {
        switch (this.strat) {
            case ColorStrat.WHITE: return '#FFF'
            case ColorStrat.GRAY: return '#373737'
            case ColorStrat.YEAR: return new Date(a.date).getFullYear() == CURRENT_YEAR ? '#F73' : '#777'
        }

        if (!this.stream) return 'rgba(0,0,0,0)'
    }

    color(idx: number): string {
        if (!this.activity || !this.stream) throw `did not activate activity first`
        return this.fn(this.stream[idx])
    }

    coloringTableHtml(): string {
        const strat = this.strat
        const tsMap: Record<number, number[]> = {
            [ColorStrat.HR]: hrThresholds,
            [ColorStrat.SPEED]: mphThresholds,
            [ColorStrat.ELEVATION]: eleThresholds,
        }
        const ts = tsMap[strat as number]
        // WHITE and GRAY don't have thresholds
        if (!ts) return ''

        const has_unknown = (strat == ColorStrat.HR)

        let h = '<table class="coloringTable"><tr>'

        if (has_unknown) h += '<td>?</td>'

        let last = 0
        for (const t of ts) {
            const curr = Math.round(t)
            h += `<td>${last} - ${curr}</td>`
            last = curr
        }
        h += `<td>&gt; ${last}</td>`
        h += '</tr>'

        h += '<tr>'

        if (has_unknown)
            h += `<td style="background-color: ${zoneRgbs[NaN]}"></td>`

        for (let i = 0; i <= 6; ++i) {
            h += `<td style="background-color: ${zoneRgbs[i]}">&nbsp;</td>`
        }
        h += '</tr>'

        h += '</table>'
        return h
    }
}
